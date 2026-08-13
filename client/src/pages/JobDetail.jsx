import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaMapMarkerAlt, FaBuilding, FaClock, FaUser, FaCheckCircle,
  FaTimesCircle, FaArrowLeft, FaExternalLinkAlt, FaSignOutAlt,
  FaUsers, FaCalendarAlt, FaBriefcase,
} from "react-icons/fa";
import { motion } from "framer-motion";
import api from "../services/api";
import Toast, { useToast } from "../components/Toast";

function MatchBar({ percent }) {
  const color = percent >= 70 ? "#4ade80" : percent >= 40 ? "#fbbf24" : "#ff6b2b";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }} className="h-full rounded-full" style={{ background: color }} />
      </div>
      <span className="text-sm font-bold" style={{ color }}>{percent}%</span>
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toasts, add: toast, remove: removeToast } = useToast();

  const [job, setJob] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    Promise.all([
      api.get(`/jobs`).catch(() => ({ data: [] })),
      api.get("/profile/me").catch(() => ({ data: null })),
    ]).then(([jobsRes, profileRes]) => {
      const found = jobsRes.data.find((j) => j._id === id);
      setJob(found);
      setProfile(profileRes.data);
      if (found && profileRes.data?.skills?.length) {
        const jobSkills = extractSkills(found.requirements || "");
        const match = calculateMatch(jobSkills, profileRes.data.skills);
        setApplied(false);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const extractSkills = (text) => {
    if (!text) return [];
    const common = ["react", "node", "python", "java", "javascript", "typescript", "css", "html", "mongodb", "sql", "express", "angular", "vue", "django", "flask", "spring", "aws", "docker", "kubernetes", "git", "redis", "graphql", "rest", "api", "sql", "nosql", "linux", "figma", "photoshop", "tailwind", "bootstrap", "svelte", "next", "nuxt", "rails", "php", "laravel", "swift", "kotlin", "flutter", "react native", "mongo", "postgres", "mysql", "firebase", "supabase", "tensorflow", "pytorch", "ml", "ai", "data science", "blockchain", "web3", "solidity", "cybersecurity", "devops", "ci/cd", "jenkins", "terraform", "ansible"];
    const lower = text.toLowerCase();
    return common.filter((s) => lower.includes(s));
  };

  const calculateMatch = (jobSkills, profileSkills) => {
    if (!jobSkills.length || !profileSkills.length) return 0;
    const ps = profileSkills.map((s) => s.toLowerCase());
    const matched = jobSkills.filter((s) => ps.some((p) => p.includes(s) || s.includes(p)));
    return Math.round((matched.length / jobSkills.length) * 100);
  };

  const matchSkills = (() => {
    if (!job || !profile?.skills) return { percent: 0, matched: [], missing: [] };
    const jobSkills = extractSkills(job.requirements || "");
    const ps = profile.skills.map((s) => s.toLowerCase());
    const matched = jobSkills.filter((s) => ps.some((p) => p.includes(s) || s.includes(p)));
    const missing = jobSkills.filter((s) => !matched.includes(s));
    const percent = jobSkills.length ? Math.round((matched.length / jobSkills.length) * 100) : 0;
    return { percent, matched, missing };
  })();

  const handleApply = async () => {
    setApplying(true);
    try {
      await api.post("/applications", { jobId: job._id });
      setApplied(true);
      toast("Application submitted!");
    } catch (err) { toast(err.response?.data?.message || "Failed to apply", "error"); }
    setApplying(false);
  };

  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d131f] via-[#1a2a40] to-[#0d131f] flex items-center justify-center">
      <div className="text-white/50">Loading job...</div>
    </div>
  );

  if (!job) return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d131f] via-[#1a2a40] to-[#0d131f] flex items-center justify-center">
      <div className="text-center">
        <p className="text-white/50 mb-4">Job not found</p>
        <button onClick={() => navigate(-1)} className="text-[#ff6b2b] hover:underline text-sm">Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d131f] via-[#1a2a40] to-[#0d131f] relative overflow-hidden">
      <Toast toasts={toasts} remove={removeToast} />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGwxMiAxMi0xMiAxMi0xMi0xMiAxMi0xMnpNMTggMzZsMTIgMTItMTIgMTItMTItMTIgMTItMTJ6IiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>

      {/* Header */}
      <header className="relative z-20 bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-3 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-3">
          <img src="/vettora-logo.png" alt="Vettora" className="h-9 object-contain rounded-lg border border-white/10 p-0.5 bg-black/30" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition"><FaArrowLeft size={14} /> Back</button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition">
            <FaSignOutAlt size={14} /> Sign out
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">{job.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-white/50">
                    <span className="flex items-center gap-1.5"><FaBuilding size={12} /> {job.postedBy?.name || "Company"}</span>
                    <span className="flex items-center gap-1.5"><FaMapMarkerAlt size={12} /> {job.location}</span>
                    <span className="flex items-center gap-1.5"><FaClock size={12} /> {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {job.scope === "lpu" && (
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium border border-purple-500/30">LPU</span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2"><FaBriefcase size={12} className="text-[#ff6b2b]" /> Description</h3>
                  <p className="text-sm text-white/60 whitespace-pre-wrap leading-relaxed">{job.description}</p>
                </div>

                {job.requirements && (
                  <div>
                    <h3 className="text-sm font-semibold text-white/80 mb-2">Requirements</h3>
                    <div className="text-sm text-white/60 whitespace-pre-wrap leading-relaxed">
                      {job.requirements.split("\n").map((line, i) => (
                        <div key={i} className="flex items-start gap-2 mb-1">
                          <span className="text-[#ff6b2b] mt-1">•</span>
                          <span>{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3">
                {applied ? (
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                    <FaCheckCircle /> Applied Successfully
                  </div>
                ) : (
                  <button onClick={handleApply} disabled={applying}
                    className={`px-6 py-2.5 bg-[#ff6b2b] text-[#0d131f] rounded-xl font-semibold text-sm hover:brightness-110 transition ${applying ? "opacity-50 cursor-not-allowed" : ""}`}>
                    {applying ? "Applying..." : "Apply Now"}
                  </button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Skill Match */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/80 mb-3">Skill Match</h3>
              <MatchBar percent={matchSkills.percent} />
              {matchSkills.matched.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-green-400 mb-1.5">Matching Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {matchSkills.matched.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full text-xs border border-green-500/20">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {matchSkills.missing.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-white/40 mb-1.5">Missing Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {matchSkills.missing.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-white/5 text-white/40 rounded-full text-xs border border-white/10">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Job Info */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/80 mb-3">Job Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40 flex items-center gap-2"><FaBuilding size={12} /> Posted By</span>
                  <span className="text-white/70">{job.postedBy?.name || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40 flex items-center gap-2"><FaMapMarkerAlt size={12} /> Location</span>
                  <span className="text-white/70">{job.location}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40 flex items-center gap-2"><FaCalendarAlt size={12} /> Posted</span>
                  <span className="text-white/70">{new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
                {job.allocatedFaculty && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40 flex items-center gap-2"><FaUser size={12} /> Faculty</span>
                    <span className="text-white/70">{job.allocatedFaculty.name}</span>
                  </div>
                )}
                {job.allocatedStudents?.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40 flex items-center gap-2"><FaUsers size={12} /> Assigned</span>
                    <span className="text-white/70">{job.allocatedStudents.length} students</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/80 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button onClick={() => navigate("/student")}
                  className="w-full py-2 text-sm text-white/60 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition flex items-center justify-center gap-2">
                  <FaBriefcase size={12} /> Browse More Jobs
                </button>
                <button onClick={() => navigate("/profile")}
                  className="w-full py-2 text-sm text-white/60 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition flex items-center justify-center gap-2">
                  <FaUser size={12} /> View Profile
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
