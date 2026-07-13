import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaEye,
  FaTrash,
  FaUsers,
  FaBriefcase,
  FaCheck,
  FaTimes,
  FaFileAlt,
  FaBuilding,
  FaSignOutAlt,
  FaCalendarAlt,
  FaSync,
  FaChartBar,
  FaVideo,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import api from "../services/api";
import VideoCall from "../components/VideoCall";

function HRDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [hrInterviews, setHrInterviews] = useState([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    requirements: "",
    location: "",
  });
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [activeTab, setActiveTab] = useState("jobs");
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);
  const [loadingResume, setLoadingResume] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [interviewData, setInterviewData] = useState({
    scheduledAt: "",
    duration: 60,
    location: "Online",
    meetingLink: "",
    notes: "",
  });
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [videoCallRoom, setVideoCallRoom] = useState(null);

  // Feedback states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedInterviewForFeedback, setSelectedInterviewForFeedback] = useState(null);
  const [feedbackData, setFeedbackData] = useState({
    rating: 3,
    comments: "",
    decision: "",
  });

  const fetchJobs = async () => {
    try {
      const res = await api.get("/jobs");
      setJobs(res.data);
    } catch (err) {
      alert("Failed to fetch jobs");
    }
  };

  const fetchApplicants = async (jobId) => {
    try {
      const res = await api.get(`/applications/jobs/${jobId}/applicants`);
      setApplications(res.data);
      setSelectedJobId(jobId);
      setActiveTab("applicants");
    } catch (err) {
      alert("Failed to fetch applicants");
    }
  };

  const fetchHRInterviews = async () => {
    setLoadingInterviews(true);
    try {
      const res = await api.get("/interviews/job");
      setHrInterviews(res.data);
    } catch (err) {
      alert("Failed to fetch interviews");
    } finally {
      setLoadingInterviews(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await api.get("/analytics/hr");
      setAnalyticsData(res.data);
    } catch (err) {
      alert("Failed to load analytics");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await api.post("/jobs", newJob);
      alert("Job created");
      setNewJob({ title: "", description: "", requirements: "", location: "" });
      setShowModal(false);
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || "Creation failed");
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Delete this job?")) return;
    try {
      await api.delete(`/jobs/${id}`);
      alert("Job deleted");
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const handleStatusUpdate = async (applicationId, status) => {
    try {
      await api.put(`/applications/${applicationId}/status`, { status });
      alert(`Application ${status}`);
      fetchApplicants(selectedJobId);
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    try {
      await api.post("/interviews", {
        applicationId: selectedApplication._id,
        ...interviewData,
      });
      alert("Interview scheduled successfully!");
      setShowInterviewModal(false);
      setSelectedApplication(null);
      setInterviewData({ scheduledAt: "", duration: 60, location: "Online", meetingLink: "", notes: "" });
      fetchApplicants(selectedJobId);
      fetchHRInterviews(); // refresh the interview list
    } catch (err) {
      alert(err.response?.data?.message || "Failed to schedule interview");
    }
  };

  const handleUpdateInterviewStatus = async (interviewId, status) => {
    if (!window.confirm(`Mark this interview as ${status}?`)) return;
    try {
      await api.put(`/interviews/${interviewId}`, { status });
      alert(`Interview ${status}`);
      fetchHRInterviews();
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  const handleAddFeedback = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/interviews/${selectedInterviewForFeedback._id}/feedback`, feedbackData);
      alert("Feedback added successfully!");
      setShowFeedbackModal(false);
      setSelectedInterviewForFeedback(null);
      setFeedbackData({ rating: 3, comments: "", decision: "" });
      fetchHRInterviews();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add feedback");
    }
  };

  const openInterviewModal = (app) => {
    setSelectedApplication(app);
    setShowInterviewModal(true);
  };

  const stats = {
    totalJobs: jobs.length,
    totalApplicants: applications.length,
    shortlisted: applications.filter((a) => a.status === "shortlisted").length,
    pending: applications.filter((a) => a.status === "pending").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const handleApplicantsClick = () => {
    if (jobs.length === 0) {
      alert("No jobs posted yet. Please create a job first.");
      return;
    }
    fetchApplicants(selectedJobId || jobs[0]._id);
  };

  const viewResume = async (studentId) => {
    setLoadingResume(true);
    setShowResumeModal(true);
    try {
      const res = await api.get(`/resume/student/${studentId}`);
      setSelectedResume(res.data);
    } catch (err) {
      alert("No resume found for this student");
      setShowResumeModal(false);
    } finally {
      setLoadingResume(false);
    }
  };

  const getInterviewRoom = (interview) => interview.roomName || `interview-${interview._id}`;

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
          <span className="ml-3 text-xs font-medium text-[#94a3b8] bg-[#f1f5f9] px-2 py-0.5 rounded-full">HR</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-[#64748b] hover:text-[#0f172a] transition">
          <FaSignOutAlt size={16} /> Sign out
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-[#0f172a]">HR Dashboard</h1>
          <button onClick={() => setShowModal(true)} className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition">
            <FaPlus /> Post Job
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-xl border border-[#e9edf4] shadow-sm">
            <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Total Jobs</p>
            <p className="text-2xl font-semibold text-[#0f172a] mt-1">{stats.totalJobs}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-[#e9edf4] shadow-sm">
            <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Total Applicants</p>
            <p className="text-2xl font-semibold text-[#0f172a] mt-1">{stats.totalApplicants}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-[#e9edf4] shadow-sm">
            <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Shortlisted</p>
            <p className="text-2xl font-semibold text-[#0f172a] mt-1">{stats.shortlisted}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-[#e9edf4] shadow-sm">
            <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Pending</p>
            <p className="text-2xl font-semibold text-[#0f172a] mt-1">{stats.pending}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-[#e9edf4]">
          <button className={`px-4 py-2 text-sm font-medium transition ${activeTab === "jobs" ? "border-b-2 border-[#0f172a] text-[#0f172a]" : "text-[#64748b] hover:text-[#0f172a]"}`} onClick={() => setActiveTab("jobs")}>
            My Jobs
          </button>
          <button className={`px-4 py-2 text-sm font-medium transition ${activeTab === "applicants" ? "border-b-2 border-[#0f172a] text-[#0f172a]" : "text-[#64748b] hover:text-[#0f172a]"}`} onClick={handleApplicantsClick}>
            Applicants
          </button>
          <button className={`px-4 py-2 text-sm font-medium transition ${activeTab === "interviews" ? "border-b-2 border-[#0f172a] text-[#0f172a]" : "text-[#64748b] hover:text-[#0f172a]"}`} onClick={() => { setActiveTab("interviews"); fetchHRInterviews(); }}>
            My Interviews
          </button>
          <button className={`px-4 py-2 text-sm font-medium transition ${activeTab === "analytics" ? "border-b-2 border-[#0f172a] text-[#0f172a]" : "text-[#64748b] hover:text-[#0f172a]"}`} onClick={() => { setActiveTab("analytics"); fetchAnalytics(); }}>
            <FaChartBar className="inline mr-1" /> Analytics
          </button>
        </div>

        {activeTab === "jobs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div key={job._id} className="bg-white rounded-xl border border-[#e9edf4] shadow-sm p-5 hover:shadow-md transition">
                <h3 className="text-lg font-semibold text-[#0f172a]">{job.title}</h3>
                <p className="text-sm text-[#64748b] mt-1">{job.location}</p>
                <p className="text-sm text-[#64748b] mt-2 line-clamp-2">{job.description}</p>
                <div className="flex justify-between items-center mt-4">
                  <button onClick={() => fetchApplicants(job._id)} className="text-sm text-[#0f172a] hover:underline flex items-center gap-1">
                    <FaEye size={14} /> View Applicants
                  </button>
                  <button onClick={() => handleDeleteJob(job._id)} className="text-[#ef4444] hover:text-[#dc2626] transition">
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "applicants" && (
          <div className="bg-white rounded-xl border border-[#e9edf4] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Resume</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {applications.map((app) => (
                    <tr key={app._id}>
                      <td className="px-6 py-4 text-sm text-[#0f172a]">{app.student?.name || "Unknown"}</td>
                      <td className="px-6 py-4 text-sm text-[#64748b]">{app.student?.email || ""}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${app.status === "shortlisted" ? "bg-[#d1fae5] text-[#065f46]" : app.status === "rejected" ? "bg-[#fee2e2] text-[#991b1b]" : "bg-[#fef3c7] text-[#92400e]"}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button onClick={() => viewResume(app.student._id)} className="text-[#0f172a] hover:underline flex items-center gap-1">
                          <FaFileAlt size={14} /> View
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {app.status === "shortlisted" && (
                          <button onClick={() => openInterviewModal(app)} className="bg-[#0f172a] text-white px-3 py-1 rounded mr-2 hover:bg-[#1e293b] transition text-xs flex items-center gap-1">
                            <FaCalendarAlt size={12} /> Schedule
                          </button>
                        )}
                        <button onClick={() => handleStatusUpdate(app._id, "shortlisted")} className="bg-[#0f172a] text-white px-3 py-1 rounded mr-2 hover:bg-[#1e293b] transition text-xs">
                          Shortlist
                        </button>
                        <button onClick={() => handleStatusUpdate(app._id, "rejected")} className="bg-[#ef4444] text-white px-3 py-1 rounded hover:bg-[#dc2626] transition text-xs">
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "interviews" && (
          <div className="bg-white rounded-xl border border-[#e9edf4] shadow-sm overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold text-[#0f172a]">Scheduled Interviews</h2>
              <button onClick={fetchHRInterviews} className="text-[#64748b] hover:text-[#0f172a] transition" title="Refresh">
                <FaSync />
              </button>
            </div>
            {loadingInterviews ? (
              <div className="p-8 text-center text-[#64748b]">Loading...</div>
            ) : hrInterviews.length === 0 ? (
              <div className="p-8 text-center text-[#64748b]">No interviews scheduled yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#f8fafc]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Job</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Candidate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {hrInterviews.map((iv) => {
                      const status = iv.status?.toLowerCase ? iv.status.toLowerCase() : iv.status;
                      return (
                        <tr key={iv._id}>
                          <td className="px-6 py-4 text-sm text-[#0f172a]">{iv.job?.title || "Unknown"}</td>
                          <td className="px-6 py-4 text-sm text-[#0f172a]">{iv.application?.student?.name || "Unknown"}</td>
                          <td className="px-6 py-4 text-sm text-[#64748b]">{new Date(iv.scheduledAt).toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm text-[#64748b]">{iv.location}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${status === "completed" ? "bg-[#d1fae5] text-[#065f46]" : status === "cancelled" ? "bg-[#fee2e2] text-[#991b1b]" : "bg-[#fef3c7] text-[#92400e]"}`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {status === "scheduled" && (
                              <>
                                <button onClick={() => handleUpdateInterviewStatus(iv._id, "completed")} className="bg-[#0f172a] text-white px-3 py-1 rounded mr-2 hover:bg-[#1e293b] transition text-xs">
                                  Complete
                                </button>
                                <button onClick={() => handleUpdateInterviewStatus(iv._id, "cancelled")} className="bg-[#ef4444] text-white px-3 py-1 rounded hover:bg-[#dc2626] transition text-xs">
                                  Cancel
                                </button>
                                <button
                                  onClick={() => setVideoCallRoom(getInterviewRoom(iv))}
                                  className="bg-green-600 text-white px-3 py-1 rounded mr-2 hover:bg-green-700 transition text-xs flex items-center gap-1"
                                >
                                  <FaVideo size={12} /> Join Call
                                </button>
                              </>
                            )}
                            {status === "completed" && (
                              <button
                                onClick={() => {
                                  setSelectedInterviewForFeedback(iv);
                                  setFeedbackData(iv.feedback || { rating: 3, comments: "", decision: "" });
                                  setShowFeedbackModal(true);
                                }}
                                className="bg-[#0f172a] text-white px-3 py-1 rounded mr-2 hover:bg-[#1e293b] transition text-xs"
                              >
                                Feedback
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div>
            {loadingAnalytics ? (
              <div className="text-center py-12 text-[#64748b]">Loading analytics...</div>
            ) : analyticsData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-xl border border-[#e9edf4] shadow-sm">
                    <p className="text-xs font-medium text-[#94a3b8]">Total Jobs</p>
                    <p className="text-2xl font-semibold text-[#0f172a]">{analyticsData.totalJobs}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#e9edf4] shadow-sm">
                    <p className="text-xs font-medium text-[#94a3b8]">Applications</p>
                    <p className="text-2xl font-semibold text-[#0f172a]">{analyticsData.totalApplications}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#e9edf4] shadow-sm">
                    <p className="text-xs font-medium text-[#94a3b8]">Shortlisted</p>
                    <p className="text-2xl font-semibold text-[#0f172a]">{analyticsData.shortlisted}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#e9edf4] shadow-sm">
                    <p className="text-xs font-medium text-[#94a3b8]">Rejected</p>
                    <p className="text-2xl font-semibold text-[#0f172a]">{analyticsData.rejected}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#e9edf4] shadow-sm">
                    <p className="text-xs font-medium text-[#94a3b8]">Shortlist Rate</p>
                    <p className="text-2xl font-semibold text-[#0f172a]">{analyticsData.shortlistRate}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-xl border border-[#e9edf4] shadow-sm">
                    <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Applications per Job</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.appsPerJob}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="title" tick={{ fontSize: 10 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="applications" fill="#0f172a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#e9edf4] shadow-sm">
                    <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Shortlisted", value: analyticsData.shortlisted },
                            { name: "Rejected", value: analyticsData.rejected },
                            { name: "Pending", value: analyticsData.pending },
                          ]}
                          cx="50%"
                          cy="50%"
                          label
                        >
                          <Cell fill="#0f172a" />
                          <Cell fill="#ef4444" />
                          <Cell fill="#eab308" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#e9edf4] shadow-sm mt-6">
                  <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Recent Applications</h3>
                  <ul className="divide-y divide-gray-100">
                    {analyticsData.recentApps && analyticsData.recentApps.map((app) => (
                      <li key={app._id} className="py-2 text-sm">
                        <span className="font-medium text-[#0f172a]">{app.student?.name || "Unknown"}</span> applied to <span className="font-medium">{app.job?.title || "Job"}</span>
                        <span className="text-[#64748b] text-xs ml-2">{new Date(app.createdAt).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-[#64748b]">No analytics data available.</div>
            )}
          </div>
        )}
      </div>

      {/* Resume Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#0f172a]">Resume Details</h2>
              <button onClick={() => { setShowResumeModal(false); setSelectedResume(null); }} className="text-[#94a3b8] hover:text-[#64748b] text-xl">✕</button>
            </div>
            {loadingResume ? (
              <p className="text-[#64748b]">Loading...</p>
            ) : selectedResume ? (
              <div className="space-y-2 text-sm">
                <p><strong>File:</strong> {selectedResume.fileName}</p>
                <p><strong>Uploaded:</strong> {new Date(selectedResume.createdAt).toLocaleString()}</p>
                <p><strong>Email:</strong> {selectedResume.extractedData?.email || "Not found"}</p>
                <p><strong>Contact:</strong> {selectedResume.extractedData?.contact_no || "Not found"}</p>
                <p><strong>Skills:</strong> {selectedResume.extractedData?.technical_skills || "Not found"}</p>
                <p><strong>Projects:</strong> {selectedResume.extractedData?.project_details || "Not found"}</p>
                <p><strong>Certifications:</strong> {selectedResume.extractedData?.certifications || "Not found"}</p>
                <p><strong>Other Info:</strong> {selectedResume.extractedData?.other_info || "Not found"}</p>
              </div>
            ) : (
              <p className="text-[#64748b]">No resume data</p>
            )}
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showInterviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#0f172a]">Schedule Interview</h2>
              <button onClick={() => { setShowInterviewModal(false); setSelectedApplication(null); }} className="text-[#94a3b8] hover:text-[#64748b] text-xl">✕</button>
            </div>
            <p className="text-sm text-[#64748b] mb-4">
              Scheduling for: <strong>{selectedApplication?.student?.name}</strong>
            </p>
            <form onSubmit={handleScheduleInterview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={interviewData.scheduledAt}
                  onChange={(e) => setInterviewData({ ...interviewData, scheduledAt: e.target.value })}
                  required
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={interviewData.duration}
                  onChange={(e) => setInterviewData({ ...interviewData, duration: parseInt(e.target.value) })}
                  min="15"
                  step="5"
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">Location</label>
                <select
                  value={interviewData.location}
                  onChange={(e) => setInterviewData({ ...interviewData, location: e.target.value })}
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a]"
                >
                  <option value="Online">Online</option>
                  <option value="In-Person">In‑Person</option>
                  <option value="Phone">Phone</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">Meeting Link (optional)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={interviewData.meetingLink}
                  onChange={(e) => setInterviewData({ ...interviewData, meetingLink: e.target.value })}
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">Notes (optional)</label>
                <textarea
                  rows="2"
                  placeholder="Any additional instructions..."
                  value={interviewData.notes}
                  onChange={(e) => setInterviewData({ ...interviewData, notes: e.target.value })}
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a]"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => { setShowInterviewModal(false); setSelectedApplication(null); }} className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-[#0f172a] text-white rounded-lg hover:bg-[#1e293b] transition">
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#0f172a]">Interview Feedback</h2>
              <button onClick={() => { setShowFeedbackModal(false); setSelectedInterviewForFeedback(null); }} className="text-[#94a3b8] hover:text-[#64748b] text-xl">✕</button>
            </div>
            <p className="text-sm text-[#64748b] mb-4">
              Candidate: <strong>{selectedInterviewForFeedback?.application?.student?.name}</strong>
            </p>
            <form onSubmit={handleAddFeedback} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={feedbackData.rating}
                  onChange={(e) => setFeedbackData({ ...feedbackData, rating: parseInt(e.target.value) })}
                  required
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">Comments</label>
                <textarea
                  rows="3"
                  placeholder="Feedback comments..."
                  value={feedbackData.comments}
                  onChange={(e) => setFeedbackData({ ...feedbackData, comments: e.target.value })}
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1">Decision</label>
                <select
                  value={feedbackData.decision || ""}
                  onChange={(e) => setFeedbackData({ ...feedbackData, decision: e.target.value })}
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a]"
                >
                  <option value="">Select</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                  <option value="hold">Hold</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => { setShowFeedbackModal(false); setSelectedInterviewForFeedback(null); }} className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-[#0f172a] text-white rounded-lg hover:bg-[#1e293b] transition">Save Feedback</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Post New Job</h2>
            <form onSubmit={handleCreateJob}>
              <div className="space-y-4">
                <input type="text" placeholder="Job Title" value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} required className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a]" />
                <textarea placeholder="Description" value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} required rows="3" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a]" />
                <input type="text" placeholder="Requirements (comma separated)" value={newJob.requirements} onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })} required className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a]" />
                <input type="text" placeholder="Location" value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} required className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a]" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-[#0f172a] text-white rounded-lg hover:bg-[#1e293b] transition">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {videoCallRoom && (
        <VideoCall roomName={videoCallRoom} onClose={() => setVideoCallRoom(null)} />
      )}
    </div>
  );
}

export default HRDashboard;
