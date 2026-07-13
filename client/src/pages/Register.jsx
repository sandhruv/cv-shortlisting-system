import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock, FaUserTag, FaBuilding } from "react-icons/fa";
import api from "../services/api";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Student",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/register", form);
      alert(res.data.message);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-11 h-11 bg-[#0f172a] rounded-xl flex items-center justify-center shadow-sm">
              <FaBuilding className="text-white text-xl" />
            </div>
            <span className="text-2xl font-semibold text-[#0f172a] tracking-tight">
              Nexus<span className="text-[#1e293b]">Corp</span>
            </span>
          </div>
          <p className="text-[#64748b] text-xs font-medium uppercase tracking-widest">
            Create your account
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e9edf4] p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#0f172a]">Create account</h1>
            <p className="text-[#64748b] text-sm mt-1">Join the enterprise network</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-[#1e293b] block mb-1.5">Full name</label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#fafcff] border border-[#e2e8f0] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] outline-none transition focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/5 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#1e293b] block mb-1.5">Email address</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
                <input
                  type="email"
                  name="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#fafcff] border border-[#e2e8f0] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] outline-none transition focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/5 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#1e293b] block mb-1.5">Role</label>
              <div className="relative">
                <FaUserTag className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#fafcff] border border-[#e2e8f0] rounded-lg text-[#0f172a] outline-none transition focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/5 text-sm appearance-none"
                >
                  <option value="Student">Student</option>
                  <option value="HR">HR</option>
                  {/* Admin option hidden – only you can be Admin */}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#1e293b] block mb-1.5">Password</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#fafcff] border border-[#e2e8f0] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] outline-none transition focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/5 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 rounded-lg font-medium text-white text-sm transition-all ${
                isLoading
                  ? "bg-[#0f172a]/60 cursor-not-allowed"
                  : "bg-[#0f172a] hover:bg-[#1e293b] active:scale-[0.98] shadow-sm hover:shadow-md"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e2e8f0]"></div></div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-[#94a3b8]">Secure registration</span>
              </div>
            </div>

            <p className="text-center text-sm text-[#64748b]">
              Already have an account?{" "}
              <Link to="/" className="font-medium text-[#0f172a] hover:underline underline-offset-2 transition">
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-[#94a3b8] tracking-wide">
            &copy; {new Date().getFullYear()} NexusCorp. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
