import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaBriefcase,
  FaFileAlt,
  FaUserPlus,
  FaTrash,
  FaChartBar,
  FaBuilding,
  FaSignOutAlt,
  FaUserTie,
  FaUserGraduate,
  FaCalendarAlt,
} from "react-icons/fa";
import { motion } from "framer-motion";
import api from "../services/api";

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [users, setUsers] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Student", password: "" });

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) { console.error(err); }
  };
  const fetchJobs = async () => {
    try {
      const res = await api.get("/admin/jobs");
      setJobs(res.data);
    } catch (err) { console.error(err); }
  };
  const fetchApplications = async () => {
    try {
      const res = await api.get("/admin/applications");
      setApplications(res.data);
    } catch (err) { console.error(err); }
  };
  const fetchResumes = async () => {
    try {
      const res = await api.get("/admin/resumes");
      setResumes(res.data);
    } catch (err) { console.error(err); }
  };
  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };
  const fetchInterviews = async () => {
    try {
      const res = await api.get("/admin/interviews");
      setInterviews(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchStats();
    fetchJobs();
    fetchApplications();
    fetchResumes();
    fetchUsers();
    fetchInterviews();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/users", newUser);
      alert("User created");
      setNewUser({ name: "", email: "", role: "Student", password: "" });
      setShowUserModal(false);
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Creation failed");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      alert("User deleted");
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      alert("Role updated");
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Delete this job?")) return;
    try {
      await api.delete(`/jobs/${id}`);
      alert("Job deleted");
      fetchJobs();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const handleStatusUpdate = async (appId, status) => {
    try {
      await api.put(`/applications/${appId}/status`, { status });
      alert(`Application ${status}`);
      fetchApplications();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  const renderOverview = () => {
    if (!stats) return <div className="text-center py-12 text-white/40">Loading stats...</div>;
    const { totalUsers, totalJobs, totalApplications, totalResumes } = stats.stats;
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          {[
            { label: "Total Users", value: totalUsers, icon: FaUsers },
            { label: "Total Jobs", value: totalJobs, icon: FaBriefcase },
            { label: "Applications", value: totalApplications, icon: FaFileAlt },
            { label: "Resumes", value: totalResumes, icon: FaFileAlt },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:border-[#d4af37]/20 transition-all duration-300"
            >
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider">{item.label}</p>
              <p className="text-3xl font-bold text-white mt-1">{item.value}</p>
              <item.icon className="text-[#d4af37] text-xl mt-2 opacity-60" />
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <h4 className="text-sm font-medium text-white/80 mb-3">Recent Jobs</h4>
            {stats.recentJobs.length === 0 ? <p className="text-sm text-white/30">No jobs</p> :
              stats.recentJobs.map(job => (
                <div key={job._id} className="border-b border-white/5 py-2 text-sm">
                  <p className="font-medium text-white">{job.title}</p>
                  <p className="text-white/40 text-xs">by {job.postedBy?.name || "Unknown"}</p>
                </div>
              ))
            }
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <h4 className="text-sm font-medium text-white/80 mb-3">Recent Applications</h4>
            {stats.recentApps.length === 0 ? <p className="text-sm text-white/30">No applications</p> :
              stats.recentApps.map(app => (
                <div key={app._id} className="border-b border-white/5 py-2 text-sm flex justify-between items-center">
                  <div>
                    <p className="text-white">{app.student?.name} → {app.job?.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${app.status === "shortlisted" ? "bg-[#d4af37]/20 text-[#d4af37]" : app.status === "rejected" ? "bg-rose-500/20 text-rose-300" : "bg-white/10 text-white/50"}`}>{app.status}</span>
                  </div>
                </div>
              ))
            }
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <h4 className="text-sm font-medium text-white/80 mb-3">Recent Resumes</h4>
            {stats.recentResumes.length === 0 ? <p className="text-sm text-white/30">No resumes</p> :
              stats.recentResumes.map(r => (
                <div key={r._id} className="border-b border-white/5 py-2 text-sm">
                  <p className="font-medium text-white">{r.student?.name || "Unknown"}</p>
                  <p className="text-white/40 text-xs">{r.fileName}</p>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  };

  const renderJobs = () => (
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
            {jobs.length === 0 ? <tr><td colSpan="5" className="px-6 py-4 text-center text-white/30">No jobs found</td></tr> :
              jobs.map(job => (
                <tr key={job._id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-white">{job.title}</td>
                  <td className="px-6 py-4 text-sm text-white/60">{job.location}</td>
                  <td className="px-6 py-4 text-sm text-white/60">{job.postedBy?.name || "Unknown"}</td>
                  <td className="px-6 py-4 text-sm text-white/60">{new Date(job.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDeleteJob(job._id)} className="text-rose-400 hover:text-rose-300 transition"><FaTrash /></button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderApplications = () => (
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
            {applications.length === 0 ? <tr><td colSpan="5" className="px-6 py-4 text-center text-white/30">No applications</td></tr> :
              applications.map(app => (
                <tr key={app._id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-white">{app.student?.name || "Unknown"}</td>
                  <td className="px-6 py-4 text-sm text-white/60">{app.job?.title || "Unknown"}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${app.status === "shortlisted" ? "bg-[#d4af37]/20 text-[#d4af37]" : app.status === "rejected" ? "bg-rose-500/20 text-rose-300" : "bg-white/10 text-white/50"}`}>{app.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/60">{new Date(app.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm">
                    <button onClick={() => handleStatusUpdate(app._id, "shortlisted")} className="bg-[#d4af37] text-[#0d131f] px-3 py-1 rounded mr-2 hover:bg-[#b8860b] transition text-xs font-semibold">Shortlist</button>
                    <button onClick={() => handleStatusUpdate(app._id, "rejected")} className="bg-rose-500/80 text-white px-3 py-1 rounded hover:bg-rose-600 transition text-xs">Reject</button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderResumes = () => (
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
            {resumes.length === 0 ? <tr><td colSpan="4" className="px-6 py-4 text-center text-white/30">No resumes uploaded</td></tr> :
              resumes.map(r => (
                <tr key={r._id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-white">{r.student?.name || "Unknown"}</td>
                  <td className="px-6 py-4 text-sm text-white/60">{r.fileName}</td>
                  <td className="px-6 py-4 text-sm text-white/60">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm">
                    <details>
                      <summary className="cursor-pointer text-[#d4af37] font-medium hover:underline">View</summary>
                      <div className="mt-2 bg-white/5 p-3 rounded-lg text-xs border border-white/10">
                        <p className="text-white/70"><strong>Email:</strong> {r.extractedData?.email || "N/A"}</p>
                        <p className="text-white/70"><strong>Contact:</strong> {r.extractedData?.contact_no || "N/A"}</p>
                        <p className="text-white/70"><strong>Skills:</strong> {r.extractedData?.technical_skills || "N/A"}</p>
                        <p className="text-white/70"><strong>Projects:</strong> {r.extractedData?.project_details || "N/A"}</p>
                        <p className="text-white/70"><strong>Certifications:</strong> {r.extractedData?.certifications || "N/A"}</p>
                      </div>
                    </details>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowUserModal(true)} className="bg-[#d4af37] hover:bg-[#b8860b] text-[#0d131f] px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map(user => (
                <tr key={user._id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-white">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-white/60">{user.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className="bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                    >
                      <option value="Student">Student</option>
                      <option value="HR">HR</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDeleteUser(user._id)} className="text-rose-400 hover:text-rose-300 transition"><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderInterviews = () => (
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
            {interviews.length === 0 ? <tr><td colSpan="5" className="px-6 py-4 text-center text-white/30">No interviews found</td></tr> :
              interviews.map(iv => (
                <tr key={iv._id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-white">{iv.job?.title || "Unknown"}</td>
                  <td className="px-6 py-4 text-sm text-white">{iv.application?.student?.name || "Unknown"}</td>
                  <td className="px-6 py-4 text-sm text-white/60">{new Date(iv.scheduledAt).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${iv.status === "scheduled" ? "bg-[#d4af37]/20 text-[#d4af37]" : iv.status === "completed" ? "bg-green-500/20 text-green-300" : iv.status === "cancelled" ? "bg-rose-500/20 text-rose-300" : "bg-white/10 text-white/50"}`}>
                      {iv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {iv.feedback && iv.feedback.decision ? (
                      <details>
                        <summary className="cursor-pointer text-[#d4af37] font-medium hover:underline">View</summary>
                        <div className="mt-1 bg-white/5 p-2 rounded text-xs border border-white/10">
                          <p className="text-white/70"><strong>Rating:</strong> {iv.feedback.rating}/5</p>
                          <p className="text-white/70"><strong>Comments:</strong> {iv.feedback.comments || "—"}</p>
                          <p className="text-white/70"><strong>Decision:</strong> <span className={`${iv.feedback.decision === "selected" ? "text-green-400" : iv.feedback.decision === "rejected" ? "text-rose-400" : "text-yellow-400"}`}>{iv.feedback.decision}</span></p>
                        </div>
                      </details>
                    ) : (
                      <span className="text-white/30">No feedback</span>
                    )}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d131f] via-[#1a2a40] to-[#0d131f] relative overflow-hidden">
      {/* Subtle background overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGwxMiAxMi0xMiAxMi0xMi0xMiAxMi0xMnpNMTggMzZsMTIgMTItMTIgMTItMTItMTIgMTItMTJ6IiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>

      {/* Navbar */}
      <header className="relative z-10 bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#d4af37] to-[#b8860b] rounded-xl flex items-center justify-center shadow-lg shadow-[#d4af37]/20">
            <FaBuilding className="text-[#0d131f] text-lg" />
          </div>
          <span className="text-xl font-semibold text-white tracking-tight">
            Nexus<span className="text-[#d4af37]">Corp</span>
          </span>
          <span className="ml-3 text-xs font-medium text-white/40 bg-white/10 px-2 py-0.5 rounded-full">Admin</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
          <FaSignOutAlt size={16} /> Sign out
        </button>
      </header>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-white mb-6">Dashboard</h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10">
          {["overview", "jobs", "applications", "resumes", "users", "interviews"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? "border-b-2 border-[#d4af37] text-[#d4af37]"
                  : "text-white/50 hover:text-white/80"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "interviews" && <FaCalendarAlt className="inline mr-1" />}
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "overview" && renderOverview()}
        {activeTab === "jobs" && renderJobs()}
        {activeTab === "applications" && renderApplications()}
        {activeTab === "resumes" && renderResumes()}
        {activeTab === "users" && renderUsers()}
        {activeTab === "interviews" && renderInterviews()}

        {/* Create User Modal – dark themed */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#1a2a40] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-semibold text-white mb-4">Create New User</h2>
              <form onSubmit={handleCreateUser}>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                  />
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                  >
                    <option value="Student">Student</option>
                    <option value="HR">HR</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <input
                    type="password"
                    placeholder="Password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 text-sm border border-white/10 rounded-lg hover:bg-white/5 transition text-white/60">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm bg-[#d4af37] text-[#0d131f] rounded-lg hover:bg-[#b8860b] transition font-semibold">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
