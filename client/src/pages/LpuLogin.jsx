import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaBuilding } from "react-icons/fa";
import { motion } from "framer-motion";
import api from "../services/api";

function LpuLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ uid: "", password: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/lpu-login", {
        uid: form.uid,
        password: form.password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      const role = res.data.user.role;
      if (role === "Admin" || role === "LPU Admin") navigate("/lpu-admin");
      else if (role === "LPU Faculty") navigate("/lpu-faculty");
      else if (role === "LPU Student") navigate("/lpu-student");
      else navigate("/student");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0d131f] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGwxMiAxMi0xMiAxMi0xMi0xMiAxMi0xMnpNMTggMzZsMTIgMTItMTIgMTItMTItMTIgMTItMTJ6IiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>

      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1e0a29] via-[#2c0e3a] to-[#0d131f] p-12 flex-col justify-between relative overflow-hidden"
      >
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#ff6b2b]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#ff6b2b]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/5 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-20">
            <div className="w-12 h-12 bg-gradient-to-br from-[#ff6b2b] to-[#ff8c52] rounded-xl flex items-center justify-center shadow-2xl shadow-[#ff6b2b]/20 border border-white/10">
              <FaBuilding className="text-[#0d131f] text-2xl" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              LPU<span className="text-[#ff6b2b]">Portal</span>
            </span>
          </div>

          <h2 className="text-5xl font-bold text-white leading-[1.15] tracking-tight mb-6">
            University<br />
            <span className="bg-gradient-to-r from-[#ff8c52] to-[#ff6b2b] bg-clip-text text-transparent">Access Hub</span>
          </h2>
          <p className="text-white/50 text-base max-w-sm mb-12 leading-relaxed">
            Exclusive platform for Lovely Professional University administration, faculty, and students.
          </p>
        </div>

        <div className="relative z-10 text-white/20 text-sm tracking-widest">
          © {new Date().getFullYear()} LPU — Confidential
        </div>
      </motion.div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 lg:py-0 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full max-w-[440px] relative z-10"
        >
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/10 shadow-2xl shadow-black/20">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ff6b2b] to-[#ff8c52] rounded-xl flex items-center justify-center">
                <FaBuilding className="text-[#0d131f] text-xl" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                LPU<span className="text-[#ff6b2b]">Portal</span>
              </span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/40 hover:shadow-black/50 transition-shadow duration-500">
            <div className="mb-7">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">LPU Login</h1>
              <p className="text-white/40 text-sm mt-1">Sign in with your University UID</p>
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
                  University UID
                </label>
                <div className="relative group">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#ff6b2b] transition-colors" />
                  <input
                    type="text"
                    name="uid"
                    placeholder="Enter your UID"
                    value={form.uid}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 outline-none transition-all duration-200 focus:bg-white/10 focus:border-[#ff6b2b]/40 focus:ring-2 focus:ring-[#ff6b2b]/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-white/70 block mb-1.5">Password</label>
                <div className="relative group">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#ff6b2b] transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 outline-none transition-all duration-200 focus:bg-white/10 focus:border-[#ff6b2b]/40 focus:ring-2 focus:ring-[#ff6b2b]/20"
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

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  isLoading
                    ? "bg-[#ff6b2b]/30 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#ff6b2b] to-[#ff8c52] text-[#0d131f] hover:from-[#ff8c52] hover:to-[#ff6b2b] active:scale-[0.98] shadow-lg shadow-[#ff6b2b]/10 hover:shadow-[#ff6b2b]/20"
                }`}
              >
                {isLoading ? "Signing in..." : "Sign in to LPU"}
              </button>

              <div className="mt-4 text-center">
                <Link 
                  to="/login" 
                  className="text-sm text-white/40 hover:text-white transition-colors"
                >
                  Back to standard login
                </Link>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default LpuLogin;
