import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaBuilding } from "react-icons/fa";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("Login Data:", form);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#334155] rounded-full opacity-20" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#334155] rounded-full opacity-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <FaBuilding className="text-2xl" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Nexus<span className="text-[#60a5fa]">Corp</span></span>
          </div>
          <div className="mt-16">
            <h2 className="text-3xl font-bold leading-tight">Enterprise‑grade<br/>access control</h2>
            <p className="mt-4 text-white/70 text-sm max-w-sm">Secure, scalable, and built for modern teams.</p>
          </div>
        </div>
        <div className="relative z-10 text-sm text-white/40">
          &copy; {new Date().getFullYear()} NexusCorp. All rights reserved.
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold text-[#0f172a]">Welcome back</h1>
            <p className="text-[#64748b] mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label className="text-sm font-medium text-[#1e293b] block mb-1.5">Email address</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type="email"
                  name="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[#0f172a] placeholder:text-[#94a3b8] outline-none transition focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/5"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-[#1e293b]">Password</label>
                <Link to="/forgot-password" className="text-sm font-medium text-[#0f172a] hover:text-[#1e293b]">Forgot?</Link>
              </div>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-10 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[#0f172a] placeholder:text-[#94a3b8] outline-none transition focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]"
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-[#475569] cursor-pointer">
                <input type="checkbox" className="rounded border-[#d1d5db] text-[#0f172a]" />
                Keep me signed in
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl font-medium text-white text-sm transition-all ${
                isLoading
                  ? "bg-[#0f172a]/60 cursor-not-allowed"
                  : "bg-[#0f172a] hover:bg-[#1e293b] active:scale-[0.98] shadow-sm hover:shadow-md"
              }`}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>

            <div className="text-center text-sm text-[#64748b]">
              Don't have an account?{" "}
              <Link to="/register" className="font-medium text-[#0f172a] hover:underline">Create one</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
