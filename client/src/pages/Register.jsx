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

  // Golden dark theme colors
  const theme = {
    bg: '#0a0a0a',
    bgCard: '#1a1a1a',
    bgInput: '#0d0d0d',
    border: '#2a2a2a',
    text: '#f5f0e8',
    textSecondary: '#b8a88a',
    gold: '#d4a843',
    goldLight: '#f0d080',
    goldDark: '#b8922f',
    goldGlow: 'rgba(212, 168, 67, 0.15)',
  };

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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: theme.bg }}>
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: theme.gold }}>
              <FaBuilding className="text-white text-xl" />
            </div>
            <span className="text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>
              Nexus<span style={{ color: theme.gold }}>Corp</span>
            </span>
          </div>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: theme.textSecondary }}>
            Create your account
          </p>
        </div>

        <div className="rounded-2xl shadow-xl border p-8" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>Create account</h1>
            <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>Join the enterprise network</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="border px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
                {error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: theme.text }}>Full name</label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: theme.textSecondary }} />
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg placeholder:text-sm outline-none transition focus:ring-2"
                  style={{ 
                    backgroundColor: theme.bg, 
                    borderColor: theme.border, 
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    focusRing: `2px solid ${theme.goldGlow}`
                  }}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: theme.text }}>Email address</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: theme.textSecondary }} />
                <input
                  type="email"
                  name="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg placeholder:text-sm outline-none transition focus:ring-2"
                  style={{ 
                    backgroundColor: theme.bg, 
                    borderColor: theme.border, 
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    focusRing: `2px solid ${theme.goldGlow}`
                  }}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: theme.text }}>Role</label>
              <div className="relative">
                <FaUserTag className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: theme.textSecondary }} />
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg outline-none transition focus:ring-2 appearance-none"
                  style={{ 
                    backgroundColor: theme.bg, 
                    borderColor: theme.border, 
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    focusRing: `2px solid ${theme.goldGlow}`
                  }}
                >
                  <option value="Student" style={{ backgroundColor: theme.bgCard, color: theme.text }}>Student</option>
                  <option value="HR" style={{ backgroundColor: theme.bgCard, color: theme.text }}>HR</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: theme.text }}>Password</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: theme.textSecondary }} />
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg placeholder:text-sm outline-none transition focus:ring-2"
                  style={{ 
                    backgroundColor: theme.bg, 
                    borderColor: theme.border, 
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    focusRing: `2px solid ${theme.goldGlow}`
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 rounded-lg font-medium text-white text-sm transition-all ${
                isLoading
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:opacity-90 active:scale-[0.98] shadow-lg hover:shadow-xl"
              }`}
              style={{ backgroundColor: isLoading ? theme.goldDark : theme.gold }}
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
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: theme.border }}></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3" style={{ backgroundColor: theme.bgCard, color: theme.textSecondary }}>Secure registration</span>
              </div>
            </div>

            <p className="text-center text-sm" style={{ color: theme.textSecondary }}>
              Already have an account?{" "}
              <Link to="/" className="font-medium hover:underline underline-offset-2 transition" style={{ color: theme.gold }}>
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs tracking-wide" style={{ color: theme.textSecondary }}>
            &copy; {new Date().getFullYear()} NexusCorp. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;