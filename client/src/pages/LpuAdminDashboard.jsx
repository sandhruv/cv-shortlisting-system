import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUsers, FaUpload, FaUserPlus, FaBuilding, FaSignOutAlt,
  FaSearch, FaDownload, FaFilter, FaChevronLeft, FaChevronRight,
  FaCheckCircle, FaTimesCircle, FaEye, FaTrash, FaChartBar,
  FaUserGraduate, FaUserTie, FaBriefcase, FaSpinner, FaFileAlt,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import Toast, { useToast } from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

const PAGE_SIZE = 10;
const TABS = [
  { key: "overview",    label: "Overview",    icon: FaChartBar },
  { key: "users",       label: "Users",       icon: FaUsers },
  { key: "jobs",        label: "Jobs",        icon: FaBriefcase },
  { key: "assignments", label: "Assignments", icon: FaBuilding },
  { key: "bulk",        label: "Bulk Upload", icon: FaUpload },
];

function StatCard({ label, value, icon: Icon, color = "#ff6b2b", delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:border-[#ff6b2b]/20 transition-all duration-300 group">
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

function SearchBar({ value, onChange, placeholder, filter, filterOptions, onFilterChange, resultCount }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      <div className="relative flex-1">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#ff6b2b] transition" />
      </div>
      {filterOptions && (
        <div className="relative">
          <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs" />
          <select value={filter} onChange={(e) => onFilterChange(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#ff6b2b] appearance-none cursor-pointer">
            <option value="all">All</option>
            {filterOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}
      {resultCount !== undefined && <div className="flex items-center text-xs text-white/40">{resultCount} result{resultCount !== 1 ? "s" : ""}</div>}
    </div>
  );
}

function Pagination({ page, total, onPageChange }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-white/5">
      <span className="text-xs text-white/40">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 0}
          className="p-1.5 rounded-lg border border-white/10 text-white/50 hover:bg-white/5 disabled:opacity-30 transition"><FaChevronLeft size={12} /></button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} onClick={() => onPageChange(i)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition ${i === page ? "bg-[#ff6b2b] text-[#0d131f]" : "text-white/50 hover:bg-white/5"}`}>{i + 1}</button>
        ))}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages - 1}
          className="p-1.5 rounded-lg border border-white/10 text-white/50 hover:bg-white/5 disabled:opacity-30 transition"><FaChevronRight size={12} /></button>
      </div>
    </div>
  );
}

function Skeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden animate-pulse">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-6 py-4 border-b border-white/5">
          {Array.from({ length: cols }).map((_, c) => <div key={c} className="h-4 bg-white/5 rounded flex-1" />)}
        </div>
      ))}
    </div>
  );
}

function exportCSV(headers, rows, filename) {
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")];
  const blob = new Blob(["\uFEFF" + csv.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click(); URL.revokeObjectURL(url);
}

export default function LpuAdminDashboard() {
  const navigate = useNavigate();
  const { toasts, add: toast, remove: removeToast } = useToast();

  // ── State ──
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [facultyUsers, setFacultyUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Search & Filter ──
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);

  // ── Confirm Modal ──
  const [confirm, setConfirm] = useState({ open: false, title: "", message: "", onConfirm: null });

  // ── Forms ──
  const [form, setForm] = useState({ uid: "", password: "", name: "", role: "LPU Student" });
  const [newJob, setNewJob] = useState({ title: "", description: "", requirements: "", location: "", allocatedFaculty: "", allocatedStudents: [] });
  const [file, setFile] = useState(null);
  const [uploadRole, setUploadRole] = useState("LPU Student");
  const [submitting, setSubmitting] = useState(false);

  // ── Assignment filters ──
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [facultySearch, setFacultySearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [showFacultyDropdown, setShowFacultyDropdown] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // FETCH DATA
  // ═══════════════════════════════════════════════════════════
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [u, s, j] = await Promise.all([
        api.get("/admin/users").catch(() => ({ data: [] })),
        api.get("/admin/stats").catch(() => ({ data: null })),
        api.get("/jobs").catch(() => ({ data: [] })),
      ]);
      const lpuUsers = u.data.filter((u) => u.role === "LPU Faculty" || u.role === "LPU Student");
      const lpuFaculty = u.data.filter((u) => u.role === "LPU Faculty");
      setUsers(lpuUsers);
      setFacultyUsers(lpuFaculty);
      setStats(s.data?.stats || s.data);
      setRecentJobs(s.data?.recentJobs || []);
      setJobs(j.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { setSearch(""); setFilter("all"); setPage(0); }, [activeTab]);

  // close faculty dropdown on outside click
  useEffect(() => {
    if (!showFacultyDropdown) return;
    const handler = () => setShowFacultyDropdown(false);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [showFacultyDropdown]);

  // ═══════════════════════════════════════════════════════════
  // FILTERED DATA
  // ═══════════════════════════════════════════════════════════
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const paginate = (arr) => { const s = page * PAGE_SIZE; return { items: arr.slice(s, s + PAGE_SIZE), total: arr.length }; };

    switch (activeTab) {
      case "users": {
        const f = users.filter((u) =>
          (`${u.name || ""} ${u.uid || ""} ${u.role || ""}`.toLowerCase().includes(q)) &&
          (filter === "all" || u.role === filter)
        );
        return { ...paginate(f), raw: f };
      }
      case "jobs": {
        const f = jobs.filter((j) =>
          (`${j.title || ""} ${j.location || ""} ${j.postedBy?.name || ""}`.toLowerCase().includes(q))
        );
        return { ...paginate(f), raw: f };
      }
      case "assignments": {
        const f = jobs.filter((j) => {
          if (assignmentFilter === "faculty") return Boolean(j.allocatedFaculty?._id);
          if (assignmentFilter === "students") return (j.allocatedStudents?.length || 0) > 0;
          if (assignmentFilter === "unassigned") return !j.allocatedFaculty?._id || (j.allocatedStudents?.length || 0) === 0;
          return true;
        }).filter((j) => {
          const term = (q + " " + assignmentSearch.toLowerCase()).trim();
          if (!term) return true;
          return [j.title, j.location, j.allocatedFaculty?.name || "", ...(j.allocatedStudents || []).map((s) => s.name || "")].join(" ").toLowerCase().includes(term);
        });
        return { ...paginate(f), raw: f };
      }
      default: return { items: [], total: 0, raw: [] };
    }
  }, [activeTab, users, jobs, search, filter, page, assignmentFilter, assignmentSearch]);

  // ═══════════════════════════════════════════════════════════
  // ALLOCATION SUMMARY
  // ═══════════════════════════════════════════════════════════
  const allocationSummary = useMemo(() => {
    const totalJobs = jobs.length;
    const facultyAssignedJobs = jobs.filter((j) => j.allocatedFaculty?._id).length;
    const studentAssignedJobs = jobs.filter((j) => (j.allocatedStudents?.length || 0) > 0).length;
    const unassignedJobs = Math.max(totalJobs - facultyAssignedJobs - studentAssignedJobs, 0);
    return { totalJobs, facultyAssignedJobs, studentAssignedJobs, unassignedJobs };
  }, [jobs]);

  const lpuStudents = useMemo(() => users.filter((u) => u.role === "LPU Student"), [users]);
  const selectedFaculty = useMemo(() => facultyUsers.find((f) => f._id === newJob.allocatedFaculty), [facultyUsers, newJob.allocatedFaculty]);

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/lpu-login"); };

  const handleManualCreate = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await api.post("/admin/users", form);
      toast("User created successfully!");
      setForm({ uid: "", password: "", name: "", role: "LPU Student" });
      fetchAll();
    } catch (err) { toast(err.response?.data?.message || "Failed to create user.", "error"); }
    setSubmitting(false);
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault(); if (!file) return toast("Please select an Excel file.", "error");
    const formData = new FormData(); formData.append("file", file); formData.append("targetRole", uploadRole);
    setSubmitting(true);
    try {
      const res = await api.post("/admin/bulk-upload-lpu", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast(res.data.message); fetchAll();
    } catch (err) { toast(err.response?.data?.message || "Bulk upload failed.", "error"); }
    setSubmitting(false); setFile(null);
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newJob.title.trim() || !newJob.description.trim() || !newJob.requirements.trim() || !newJob.location.trim()) {
      return toast("Please fill all LPU job fields before publishing.", "error");
    }
    try {
      await api.post("/jobs", newJob);
      toast("LPU job published successfully.");
      setNewJob({ title: "", description: "", requirements: "", location: "", allocatedFaculty: "", allocatedStudents: [] });
      setFacultySearch(""); setStudentSearch("");
      fetchAll();
    } catch (err) { toast(err.response?.data?.message || "Failed to publish job.", "error"); }
  };

  const toggleStudentAllocation = (studentId) => {
    setNewJob((prev) => {
      const already = prev.allocatedStudents.includes(studentId);
      return { ...prev, allocatedStudents: already ? prev.allocatedStudents.filter((id) => id !== studentId) : [...prev.allocatedStudents, studentId] };
    });
  };

  const handleDeleteUser = (id) => {
    setConfirm({ open: true, title: "Delete LPU User", message: "Are you sure you want to delete this LPU user?", onConfirm: async () => {
      try { await api.delete(`/admin/users/${id}`); toast("LPU user deleted."); fetchAll(); } catch (err) { toast(err.response?.data?.message || "Delete failed.", "error"); }
      setConfirm({ open: false });
    }});
  };

  const handleDeleteJob = (id) => {
    setConfirm({ open: true, title: "Delete LPU Job", message: "Are you sure you want to delete this job?", onConfirm: async () => {
      try { await api.delete(`/jobs/${id}`); toast("LPU job deleted."); fetchAll(); } catch (err) { toast(err.response?.data?.message || "Delete failed.", "error"); }
      setConfirm({ open: false });
    }});
  };

  const exportAssignmentReport = () => {
    exportCSV(
      ["Job Title", "Location", "Assigned Faculty", "Assigned Students", "Student Count"],
      filtered.raw.map((j) => [j.title, j.location, j.allocatedFaculty?.name || "Unassigned", (j.allocatedStudents || []).map((s) => s.name).join(" | "), (j.allocatedStudents || []).length]),
      "lpu-assignments"
    );
  };

  // ═══════════════════════════════════════════════════════════
  // TAB COUNTS
  // ═══════════════════════════════════════════════════════════
  const tabCounts = useMemo(() => ({
    users: users.length, jobs: jobs.length, assignments: jobs.length,
  }), [users, jobs]);

  // ═══════════════════════════════════════════════════════════
  // RENDER: OVERVIEW
  // ═══════════════════════════════════════════════════════════
  const renderOverview = () => {
    if (loading) return <Skeleton rows={4} cols={4} />;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total LPU Users" value={users.length} icon={FaUsers} delay={0} />
          <StatCard label="Total Jobs" value={stats?.totalJobs ?? jobs.length} icon={FaBriefcase} delay={0.05} />
          <StatCard label="Applications" value={stats?.totalApplications ?? 0} icon={FaFileAlt} delay={0.1} />
          <StatCard label="Resumes" value={stats?.totalResumes ?? 0} icon={FaEye} delay={0.15} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Faculty Assigned" value={allocationSummary.facultyAssignedJobs} icon={FaUserTie} color="#4ade80" delay={0.2} />
          <StatCard label="Student Assigned" value={allocationSummary.studentAssignedJobs} icon={FaUserGraduate} color="#60a5fa" delay={0.25} />
          <StatCard label="Unassigned Jobs" value={allocationSummary.unassignedJobs} icon={FaBriefcase} color="#fbbf24" delay={0.3} />
          <StatCard label="LPU Students" value={lpuStudents.length} icon={FaUserGraduate} color="#a78bfa" delay={0.35} />
        </div>

        {/* Allocation Funnel */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h4 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2"><FaChartBar className="text-[#ff6b2b]" /> Job Allocation Overview</h4>
          <div className="space-y-3">
            {[
              { label: "Total Jobs", count: allocationSummary.totalJobs, color: "#ff6b2b" },
              { label: "Faculty Assigned", count: allocationSummary.facultyAssignedJobs, color: "#4ade80" },
              { label: "Student Assigned", count: allocationSummary.studentAssignedJobs, color: "#60a5fa" },
              { label: "Unassigned", count: allocationSummary.unassignedJobs, color: "#fbbf24" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 text-sm">
                <span className="w-36 text-white/50 text-right">{item.label}</span>
                <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${allocationSummary.totalJobs > 0 ? (item.count / allocationSummary.totalJobs) * 100 : 0}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }} className="h-full rounded-full" style={{ background: item.color }} />
                </div>
                <span className="w-12 text-white font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <h4 className="text-sm font-semibold text-white/80 mb-3">Recent Jobs</h4>
            {recentJobs.length === 0 ? <p className="text-sm text-white/30">No jobs</p> :
              recentJobs.map((job) => (
                <div key={job._id} className="border-b border-white/5 py-2 text-sm">
                  <p className="font-medium text-white">{job.title}</p>
                  <p className="text-white/40 text-xs">by {job.postedBy?.name || "LPU Admin"}</p>
                </div>
              ))
            }
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <h4 className="text-sm font-semibold text-white/80 mb-3">User Distribution</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm py-1.5">
                <span className="text-white/60 flex items-center gap-2"><FaUserGraduate className="text-blue-400" size={12} /> LPU Students</span>
                <span className="text-white font-semibold">{lpuStudents.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-1.5">
                <span className="text-white/60 flex items-center gap-2"><FaUserTie className="text-purple-400" size={12} /> LPU Faculty</span>
                <span className="text-white font-semibold">{facultyUsers.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER: USERS
  // ═══════════════════════════════════════════════════════════
  const renderUsers = () => {
    if (loading) return <Skeleton rows={5} cols={5} />;
    const roleOpts = [{ value: "LPU Student", label: "LPU Student" }, { value: "LPU Faculty", label: "LPU Faculty" }];
    return (
      <div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search users by name, UID, or role…"
          filter={filter} onFilterChange={setFilter} filterOptions={roleOpts} resultCount={filtered.total} />
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">UID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.items.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-8 text-center text-white/30 text-sm">No users found</td></tr>
                ) : filtered.items.map((u) => (
                  <tr key={u._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm text-white/60">{u.uid || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-white font-medium">{u.name}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${u.role === "LPU Faculty" ? "bg-purple-500/20 text-purple-300" : "bg-blue-500/20 text-blue-300"}`}>{u.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDeleteUser(u._id)} className="text-rose-400 hover:text-rose-300 transition p-1 hover:bg-rose-500/10 rounded-lg"><FaTrash size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.total} onPageChange={setPage} />
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={() => exportCSV(["UID", "Name", "Role"], filtered.raw.map((u) => [u.uid || "", u.name, u.role]), "lpu-users")}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/50 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition"><FaDownload /> Export CSV</button>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Faculty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.items.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-white/30 text-sm">No jobs found</td></tr>
                ) : filtered.items.map((job) => (
                  <tr key={job._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm text-white font-medium">{job.title}</td>
                    <td className="px-6 py-4 text-sm text-white/60">{job.location}</td>
                    <td className="px-6 py-4 text-sm text-white/60">{job.postedBy?.name || "LPU Admin"}</td>
                    <td className="px-6 py-4 text-sm text-white/60">{job.allocatedFaculty?.name || <span className="text-white/30">Unassigned</span>}</td>
                    <td className="px-6 py-4 text-sm text-white/60">{job.allocatedStudents?.length || 0}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDeleteJob(job._id)} className="text-rose-400 hover:text-rose-300 transition p-1 hover:bg-rose-500/10 rounded-lg"><FaTrash size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.total} onPageChange={setPage} />
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={() => exportCSV(["Title", "Location", "Posted By", "Faculty", "Students"], filtered.raw.map((j) => [j.title, j.location, j.postedBy?.name || "", j.allocatedFaculty?.name || "", j.allocatedStudents?.length || 0]), "lpu-jobs")}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/50 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition"><FaDownload /> Export CSV</button>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER: ASSIGNMENTS
  // ═══════════════════════════════════════════════════════════
  const renderAssignments = () => {
    if (loading) return <Skeleton rows={5} cols={4} />;
    const filterOpts = [
      { value: "faculty", label: "Faculty Assigned" },
      { value: "students", label: "Students Assigned" },
      { value: "unassigned", label: "Needs Allocation" },
    ];
    return (
      <div>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
            <input type="text" value={assignmentSearch} onChange={(e) => setAssignmentSearch(e.target.value)}
              placeholder="Search job, faculty, or student…" className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#ff6b2b] transition" />
          </div>
          <div className="flex gap-2">
            {[{ key: "all", label: "All" }, ...filterOpts].map((f) => (
              <button key={f.key} onClick={() => { setAssignmentFilter(f.key); setPage(0); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${assignmentFilter === f.key ? "bg-[#ff6b2b] text-[#0d131f]" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>{f.label}</button>
            ))}
          </div>
          <button onClick={exportAssignmentReport}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#ff6b2b] border border-[#ff6b2b]/30 rounded-lg hover:bg-[#ff6b2b]/10 transition"><FaDownload /> Export</button>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Job</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Faculty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.items.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-8 text-center text-white/30 text-sm">No assignments found</td></tr>
                ) : filtered.items.map((job) => (
                  <tr key={job._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm text-white font-medium">{job.title}</div>
                      <div className="text-xs text-white/40">{job.location}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">{job.allocatedFaculty?.name || <span className="text-white/30">Unassigned</span>}</td>
                    <td className="px-6 py-4 text-sm text-white/60 max-w-xs truncate">{(job.allocatedStudents || []).map((s) => s.name).join(", ") || <span className="text-white/30">None</span>}</td>
                    <td className="px-6 py-4 text-sm text-white font-semibold">{(job.allocatedStudents || []).length}</td>
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
  // RENDER: BULK UPLOAD + CREATE FORMS
  // ═══════════════════════════════════════════════════════════
  const renderBulk = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Manual Create */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><FaUserPlus className="text-[#ff6b2b]" /> Manual User Creation</h2>
        <form onSubmit={handleManualCreate} className="space-y-4">
          <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#ff6b2b]" required />
          <input type="text" placeholder="UID" value={form.uid} onChange={(e) => setForm({ ...form, uid: e.target.value })}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#ff6b2b]" required />
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#ff6b2b]" required />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#ff6b2b]">
            <option value="LPU Student">LPU Student</option>
            <option value="LPU Faculty">LPU Faculty</option>
          </select>
          <button type="submit" disabled={submitting}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 ${submitting ? "opacity-60 cursor-not-allowed" : ""} bg-[#ff6b2b] text-[#0d131f] hover:brightness-110`}>
            {submitting && <FaSpinner className="animate-spin" />} {submitting ? "Creating…" : "Create User"}
          </button>
        </form>
      </div>

      {/* Bulk Upload */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><FaUpload className="text-[#ff6b2b]" /> Excel Bulk Upload</h2>
        <p className="text-sm text-white/50 mb-4">Upload an .xlsx file with columns: UID, Password, Name, Email (optional).</p>
        <form onSubmit={handleBulkUpload} className="space-y-4">
          <input type="file" accept=".xlsx, .xls" onChange={(e) => setFile(e.target.files[0])}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#ff6b2b] file:text-[#0d131f]" />
          <select value={uploadRole} onChange={(e) => setUploadRole(e.target.value)}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#ff6b2b]">
            <option value="LPU Student">LPU Student</option>
            <option value="LPU Faculty">LPU Faculty</option>
          </select>
          <button type="submit" disabled={submitting}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 ${submitting ? "opacity-60 cursor-not-allowed" : ""} bg-[#ff6b2b] text-[#0d131f] hover:brightness-110`}>
            {submitting && <FaSpinner className="animate-spin" />} {submitting ? "Uploading…" : "Bulk Upload Users"}
          </button>
        </form>
      </div>

      {/* Publish LPU Job */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-2">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><FaBuilding className="text-[#d4af37]" /> Publish LPU Job</h2>
        <form onSubmit={handleCreateJob} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Job title" value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#ff6b2b]" required />
            <input type="text" placeholder="Location" value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#ff6b2b]" required />
          </div>
          <textarea rows="3" placeholder="Description" value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#ff6b2b]" required />
          <textarea rows="3" placeholder="Requirements" value={newJob.requirements} onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#ff6b2b]" required />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-white/40 mb-1 block">Assign Faculty (optional)</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs z-10" />
                <input type="text" placeholder="Search faculty by name or UID…" value={facultySearch} onChange={(e) => { setFacultySearch(e.target.value); setShowFacultyDropdown(true); }} onFocus={() => setShowFacultyDropdown(true)}
                  className="w-full pl-9 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#ff6b2b] transition" />
                <FaChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs rotate-90 pointer-events-none" />
                {showFacultyDropdown && (
                  <div onClick={(e) => e.stopPropagation()} className="absolute z-30 top-full mt-1 w-full max-h-48 overflow-auto bg-[#131b2c] border border-white/10 rounded-xl shadow-2xl">
                    <div className="px-3 py-2 text-xs text-white/40 border-b border-white/5 cursor-pointer hover:bg-white/5" onClick={() => { setNewJob({ ...newJob, allocatedFaculty: "" }); setShowFacultyDropdown(false); setFacultySearch(""); }}>No Faculty</div>
                    {facultyUsers.filter((f) => !facultySearch || `${f.name} ${f.uid || ""}`.toLowerCase().includes(facultySearch.toLowerCase())).map((f) => (
                      <div key={f._id} onClick={() => { setNewJob({ ...newJob, allocatedFaculty: f._id }); setFacultySearch(f.name); setShowFacultyDropdown(false); }}
                        className={`px-3 py-2 text-sm cursor-pointer border-b border-white/5 last:border-0 transition ${newJob.allocatedFaculty === f._id ? "bg-[#ff6b2b]/10 text-[#ff6b2b]" : "text-white hover:bg-white/5"}`}>
                        {f.name} <span className="text-white/40 text-xs ml-1">({f.uid || "N/A"})</span>
                      </div>
                    ))}
                    {facultyUsers.filter((f) => !facultySearch || `${f.name} ${f.uid || ""}`.toLowerCase().includes(facultySearch.toLowerCase())).length === 0 && (
                      <div className="px-3 py-2 text-xs text-white/30">No faculty found</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="bg-black/20 p-3 rounded-xl border border-white/10 flex items-center justify-between">
              <div><div className="text-xs text-white/50">Faculty</div><div className="font-semibold text-white">{selectedFaculty?.name || "None"}</div></div>
              <div><div className="text-xs text-white/50">Students</div><div className="font-semibold text-white">{newJob.allocatedStudents.length}</div></div>
            </div>
          </div>

          {newJob.allocatedFaculty && lpuStudents.length > 0 && (
            <div className="bg-black/20 p-4 rounded-xl border border-white/10">
              <div className="text-sm font-semibold text-white mb-3">Assign LPU Students</div>
              <div className="relative mb-3">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs" />
                <input type="text" placeholder="Search students by name or UID…" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#ff6b2b] transition" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <button type="button" onClick={() => {
                  const filtered = lpuStudents.filter((s) => !studentSearch || `${s.name} ${s.uid || ""}`.toLowerCase().includes(studentSearch.toLowerCase()));
                  const allSelected = filtered.every((s) => newJob.allocatedStudents.includes(s._id));
                  setNewJob((prev) => ({ ...prev, allocatedStudents: allSelected ? prev.allocatedStudents.filter((id) => !filtered.find((s) => s._id === id)) : [...new Set([...prev.allocatedStudents, ...filtered.map((s) => s._id)])] }));
                }} className="text-xs text-[#ff6b2b] hover:underline">{lpuStudents.filter((s) => !studentSearch || `${s.name} ${s.uid || ""}`.toLowerCase().includes(studentSearch.toLowerCase())).every((s) => newJob.allocatedStudents.includes(s._id)) ? "Unselect All" : "Select All"}</button>
                <span className="text-xs text-white/30">({newJob.allocatedStudents.length} selected)</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-auto">
                {lpuStudents.filter((s) => !studentSearch || `${s.name} ${s.uid || ""}`.toLowerCase().includes(studentSearch.toLowerCase())).map((s) => (
                  <label key={s._id} className="flex items-center gap-2 text-xs text-white/80">
                    <input type="checkbox" checked={newJob.allocatedStudents.includes(s._id)} onChange={() => toggleStudentAllocation(s._id)}
                      className="rounded" />
                    <span>{s.name}</span>
                  </label>
                ))}
                {lpuStudents.filter((s) => !studentSearch || `${s.name} ${s.uid || ""}`.toLowerCase().includes(studentSearch.toLowerCase())).length === 0 && (
                  <p className="text-xs text-white/30 col-span-3">No students found</p>
                )}
              </div>
            </div>
          )}

          <button type="submit" className="w-full py-3 bg-[#d4af37] text-[#0d131f] rounded-xl font-semibold text-sm hover:brightness-110 transition">
            Publish Job {newJob.allocatedStudents.length > 0 ? `(${newJob.allocatedStudents.length} Students)` : ""}
          </button>
        </form>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d131f] via-[#1a2a40] to-[#0d131f] relative overflow-hidden">
      <Toast toasts={toasts} remove={removeToast} />
      <ConfirmModal {...confirm} onCancel={() => setConfirm({ open: false })} />

      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGwxMiAxMi0xMiAxMi0xMi0xMiAxMi0xMnpNMTggMzZsMTIgMTItMTIgMTItMTItMTIgMTItMTJ6IiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>

      {/* Header */}
      <header className="relative z-20 bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-3 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-3">
          <img src="/vettora-logo.png" alt="Vettora Logo" className="h-9 object-contain rounded-lg border border-white/10 p-0.5 bg-black/30" />
          <span className="ml-2 text-xs font-medium text-[#ff6b2b] bg-[#ff6b2b]/10 px-2 py-0.5 rounded-full border border-[#ff6b2b]/30">LPU Admin</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
          <FaSignOutAlt size={16} /> Sign out
        </button>
      </header>

      {/* Main */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-white mb-6">LPU Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 border-b border-white/10">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition flex items-center gap-2 relative ${activeTab === key ? "text-[#ff6b2b]" : "text-white/50 hover:text-white/80"}`}>
              <Icon size={14} />{label}
              {tabCounts[key] !== undefined && (
                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === key ? "bg-[#ff6b2b]/20 text-[#ff6b2b]" : "bg-white/10 text-white/40"}`}>{tabCounts[key]}</span>
              )}
              {activeTab === key && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff6b2b]" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {activeTab === "overview" && renderOverview()}
            {activeTab === "users" && renderUsers()}
            {activeTab === "jobs" && renderJobs()}
            {activeTab === "assignments" && renderAssignments()}
            {activeTab === "bulk" && renderBulk()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
