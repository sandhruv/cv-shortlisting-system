import { useEffect, useState } from "react";
import {
  FaUsers,
  FaBriefcase,
  FaFileAlt,
  FaUserPlus,
  FaTrash,
  FaChartBar,
} from "react-icons/fa";
import api from "../services/api";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [users, setUsers] = useState([]);
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

  useEffect(() => {
    fetchStats();
    fetchJobs();
    fetchApplications();
    fetchResumes();
    fetchUsers();
  }, []);

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
      await api.put(`/applications/applications/${appId}/status`, { status });
      alert(`Application ${status}`);
      fetchApplications();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  const renderOverview = () => {
    if (!stats) return <div className="text-center py-8">Loading stats...</div>;
    const { totalUsers, totalJobs, totalApplications, totalResumes } = stats.stats;
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Total Users</p><p className="text-2xl font-bold">{totalUsers}</p></div>
              <FaUsers className="text-blue-500 text-3xl" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Total Jobs</p><p className="text-2xl font-bold">{totalJobs}</p></div>
              <FaBriefcase className="text-green-500 text-3xl" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Applications</p><p className="text-2xl font-bold">{totalApplications}</p></div>
              <FaFileAlt className="text-purple-500 text-3xl" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Resumes</p><p className="text-2xl font-bold">{totalResumes}</p></div>
              <FaFileAlt className="text-yellow-500 text-3xl" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="font-semibold mb-2">Recent Jobs</h3>
            {stats.recentJobs.length === 0 ? <p className="text-gray-500 text-sm">No jobs</p> : stats.recentJobs.map(job => (
              <div key={job._id} className="border-b py-2 text-sm">
                <p className="font-medium">{job.title}</p>
                <p className="text-gray-500">by {job.postedBy?.name || "Unknown"}</p>
                <p className="text-xs text-gray-400">{new Date(job.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="font-semibold mb-2">Recent Applications</h3>
            {stats.recentApps.length === 0 ? <p className="text-gray-500 text-sm">No applications</p> : stats.recentApps.map(app => (
              <div key={app._id} className="border-b py-2 text-sm">
                <p>{app.student?.name} → {app.job?.title}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs ${app.status === "shortlisted" ? "bg-green-100 text-green-800" : app.status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{app.status}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="font-semibold mb-2">Recent Resumes</h3>
            {stats.recentResumes.length === 0 ? <p className="text-gray-500 text-sm">No resumes</p> : stats.recentResumes.map(r => (
              <div key={r._id} className="border-b py-2 text-sm">
                <p>{r.student?.name || "Unknown"}</p>
                <p className="text-gray-500">{r.fileName}</p>
                <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderJobs = () => (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posted By</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {jobs.length === 0 ? <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No jobs found</td></tr> :
              jobs.map(job => (
                <tr key={job._id}>
                  <td className="px-6 py-4">{job.title}</td>
                  <td className="px-6 py-4">{job.location}</td>
                  <td className="px-6 py-4">{job.postedBy?.name || "Unknown"}</td>
                  <td className="px-6 py-4">{new Date(job.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4"><button onClick={() => handleDeleteJob(job._id)} className="text-red-600 hover:text-red-800"><FaTrash /></button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderApplications = () => (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {applications.length === 0 ? <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No applications</td></tr> :
              applications.map(app => (
                <tr key={app._id}>
                  <td className="px-6 py-4">{app.student?.name || "Unknown"}</td>
                  <td className="px-6 py-4">{app.job?.title || "Unknown"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${app.status === "shortlisted" ? "bg-green-100 text-green-800" : app.status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{app.status}</span>
                  </td>
                  <td className="px-6 py-4">{new Date(app.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleStatusUpdate(app._id, "shortlisted")} className="bg-green-500 text-white px-2 py-1 rounded mr-2 hover:bg-green-600 text-xs">Shortlist</button>
                    <button onClick={() => handleStatusUpdate(app._id, "rejected")} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs">Reject</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderResumes = () => (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Extracted Data</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {resumes.length === 0 ? <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">No resumes uploaded</td></tr> :
              resumes.map(r => (
                <tr key={r._id}>
                  <td className="px-6 py-4">{r.student?.name || "Unknown"}</td>
                  <td className="px-6 py-4">{r.fileName}</td>
                  <td className="px-6 py-4">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <details><summary className="cursor-pointer text-blue-600 hover:underline">View Details</summary>
                      <div className="mt-2 bg-gray-50 p-2 rounded text-xs">
                        <p><strong>Email:</strong> {r.extractedData?.email || "N/A"}</p>
                        <p><strong>Contact:</strong> {r.extractedData?.contact_no || "N/A"}</p>
                        <p><strong>Skills:</strong> {r.extractedData?.technical_skills || "N/A"}</p>
                        <p><strong>Projects:</strong> {r.extractedData?.project_details || "N/A"}</p>
                        <p><strong>Certifications:</strong> {r.extractedData?.certifications || "N/A"}</p>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowUserModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"><FaUserPlus /> Add User</button>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user._id}>
                  <td className="px-6 py-4">{user.name}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">
                    <select value={user.role} onChange={(e) => handleRoleChange(user._id, e.target.value)} className="border rounded px-2 py-1 text-sm">
                      <option value="Student">Student</option>
                      <option value="HR">HR</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4"><button onClick={() => handleDeleteUser(user._id)} className="text-red-600 hover:text-red-800"><FaTrash /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">👑 Admin Dashboard</h1>
        <div className="flex flex-wrap gap-2 mb-6 border-b">
          <button className={`px-4 py-2 ${activeTab === "overview" ? "border-b-2 border-blue-500 font-semibold text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("overview")}>Overview</button>
          <button className={`px-4 py-2 ${activeTab === "jobs" ? "border-b-2 border-blue-500 font-semibold text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("jobs")}>Jobs</button>
          <button className={`px-4 py-2 ${activeTab === "applications" ? "border-b-2 border-blue-500 font-semibold text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("applications")}>Applications</button>
          <button className={`px-4 py-2 ${activeTab === "resumes" ? "border-b-2 border-blue-500 font-semibold text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("resumes")}>Resumes</button>
          <button className={`px-4 py-2 ${activeTab === "users" ? "border-b-2 border-blue-500 font-semibold text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("users")}>Users</button>
        </div>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "jobs" && renderJobs()}
        {activeTab === "applications" && renderApplications()}
        {activeTab === "resumes" && renderResumes()}
        {activeTab === "users" && renderUsers()}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New User</h2>
              <form onSubmit={handleCreateUser}>
                <div className="space-y-4">
                  <input type="text" placeholder="Full Name" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} required className="w-full border rounded px-3 py-2" />
                  <input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} required className="w-full border rounded px-3 py-2" />
                  <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="w-full border rounded px-3 py-2">
                    <option value="Student">Student</option>
                    <option value="HR">HR</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <input type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} required className="w-full border rounded px-3 py-2" />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
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
