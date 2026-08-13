import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaBuilding, FaRobot, FaShieldAlt, FaCode, FaVideo, FaCheckCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#080c14] text-slate-100 relative overflow-hidden font-sans">

      {/* ── Refined Subtle Warm Ambient Glow Background (No Loud Blue Blobs) ── */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-[#d4af37]/10 via-[#8b1a1a]/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[650px] h-[650px] bg-gradient-to-tl from-[#d4af37]/10 via-purple-950/15 to-transparent rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 pointer-events-none" />

      {/* ── Left Hero Panel (Enterprise Branding & Platform Features) ─────── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="hidden lg:flex lg:w-7/12 p-12 xl:p-16 flex-col justify-between relative z-10 border-r border-white/10 bg-[#0d1320]/60 backdrop-blur-2xl"
      >
        <div>
          {/* Executive Tagline Badge */}
          <div className="flex items-center gap-3 mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#e5c158]">
              <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
              Enterprise Recruitment &amp; Assessment Infrastructure
            </span>
          </div>

          {/* Official Vettora Logo Presentation */}
          <div className="mb-10 inline-block">
            <div className="p-3 rounded-2xl bg-[#090d16] border border-[#d4af37]/30 shadow-[0_0_30px_rgba(212,175,55,0.12)]">
              <img
                src="/vettora-logo.png"
                alt="Vettora — Intelligence Behind Every Hire"
                className="h-28 max-w-full object-contain rounded-xl"
              />
            </div>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold tracking-tight text-white leading-[1.18] mb-4">
            Intelligence Behind<br />
            <span className="bg-gradient-to-r from-[#f3e5ab] via-[#d4af37] to-[#c5a059] bg-clip-text text-transparent">
              Every Hiring Decision.
            </span>
          </h1>
          <p className="text-slate-400 text-base max-w-lg mb-10 leading-relaxed">
            Automated resume parsing with Groq AI, proctored coding assessments with anti-cheat protection, and WebRTC video interviews with audio evaluation.
          </p>

          {/* Clean Enterprise Feature Grid */}
          <div className="grid grid-cols-2 gap-4 max-w-xl">
            {[
              { icon: <FaRobot className="text-[#d4af37]" />, title: "AI Resume Parsing", desc: "Structured Groq Llama 3.1 8B data extraction" },
              { icon: <FaCode className="text-[#c5a059]" />, title: "Proctored Compiler", desc: "8 languages with 7 anti-cheat layers" },
              { icon: <FaVideo className="text-[#e5c158]" />, title: "WebRTC Interviews", desc: "Live webcam stream & Whisper v3 audio evaluation" },
              { icon: <FaShieldAlt className="text-[#d4af37]" />, title: "Multi-Role Architecture", desc: "Enterprise HR & University placement management" },
            ].map((f, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#d4af37]/40 transition-all duration-300 backdrop-blur-md"
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="p-2 rounded-lg bg-[#d4af37]/10 text-sm">{f.icon}</div>
                  <span className="text-xs font-semibold text-slate-200">{f.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Founder Spotlight Card */}
          <div className="mt-8 p-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37]/10 via-white/[0.03] to-transparent border border-[#d4af37]/30 flex items-center gap-4 max-w-xl backdrop-blur-md shadow-lg">
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
                <h3 className="text-sm font-bold text-white">Sankalp Nigam</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37]/20 text-[#e5c158] border border-[#d4af37]/30">Founder &amp; Architect</span>
              </div>
              <p className="text-xs text-slate-300 italic mt-0.5">
                "Architecting the future of intelligent, automated hiring infrastructure."
              </p>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-8 border-t border-white/10">
          <span>&copy; {new Date().getFullYear()} Vettora Platform. Confidential &amp; Proprietary.</span>
          <span className="flex items-center gap-1.5 text-[#d4af37]">
            <FaCheckCircle className="text-xs" /> Verified Secure System
          </span>
        </div>
      </motion.div>

      {/* ── Right Panel (Login Form Card) ──────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-[440px]"
        >
          {/* Mobile Header Branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-block p-3 rounded-2xl bg-[#090d16] border border-[#d4af37]/30 shadow-lg">
              <img src="/vettora-logo.png" alt="Vettora Logo" className="h-16 object-contain rounded-xl" />
            </div>
            <p className="mt-3 text-xs font-semibold text-[#d4af37] tracking-widest uppercase">
              AI Recruitment &amp; Assessment System
            </p>
          </div>

          {/* Executive Glass Card */}
          <div className="bg-[#0e1422]/85 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 sm:p-10 shadow-[0_25px_70px_rgba(0,0,0,0.7)] relative overflow-hidden">
            
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

            <div className="mb-8 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Account Sign In</h2>
              <p className="text-slate-400 text-sm mt-1.5">Enter your credentials to access the Vettora portal</p>
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

              {/* Email Field */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Corporate Email
                </label>
                <div className="relative group">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#d4af37] transition-colors" />
                  <input
                    type="email"
                    name="email"
                    placeholder="name@company.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-[#070a12] border border-slate-700/80 rounded-2xl text-white placeholder:text-slate-500 outline-none text-sm transition-all duration-300 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative group">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#d4af37] transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••••••"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-12 py-3.5 bg-[#070a12] border border-slate-700/80 rounded-2xl text-white placeholder:text-slate-500 outline-none text-sm transition-all duration-300 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button (Metallic Gold Theme) */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
                  isLoading
                    ? "bg-[#d4af37]/30 cursor-not-allowed text-slate-300"
                    : "bg-gradient-to-r from-[#d4af37] via-[#c5a059] to-[#996515] text-[#070a12] hover:brightness-110 active:scale-[0.99] shadow-[#d4af37]/15"
                }`}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#070a12] border-t-transparent rounded-full animate-spin" />
                    Authenticating…
                  </>
                ) : (
                  "Sign In to Portal →"
                )}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-[#0e1422] text-slate-500 uppercase tracking-widest text-[10px]">Portal Options</span>
                </div>
              </div>

              {/* University Campus Button */}
              <div className="space-y-3">
                <Link
                  to="/lpu-login"
                  className="w-full py-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all duration-300"
                >
                  <FaBuilding className="text-amber-400 text-sm" />
                  LPU University Campus Login
                </Link>

                <div className="text-center pt-2">
                  <span className="text-xs text-slate-400">Need a candidate or HR account? </span>
                  <Link to="/register" className="text-xs font-semibold text-[#d4af37] hover:underline">
                    Register Here
                  </Link>
                </div>
              </div>
            </form>
          </div>

          {/* Footer Encryption Security Note */}
          <div className="text-center mt-6">
            <p className="text-[11px] text-slate-500 tracking-wider">
              🔒 256-Bit TLS Encrypted &bull; AI Hiring Engine Active
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;