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
  const [currentUser, setCurrentUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user") || "{}");
  });

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
      fetchHRInterviews();
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

  const handleStartInterviewCall = async (interview) => {
    try {
      await api.put(`/interviews/${interview._id}/call/start`);
      setVideoCallRoom(interview._id);
      fetchHRInterviews();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to start call");
    }
  };

  const handleStopInterviewCall = async (interview) => {
    try {
      await api.put(`/interviews/${interview._id}/call/stop`);
      setVideoCallRoom(null);
      fetchHRInterviews();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to stop call");
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

  // Golden theme colors
  const theme = {
    bg: '#0a0a0a',
    bgSecondary: '#1a1a1a',
    bgCard: '#1e1e1e',
    border: '#2a2a2a',
    text: '#f5f0e8',
    textSecondary: '#b8a88a',
    gold: '#d4a843',
    goldLight: '#f0d080',
    goldDark: '#b8922f',
    goldGlow: 'rgba(212, 168, 67, 0.2)',
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <header className="border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: theme.gold }}>
            <FaBuilding className="text-white text-lg" />
          </div>
          <span className="text-xl font-semibold tracking-tight" style={{ color: theme.text }}>
            Nexus<span style={{ color: theme.gold }}>Corp</span>
          </span>
          <span className="ml-3 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(212, 168, 67, 0.2)', color: theme.gold }}>
            HR
          </span>
        </div>
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-2 text-sm transition"
          style={{ color: theme.textSecondary }}
          onMouseEnter={(e) => e.currentTarget.style.color = theme.text}
          onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}
        >
          <FaSignOutAlt size={16} /> Sign out
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>HR Dashboard</h1>
          <button 
            onClick={() => setShowModal(true)} 
            className="text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"
            style={{ backgroundColor: theme.gold }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.goldDark}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.gold}
          >
            <FaPlus /> Post Job
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="p-5 rounded-xl border shadow-sm" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Total Jobs</p>
            <p className="text-2xl font-semibold mt-1" style={{ color: theme.text }}>{stats.totalJobs}</p>
          </div>
          <div className="p-5 rounded-xl border shadow-sm" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Total Applicants</p>
            <p className="text-2xl font-semibold mt-1" style={{ color: theme.text }}>{stats.totalApplicants}</p>
          </div>
          <div className="p-5 rounded-xl border shadow-sm" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Shortlisted</p>
            <p className="text-2xl font-semibold mt-1" style={{ color: theme.gold }}>{stats.shortlisted}</p>
          </div>
          <div className="p-5 rounded-xl border shadow-sm" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Pending</p>
            <p className="text-2xl font-semibold mt-1" style={{ color: '#f0a030' }}>{stats.pending}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b" style={{ borderColor: theme.border }}>
          <button 
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "jobs" ? "border-b-2" : ""}`}
            style={{ 
              color: activeTab === "jobs" ? theme.text : theme.textSecondary,
              borderColor: activeTab === "jobs" ? theme.gold : 'transparent'
            }}
            onClick={() => setActiveTab("jobs")}
          >
            My Jobs
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "applicants" ? "border-b-2" : ""}`}
            style={{ 
              color: activeTab === "applicants" ? theme.text : theme.textSecondary,
              borderColor: activeTab === "applicants" ? theme.gold : 'transparent'
            }}
            onClick={handleApplicantsClick}
          >
            Applicants
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "interviews" ? "border-b-2" : ""}`}
            style={{ 
              color: activeTab === "interviews" ? theme.text : theme.textSecondary,
              borderColor: activeTab === "interviews" ? theme.gold : 'transparent'
            }}
            onClick={() => { setActiveTab("interviews"); fetchHRInterviews(); }}
          >
            My Interviews
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "analytics" ? "border-b-2" : ""}`}
            style={{ 
              color: activeTab === "analytics" ? theme.text : theme.textSecondary,
              borderColor: activeTab === "analytics" ? theme.gold : 'transparent'
            }}
            onClick={() => { setActiveTab("analytics"); fetchAnalytics(); }}
          >
            <FaChartBar className="inline mr-1" /> Analytics
          </button>
        </div>

        {activeTab === "jobs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div key={job._id} className="rounded-xl border shadow-sm p-5 hover:shadow-md transition" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                <h3 className="text-lg font-semibold" style={{ color: theme.text }}>{job.title}</h3>
                <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>{job.location}</p>
                <p className="text-sm mt-2 line-clamp-2" style={{ color: theme.textSecondary }}>{job.description}</p>
                <div className="flex justify-between items-center mt-4">
                  <button onClick={() => fetchApplicants(job._id)} className="text-sm hover:underline flex items-center gap-1" style={{ color: theme.gold }}>
                    <FaEye size={14} /> View Applicants
                  </button>
                  <button onClick={() => handleDeleteJob(job._id)} className="hover:text-[#ff6b6b] transition" style={{ color: '#ff4444' }}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "applicants" && (
          <div className="rounded-xl border shadow-sm overflow-hidden" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y" style={{ borderColor: theme.border }}>
                <thead style={{ backgroundColor: 'rgba(212, 168, 67, 0.1)' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Resume</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: theme.border }}>
                  {applications.map((app) => (
                    <tr key={app._id}>
                      <td className="px-6 py-4 text-sm" style={{ color: theme.text }}>{app.student?.name || "Unknown"}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: theme.textSecondary }}>{app.student?.email || ""}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          app.status === "shortlisted" ? "bg-green-900/30 text-green-400" : 
                          app.status === "rejected" ? "bg-red-900/30 text-red-400" : 
                          "bg-yellow-900/30 text-yellow-400"
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button onClick={() => viewResume(app.student._id)} className="hover:underline flex items-center gap-1" style={{ color: theme.gold }}>
                          <FaFileAlt size={14} /> View
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {app.status === "shortlisted" && (
                          <button onClick={() => openInterviewModal(app)} className="text-white px-3 py-1 rounded mr-2 hover:opacity-80 transition text-xs flex items-center gap-1" style={{ backgroundColor: theme.gold }}>
                            <FaCalendarAlt size={12} /> Schedule
                          </button>
                        )}
                        <button 
                          onClick={() => handleStatusUpdate(app._id, "shortlisted")} 
                          className="text-white px-3 py-1 rounded mr-2 hover:opacity-80 transition text-xs"
                          style={{ backgroundColor: theme.gold }}
                        >
                          Shortlist
                        </button>
                        <button onClick={() => handleStatusUpdate(app._id, "rejected")} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition text-xs">
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
          <div className="rounded-xl border shadow-sm overflow-hidden" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: theme.border }}>
              <h2 className="text-lg font-semibold" style={{ color: theme.text }}>Scheduled Interviews</h2>
              <button onClick={fetchHRInterviews} className="transition" style={{ color: theme.textSecondary }}>
                <FaSync />
              </button>
            </div>
            {loadingInterviews ? (
              <div className="p-8 text-center" style={{ color: theme.textSecondary }}>Loading...</div>
            ) : hrInterviews.length === 0 ? (
              <div className="p-8 text-center" style={{ color: theme.textSecondary }}>No interviews scheduled yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y" style={{ borderColor: theme.border }}>
                  <thead style={{ backgroundColor: 'rgba(212, 168, 67, 0.1)' }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Job</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Candidate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: theme.border }}>
                    {hrInterviews.map((iv) => {
                      const status = iv.status?.toLowerCase ? iv.status.toLowerCase() : iv.status;
                      return (
                        <tr key={iv._id}>
                          <td className="px-6 py-4 text-sm" style={{ color: theme.text }}>{iv.job?.title || "Unknown"}</td>
                          <td className="px-6 py-4 text-sm" style={{ color: theme.text }}>{iv.application?.student?.name || "Unknown"}</td>
                          <td className="px-6 py-4 text-sm" style={{ color: theme.textSecondary }}>{new Date(iv.scheduledAt).toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm" style={{ color: theme.textSecondary }}>{iv.location}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              status === "completed" ? "bg-green-900/30 text-green-400" : 
                              status === "cancelled" ? "bg-red-900/30 text-red-400" : 
                              "bg-yellow-900/30 text-yellow-400"
                            }`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {status === "scheduled" && (
                              <>
                                <button onClick={() => handleUpdateInterviewStatus(iv._id, "completed")} className="text-white px-3 py-1 rounded mr-2 hover:opacity-80 transition text-xs" style={{ backgroundColor: theme.gold }}>
                                  Complete
                                </button>
                                <button onClick={() => handleUpdateInterviewStatus(iv._id, "cancelled")} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition text-xs">
                                  Cancel
                                </button>
                                {!iv.callActive ? (
                                  <button
                                    onClick={() => handleStartInterviewCall(iv)}
                                    className="bg-green-600 text-white px-3 py-1 rounded mr-2 hover:bg-green-700 transition text-xs flex items-center gap-1"
                                  >
                                    <FaVideo size={12} /> Start Call
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => setVideoCallRoom(iv._id)}
                                      className="bg-green-600 text-white px-3 py-1 rounded mr-2 hover:bg-green-700 transition text-xs flex items-center gap-1"
                                    >
                                      <FaVideo size={12} /> Join Call
                                    </button>
                                    <button
                                      onClick={() => handleStopInterviewCall(iv)}
                                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition text-xs"
                                    >
                                      End Call
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                            {status === "completed" && (
                              <button
                                onClick={() => {
                                  setSelectedInterviewForFeedback(iv);
                                  setFeedbackData(iv.feedback || { rating: 3, comments: "", decision: "" });
                                  setShowFeedbackModal(true);
                                }}
                                className="text-white px-3 py-1 rounded mr-2 hover:opacity-80 transition text-xs"
                                style={{ backgroundColor: theme.gold }}
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
              <div className="text-center py-12" style={{ color: theme.textSecondary }}>Loading analytics...</div>
            ) : analyticsData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  <div className="p-4 rounded-xl border shadow-sm" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                    <p className="text-xs font-medium" style={{ color: theme.textSecondary }}>Total Jobs</p>
                    <p className="text-2xl font-semibold" style={{ color: theme.text }}>{analyticsData.totalJobs}</p>
                  </div>
                  <div className="p-4 rounded-xl border shadow-sm" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                    <p className="text-xs font-medium" style={{ color: theme.textSecondary }}>Applications</p>
                    <p className="text-2xl font-semibold" style={{ color: theme.text }}>{analyticsData.totalApplications}</p>
                  </div>
                  <div className="p-4 rounded-xl border shadow-sm" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                    <p className="text-xs font-medium" style={{ color: theme.textSecondary }}>Shortlisted</p>
                    <p className="text-2xl font-semibold" style={{ color: theme.gold }}>{analyticsData.shortlisted}</p>
                  </div>
                  <div className="p-4 rounded-xl border shadow-sm" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                    <p className="text-xs font-medium" style={{ color: theme.textSecondary }}>Rejected</p>
                    <p className="text-2xl font-semibold" style={{ color: '#ff4444' }}>{analyticsData.rejected}</p>
                  </div>
                  <div className="p-4 rounded-xl border shadow-sm" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                    <p className="text-xs font-medium" style={{ color: theme.textSecondary }}>Shortlist Rate</p>
                    <p className="text-2xl font-semibold" style={{ color: theme.gold }}>{analyticsData.shortlistRate}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl border shadow-sm" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                    <h3 className="text-sm font-semibold mb-4" style={{ color: theme.text }}>Applications per Job</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.appsPerJob}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                        <XAxis dataKey="title" tick={{ fontSize: 10, fill: theme.textSecondary }} />
                        <YAxis tick={{ fill: theme.textSecondary }} />
                        <Tooltip contentStyle={{ backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.text }} />
                        <Legend wrapperStyle={{ color: theme.text }} />
                        <Bar dataKey="applications" fill={theme.gold} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="p-4 rounded-xl border shadow-sm" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                    <h3 className="text-sm font-semibold mb-4" style={{ color: theme.text }}>Status Distribution</h3>
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
                          <Cell fill={theme.gold} />
                          <Cell fill="#ff4444" />
                          <Cell fill="#f0a030" />
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.text }} />
                        <Legend wrapperStyle={{ color: theme.text }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-4 rounded-xl border shadow-sm mt-6" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                  <h3 className="text-sm font-semibold mb-4" style={{ color: theme.text }}>Recent Applications</h3>
                  <ul className="divide-y" style={{ borderColor: theme.border }}>
                    {analyticsData.recentApps && analyticsData.recentApps.map((app) => (
                      <li key={app._id} className="py-2 text-sm">
                        <span className="font-medium" style={{ color: theme.text }}>{app.student?.name || "Unknown"}</span> applied to <span className="font-medium" style={{ color: theme.gold }}>{app.job?.title || "Job"}</span>
                        <span className="text-xs ml-2" style={{ color: theme.textSecondary }}>{new Date(app.createdAt).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-center py-12" style={{ color: theme.textSecondary }}>No analytics data available.</div>
            )}
          </div>
        )}
      </div>

      {/* Resume Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl" style={{ backgroundColor: theme.bgCard, borderColor: theme.border, border: '1px solid' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold" style={{ color: theme.text }}>Resume Details</h2>
              <button onClick={() => { setShowResumeModal(false); setSelectedResume(null); }} className="hover:opacity-80 text-xl" style={{ color: theme.textSecondary }}>✕</button>
            </div>
            {loadingResume ? (
              <p style={{ color: theme.textSecondary }}>Loading...</p>
            ) : selectedResume ? (
              <div className="space-y-2 text-sm">
                <p><strong style={{ color: theme.gold }}>File:</strong> <span style={{ color: theme.text }}>{selectedResume.fileName}</span></p>
                <p><strong style={{ color: theme.gold }}>Uploaded:</strong> <span style={{ color: theme.text }}>{new Date(selectedResume.createdAt).toLocaleString()}</span></p>
                <p><strong style={{ color: theme.gold }}>Email:</strong> <span style={{ color: theme.text }}>{selectedResume.extractedData?.email || "Not found"}</span></p>
                <p><strong style={{ color: theme.gold }}>Contact:</strong> <span style={{ color: theme.text }}>{selectedResume.extractedData?.contact_no || "Not found"}</span></p>
                <p><strong style={{ color: theme.gold }}>Skills:</strong> <span style={{ color: theme.text }}>{selectedResume.extractedData?.technical_skills || "Not found"}</span></p>
                <p><strong style={{ color: theme.gold }}>Projects:</strong> <span style={{ color: theme.text }}>{selectedResume.extractedData?.project_details || "Not found"}</span></p>
                <p><strong style={{ color: theme.gold }}>Certifications:</strong> <span style={{ color: theme.text }}>{selectedResume.extractedData?.certifications || "Not found"}</span></p>
                <p><strong style={{ color: theme.gold }}>Other Info:</strong> <span style={{ color: theme.text }}>{selectedResume.extractedData?.other_info || "Not found"}</span></p>
              </div>
            ) : (
              <p style={{ color: theme.textSecondary }}>No resume data</p>
            )}
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showInterviewModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-full max-w-lg shadow-xl" style={{ backgroundColor: theme.bgCard, borderColor: theme.border, border: '1px solid' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold" style={{ color: theme.text }}>Schedule Interview</h2>
              <button onClick={() => { setShowInterviewModal(false); setSelectedApplication(null); }} className="hover:opacity-80 text-xl" style={{ color: theme.textSecondary }}>✕</button>
            </div>
            <p className="text-sm mb-4" style={{ color: theme.textSecondary }}>
              Scheduling for: <strong style={{ color: theme.text }}>{selectedApplication?.student?.name}</strong>
            </p>
            <form onSubmit={handleScheduleInterview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>Date & Time</label>
                <input
                  type="datetime-local"
                  value={interviewData.scheduledAt}
                  onChange={(e) => setInterviewData({ ...interviewData, scheduledAt: e.target.value })}
                  required
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                  style={{ 
                    backgroundColor: theme.bg, 
                    borderColor: theme.border, 
                    color: theme.text,
                    border: `1px solid ${theme.border}`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>Duration (minutes)</label>
                <input
                  type="number"
                  value={interviewData.duration}
                  onChange={(e) => setInterviewData({ ...interviewData, duration: parseInt(e.target.value) })}
                  min="15"
                  step="5"
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                  style={{ 
                    backgroundColor: theme.bg, 
                    borderColor: theme.border, 
                    color: theme.text,
                    border: `1px solid ${theme.border}`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>Location</label>
                <select
                  value={interviewData.location}
                  onChange={(e) => setInterviewData({ ...interviewData, location: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                  style={{ 
                    backgroundColor: theme.bg, 
                    borderColor: theme.border, 
                    color: theme.text,
                    border: `1px solid ${theme.border}`
                  }}
                >
                  <option value="Online">Online</option>
                  <option value="In-Person">In‑Person</option>
                  <option value="Phone">Phone</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>Meeting Link (optional)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={interviewData.meetingLink}
                  onChange={(e) => setInterviewData({ ...interviewData, meetingLink: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                  style={{ 
                    backgroundColor: theme.bg, 
                    borderColor: theme.border, 
                    color: theme.text,
                    border: `1px solid ${theme.border}`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>Notes (optional)</label>
                <textarea
                  rows="2"
                  placeholder="Any additional instructions..."
                  value={interviewData.notes}
                  onChange={(e) => setInterviewData({ ...interviewData, notes: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                  style={{ 
                    backgroundColor: theme.bg, 
                    borderColor: theme.border, 
                    color: theme.text,
                    border: `1px solid ${theme.border}`
                  }}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => { setShowInterviewModal(false); setSelectedApplication(null); }} className="px-4 py-2 text-sm rounded-lg transition" style={{ border: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                  Cancel
                </button>
                <button type="submit" className="text-white px-4 py-2 text-sm rounded-lg transition" style={{ backgroundColor: theme.gold }}>
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-full max-w-lg shadow-xl" style={{ backgroundColor: theme.bgCard, borderColor: theme.border, border: '1px solid' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold" style={{ color: theme.text }}>Interview Feedback</h2>
              <button onClick={() => { setShowFeedbackModal(false); setSelectedInterviewForFeedback(null); }} className="hover:opacity-80 text-xl" style={{ color: theme.textSecondary }}>✕</button>
            </div>
            <p className="text-sm mb-4" style={{ color: theme.textSecondary }}>
              Candidate: <strong style={{ color: theme.text }}>{selectedInterviewForFeedback?.application?.student?.name}</strong>
            </p>
            <form onSubmit={handleAddFeedback} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={feedbackData.rating}
                  onChange={(e) => setFeedbackData({ ...feedbackData, rating: parseInt(e.target.value) })}
                  required
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                  style={{ 
                    backgroundColor: theme.bg, 
                    borderColor: theme.border, 
                    color: theme.text,
                    border: `1px solid ${theme.border}`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>Comments</label>
                <textarea
                  rows="3"
                  placeholder="Feedback comments..."
                  value={feedbackData.comments}
                  onChange={(e) => setFeedbackData({ ...feedbackData, comments: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                  style={{ 
                    backgroundColor: theme.bg, 
                    borderColor: theme.border, 
                    color: theme.text,
                    border: `1px solid ${theme.border}`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>Decision</label>
                <select
                  value={feedbackData.decision || ""}
                  onChange={(e) => setFeedbackData({ ...feedbackData, decision: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                  style={{ 
                    backgroundColor: theme.bg, 
                    borderColor: theme.border, 
                    color: theme.text,
                    border: `1px solid ${theme.border}`
                  }}
                >
                  <option value="">Select</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                  <option value="hold">Hold</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => { setShowFeedbackModal(false); setSelectedInterviewForFeedback(null); }} className="px-4 py-2 text-sm rounded-lg transition" style={{ border: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                  Cancel
                </button>
                <button type="submit" className="text-white px-4 py-2 text-sm rounded-lg transition" style={{ backgroundColor: theme.gold }}>
                  Save Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-full max-w-lg shadow-xl" style={{ backgroundColor: theme.bgCard, borderColor: theme.border, border: '1px solid' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: theme.text }}>Post New Job</h2>
            <form onSubmit={handleCreateJob}>
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Job Title" 
                  value={newJob.title} 
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} 
                  required 
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                  style={{ 
                    backgroundColor: theme.bg, 
                    borderColor: theme.border, 
                    color: theme.text,
                    border: `1px solid ${theme.border}`
                  }}
                />
                <textarea 
                  placeholder="Description" 
                  value={newJob.description} 
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} 
                  required 
                  rows="3" 
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                  style={{ 
                    backgroundColor: theme.bg, 
                    borderColor: theme.border, 
                    color: theme.text,
                    border: `1px solid ${theme.border}`
                  }}
                />
                <input 
                  type="text" 
                  placeholder="Requirements (comma separated)" 
                  value={newJob.requirements} 
                  onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })} 
                  required 
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                  style={{ 
                    backgroundColor: theme.bg, 
                    borderColor: theme.border, 
                    color: theme.text,
                    border: `1px solid ${theme.border}`
                  }}
                />
                <input 
                  type="text" 
                  placeholder="Location" 
                  value={newJob.location} 
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} 
                  required 
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                  style={{ 
                    backgroundColor: theme.bg, 
                    borderColor: theme.border, 
                    color: theme.text,
                    border: `1px solid ${theme.border}`
                  }}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg transition" style={{ border: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                  Cancel
                </button>
                <button type="submit" className="text-white px-4 py-2 text-sm rounded-lg transition" style={{ backgroundColor: theme.gold }}>
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {videoCallRoom && (
        <VideoCall roomId={videoCallRoom} user={currentUser} onClose={() => setVideoCallRoom(null)} />
      )}
    </div>
  );
}

export default HRDashboard;