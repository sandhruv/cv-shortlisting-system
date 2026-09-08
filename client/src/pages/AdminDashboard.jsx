import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUsers, FaBriefcase, FaFileAlt, FaUserPlus, FaTrash, FaChartBar,
  FaUserTie, FaCalendarAlt, FaSearch, FaDownload, FaFilter,
  FaChevronLeft, FaChevronRight, FaCheckCircle, FaTimesCircle, FaEye,
  FaEnvelope, FaPhone, FaCode, FaCertificate, FaInfoCircle, FaTimes,
  FaExclamationTriangle, FaSun, FaMoon, FaBars, FaCog, FaBell, FaRobot,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import DashboardSidebar from "../components/DashboardSidebar";

/* ═══════════════════════════════════════════════════════════════
   THEME PALETTES (matching Login page)
═══════════════════════════════════════════════════════════════ */
const T = {
  dark: {
    page: "bg-[#080c14] text-slate-100",
    card: "bg-[#0e1422]/85 border-white/15",
    cardText: "text-white",
    cardSub: "text-slate-400",
    input: "bg-[#070a12] border-slate-700/80 text-white placeholder:text-slate-500 focus:border-[#d4af37]",
    label: "text-slate-300",
    icon: "text-slate-400",
    divider: "border-slate-800",
    footer: "text-slate-500",
    badge: "text-[#d4af37]",
    featureCard: "bg-white/[0.03] border-white/10",
    featureTitle: "text-slate-200",
    featureDesc: "text-slate-400",
    link: "text-[#d4af37]",
    btnGold: "from-[#d4af37] via-[#c5a059] to-[#996515] text-[#070a12]",
    btnGoldDisabled: "bg-[#d4af37]/30 text-slate-300",
    tableHead: "bg-white/[0.04]",
    tableRow: "hover:bg-white/[0.03]",
    tableBorder: "border-white/[0.06]",
    tableBorderLight: "border-white/[0.04]",
    hoverLight: "hover:bg-white/5",
    hoverTextStrong: "hover:text-white",
    surface: "bg-[#0e1422]/85 border-white/[0.08]",
    surfaceHover: "hover:border-[#d4af37]/20",
    textMuted: "text-white/40",
    textMutedLight: "text-white/50",
    textMutedDark: "text-white/30",
    textBright: "text-white/80",
    accentBg: "bg-[#d4af37]/10",
    accentText: "text-[#d4af37]",
    accentBorder: "border-[#d4af37]/30",
    dangerBg: "bg-red-500/10",
    dangerText: "text-red-400",
    dangerHover: "hover:bg-red-500/20",
    successBg: "bg-emerald-500/10",
    successText: "text-emerald-400",
    warningBg: "bg-amber-500/10",
    warningText: "text-amber-400",
    infoBg: "bg-blue-500/10",
    infoText: "text-blue-400",
    gridLine: "#ffffff05",
    logoBg: "bg-[#090d16]",
    logoBorder: "border-[#d4af37]/30",
    logoShadow: "shadow-[0_0_30px_rgba(212,175,55,0.12)]",
    sidebarBg: "#0f1219",
    sidebarBorder: "rgba(255,255,255,0.06)",
    sidebarCard: "rgba(255,255,255,0.03)",
    sidebarMuted: "rgba(255,255,255,0.45)",
    sidebarActive: "rgba(212,175,55,0.08)",
    sidebarDanger: "#e57373",
    sidebarDangerBg: "rgba(139,26,26,0.06)",
  },
  light: {
    page: "bg-[#f5f0e8] text-[#1a1510]",
    card: "bg-white/90 border-[#c5a059]/20 shadow-xl",
    cardText: "text-[#1a1510]",
    cardSub: "text-[#6b5a3a]",
    input: "bg-[#f8f4ec] border-[#c5a059]/30 text-[#1a1510] placeholder:text-[#a09070] focus:border-[#8B6914]",
    label: "text-[#4a3a20]",
    icon: "text-[#a09070]",
    divider: "border-[#c5a059]/20",
    footer: "text-[#a09070]",
    badge: "text-[#8B6914]",
    featureCard: "bg-[#f0e8d8]/60 border-[#c5a059]/15",
    featureTitle: "text-[#3a2a10]",
    featureDesc: "text-[#6b5a3a]",
    link: "text-[#8B6914]",
    btnGold: "from-[#8B6914] via-[#a07820] to-[#6b4f0a] text-white",
    btnGoldDisabled: "bg-[#c5a059]/30 text-[#4a3a20]",
    tableHead: "bg-[#f0e8d8]/60",
    tableRow: "hover:bg-[#f0e8d8]/40",
    tableBorder: "border-[#c5a059]/15",
    tableBorderLight: "border-[#c5a059]/10",
    hoverLight: "hover:bg-black/5",
    hoverTextStrong: "hover:text-[#1a1510]",
    surface: "bg-white/80 border-[#c5a059]/18",
    surfaceHover: "hover:border-[#d4af37]/30",
    textMuted: "text-[#6b5a3a]",
    textMutedLight: "text-[#8a7a5a]",
    textMutedDark: "text-[#a09070]",
    textBright: "text-[#2a1f10]",
    accentBg: "bg-[#d4af37]/10",
    accentText: "text-[#8B6914]",
    accentBorder: "border-[#c5a059]/30",
    dangerBg: "bg-red-500/10",
    dangerText: "text-red-600",
    dangerHover: "hover:bg-red-500/15",
    successBg: "bg-emerald-500/10",
    successText: "text-emerald-600",
    warningBg: "bg-amber-500/10",
    warningText: "text-amber-600",
    infoBg: "bg-blue-500/10",
    infoText: "text-blue-600",
    gridLine: "#00000005",
    logoBg: "bg-[#f0e8d8]",
    logoBorder: "border-[#c5a059]/40",
    logoShadow: "shadow-[0_0_20px_rgba(212,175,55,0.10)]",
    sidebarBg: "#fffaf0",
    sidebarBorder: "rgba(197,160,89,0.2)",
    sidebarCard: "rgba(255,255,255,0.7)",
    sidebarMuted: "#927f61",
    sidebarActive: "rgba(212,175,55,0.1)",
    sidebarDanger: "#8b1a1a",
    sidebarDangerBg: "rgba(139,26,26,0.05)",
  },
};

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
  { key: "analytics",    label: "Analytics",    icon: FaChartBar },
  { key: "tools",        label: "Admin Tools",  icon: FaCog },
  { key: "bulk",         label: "Bulk Upload",  icon: FaUserPlus },
  { key: "settings",     label: "Settings",     icon: FaCog },
];
const ROLES = ["Student", "HR", "Admin", "LPU Admin", "LPU Faculty", "LPU Student"];
const SUBSCRIPTION_PLANS = [
  { value: "trial",    label: "Trial (3 days)" },
  { value: "monthly",  label: "Monthly (₹200)" },
  { value: "yearly",   label: "Yearly" },
  { value: "inactive", label: "Inactive" },
];

/* ═══════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════ */
function Toast({ toasts, remove, t }) {
  return (
    <div className="fixed top-5 right-5 z-[999] space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl max-w-sm transition-colors duration-300 ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/20 text-emerald-200"
                : toast.type === "error"
                ? "bg-rose-950/90 border-rose-500/20 text-rose-200"
                : `${t.card} ${t.cardText}`
            }`}
          >
            {toast.type === "success" ? <FaCheckCircle className="text-emerald-400 shrink-0" /> :
             toast.type === "error" ? <FaTimesCircle className="text-rose-400 shrink-0" /> :
             <FaInfoCircle className={t.accentText + " shrink-0"} />}
            <span className="text-sm flex-1">{toast.message}</span>
            <button onClick={() => remove(toast.id)} className="text-white/30 hover:text-white shrink-0"><FaTimes size={12} /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONFIRM MODAL
═══════════════════════════════════════════════════════════════ */
function ConfirmModal({ open, title, message, onConfirm, onCancel, t }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`${t.card} backdrop-blur-2xl rounded-3xl p-7 w-full max-w-sm shadow-2xl transition-colors duration-300`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-2xl bg-red-500/10"><FaExclamationTriangle className="text-red-400" /></div>
          <h3 className={`text-lg font-bold ${t.cardText}`}>{title}</h3>
        </div>
        <p className={`text-sm mb-6 pl-[52px] ${t.cardSub}`}>{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className={`px-5 py-2.5 text-sm border rounded-2xl transition-all ${t.tableBorder} ${t.textMuted} ${t.hoverLight}`}>Cancel</button>
          <button onClick={onConfirm} className="px-5 py-2.5 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl hover:brightness-110 transition-all font-bold">Delete</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SKELETON
═══════════════════════════════════════════════════════════════ */
function Skeleton({ rows = 5, cols = 4, t }) {
  return (
    <div className={`${t.surface} backdrop-blur-2xl rounded-3xl overflow-hidden border transition-colors duration-300`}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={`flex gap-4 px-6 py-4 border-b ${t.tableBorderLight}`}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className={`h-4 rounded-xl flex-1 animate-pulse ${t.featureCard}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SEARCH BAR
═══════════════════════════════════════════════════════════════ */
function SearchBar({ value, onChange, placeholder, filter, filterOptions, onFilterChange, resultCount, t }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      <div className="relative flex-1 group">
        <FaSearch className={`absolute left-4 top-1/2 -translate-y-1/2 ${t.icon} group-focus-within:${t.accentText} text-sm transition-colors`} />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className={`w-full pl-11 pr-4 py-3 ${t.input} border rounded-2xl text-sm outline-none transition-all duration-300 focus:ring-2 focus:ring-[#d4af37]/20`} />
      </div>
      {filterOptions && (
        <div className="relative group">
          <FaFilter className={`absolute left-4 top-1/2 -translate-y-1/2 ${t.icon} text-xs transition-colors`} />
          <select value={filter} onChange={(e) => onFilterChange(e.target.value)}
            className={`pl-10 pr-8 py-3 ${t.input} border rounded-2xl text-sm outline-none appearance-none cursor-pointer transition-all duration-300 focus:ring-2 focus:ring-[#d4af37]/20`}>
            <option value="all">All</option>
            {filterOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}
      {resultCount !== undefined && (
        <div className={`flex items-center text-xs px-1 ${t.textMutedDark}`}>{resultCount} result{resultCount !== 1 ? "s" : ""}</div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGINATION
═══════════════════════════════════════════════════════════════ */
function Pagination({ page, total, onPageChange, t }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div className={`flex items-center justify-between px-6 py-3 border-t ${t.tableBorderLight}`}>
      <span className={`text-xs ${t.textMutedDark}`}>
        Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 0}
          className={`p-1.5 rounded-xl border ${t.tableBorder} ${t.textMuted} ${t.hoverLight} disabled:opacity-20 disabled:cursor-not-allowed transition`}>
          <FaChevronLeft size={11} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} onClick={() => onPageChange(i)}
            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
              i === page ? "bg-gradient-to-br from-[#d4af37] via-[#c5a059] to-[#996515] text-[#070a12] shadow-lg shadow-[#d4af37]/20" : `${t.textMuted} ${t.hoverLight}`
            }`}>{i + 1}</button>
        ))}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages - 1}
          className={`p-1.5 rounded-xl border ${t.tableBorder} ${t.textMuted} ${t.hoverLight} disabled:opacity-20 disabled:cursor-not-allowed transition`}>
          <FaChevronRight size={11} />
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
   STAT CARD (Login-style feature card)
═══════════════════════════════════════════════════════════════ */
function StatCard({ label, value, icon: Icon, color = "#d4af37", delay = 0, t }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`${t.surface} backdrop-blur-2xl rounded-3xl p-5 border ${t.surfaceHover} transition-all duration-300 group`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-wider ${t.textMutedDark}`}>{label}</p>
          <p className={`text-2xl font-bold mt-1.5 tracking-tight ${t.cardText}`}>{value ?? "—"}</p>
        </div>
        <div className="p-2.5 rounded-2xl transition-all duration-300"
          style={{ backgroundColor: `${color}12` }}>
          <Icon className="text-lg" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FUNNEL BAR
═══════════════════════════════════════════════════════════════ */
function FunnelBar({ label, count, total, color, t }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className={`w-28 text-right text-[13px] ${t.textMuted}`}>{label}</span>
      <div className={`flex-1 h-7 rounded-2xl overflow-hidden ${t.featureCard}`}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-2xl" style={{ background: `linear-gradient(90deg, ${color}cc, ${color})` }} />
      </div>
      <span className={`w-14 font-semibold text-[13px] ${t.cardText}`}>{count}</span>
      <span className={`w-12 text-xs text-right ${t.textMutedDark}`}>{pct.toFixed(0)}%</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DETAIL ROW
═══════════════════════════════════════════════════════════════ */
function DetailRow({ label, value, icon: Icon, t }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${t.textMutedDark}`}>
        {Icon && <Icon size={10} />} {label}
      </span>
      <div className={`text-sm leading-relaxed ${t.textBright}`}>{value || "—"}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [theme, setTheme] = useState("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [users, setUsers] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [confirm, setConfirm] = useState({ open: false, title: "", message: "", onConfirm: null });
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", uid: "", role: "Student", password: "" });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [bulkUploading, setBulkUploading] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [detailType, setDetailType] = useState(null);

  const t = T[theme];

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3500);
  }, []);
  const removeToast = useCallback((id) => setToasts((p) => p.filter((x) => x.id !== id)), []);

  /* ── FETCH ── */
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, j, a, r, u, iv, an] = await Promise.all([
        api.get("/admin/stats").catch(() => ({ data: null })),
        api.get("/admin/jobs").catch(() => ({ data: [] })),
        api.get("/admin/applications").catch(() => ({ data: [] })),
        api.get("/admin/resumes").catch(() => ({ data: [] })),
        api.get("/admin/users").catch(() => ({ data: [] })),
        api.get("/admin/interviews").catch(() => ({ data: [] })),
        api.get("/analytics/admin").catch(() => ({ data: null })),
      ]);
      setStats(s.data); setJobs(j.data); setApplications(a.data);
      setResumes(r.data); setUsers(u.data); setInterviews(iv.data);
      setAnalyticsData(an.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { setSearch(""); setFilter("all"); setPage(0); }, [activeTab]);

  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/"); };

  /* ── FILTERED ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const paginate = (arr) => { const s = page * PAGE_SIZE; return { items: arr.slice(s, s + PAGE_SIZE), total: arr.length }; };
    switch (activeTab) {
      case "jobs": { const f = jobs.filter((j) => (j.title?.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q) || j.postedBy?.name?.toLowerCase().includes(q)) && (filter === "all" || j.location?.toLowerCase().includes(filter))); return { ...paginate(f), raw: f }; }
      case "applications": { const f = applications.filter((a) => (a.student?.name?.toLowerCase().includes(q) || a.job?.title?.toLowerCase().includes(q)) && (filter === "all" || a.status === filter)); return { ...paginate(f), raw: f }; }
      case "resumes": { const f = resumes.filter((r) => r.student?.name?.toLowerCase().includes(q) || r.fileName?.toLowerCase().includes(q)); return { ...paginate(f), raw: f }; }
      case "users": { const f = users.filter((u) => (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)) && (filter === "all" || u.role === filter)); return { ...paginate(f), raw: f }; }
      case "interviews": { const f = interviews.filter((iv) => (iv.job?.title?.toLowerCase().includes(q) || iv.application?.student?.name?.toLowerCase().includes(q)) && (filter === "all" || iv.status === filter)); return { ...paginate(f), raw: f }; }
      default: return { items: [], total: 0, raw: [] };
    }
  }, [activeTab, jobs, applications, resumes, users, interviews, search, filter, page]);

  /* ── HANDLERS ── */
  const handleCreateUser = async (e) => {
    e.preventDefault();
    const payload = { ...newUser, uid: newUser.role.startsWith("LPU") ? (newUser.uid || "") : undefined, email: newUser.role.startsWith("LPU") ? (newUser.email || "") : newUser.email };
    if (newUser.role.startsWith("LPU") && !payload.uid) { addToast("UID is required for LPU roles.", "error"); return; }
    try { await api.post("/admin/users", payload); addToast("User created successfully"); setNewUser({ name: "", email: "", uid: "", role: "Student", password: "" }); setShowUserModal(false); fetchAll(); }
    catch (err) { addToast(err.response?.data?.message || "Creation failed", "error"); }
  };
  const handleDeleteUser = (id) => {
    setConfirm({ open: true, title: "Delete User", message: "Are you sure you want to delete this user? This action cannot be undone.",
      onConfirm: async () => { try { await api.delete(`/admin/users/${id}`); addToast("User deleted"); fetchAll(); } catch (err) { addToast(err.response?.data?.message || "Delete failed", "error"); } setConfirm({ open: false }); },
    });
  };
  const handleRoleChange = async (id, role) => {
    try { await api.put(`/admin/users/${id}/role`, { role }); addToast("Role updated"); setUsers((p) => p.map((u) => u._id === id ? { ...u, role } : u)); }
    catch (err) { addToast(err.response?.data?.message || "Update failed", "error"); }
  };
  const handleSubscriptionChange = async (id, plan) => {
    try { await api.put(`/admin/users/${id}/subscription`, { plan }); addToast("HR plan updated"); setUsers((p) => p.map((u) => u._id === id ? { ...u, subscriptionPlan: plan } : u)); }
    catch (err) { addToast(err.response?.data?.message || "Update failed", "error"); }
  };
  const handleDeleteJob = (id) => {
    setConfirm({ open: true, title: "Delete Job", message: "Are you sure you want to delete this job posting? All associated applications will be affected.",
      onConfirm: async () => { try { await api.delete(`/jobs/${id}`); addToast("Job deleted"); fetchAll(); } catch (err) { addToast(err.response?.data?.message || "Delete failed", "error"); } setConfirm({ open: false }); },
    });
  };
  const handleStatusUpdate = async (appId, status) => {
    try { await api.put(`/applications/${appId}/status`, { status }); addToast(`Application ${status}`); setApplications((p) => p.map((a) => a._id === appId ? { ...a, status } : a)); }
    catch (err) { addToast(err.response?.data?.message || "Update failed", "error"); }
  };
  const handleAdminPasswordChange = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    try { const res = await api.post("/auth/reset-password", { email: user.email, oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword }); addToast(res.data.message); setPasswordForm({ oldPassword: "", newPassword: "" }); }
    catch (err) { addToast(err.response?.data?.message || "Password update failed", "error"); }
  };
  const handleBulkUploadUsers = async () => {
    if (!bulkCsvText.trim()) { addToast("Paste CSV data before importing.", "error"); return; }
    const lines = bulkCsvText.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) { addToast("CSV should include a header row and at least one user row.", "error"); return; }
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1).map((line) => { const v = line.match(/(?:,|\n|^)(?:"(?:[^"]|"")*"|[^,\n]*)/g) || []; const c = v.map((i) => i.replace(/^,/, "").replace(/^"|"$/g, "").replace(/""/g, '"').trim()); const o = {}; headers.forEach((h, i) => { o[h] = c[i] ?? ""; }); return o; });
    if (!rows.length) { addToast("No valid rows found in CSV.", "error"); return; }
    setBulkUploading(true); const failures = [];
    for (const row of rows) { const name = (row.name || row.Name || "").trim(); const uid = (row.uid || row.UID || "").trim(); const email = (row.email || row.Email || "").trim(); const role = (row.role || row.Role || "Student").trim() || "Student"; const password = (row.password || row.Password || "").trim();
      if (!name || !password || (!email && !(role.startsWith("LPU") && uid))) { failures.push(`Missing fields for ${name || uid || email || "unknown"}`); continue; }
      try { await api.post("/admin/users", { name, email: email || (role.startsWith("LPU") ? `${uid}@lpu.edu.dummy` : ""), uid: role.startsWith("LPU") ? uid : undefined, role, password }); } catch (err) { failures.push(`${name || uid || email}: ${err.response?.data?.message || "Failed"}`); }
    }
    setBulkUploading(false); setBulkCsvText(""); fetchAll();
    if (failures.length) addToast(`Bulk import finished with ${failures.length} issue(s).`, "error"); else addToast("Bulk import completed successfully.");
  };
  const openDetail = (item, type) => { setDetailItem(item); setDetailType(type); };

  /* ── DERIVED ── */
  const tabCounts = useMemo(() => ({ jobs: jobs.length, applications: applications.length, resumes: resumes.length, users: users.length, interviews: interviews.length, analytics: analyticsData ? 1 : 0, tools: 5, bulk: 0 }), [jobs, applications, resumes, users, interviews, analyticsData]);
  const overviewStats = useMemo(() => {
    const s = stats?.stats || {}; const totalApps = s.totalApplications || 0;
    return { s, totalApps, shortlisted: applications.filter((a) => a.status === "shortlisted").length, rejected: applications.filter((a) => a.status === "rejected").length, pending: applications.filter((a) => a.status === "pending").length, completedInterviews: interviews.filter((iv) => iv.status === "completed").length };
  }, [stats, applications, interviews]);
  const roleDist = useMemo(() => { const d = {}; users.forEach((u) => { d[u.role] = (d[u.role] || 0) + 1; }); return Object.entries(d).sort((a, b) => b[1] - a[1]); }, [users]);

  /* ═══════════════════════════════════════════════════════════
     RENDER TABS
  ═══════════════════════════════════════════════════════════ */
  const renderOverview = () => {
    if (loading) return <Skeleton rows={4} cols={4} t={t} />;
    const { s, totalApps, shortlisted, rejected, pending, completedInterviews } = overviewStats;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={s.totalUsers} icon={FaUsers} color="#d4af37" delay={0} t={t} />
          <StatCard label="Total Jobs" value={s.totalJobs} icon={FaBriefcase} color="#c5a059" delay={0.05} t={t} />
          <StatCard label="Applications" value={totalApps} icon={FaFileAlt} color="#e5c158" delay={0.1} t={t} />
          <StatCard label="Resumes" value={s.totalResumes} icon={FaFileAlt} color="#996515" delay={0.15} t={t} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Shortlisted" value={shortlisted} icon={FaCheckCircle} color="#10b981" delay={0.2} t={t} />
          <StatCard label="Rejected" value={rejected} icon={FaTimesCircle} color="#ef4444" delay={0.25} t={t} />
          <StatCard label="Pending Review" value={pending} icon={FaEye} color="#f59e0b" delay={0.3} t={t} />
          <StatCard label="Interviews Done" value={completedInterviews} icon={FaCalendarAlt} color="#3b82f6" delay={0.35} t={t} />
        </div>
        <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-6 border transition-colors duration-300`}>
          <h4 className={`text-sm font-bold mb-5 flex items-center gap-2 ${t.cardText}`}>
            <div className="p-1.5 rounded-xl bg-[#d4af37]/10"><FaChartBar className="text-[#d4af37] text-xs" /></div>
            Hiring Funnel
          </h4>
          <div className="space-y-3.5">
            <FunnelBar label="Applied" count={totalApps} total={totalApps} color="#d4af37" t={t} />
            <FunnelBar label="Shortlisted" count={shortlisted} total={totalApps} color="#10b981" t={t} />
            <FunnelBar label="Interviewed" count={completedInterviews} total={totalApps} color="#3b82f6" t={t} />
            <FunnelBar label="Rejected" count={rejected} total={totalApps} color="#ef4444" t={t} />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-5 border transition-colors duration-300`}>
            <h4 className={`text-sm font-bold mb-4 ${t.cardText}`}>User Roles</h4>
            {roleDist.length === 0 ? <p className={`text-sm ${t.textMutedDark}`}>No users</p> : (
              <div className="space-y-2.5">
                {roleDist.map(([role, count], idx) => {
                  const barColors = ["bg-[#d4af37]", "bg-[#c5a059]", "bg-[#e5c158]", "bg-[#996515]", "bg-[#8B6914]", "bg-[#a07820]"];
                  return (
                    <div key={role} className="flex items-center justify-between py-1 text-sm">
                      <span className={t.textMutedLight}>{role}</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-16 h-1.5 rounded-full overflow-hidden ${t.featureCard}`}>
                          <div className={`h-full rounded-full ${barColors[idx % barColors.length]}`} style={{ width: `${(count / Math.max(...roleDist.map(r => r[1]))) * 100}%` }} />
                        </div>
                        <span className={`font-semibold text-xs w-6 text-right ${t.cardText}`}>{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-5 border transition-colors duration-300`}>
            <h4 className={`text-sm font-bold mb-4 ${t.cardText}`}>Recent Jobs</h4>
            {(stats?.recentJobs || []).length === 0 ? <p className={`text-sm ${t.textMutedDark}`}>No jobs</p> : (
              <div className="space-y-2.5">
                {stats.recentJobs.map((job) => (
                  <div key={job._id} className={`py-2.5 border-b ${t.tableBorderLight} last:border-0`}>
                    <p className={`text-sm font-medium ${t.textBright}`}>{job.title}</p>
                    <p className={`text-xs mt-0.5 ${t.textMutedDark}`}>by {job.postedBy?.name || "Unknown"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-5 border transition-colors duration-300`}>
            <h4 className={`text-sm font-bold mb-4 ${t.cardText}`}>Recent Applications</h4>
            {(stats?.recentApps || []).length === 0 ? <p className={`text-sm ${t.textMutedDark}`}>No applications</p> : (
              <div className="space-y-2.5">
                {stats.recentApps.map((app) => (
                  <div key={app._id} className={`py-2.5 border-b ${t.tableBorderLight} last:border-0`}>
                    <p className={`text-sm ${t.textBright}`}>{app.student?.name} → {app.job?.title}</p>
                    <span className={`inline-block text-[11px] px-2 py-0.5 rounded-lg mt-1 font-medium ${
                      app.status === "shortlisted" ? `${t.accentBg} ${t.accentText}` :
                      app.status === "rejected" ? `${t.dangerBg} ${t.dangerText}` :
                      `${t.featureCard} ${t.textMuted}`
                    }`}>{app.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderJobs = () => {
    if (loading) return <Skeleton rows={5} cols={5} t={t} />;
    return (
      <div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search jobs by title, location, or poster..." resultCount={filtered.total} t={t} />
        <div className={`${t.surface} backdrop-blur-2xl rounded-3xl overflow-hidden border transition-colors duration-300`}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead><tr className={`border-b ${t.tableBorder}`}>
                {["Title","Location","Posted By","Date","Actions"].map((h) => <th key={h} className={`px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider ${t.textMutedDark}`}>{h}</th>)}
              </tr></thead>
              <tbody className={`divide-y ${t.tableBorderLight}`}>
                {filtered.items.length === 0 ? <tr><td colSpan="5" className={`px-6 py-12 text-center text-sm ${t.textMutedDark}`}>No jobs found</td></tr> :
                  filtered.items.map((job) => (
                    <tr key={job._id} className={`${t.tableRow} transition-colors cursor-pointer`} onClick={() => openDetail(job, "job")}>
                      <td className={`px-6 py-4 text-sm font-medium ${t.textBright}`}>{job.title}</td>
                      <td className={`px-6 py-4 text-sm ${t.textMuted}`}>{job.location}</td>
                      <td className={`px-6 py-4 text-sm ${t.textMuted}`}>{job.postedBy?.name || "Unknown"}</td>
                      <td className={`px-6 py-4 text-sm ${t.textMutedDark}`}>{new Date(job.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4"><button onClick={(e) => { e.stopPropagation(); handleDeleteJob(job._id); }}
                        className={`${t.textMutedDark} hover:text-red-400 transition p-1.5 ${t.dangerBg} hover:${t.dangerBg} rounded-xl`}><FaTrash size={13} /></button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.total} onPageChange={setPage} t={t} />
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={() => exportCSV(["Title","Location","Posted By","Date"], filtered.raw.map((j) => [j.title, j.location, j.postedBy?.name || "", new Date(j.createdAt).toLocaleDateString()]), "jobs")}
            className={`flex items-center gap-2 px-4 py-2 text-xs border rounded-2xl transition-all ${t.tableBorder} ${t.textMuted} ${t.hoverLight}`}>
            <FaDownload /> Export CSV
          </button>
        </div>
      </div>
    );
  };

  const renderApplications = () => {
    if (loading) return <Skeleton rows={5} cols={5} t={t} />;
    return (
      <div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by student name or job title..."
          filter={filter} onFilterChange={setFilter} filterOptions={[{value:"shortlisted",label:"Shortlisted"},{value:"rejected",label:"Rejected"},{value:"pending",label:"Pending"}]} resultCount={filtered.total} t={t} />
        <div className={`${t.surface} backdrop-blur-2xl rounded-3xl overflow-hidden border transition-colors duration-300`}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead><tr className={`border-b ${t.tableBorder}`}>
                {["Student","Job","Status","Applied","Actions"].map((h) => <th key={h} className={`px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider ${t.textMutedDark}`}>{h}</th>)}
              </tr></thead>
              <tbody className={`divide-y ${t.tableBorderLight}`}>
                {filtered.items.length === 0 ? <tr><td colSpan="5" className={`px-6 py-12 text-center text-sm ${t.textMutedDark}`}>No applications found</td></tr> :
                  filtered.items.map((app) => (
                    <tr key={app._id} className={`${t.tableRow} transition-colors cursor-pointer`} onClick={() => openDetail(app, "application")}>
                      <td className={`px-6 py-4 text-sm ${t.textBright}`}>{app.student?.name || "Unknown"}</td>
                      <td className={`px-6 py-4 text-sm ${t.textMuted}`}>{app.job?.title || "Unknown"}</td>
                      <td className="px-6 py-4"><span className={`text-[11px] px-2.5 py-1 rounded-lg font-medium ${
                        app.status === "shortlisted" ? `${t.accentBg} ${t.accentText}` : app.status === "rejected" ? `${t.dangerBg} ${t.dangerText}` : `${t.featureCard} ${t.textMuted}`
                      }`}>{app.status}</span></td>
                      <td className={`px-6 py-4 text-sm ${t.textMutedDark}`}>{new Date(app.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleStatusUpdate(app._id, "shortlisted")} className={`${t.accentBg} ${t.accentText} px-3 py-1.5 rounded-xl hover:brightness-110 transition text-xs font-medium disabled:opacity-30`} disabled={app.status === "shortlisted"}>Shortlist</button>
                          <button onClick={() => handleStatusUpdate(app._id, "rejected")} className={`${t.dangerBg} ${t.dangerText} px-3 py-1.5 rounded-xl ${t.dangerHover} transition text-xs font-medium disabled:opacity-30`} disabled={app.status === "rejected"}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.total} onPageChange={setPage} t={t} />
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={() => exportCSV(["Student","Job","Status","Date"], filtered.raw.map((a) => [a.student?.name || "", a.job?.title || "", a.status, new Date(a.createdAt).toLocaleDateString()]), "applications")}
            className={`flex items-center gap-2 px-4 py-2 text-xs border rounded-2xl transition-all ${t.tableBorder} ${t.textMuted} ${t.hoverLight}`}>
            <FaDownload /> Export CSV
          </button>
        </div>
      </div>
    );
  };

  const renderResumes = () => {
    if (loading) return <Skeleton rows={5} cols={4} t={t} />;
    return (
      <div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by student name or file name..." resultCount={filtered.total} t={t} />
        <div className={`${t.surface} backdrop-blur-2xl rounded-3xl overflow-hidden border transition-colors duration-300`}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead><tr className={`border-b ${t.tableBorder}`}>
                {["Student","File","Uploaded","Details"].map((h) => <th key={h} className={`px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider ${t.textMutedDark}`}>{h}</th>)}
              </tr></thead>
              <tbody className={`divide-y ${t.tableBorderLight}`}>
                {filtered.items.length === 0 ? <tr><td colSpan="4" className={`px-6 py-12 text-center text-sm ${t.textMutedDark}`}>No resumes uploaded</td></tr> :
                  filtered.items.map((r) => (
                    <tr key={r._id} className={`${t.tableRow} transition-colors cursor-pointer`} onClick={() => openDetail(r, "resume")}>
                      <td className={`px-6 py-4 text-sm ${t.textBright}`}>{r.student?.name || "Unknown"}</td>
                      <td className={`px-6 py-4 text-sm ${t.textMuted}`}>{r.fileName}</td>
                      <td className={`px-6 py-4 text-sm ${t.textMutedDark}`}>{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4"><button onClick={(e) => { e.stopPropagation(); openDetail(r, "resume"); }}
                        className={`${t.accentText} font-medium hover:underline text-xs flex items-center gap-1.5`}><FaEye size={11} /> View</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.total} onPageChange={setPage} t={t} />
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={() => exportCSV(["Student","File","Email","Skills","Uploaded"], filtered.raw.map((r) => [r.student?.name || "", r.fileName, r.extractedData?.email || "", r.extractedData?.technical_skills || "", new Date(r.createdAt).toLocaleDateString()]), "resumes")}
            className={`flex items-center gap-2 px-4 py-2 text-xs border rounded-2xl transition-all ${t.tableBorder} ${t.textMuted} ${t.hoverLight}`}>
            <FaDownload /> Export CSV
          </button>
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    if (loading) return <Skeleton rows={5} cols={5} t={t} />;
    return (
      <div>
        <div className="flex items-center justify-between mb-5">
          <SearchBar value={search} onChange={setSearch} placeholder="Search users by name or email..."
            filter={filter} onFilterChange={setFilter} filterOptions={ROLES.map((r) => ({ value: r, label: r }))} resultCount={filtered.total} t={t} />
          <button onClick={() => setShowUserModal(true)}
            className="bg-gradient-to-r from-[#d4af37] via-[#c5a059] to-[#996515] hover:brightness-110 text-[#070a12] px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold transition-all shrink-0 ml-3 shadow-lg shadow-[#d4af37]/15">
            <FaUserPlus size={14} /> Add User
          </button>
        </div>
        <div className={`${t.surface} backdrop-blur-2xl rounded-3xl overflow-hidden border transition-colors duration-300`}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead><tr className={`border-b ${t.tableBorder}`}>
                {["Name","Email","Role","HR Plan","Actions"].map((h) => <th key={h} className={`px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider ${t.textMutedDark}`}>{h}</th>)}
              </tr></thead>
              <tbody className={`divide-y ${t.tableBorderLight}`}>
                {filtered.items.length === 0 ? <tr><td colSpan="5" className={`px-6 py-12 text-center text-sm ${t.textMutedDark}`}>No users found</td></tr> :
                  filtered.items.map((user) => (
                    <tr key={user._id} className={`${t.tableRow} transition-colors cursor-pointer`} onClick={() => openDetail(user, "user")}>
                      <td className={`px-6 py-4 text-sm font-medium ${t.textBright}`}>{user.name}</td>
                      <td className={`px-6 py-4 text-sm ${t.textMuted}`}>{user.email}</td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <select value={user.role} onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          className={`${t.input} border rounded-xl px-2.5 py-1.5 text-xs outline-none transition-all focus:ring-2 focus:ring-[#d4af37]/20`}>
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        {user.role === "HR" ? (
                          <select value={user.subscriptionPlan || "trial"} onChange={(e) => handleSubscriptionChange(user._id, e.target.value)}
                            className={`${t.input} border rounded-xl px-2.5 py-1.5 text-xs outline-none transition-all focus:ring-2 focus:ring-[#d4af37]/20`}>
                            {SUBSCRIPTION_PLANS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                          </select>
                        ) : <span className={`${t.textMutedDark} text-xs`}>—</span>}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleDeleteUser(user._id)}
                          className={`${t.textMutedDark} hover:text-red-400 transition p-1.5 ${t.dangerBg} rounded-xl`}><FaTrash size={13} /></button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.total} onPageChange={setPage} t={t} />
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={() => exportCSV(["Name","Email","Role","HR Plan"], filtered.raw.map((u) => [u.name, u.email, u.role, u.subscriptionPlan || ""]), "users")}
            className={`flex items-center gap-2 px-4 py-2 text-xs border rounded-2xl transition-all ${t.tableBorder} ${t.textMuted} ${t.hoverLight}`}>
            <FaDownload /> Export CSV
          </button>
        </div>
      </div>
    );
  };

  const renderInterviews = () => {
    if (loading) return <Skeleton rows={5} cols={5} t={t} />;
    return (
      <div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by job title or student name..."
          filter={filter} onFilterChange={setFilter} filterOptions={[{value:"scheduled",label:"Scheduled"},{value:"completed",label:"Completed"},{value:"cancelled",label:"Cancelled"}]} resultCount={filtered.total} t={t} />
        <div className={`${t.surface} backdrop-blur-2xl rounded-3xl overflow-hidden border transition-colors duration-300`}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead><tr className={`border-b ${t.tableBorder}`}>
                {["Job","Student","Scheduled","Status","Feedback"].map((h) => <th key={h} className={`px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider ${t.textMutedDark}`}>{h}</th>)}
              </tr></thead>
              <tbody className={`divide-y ${t.tableBorderLight}`}>
                {filtered.items.length === 0 ? <tr><td colSpan="5" className={`px-6 py-12 text-center text-sm ${t.textMutedDark}`}>No interviews found</td></tr> :
                  filtered.items.map((iv) => (
                    <tr key={iv._id} className={`${t.tableRow} transition-colors cursor-pointer`} onClick={() => openDetail(iv, "interview")}>
                      <td className={`px-6 py-4 text-sm ${t.textBright}`}>{iv.job?.title || "Unknown"}</td>
                      <td className={`px-6 py-4 text-sm ${t.textBright}`}>{iv.application?.student?.name || "Unknown"}</td>
                      <td className={`px-6 py-4 text-sm ${t.textMutedDark}`}>{new Date(iv.scheduledAt).toLocaleString()}</td>
                      <td className="px-6 py-4"><span className={`text-[11px] px-2.5 py-1 rounded-lg font-medium ${
                        iv.status === "scheduled" ? `${t.accentBg} ${t.accentText}` : iv.status === "completed" ? `${t.successBg} ${t.successText}` : `${t.dangerBg} ${t.dangerText}`
                      }`}>{iv.status}</span></td>
                      <td className="px-6 py-4 text-sm">
                        {iv.feedback?.decision ? <span className={`text-xs font-medium ${iv.feedback.decision === "selected" ? "text-emerald-400" : iv.feedback.decision === "rejected" ? "text-red-400" : "text-yellow-400"}`}>{iv.feedback.decision} ({iv.feedback.rating}/5)</span>
                          : <span className={t.textMutedDark}>No feedback</span>}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.total} onPageChange={setPage} t={t} />
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    if (loading) return <Skeleton rows={4} cols={4} t={t} />;
    const data = analyticsData || {};
    const totalShortlisted = applications.filter((a) => a.status === "shortlisted").length;
    const maxApplications = Math.max(...(data.appsPerJob || []).map((j) => j.applications || 0), 1);
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={data.totalUsers ?? users.length} icon={FaUsers} color="#d4af37" delay={0} t={t} />
          <StatCard label="Total Jobs" value={data.totalJobs ?? jobs.length} icon={FaBriefcase} color="#c5a059" delay={0.05} t={t} />
          <StatCard label="Applications" value={data.totalApplications ?? applications.length} icon={FaFileAlt} color="#e5c158" delay={0.1} t={t} />
          <StatCard label="Shortlist Rate" value={data.shortlistRate ? `${data.shortlistRate}%` : `${Math.round((totalShortlisted / Math.max(applications.length, 1)) * 100)}%`} icon={FaCheckCircle} color="#10b981" delay={0.15} t={t} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-5 border transition-colors duration-300`}>
            <h4 className={`text-sm font-bold mb-4 ${t.cardText}`}>Pipeline Summary</h4>
            <div className="space-y-3 text-sm">
              {[["Shortlisted", data.shortlisted ?? applications.filter((a) => a.status === "shortlisted").length], ["Rejected", data.rejected ?? applications.filter((a) => a.status === "rejected").length], ["Pending", data.pending ?? applications.filter((a) => a.status === "pending").length]].map(([l, v]) => (
                <div key={l} className="flex justify-between items-center"><span className={t.textMutedLight}>{l}</span><span className={`font-semibold ${t.cardText}`}>{v}</span></div>
              ))}
            </div>
          </div>
          <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-5 border lg:col-span-2 transition-colors duration-300`}>
            <h4 className={`text-sm font-bold mb-5 ${t.cardText}`}>Applications by Job</h4>
            <div className="space-y-3.5">
              {(data.appsPerJob || []).length === 0 ? <p className={`text-sm ${t.textMutedDark}`}>No job analytics available.</p> :
                (data.appsPerJob || []).map((job) => (
                  <div key={job.jobId || job.title} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs"><span className={`truncate mr-3 ${t.textMutedLight}`}>{job.title}</span><span className={`shrink-0 font-medium ${t.cardText}`}>{job.applications || 0}</span></div>
                    <div className={`h-2 rounded-full overflow-hidden ${t.featureCard}`}><div className="h-full rounded-full bg-[#d4af37]" style={{ width: `${((job.applications || 0) / maxApplications) * 100}%` }} /></div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAdminTools = () => {
    const auditLogs = [
      { time: "Today, 09:14 AM", action: "Role changed", actor: "Super Admin", target: "HR → LPU Faculty", result: "Approved" },
      { time: "Today, 08:33 AM", action: "User created", actor: "Operations", target: "Aisha Khan", result: "Success" },
      { time: "Yesterday, 06:42 PM", action: "Bulk import", actor: "System Bot", target: "42 candidate records", result: "Completed" },
      { time: "Yesterday, 04:18 PM", action: "Job archived", actor: "Admin", target: "Backend Engineer", result: "Removed" },
    ];
    const systemLogs = [
      { time: "Today, 10:02 AM", event: "Backup validation", status: "Healthy", details: "Checksum matched with last snapshot." },
      { time: "Today, 09:41 AM", event: "Token refresh", status: "Success", details: "Session rotation completed for 7 admin users." },
      { time: "Today, 07:12 AM", event: "Database sync", status: "Warning", details: "3 records were retried after transient timeout." },
      { time: "Yesterday, 11:28 PM", event: "Resume parser", status: "Info", details: "42 files processed with 98% extraction accuracy." },
    ];
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Audit Logs" value="128" icon={FaFileAlt} color="#d4af37" delay={0} t={t} />
          <StatCard label="System Alerts" value="12" icon={FaExclamationTriangle} color="#f59e0b" delay={0.05} t={t} />
          <StatCard label="Backups" value="Healthy" icon={FaDownload} color="#10b981" delay={0.1} t={t} />
          <StatCard label="Notifications" value="09" icon={FaBell} color="#3b82f6" delay={0.15} t={t} />
          <StatCard label="Roles" value="04" icon={FaUserTie} color="#8b5cf6" delay={0.2} t={t} />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-5 border transition-colors duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-bold ${t.cardText}`}>Audit Logs</h3>
              <span className={`text-[10px] px-2 py-1 rounded-lg ${t.accentBg} ${t.accentText} font-medium`}>Live</span>
            </div>
            <div className="space-y-2.5">
              {auditLogs.map((log, idx) => (
                <div key={idx} className={`border rounded-2xl p-3.5 ${t.featureCard} transition-colors duration-300`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-sm font-medium ${t.textBright}`}>{log.action}</span>
                    <span className={`text-[10px] shrink-0 ${t.textMutedDark}`}>{log.time}</span>
                  </div>
                  <p className={`mt-2 text-xs ${t.textMuted}`}>Actor: {log.actor}</p>
                  <p className={`text-xs ${t.textMuted}`}>Target: {log.target}</p>
                  <p className={`mt-2 text-xs ${t.accentText}`}>Result: {log.result}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-5 border transition-colors duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-bold ${t.cardText}`}>System Activity Logs</h3>
              <span className={`text-[10px] px-2 py-1 rounded-lg ${t.successBg} ${t.successText} font-medium`}>Synced</span>
            </div>
            <div className="space-y-2.5">
              {systemLogs.map((entry, idx) => (
                <div key={idx} className={`border rounded-2xl p-3.5 ${t.featureCard} transition-colors duration-300`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-sm font-medium ${t.textBright}`}>{entry.event}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium ${
                      entry.status === "Healthy" || entry.status === "Success" ? `${t.successBg} ${t.successText}` :
                      entry.status === "Warning" ? `${t.warningBg} ${t.warningText}` : `${t.infoBg} ${t.infoText}`
                    }`}>{entry.status}</span>
                  </div>
                  <p className={`mt-2 text-[11px] ${t.textMutedDark}`}>{entry.time}</p>
                  <p className={`text-xs ${t.textMuted}`}>{entry.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-5 border transition-colors duration-300`}>
            <h3 className={`text-sm font-bold mb-4 ${t.cardText}`}>Database Backup</h3>
            <div className="space-y-3 text-sm">
              {[["Status", <span className={`${t.successText} font-semibold`}>Healthy</span>], ["Last backup", <span className={t.textBright}>Today, 02:40 AM</span>], ["Next backup", <span className={t.textBright}>Tonight, 02:30 AM</span>], ["Size", <span className={t.textBright}>1.8 GB</span>]].map(([l, v]) => (
                <div key={l} className="flex justify-between"><span className={t.textMutedLight}>{l}</span>{v}</div>
              ))}
            </div>
            <button className={`mt-5 w-full rounded-2xl border py-3 text-sm font-bold transition-all bg-gradient-to-r ${t.btnGold} hover:brightness-110 active:scale-[0.99]`}>Trigger Manual Backup</button>
          </div>
          <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-5 border transition-colors duration-300`}>
            <h3 className={`text-sm font-bold mb-4 ${t.cardText}`}>Notification Center</h3>
            <div className="space-y-2.5">
              {[{ title: "New application alert", detail: "3 candidates applied for Business Analyst role.", important: true },
                { title: "Interview schedule update", detail: "2 interviews were re-assigned to the hiring panel.", important: false },
                { title: "Storage warning", detail: "Backup storage is at 84% capacity.", important: true }
              ].map((item, idx) => (
                <div key={idx} className={`rounded-2xl border p-3.5 ${item.important ? `${t.warningBg} border-amber-500/20` : `${t.featureCard}`}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-medium ${t.textBright}`}>{item.title}</span>
                    {item.important && <span className={`text-[10px] px-1.5 py-0.5 rounded-lg ${t.warningBg} ${t.warningText} font-medium`}>High</span>}
                  </div>
                  <p className={`mt-1.5 text-xs ${t.textMuted}`}>{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-5 border transition-colors duration-300`}>
            <h3 className={`text-sm font-bold mb-4 ${t.cardText}`}>Role Permissions</h3>
            <div className="space-y-2.5">
              {[{ role: "Admin", access: "Full access", actions: "Manage users, jobs, analytics, backup, and logs" },
                { role: "HR", access: "Limited access", actions: "Create jobs, review applications, schedule interviews" },
                { role: "Faculty", access: "Department access", actions: "Review LPU student records and interview outcomes" },
                { role: "Student", access: "Self-service", actions: "View profile, apply to jobs, attend interviews" }
              ].map((r) => (
                <div key={r.role} className={`border rounded-2xl p-3.5 ${t.featureCard} transition-colors duration-300`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-medium ${t.textBright}`}>{r.role}</span>
                    <span className={`text-[10px] ${t.accentText} font-medium`}>{r.access}</span>
                  </div>
                  <p className={`mt-2 text-xs ${t.textMuted}`}>{r.actions}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBulkUpload = () => (
    <div className="max-w-4xl space-y-5">
      <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-6 border transition-colors duration-300`}>
        <h2 className={`text-base font-bold mb-1 ${t.cardText}`}>Bulk Create Users</h2>
        <p className={`text-sm mb-5 ${t.textMuted}`}>CSV format: name, email, role, password, uid</p>
        <textarea value={bulkCsvText} onChange={(e) => setBulkCsvText(e.target.value)} rows={12}
          className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#d4af37]/20 font-mono ${t.input}`}
          placeholder={"name,email,role,password,uid\nJohn Doe,john@example.com,Student,securePass123,"} />
        <div className="mt-4 flex justify-end">
          <button onClick={handleBulkUploadUsers} disabled={bulkUploading}
            className={`rounded-2xl px-5 py-3 text-sm font-bold transition-all shadow-lg shadow-[#d4af37]/10 bg-gradient-to-r ${t.btnGold} hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed`}>
            {bulkUploading ? "Importing..." : "Import Users"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return (
      <div className="grid max-w-4xl grid-cols-1 gap-5 lg:grid-cols-2">
        <section className={`${t.surface} backdrop-blur-2xl rounded-3xl p-6 border transition-colors duration-300`}>
          <div className="mb-5 flex items-center gap-3">
            <div className={`rounded-2xl p-2.5 ${t.accentBg}`}><FaCog className={`${t.accentText} text-sm`} /></div>
            <div><h2 className={`text-base font-bold ${t.cardText}`}>Account Settings</h2><p className={`text-xs mt-0.5 ${t.textMutedDark}`}>Manage your admin account</p></div>
          </div>
          <div className="space-y-3.5 text-sm">
            {[["Name", user.name || "Admin"], ["Email", user.email || "Not available"], ["Role", <span className={t.accentText}>{user.role || "Admin"}</span>]].map(([l, v]) => (
              <div key={l}><span className={`text-[11px] uppercase tracking-wider font-semibold ${t.textMutedDark}`}>{l}</span><p className={`mt-1 ${t.textBright}`}>{v}</p></div>
            ))}
          </div>
        </section>
        <section className={`${t.surface} backdrop-blur-2xl rounded-3xl p-6 border transition-colors duration-300`}>
          <div className="mb-5"><h2 className={`text-base font-bold ${t.cardText}`}>Change Password</h2><p className={`text-xs mt-0.5 ${t.textMutedDark}`}>Verify your old password before saving a new one.</p></div>
          <form onSubmit={handleAdminPasswordChange} className="space-y-4">
            <input type="password" placeholder="Old password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} required className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#d4af37]/20 ${t.input}`} />
            <input type="password" placeholder="New password (minimum 8 characters)" minLength={8} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#d4af37]/20 ${t.input}`} />
            <button type="submit" className={`rounded-2xl px-5 py-3 text-sm font-bold transition-all bg-gradient-to-r ${t.btnGold} hover:brightness-110 active:scale-[0.99] shadow-lg shadow-[#d4af37]/10`}>Update Password</button>
          </form>
        </section>
        <section className={`${t.surface} backdrop-blur-2xl rounded-3xl p-6 border lg:col-span-2 transition-colors duration-300`}>
          <h2 className={`text-base font-bold ${t.cardText}`}>Appearance</h2>
          <p className={`mt-1 text-xs ${t.textMutedDark}`}>Toggle between light and dark themes.</p>
          <button type="button" onClick={() => setTheme((c) => c === "light" ? "dark" : "light")}
            className={`mt-4 flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-bold transition-all bg-gradient-to-r ${t.btnGold} hover:brightness-110 active:scale-[0.99] shadow-lg shadow-[#d4af37]/10`}>
            {theme === "light" ? <FaMoon size={14} /> : <FaSun size={14} />} Switch to {theme === "light" ? "Dark" : "Light"} Theme
          </button>
        </section>
      </div>
    );
  };

  /* ── DETAIL PANEL ── */
  const renderDetailPanel = () => {
    if (!detailItem) return null;
    const close = () => { setDetailItem(null); setDetailType(null); };
    return (
      <div className="fixed inset-0 z-40 flex justify-end">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
        <motion.div initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className={`${t.surface} relative w-full max-w-md border-l shadow-2xl overflow-y-auto transition-colors duration-300`}>
          <div className={`sticky top-0 backdrop-blur-xl border-b px-6 py-4 flex items-center justify-between z-10 ${t.surface}`}>
            <h3 className={`text-base font-bold capitalize ${t.cardText}`}>{detailType} Details</h3>
            <button onClick={close} className={`${t.textMutedDark} ${t.hoverTextStrong} transition p-1.5 rounded-xl ${t.hoverLight}`}><FaTimes size={16} /></button>
          </div>
          <div className="p-6 space-y-4">
            {detailType === "job" && (<>
              <DetailRow label="Title" value={detailItem.title} t={t} />
              <DetailRow label="Location" value={detailItem.location} t={t} />
              <DetailRow label="Posted By" value={detailItem.postedBy?.name} t={t} />
              <DetailRow label="Description" value={detailItem.description} t={t} />
              <DetailRow label="Created" value={new Date(detailItem.createdAt).toLocaleString()} t={t} />
            </>)}
            {detailType === "application" && (<>
              <DetailRow label="Student" value={detailItem.student?.name} t={t} />
              <DetailRow label="Email" value={detailItem.student?.email} icon={FaEnvelope} t={t} />
              <DetailRow label="Job" value={detailItem.job?.title} t={t} />
              <DetailRow label="Status" value={<span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                detailItem.status === "shortlisted" ? `${t.accentBg} ${t.accentText}` : detailItem.status === "rejected" ? `${t.dangerBg} ${t.dangerText}` : `${t.featureCard} ${t.textMuted}`
              }`}>{detailItem.status}</span>} t={t} />
              <DetailRow label="Applied" value={new Date(detailItem.createdAt).toLocaleString()} t={t} />
              {detailItem.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { handleStatusUpdate(detailItem._id, "shortlisted"); close(); }} className="flex-1 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#c5a059] text-[#070a12] rounded-2xl text-sm font-bold hover:brightness-110 transition">Shortlist</button>
                  <button onClick={() => { handleStatusUpdate(detailItem._id, "rejected"); close(); }} className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl text-sm font-bold hover:brightness-110 transition">Reject</button>
                </div>
              )}
            </>)}
            {detailType === "resume" && (<>
              <DetailRow label="Student" value={detailItem.student?.name} t={t} />
              <DetailRow label="File" value={detailItem.fileName} t={t} />
              <DetailRow label="Uploaded" value={new Date(detailItem.createdAt).toLocaleString()} t={t} />
              <DetailRow label="Status" value={detailItem.status} t={t} />
              <div className={`border-t pt-4 mt-4 ${t.tableBorder}`}>
                <h4 className={`text-sm font-bold mb-3 ${t.cardText}`}>Extracted Data</h4>
                <DetailRow label="Email" value={detailItem.extractedData?.email} icon={FaEnvelope} t={t} />
                <DetailRow label="Contact" value={detailItem.extractedData?.contact_no} icon={FaPhone} t={t} />
                <DetailRow label="Skills" value={detailItem.extractedData?.technical_skills} icon={FaCode} t={t} />
                <DetailRow label="Projects" value={detailItem.extractedData?.project_details} t={t} />
                <DetailRow label="Certifications" value={detailItem.extractedData?.certifications} icon={FaCertificate} t={t} />
                <DetailRow label="Other" value={detailItem.extractedData?.other_info} t={t} />
              </div>
            </>)}
            {detailType === "interview" && (<>
              <DetailRow label="Job" value={detailItem.job?.title} t={t} />
              <DetailRow label="Student" value={detailItem.application?.student?.name} t={t} />
              <DetailRow label="Scheduled" value={new Date(detailItem.scheduledAt).toLocaleString()} t={t} />
              <DetailRow label="Duration" value={`${detailItem.duration || "—"} min`} t={t} />
              <DetailRow label="Meeting Link" value={detailItem.meetingLink ? <a href={detailItem.meetingLink} target="_blank" rel="noreferrer" className={`${t.accentText} hover:underline`}>Join</a> : "—"} t={t} />
              <DetailRow label="Status" value={<span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                detailItem.status === "scheduled" ? `${t.accentBg} ${t.accentText}` : detailItem.status === "completed" ? `${t.successBg} ${t.successText}` : `${t.featureCard} ${t.textMuted}`
              }`}>{detailItem.status}</span>} t={t} />
              {detailItem.feedback?.decision && (
                <div className={`border-t pt-4 mt-4 ${t.tableBorder}`}>
                  <h4 className={`text-sm font-bold mb-3 ${t.cardText}`}>Feedback</h4>
                  <DetailRow label="Rating" value={`${detailItem.feedback.rating}/5`} t={t} />
                  <DetailRow label="Comments" value={detailItem.feedback.comments} t={t} />
                  <DetailRow label="Decision" value={<span className={`font-medium ${detailItem.feedback.decision === "selected" ? "text-emerald-400" : detailItem.feedback.decision === "rejected" ? "text-red-400" : "text-yellow-400"}`}>{detailItem.feedback.decision}</span>} t={t} />
                </div>
              )}
            </>)}
            {detailType === "user" && (<>
              <DetailRow label="Name" value={detailItem.name} t={t} />
              <DetailRow label="Email" value={detailItem.email} icon={FaEnvelope} t={t} />
              <DetailRow label="University UID" value={detailItem.uid} t={t} />
              <DetailRow label="Role" value={<span className={t.accentText}>{detailItem.role}</span>} t={t} />
              <DetailRow label="Subscription Plan" value={detailItem.subscriptionPlan} t={t} />
              <DetailRow label="Trial Ends" value={detailItem.trialEndsAt ? new Date(detailItem.trialEndsAt).toLocaleString() : "—"} t={t} />
              <DetailRow label="Plan Ends" value={detailItem.planEndsAt ? new Date(detailItem.planEndsAt).toLocaleString() : "—"} t={t} />
              <DetailRow label="Account Created" value={detailItem.createdAt ? new Date(detailItem.createdAt).toLocaleString() : "—"} t={t} />
              <div className={`border-t pt-4 mt-2 ${t.tableBorder}`}>
                <h4 className={`text-sm font-bold mb-3 ${t.cardText}`}>Complete User Record</h4>
                <pre className={`max-h-64 overflow-auto rounded-2xl border p-3 text-xs leading-relaxed whitespace-pre-wrap break-words ${t.featureCard} ${t.textMuted}`}>
                  {JSON.stringify(Object.fromEntries(Object.entries(detailItem).filter(([k]) => k !== "password")), null, 2)}
                </pre>
              </div>
            </>)}
          </div>
        </motion.div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════
     MAIN RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <div className={`login-neo min-h-screen ${t.page} relative overflow-hidden font-sans transition-colors duration-500`} data-theme={theme}>
      <Toast toasts={toasts} remove={removeToast} t={t} />
      <ConfirmModal {...confirm} onCancel={() => setConfirm({ open: false })} t={t} />

      {/* Ambient Glow Background */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none transition-colors duration-500"
        style={{ background: theme === "dark" ? "linear-gradient(to bottom right, rgba(212,175,55,0.08), rgba(139,26,26,0.08), transparent)" : "linear-gradient(to bottom right, rgba(212,175,55,0.10), rgba(139,26,26,0.05), transparent)" }} />
      <div className="absolute -bottom-40 -right-40 w-[650px] h-[650px] rounded-full blur-[150px] pointer-events-none transition-colors duration-500"
        style={{ background: theme === "dark" ? "linear-gradient(to top left, rgba(212,175,55,0.08), rgba(88,28,135,0.12), transparent)" : "linear-gradient(to top left, rgba(212,175,55,0.06), rgba(139,26,26,0.03), transparent)" }} />
      <div className="absolute inset-0 bg-[size:32px_32px] opacity-30 pointer-events-none"
        style={{ backgroundImage: `linear-gradient(to right, ${t.gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${t.gridLine} 1px, transparent 1px)` }} />

      {/* Sidebar */}
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        items={TABS.map((tab) => ({ ...tab, count: tabCounts[tab.key] }))}
        activeKey={activeTab} onSelect={(key) => { setActiveTab(key); setSidebarOpen(false); }}
        onLogout={handleLogout}
        theme={{ background: t.sidebarBg, border: t.sidebarBorder, card: t.sidebarCard, text: t.cardText, muted: t.sidebarMuted, accent: "#d4af37", danger: t.sidebarDanger, dangerBackground: t.sidebarDangerBg, activeBackground: t.sidebarActive }}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-64"}`}>
        {/* Header */}
        <header className={`sticky top-0 z-20 backdrop-blur-xl border-b transition-colors duration-300 ${t.surface}`}>
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setSidebarOpen(true)} className={`p-2 rounded-xl border ${t.tableBorder} ${t.textMuted} ${t.hoverLight} transition-all lg:hidden`} aria-label="Open navigation">
                <FaBars size={16} />
              </button>
              <div>
                <h1 className={`text-lg font-bold ${t.cardText}`}>Dashboard</h1>
                <p className={`text-[11px] mt-0.5 ${t.textMutedDark}`}>{TABS.find((tab) => tab.key === activeTab)?.label || "Overview"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setTheme((c) => c === "dark" ? "light" : "dark")}
                className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300"
                style={{
                  background: theme === "dark" ? "rgba(30,35,50,0.8)" : "rgba(255,255,255,0.8)",
                  borderColor: theme === "dark" ? "rgba(212,175,55,0.3)" : "rgba(139,105,20,0.3)",
                  boxShadow: theme === "dark" ? "0 0 20px rgba(212,175,55,0.15)" : "0 0 20px rgba(139,105,20,0.10)",
                }}
                aria-label="Toggle theme">
                {theme === "dark" ? <FaSun className="text-[#d4af37] text-sm" /> : <FaMoon className="text-[#8B6914] text-sm" />}
              </button>
              <button className={`relative p-2 rounded-xl border ${t.tableBorder} ${t.textMuted} ${t.hoverLight} transition-all`}>
                <FaBell size={15} />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {activeTab === "overview" && renderOverview()}
              {activeTab === "jobs" && renderJobs()}
              {activeTab === "applications" && renderApplications()}
              {activeTab === "resumes" && renderResumes()}
              {activeTab === "users" && renderUsers()}
              {activeTab === "interviews" && renderInterviews()}
              {activeTab === "analytics" && renderAnalytics()}
              {activeTab === "tools" && renderAdminTools()}
              {activeTab === "bulk" && renderBulkUpload()}
              {activeTab === "settings" && renderSettings()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>{detailItem && renderDetailPanel()}</AnimatePresence>

      {/* Create User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`${t.card} backdrop-blur-2xl rounded-3xl p-7 w-full max-w-md shadow-2xl transition-colors duration-300`}>
            <h2 className={`text-lg font-bold mb-5 ${t.cardText}`}>Create New User</h2>
            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                {[["Full Name", "text", "name", "Full Name", true]].map(([, type, name, ph, req]) => (
                  <div key={name}>
                    <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${t.label}`}>{ph}</label>
                    <input type={type} placeholder={ph} value={newUser[name]} onChange={(e) => setNewUser({ ...newUser, [name]: e.target.value })} required={req}
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#d4af37]/20 ${t.input}`} />
                  </div>
                ))}
                {newUser.role.startsWith("LPU") && (
                  <div>
                    <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${t.label}`}>University UID</label>
                    <input type="text" placeholder="University UID" value={newUser.uid || ""} onChange={(e) => setNewUser({ ...newUser, uid: e.target.value })} required
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#d4af37]/20 ${t.input}`} />
                  </div>
                )}
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${t.label}`}>Role</label>
                  <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value, uid: e.target.value.startsWith("LPU") ? newUser.uid : "" })}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#d4af37]/20 ${t.input}`}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${t.label}`}>Password</label>
                  <input type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required
                    className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#d4af37]/20 ${t.input}`} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowUserModal(false)} className={`px-5 py-2.5 text-sm border rounded-2xl transition-all ${t.tableBorder} ${t.textMuted} ${t.hoverLight}`}>Cancel</button>
                <button type="submit" className={`px-6 py-2.5 text-sm font-bold rounded-2xl transition-all bg-gradient-to-r ${t.btnGold} hover:brightness-110 active:scale-[0.99] shadow-lg shadow-[#d4af37]/15`}>Create</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
