import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaUpload, FaUserPlus, FaBuilding } from "react-icons/fa";
import api from "../services/api";

function LpuAdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [file, setFile] = useState(null);
  const [uploadRole, setUploadRole] = useState("LPU Student");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ uid: "", password: "", name: "", role: "LPU Student" });
  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    requirements: "",
    location: "",
    allocatedFaculty: "",
    allocatedStudents: [],
  });
  const [facultyUsers, setFacultyUsers] = useState([]);
  const [reportQuery, setReportQuery] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [facultySearchQuery, setFacultySearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const lpuStudents = users.filter((u) => u.role === "LPU Student");
  const selectedFaculty = facultyUsers.find((faculty) => faculty._id === newJob.allocatedFaculty);
  const selectedStudentsCount = newJob.allocatedStudents.length;
  const filteredLpuStudents = lpuStudents.filter((student) => {
    const term = studentSearchQuery.toLowerCase().trim();
    if (!term) return true;
    return `${student.name || ""} ${student.uid || ""}`.toLowerCase().includes(term);
  });

  const filteredFacultyUsers = facultyUsers.filter((faculty) => {
    const term = facultySearchQuery.toLowerCase().trim();
    if (!term) return true;
    return `${faculty.name || ""} ${faculty.uid || ""}`.toLowerCase().includes(term);
  });

  const filteredUsers = users.filter((user) => {
    const term = userSearchQuery.toLowerCase().trim();
    if (!term) return true;
    return `${user.name || ""} ${user.uid || ""} ${user.role || ""}`.toLowerCase().includes(term);
  });

  const allocationSummary = useMemo(() => {
    const totalJobs = jobs.length;
    const facultyAssignedJobs = jobs.filter((job) => job.allocatedFaculty?._id).length;
    const studentAssignedJobs = jobs.filter((job) => (job.allocatedStudents?.length || 0) > 0).length;
    const unassignedJobs = Math.max(totalJobs - facultyAssignedJobs, 0);

    return {
      totalJobs,
      facultyAssignedJobs,
      studentAssignedJobs,
      unassignedJobs,
    };
  }, [jobs]);

  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchJobs();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      const lpuUsers = res.data.filter(u => u.role === "LPU Faculty" || u.role === "LPU Student");
      const lpuFaculty = res.data.filter(u => u.role === "LPU Faculty");
      setUsers(lpuUsers);
      setFacultyUsers(lpuFaculty);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data.stats || res.data);
      setRecentJobs(res.data.recentJobs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await api.get("/jobs");
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/admin/users", form);
      setMessage("User created successfully!");
      setForm({ uid: "", password: "", name: "", role: "LPU Student" });
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!file) return setMessage("Please select an Excel file.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("targetRole", uploadRole);

    setLoading(true);
    try {
      const res = await api.post("/admin/bulk-upload-lpu", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMessage(res.data.message);
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.message || "Bulk upload failed.");
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();

    if (!newJob.title.trim() || !newJob.description.trim() || !newJob.requirements.trim() || !newJob.location.trim()) {
      setMessage("Please fill all LPU job fields before publishing.");
      return;
    }

    try {
      await api.post("/jobs", newJob);
      setMessage("LPU job published successfully.");
      setNewJob({ title: "", description: "", requirements: "", location: "", allocatedFaculty: "", allocatedStudents: [] });
      fetchJobs();
      fetchStats();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to publish job.");
    }
  };

  const toggleStudentAllocation = (studentId) => {
    setNewJob((prev) => {
      const alreadySelected = prev.allocatedStudents.includes(studentId);
      const nextStudents = alreadySelected
        ? prev.allocatedStudents.filter((id) => id !== studentId)
        : [...prev.allocatedStudents, studentId];

      return { ...prev, allocatedStudents: nextStudents };
    });
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this LPU user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setMessage("LPU user deleted successfully.");
      fetchUsers();
      fetchStats();
    } catch (err) {
      setMessage(err.response?.data?.message || "Delete user failed.");
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Delete this LPU job?")) return;
    try {
      await api.delete(`/jobs/${id}`);
      setMessage("LPU job deleted.");
      fetchJobs();
      fetchStats();
    } catch (err) {
      setMessage(err.response?.data?.message || "Delete failed.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/lpu-login");
  };

  const filteredAssignments = jobs
    .filter((job) => {
      if (assignmentFilter === "faculty") return Boolean(job.allocatedFaculty?._id);
      if (assignmentFilter === "students") return (job.allocatedStudents?.length || 0) > 0;
      if (assignmentFilter === "unassigned") return !job.allocatedFaculty?._id || (job.allocatedStudents?.length || 0) === 0;
      return true;
    })
    .filter((job) => {
      const term = reportQuery.toLowerCase().trim();
      if (!term) return true;

      const facultyName = job.allocatedFaculty?.name?.toLowerCase() || "";
      const studentNames = (job.allocatedStudents || [])
        .map((student) => student.name?.toLowerCase() || "")
        .join(" ");

      return [job.title, job.location, facultyName, studentNames]
        .join(" ")
        .includes(term);
    });

  const exportAssignmentReport = () => {
    const csvRows = [
      ["Job Title", "Location", "Assigned Faculty", "Assigned Students"],
      ...filteredAssignments.map((job) => [
        job.title || "",
        job.location || "",
        job.allocatedFaculty?.name || "Unassigned",
        (job.allocatedStudents || []).map((student) => student.name).join(" | "),
      ]),
    ];

    const csvContent = csvRows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lpu-assignment-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0d131f] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <FaBuilding className="text-3xl text-[#ff6b2b]" />
            <h1 className="text-3xl font-bold">LPU Admin Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 bg-rose-500/10 text-rose-400 rounded hover:bg-rose-500/20">
            Logout
          </button>
        </header>

        {message && <div className="mb-6 p-4 bg-white/10 rounded text-center">{message}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="text-sm text-white/50">LPU Users</div>
            <div className="text-3xl font-bold mt-2">{users.length}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="text-sm text-white/50">Total Jobs</div>
            <div className="text-3xl font-bold mt-2">{stats?.totalJobs ?? 0}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="text-sm text-white/50">Applications</div>
            <div className="text-3xl font-bold mt-2">{stats?.totalApplications ?? 0}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="text-sm text-white/50">Resumes</div>
            <div className="text-3xl font-bold mt-2">{stats?.totalResumes ?? 0}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-400/20">
            <div className="text-sm text-emerald-300">Faculty Assigned Jobs</div>
            <div className="text-2xl font-bold mt-2 text-white">{allocationSummary.facultyAssignedJobs}</div>
          </div>
          <div className="bg-sky-500/10 p-4 rounded-2xl border border-sky-400/20">
            <div className="text-sm text-sky-300">Student Assigned Jobs</div>
            <div className="text-2xl font-bold mt-2 text-white">{allocationSummary.studentAssignedJobs}</div>
          </div>
          <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-400/20">
            <div className="text-sm text-amber-300">Unassigned Jobs</div>
            <div className="text-2xl font-bold mt-2 text-white">{allocationSummary.unassignedJobs}</div>
          </div>
          <div className="bg-violet-500/10 p-4 rounded-2xl border border-violet-400/20">
            <div className="text-sm text-violet-300">Total LPU Jobs</div>
            <div className="text-2xl font-bold mt-2 text-white">{allocationSummary.totalJobs}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Manual Create Form */}
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><FaUserPlus /> Manual User Creation</h2>
            <form onSubmit={handleManualCreate} className="space-y-4">
              <input type="text" placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 bg-white/5 rounded outline-none" required />
              <input type="text" placeholder="UID" value={form.uid} onChange={e => setForm({...form, uid: e.target.value})} className="w-full p-3 bg-white/5 rounded outline-none" required />
              <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full p-3 bg-white/5 rounded outline-none" required />
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full p-3 bg-white/5 rounded outline-none text-[#0d131f]">
                <option value="LPU Student">LPU Student</option>
                <option value="LPU Faculty">LPU Faculty</option>
              </select>
              <button type="submit" disabled={loading} className="w-full py-3 bg-[#ff6b2b] rounded font-semibold text-[#0d131f]">{loading ? "Creating..." : "Create User"}</button>
            </form>
          </div>

          {/* LPU Job Publish Form */}
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><FaBuilding /> Publish LPU Job</h2>
            <form onSubmit={handleCreateJob} className="space-y-4">
              <input type="text" placeholder="Job title" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} className="w-full p-3 bg-white/5 rounded outline-none" required />
              <textarea rows="3" placeholder="Description" value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} className="w-full p-3 bg-white/5 rounded outline-none" required />
              <textarea rows="3" placeholder="Requirements" value={newJob.requirements} onChange={e => setNewJob({...newJob, requirements: e.target.value})} className="w-full p-3 bg-white/5 rounded outline-none" required />
              <input type="text" placeholder="Location" value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} className="w-full p-3 bg-white/5 rounded outline-none" required />
              <input
                type="text"
                value={facultySearchQuery}
                onChange={(e) => setFacultySearchQuery(e.target.value)}
                placeholder="Search faculty by name or UID"
                className="w-full p-3 bg-white/5 rounded outline-none"
              />
              <select value={newJob.allocatedFaculty} onChange={e => setNewJob({...newJob, allocatedFaculty: e.target.value})} className="w-full p-3 bg-white/5 rounded outline-none text-[#0d131f]">
                <option value="">Assign to Faculty (optional)</option>
                {filteredFacultyUsers.map((faculty) => (
                  <option key={faculty._id} value={faculty._id}>{faculty.name} ({faculty.uid || "UID N/A"})</option>
                ))}
              </select>
              {filteredFacultyUsers.length === 0 && facultySearchQuery && (
                <div className="text-white/40 text-sm">No matching faculty found.</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="bg-black/20 p-3 rounded border border-white/10">
                  <div className="text-xs text-white/50">Selected Faculty</div>
                  <div className="font-semibold mt-1">{selectedFaculty?.name || "No faculty selected"}</div>
                </div>
                <div className="bg-black/20 p-3 rounded border border-white/10">
                  <div className="text-xs text-white/50">Selected Students</div>
                  <div className="font-semibold mt-1">{selectedStudentsCount} student(s)</div>
                </div>
              </div>

              {newJob.allocatedFaculty && (
                <div className="bg-black/20 p-3 rounded border border-white/10">
                  <div className="text-sm font-semibold mb-3">Assign LPU Students to this Faculty</div>
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="Search student by name or UID"
                    className="w-full p-2 mb-3 bg-white/5 rounded outline-none text-sm"
                  />
                  <div className="grid grid-cols-1 gap-2 max-h-44 overflow-auto pr-1">
                    {filteredLpuStudents.map((student) => (
                      <label key={student._id} className="flex items-center gap-2 text-sm text-white/80">
                        <input
                          type="checkbox"
                          checked={newJob.allocatedStudents.includes(student._id)}
                          onChange={() => toggleStudentAllocation(student._id)}
                        />
                        <span>{student.name} ({student.uid || "N/A"})</span>
                      </label>
                    ))}
                    {filteredLpuStudents.length === 0 && <div className="text-white/40 text-sm">No matching LPU students found.</div>}
                    {lpuStudents.length === 0 && <div className="text-white/40 text-sm">No LPU students available.</div>}
                  </div>
                </div>
              )}

              <div className="text-xs text-white/50">
                {newJob.allocatedFaculty
                  ? `Faculty assignment is ready. You can publish with ${selectedStudentsCount} linked student(s).`
                  : "You can publish the job now, or assign a faculty and students for a stricter LPU allocation flow."}
              </div>

              <button type="submit" className="w-full py-3 bg-[#d4af37] rounded font-semibold text-[#0d131f]">
                Publish Job {selectedStudentsCount > 0 ? `(${selectedStudentsCount} Students)` : ""}
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Excel Bulk Upload Form */}
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><FaUpload /> Excel Bulk Upload</h2>
            <p className="text-sm text-white/50 mb-4">Upload an .xlsx file with columns: UID, Password, Name, Email (optional).</p>
            <form onSubmit={handleBulkUpload} className="space-y-4">
              <input type="file" accept=".xlsx, .xls" onChange={e => setFile(e.target.files[0])} className="w-full p-3 bg-white/5 rounded" />
              <select value={uploadRole} onChange={e => setUploadRole(e.target.value)} className="w-full p-3 bg-white/5 rounded outline-none text-[#0d131f]">
                <option value="LPU Student">LPU Student</option>
                <option value="LPU Faculty">LPU Faculty</option>
              </select>
              <button type="submit" disabled={loading} className="w-full py-3 bg-[#ff6b2b] rounded font-semibold text-[#0d131f]">{loading ? "Uploading..." : "Bulk Upload Users"}</button>
            </form>
          </div>

          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><FaBuilding /> LPU Jobs Feed</h2>
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job._id} className="bg-white/5 p-3 rounded border border-white/10">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{job.title}</div>
                      <div className="text-sm text-white/50">{job.location} • Posted by {job.postedBy?.name || "LPU Admin"}</div>
                      <div className="text-xs text-white/40 mt-1">Assigned Faculty: {job.allocatedFaculty?.name || "Unassigned"}</div>
                      <div className="text-xs text-white/40 mt-1">Assigned Students: {job.allocatedStudents?.length || 0}</div>
                    </div>
                    <button onClick={() => handleDeleteJob(job._id)} className="px-3 py-1 rounded bg-rose-500/20 text-rose-300 text-sm">Delete</button>
                  </div>
                </div>
              ))}
              {jobs.length === 0 && <div className="text-white/40">No LPU jobs published yet.</div>}
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2"><FaBuilding /> LPU Assignment Report</h2>
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <input
                type="text"
                value={reportQuery}
                onChange={(e) => setReportQuery(e.target.value)}
                placeholder="Search job, faculty, or student"
                className="w-full md:w-72 p-3 bg-white/5 rounded outline-none"
              />
              <button onClick={exportAssignmentReport} className="px-4 py-2 bg-[#d4af37] rounded text-[#0d131f] font-semibold">Export CSV</button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: "all", label: "All Jobs" },
              { key: "faculty", label: "Faculty Assigned" },
              { key: "students", label: "Students Assigned" },
              { key: "unassigned", label: "Needs Allocation" },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setAssignmentFilter(filter.key)}
                className={`px-3 py-1.5 rounded text-sm ${assignmentFilter === filter.key ? "bg-[#ff6b2b] text-[#0d131f]" : "bg-white/5 text-white/70"}`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/50">
                  <th className="p-3">Job</th>
                  <th className="p-3">Faculty</th>
                  <th className="p-3">Students</th>
                  <th className="p-3">Count</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((job) => (
                  <tr key={job._id} className="border-b border-white/5 align-top">
                    <td className="p-3">
                      <div className="font-semibold">{job.title}</div>
                      <div className="text-white/45 text-xs">{job.location}</div>
                    </td>
                    <td className="p-3">{job.allocatedFaculty?.name || "Unassigned"}</td>
                    <td className="p-3">
                      {(job.allocatedStudents || []).length > 0
                        ? (job.allocatedStudents || []).map((student) => student.name).join(", ")
                        : "No students assigned"}
                    </td>
                    <td className="p-3">{(job.allocatedStudents || []).length}</td>
                  </tr>
                ))}
                {filteredAssignments.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-3 text-center text-white/40">No assignment data matches your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><FaUsers /> LPU Users List</h2>
            <div className="mb-4">
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search user by name, UID, or role"
                className="w-full p-3 bg-white/5 rounded outline-none"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 text-white/50">
                    <th className="p-3">UID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u._id} className="border-b border-white/5">
                      <td className="p-3">{u.uid || "N/A"}</td>
                      <td className="p-3">{u.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${u.role === "LPU Faculty" ? "bg-purple-500/20 text-purple-300" : "bg-blue-500/20 text-blue-300"}`}>{u.role}</span>
                      </td>
                      <td className="p-3">
                        <button onClick={() => handleDeleteUser(u._id)} className="px-3 py-1 rounded bg-rose-500/20 text-rose-300 text-sm">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && <tr><td colSpan="4" className="p-3 text-center text-white/40">No matching LPU users found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><FaBuilding /> Recent LPU Activity</h2>
            <div className="space-y-3">
              {recentJobs.length === 0 ? (
                <div className="text-white/40">No recent LPU job activity found.</div>
              ) : (
                recentJobs.map(job => (
                  <div key={job._id} className="bg-white/5 p-3 rounded border border-white/10">
                    <div className="font-semibold">{job.title}</div>
                    <div className="text-sm text-white/50">Posted by {job.postedBy?.name || "Unknown"}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LpuAdminDashboard;
