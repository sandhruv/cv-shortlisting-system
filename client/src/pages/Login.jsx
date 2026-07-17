import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaBuilding } from "react-icons/fa";
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
      setError(err.response?.data?.message || "Login failed. Please try again.");
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0d131f] relative overflow-hidden">

      {/* Subtle animated background overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGwxMiAxMi0xMiAxMi0xMi0xMiAxMi0xMnpNMTggMzZsMTIgMTItMTIgMTItMTItMTIgMTItMTJ6IiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>

      {/* Left Panel – Brand with unique gradient texture */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0f1a2e] via-[#1a2a40] to-[#0d131f] p-12 flex-col justify-between relative overflow-hidden"
      >
        {/* Decorative abstract shapes */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#b8860b]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#b8860b]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/5 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-20">
            <div className="w-12 h-12 bg-gradient-to-br from-[#b8860b] to-[#d4af37] rounded-xl flex items-center justify-center shadow-2xl shadow-[#b8860b]/20 border border-white/10">
              <FaBuilding className="text-[#0d131f] text-2xl" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              Nexus<span className="text-[#d4af37]">Corp</span>
            </span>
          </div>

          <h2 className="text-5xl font-bold text-white leading-[1.15] tracking-tight mb-6">
            Secure<br />
            <span className="bg-gradient-to-r from-[#d4af37] to-[#b8860b] bg-clip-text text-transparent">Access Hub</span>
          </h2>
          <p className="text-white/50 text-base max-w-sm mb-12 leading-relaxed">
            Your centralized platform for AI‑driven recruitment, role management, and real‑time analytics.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 text-white/70 group cursor-default">
              <div className="w-8 h-8 bg-[#d4af37]/10 rounded-lg flex items-center justify-center text-[#d4af37] group-hover:bg-[#d4af37]/20 transition-colors">
                <span className="text-lg">✦</span>
              </div>
              <span>Role‑based access (Admin, HR, Student)</span>
            </div>
            <div className="flex items-center gap-4 text-white/70 group cursor-default">
              <div className="w-8 h-8 bg-[#d4af37]/10 rounded-lg flex items-center justify-center text-[#d4af37] group-hover:bg-[#d4af37]/20 transition-colors">
                <span className="text-lg">◇</span>
              </div>
              <span>AI‑powered candidate screening & ranking</span>
            </div>
            <div className="flex items-center gap-4 text-white/70 group cursor-default">
              <div className="w-8 h-8 bg-[#d4af37]/10 rounded-lg flex items-center justify-center text-[#d4af37] group-hover:bg-[#d4af37]/20 transition-colors">
                <span className="text-lg">◈</span>
              </div>
              <span>Real‑time analytics & interview scheduling</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/20 text-sm tracking-widest">
          © {new Date().getFullYear()} NexusCorp — Confidential
        </div>
      </motion.div>

      {/* Right Panel – Login Card with unique styling */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 lg:py-0 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full max-w-[440px] relative z-10"
        >
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/10 shadow-2xl shadow-black/20">
              <div className="w-10 h-10 bg-gradient-to-br from-[#b8860b] to-[#d4af37] rounded-xl flex items-center justify-center">
                <FaBuilding className="text-[#0d131f] text-xl" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                Nexus<span className="text-[#d4af37]">Corp</span>
              </span>
            </div>
            <p className="mt-3 text-xs font-light text-white/50 tracking-[0.2em] uppercase">
              Secure Access Portal
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/40 hover:shadow-black/50 transition-shadow duration-500">
            <div className="mb-7">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Welcome back</h1>
              <p className="text-white/40 text-sm mt-1">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2 backdrop-blur-sm"
                >
                  <span className="text-rose-400 text-base">⚠</span> {error}
                </motion.div>
              )}

              <div>
                <label className="text-sm font-medium text-white/70 block mb-1.5">
                  Email address
                </label>
                <div className="relative group">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#d4af37] transition-colors" />
                  <input
                    type="email"
                    name="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 outline-none transition-all duration-200 focus:bg-white/10 focus:border-[#d4af37]/40 focus:ring-2 focus:ring-[#d4af37]/20"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-medium text-white/70">Password</label>
                  <Link to="/forgot-password" className="text-sm font-medium text-[#d4af37] hover:text-[#b8860b] transition-colors underline-offset-2 hover:underline">
                    Forgot?
                  </Link>
                </div>
                <div className="relative group">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#d4af37] transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 outline-none transition-all duration-200 focus:bg-white/10 focus:border-[#d4af37]/40 focus:ring-2 focus:ring-[#d4af37]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:bg-[#d4af37] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                  <span className="ml-3 text-sm text-white/50 select-none">Keep me signed in</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  isLoading
                    ? "bg-[#d4af37]/30 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-[#0d131f] hover:from-[#b8860b] hover:to-[#d4af37] active:scale-[0.98] shadow-lg shadow-[#d4af37]/10 hover:shadow-[#d4af37]/20"
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-[#0d131f]" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-transparent text-white/20 tracking-[0.15em]">Secure access</span>
                </div>
              </div>

              <p className="text-center text-sm text-white/40">
                Don't have an account?{" "}
                <Link to="/register" className="font-semibold text-[#d4af37] hover:text-[#b8860b] transition-colors underline-offset-2 hover:underline">
                  Create one
                </Link>
              </p>
            </form>
          </div>

          <div className="lg:hidden text-center mt-8">
            <p className="text-[10px] text-white/20 tracking-widest">
              © {new Date().getFullYear()} NexusCorp — Confidential
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;