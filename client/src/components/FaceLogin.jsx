import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCamera, FaTimes, FaUser, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import * as faceapi from "@vladmandic/face-api";
import api from "../services/api";
import { loadFaceModels, areFaceModelsReady } from "../utils/faceModels";

function FaceLogin({ open, onClose, onSuccess, theme = "dark" }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);

  const [status, setStatus] = useState("loading"); // loading, ready, detecting, matched, failed, error
  const [message, setMessage] = useState("Loading face detection models...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const T = {
    dark: {
      bg: "bg-[#0f1729]/95 border-white/15",
      text: "text-white",
      sub: "text-slate-400",
      input: "bg-[#0d1225] border-slate-700/80 text-white",
      btn: "from-[#0d6e6e] via-[#0f7d7d] to-[#095454] text-white",
      btnDisabled: "bg-[#0d6e6e]/30 text-slate-300",
    },
    light: {
      bg: "bg-white/95 border-[#0d6e6e]/15 shadow-xl",
      text: "text-[#333333]",
      sub: "text-[#666666]",
      input: "bg-[#f8f9fa] border-[#0d6e6e]/25 text-[#333333]",
      btn: "from-[#0d6e6e] via-[#0f7d7d] to-[#095454] text-white",
      btnDisabled: "bg-[#0d6e6e]/25 text-[#6c757d]",
    },
  };

  const t = T[theme] || T.dark;

  const loadModels = useCallback(async () => {
    if (areFaceModelsReady()) {
      setModelsLoaded(true);
      return;
    }
    try {
      setStatus("loading");
      setMessage("Loading face detection models...");

      await loadFaceModels();
      setModelsLoaded(true);
      setStatus("ready");
      setMessage("Models loaded. Starting camera...");
    } catch (err) {
      console.error("Failed to load face-api models:", err);
      setStatus("error");
      setMessage("Failed to load face detection models. Please refresh.");
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus("ready");
        setMessage("Camera ready. Click 'Scan Face' to login.");
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setStatus("error");
      setMessage("Camera access denied. Please allow camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const detectFace = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    setIsProcessing(true);
    setStatus("detecting");
    setMessage("Scanning your face...");

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detection) {
        const resizedDetection = faceapi.resizeResults(detection, displaySize);
        const box = resizedDetection.detection.box;

        // Draw green box around face
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Draw label
        ctx.fillStyle = "#00ff00";
        ctx.font = "16px Arial";
        ctx.fillText("Face Detected", box.x, box.y - 10);

        // Extract descriptor and send to server
        const descriptor = Array.from(detection.descriptor);
        const response = await api.post("/auth/face-login", {
          faceDescriptor: descriptor,
        });

        setStatus("matched");
        setMessage("Face matched! Logging you in...");

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        setTimeout(() => {
          stopCamera();
          onSuccess(response.data.user);
        }, 1500);
      } else {
        setStatus("ready");
        setMessage("No face detected. Please look at the camera.");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Face detection error:", err);
      const errorMsg = err.response?.data?.message || "Face recognition failed. Please try again.";
      setStatus("failed");
      setMessage(errorMsg);
      setIsProcessing(false);
    }
  }, [isProcessing, stopCamera, onSuccess]);

  useEffect(() => {
    if (open && modelsLoaded) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open, modelsLoaded, startCamera, stopCamera]);

  useEffect(() => {
    if (open && !modelsLoaded) {
      loadModels();
    }
  }, [open, modelsLoaded, loadModels]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            stopCamera();
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl backdrop-blur-2xl ${t.bg}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#0d6e6e]/15">
                <FaCamera className="text-[#0d6e6e] text-lg" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${t.text}`}>Face Unlock</h2>
                <p className={`text-xs ${t.sub}`}>Scan your face to login</p>
              </div>
            </div>
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className={`p-2 rounded-xl hover:bg-white/10 transition-colors ${t.sub}`}
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Camera Feed */}
          <div className="relative rounded-2xl overflow-hidden bg-black mb-4 aspect-[4/3]">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ transform: "scaleX(-1)" }}
            />

            {/* Status Overlay */}
            {(status === "loading" || status === "detecting") && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <div className="w-10 h-10 border-3 border-[#0d6e6e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-white text-sm">{message}</p>
                </div>
              </div>
            )}

            {status === "matched" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <FaCheckCircle className="text-green-400 text-5xl mx-auto mb-3" />
                  <p className="text-green-400 text-sm font-semibold">{message}</p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <FaExclamationTriangle className="text-red-400 text-5xl mx-auto mb-3" />
                  <p className="text-red-400 text-sm font-semibold">{message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Status Message */}
          <div className={`text-center mb-4 p-3 rounded-xl ${
            status === "matched"
              ? "bg-green-500/15 text-green-400"
              : status === "failed"
              ? "bg-red-500/15 text-red-400"
              : status === "error"
              ? "bg-red-500/15 text-red-400"
              : "bg-[#0d6e6e]/10 text-[#0d6e6e]"
          }`}>
            <p className="text-xs font-medium">{message}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className={`flex-1 py-3 rounded-2xl border font-semibold text-xs transition-all duration-300 ${
                theme === "dark"
                  ? "border-slate-600 text-slate-300 hover:bg-white/5"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={detectFace}
              disabled={status !== "ready" || isProcessing}
              className={`flex-1 py-3 rounded-2xl font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 ${
                status === "ready" && !isProcessing
                  ? `bg-gradient-to-r ${t.btn} hover:brightness-110 active:scale-[0.98]`
                  : t.btnDisabled
              }`}
            >
              <FaUser className="text-sm" />
              {isProcessing ? "Scanning..." : "Scan Face"}
            </button>
          </div>

          {/* Hint */}
          <p className={`text-center text-[10px] mt-3 ${t.sub}`}>
            Ensure your face is clearly visible and well-lit
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default FaceLogin;
