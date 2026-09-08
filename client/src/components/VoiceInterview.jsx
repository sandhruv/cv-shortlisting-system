import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaRobot, FaMicrophone, FaTimes, FaVolumeUp, FaCheck, FaArrowLeft, FaSpinner } from "react-icons/fa";
import api from "../services/api";

const SpeechRecognitionAPI = typeof window !== "undefined"
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;

const VAD_THRESHOLD = 0.08;

export default function VoiceInterview() {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState("loading");
  const [transcript, setTranscript] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const phaseRef = useRef("loading");
  const mountedRef = useRef(true);
  const processingRef = useRef(false);
  const speakingRef = useRef(false);
  const recogShouldBeActive = useRef(false);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const vadLoopRef = useRef(null);

  const synthRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);
  const recognitionRef = useRef(null);
  const recogActiveRef = useRef(false);

  const chatHistoryRef = useRef([]);
  const chancesLeftRef = useRef(3);

  const gold = "#d4af37";

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      analyserRef.current = analyser;
      return true;
    } catch (e) {
      setError("Microphone access denied.");
      return false;
    }
  }, []);

  const killMic = useCallback(() => {
    if (vadLoopRef.current) { cancelAnimationFrame(vadLoopRef.current); vadLoopRef.current = null; }
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") audioCtxRef.current.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    speakingRef.current = false;
  }, []);

  // VAD — interrupts AI speech
  const startVAD = useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);

    const loop = () => {
      if (!analyserRef.current || !mountedRef.current) return;
      analyserRef.current.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const rms = sum / data.length / 255;

      if (speakingRef.current && rms > VAD_THRESHOLD) {
        speakingRef.current = false;
        synthRef.current?.cancel();
        recogShouldBeActive.current = true;
        setPhase("listening");
        ensureRecogRunning();
      }

      vadLoopRef.current = requestAnimationFrame(loop);
    };
    vadLoopRef.current = requestAnimationFrame(loop);
  }, [ensureRecogRunning]);

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

  // ─── Speak text ─────────────────────────────────────
  const speak = useCallback((text) => {
    return new Promise((resolve) => {
      setPhase("speaking");
      speakingRef.current = true;
      setLastReply(text);

      recogShouldBeActive.current = false;
      if (recognitionRef.current && recogActiveRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        recogActiveRef.current = false;
      }

      if (!synthRef.current) {
        speakingRef.current = false;
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      const voices = synthRef.current.getVoices();
      const v = voices.find(v => v.name.includes("Google") && v.lang.startsWith("en"))
        || voices.find(v => v.lang.startsWith("en-US"))
        || voices.find(v => v.lang.startsWith("en"));
      if (v) utterance.voice = v;

      utterance.onend = () => { speakingRef.current = false; resolve(); };
      utterance.onerror = () => { speakingRef.current = false; resolve(); };
      synthRef.current.speak(utterance);
    });
  }, []);

  // ─── Submit interview ───────────────────────────────
  const submitInterview = useCallback(async () => {
    setPhase("submitting");
    stopRecog();
    stopVAD();
    killMic();
    synthRef.current?.cancel();

    const qaLog = [];
    for (let i = 0; i < chatHistoryRef.current.length; i++) {
      const m = chatHistoryRef.current[i];
      if (m.role === "assistant" && !m.content.includes("technical issue")) {
        const nextUser = chatHistoryRef.current.slice(i + 1).find(u => u.role === "user");
        if (nextUser) {
          qaLog.push({ question: m.content, answer: nextUser.content });
        }
      }
    }

    try {
      const formData = new FormData();
      formData.append("qaList", JSON.stringify(qaLog));
      formData.append("proctoring", JSON.stringify({ tabSwitches: 0, fillerWordsCount: 0, wordsPerMinute: 120 }));
      await api.post(`/interviews/${interviewId}/ai-submit`, formData);
      if (mountedRef.current) {
        setResult({ status: "completed", message: "Interview submitted! Your feedback has been sent to HR." });
        setPhase("completed");
      }
    } catch (err) {
      console.error("Submit error:", err);
      if (mountedRef.current) { setError("Failed to submit."); setPhase("completed"); }
    }
  }, [interviewId, stopRecog, stopVAD, killMic]);

  // ─── Send answer to AI and get next response ────────
  const sendToAI = useCallback(async (userText) => {
    if (processingRef.current) return;
    processingRef.current = true;
    stopRecog();
    stopVAD();
    setTranscript("");

    chatHistoryRef.current.push({ role: "user", content: userText });

    try {
      const res = await api.post(`/interviews/${interviewId}/ai-chat`, {
        messages: chatHistoryRef.current,
        chancesLeft: chancesLeftRef.current,
      });

      if (!mountedRef.current) return;

      const { reply, shouldFinish, chancesLeft } = res.data;
      chancesLeftRef.current = chancesLeft;
      chatHistoryRef.current.push({ role: "assistant", content: reply, _isQuestion: true });
      processingRef.current = false;

      // Speak AI reply
      await speak(reply);
      if (!mountedRef.current) return;

      if (shouldFinish) {
        await submitInterview();
        return;
      }

      // Start listening IMMEDIATELY
      setPhase("listening");
      recogShouldBeActive.current = true;
      startRecog();
    } catch (err) {
      console.error("AI chat error:", err);
      if (!mountedRef.current) return;
      processingRef.current = false;

      const fallback = "I'm having a slight technical issue. Could you please repeat that?";
      chatHistoryRef.current.push({ role: "assistant", content: fallback });
      await speak(fallback);
      if (!mountedRef.current) return;
      setPhase("listening");
      recogShouldBeActive.current = true;
      startRecog();
    }
  }, [interviewId, speak, stopRecog, stopVAD, startRecog, submitInterview]);

  // ─── Recognition setup ──────────────────────────────
  useEffect(() => {
    if (!SpeechRecognitionAPI) return;
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
        setTimeout(() => ensureRecogRunning(), 50);
      }
    };

    r.onerror = (event) => {
      recogActiveRef.current = false;
      if (event.error === "not-allowed") {
        if (mountedRef.current) { setError("Mic access denied."); setPhase("idle"); }
        return;
      }
      if (event.error === "aborted") return;
      if (recogShouldBeActive.current && !processingRef.current) {
        setTimeout(() => ensureRecogRunning(), 50);
      }
    };

    recognitionRef.current = r;
    return () => { r.abort(); recognitionRef.current = null; };
  }, [sendToAI, ensureRecogRunning]);

  // ─── Start interview ────────────────────────────────
  const startInterview = useCallback(async () => {
    setPhase("loading");
    try {
      // Start the interview on backend
      const startRes = await api.post(`/interviews/${interviewId}/ai-start`);
      if (!mountedRef.current) return;
      setJobTitle(startRes.data.jobTitle || "the position");

      const ok = await ensureMic();
      if (!ok) return;

      await new Promise(r => setTimeout(r, 600));

      // Start VAD
      startVAD();

      // Send greeting message to get AI's first response
      chatHistoryRef.current = [];
      chancesLeftRef.current = 3;

      const res = await api.post(`/interviews/${interviewId}/ai-chat`, {
        messages: [{ role: "user", content: "Start the interview now. Greet me and ask your first question." }],
        chancesLeft: 3,
      });

      if (!mountedRef.current) return;

      const { reply } = res.data;
      chatHistoryRef.current.push({ role: "assistant", content: reply, _isQuestion: true });

      // Speak greeting + first question
      await speak(reply);
      if (!mountedRef.current) return;

      // Start listening
      setPhase("listening");
      recogShouldBeActive.current = true;
      startRecog();
    } catch (err) {
      console.error("Start interview error:", err);
      if (mountedRef.current) setError(err.response?.data?.message || "Failed to start interview.");
    }
  }, [interviewId, ensureMic, startVAD, speak, startRecog]);

  // ─── Init ───────────────────────────────────────────
  useEffect(() => {
    startInterview();
    return () => {
      synthRef.current?.cancel();
      recogShouldBeActive.current = false;
      stopRecog();
      stopVAD();
      killMic();
    };
  }, []);

  const handleClose = () => {
    synthRef.current?.cancel();
    recogShouldBeActive.current = false;
    stopRecog();
    stopVAD();
    killMic();
    navigate("/student");
  };

  const isListening = phase === "listening";
  const isSpeaking = phase === "speaking";
  const isThinking = phase === "thinking" || phase === "loading";
  const isSubmitting = phase === "submitting";
  const isCompleted = phase === "completed";

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between"
      style={{ background: "radial-gradient(ellipse at center, #111827 0%, #030712 100%)" }}>

      <button onClick={handleClose}
        className="absolute top-5 left-5 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>
        <FaArrowLeft /> Back
      </button>

      <button onClick={handleClose}
        className="absolute top-5 right-5 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
        <FaTimes className="text-white/70" />
      </button>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center mt-16 px-4">
        <div className="flex items-center gap-2 justify-center mb-2">
          <FaRobot style={{ color: gold }} className="text-lg" />
          <span style={{ color: gold }} className="text-sm font-bold tracking-widest uppercase">AI Voice Interview</span>
        </div>
        <p className="text-sm text-slate-400">{jobTitle}</p>
        <p className="text-sm text-slate-400 mt-2">
          {isThinking && "Connecting..."}
          {isSpeaking && "Speaking... (interrupt me anytime)"}
          {isListening && "Listening... Speak now"}
          {isSubmitting && "Submitting..."}
          {isCompleted && "Interview complete!"}
        </p>
      </motion.div>

      <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
        {(isListening || isSpeaking) && [0, 1, 2].map(i => (
          <motion.div key={i} className="absolute rounded-full"
            style={{ border: `1.5px solid ${gold}`, width: 280 + i * 50, height: 280 + i * 50 }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }} />
        ))}

        {(isListening || isSpeaking) && (
          <motion.div className="absolute rounded-full"
            style={{ width: 260, height: 260, background: `radial-gradient(circle, ${gold}22 0%, transparent 70%)` }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
        )}

        <motion.div className="relative rounded-full flex items-center justify-center"
          style={{
            width: 180, height: 180,
            background: isThinking ? `linear-gradient(135deg, ${gold}22, ${gold}11)`
              : isListening ? `linear-gradient(135deg, ${gold}44, ${gold}22)`
              : isSpeaking ? `linear-gradient(135deg, ${gold}55, ${gold}33)`
              : isCompleted ? `linear-gradient(135deg, #22c55e33, #22c55e11)`
              : `linear-gradient(135deg, ${gold}15, ${gold}08)`,
            border: `2px solid ${isCompleted ? "#22c55e66" : gold}${isListening ? "66" : isSpeaking ? "88" : "33"}`,
            boxShadow: isListening || isSpeaking ? `0 0 60px ${gold}33, inset 0 0 40px ${gold}11` : `0 0 20px ${gold}11`,
          }}
          animate={isListening ? { scale: [1, 1.04, 1] } : isSpeaking ? { scale: [1, 1.06, 1] } : {}}
          transition={isListening ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : isSpeaking ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : {}}>
          {isThinking && <FaSpinner className="text-4xl animate-spin" style={{ color: gold }} />}
          {isListening && <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1, repeat: Infinity }}><FaMicrophone style={{ color: gold }} className="text-5xl" /></motion.div>}
          {isSpeaking && <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.8, repeat: Infinity }}><FaVolumeUp style={{ color: gold }} className="text-5xl" /></motion.div>}
          {isSubmitting && <FaSpinner className="text-4xl animate-spin" style={{ color: gold }} />}
          {isCompleted && <FaCheck className="text-5xl" style={{ color: "#22c55e" }} />}
        </motion.div>

        {isListening && (
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
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1" }}>
              <span className="opacity-50 text-xs block mb-1">You said</span>
              {transcript}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {lastReply && !transcript && (
            <motion.div key="r" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 px-5 py-3 rounded-2xl text-sm"
              style={{ background: `${gold}11`, border: `1px solid ${gold}33`, color: "#f1f5f9" }}>
              <span className="text-xs block mb-1" style={{ color: gold, opacity: 0.7 }}>AI Interviewer</span>
              {lastReply}
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="text-xs text-rose-400 mb-4">{error}</p>}

        {isCompleted && result && (
          <div className="mb-4 px-5 py-4 rounded-2xl text-sm"
            style={{ background: "#22c55e11", border: "1px solid #22c55e33", color: "#f1f5f9" }}>
            <FaCheck className="inline mr-2" style={{ color: "#22c55e" }} />
            {result.message}
          </div>
        )}

        {isCompleted && (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleClose}
            className="mx-auto px-6 py-3 rounded-2xl text-sm font-bold text-white flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #d4af37, #996515)" }}>
            <FaArrowLeft /> Back to Dashboard
          </motion.button>
        )}
      </div>
    </div>
  );
}
