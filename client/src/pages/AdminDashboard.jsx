import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUsers, FaBriefcase, FaFileAlt, FaUserPlus, FaTrash, FaChartBar,
  FaBuilding, FaSignOutAlt, FaUserTie, FaUserGraduate, FaCalendarAlt,
  FaSearch, FaDownload, FaFilter, FaChevronLeft, FaChevronRight,
  FaCheckCircle, FaTimesCircle, FaEye, FaSpinner, FaEnvelope,
  FaPhone, FaCode, FaCertificate, FaInfoCircle, FaTimes, FaExclamationTriangle,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const PAGE_SIZE = 10;
const TABS = [
  { key: "overview",     label: "Overview",     icon: FaChartBar },
  { key: "jobs",         label: "Jobs",         icon: FaBriefcase },
  { key: "applications", label: "Applications", icon: FaFileAlt },
  { key: "resumes",      label: "Resumes",      icon: FaFileAlt },
  { key: "users",        label: "Users",        icon: FaUsers },
  { key: "interviews",   label: "Interviews",   icon: FaCalendarAlt },
];

const ROLES = ["Student", "HR", "Admin", "LPU Admin", "LPU Faculty", "LPU Student"];
const SUBSCRIPTION_PLANS = [
  { value: "trial",    label: "Trial (3 days)" },
  { value: "monthly",  label: "Monthly (₹200)" },
  { value: "yearly",   label: "Yearly" },
  { value: "inactive", label: "Inactive" },
];

/* ═══════════════════════════════════════════════════════════════
   TOAST COMPONENT
═══════════════════════════════════════════════════════════════ */
function Toast({ toasts, remove }) {
  return (
    <div className="fixed top-5 right-5 z-[999] space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl max-w-sm ${
              t.type === "success"
                ? "bg-green-950/80 border-green-500/30 text-green-200"
                : t.type === "error"
                ? "bg-rose-950/80 border-rose-500/30 text-rose-200"
                : "bg-[#1a2a40]/90 border-white/10 text-white"
            }`}
          >
            {t.type === "success" ? <FaCheckCircle className="text-green-400 shrink-0" /> :
             t.type === "error" ? <FaTimesCircle className="text-rose-400 shrink-0" /> :
             <FaInfoCircle className="text-blue-400 shrink-0" />}
            <span className="text-sm flex-1">{t.message}</span>
            <button onClick={() => remove(t.id)} className="text-white/40 hover:text-white shrink-0"><FaTimes size={12} /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONFIRM MODAL
═══════════════════════════════════════════════════════════════ */
function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1a2a40] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-rose-500/10"><FaExclamationTriangle className="text-rose-400" /></div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="text-sm text-white/60 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm border border-white/10 rounded-lg hover:bg-white/5 transition text-white/60">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition font-semibold">Delete</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SKELETON LOADER
═══════════════════════════════════════════════════════════════ */
function Skeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden animate-pulse">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-6 py-4 border-b border-white/5">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 bg-white/5 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SEARCH BAR
═══════════════════════════════════════════════════════════════ */
function SearchBar({ value, onChange, placeholder, filter, filterOptions, onFilterChange, resultCount }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      <div className="relative flex-1">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition"
        />
      </div>
      {filterOptions && (
        <div className="relative">
          <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs" />
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#d4af37] appearance-none cursor-pointer"
          >
            <option value="all">All</option>
            {filterOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}
      {resultCount !== undefined && (
        <div className="flex items-center text-xs text-white/40">
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGINATION
═══════════════════════════════════════════════════════════════ */
function Pagination({ page, total, onPageChange }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-white/5">
      <span className="text-xs text-white/40">
        Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 0}
          className="p-1.5 rounded-lg border border-white/10 text-white/50 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition">
          <FaChevronLeft size={12} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} onClick={() => onPageChange(i)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
              i === page ? "bg-[#d4af37] text-[#0d131f]" : "text-white/50 hover:bg-white/5"
            }`}>
            {i + 1}
          </button>
        ))}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages - 1}
          className="p-1.5 rounded-lg border border-white/10 text-white/50 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition">
          <FaChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EXPORT CSV
═══════════════════════════════════════════════════════════════ */
function exportCSV(headers, rows, filename) {
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")];
  const blob = new Blob(["\uFEFF" + csv.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════════════════
   STAT CARD
═══════════════════════════════════════════════════════════════ */
function StatCard({ label, value, icon: Icon, color = "#d4af37", delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:border-[#d4af37]/20 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value ?? "—"}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-white/10 transition">
          <Icon className="text-lg" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FUNNEL BAR
═══════════════════════════════════════════════════════════════ */
function FunnelBar({ label, count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 text-white/50 text-right">{label}</span>
      <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
      <span className="w-16 text-white font-semibold">{count}</span>
      <span className="w-14 text-white/30 text-xs">{pct.toFixed(0)}%</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();

  // ── State ──
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [users, setUsers] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Toast ──
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  // ── Search & Filter ──
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);

  // ── Confirm Modal ──
  const [confirm, setConfirm] = useState({ open: false, title: "", message: "", onConfirm: null });

  // ── Create User Modal ──
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Student", password: "" });

  // ── Detail Panel ──
  const [detailItem, setDetailItem] = useState(null);
  const [detailType, setDetailType] = useState(null);

  // ═══════════════════════════════════════════════════════════
  // FETCH DATA
  // ═══════════════════════════════════════════════════════════
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, j, a, r, u, iv] = await Promise.all([
        api.get("/admin/stats").catch(() => ({ data: null })),
        api.get("/admin/jobs").catch(() => ({ data: [] })),
        api.get("/admin/applications").catch(() => ({ data: [] })),
        api.get("/admin/resumes").catch(() => ({ data: [] })),
        api.get("/admin/users").catch(() => ({ data: [] })),
        api.get("/admin/interviews").catch(() => ({ data: [] })),
      ]);
      setStats(s.data);
      setJobs(j.data);
      setApplications(a.data);
      setResumes(r.data);
      setUsers(u.data);
      setInterviews(iv.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // Reset search/pagination on tab change
  useEffect(() => { setSearch(""); setFilter("all"); setPage(0); }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // ═══════════════════════════════════════════════════════════
  // FILTERED DATA
  // ═══════════════════════════════════════════════════════════
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const paginate = (arr) => {
      const start = page * PAGE_SIZE;
      return { items: arr.slice(start, start + PAGE_SIZE), total: arr.length };
    };

    switch (activeTab) {
      case "jobs": {
        const f = jobs.filter((j) =>
          (j.title?.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q) || j.postedBy?.name?.toLowerCase().includes(q)) &&
          (filter === "all" || j.location?.toLowerCase().includes(filter))
        );
        return { ...paginate(f), raw: f };
      }
      case "applications": {
        const f = applications.filter((a) =>
          (a.student?.name?.toLowerCase().includes(q) || a.job?.title?.toLowerCase().includes(q)) &&
          (filter === "all" || a.status === filter)
        );
        return { ...paginate(f), raw: f };
      }
      case "resumes": {
        const f = resumes.filter((r) =>
          r.student?.name?.toLowerCase().includes(q) || r.fileName?.toLowerCase().includes(q)
        );
        return { ...paginate(f), raw: f };
      }
      case "users": {
        const f = users.filter((u) =>
          (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)) &&
          (filter === "all" || u.role === filter)
        );
        return { ...paginate(f), raw: f };
      }
      case "interviews": {
        const f = interviews.filter((iv) =>
          (iv.job?.title?.toLowerCase().includes(q) || iv.application?.student?.name?.toLowerCase().includes(q)) &&
          (filter === "all" || iv.status === filter)
        );
        return { ...paginate(f), raw: f };
      }
      default:
        return { items: [], total: 0, raw: [] };
    }
  }, [activeTab, jobs, applications, resumes, users, interviews, search, filter, page]);

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/users", newUser);
      addToast("User created successfully");
      setNewUser({ name: "", email: "", role: "Student", password: "" });
      setShowUserModal(false);
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.message || "Creation failed", "error");
    }
  };

  const handleDeleteUser = (id) => {
    setConfirm({
      open: true,
      title: "Delete User",
      message: "Are you sure you want to delete this user? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${id}`);
          addToast("User deleted");
          fetchAll();
        } catch (err) { addToast(err.response?.data?.message || "Delete failed", "error"); }
        setConfirm({ open: false });
      },
    });
  };

  const handleRoleChange = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      addToast("Role updated");
      setUsers((p) => p.map((u) => u._id === id ? { ...u, role } : u));
    } catch (err) { addToast(err.response?.data?.message || "Update failed", "error"); }
  };

  const handleSubscriptionChange = async (id, plan) => {
    try {
      await api.put(`/admin/users/${id}/subscription`, { plan });
      addToast("HR plan updated");
      setUsers((p) => p.map((u) => u._id === id ? { ...u, subscriptionPlan: plan } : u));
    } catch (err) { addToast(err.response?.data?.message || "Update failed", "error"); }
  };

  const handleDeleteJob = (id) => {
    setConfirm({
      open: true,
      title: "Delete Job",
      message: "Are you sure you want to delete this job posting? All associated applications will be affected.",
      onConfirm: async () => {
        try {
          await api.delete(`/jobs/${id}`);
          addToast("Job deleted");
          fetchAll();
        } catch (err) { addToast(err.response?.data?.message || "Delete failed", "error"); }
        setConfirm({ open: false });
      },
    });
  };

  const handleStatusUpdate = async (appId, status) => {
    try {
      await api.put(`/applications/${appId}/status`, { status });
      addToast(`Application ${status}`);
      setApplications((p) => p.map((a) => a._id === appId ? { ...a, status } : a));
    } catch (err) { addToast(err.response?.data?.message || "Update failed", "error"); }
  };

  const openDetail = (item, type) => { setDetailItem(item); setDetailType(type); };

  // ═══════════════════════════════════════════════════════════
  // TAB COUNTS
  // ═══════════════════════════════════════════════════════════
  const tabCounts = useMemo(() => ({
    jobs: jobs.length,
    applications: applications.length,
    resumes: resumes.length,
    users: users.length,
    interviews: interviews.length,
  }), [jobs, applications, resumes, users, interviews]);

  // ═══════════════════════════════════════════════════════════
  // OVERVIEW DERIVED DATA (all hooks at top level)
  // ═══════════════════════════════════════════════════════════
  const overviewStats = useMemo(() => {
    const s = stats?.stats || {};
    const totalApps = s.totalApplications || 0;
    const shortlisted = applications.filter((a) => a.status === "shortlisted").length;
    const rejected = applications.filter((a) => a.status === "rejected").length;
    const pending = applications.filter((a) => a.status === "pending").length;
    const completedInterviews = interviews.filter((iv) => iv.status === "completed").length;
    return { s, totalApps, shortlisted, rejected, pending, completedInterviews };
  }, [stats, applications, interviews]);

  const roleDist = useMemo(() => {
    const dist = {};
    users.forEach((u) => { dist[u.role] = (dist[u.role] || 0) + 1; });
    return Object.entries(dist).sort((a, b) => b[1] - a[1]);
  }, [users]);

  // ═══════════════════════════════════════════════════════════
  // RENDER: OVERVIEW
  // ═══════════════════════════════════════════════════════════
  const renderOverview = () => {
    if (loading) return <Skeleton rows={4} cols={4} />;
    const { s, totalApps, shortlisted, rejected, pending, completedInterviews } = overviewStats;

    return (
      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={s.totalUsers} icon={FaUsers} delay={0} />
          <StatCard label="Total Jobs" value={s.totalJobs} icon={FaBriefcase} delay={0.05} />
          <StatCard label="Applications" value={totalApps} icon={FaFileAlt} delay={0.1} />
          <StatCard label="Resumes" value={s.totalResumes} icon={FaFileAlt} delay={0.15} />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Shortlisted" value={shortlisted} icon={FaCheckCircle} color="#4ade80" delay={0.2} />
          <StatCard label="Rejected" value={rejected} icon={FaTimesCircle} color="#f87171" delay={0.25} />
          <StatCard label="Pending Review" value={pending} icon={FaEye} color="#fbbf24" delay={0.3} />
          <StatCard label="Interviews Done" value={completedInterviews} icon={FaCalendarAlt} color="#60a5fa" delay={0.35} />
        </div>

        {/* Hiring Funnel */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h4 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
            <FaChartBar className="text-[#d4af37]" /> Hiring Funnel
          </h4>
          <div className="space-y-3">
            <FunnelBar label="Applied" count={totalApps} total={totalApps} color="#d4af37" />
            <FunnelBar label="Shortlisted" count={shortlisted} total={totalApps} color="#4ade80" />
            <FunnelBar label="Interviewed" count={completedInterviews} total={totalApps} color="#60a5fa" />
            <FunnelBar label="Rejected" count={rejected} total={totalApps} color="#f87171" />
          </div>
        </div>

        {/* Bottom Grid: Role Distribution + Recent */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Role Distribution */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <h4 className="text-sm font-semibold text-white/80 mb-3">User Roles</h4>
            {roleDist.length === 0 ? <p className="text-sm text-white/30">No users</p> :
              roleDist.map(([role, count]) => (
                <div key={role} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-white/60">{role}</span>
                  <span className="text-white font-semibold">{count}</span>
                </div>
              ))
            }
          </div>

          {/* Recent Jobs */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <h4 className="text-sm font-semibold text-white/80 mb-3">Recent Jobs</h4>
            {(stats?.recentJobs || []).length === 0 ? <p className="text-sm text-white/30">No jobs</p> :
              stats.recentJobs.map((job) => (
                <div key={job._id} className="border-b border-white/5 py-2 text-sm">
                  <p className="font-medium text-white">{job.title}</p>
                  <p className="text-white/40 text-xs">by {job.postedBy?.name || "Unknown"}</p>
                </div>
              ))
            }
          </div>

          {/* Recent Applications */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <h4 className="text-sm font-semibold text-white/80 mb-3">Recent Applications</h4>
            {(stats?.recentApps || []).length === 0 ? <p className="text-sm text-white/30">No applications</p> :
              stats.recentApps.map((app) => (
                <div key={app._id} className="border-b border-white/5 py-2 text-sm flex justify-between items-center">
                  <div>
                    <p className="text-white">{app.student?.name} → {app.job?.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${app.status === "shortlisted" ? "bg-[#d4af37]/20 text-[#d4af37]" : app.status === "rejected" ? "bg-rose-500/20 text-rose-300" : "bg-white/10 text-white/50"}`}>{app.status}</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER: JOBS
  // ═══════════════════════════════════════════════════════════
  const renderJobs = () => {
    if (loading) return <Skeleton rows={5} cols={5} />;
    return (
      <div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search jobs by title, location, or poster…" resultCount={filtered.total} />
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Posted By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.items.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-white/30 text-sm">No jobs found</td></tr>
                ) : filtered.items.map((job) => (
                  <tr key={job._id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => openDetail(job, "job")}>
                    <td className="px-6 py-4 text-sm text-white font-medium">{job.title}</td>
                    <td className="px-6 py-4 text-sm text-white/60">{job.location}</td>
                    <td className="px-6 py-4 text-sm text-white/60">{job.postedBy?.name || "Unknown"}</td>
                    <td className="px-6 py-4 text-sm text-white/60">{new Date(job.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteJob(job._id); }}
                        className="text-rose-400 hover:text-rose-300 transition p-1 hover:bg-rose-500/10 rounded-lg"><FaTrash size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.total} onPageChange={setPage} />
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={() => exportCSV(["Title", "Location", "Posted By", "Date"], filtered.raw.map((j) => [j.title, j.location, j.postedBy?.name || "", new Date(j.createdAt).toLocaleDateString()]), "jobs")}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/50 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition">
            <FaDownload /> Export CSV
          </button>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER: APPLICATIONS
  // ═══════════════════════════════════════════════════════════
  const renderApplications = () => {
    if (loading) return <Skeleton rows={5} cols={5} />;
    const statusOpts = [
      { value: "shortlisted", label: "Shortlisted" },
      { value: "rejected", label: "Rejected" },
      { value: "pending", label: "Pending" },
    ];
    return (
      <div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by student name or job title…"
          filter={filter} onFilterChange={setFilter} filterOptions={statusOpts} resultCount={filtered.total} />
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Job</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Applied</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.items.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-white/30 text-sm">No applications found</td></tr>
                ) : filtered.items.map((app) => (
                  <tr key={app._id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => openDetail(app, "application")}>
                    <td className="px-6 py-4 text-sm text-white">{app.student?.name || "Unknown"}</td>
                    <td className="px-6 py-4 text-sm text-white/60">{app.job?.title || "Unknown"}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${app.status === "shortlisted" ? "bg-[#d4af37]/20 text-[#d4af37]" : app.status === "rejected" ? "bg-rose-500/20 text-rose-300" : "bg-white/10 text-white/50"}`}>{app.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleStatusUpdate(app._id, "shortlisted")}
                        className="bg-[#d4af37] text-[#0d131f] px-3 py-1 rounded mr-2 hover:bg-[#b8860b] transition text-xs font-semibold disabled:opacity-40"
                        disabled={app.status === "shortlisted"}>Shortlist</button>
                      <button onClick={() => handleStatusUpdate(app._id, "rejected")}
                        className="bg-rose-500/80 text-white px-3 py-1 rounded hover:bg-rose-600 transition text-xs disabled:opacity-40"
                        disabled={app.status === "rejected"}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.total} onPageChange={setPage} />
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={() => exportCSV(["Student", "Job", "Status", "Date"], filtered.raw.map((a) => [a.student?.name || "", a.job?.title || "", a.status, new Date(a.createdAt).toLocaleDateString()]), "applications")}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/50 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition">
            <FaDownload /> Export CSV
          </button>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER: RESUMES
  // ═══════════════════════════════════════════════════════════
  const renderResumes = () => {
    if (loading) return <Skeleton rows={5} cols={4} />;
    return (
      <div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by student name or file name…" resultCount={filtered.total} />
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">File</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Uploaded</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.items.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-8 text-center text-white/30 text-sm">No resumes uploaded</td></tr>
                ) : filtered.items.map((r) => (
                  <tr key={r._id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => openDetail(r, "resume")}>
                    <td className="px-6 py-4 text-sm text-white">{r.student?.name || "Unknown"}</td>
                    <td className="px-6 py-4 text-sm text-white/60">{r.fileName}</td>
                    <td className="px-6 py-4 text-sm text-white/60">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <button onClick={(e) => { e.stopPropagation(); openDetail(r, "resume"); }}
                        className="text-[#d4af37] font-medium hover:underline text-xs flex items-center gap-1">
                        <FaEye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.total} onPageChange={setPage} />
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={() => exportCSV(["Student", "File", "Email", "Skills", "Uploaded"],
            filtered.raw.map((r) => [r.student?.name || "", r.fileName, r.extractedData?.email || "", r.extractedData?.technical_skills || "", new Date(r.createdAt).toLocaleDateString()]), "resumes")}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/50 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition">
            <FaDownload /> Export CSV
          </button>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER: USERS
  // ═══════════════════════════════════════════════════════════
  const renderUsers = () => {
    if (loading) return <Skeleton rows={5} cols={5} />;
    const roleOpts = ROLES.map((r) => ({ value: r, label: r }));
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Search users by name or email…"
            filter={filter} onFilterChange={setFilter} filterOptions={roleOpts} resultCount={filtered.total} />
          <button onClick={() => setShowUserModal(true)}
            className="bg-[#d4af37] hover:bg-[#b8860b] text-[#0d131f] px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold transition shrink-0 ml-3">
            <FaUserPlus /> Add User
          </button>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">HR Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.items.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-white/30 text-sm">No users found</td></tr>
                ) : filtered.items.map((user) => (
                  <tr key={user._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm text-white font-medium">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-white/60">{user.email}</td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <select value={user.role} onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#d4af37]">
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      {user.role === "HR" ? (
                        <select value={user.subscriptionPlan || "trial"} onChange={(e) => handleSubscriptionChange(user._id, e.target.value)}
                          className="bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#d4af37]">
                          {SUBSCRIPTION_PLANS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                      ) : <span className="text-white/40 text-xs">—</span>}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleDeleteUser(user._id)}
                        className="text-rose-400 hover:text-rose-300 transition p-1 hover:bg-rose-500/10 rounded-lg"><FaTrash size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.total} onPageChange={setPage} />
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={() => exportCSV(["Name", "Email", "Role", "HR Plan"], filtered.raw.map((u) => [u.name, u.email, u.role, u.subscriptionPlan || ""]), "users")}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/50 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition">
            <FaDownload /> Export CSV
          </button>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER: INTERVIEWS
  // ═══════════════════════════════════════════════════════════
  const renderInterviews = () => {
    if (loading) return <Skeleton rows={5} cols={5} />;
    const statusOpts = [
      { value: "scheduled", label: "Scheduled" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" },
    ];
    return (
      <div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by job title or student name…"
          filter={filter} onFilterChange={setFilter} filterOptions={statusOpts} resultCount={filtered.total} />
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Job</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Scheduled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.items.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-white/30 text-sm">No interviews found</td></tr>
                ) : filtered.items.map((iv) => (
                  <tr key={iv._id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => openDetail(iv, "interview")}>
                    <td className="px-6 py-4 text-sm text-white">{iv.job?.title || "Unknown"}</td>
                    <td className="px-6 py-4 text-sm text-white">{iv.application?.student?.name || "Unknown"}</td>
                    <td className="px-6 py-4 text-sm text-white/60">{new Date(iv.scheduledAt).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${iv.status === "scheduled" ? "bg-[#d4af37]/20 text-[#d4af37]" : iv.status === "completed" ? "bg-green-500/20 text-green-300" : iv.status === "cancelled" ? "bg-rose-500/20 text-rose-300" : "bg-white/10 text-white/50"}`}>
                        {iv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {iv.feedback?.decision ? (
                        <span className={`text-xs font-medium ${iv.feedback.decision === "selected" ? "text-green-400" : iv.feedback.decision === "rejected" ? "text-rose-400" : "text-yellow-400"}`}>
                          {iv.feedback.decision} ({iv.feedback.rating}/5)
                        </span>
                      ) : (
                        <span className="text-white/30">No feedback</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.total} onPageChange={setPage} />
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // DETAIL PANEL (Slide-out)
  // ═══════════════════════════════════════════════════════════
  const renderDetailPanel = () => {
    if (!detailItem) return null;
    const close = () => { setDetailItem(null); setDetailType(null); };
    return (
      <div className="fixed inset-0 z-40 flex justify-end">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
        <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
          className="relative w-full max-w-md bg-[#0d131f] border-l border-white/10 shadow-2xl overflow-y-auto">
          <div className="sticky top-0 bg-[#0d131f]/90 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
            <h3 className="text-lg font-semibold text-white capitalize">{detailType} Details</h3>
            <button onClick={close} className="text-white/40 hover:text-white transition p-1"><FaTimes size={18} /></button>
          </div>
          <div className="p-6 space-y-4">
            {detailType === "job" && (
              <>
                <DetailRow label="Title" value={detailItem.title} />
                <DetailRow label="Location" value={detailItem.location} />
                <DetailRow label="Posted By" value={detailItem.postedBy?.name} />
                <DetailRow label="Description" value={detailItem.description} />
                <DetailRow label="Created" value={new Date(detailItem.createdAt).toLocaleString()} />
              </>
            )}
            {detailType === "application" && (
              <>
                <DetailRow label="Student" value={detailItem.student?.name} />
                <DetailRow label="Email" value={detailItem.student?.email} icon={FaEnvelope} />
                <DetailRow label="Job" value={detailItem.job?.title} />
                <DetailRow label="Status" value={<span className={`px-2 py-0.5 rounded-full text-xs ${detailItem.status === "shortlisted" ? "bg-[#d4af37]/20 text-[#d4af37]" : detailItem.status === "rejected" ? "bg-rose-500/20 text-rose-300" : "bg-white/10 text-white/50"}`}>{detailItem.status}</span>} />
                <DetailRow label="Applied" value={new Date(detailItem.createdAt).toLocaleString()} />
                {detailItem.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => { handleStatusUpdate(detailItem._id, "shortlisted"); close(); }}
                      className="flex-1 py-2 bg-[#d4af37] text-[#0d131f] rounded-lg text-sm font-semibold hover:bg-[#b8860b] transition">Shortlist</button>
                    <button onClick={() => { handleStatusUpdate(detailItem._id, "rejected"); close(); }}
                      className="flex-1 py-2 bg-rose-500 text-white rounded-lg text-sm font-semibold hover:bg-rose-600 transition">Reject</button>
                  </div>
                )}
              </>
            )}
            {detailType === "resume" && (
              <>
                <DetailRow label="Student" value={detailItem.student?.name} />
                <DetailRow label="File" value={detailItem.fileName} />
                <DetailRow label="Uploaded" value={new Date(detailItem.createdAt).toLocaleString()} />
                <DetailRow label="Status" value={detailItem.status} />
                <div className="border-t border-white/10 pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-white/80 mb-3">Extracted Data</h4>
                  <DetailRow label="Email" value={detailItem.extractedData?.email} icon={FaEnvelope} />
                  <DetailRow label="Contact" value={detailItem.extractedData?.contact_no} icon={FaPhone} />
                  <DetailRow label="Skills" value={detailItem.extractedData?.technical_skills} icon={FaCode} />
                  <DetailRow label="Projects" value={detailItem.extractedData?.project_details} />
                  <DetailRow label="Certifications" value={detailItem.extractedData?.certifications} icon={FaCertificate} />
                  <DetailRow label="Other" value={detailItem.extractedData?.other_info} />
                </div>
              </>
            )}
            {detailType === "interview" && (
              <>
                <DetailRow label="Job" value={detailItem.job?.title} />
                <DetailRow label="Student" value={detailItem.application?.student?.name} />
                <DetailRow label="Scheduled" value={new Date(detailItem.scheduledAt).toLocaleString()} />
                <DetailRow label="Duration" value={`${detailItem.duration || "—"} min`} />
                <DetailRow label="Location" value={detailItem.location} />
                <DetailRow label="Meeting Link" value={detailItem.meetingLink ? <a href={detailItem.meetingLink} target="_blank" rel="noreferrer" className="text-[#d4af37] hover:underline">Join</a> : "—"} />
                <DetailRow label="Status" value={<span className={`px-2 py-0.5 rounded-full text-xs ${detailItem.status === "scheduled" ? "bg-[#d4af37]/20 text-[#d4af37]" : detailItem.status === "completed" ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/50"}`}>{detailItem.status}</span>} />
                {detailItem.feedback?.decision && (
                  <div className="border-t border-white/10 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-white/80 mb-3">Feedback</h4>
                    <DetailRow label="Rating" value={`${detailItem.feedback.rating}/5`} />
                    <DetailRow label="Comments" value={detailItem.feedback.comments} />
                    <DetailRow label="Decision" value={<span className={`font-medium ${detailItem.feedback.decision === "selected" ? "text-green-400" : detailItem.feedback.decision === "rejected" ? "text-rose-400" : "text-yellow-400"}`}>{detailItem.feedback.decision}</span>} />
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d131f] via-[#1a2a40] to-[#0d131f] relative overflow-hidden">
      <Toast toasts={toasts} remove={removeToast} />
      <ConfirmModal {...confirm} onCancel={() => setConfirm({ open: false })} />

      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGwxMiAxMi0xMiAxMi0xMi0xMiAxMi0xMnpNMTggMzZsMTIgMTItMTIgMTItMTItMTIgMTItMTJ6IiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>

      {/* Navbar */}
      <header className="relative z-20 bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-3 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-3">
          <img src="/vettora-logo.png" alt="Vettora Logo" className="h-9 object-contain rounded-lg border border-white/10 p-0.5 bg-black/30" />
          <span className="ml-2 text-xs font-medium text-white/40 bg-white/10 px-2 py-0.5 rounded-full">Admin</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
          <FaSignOutAlt size={16} /> Sign out
        </button>
      </header>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-white mb-6">Dashboard</h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 border-b border-white/10">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition flex items-center gap-2 relative ${
                activeTab === key
                  ? "text-[#d4af37]"
                  : "text-white/50 hover:text-white/80"
              }`}
              onClick={() => setActiveTab(key)}>
              <Icon size={14} />
              {label}
              {tabCounts[key] !== undefined && (
                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === key ? "bg-[#d4af37]/20 text-[#d4af37]" : "bg-white/10 text-white/40"}`}>
                  {tabCounts[key]}
                </span>
              )}
              {activeTab === key && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4af37]" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}>
            {activeTab === "overview" && renderOverview()}
            {activeTab === "jobs" && renderJobs()}
            {activeTab === "applications" && renderApplications()}
            {activeTab === "resumes" && renderResumes()}
            {activeTab === "users" && renderUsers()}
            {activeTab === "interviews" && renderInterviews()}
          </motion.div>
        </AnimatePresence>

        {/* Detail Slide-out Panel */}
        <AnimatePresence>
          {detailItem && renderDetailPanel()}
        </AnimatePresence>

        {/* Create User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1a2a40] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-semibold text-white mb-4">Create New User</h2>
              <form onSubmit={handleCreateUser}>
                <div className="space-y-4">
                  <input type="text" placeholder="Full Name" value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#d4af37]" />
                  {newUser.role.startsWith("LPU") ? (
                    <input type="text" placeholder="University UID" value={newUser.uid || ""}
                      onChange={(e) => setNewUser({ ...newUser, uid: e.target.value })} required
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#d4af37]" />
                  ) : (
                    <input type="email" placeholder="Email" value={newUser.email || ""}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#d4af37]" />
                  )}
                  <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#d4af37]">
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input type="password" placeholder="Password" value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#d4af37]" />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 text-sm border border-white/10 rounded-lg hover:bg-white/5 transition text-white/60">Cancel</button>
                  <button type="submit"
                    className="px-4 py-2 text-sm bg-[#d4af37] text-[#0d131f] rounded-lg hover:bg-[#b8860b] transition font-semibold">Create</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DETAIL ROW HELPER
═══════════════════════════════════════════════════════════════ */
function DetailRow({ label, value, icon: Icon }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-white/40 uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon size={11} />} {label}
      </span>
      <div className="text-sm text-white/80">{value || "—"}</div>
    </div>
  );
}
