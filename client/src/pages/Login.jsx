import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaBuilding, FaRobot, FaShieldAlt, FaCode, FaVideo, FaCheckCircle, FaSun, FaMoon } from "react-icons/fa";
import { motion } from "framer-motion";
import api from "../services/api";
import VettoraLoader from "../components/VettoraLoader";

/* ═══ Theme Palettes ═══════════════════════════════════════════ */
const T = {
  dark: {
    page: "bg-[#080c14] text-slate-100",
    hero: "bg-[#0d1320]/60 border-white/10",
    heroText: "text-white",
    heroSub: "text-slate-400",
    card: "bg-[#0e1422]/85 border-white/15",
    cardText: "text-white",
    cardSub: "text-slate-400",
    input: "bg-[#070a12] border-slate-700/80 text-white placeholder:text-slate-500 focus:border-[#d4af37]",
    label: "text-slate-300",
    icon: "text-slate-400",
    divider: "border-slate-800",
    dividerBg: "bg-[#0e1422]",
    dividerText: "text-slate-500",
    footer: "text-slate-500",
    badge: "text-[#d4af37]",
    featureCard: "bg-white/[0.03] border-white/10",
    featureTitle: "text-slate-200",
    featureDesc: "text-slate-400",
    founderBg: "bg-gradient-to-r from-[#d4af37]/10 via-white/[0.03] to-transparent",
    founderBorder: "border-[#d4af37]/30",
    founderText: "text-white",
    founderSub: "text-slate-300",
    link: "text-[#d4af37]",
    btnGold: "from-[#d4af37] via-[#c5a059] to-[#996515] text-[#070a12]",
    btnGoldDisabled: "bg-[#d4af37]/30 text-slate-300",
    btnLpu: "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20",
    btnLpuIcon: "text-amber-400",
    gridLine: "#ffffff05",
    logoBg: "bg-[#090d16]",
    logoBorder: "border-[#d4af37]/30",
    logoShadow: "shadow-[0_0_30px_rgba(212,175,55,0.12)]",
  },
  light: {
    page: "bg-[#f5f0e8] text-[#1a1510]",
    hero: "bg-[#ece4d4]/70 border-[#c5a059]/20",
    heroText: "text-[#2a1f10]",
    heroSub: "text-[#6b5a3a]",
    card: "bg-white/90 border-[#c5a059]/20 shadow-xl",
    cardText: "text-[#1a1510]",
    cardSub: "text-[#6b5a3a]",
    input: "bg-[#f8f4ec] border-[#c5a059]/30 text-[#1a1510] placeholder:text-[#a09070] focus:border-[#8B6914]",
    label: "text-[#4a3a20]",
    icon: "text-[#a09070]",
    divider: "border-[#c5a059]/20",
    dividerBg: "bg-white",
    dividerText: "text-[#a09070]",
    footer: "text-[#a09070]",
    badge: "text-[#8B6914]",
    featureCard: "bg-[#f0e8d8]/60 border-[#c5a059]/15",
    featureTitle: "text-[#3a2a10]",
    featureDesc: "text-[#6b5a3a]",
    founderBg: "bg-gradient-to-r from-[#d4af37]/10 via-[#f0e8d8]/40 to-transparent",
    founderBorder: "border-[#c5a059]/30",
    founderText: "text-[#2a1f10]",
    founderSub: "text-[#6b5a3a]",
    link: "text-[#8B6914]",
    btnGold: "from-[#8B6914] via-[#a07820] to-[#6b4f0a] text-white",
    btnGoldDisabled: "bg-[#c5a059]/30 text-[#4a3a20]",
    btnLpu: "border-amber-600/30 bg-amber-100 text-amber-800 hover:bg-amber-200",
    btnLpuIcon: "text-amber-700",
    gridLine: "#00000005",
    logoBg: "bg-[#f0e8d8]",
    logoBorder: "border-[#c5a059]/40",
    logoShadow: "shadow-[0_0_20px_rgba(212,175,55,0.10)]",
  },
};

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });
  const [theme, setTheme] = useState("dark");

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

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row ${t.page} relative overflow-hidden font-sans transition-colors duration-500`}>

      {/* ── Full-screen Vettora Loading Overlay ── */}
      {isLoading && <VettoraLoader message="Authenticating…" theme={theme} />}

      {/* ── Theme Toggle Button ── */}
      <motion.button
        onClick={toggleTheme}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed top-5 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300"
        style={{
          background: theme === "dark" ? "rgba(30,35,50,0.8)" : "rgba(255,255,255,0.8)",
          borderColor: theme === "dark" ? "rgba(212,175,55,0.3)" : "rgba(139,105,20,0.3)",
          boxShadow: theme === "dark"
            ? "0 0 20px rgba(212,175,55,0.15)"
            : "0 0 20px rgba(139,105,20,0.10)",
        }}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <FaSun className="text-[#d4af37] text-sm" />
        ) : (
          <FaMoon className="text-[#8B6914] text-sm" />
        )}
      </motion.button>

      {/* ── Ambient Glow Background ── */}
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none transition-colors duration-500"
        style={{
          background: theme === "dark"
            ? "linear-gradient(to bottom right, rgba(212,175,55,0.10), rgba(139,26,26,0.10), transparent)"
            : "linear-gradient(to bottom right, rgba(212,175,55,0.12), rgba(139,26,26,0.06), transparent)",
        }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[650px] h-[650px] rounded-full blur-[150px] pointer-events-none transition-colors duration-500"
        style={{
          background: theme === "dark"
            ? "linear-gradient(to top left, rgba(212,175,55,0.10), rgba(88,28,135,0.15), transparent)"
            : "linear-gradient(to top left, rgba(212,175,55,0.08), rgba(139,26,26,0.04), transparent)",
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
        className={`hidden lg:flex lg:w-7/12 p-12 xl:p-16 flex-col justify-between relative z-10 border-r ${t.hero} backdrop-blur-2xl transition-colors duration-500`}
      >
        <div>
          {/* Badge */}
          <div className="flex items-center gap-3 mb-10">
            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase bg-[#d4af37]/10 border border-[#d4af37]/30 ${t.badge} transition-colors duration-500`}>
              <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
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
            <span className="bg-gradient-to-r from-[#f3e5ab] via-[#d4af37] to-[#c5a059] bg-clip-text text-transparent">
              Every Hiring Decision.
            </span>
          </h1>
          <p className={`text-base max-w-lg mb-10 leading-relaxed ${t.heroSub} transition-colors duration-500`}>
            Automated resume parsing with Groq AI, proctored coding assessments with anti-cheat protection, and WebRTC video interviews with audio evaluation.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-4 max-w-xl">
            {[
              { icon: <FaRobot className="text-[#d4af37]" />, title: "AI Resume Parsing", desc: "Structured Groq Llama 3.1 8B data extraction" },
              { icon: <FaCode className="text-[#c5a059]" />, title: "Proctored Compiler", desc: "8 languages with 7 anti-cheat layers" },
              { icon: <FaVideo className="text-[#e5c158]" />, title: "WebRTC Interviews", desc: "Live webcam stream & Whisper v3 audio evaluation" },
              { icon: <FaShieldAlt className="text-[#d4af37]" />, title: "Multi-Role Architecture", desc: "Enterprise HR & University placement management" },
            ].map((f, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl ${t.featureCard} hover:border-[#d4af37]/40 transition-all duration-300 backdrop-blur-md`}
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="p-2 rounded-lg bg-[#d4af37]/10 text-sm">{f.icon}</div>
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
                className="w-14 h-14 rounded-full object-cover border-2 border-[#d4af37] shadow-lg"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#d4af37] border-2 border-[#080c14] flex items-center justify-center text-[9px] text-[#080c14] font-bold">★</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-bold ${t.founderText} transition-colors duration-500`}>Sankalp Nigam</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37]/20 text-[#e5c158] border border-[#d4af37]/30">Founder &amp; Architect</span>
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
          <span className="flex items-center gap-1.5 text-[#d4af37]">
            <FaCheckCircle className="text-xs" /> Verified Secure System
          </span>
        </div>
      </motion.div>

      {/* ── Right Panel (Login Form) ──────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
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
            <p className="mt-3 text-xs font-semibold text-[#d4af37] tracking-widest uppercase">
              AI Recruitment &amp; Assessment System
            </p>
          </div>

          {/* Glass Card */}
          <div className={`${t.card} backdrop-blur-2xl rounded-3xl p-8 sm:p-10 relative overflow-hidden transition-colors duration-500`}>
            {/* Top Accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

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
                  <FaEnvelope className={`absolute left-4 top-1/2 -translate-y-1/2 ${t.icon} group-focus-within:text-[#d4af37] transition-colors`} />
                  <input
                    type="email"
                    name="email"
                    placeholder="name@company.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className={`w-full pl-11 pr-4 py-3.5 border rounded-2xl outline-none text-sm transition-all duration-300 focus:ring-2 focus:ring-[#d4af37]/20 ${t.input}`}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`text-xs font-semibold uppercase tracking-wider ${t.label} transition-colors duration-500`}>
                    Password
                  </label>
                </div>
                <div className="relative group">
                  <FaLock className={`absolute left-4 top-1/2 -translate-y-1/2 ${t.icon} group-focus-within:text-[#d4af37] transition-colors`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••••••"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className={`w-full pl-11 pr-12 py-3.5 border rounded-2xl outline-none text-sm transition-all duration-300 focus:ring-2 focus:ring-[#d4af37]/20 ${t.input}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${t.icon} hover:text-[#d4af37] transition-colors`}
                  >
                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
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

              {/* University + Register */}
              <div className="space-y-3">
                <Link
                  to="/lpu-login"
                  className={`w-full py-3 rounded-2xl border font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-300 ${t.btnLpu}`}
                >
                  <FaBuilding className={`text-sm ${t.btnLpuIcon}`} />
                  LPU University Campus Login
                </Link>

                <div className="text-center pt-2">
                  <span className={`text-xs ${t.heroSub} transition-colors duration-500`}>Need a candidate or HR account? </span>
                  <Link to="/register" className="text-xs font-semibold text-[#d4af37] hover:underline">
                    Register Here
                  </Link>
                </div>
              </div>
            </form>
          </div>

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
