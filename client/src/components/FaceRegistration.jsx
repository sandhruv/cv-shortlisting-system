import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCamera, FaTimes, FaUser, FaCheckCircle, FaExclamationTriangle, FaShieldAlt, FaEnvelope, FaLock } from "react-icons/fa";
import * as faceapi from "@vladmandic/face-api";
import api from "../services/api";
import { loadFaceModels, areFaceModelsReady } from "../utils/faceModels";

function FaceRegistration({ open, onClose, theme = "dark" }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [step, setStep] = useState("credentials"); // credentials, loading-models, camera, success
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  const T = {
    dark: {
      bg: "bg-[#0f1729]/95 border-white/15",
      text: "text-white",
      sub: "text-slate-400",
      input: "bg-[#0d1225] border-slate-700/80 text-white placeholder-slate-500",
      inputFocus: "focus:border-[#0d6e6e] focus:ring-[#0d6e6e]/30",
      btn: "from-[#0d6e6e] via-[#0f7d7d] to-[#095454] text-white",
      btnDisabled: "bg-[#0d6e6e]/30 text-slate-300",
    },
    light: {
      bg: "bg-white/95 border-[#0d6e6e]/15 shadow-xl",
      text: "text-[#333333]",
      sub: "text-[#666666]",
      input: "bg-[#f8f9fa] border-[#0d6e6e]/25 text-[#333333] placeholder-[#999999]",
      inputFocus: "focus:border-[#0d6e6e] focus:ring-[#0d6e6e]/30",
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
      await loadFaceModels();
      setModelsLoaded(true);
    } catch (err) {
      console.error("Failed to load face-api models:", err);
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
        setStep("camera");
        setStatus("ready");
        setMessage("Camera ready. Click 'Register Face' to save your face.");
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setStatus("error");
      setMessage("Camera access denied. Please allow camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleVerifyCredentials = useCallback(async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email: credentials.email,
        password: credentials.password,
      });

      const token = res.data.token;
      setAuthToken(token);

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setStep("loading-models");
      setMessage("Verifying identity... Loading face models.");

      if (!modelsLoaded) {
        await loadModels();
      }
      startCamera();
    } catch (err) {
      setAuthError(err.response?.data?.message || "Invalid email or password. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }, [credentials, modelsLoaded, loadModels, startCamera]);

  const registerFace = useCallback(async () => {
    if (!videoRef.current || isProcessing) return;

    setIsProcessing(true);
    setStatus("detecting");
    setMessage("Scanning and registering your face...");

    try {
      const video = videoRef.current;

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const descriptor = Array.from(detection.descriptor);
        await api.post("/auth/register-face", { faceDescriptor: descriptor });

        setStatus("success");
        setStep("success");
        setMessage("Face registered successfully! You can now use Face Unlock.");

        setTimeout(() => {
          stopCamera();
          onClose();
        }, 2000);
      } else {
        setStatus("ready");
        setMessage("No face detected. Please look at the camera.");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Face registration error:", err);
      const errorMsg = err.response?.data?.message || "Face registration failed. Please try again.";
      setStatus("failed");
      setMessage(errorMsg);
      setIsProcessing(false);
    }
  }, [isProcessing, stopCamera, onClose]);

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

  const handleClose = useCallback(() => {
    stopCamera();
    setStep("credentials");
    setStatus("idle");
    setMessage("");
    setCredentials({ email: "", password: "" });
    setAuthError("");
    setAuthToken(null);
    setIsProcessing(false);
    onClose();
  }, [stopCamera, onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
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
                <FaShieldAlt className="text-[#0d6e6e] text-lg" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${t.text}`}>Register Face</h2>
                <p className={`text-xs ${t.sub}`}>
                  {step === "credentials" ? "Verify your identity first" : "Set up Face Unlock for quick login"}
                </p>
              </div>
            </div>
            <button onClick={handleClose} className={`p-2 rounded-xl hover:bg-white/10 transition-colors ${t.sub}`}>
              <FaTimes size={18} />
            </button>
          </div>

          {/* Step: Credentials */}
          {step === "credentials" && (
            <form onSubmit={handleVerifyCredentials} className="space-y-4">
              <p className={`text-xs ${t.sub}`}>
                Enter your email and password to verify your identity before registering your face.
              </p>

              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${t.sub}`}>Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0d6e6e] text-sm" />
                  <input
                    type="email"
                    required
                    value={credentials.email}
                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    placeholder="your@email.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all ${t.input} ${t.inputFocus}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${t.sub}`}>Password</label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0d6e6e] text-sm" />
                  <input
                    type="password"
                    required
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    placeholder="Enter your password"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all ${t.input} ${t.inputFocus}`}
                  />
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-500/15 text-red-400 text-xs font-medium">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading || !credentials.email || !credentials.password}
                className={`w-full py-3 rounded-2xl font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 ${
                  authLoading || !credentials.email || !credentials.password
                    ? t.btnDisabled
                    : `bg-gradient-to-r ${t.btn} hover:brightness-110 active:scale-[0.98]`
                }`}
              >
                {authLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <FaLock className="text-sm" />
                    Verify & Continue
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step: Loading Models / Camera */}
          {(step === "loading-models" || step === "camera") && (
            <>
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
                {(step === "loading-models" || status === "detecting") && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center">
                      <div className="w-10 h-10 border-3 border-[#0d6e6e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-white text-sm">{message}</p>
                    </div>
                  </div>
                )}

                {status === "success" && (
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
                status === "success"
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
                  onClick={handleClose}
                  className={`flex-1 py-3 rounded-2xl border font-semibold text-xs transition-all duration-300 ${
                    theme === "dark"
                      ? "border-slate-600 text-slate-300 hover:bg-white/5"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={registerFace}
                  disabled={status !== "ready" || isProcessing}
                  className={`flex-1 py-3 rounded-2xl font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 ${
                    status === "ready" && !isProcessing
                      ? `bg-gradient-to-r ${t.btn} hover:brightness-110 active:scale-[0.98]`
                      : t.btnDisabled
                  }`}
                >
                  <FaUser className="text-sm" />
                  {isProcessing ? "Registering..." : "Register Face"}
                </button>
              </div>

              <p className={`text-center text-[10px] mt-3 ${t.sub}`}>
                Position your face in the center. Ensure good lighting for best results.
              </p>
            </>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="text-center py-6">
              <FaCheckCircle className="text-green-400 text-5xl mx-auto mb-4" />
              <p className={`text-sm font-semibold ${t.text}`}>Face registered successfully!</p>
              <p className={`text-xs mt-1 ${t.sub}`}>You can now use Face Unlock to login.</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default FaceRegistration;
