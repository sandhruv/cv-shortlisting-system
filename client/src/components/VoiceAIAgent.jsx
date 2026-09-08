import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaMicrophone, FaTimes, FaRobot, FaVolumeUp, FaMicrophoneSlash } from "react-icons/fa";
import api from "../services/api";

const SpeechRecognitionAPI = typeof window !== "undefined"
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;

const MAX_CHAT_HISTORY = 20;
const API_TIMEOUT_MS = 12000;
const MAX_RECOG_RESTARTS = 5;
const RECOG_BACKOFF_BASE_MS = 200;
const SPEECH_TIMEOUT_MS = 8000;
const VAD_MIN_THRESHOLD = 0.04;
const VAD_MAX_THRESHOLD = 0.25;
const VAD_AMBIENT_MULTIPLIER = 2.2;

function detectIOSSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isWebkit = /WebKit/.test(ua);
  const isNotChrome = !/CriOS|FxiOS/.test(ua);
  return isIOS && isWebkit && isNotChrome;
}

function supportsSpeechRecognition() {
  return !!SpeechRecognitionAPI;
}

export default function VoiceAIAgent({ open, onClose, theme = "dark" }) {
  const [phase, setPhase] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const phaseRef = useRef("idle");
  const mountedRef = useRef(true);
  const processingRef = useRef(false);
  const speakingRef = useRef(false);
  const recogShouldBeActive = useRef(false);
  const lastSentTranscript = useRef("");
  const lastSentTime = useRef(0);
  const recogRestartCount = useRef(0);
  const recogBackoffMs = useRef(RECOG_BACKOFF_BASE_MS);
  const ambientNoiseFloor = useRef(0.03);
  const adaptiveThreshold = useRef(0.08);
  const calibrationDone = useRef(false);
  const calibrationSamples = useRef([]);
  const wakeLockRef = useRef(null);
  const speechTimeoutRef = useRef(null);
  const apiTimeoutRef = useRef(null);
  const sendLockRef = useRef(false);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const vadLoopRef = useRef(null);

  const synthRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);
  const recognitionRef = useRef(null);
  const recogActiveRef = useRef(false);

  const chatHistoryRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const gold = theme === "dark" ? "#d4af37" : "#8B6914";
  const usePushToTalk = !supportsSpeechRecognition() || detectIOSSafari();

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ─── Wake Lock ──────────────────────────────────────
  const requestWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        wakeLockRef.current.addEventListener("release", () => { wakeLockRef.current = null; });
      }
    } catch (_) {}
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch (_) {}
  }, []);

  // ─── Visibility Change ─────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handleVisibility = () => {
      if (document.hidden) {
        if (speakingRef.current && synthRef.current) {
          synthRef.current.pause();
        }
        recogShouldBeActive.current = false;
        stopRecog();
        stopVAD();
      } else {
        if (phaseRef.current === "listening" && !processingRef.current) {
          recogShouldBeActive.current = true;
          startRecog();
        }
        if (phaseRef.current === "speaking" && synthRef.current) {
          synthRef.current.resume();
        }
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [open, requestWakeLock]);

  // ─── Adaptive VAD Threshold ────────────────────────
  const calibrateAmbient = useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    const rms = sum / data.length / 255;
    calibrationSamples.current.push(rms);
    if (calibrationSamples.current.length >= 8) {
      const avg = calibrationSamples.current.reduce((a, b) => a + b, 0) / calibrationSamples.current.length;
      ambientNoiseFloor.current = avg;
      adaptiveThreshold.current = Math.max(VAD_MIN_THRESHOLD, Math.min(VAD_MAX_THRESHOLD, avg * VAD_AMBIENT_MULTIPLIER));
      calibrationDone.current = true;
      calibrationSamples.current = [];
    }
  }, []);

  // ─── Always keep recognition running ────────────────
  const ensureRecogRunning = useCallback(() => {
    if (!recogShouldBeActive.current) return;
    if (!recognitionRef.current) return;
    if (recogActiveRef.current) return;
    if (processingRef.current) return;
    try {
      recognitionRef.current.start();
      recogActiveRef.current = true;
    } catch (e) {}
  }, []);

  // ─── Mic / VAD ──────────────────────────────────────
  const ensureMic = useCallback(async () => {
    if (micStreamRef.current) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      micStreamRef.current = stream;
      let ctx;
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (_) {
        ctx = new window.AudioContext();
      }
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      analyserRef.current = analyser;
      calibrationDone.current = false;
      calibrationSamples.current = [];
      return true;
    } catch (e) {
      setError("Microphone access denied. Please allow microphone access in your browser settings.");
      return false;
    }
  }, []);

  const killMic = useCallback(() => {
    if (vadLoopRef.current) { cancelAnimationFrame(vadLoopRef.current); vadLoopRef.current = null; }
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    speakingRef.current = false;
    calibrationDone.current = false;
    calibrationSamples.current = [];
  }, []);

  const startVAD = useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);

    const loop = () => {
      if (!analyserRef.current || !mountedRef.current) return;
      analyserRef.current.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const rms = sum / data.length / 255;

      if (!calibrationDone.current) {
        calibrateAmbient();
      }

      if (speakingRef.current && rms > adaptiveThreshold.current) {
        speakingRef.current = false;
        synthRef.current?.cancel();
        recogShouldBeActive.current = true;
        setPhase("listening");
        ensureRecogRunning();
      }

      vadLoopRef.current = requestAnimationFrame(loop);
    };
    vadLoopRef.current = requestAnimationFrame(loop);
  }, [ensureRecogRunning, calibrateAmbient]);

  const stopVAD = useCallback(() => {
    if (vadLoopRef.current) { cancelAnimationFrame(vadLoopRef.current); vadLoopRef.current = null; }
  }, []);

  // ─── Recognition ────────────────────────────────────
  const startRecog = useCallback(() => {
    recogShouldBeActive.current = true;
    ensureRecogRunning();
  }, [ensureRecogRunning]);

  const stopRecog = useCallback(() => {
    recogShouldBeActive.current = false;
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch (e) {}
    recogActiveRef.current = false;
  }, []);

  // ─── Push-to-Talk Recording ─────────────────────────
  const startRecording = useCallback(async () => {
    if (!micStreamRef.current) {
      const ok = await ensureMic();
      if (!ok) return;
    }
    audioChunksRef.current = [];
    try {
      const mr = new MediaRecorder(micStreamRef.current, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    } catch (e) {
      setError("Could not start recording.");
    }
  }, [ensureMic]);

  const stopRecording = useCallback(async () => {
    return new Promise((resolve) => {
      const mr = mediaRecorderRef.current;
      if (!mr || mr.state === "inactive") {
        setIsRecording(false);
        resolve(null);
        return;
      }
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType || "audio/webm" });
        audioChunksRef.current = [];
        setIsRecording(false);
        resolve(blob);
      };
      mr.stop();
      mediaRecorderRef.current = null;
    });
  }, []);

  const sendVoiceToAI = useCallback(async (audioBlob) => {
    if (sendLockRef.current) return;
    sendLockRef.current = true;
    processingRef.current = true;
    setPhase("thinking");
    setTranscript("");

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, `recording-${Date.now()}.webm`);
      formData.append("messages", JSON.stringify(chatHistoryRef.current.slice(-MAX_CHAT_HISTORY)));

      const res = await api.post("/ai-agent/voice-chat", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: API_TIMEOUT_MS,
      });

      if (!mountedRef.current) return;

      const { reply, transcript: spokenText } = res.data;
      if (spokenText) {
        setTranscript(spokenText);
        chatHistoryRef.current.push({ role: "user", content: spokenText });
      }
      chatHistoryRef.current.push({ role: "assistant", content: reply });
      processingRef.current = false;
      sendLockRef.current = false;

      await speakReply(reply);
    } catch (err) {
      if (!mountedRef.current) return;
      processingRef.current = false;
      sendLockRef.current = false;
      const errMsg = "Sorry, I'm having trouble connecting. Please try again.";
      setLastReply(errMsg);
      await speakReply(errMsg);
    }
  }, []);

  // ─── Send to AI (text mode) ─────────────────────────
  const sendToAI = useCallback(async (text) => {
    const now = Date.now();
    if (sendLockRef.current) return;
    if (text === lastSentTranscript.current && now - lastSentTime.current < 3000) return;
    lastSentTranscript.current = text;
    lastSentTime.current = now;
    sendLockRef.current = true;
    processingRef.current = true;

    synthRef.current?.cancel();
    speakingRef.current = false;
    stopRecog();
    stopVAD();
    setPhase("thinking");
    setTranscript("");
    chatHistoryRef.current.push({ role: "user", content: text });

    const trimmedHistory = chatHistoryRef.current.slice(-MAX_CHAT_HISTORY);

    try {
      const controller = new AbortController();
      apiTimeoutRef.current = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

      const res = await api.post("/ai-agent/chat", { messages: trimmedHistory }, {
        signal: controller.signal,
      });
      clearTimeout(apiTimeoutRef.current);

      if (!mountedRef.current) return;
      const reply = res.data.reply;
      chatHistoryRef.current.push({ role: "assistant", content: reply });
      processingRef.current = false;
      sendLockRef.current = false;

      await speakReply(reply);
    } catch (err) {
      clearTimeout(apiTimeoutRef.current);
      if (!mountedRef.current) return;
      processingRef.current = false;
      sendLockRef.current = false;

      if (err.name === "CanceledError" || err.code === "ERR_CANCELED" || err.message?.includes("timeout")) {
        const errMsg = "I'm taking too long to respond. Please try again.";
        setLastReply(errMsg);
        await speakReply(errMsg);
      } else {
        const errMsg = "Sorry, I'm having trouble connecting. Please try again.";
        setLastReply(errMsg);
        await speakReply(errMsg);
      }
    }
  }, [stopRecog, stopVAD]);

  // ─── Speak Reply (with timeout + error recovery) ────
  const speakReply = useCallback(async (reply) => {
    if (!mountedRef.current) return;
    setPhase("speaking");
    speakingRef.current = true;
    setLastReply(reply);
    setTranscript("");
    recogShouldBeActive.current = false;
    startVAD();

    if (!synthRef.current) {
      speakingRef.current = false;
      transitionToListening();
      return;
    }

    return new Promise((resolve) => {
      let resolved = false;
      const doResolve = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(speechTimeoutRef.current);
        speakingRef.current = false;
        resolve();
      };

      speechTimeoutRef.current = setTimeout(() => {
        synthRef.current?.cancel();
        doResolve();
      }, SPEECH_TIMEOUT_MS);

      const utterance = new SpeechSynthesisUtterance(reply);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = synthRef.current.getVoices();
      const v = voices.find(v => v.name.includes("Google") && v.lang.startsWith("en"))
        || voices.find(v => v.lang.startsWith("en-US"))
        || voices.find(v => v.lang.startsWith("en"))
        || voices[0];
      if (v) utterance.voice = v;

      utterance.onend = doResolve;
      utterance.onerror = doResolve;
      synthRef.current.speak(utterance);
    });
  }, [startVAD]);

  const transitionToListening = useCallback(() => {
    if (!mountedRef.current) return;
    setPhase("listening");
    recogShouldBeActive.current = true;
    if (!usePushToTalk) {
      recogRestartCount.current = 0;
      recogBackoffMs.current = RECOG_BACKOFF_BASE_MS;
      startRecog();
    }
  }, [startRecog, usePushToTalk]);

  // ─── Recognition setup ──────────────────────────────
  useEffect(() => {
    if (usePushToTalk || !SpeechRecognitionAPI) return;
    const r = new SpeechRecognitionAPI();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.maxAlternatives = 1;

    r.onresult = (event) => {
      let final = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) final += res[0].transcript;
        else interim += res[0].transcript;
      }
      if (interim) setTranscript(interim);
      if (final.trim()) {
        setTranscript(final.trim());
        sendToAI(final.trim());
      }
    };

    r.onend = () => {
      recogActiveRef.current = false;
      if (recogShouldBeActive.current && !processingRef.current) {
        if (recogRestartCount.current >= MAX_RECOG_RESTARTS) {
          recogRestartCount.current = 0;
          recogBackoffMs.current = RECOG_BACKOFF_BASE_MS;
          setError("Voice connection unstable. Tap mic to retry.");
          return;
        }
        recogRestartCount.current++;
        const delay = Math.min(recogBackoffMs.current, 2000);
        recogBackoffMs.current = Math.min(recogBackoffMs.current * 1.5, 2000);
        setTimeout(() => ensureRecogRunning(), delay);
      }
    };

    r.onerror = (event) => {
      recogActiveRef.current = false;
      if (event.error === "not-allowed") {
        if (mountedRef.current) {
          setError("Mic access denied. Please allow microphone access.");
          setPhase("idle");
        }
        return;
      }
      if (event.error === "aborted") return;
      if (event.error === "network") {
        if (mountedRef.current) setError("Network error. Check your connection.");
        return;
      }
      if (recogShouldBeActive.current && !processingRef.current) {
        const delay = Math.min(recogBackoffMs.current, 2000);
        recogRestartCount.current++;
        setTimeout(() => ensureRecogRunning(), delay);
      }
    };

    recognitionRef.current = r;
    return () => { r.abort(); recognitionRef.current = null; };
  }, [sendToAI, ensureRecogRunning, usePushToTalk]);

  // ─── Open / close ───────────────────────────────────
  useEffect(() => {
    if (!open) return;

    setPhase("connecting");
    processingRef.current = false;
    speakingRef.current = false;
    recogShouldBeActive.current = false;
    chatHistoryRef.current = [];
    setTranscript("");
    setLastReply("");
    setError("");
    setIsRecording(false);
    recogRestartCount.current = 0;
    recogBackoffMs.current = RECOG_BACKOFF_BASE_MS;
    lastSentTranscript.current = "";
    lastSentTime.current = 0;
    sendLockRef.current = false;
    synthRef.current?.cancel();

    requestWakeLock();

    let alive = true;
    ensureMic().then((ok) => {
      if (!ok || !alive || !mountedRef.current) return;
      // Always start idle — require a fresh tap to begin listening.
      // Mobile browsers need a *recent* user gesture to unlock SpeechRecognition,
      // and the gesture that opened the modal is already consumed by ensureMic().
      setPhase("idle");
    });

    return () => {
      alive = false;
      recogShouldBeActive.current = false;
      processingRef.current = false;
      speakingRef.current = false;
      sendLockRef.current = false;
      synthRef.current?.cancel();
      clearTimeout(speechTimeoutRef.current);
      clearTimeout(apiTimeoutRef.current);
      stopRecog();
      stopVAD();
      killMic();
      releaseWakeLock();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
    };
  }, [open, ensureMic, killMic, stopRecog, stopVAD, startRecog, requestWakeLock, releaseWakeLock, usePushToTalk]);

  const handleClose = () => {
    processingRef.current = false;
    speakingRef.current = false;
    recogShouldBeActive.current = false;
    sendLockRef.current = false;
    synthRef.current?.cancel();
    clearTimeout(speechTimeoutRef.current);
    clearTimeout(apiTimeoutRef.current);
    stopRecog();
    stopVAD();
    killMic();
    releaseWakeLock();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
    setPhase("idle");
    setTranscript("");
    setLastReply("");
    setError("");
    onClose();
  };

  const handleToggleMic = async () => {
    const p = phaseRef.current;
    if (usePushToTalk) {
      if (isRecording) {
        stopRecording().then(blob => {
          if (blob && blob.size > 0) sendVoiceToAI(blob);
        });
      } else if (p === "idle" || p === "listening") {
        // Ensure mic + AudioContext are ready on this fresh gesture
        if (!micStreamRef.current) {
          const ok = await ensureMic();
          if (!ok) return;
        }
        if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
          await audioCtxRef.current.resume();
        }
        setPhase("listening");
        startRecording();
      }
      return;
    }
    if (p === "listening") {
      stopRecog();
      setPhase("idle");
    } else if (p === "idle") {
      // Fresh tap: ensure mic + AudioContext are unlocked
      if (!micStreamRef.current) {
        const ok = await ensureMic();
        if (!ok) return;
      }
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      recogRestartCount.current = 0;
      recogBackoffMs.current = RECOG_BACKOFF_BASE_MS;
      setPhase("listening");
      startRecog();
    } else if (p === "speaking") {
      synthRef.current?.cancel();
      speakingRef.current = false;
      stopVAD();
      setPhase("listening");
      recogShouldBeActive.current = true;
      recogRestartCount.current = 0;
      setTimeout(() => startRecog(), 50);
    }
  };

  if (!open) return null;

  const isListening = phase === "listening";
  const isSpeaking = phase === "speaking";
  const isThinking = phase === "thinking";
  const isConnecting = phase === "connecting";
  const isPushToTalkMode = usePushToTalk;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between"
      style={{ background: theme === "dark"
        ? "radial-gradient(ellipse at center, #111827 0%, #030712 100%)"
        : "radial-gradient(ellipse at center, #faf6ee 0%, #f0e8d8 100%)"
      }}>

      <button onClick={handleClose}
        className="absolute top-5 right-5 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
        <FaTimes className={theme === "dark" ? "text-white/70" : "text-black/50"} />
      </button>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center mt-16">
        <div className="flex items-center gap-2 justify-center mb-2">
          <FaRobot style={{ color: gold }} className="text-lg" />
          <span style={{ color: gold }} className="text-sm font-bold tracking-widest uppercase">Vettora AI</span>
        </div>
        <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-[#6b5a3a]"}`}>
          {isConnecting && "Connecting..."}
          {isPushToTalkMode && !isConnecting && !isThinking && (
            isRecording ? "Recording... Tap to stop" : "Tap the mic and speak"
          )}
          {!isPushToTalkMode && isListening && "I'm listening... Speak now"}
          {isThinking && "Thinking..."}
          {isSpeaking && "Speaking... (tap mic to interrupt)"}
          {phase === "idle" && !isPushToTalkMode && !error && "Tap the mic to start"}
          {phase === "idle" && isPushToTalkMode && !error && "Tap and hold to speak"}
        </p>
        {isPushToTalkMode && (
          <p className={`text-xs mt-2 ${theme === "dark" ? "text-slate-500" : "text-[#a09070]"}`}>
            Optimized for your device
          </p>
        )}
      </motion.div>

      <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
        {(isListening || isSpeaking || isRecording) && [0, 1, 2].map(i => (
          <motion.div key={i} className="absolute rounded-full"
            style={{ border: `1.5px solid ${gold}`, width: 280 + i * 50, height: 280 + i * 50 }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }} />
        ))}

        {(isListening || isSpeaking || isRecording) && (
          <motion.div className="absolute rounded-full"
            style={{ width: 260, height: 260, background: `radial-gradient(circle, ${gold}22 0%, transparent 70%)` }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
        )}

        <motion.div className="relative rounded-full flex items-center justify-center cursor-pointer"
          style={{
            width: 180, height: 180,
            background: isConnecting ? `linear-gradient(135deg, ${gold}33, ${gold}11)`
              : isListening ? `linear-gradient(135deg, ${gold}44, ${gold}22)`
              : isThinking ? `linear-gradient(135deg, ${gold}22, ${gold}11)`
              : isSpeaking ? `linear-gradient(135deg, ${gold}55, ${gold}33)`
              : isRecording ? `linear-gradient(135deg, ${gold}66, ${gold}44)`
              : `linear-gradient(135deg, ${gold}15, ${gold}08)`,
            border: `2px solid ${gold}${isListening || isRecording ? "66" : isSpeaking ? "88" : "33"}`,
            boxShadow: isListening || isSpeaking || isRecording ? `0 0 60px ${gold}33, inset 0 0 40px ${gold}11` : `0 0 20px ${gold}11`,
          }}
          animate={isListening || isRecording ? { scale: [1, 1.04, 1] } : isSpeaking ? { scale: [1, 1.06, 1] } : {}}
          transition={isListening || isRecording ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : isSpeaking ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : {}}
          onClick={handleToggleMic}>
          {isConnecting && <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}><FaRobot style={{ color: gold }} className="text-4xl" /></motion.div>}
          {(isListening || isRecording) && <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1, repeat: Infinity }}>{isRecording ? <FaMicrophoneSlash style={{ color: gold }} className="text-5xl" /> : <FaMicrophone style={{ color: gold }} className="text-5xl" />}</motion.div>}
          {isThinking && <div className="flex gap-2">{[0, 1, 2].map(i => (<motion.span key={i} className="block w-3 h-3 rounded-full" style={{ background: gold }} animate={{ y: [0, -14, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />))}</div>}
          {isSpeaking && <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.8, repeat: Infinity }}><FaVolumeUp style={{ color: gold }} className="text-5xl" /></motion.div>}
          {phase === "idle" && !isRecording && !error && <FaMicrophone style={{ color: gold, opacity: 0.5 }} className="text-4xl" />}
        </motion.div>

        {(isListening || isRecording) && (
          <div className="absolute bottom-10 flex items-end gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <motion.span key={i} className="block rounded-full" style={{ width: 3, background: gold }}
                animate={{ height: [6, 24 + Math.random() * 16, 6] }}
                transition={{ duration: 0.6 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }} />
            ))}
          </div>
        )}
      </div>

      <div className="w-full max-w-md px-6 pb-12 text-center">
        <AnimatePresence mode="wait">
          {transcript && (
            <motion.div key="t" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 px-5 py-3 rounded-2xl text-sm"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: theme === "dark" ? "#cbd5e1" : "#4a3a20" }}>
              <span className="opacity-50 text-xs block mb-1">{isPushToTalkMode ? "You said" : "You said"}</span>
              {transcript}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {lastReply && !transcript && (
            <motion.div key="r" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 px-5 py-3 rounded-2xl text-sm"
              style={{ background: `${gold}11`, border: `1px solid ${gold}33`, color: theme === "dark" ? "#f1f5f9" : "#1a1510" }}>
              <span className="text-xs block mb-1" style={{ color: gold, opacity: 0.7 }}>Vettora AI</span>
              {lastReply}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-4 px-4 py-3 rounded-2xl text-xs flex items-center gap-2"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-auto opacity-60 hover:opacity-100">✕</button>
          </motion.div>
        )}

        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleClose}
          className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-white text-xl shadow-lg"
          style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)", boxShadow: "0 0 30px rgba(220,38,38,0.35)" }}>
          <FaTimes />
        </motion.button>
        <p className={`text-[10px] mt-3 ${theme === "dark" ? "text-slate-500" : "text-[#a09070]"}`}>End call</p>
      </div>
    </div>
  );
}
