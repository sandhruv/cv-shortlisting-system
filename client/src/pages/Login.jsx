import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaBuilding, FaRobot, FaShieldAlt, FaCode, FaVideo, FaCheckCircle, FaSun, FaMoon, FaHeadset, FaFingerprint } from "react-icons/fa";
import { motion } from "framer-motion";
import api from "../services/api";
import VettoraLoader from "../components/VettoraLoader";
import VoiceAIAgent from "../components/VoiceAIAgent";
import FaceLogin from "../components/FaceLogin";
import FaceRegistration from "../components/FaceRegistration";
import { loadFaceModels } from "../utils/faceModels";

/* ═══ Theme Palettes ═══════════════════════════════════════════ */
const T = {
  dark: {
    page: "bg-[#0a0f1e] text-slate-100",
    hero: "bg-[#0f1729]/60 border-white/10",
    heroText: "text-white",
    heroSub: "text-slate-400",
    card: "bg-[#0f1729]/85 border-white/15",
    cardText: "text-white",
    cardSub: "text-slate-400",
    input: "bg-[#0d1225] border-slate-700/80 text-white placeholder:text-slate-500 focus:border-[#0d6e6e]",
    label: "text-slate-300",
    icon: "text-slate-400",
    divider: "border-slate-800",
    dividerBg: "bg-[#0f1729]",
    dividerText: "text-slate-500",
    footer: "text-slate-500",
    badge: "text-[#0d6e6e]",
    featureCard: "bg-white/[0.03] border-white/10",
    featureTitle: "text-slate-200",
    featureDesc: "text-slate-400",
    founderBg: "bg-gradient-to-r from-[#0d6e6e]/10 via-white/[0.03] to-transparent",
    founderBorder: "border-[#0d6e6e]/30",
    founderText: "text-white",
    founderSub: "text-slate-300",
    link: "text-[#0d6e6e]",
    btnGold: "from-[#0d6e6e] via-[#0f7d7d] to-[#095454] text-white",
    btnGoldDisabled: "bg-[#0d6e6e]/30 text-slate-300",
    btnLpu: "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20",
    btnLpuIcon: "text-amber-400",
    gridLine: "#ffffff05",
    logoBg: "bg-[#080d1a]",
    logoBorder: "border-[#0d6e6e]/30",
    logoShadow: "shadow-[0_0_30px_rgba(13,110,110,0.12)]",
  },
  light: {
    page: "bg-[#f4f7fa] text-[#333333]",
    hero: "bg-[#e8eef3]/70 border-[#0d6e6e]/15",
    heroText: "text-[#0f1729]",
    heroSub: "text-[#666666]",
    card: "bg-white/90 border-[#0d6e6e]/15 shadow-xl",
    cardText: "text-[#333333]",
    cardSub: "text-[#666666]",
    input: "bg-[#f8f9fa] border-[#0d6e6e]/25 text-[#333333] placeholder:text-[#9ca3af] focus:border-[#0d6e6e]",
    label: "text-[#333333]",
    icon: "text-[#6c757d]",
    divider: "border-[#0d6e6e]/15",
    dividerBg: "bg-white",
    dividerText: "text-[#6c757d]",
    footer: "text-[#6c757d]",
    badge: "text-[#0d6e6e]",
    featureCard: "bg-[#f4f7fa]/80 border-[#0d6e6e]/12",
    featureTitle: "text-[#0f1729]",
    featureDesc: "text-[#666666]",
    founderBg: "bg-gradient-to-r from-[#0d6e6e]/10 via-[#f4f7fa]/40 to-transparent",
    founderBorder: "border-[#0d6e6e]/20",
    founderText: "text-[#0f1729]",
    founderSub: "text-[#666666]",
    link: "text-[#0d6e6e]",
    btnGold: "from-[#0d6e6e] via-[#0f7d7d] to-[#095454] text-white",
    btnGoldDisabled: "bg-[#0d6e6e]/25 text-[#6c757d]",
    btnLpu: "border-amber-600/30 bg-amber-100 text-amber-800 hover:bg-amber-200",
    btnLpuIcon: "text-amber-700",
    gridLine: "#00000005",
    logoBg: "bg-[#f4f7fa]",
    logoBorder: "border-[#0d6e6e]/25",
    logoShadow: "shadow-[0_0_20px_rgba(13,110,110,0.08)]",
  },
};

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOldPassword, setResetOldPassword] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [theme, setTheme] = useState("dark");
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [showFaceLogin, setShowFaceLogin] = useState(false);
  const [showFaceRegistration, setShowFaceRegistration] = useState(false);

  useEffect(() => {
    loadFaceModels();
  }, []);

  const t = T[theme];
  const toggleTheme = () => setTheme((p) => (p === "dark" ? "light" : "dark"));

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      const role = res.data.user.role;
      if (role === "Admin") navigate("/admin");
      else if (role === "HR") navigate("/hr");
      else navigate("/student");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage("");
    try {
      const res = await api.post("/auth/reset-password", {
        email: resetEmail,
        oldPassword: resetOldPassword,
        newPassword: resetNewPassword,
      });
      setResetMessage(res.data.message);
      setResetOldPassword("");
      setResetNewPassword("");
    } catch (err) {
      setResetMessage(err.response?.data?.message || "Unable to submit your request. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleFaceLoginSuccess = (user) => {
    const role = user.role;
    if (role === "Admin") navigate("/admin");
    else if (role === "HR") navigate("/hr");
    else navigate("/student");
  };

  return (
    <div className={`login-neo min-h-screen flex flex-col lg:flex-row ${t.page} relative overflow-hidden font-sans transition-colors duration-500`}>

      {/* ── Full-screen Vettora Loading Overlay ── */}
      {isLoading && <VettoraLoader message="Authenticating…" theme={theme} />}

      {/* ── Theme Toggle Button ── */}
      <motion.button
        onClick={toggleTheme}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="login-theme-toggle fixed top-5 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300"
        style={{
          background: theme === "dark" ? "rgba(30,35,50,0.8)" : "rgba(255,255,255,0.8)",
          borderColor: theme === "dark" ? "rgba(13,110,110,0.3)" : "rgba(139,105,20,0.3)",
          boxShadow: theme === "dark"
            ? "0 0 20px rgba(13,110,110,0.15)"
            : "0 0 20px rgba(139,105,20,0.10)",
        }}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <FaSun className="text-[#0d6e6e] text-sm" />
        ) : (
          <FaMoon className="text-[#0d6e6e] text-sm" />
        )}
      </motion.button>

      {/* ── Ambient Glow Background ── */}
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none transition-colors duration-500"
        style={{
          background: theme === "dark"
            ? "linear-gradient(to bottom right, rgba(13,110,110,0.10), rgba(139,26,26,0.10), transparent)"
            : "linear-gradient(to bottom right, rgba(13,110,110,0.12), rgba(139,26,26,0.06), transparent)",
        }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[650px] h-[650px] rounded-full blur-[150px] pointer-events-none transition-colors duration-500"
        style={{
          background: theme === "dark"
            ? "linear-gradient(to top left, rgba(13,110,110,0.10), rgba(88,28,135,0.15), transparent)"
            : "linear-gradient(to top left, rgba(13,110,110,0.08), rgba(139,26,26,0.04), transparent)",
        }}
      />
      <div
        className="absolute inset-0 bg-[size:32px_32px] opacity-30 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, ${t.gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${t.gridLine} 1px, transparent 1px)`,
        }}
      />

      {/* ── Left Hero Panel ─────── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className={`login-hero hidden lg:flex lg:w-7/12 p-12 xl:p-16 flex-col justify-between relative z-10 border-r ${t.hero} backdrop-blur-2xl transition-colors duration-500`}
      >
        <div>
          {/* Badge */}
          <div className="flex items-center gap-3 mb-10">
            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase bg-[#0d6e6e]/10 border border-[#0d6e6e]/30 ${t.badge} transition-colors duration-500`}>
              <span className="w-2 h-2 rounded-full bg-[#0d6e6e] animate-pulse" />
              Enterprise Recruitment &amp; Assessment Infrastructure
            </span>
          </div>

          {/* Logo */}
          <div className="mb-10 inline-block">
            <div className={`p-3 rounded-2xl ${t.logoBg} border ${t.logoBorder} ${t.logoShadow} transition-colors duration-500`}>
              <img
                src="/vettora-logo.png"
                alt="Vettora — Intelligence Behind Every Hire"
                className="h-28 max-w-full object-contain rounded-xl"
              />
            </div>
          </div>

          <h1 className={`text-4xl xl:text-5xl font-bold tracking-tight leading-[1.18] mb-4 ${t.heroText} transition-colors duration-500`}>
            Intelligence Behind<br />
            <span className="bg-gradient-to-r from-[#b2dfdb] via-[#0d6e6e] to-[#0f7d7d] bg-clip-text text-transparent">
              Every Hiring Decision.
            </span>
          </h1>
          <p className={`text-base max-w-lg mb-10 leading-relaxed ${t.heroSub} transition-colors duration-500`}>
            Automated resume parsing with Groq AI, proctored coding assessments with anti-cheat protection, and WebRTC video interviews with audio evaluation.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-4 max-w-xl">
            {[
              { icon: <FaRobot className="text-[#0d6e6e]" />, title: "AI Resume Parsing", desc: "Structured Groq Llama 3.1 8B data extraction" },
              { icon: <FaCode className="text-[#0f7d7d]" />, title: "Proctored Compiler", desc: "8 languages with 7 anti-cheat layers" },
              { icon: <FaVideo className="text-[#4db6ac]" />, title: "WebRTC Interviews", desc: "Live webcam stream & Whisper v3 audio evaluation" },
              { icon: <FaShieldAlt className="text-[#0d6e6e]" />, title: "Multi-Role Architecture", desc: "Enterprise HR & University placement management" },
            ].map((f, idx) => (
              <div
                key={idx}
                className={`login-feature p-4 rounded-xl ${t.featureCard} hover:border-[#0d6e6e]/40 transition-all duration-300 backdrop-blur-md`}
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="p-2 rounded-lg bg-[#0d6e6e]/10 text-sm">{f.icon}</div>
                  <span className={`text-xs font-semibold ${t.featureTitle} transition-colors duration-500`}>{f.title}</span>
                </div>
                <p className={`text-[11px] leading-normal ${t.featureDesc} transition-colors duration-500`}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Founder */}
          <div className={`mt-8 p-3.5 rounded-2xl ${t.founderBg} border ${t.founderBorder} flex items-center gap-4 max-w-xl backdrop-blur-md shadow-lg transition-colors duration-500`}>
            <div className="relative shrink-0">
              <img
                src="/founder-sankalp.png"
                alt="Sankalp Nigam — Founder"
                className="w-14 h-14 rounded-full object-cover border-2 border-[#0d6e6e] shadow-lg"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0d6e6e] border-2 border-[#0a0f1e] flex items-center justify-center text-[9px] text-[#0a0f1e] font-bold">★</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-bold ${t.founderText} transition-colors duration-500`}>Sankalp Nigam</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0d6e6e]/20 text-[#4db6ac] border border-[#0d6e6e]/30">Founder &amp; Architect</span>
              </div>
              <p className={`text-xs italic mt-0.5 ${t.founderSub} transition-colors duration-500`}>
                "Architecting the future of intelligent, automated hiring infrastructure."
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between text-xs pt-8 border-t ${t.divider} ${t.heroSub} transition-colors duration-500`}>
          <span>&copy; {new Date().getFullYear()} Vettora Platform. Confidential &amp; Proprietary.</span>
          <span className="flex items-center gap-1.5 text-[#0d6e6e]">
            <FaCheckCircle className="text-xs" /> Verified Secure System
          </span>
        </div>
      </motion.div>

      {/* ── Right Panel (Login Form) ──────────────────────────────────── */}
      <div className="login-form-side flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-[440px]"
        >
          {/* Mobile Header Branding */}
          <div className="lg:hidden text-center mb-8">
            <div className={`inline-block p-3 rounded-2xl ${t.logoBg} border ${t.logoBorder} shadow-lg transition-colors duration-500`}>
              <img src="/vettora-logo.png" alt="Vettora Logo" className="h-16 object-contain rounded-xl" />
            </div>
            <p className="mt-3 text-xs font-semibold text-[#0d6e6e] tracking-widest uppercase">
              AI Recruitment &amp; Assessment System
            </p>
          </div>

          {/* Glass Card */}
          <div className={`login-card ${t.card} backdrop-blur-2xl rounded-3xl p-8 sm:p-10 relative overflow-hidden transition-colors duration-500`}>
            {/* Top Accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#0d6e6e] to-transparent" />

            <div className="mb-8 text-center sm:text-left">
              <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${t.cardText} transition-colors duration-500`}>Account Sign In</h2>
              <p className={`text-sm mt-1.5 ${t.cardSub} transition-colors duration-500`}>Enter your credentials to access the Vettora portal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-950/40 border border-rose-500/30 text-rose-200 px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5"
                >
                  <span className="text-rose-400 text-sm shrink-0">⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Email */}
              <div>
                <label className={`text-xs font-semibold uppercase tracking-wider block mb-2 ${t.label} transition-colors duration-500`}>
                  Corporate Email
                </label>
                <div className="relative group">
                  <FaEnvelope className={`absolute left-4 top-1/2 -translate-y-1/2 ${t.icon} group-focus-within:text-[#0d6e6e] transition-colors`} />
                  <input
                    type="email"
                    name="email"
                    placeholder="name@company.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className={`login-input w-full pl-11 pr-4 py-3.5 border rounded-2xl outline-none text-sm transition-all duration-300 focus:ring-2 focus:ring-[#0d6e6e]/20 ${t.input}`}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`text-xs font-semibold uppercase tracking-wider ${t.label} transition-colors duration-500`}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setResetEmail(form.email); setResetMessage(""); setShowForgotPassword(true); }}
                    className={`text-xs font-semibold ${t.link} hover:underline`}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <FaLock className={`absolute left-4 top-1/2 -translate-y-1/2 ${t.icon} group-focus-within:text-[#0d6e6e] transition-colors`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••••••"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className={`login-input w-full pl-11 pr-12 py-3.5 border rounded-2xl outline-none text-sm transition-all duration-300 focus:ring-2 focus:ring-[#0d6e6e]/20 ${t.input}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${t.icon} hover:text-[#0d6e6e] transition-colors`}
                  >
                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={`login-primary w-full py-4 rounded-2xl font-bold text-sm tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
                  isLoading
                    ? t.btnGoldDisabled
                    : `bg-gradient-to-r ${t.btnGold} hover:brightness-110 active:scale-[0.99]`
                }`}
              >
                {isLoading ? (
                  <>
                    <span className="vettora-btn-spinner" style={{ borderColor: theme === "dark" ? "#070a12" : "#fff", borderTopColor: "transparent" }} />
                    Authenticating…
                  </>
                ) : (
                  "Sign In to Portal →"
                )}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className={`absolute inset-0 flex items-center`}><div className={`w-full border-t ${t.divider}`} /></div>
                <div className="relative flex justify-center text-xs">
                  <span className={`px-3 ${t.dividerBg} ${t.dividerText} uppercase tracking-widest text-[10px] transition-colors duration-500`}>Portal Options</span>
                </div>
              </div>

              {/* Face Unlock Button */}
              <button
                type="button"
                onClick={() => setShowFaceLogin(true)}
                className={`login-face-unlock w-full py-3.5 rounded-2xl border font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-300 ${
                  theme === "dark"
                    ? "border-[#0d6e6e]/40 bg-[#0d6e6e]/15 text-[#0d6e6e] hover:bg-[#0d6e6e]/25 hover:border-[#0d6e6e]/60"
                    : "border-[#0d6e6e]/40 bg-[#0d6e6e]/10 text-[#0d6e6e] hover:bg-[#0d6e6e]/20"
                }`}
              >
                <FaFingerprint className="text-sm" />
                Face Unlock — Login with your face
              </button>

              {/* Register Face Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowFaceRegistration(true)}
                  className="text-[10px] text-[#0d6e6e] hover:underline font-medium"
                >
                  First time? Register your face here
                </button>
              </div>

              {/* University + Register */}
              <div className="space-y-3">
                <Link
                  to="/lpu-login"
                  className={`login-secondary w-full py-3 rounded-2xl border font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-300 ${t.btnLpu}`}
                >
                  <FaBuilding className={`text-sm ${t.btnLpuIcon}`} />
                  LPU University Campus Login
                </Link>

                {/* AI Voice Agent Button */}
                <button
                  type="button"
                  onClick={() => setShowAIAgent(true)}
                  className={`login-ai-agent w-full py-3 rounded-2xl border font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-300 ${
                    theme === "dark"
                      ? "border-[#0d6e6e]/30 bg-[#0d6e6e]/10 text-[#0d6e6e] hover:bg-[#0d6e6e]/20"
                      : "border-[#0d6e6e]/30 bg-[#0d6e6e]/10 text-[#0d6e6e] hover:bg-[#0d6e6e]/20"
                  }`}
                >
                  <FaHeadset className="text-sm" />
                  Talk to AI Agent
                </button>

                <div className="text-center pt-2">
                  <span className={`text-xs ${t.heroSub} transition-colors duration-500`}>Need a candidate or HR account? </span>
                  <Link to="/register" className="text-xs font-semibold text-[#0d6e6e] hover:underline">
                    Register Here
                  </Link>
                </div>
              </div>
            </form>
          </div>

          {showForgotPassword && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`w-full max-w-md rounded-3xl border p-7 shadow-2xl backdrop-blur-2xl ${t.card}`}
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h2 className={`text-2xl font-bold ${t.cardText}`}>Reset Password</h2>
                    <p className={`mt-1.5 text-sm ${t.cardSub}`}>Enter your old password and choose a new one.</p>
                  </div>
                  <button type="button" onClick={() => setShowForgotPassword(false)} className={`text-xl ${t.icon} hover:text-[#0d6e6e]`} aria-label="Close reset password dialog">×</button>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <label className={`block text-xs font-semibold uppercase tracking-wider ${t.label}`}>
                    Registered Email
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      className={`mt-2 w-full rounded-2xl border px-4 py-3.5 text-sm outline-none transition-all focus:ring-2 focus:ring-[#0d6e6e]/20 ${t.input}`}
                    />
                  </label>
                  <label className={`block text-xs font-semibold uppercase tracking-wider ${t.label}`}>
                    Old Password
                    <input
                      type="password"
                      value={resetOldPassword}
                      onChange={(e) => setResetOldPassword(e.target.value)}
                      placeholder="Enter old password"
                      required
                      className={`mt-2 w-full rounded-2xl border px-4 py-3.5 text-sm outline-none transition-all focus:ring-2 focus:ring-[#0d6e6e]/20 ${t.input}`}
                    />
                  </label>
                  <label className={`block text-xs font-semibold uppercase tracking-wider ${t.label}`}>
                    New Password
                    <input
                      type="password"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      minLength={8}
                      required
                      className={`mt-2 w-full rounded-2xl border px-4 py-3.5 text-sm outline-none transition-all focus:ring-2 focus:ring-[#0d6e6e]/20 ${t.input}`}
                    />
                  </label>
                  {resetMessage && <p className={`rounded-xl border border-[#0d6e6e]/30 bg-[#0d6e6e]/10 px-3 py-2.5 text-xs ${t.cardSub}`}>{resetMessage}</p>}
                  <button type="submit" disabled={resetLoading} className={`w-full rounded-2xl py-3.5 text-sm font-bold transition hover:brightness-110 disabled:opacity-60 bg-gradient-to-r ${t.btnGold}`}>
                    {resetLoading ? "Submitting…" : "Request Password Reset"}
                  </button>
                </form>
              </motion.div>
            </div>
          )}

          {/* AI Voice Agent Modal */}
          <VoiceAIAgent open={showAIAgent} onClose={() => setShowAIAgent(false)} theme={theme} />

          {/* Face Login Modal */}
          <FaceLogin
            open={showFaceLogin}
            onClose={() => setShowFaceLogin(false)}
            onSuccess={handleFaceLoginSuccess}
            theme={theme}
          />

          {/* Face Registration Modal */}
          <FaceRegistration
            open={showFaceRegistration}
            onClose={() => setShowFaceRegistration(false)}
            theme={theme}
          />

          {/* Footer */}
          <div className="text-center mt-6">
            <p className={`text-[11px] tracking-wider ${t.footer} transition-colors duration-500`}>
              🔒 256-Bit TLS Encrypted &bull; AI Hiring Engine Active
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;
