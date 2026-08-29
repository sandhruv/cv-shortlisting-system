import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaRobot,
  FaMicrophone,
  FaVideo,
  FaVideoSlash,
  FaMicrophoneSlash,
  FaCheck,
  FaArrowRight,
  FaSpinner,
  FaExclamationTriangle,
  FaVolumeUp,
  FaArrowLeft,
  FaUserTie,
  FaEdit
} from "react-icons/fa";
import api from "../services/api";

const theme = {
  bg: "#0a0a0c",
  bgCard: "#111218",
  bgSecondary: "#181a24",
  text: "#eef0f6",
  textSecondary: "#8a8ea4",
  gold: "#d4a843",
  border: "#222536",
  accent: "#2c3046",
};

const HUMAN_TRANSITIONS = [
  "Thank you for sharing that! That gives great context. Let's move to our next question.",
  "Great explanation! It's clear you have hands-on experience with this. Moving on to the next topic.",
  "Understood! That was a solid breakdown. Now, let's explore another area from your background.",
  "Excellent insights! Let's dive into the next question.",
  "Thanks for that thorough answer! Here is our next question.",
];

export default function AiInterviewRoom() {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  // Phases: "ready" | "interviewing" | "processing" | "completed" | "error"
  const [phase, setPhase] = useState("ready");
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [interviewData, setInterviewData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // Conversational States
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [qaAnswers, setQaAnswers] = useState([]);

  // Media States
  const [hasCamera, setHasCamera] = useState(true);
  const [hasMic, setHasMic] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);

  // Proctoring & Speech Telemetry
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showCheatWarning, setShowCheatWarning] = useState(false);
  const tabSwitchesRef = useRef(0);
  const totalSpokenWordsRef = useRef(0);
  const fillerWordsCountRef = useRef(0);
  const interviewStartTimeRef = useRef(null);

  // Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const recognitionRef = useRef(null);

  // Tab switch listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && phase === "interviewing") {
        tabSwitchesRef.current += 1;
        setTabSwitches(tabSwitchesRef.current);
        setShowCheatWarning(true);
        setTimeout(() => setShowCheatWarning(false), 4000);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [phase]);

  // Initialize
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        setLoadingData(true);
        const res = await api.post(`/interviews/${interviewId}/ai-start`);
        if (!mounted) return;

        setInterviewData(res.data);
        const qList = res.data.questions && res.data.questions.length > 0
          ? res.data.questions
          : [
              "Could you please introduce yourself and walk us through your most significant technical project?",
              "What technical challenges did you encounter in your recent projects, and how did you resolve them?",
              "How do your skills and background align with the requirements for this role?",
              "Describe a situation where you had to quickly learn a new technology or solve a critical bug under pressure.",
              "Where do you see your technical growth in the next 2-3 years, and what makes you a strong fit for our team?"
            ];
        setQuestions(qList);

        // Get Camera & Mic
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
            audio: true,
          });
          if (!mounted) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setupAudioAnalyser(stream);
        } catch (err) {
          console.warn("Camera/Mic access warning:", err);
          setErrorMessage("Please grant camera and microphone access to proceed.");
        }
      } catch (err) {
        console.error("Failed to load interview:", err);
        setErrorMessage(err.response?.data?.message || "Failed to load AI interview session.");
        setPhase("error");
      } finally {
        if (mounted) setLoadingData(false);
      }
    }

    init();

    return () => {
      mounted = false;
      stopMediaTracks();
      stopSpeechRecognition();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      window.speechSynthesis?.cancel();
    };
  }, [interviewId]);

  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [phase]);

  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const setupAudioAnalyser = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (e) {
      console.warn("Audio analyser setup error:", e);
    }
  };

  // Continuous Speech Recognition (Transcribes whatever the student speaks in real time)
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN"; // Supports English, Indian accents, Hindi/Hinglish

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + " ";
        }
        if (transcript.trim()) {
          setCurrentAnswer(transcript.trim());
        }
      };

      recognition.onerror = (e) => {
        if (e.error !== "no-speech") console.warn("Speech recognition notice:", e.error);
      };

      recognition.onend = () => {
        if (recognitionRef.current && phase === "interviewing" && !isSpeaking) {
          try { recognition.start(); } catch (e) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("Speech recognition error:", e);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      try { rec.stop(); } catch (e) {}
    }
  };

  // ============================================================
  // 🎙️ REAL NEURAL TTS — Microsoft Edge Neural Voices (via backend)
  // Jenny / Guy Neural — no API key needed, completely free & human
  // Falls back to browser speechSynthesis if backend TTS fails
  // ============================================================
  const currentAudioRef = useRef(null);

  const speakVoice = async (text) => {
    setIsSpeaking(true);
    setIsListening(false);
    stopSpeechRecognition();

    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    window.speechSynthesis?.cancel();

    const success = await speakViaNeuralTTS(text);
    if (!success) {
      // Fallback to browser TTS if API fails
      await speakViaBrowserTTS(text);
    }

    setIsSpeaking(false);
    setIsListening(true);
    startSpeechRecognition();
  };

  // Primary: Real neural TTS via backend (Microsoft Edge Jenny Neural)
  const speakViaNeuralTTS = (text) => {
    return new Promise((resolve) => {
      try {
        const token = localStorage.getItem("token");
        const baseURL = window.location.hostname === "localhost"
          ? "http://localhost:5000/api"
          : `${window.location.protocol}//${window.location.hostname}/api`;

        fetch(`${baseURL}/interviews/tts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ text: text.trim(), voice: "en-US-JennyNeural" }),
        })
          .then(async (res) => {
            if (!res.ok || !res.body) {
              return resolve(false);
            }

            const reader = res.body.getReader();
            const chunks = [];

            const read = async () => {
              const { done, value } = await reader.read();
              if (done) {
                // All chunks received — play the full audio
                const blob = new Blob(chunks, { type: "audio/mpeg" });
                const audioUrl = URL.createObjectURL(blob);
                const audio = new Audio(audioUrl);
                currentAudioRef.current = audio;

                audio.onended = () => {
                  URL.revokeObjectURL(audioUrl);
                  currentAudioRef.current = null;
                  resolve(true);
                };

                audio.onerror = () => {
                  URL.revokeObjectURL(audioUrl);
                  currentAudioRef.current = null;
                  resolve(false);
                };

                audio.play().catch(() => resolve(false));
                return;
              }
              chunks.push(value);
              read();
            };

            read();
          })
          .catch(() => resolve(false));
      } catch (e) {
        resolve(false);
      }
    });
  };

  // Fallback: Browser speechSynthesis
  const speakViaBrowserTTS = (text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) return resolve();
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.94;
      utterance.pitch = 1.04;

      const voices = window.speechSynthesis.getVoices();
      const naturalVoice =
        voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Jenny") || v.name.includes("Samantha"))) ||
        voices.find((v) => v.lang.startsWith("en"));
      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  };

  // Start interview session
  const handleStartInterview = async () => {
    if (!streamRef.current) {
      alert("Camera and Microphone access are required to begin.");
      return;
    }

    setPhase("interviewing");
    setCurrentQIndex(0);
    setCurrentAnswer("");
    setQaAnswers([]);

    // Start recorder
    interviewStartTimeRef.current = Date.now();
    try {
      const audioStream = new MediaStream(streamRef.current.getAudioTracks());
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(audioStream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.error("MediaRecorder start error:", err);
    }

    // Warm human welcome
    const welcome = `Hello ${interviewData?.candidateName || "Candidate"}! Welcome to your technical interview for the ${interviewData?.jobTitle || "open role"}. I've prepared questions based on your resume and projects. Let's start with question number 1. ${questions[0] || "Could you introduce yourself?"}`;
    await speakVoice(welcome);
  };

  // Next Question / Finish with conversational reaction
  const handleNextQuestion = async () => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }

    // Save answer
    const currentQText = questions[currentQIndex];
    const answerText = currentAnswer.trim() || "Candidate provided verbal response during interview.";
    
    // Telemetry analysis
    const fillers = (answerText.match(/\b(um|uh|like|basically|actually|you know|sort of|kind of|literally)\b/gi) || []).length;
    fillerWordsCountRef.current += fillers;
    totalSpokenWordsRef.current += answerText.split(/\s+/).filter(Boolean).length;

    const updatedAnswers = [
      ...qaAnswers,
      {
        question: currentQText,
        answer: answerText,
      }
    ];
    setQaAnswers(updatedAnswers);
    setCurrentAnswer("");

    const nextIndex = currentQIndex + 1;

    if (nextIndex < questions.length) {
      setCurrentQIndex(nextIndex);

      // Conversational human transition
      const transition = HUMAN_TRANSITIONS[currentQIndex % HUMAN_TRANSITIONS.length];
      const nextSpeech = `${transition} Question ${nextIndex + 1}: ${questions[nextIndex]}`;
      await speakVoice(nextSpeech);
    } else {
      // Warm closing remark
      const closing = `Thank you so much, ${interviewData?.candidateName || "Candidate"}! You did a wonderful job walking through your projects and technical background. We have recorded your responses, and our hiring team will review your detailed assessment report. Have a great day!`;
      await speakVoice(closing);
      await finishInterview(updatedAnswers);
    }
  };

  // Submit interview
  const finishInterview = async (finalQaList = null) => {
    setPhase("processing");
    setIsListening(false);
    setIsSpeaking(false);
    stopSpeechRecognition();
    window.speechSynthesis?.cancel();

    const answersToSubmit = finalQaList || (qaAnswers.length > 0 ? qaAnswers : questions.map(q => ({
      question: q,
      answer: "Candidate completed verbal response."
    })));

    let finalAudioBlob = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      await new Promise((resolve) => {
        mediaRecorderRef.current.onstop = () => {
          finalAudioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          resolve();
        };
        mediaRecorderRef.current.stop();
      });
    } else if (audioChunksRef.current.length > 0) {
      finalAudioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    }

    stopMediaTracks();

    try {
      const formData = new FormData();
      if (finalAudioBlob) {
        formData.append("audio", finalAudioBlob, "ai_interview.webm");
      } else {
        const emptyBlob = new Blob(["silent"], { type: "audio/webm" });
        formData.append("audio", emptyBlob, "ai_interview.webm");
      }

      formData.append("qaList", JSON.stringify(answersToSubmit));

      // Calculate speech telemetry
      const durationMin = Math.max(0.5, (Date.now() - (interviewStartTimeRef.current || Date.now())) / 60000);
      const wpm = Math.round(totalSpokenWordsRef.current / durationMin);

      formData.append("proctoring", JSON.stringify({
        tabSwitches: tabSwitchesRef.current,
        fillerWordsCount: fillerWordsCountRef.current,
        wordsPerMinute: wpm || 125,
      }));

      await api.post(`/interviews/${interviewId}/ai-submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPhase("completed");
    } catch (err) {
      console.error("Submission failed:", err);
      setErrorMessage(err.response?.data?.message || "Failed to submit interview.");
      setPhase("error");
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setHasCamera(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setHasMic(audioTrack.enabled);
      }
    }
  };

  const handleExit = () => {
    stopMediaTracks();
    stopSpeechRecognition();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role === "LPU Student") {
      navigate("/lpu-student");
    } else {
      navigate("/student");
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: theme.bg, color: theme.text }}>
        <FaSpinner className="animate-spin text-4xl mb-4" style={{ color: theme.gold }} />
        <p className="text-lg">Preparing your AI Interviewer...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between select-none" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Header Bar */}
      <header className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: theme.border, backgroundColor: theme.bgCard }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: "rgba(212, 168, 67, 0.15)", border: `1px solid ${theme.gold}` }}>
            <FaUserTie style={{ color: theme.gold }} size={20} />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-wide flex items-center gap-2">
              <span>Interactive AI Voice Interview</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-purple-900/40 text-purple-300 border border-purple-500/30">
                GROQ AI POWERED
              </span>
            </h1>
            <p className="text-xs" style={{ color: theme.textSecondary }}>
              Role: <strong style={{ color: theme.text }}>{interviewData?.jobTitle || "Job Interview"}</strong> • Candidate: <strong style={{ color: theme.text }}>{interviewData?.candidateName || "You"}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleExit}
          className="px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 transition hover:opacity-80"
          style={{ border: `1px solid ${theme.border}`, color: theme.textSecondary }}
        >
          <FaArrowLeft size={10} /> Exit Room
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col justify-center items-center">
        {/* PHASE 1: READY / INSTRUCTIONS */}
        {phase === "ready" && (
          <div className="w-full max-w-xl rounded-3xl p-8 border shadow-2xl flex flex-col items-center text-center animate-fadeIn" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            {/* Live Camera Preview */}
            <div className="relative w-64 h-44 rounded-2xl overflow-hidden mb-6 border shadow-2xl" style={{ borderColor: theme.gold, backgroundColor: "#000" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ transform: "scaleX(-1)" }}
              />
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center px-3 py-1 bg-black/70 backdrop-blur-md rounded-lg text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${hasCamera ? "bg-green-400" : "bg-red-400"}`} />
                  Camera
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${hasMic ? "bg-green-400" : "bg-red-400"}`} />
                  Mic: {audioLevel > 5 ? "Active" : "Ready"}
                </span>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-2 tracking-tight" style={{ color: theme.text }}>
              Voice Interview with AI Recruiter
            </h2>
            <p className="text-xs md:text-sm max-w-md mb-6 leading-relaxed" style={{ color: theme.textSecondary }}>
              The AI interviewer will ask you <strong style={{ color: theme.gold }}>{questions.length} questions</strong> customized to your resume. Speak naturally into your microphone.
            </p>

            <div className="grid grid-cols-3 gap-3 w-full mb-8 text-left text-xs">
              <div className="p-3 rounded-2xl border" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                <div className="font-bold text-white mb-1">🗣️ Voice Questions</div>
                <div className="text-[11px]" style={{ color: theme.textSecondary }}>AI asks questions from your CV projects.</div>
              </div>
              <div className="p-3 rounded-2xl border" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                <div className="font-bold text-white mb-1">⚡ Live Speech-To-Text</div>
                <div className="text-[11px]" style={{ color: theme.textSecondary }}>Your spoken answer appears live on screen.</div>
              </div>
              <div className="p-3 rounded-2xl border" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                <div className="font-bold text-white mb-1">📊 Q&A HR Report</div>
                <div className="text-[11px]" style={{ color: theme.textSecondary }}>Full evaluation & ratings sent to HR.</div>
              </div>
            </div>

            <button
              onClick={handleStartInterview}
              className="w-full py-3.5 rounded-2xl font-bold shadow-xl transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 text-sm text-black"
              style={{ backgroundColor: theme.gold }}
            >
              <FaRobot size={16} /> Begin AI Interview
            </button>
          </div>
        )}

        {/* PHASE 2: LIVE INTERVIEW */}
        {phase === "interviewing" && (
          <div className="w-full flex flex-col items-center">
            {/* Tab Switch Warning Alert Banner */}
            {showCheatWarning && (
              <div className="w-full mb-3 p-2.5 rounded-xl bg-red-900/60 border border-red-500 text-red-200 text-xs font-bold flex items-center justify-between animate-bounce">
                <span className="flex items-center gap-2">
                  <FaExclamationTriangle className="text-red-400" />
                  <span>⚠️ Proctoring Alert: Tab switch detected ({tabSwitches} switches logged). Please stay on the interview screen!</span>
                </span>
                <span className="text-[10px] text-red-300">Integrity Monitored</span>
              </div>
            )}

            {/* Top Status Bar */}
            <div className="w-full flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Question {currentQIndex + 1} of {questions.length}
              </span>

              {/* Status Badge */}
              <div className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border transition-all ${
                isSpeaking
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10 animate-pulse"
                  : isListening
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                  : "bg-gray-800 text-gray-300"
              }`}>
                {isSpeaking ? (
                  <>
                    <FaVolumeUp className="animate-pulse" />
                    AI Recruiter Speaking...
                  </>
                ) : isListening ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Listening to you (Speak your answer)...
                  </>
                ) : (
                  "Processing..."
                )}
              </div>
            </div>

            {/* Progress Line */}
            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mb-4">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${((currentQIndex + 1) / questions.length) * 100}%`,
                  backgroundColor: theme.gold
                }}
              />
            </div>

            {/* AI Recruiter Presence Banner */}
            <div className="w-full p-4 rounded-2xl border mb-3 flex items-center gap-4 shadow-xl transition-all" style={{
              backgroundColor: theme.bgCard,
              borderColor: isSpeaking ? theme.gold : theme.border,
              boxShadow: isSpeaking ? "0 0 20px rgba(212, 168, 67, 0.15)" : "none"
            }}>
              <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                isSpeaking ? "scale-105" : ""
              }`} style={{
                backgroundColor: isSpeaking ? "rgba(212, 168, 67, 0.2)" : theme.bgSecondary,
                border: `2px solid ${isSpeaking ? theme.gold : theme.border}`
              }}>
                <FaUserTie size={24} style={{ color: isSpeaking ? theme.gold : theme.textSecondary }} />
                {isSpeaking && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <FaRobot size={12} /> AI Recruiter Question
                  </div>
                  <button
                    onClick={() => speakVoice(questions[currentQIndex])}
                    disabled={isSpeaking}
                    className="px-2.5 py-0.5 rounded-lg text-[11px] font-medium flex items-center gap-1 transition hover:opacity-80 disabled:opacity-40"
                    style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, color: theme.textSecondary }}
                  >
                    <FaVolumeUp size={10} /> Repeat Question
                  </button>
                </div>
                <h3 className="text-sm md:text-base font-semibold leading-relaxed mt-1" style={{ color: theme.text }}>
                  "{questions[currentQIndex]}"
                </h3>
              </div>
            </div>

            {/* Candidate Real-Time Spoken Answer Box */}
            <div className="w-full rounded-2xl p-4 md:p-5 border shadow-xl mb-3" style={{
              backgroundColor: theme.bgCard,
              borderColor: isListening ? "rgba(16, 185, 129, 0.5)" : theme.border
            }}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: isListening ? "#34d399" : theme.textSecondary }}>
                  <FaMicrophone size={12} className={isListening ? "text-emerald-400 animate-pulse" : "text-gray-400"} />
                  <span>Your Spoken Answer (Live Speech-To-Text):</span>
                </label>
                {isListening && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Microphone Live
                  </span>
                )}
              </div>

              <textarea
                rows="4"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder={isSpeaking ? "AI is asking the question... Please listen." : "Speak your answer into the microphone. Your words will appear here live, or you can edit/type..."}
                className="w-full rounded-xl p-3 text-xs md:text-sm font-sans leading-relaxed focus:outline-none focus:ring-1 transition"
                style={{
                  backgroundColor: theme.bgSecondary,
                  borderColor: isListening ? "rgba(34, 197, 94, 0.4)" : theme.border,
                  color: theme.text,
                  border: `1px solid ${isListening ? "rgba(34, 197, 94, 0.4)" : theme.border}`
                }}
              />

              {/* Voice Audio Wave Meter */}
              {isListening && (
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    {[40, 70, 100, 60, 30, 80, 50, 90, 45, 65, 85, 35, 75, 45, 95].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                        style={{
                          height: `${Math.max(3, (audioLevel * h) / 100)}px`,
                          opacity: audioLevel > 5 ? 1 : 0.25
                        }}
                      />
                    ))}
                    <span className="text-[10px] ml-2 font-mono" style={{ color: audioLevel > 5 ? "#34d399" : theme.textSecondary }}>
                      {audioLevel > 5 ? "Audio Active" : "Listening..."}
                    </span>
                  </div>
                  <span className="text-[10px]" style={{ color: theme.textSecondary }}>
                    You can edit the text above anytime
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="w-full flex items-center justify-between gap-4 mt-1">
              <div className="text-xs" style={{ color: theme.textSecondary }}>
                Question {currentQIndex + 1} of {questions.length} • Click next when you finish speaking
              </div>

              <button
                onClick={handleNextQuestion}
                className="px-6 py-2.5 rounded-xl font-bold shadow-lg transition transform hover:scale-105 active:scale-95 flex items-center gap-2 text-xs md:text-sm text-black"
                style={{ backgroundColor: theme.gold }}
              >
                {currentQIndex === questions.length - 1 ? (
                  <>
                    <FaCheck size={13} /> Finish & Submit Interview
                  </>
                ) : (
                  <>
                    <span>Next Question</span>
                    <FaArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* PHASE 3: PROCESSING */}
        {phase === "processing" && (
          <div className="w-full max-w-md rounded-3xl p-8 border shadow-2xl flex flex-col items-center text-center animate-fadeIn" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <FaSpinner className="animate-spin text-5xl mb-6" style={{ color: theme.gold }} />
            <h2 className="text-2xl font-bold mb-2">Analyzing Interview...</h2>
            <p className="text-xs md:text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
              Groq AI is evaluating your verbal answers and generating the full question-by-question assessment report for HR.
            </p>
            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-6">
              <div className="h-full bg-amber-400 animate-pulse w-3/4 rounded-full" />
            </div>
          </div>
        )}

        {/* PHASE 4: COMPLETED */}
        {phase === "completed" && (
          <div className="w-full max-w-md rounded-3xl p-8 border shadow-2xl flex flex-col items-center text-center animate-fadeIn" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-xl" style={{ backgroundColor: "rgba(34, 197, 94, 0.2)", border: "2px solid #22c55e" }}>
              <FaCheck className="text-green-400 text-2xl" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Interview Completed!</h2>
            <p className="text-xs md:text-sm leading-relaxed mb-6" style={{ color: theme.textSecondary }}>
              Great job! Your spoken responses and audio have been submitted. HR can now review your AI evaluation score and question breakdown.
            </p>
            <button
              onClick={handleExit}
              className="px-6 py-2.5 rounded-xl font-bold shadow-lg transition hover:opacity-90 text-sm text-black"
              style={{ backgroundColor: theme.gold }}
            >
              Return to Dashboard
            </button>
          </div>
        )}

        {/* PHASE 5: ERROR */}
        {phase === "error" && (
          <div className="w-full max-w-md rounded-3xl p-8 border shadow-2xl flex flex-col items-center text-center animate-fadeIn" style={{ backgroundColor: theme.bgCard, borderColor: "rgba(239, 68, 68, 0.4)" }}>
            <FaExclamationTriangle className="text-red-400 text-4xl mb-4" />
            <h2 className="text-xl font-bold mb-2">Session Notice</h2>
            <p className="text-xs md:text-sm mb-6" style={{ color: theme.textSecondary }}>
              {errorMessage || "An error occurred during the session."}
            </p>
            <button
              onClick={handleExit}
              className="px-6 py-2 rounded-xl text-xs font-semibold transition hover:opacity-80"
              style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, color: theme.text }}
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </main>

      {/* Floating Picture-In-Picture Camera */}
      {phase === "interviewing" && (
        <div className="fixed bottom-6 right-6 z-40 w-44 h-32 md:w-52 md:h-36 rounded-2xl overflow-hidden border shadow-2xl bg-black" style={{ borderColor: theme.gold }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> REC
          </div>
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
            <button
              onClick={toggleMic}
              className="p-1.5 bg-black/70 rounded-full text-xs hover:bg-black transition"
              title={hasMic ? "Mute Mic" : "Unmute Mic"}
            >
              {hasMic ? <FaMicrophone size={10} className="text-green-400" /> : <FaMicrophoneSlash size={10} className="text-red-400" />}
            </button>
            <button
              onClick={toggleCamera}
              className="p-1.5 bg-black/70 rounded-full text-xs hover:bg-black transition"
              title={hasCamera ? "Turn Off Camera" : "Turn On Camera"}
            >
              {hasCamera ? <FaVideo size={10} className="text-green-400" /> : <FaVideoSlash size={10} className="text-red-400" />}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="px-6 py-3 border-t text-center text-xs" style={{ borderColor: theme.border, color: theme.textSecondary }}>
        AI Voice Interview • Powered by Groq Audio & LLM Models
      </footer>
    </div>
  );
}
