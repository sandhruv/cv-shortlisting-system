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
    if (!stats) return <div className="text-center py-12 text-[#64748b]">Loading stats...</div>;
    const { totalUsers, totalJobs, totalApplications, totalResumes } = stats.stats;
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-xl border border-[#e9edf4] shadow-sm">
            <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Total Users</p>
            <p className="text-2xl font-semibold text-[#0f172a] mt-1">{totalUsers}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-[#e9edf4] shadow-sm">
            <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Total Jobs</p>
            <p className="text-2xl font-semibold text-[#0f172a] mt-1">{totalJobs}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-[#e9edf4] shadow-sm">
            <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Applications</p>
            <p className="text-2xl font-semibold text-[#0f172a] mt-1">{totalApplications}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-[#e9edf4] shadow-sm">
            <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Resumes</p>
            <p className="text-2xl font-semibold text-[#0f172a] mt-1">{totalResumes}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl border border-[#e9edf4] shadow-sm p-5">
            <h4 className="text-sm font-medium text-[#0f172a] mb-3">Recent Jobs</h4>
            {stats.recentJobs.length === 0 ? <p className="text-sm text-[#94a3b8]">No jobs</p> :
              stats.recentJobs.map(job => (
                <div key={job._id} className="border-b border-[#f1f5f9] py-2 text-sm">
                  <p className="font-medium text-[#0f172a]">{job.title}</p>
                  <p className="text-[#64748b] text-xs">by {job.postedBy?.name || "Unknown"}</p>
                </div>
              ))
            }
          </div>
          <div className="bg-white rounded-xl border border-[#e9edf4] shadow-sm p-5">
            <h4 className="text-sm font-medium text-[#0f172a] mb-3">Recent Applications</h4>
            {stats.recentApps.length === 0 ? <p className="text-sm text-[#94a3b8]">No applications</p> :
              stats.recentApps.map(app => (
                <div key={app._id} className="border-b border-[#f1f5f9] py-2 text-sm">
                  <p>{app.student?.name} → {app.job?.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${app.status === "shortlisted" ? "bg-[#d1fae5] text-[#065f46]" : app.status === "rejected" ? "bg-[#fee2e2] text-[#991b1b]" : "bg-[#fef3c7] text-[#92400e]"}`}>{app.status}</span>
                </div>
              ))
            }
          </div>
          <div className="bg-white rounded-xl border border-[#e9edf4] shadow-sm p-5">
            <h4 className="text-sm font-medium text-[#0f172a] mb-3">Recent Resumes</h4>
            {stats.recentResumes.length === 0 ? <p className="text-sm text-[#94a3b8]">No resumes</p> :
              stats.recentResumes.map(r => (
                <div key={r._id} className="border-b border-[#f1f5f9] py-2 text-sm">
                  <p className="font-medium text-[#0f172a]">{r.student?.name || "Unknown"}</p>
                  <p className="text-[#64748b] text-xs">{r.fileName}</p>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  };

  const renderJobs = () => (
    <div className="bg-white rounded-xl border border-[#e9edf4] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#f8fafc]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Posted By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jobs.length === 0 ? <tr><td colSpan="5" className="px-6 py-4 text-center text-[#94a3b8]">No jobs found</td></tr> :
              jobs.map(job => (
                <tr key={job._id}>
                  <td className="px-6 py-4 text-sm text-[#0f172a]">{job.title}</td>
                  <td className="px-6 py-4 text-sm text-[#64748b]">{job.location}</td>
                  <td className="px-6 py-4 text-sm text-[#64748b]">{job.postedBy?.name || "Unknown"}</td>
                  <td className="px-6 py-4 text-sm text-[#64748b]">{new Date(job.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDeleteJob(job._id)} className="text-[#ef4444] hover:text-[#dc2626] transition"><FaTrash /></button>
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
    <div className="bg-white rounded-xl border border-[#e9edf4] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#f8fafc]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Job</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Applied</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {applications.length === 0 ? <tr><td colSpan="5" className="px-6 py-4 text-center text-[#94a3b8]">No applications</td></tr> :
              applications.map(app => (
                <tr key={app._id}>
                  <td className="px-6 py-4 text-sm text-[#0f172a]">{app.student?.name || "Unknown"}</td>
                  <td className="px-6 py-4 text-sm text-[#64748b]">{app.job?.title || "Unknown"}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${app.status === "shortlisted" ? "bg-[#d1fae5] text-[#065f46]" : app.status === "rejected" ? "bg-[#fee2e2] text-[#991b1b]" : "bg-[#fef3c7] text-[#92400e]"}`}>{app.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748b]">{new Date(app.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm">
                    <button onClick={() => handleStatusUpdate(app._id, "shortlisted")} className="bg-[#0f172a] text-white px-3 py-1 rounded mr-2 hover:bg-[#1e293b] text-xs transition">Shortlist</button>
                    <button onClick={() => handleStatusUpdate(app._id, "rejected")} className="bg-[#ef4444] text-white px-3 py-1 rounded hover:bg-[#dc2626] text-xs transition">Reject</button>
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
    <div className="bg-white rounded-xl border border-[#e9edf4] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#f8fafc]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">File</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Uploaded</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {resumes.length === 0 ? <tr><td colSpan="4" className="px-6 py-4 text-center text-[#94a3b8]">No resumes uploaded</td></tr> :
              resumes.map(r => (
                <tr key={r._id}>
                  <td className="px-6 py-4 text-sm text-[#0f172a]">{r.student?.name || "Unknown"}</td>
                  <td className="px-6 py-4 text-sm text-[#64748b]">{r.fileName}</td>
                  <td className="px-6 py-4 text-sm text-[#64748b]">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm">
                    <details>
                      <summary className="cursor-pointer text-[#0f172a] font-medium hover:underline">View</summary>
                      <div className="mt-2 bg-[#f8fafc] p-3 rounded-lg text-xs border border-[#e9edf4]">
                        <p><strong>Email:</strong> {r.extractedData?.email || "N/A"}</p>
                        <p><strong>Contact:</strong> {r.extractedData?.contact_no || "N/A"}</p>
                        <p><strong>Skills:</strong> {r.extractedData?.technical_skills || "N/A"}</p>
                        <p><strong>Projects:</strong> {r.extractedData?.project_details || "N/A"}</p>
                        <p><strong>Certifications:</strong> {r.extractedData?.certifications || "N/A"}</p>
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
        <button onClick={() => setShowUserModal(true)} className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition">
          <FaUserPlus /> Add User
        </button>
      </div>
      <div className="bg-white rounded-xl border border-[#e9edf4] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#f8fafc]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user._id}>
                  <td className="px-6 py-4 text-sm text-[#0f172a]">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-[#64748b]">{user.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className="border border-[#e2e8f0] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a]"
                    >
                      <option value="Student">Student</option>
                      <option value="HR">HR</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDeleteUser(user._id)} className="text-[#ef4444] hover:text-[#dc2626] transition"><FaTrash /></button>
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
    <div className="bg-white rounded-xl border border-[#e9edf4] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#f8fafc]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Job</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Scheduled</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Feedback</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {interviews.length === 0 ? <tr><td colSpan="5" className="px-6 py-4 text-center text-[#94a3b8]">No interviews found</td></tr> :
              interviews.map(iv => (
                <tr key={iv._id}>
                  <td className="px-6 py-4 text-sm text-[#0f172a]">{iv.job?.title || "Unknown"}</td>
                  <td className="px-6 py-4 text-sm text-[#0f172a]">{iv.application?.student?.name || "Unknown"}</td>
                  <td className="px-6 py-4 text-sm text-[#64748b]">{new Date(iv.scheduledAt).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${iv.status === "scheduled" ? "bg-[#d1fae5] text-[#065f46]" : iv.status === "completed" ? "bg-[#fef3c7] text-[#92400e]" : iv.status === "cancelled" ? "bg-[#fee2e2] text-[#991b1b]" : "bg-[#e2e8f0] text-[#64748b]"}`}>
                      {iv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {iv.feedback && iv.feedback.decision ? (
                      <details>
                        <summary className="cursor-pointer text-[#0f172a] font-medium hover:underline">View</summary>
                        <div className="mt-1 bg-[#f8fafc] p-2 rounded text-xs border border-[#e9edf4]">
                          <p><strong>Rating:</strong> {iv.feedback.rating}/5</p>
                          <p><strong>Comments:</strong> {iv.feedback.comments || "—"}</p>
                          <p><strong>Decision:</strong> <span className={`${iv.feedback.decision === "selected" ? "text-green-600" : iv.feedback.decision === "rejected" ? "text-red-600" : "text-yellow-600"}`}>{iv.feedback.decision}</span></p>
                        </div>
                      </details>
                    ) : (
                      <span className="text-[#94a3b8]">No feedback</span>
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
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b border-[#e9edf4] px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#0f172a] rounded-lg flex items-center justify-center shadow-sm">
            <FaBuilding className="text-white text-lg" />
          </div>
          <span className="text-xl font-semibold text-[#0f172a] tracking-tight">
            Nexus<span className="text-[#1e293b]">Corp</span>
          </span>
          <span className="ml-3 text-xs font-medium text-[#94a3b8] bg-[#f1f5f9] px-2 py-0.5 rounded-full">Admin</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-[#64748b] hover:text-[#0f172a] transition">
          <FaSignOutAlt size={16} /> Sign out
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-[#0f172a] mb-6">Dashboard</h1>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-[#e9edf4]">
          {["overview", "jobs", "applications", "resumes", "users", "interviews"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? "border-b-2 border-[#0f172a] text-[#0f172a]"
                  : "text-[#64748b] hover:text-[#0f172a]"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "interviews" && <FaCalendarAlt className="inline mr-1" />}
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "overview" && renderOverview()}
        {activeTab === "jobs" && renderJobs()}
        {activeTab === "applications" && renderApplications()}
        {activeTab === "resumes" && renderResumes()}
        {activeTab === "users" && renderUsers()}
        {activeTab === "interviews" && renderInterviews()}

        {showUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Create New User</h2>
              <form onSubmit={handleCreateUser}>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    required
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a]"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a]"
                  />
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a]"
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
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a]"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm bg-[#0f172a] text-white rounded-lg hover:bg-[#1e293b] transition">Create</button>
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
