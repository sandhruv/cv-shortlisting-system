import { useEffect, useState, useMemo } from "react";
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
  FaCode,
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
import CompilerEmbed from "../components/CompilerEmbed";
import ProctoringViewer from "../components/ProctoringViewer";
import Toast, { useToast } from "../components/Toast";

function LpuFacultyDashboard() {
  const navigate = useNavigate();
  const { toasts, add: toast, remove: removeToast } = useToast();
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
  const [resumeJobCtx, setResumeJobCtx] = useState({ title: "", description: "" });
  const [aiInterviewQs, setAiInterviewQs] = useState([]);
  const [loadingAiQs, setLoadingAiQs] = useState(false);
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

  const assignedJobs = useMemo(() => {
    return jobs.filter((job) => job.allocatedFaculty?._id === currentUser._id || job.allocatedFaculty?.uid === currentUser.uid);
  }, [jobs, currentUser]);

  const assignedStudentsCount = useMemo(() => {
    return assignedJobs.reduce((sum, job) => sum + (job.allocatedStudents?.length || 0), 0);
  }, [assignedJobs]);

  const pendingAssignedApplicants = useMemo(() => {
    return applications.filter((app) => app.status === "pending").length;
  }, [applications]);

  const scheduledInterviewsCount = useMemo(() => {
    return hrInterviews.filter((interview) => interview.status === "scheduled").length;
  }, [hrInterviews]);

  const theme = {
    bg: '#0d131f',
    bgSecondary: '#111a2a',
    bgCard: '#152238',
    bgInput: '#0b1627',
    border: '#24406b',
    text: '#f6f7fb',
    textSecondary: '#9db2d6',
    gold: '#ff6b2b',
    goldLight: '#ff8c52',
    goldDark: '#d95511',
    goldGlow: 'rgba(255, 107, 43, 0.18)',
    green: '#4ade80',
    red: '#f87171',
    yellow: '#fbbf24',
  };

  // Feedback states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedInterviewForFeedback, setSelectedInterviewForFeedback] = useState(null);
  const [feedbackData, setFeedbackData] = useState({
    rating: 3,
    comments: "",
    decision: "",
  });

  // Coding Test States
  const [codingTests, setCodingTests] = useState([]);
  const [loadingCodingTests, setLoadingCodingTests] = useState(false);
  const [showCodingTestModal, setShowCodingTestModal] = useState(false);
  const [selectedAppForTest, setSelectedAppForTest] = useState(null);
  const [codingTestForm, setCodingTestForm] = useState({
    title: "",
    description: "",
    language: "python",
    durationMinutes: 30,
    testCases: [{ input: "Sample input", expectedOutput: "Sample output", description: "Test Case 1" }],
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCompilerPreview, setShowCompilerPreview] = useState(false);
  const [selectedTestForReview, setSelectedTestForReview] = useState(null);
  const [reviewFormData, setReviewFormData] = useState({
    score: 100,
    hrFeedback: "",
    verdict: "passed",
  });
  const [showProctoringViewer, setShowProctoringViewer] = useState(false);
  const [proctoringTest, setProctoringTest] = useState(null);

  const fetchJobs = async () => {
    try {
      const res = await api.get("/jobs");
      setJobs(res.data);
    } catch (err) {
      toast("Failed to fetch jobs", "error");
    }
  };

  const fetchHRCodingTests = async () => {
    setLoadingCodingTests(true);
    try {
      const res = await api.get("/coding-tests/hr-tests");
      setCodingTests(res.data);
    } catch (err) {
      toast("Failed to load coding tests", "error");
    } finally {
      setLoadingCodingTests(false);
    }
  };

  const openCodingTestModal = (app) => {
    setSelectedAppForTest(app);
    setCodingTestForm({
      title: `${app.job?.title || "Role"} - Coding Assessment`,
      description: "Write code to solve the problem requirements. Test cases are provided below.",
      language: "python",
      durationMinutes: 30,
      testCases: [{ input: "Sample input", expectedOutput: "Sample output", description: "Test Case 1" }],
    });
    setShowCodingTestModal(true);
  };

  const handleCreateCodingTest = async (e) => {
    e.preventDefault();
    if (!selectedAppForTest) return;
    try {
      await api.post("/coding-tests", {
        applicationId: selectedAppForTest._id,
        ...codingTestForm,
      });
      toast("Coding test assigned to candidate successfully!");
      setShowCodingTestModal(false);
      setSelectedAppForTest(null);
      if (selectedJobId) fetchApplicants(selectedJobId);
      fetchHRCodingTests();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to assign coding test", "error");
    }
  };

  const openReviewModal = (test) => {
    setSelectedTestForReview(test);
    setReviewFormData({
      score: test.score !== null ? test.score : 100,
      hrFeedback: test.hrFeedback || "",
      verdict: test.verdict || "passed",
    });
    setShowReviewModal(true);
  };

  const handleReviewCodingTest = async (e) => {
    e.preventDefault();
    if (!selectedTestForReview) return;
    try {
      await api.put(`/coding-tests/${selectedTestForReview._id}/review`, reviewFormData);
      toast("Coding test reviewed and status updated!");
      setShowReviewModal(false);
      setSelectedTestForReview(null);
      if (selectedJobId) fetchApplicants(selectedJobId);
      fetchHRCodingTests();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to review coding test", "error");
    }
  };

  const addTestCaseRow = () => {
    setCodingTestForm((prev) => ({
      ...prev,
      testCases: [...prev.testCases, { input: "", expectedOutput: "", description: "" }],
    }));
  };

  const removeTestCaseRow = (index) => {
    setCodingTestForm((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index),
    }));
  };

  useEffect(() => {
    fetchJobs();
    fetchHRCodingTests();
  }, []);

  const fetchApplicants = async (jobId) => {
    try {
      const res = await api.get(`/applications/jobs/${jobId}/applicants`);
      setApplications(res.data);
      setSelectedJobId(jobId);
      setActiveTab("applicants");
    } catch (err) {
      toast("Failed to fetch applicants", "error");
    }
  };

  const fetchHRInterviews = async () => {
    setLoadingInterviews(true);
    try {
      const res = await api.get("/interviews/job");
      setHrInterviews(res.data);
    } catch (err) {
      toast("Failed to fetch interviews", "error");
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
      toast("Failed to load analytics", "error");
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
      toast("Job created");
      setNewJob({ title: "", description: "", requirements: "", location: "" });
      setShowModal(false);
      fetchJobs();
    } catch (err) {
      toast(err.response?.data?.message || "Creation failed", "error");
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Delete this job?")) return;
    try {
      await api.delete(`/jobs/${id}`);
      toast("Job deleted");
      fetchJobs();
    } catch (err) {
      toast(err.response?.data?.message || "Delete failed", "error");
    }
  };

  const handleStatusUpdate = async (applicationId, status) => {
    try {
      await api.put(`/applications/${applicationId}/status`, { status });
      toast(`Application ${status}`);
      fetchApplicants(selectedJobId);
    } catch (err) {
      toast(err.response?.data?.message || "Update failed", "error");
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    try {
      await api.post("/interviews", {
        applicationId: selectedApplication._id,
        ...interviewData,
      });
      toast("Interview scheduled successfully!");
      setShowInterviewModal(false);
      setSelectedApplication(null);
      setInterviewData({ scheduledAt: "", duration: 60, location: "Online", meetingLink: "", notes: "" });
      fetchApplicants(selectedJobId);
      fetchHRInterviews();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to schedule interview", "error");
    }
  };

  const handleUpdateInterviewStatus = async (interviewId, status) => {
    if (!window.confirm(`Mark this interview as ${status}?`)) return;
    try {
      await api.put(`/interviews/${interviewId}`, { status });
      toast(`Interview ${status}`);
      fetchHRInterviews();
    } catch (err) {
      toast(err.response?.data?.message || "Update failed", "error");
    }
  };

  const handleStartInterviewCall = async (interview) => {
    try {
      await api.put(`/interviews/${interview._id}/call/start`);
      setVideoCallRoom(interview._id);
      fetchHRInterviews();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to start call", "error");
    }
  };

  const handleStopInterviewCall = async (interview) => {
    try {
      await api.put(`/interviews/${interview._id}/call/stop`);
      setVideoCallRoom(null);
      fetchHRInterviews();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to stop call", "error");
    }
  };

  const handleAddFeedback = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/interviews/${selectedInterviewForFeedback._id}/feedback`, feedbackData);
      toast("Feedback added successfully!");
      setShowFeedbackModal(false);
      setSelectedInterviewForFeedback(null);
      setFeedbackData({ rating: 3, comments: "", decision: "" });
      fetchHRInterviews();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to add feedback", "error");
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
      toast("No jobs posted yet. Please create a job first.", "error");
      return;
    }
    fetchApplicants(selectedJobId || jobs[0]._id);
  };

  const viewResume = async (studentId, jobTitle = "", jobDescription = "") => {
    setLoadingResume(true);
    setShowResumeModal(true);
    setAiInterviewQs([]);
    setResumeJobCtx({ title: jobTitle, description: jobDescription });
    try {
      const res = await api.get(`/resume/student/${studentId}`);
      setSelectedResume(res.data);
    } catch (err) {
      toast("No resume found for this student", "error");
      setShowResumeModal(false);
    } finally {
      setLoadingResume(false);
    }
  };

  const generateInterviewQs = async () => {
    if (!selectedResume) return;
    setLoadingAiQs(true);
    setAiInterviewQs([]);
    try {
      const res = await api.post("/resume/interview-questions", {
        resumeData: selectedResume.extractedData,
        jobTitle: resumeJobCtx.title,
        jobDescription: resumeJobCtx.description,
      });
      setAiInterviewQs(res.data.questions || []);
    } catch (err) {
      toast("AI generation failed: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setLoadingAiQs(false);
    }
  };

  const getInterviewRoom = (interview) => interview.roomName || `interview-${interview._id}`;


  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <Toast toasts={toasts} remove={removeToast} />
      <header className="border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
        <div className="flex items-center gap-3">
          <img src="/vettora-logo.png" alt="Vettora Logo" className="h-9 object-contain rounded-lg border border-white/10 p-0.5 bg-black/30" />
          <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(212, 168, 67, 0.2)', color: theme.gold }}>
            LPU Faculty
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
          <h1 className="text-3xl font-bold text-white tracking-tight">LPU Faculty Dashboard</h1>
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
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Assigned Jobs</p>
            <p className="text-2xl font-semibold mt-1" style={{ color: theme.text }}>{assignedJobs.length}</p>
          </div>
          <div className="p-5 rounded-xl border shadow-sm" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Assigned Students</p>
            <p className="text-2xl font-semibold mt-1" style={{ color: theme.text }}>{assignedStudentsCount}</p>
          </div>
          <div className="p-5 rounded-xl border shadow-sm" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Pending Applicants</p>
            <p className="text-2xl font-semibold mt-1" style={{ color: theme.gold }}>{pendingAssignedApplicants}</p>
          </div>
          <div className="p-5 rounded-xl border shadow-sm" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Scheduled Interviews</p>
            <p className="text-2xl font-semibold mt-1" style={{ color: '#f0a030' }}>{scheduledInterviewsCount}</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-5 mb-6" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold" style={{ color: theme.text }}>Assigned Student Queue</h2>
            <span className="text-xs" style={{ color: theme.textSecondary }}>{assignedJobs.length} jobs currently linked to you</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {assignedJobs.map((job) => (
              <div key={job._id} className="rounded-lg p-3" style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                <div className="font-semibold text-sm" style={{ color: theme.text }}>{job.title}</div>
                <div className="text-xs mt-1" style={{ color: theme.textSecondary }}>
                  {job.allocatedStudents?.length || 0} students assigned • {job.location}
                </div>
              </div>
            ))}
            {assignedJobs.length === 0 && <div className="text-sm" style={{ color: theme.textSecondary }}>No assigned jobs available yet.</div>}
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
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "coding_tests" ? "border-b-2" : ""}`}
            style={{ 
              color: activeTab === "coding_tests" ? theme.text : theme.textSecondary,
              borderColor: activeTab === "coding_tests" ? theme.gold : 'transparent'
            }}
            onClick={() => { setActiveTab("coding_tests"); fetchHRCodingTests(); }}
          >
            <FaCode className="inline mr-1" /> Coding Assessments {codingTests.length > 0 && `(${codingTests.length})`}
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
                <p className="text-xs mt-2" style={{ color: theme.textSecondary }}>
                  Assigned Students: {job.allocatedStudents?.length || 0}
                </p>
                <div className="text-xs mt-2" style={{ color: theme.textSecondary }}>
                  {job.allocatedStudents?.length > 0
                    ? `Students: ${job.allocatedStudents.map((student) => student.name).join(", ")}`
                    : "No students assigned by LPU admin yet."}
                </div>
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
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          app.status === "shortlisted" || app.status === "coding_test_passed" ? "bg-green-900/40 text-green-400 border border-green-500/30" : 
                          app.status === "rejected" || app.status === "coding_test_failed" ? "bg-red-900/40 text-red-400 border border-red-500/30" : 
                          app.status === "coding_test_assigned" ? "bg-purple-900/40 text-purple-300 border border-purple-500/30 animate-pulse" :
                          app.status === "coding_test_submitted" ? "bg-blue-900/40 text-blue-300 border border-blue-500/30" :
                          "bg-yellow-900/30 text-yellow-400 border border-yellow-500/30"
                        }`}>
                          {app.status === "coding_test_assigned" ? "Coding Test Assigned" :
                           app.status === "coding_test_submitted" ? "Coding Test Submitted" :
                           app.status === "coding_test_passed" ? "Coding Test Passed ✓" :
                           app.status === "coding_test_failed" ? "Coding Test Failed" :
                           app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => viewResume(
                            app.student._id,
                            app.job?.title || "",
                            app.job?.description || ""
                          )}
                          className="hover:underline flex items-center gap-1"
                          style={{ color: theme.gold }}
                        >
                          <FaFileAlt size={14} /> View
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm flex items-center gap-2 flex-wrap">
                        {app.status === "shortlisted" && (
                          <button onClick={() => openInterviewModal(app)} className="text-white px-3 py-1 rounded hover:opacity-80 transition text-xs flex items-center gap-1" style={{ backgroundColor: theme.gold }}>
                            <FaCalendarAlt size={12} /> Schedule
                          </button>
                        )}
                        <button
                          onClick={() => openCodingTestModal(app)}
                          className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition text-xs flex items-center gap-1"
                        >
                          <FaCode size={12} /> Assign Test
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(app._id, "shortlisted")} 
                          className="text-white px-3 py-1 rounded hover:opacity-80 transition text-xs"
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
                                className="text-white px-3 py-1 rounded mr-2 hover:opacity-80 transition text-xs flex items-center gap-1 inline-flex"
                                style={{ backgroundColor: theme.gold }}
                              >
                                ✨ AI Analysis & Feedback
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" style={{ backdropFilter: "blur(4px)" }}>
          <div className="rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl border" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>

            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b" style={{ borderColor: theme.border }}>
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.text }}>
                  <FaFileAlt style={{ color: theme.gold }} /> Resume Details
                </h2>
                {resumeJobCtx.title && (
                  <p className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>Job: {resumeJobCtx.title}</p>
                )}
              </div>
              <button
                onClick={() => { setShowResumeModal(false); setSelectedResume(null); setAiInterviewQs([]); }}
                className="hover:opacity-70 text-xl"
                style={{ color: theme.textSecondary }}
              >✕</button>
            </div>

            <div className="p-5">
              {loadingResume ? (
                <p className="text-center py-8" style={{ color: theme.textSecondary }}>Loading resume…</p>
              ) : selectedResume ? (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                    {[
                      ["📄 File", selectedResume.fileName],
                      ["📅 Uploaded", new Date(selectedResume.createdAt).toLocaleString()],
                      ["📧 Email", selectedResume.extractedData?.email],
                      ["📞 Contact", selectedResume.extractedData?.contact_no],
                      ["🛠 Skills", selectedResume.extractedData?.technical_skills],
                      ["🏆 Certifications", selectedResume.extractedData?.certifications],
                    ].map(([label, val]) => val && val !== "Not found" && (
                      <div key={label} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${theme.border}` }}>
                        <div className="text-xs font-semibold mb-1" style={{ color: theme.gold }}>{label}</div>
                        <div className="text-xs" style={{ color: theme.text }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {selectedResume.extractedData?.project_details && selectedResume.extractedData.project_details !== "Not found" && (
                    <div className="rounded-lg p-3 mb-5" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${theme.border}` }}>
                      <div className="text-xs font-semibold mb-1" style={{ color: theme.gold }}>🗂 Projects</div>
                      <div className="text-xs" style={{ color: theme.text }}>{selectedResume.extractedData.project_details}</div>
                    </div>
                  )}

                  <div className="border-t pt-4" style={{ borderColor: theme.border }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold" style={{ color: theme.text }}>🤖 AI Interview Questions</p>
                        <p className="text-xs" style={{ color: theme.textSecondary }}>Auto-generated from CV + Job profile via Groq AI</p>
                      </div>
                      <button
                        onClick={generateInterviewQs}
                        disabled={loadingAiQs}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition hover:opacity-85 disabled:opacity-50"
                        style={{
                          background: "linear-gradient(135deg, #5b21b6, #7c3aed)",
                          color: "#fff",
                          boxShadow: "0 2px 12px rgba(91,33,182,0.35)",
                        }}
                      >
                        {loadingAiQs ? (
                          <>
                            <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                            Generating…
                          </>
                        ) : (
                          <>🤖 Generate 10 Interview Q&amp;As</>
                        )}
                      </button>
                    </div>

                    {aiInterviewQs.length > 0 && (
                      <div className="space-y-3 mt-3">
                        {aiInterviewQs.map((q, i) => (
                          <div key={i} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.border}` }}>
                            <div className="flex items-start gap-3 p-3" style={{ background: "rgba(91,33,182,0.12)" }}>
                              <span className="text-xs font-black rounded-full w-6 h-6 flex items-center justify-center shrink-0" style={{ background: theme.gold, color: "#000" }}>{q.no || i + 1}</span>
                              <div className="flex-1">
                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold mr-2" style={{
                                  background: q.type === "Technical" ? "#1e3a5f" : q.type === "Behavioral" ? "#1a3a1a" : "#3a1a3a",
                                  color: q.type === "Technical" ? "#60a5fa" : q.type === "Behavioral" ? "#4ade80" : "#c084fc",
                                }}>{q.type}</span>
                                <p className="text-sm font-semibold mt-1" style={{ color: theme.text }}>{q.question}</p>
                              </div>
                            </div>
                            <div className="p-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                              <p className="text-xs font-semibold mb-1" style={{ color: theme.gold }}>✅ Model Answer</p>
                              <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>{q.answer}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-center py-8" style={{ color: theme.textSecondary }}>No resume data found.</p>
              )}
            </div>
          </div>
        </div>
      )}

        {activeTab === "coding_tests" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.text }}>
                  <FaCode className="text-purple-400" /> Faculty Coding Assessments Management
                </h2>
                <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>
                  Assign technical coding challenges to LPU students, view submission progress, and evaluate candidate solutions.
                </p>
              </div>
              <button
                onClick={() => setShowCompilerPreview(true)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center gap-2 shrink-0 shadow"
              >
                <FaCode size={14} /> Open Live Code Sandbox
              </button>
            </div>

            {loadingCodingTests ? (
              <div className="p-8 text-center" style={{ color: theme.textSecondary }}>Loading coding assessments...</div>
            ) : codingTests.length === 0 ? (
              <div className="rounded-xl border shadow-sm p-8 text-center" style={{ backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.textSecondary }}>
                No coding tests assigned yet. Select a student in the <strong>Applicants</strong> tab and click <strong>Assign Test</strong>.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {codingTests.map((t) => (
                  <div key={t._id} className="rounded-xl border shadow-sm p-5 space-y-3 relative hover:shadow-md transition" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg" style={{ color: theme.text }}>{t.title}</h3>
                      <span className="text-xs px-2.5 py-1 rounded-full uppercase font-mono font-bold bg-purple-900/40 text-purple-300 border border-purple-500/30">
                        {t.language}
                      </span>
                    </div>

                    <p className="text-xs" style={{ color: theme.textSecondary }}>
                      Candidate: <strong style={{ color: theme.text }}>{t.student?.name || "Student"}</strong> ({t.student?.email})
                    </p>

                    <p className="text-xs" style={{ color: theme.textSecondary }}>
                      Job Role: <strong style={{ color: theme.text }}>{t.job?.title || "Role"}</strong>
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t text-xs" style={{ borderColor: theme.border }}>
                      <div>
                        <span className={`px-2.5 py-0.5 rounded-full font-medium ${
                          t.status === "submitted" ? "bg-blue-900/40 text-blue-400 border border-blue-500/30" :
                          t.status === "reviewed" ? "bg-emerald-900/40 text-emerald-400 border border-emerald-500/30" :
                          t.status === "in_progress" ? "bg-amber-900/40 text-amber-400 border border-amber-500/30 animate-pulse" :
                          "bg-purple-900/40 text-purple-300 border border-purple-500/30"
                        }`}>
                          {t.status}
                        </span>
                        {t.verdict && (
                          <span className={`ml-2 font-bold uppercase ${t.verdict === "passed" ? "text-emerald-400" : "text-red-400"}`}>
                            ({t.verdict})
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                        <button
                          onClick={() => openReviewModal(t)}
                          className="px-3.5 py-1.5 rounded-lg text-white font-semibold text-xs bg-purple-600 hover:bg-purple-700 transition flex items-center gap-1 shadow"
                        >
                          <FaEye size={12} /> {t.status === "submitted" || t.status === "reviewed" ? "Review Submission" : "View Details"}
                        </button>
                        <button
                          onClick={() => { setProctoringTest(t); setShowProctoringViewer(true); }}
                          className="px-3.5 py-1.5 rounded-lg text-white font-semibold text-xs transition flex items-center gap-1 shadow"
                          style={{ background: t.status === "in_progress" ? "#15803d" : "#1e3a5f" }}
                          title={t.status === "in_progress" ? "Watch live camera" : "View captured snapshots"}
                        >
                          📷 {t.status === "in_progress" ? "🔴 Live Cam" : `Snaps (${(t.proctorSnapshots || []).length})`}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      {/* Assign Coding Test Modal */}
      {showCodingTestModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="rounded-2xl p-6 w-full max-w-2xl shadow-2xl my-8 border" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.text }}>
                <FaCode className="text-purple-400" /> Assign Technical Coding Assessment
              </h2>
              <button onClick={() => { setShowCodingTestModal(false); setSelectedAppForTest(null); }} className="hover:opacity-80 text-xl text-slate-400">✕</button>
            </div>

            <p className="text-xs mb-4 p-2.5 rounded-lg bg-purple-950/30 border border-purple-800/40 text-purple-200">
              Assigning test to candidate: <strong>{selectedAppForTest?.student?.name}</strong> ({selectedAppForTest?.student?.email}) for role <strong>{selectedAppForTest?.job?.title}</strong>
            </p>

            <form onSubmit={handleCreateCodingTest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">Assessment Title</label>
                <input
                  type="text"
                  required
                  value={codingTestForm.title}
                  onChange={(e) => setCodingTestForm({ ...codingTestForm, title: e.target.value })}
                  className="w-full rounded-xl px-3.5 py-2 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text, border: `1px solid ${theme.border}` }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">Problem Description & Requirements</label>
                <textarea
                  rows="4"
                  required
                  value={codingTestForm.description}
                  onChange={(e) => setCodingTestForm({ ...codingTestForm, description: e.target.value })}
                  className="w-full rounded-xl px-3.5 py-2 text-xs outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text, border: `1px solid ${theme.border}` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">Primary Programming Language</label>
                  <div className="flex gap-2">
                  <select
                    value={codingTestForm.language}
                    onChange={(e) => setCodingTestForm({ ...codingTestForm, language: e.target.value })}
                    className="w-full rounded-xl px-3.5 py-2 text-xs outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text, border: `1px solid ${theme.border}` }}
                  >
                    <option value="python">Python 3</option>
                    <option value="javascript">JavaScript (Node.js)</option>
                    <option value="java">Java 17</option>
                    <option value="cpp">C++ (GCC)</option>
                    <option value="c">C Language</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCompilerPreview(true)}
                    className="shrink-0 px-3 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition whitespace-nowrap"
                    title="Preview student compiler"
                  >
                    Preview IDE
                  </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">Timer Limit (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    required
                    value={codingTestForm.durationMinutes}
                    onChange={(e) => setCodingTestForm({ ...codingTestForm, durationMinutes: parseInt(e.target.value) || 30 })}
                    className="w-full rounded-xl px-3.5 py-2 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text, border: `1px solid ${theme.border}` }}
                  />
                </div>
              </div>

              {/* TEST CASES MANAGEMENT */}
              <div className="border pt-3 p-3.5 rounded-xl space-y-3" style={{ borderColor: theme.border, backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-purple-300">Sample Test Cases (Input & Expected Output)</label>
                  <button
                    type="button"
                    onClick={addTestCaseRow}
                    className="text-xs text-purple-400 hover:underline font-semibold"
                  >
                    + Add Test Case
                  </button>
                </div>

                {codingTestForm.testCases.map((tc, idx) => (
                  <div key={idx} className="p-3 rounded-lg border space-y-2 relative" style={{ borderColor: theme.border, backgroundColor: theme.bg }}>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-slate-400">Test Case #{idx + 1}</span>
                      {codingTestForm.testCases.length > 1 && (
                        <button type="button" onClick={() => removeTestCaseRow(idx)} className="text-red-400 text-xs hover:underline">
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Input (e.g. [1, 2, 3])"
                        value={tc.input}
                        onChange={(e) => {
                          const updated = [...codingTestForm.testCases];
                          updated[idx].input = e.target.value;
                          setCodingTestForm({ ...codingTestForm, testCases: updated });
                        }}
                        className="rounded-lg px-2.5 py-1.5 text-xs bg-black/40 border border-slate-700 text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Expected Output (e.g. 6)"
                        value={tc.expectedOutput}
                        onChange={(e) => {
                          const updated = [...codingTestForm.testCases];
                          updated[idx].expectedOutput = e.target.value;
                          setCodingTestForm({ ...codingTestForm, testCases: updated });
                        }}
                        className="rounded-lg px-2.5 py-1.5 text-xs bg-black/40 border border-slate-700 text-slate-200"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-3 border-t" style={{ borderColor: theme.border }}>
                <button
                  type="button"
                  onClick={() => { setShowCodingTestModal(false); setSelectedAppForTest(null); }}
                  className="px-4 py-2 text-xs rounded-xl transition"
                  style={{ border: `1px solid ${theme.border}`, color: theme.textSecondary }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-purple-600 hover:bg-purple-700 transition"
                >
                  Send Coding Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proctoring Viewer Modal */}
      {showProctoringViewer && proctoringTest && (
        <ProctoringViewer
          test={proctoringTest}
          onClose={() => { setShowProctoringViewer(false); setProctoringTest(null); }}
        />
      )}

      {/* Review Coding Test Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="rounded-2xl p-6 w-full max-w-3xl shadow-2xl my-8 border" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.text }}>
                <FaCode className="text-emerald-400" /> Review Candidate's Code Submission
              </h2>
              <button onClick={() => { setShowReviewModal(false); setSelectedTestForReview(null); }} className="hover:opacity-80 text-xl text-slate-400">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-black/30 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block">Candidate:</span>
                  <span className="font-semibold text-white text-sm">{selectedTestForReview?.student?.name}</span>
                  <span className="block text-slate-400">{selectedTestForReview?.student?.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assessment:</span>
                  <span className="font-semibold text-white text-sm">{selectedTestForReview?.title}</span>
                  <span className="block text-purple-300 uppercase font-mono">{selectedTestForReview?.language}</span>
                </div>
              </div>

              {/* SUBMITTED CODE DISPLAY */}
              <div>
                <label className="block text-xs font-bold text-emerald-400 mb-1">Candidate's Submitted Code Solution:</label>
                {selectedTestForReview?.submittedCode ? (
                  <pre className="p-4 rounded-xl bg-[#0d0d18] border border-[#2d2d48] text-emerald-300 font-mono text-xs overflow-x-auto max-h-64 whitespace-pre-wrap">
                    {selectedTestForReview.submittedCode}
                  </pre>
                ) : (
                  <div className="p-4 rounded-xl bg-red-950/20 border border-red-800/40 text-red-300 italic text-center">
                    No code solution submitted yet.
                  </div>
                )}
              </div>

              {selectedTestForReview?.submissionNotes && (
                <div>
                  <span className="text-slate-400 block font-semibold">Candidate Notes:</span>
                  <p className="p-2.5 rounded-lg bg-black/30 text-slate-200">{selectedTestForReview.submissionNotes}</p>
                </div>
              )}

              {/* ANTI-CHEAT SECURITY REPORT */}
              {selectedTestForReview?.antiCheatLog && (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: (selectedTestForReview.violationCount || 0) > 5 ? '#ef4444' : (selectedTestForReview.violationCount || 0) > 0 ? '#eab308' : '#22c55e' }}>
                  <div className="px-3 py-2 font-bold text-xs flex items-center gap-2" style={{
                    background: (selectedTestForReview.violationCount || 0) > 5 ? 'rgba(239,68,68,0.15)' : (selectedTestForReview.violationCount || 0) > 0 ? 'rgba(234,179,8,0.15)' : 'rgba(34,197,94,0.15)',
                    color: (selectedTestForReview.violationCount || 0) > 5 ? '#ef4444' : (selectedTestForReview.violationCount || 0) > 0 ? '#eab308' : '#22c55e'
                  }}>
                    🛡️ Security Report — Total Violations: {selectedTestForReview.violationCount || 0}
                    {(selectedTestForReview.violationCount || 0) > 10 && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-red-900/50 text-red-400 text-[10px]">HIGH RISK</span>
                    )}
                  </div>
                  <div className="p-3 bg-black/30 grid grid-cols-3 gap-2 text-[10px]">
                    {[
                      { label: 'Tab Switches', value: selectedTestForReview.antiCheatLog.tabSwitches || 0, icon: '📑' },
                      { label: 'Right-Click', value: selectedTestForReview.antiCheatLog.rightClickAttempts || 0, icon: '🖱️' },
                      { label: 'Clipboard', value: selectedTestForReview.antiCheatLog.clipboardAttempts || 0, icon: '📋' },
                      { label: 'DevTools', value: selectedTestForReview.antiCheatLog.devToolsOpened || 0, icon: '🔧' },
                      { label: 'Blocked Keys', value: selectedTestForReview.antiCheatLog.keyboardBlockAttempts || 0, icon: '⌨️' },
                      { label: 'Mouse Leave', value: selectedTestForReview.antiCheatLog.mouseLeaveCount || 0, icon: '🖱️' },
                      { label: 'Focus Loss', value: selectedTestForReview.antiCheatLog.focusLossCount || 0, icon: '👁️' },
                      { label: 'Fullscreen Exits', value: selectedTestForReview.antiCheatLog.fullscreenExits || 0, icon: '🖥️' },
                      { label: 'Screenshots', value: selectedTestForReview.antiCheatLog.screenshotAttempts || 0, icon: '📸' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-1 p-1.5 rounded-lg" style={{
                        background: item.value > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.05)',
                        color: item.value > 0 ? '#fca5a5' : '#86efac'
                      }}>
                        <span>{item.icon}</span>
                        <span className="text-slate-400">{item.label}:</span>
                        <span className="font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  {selectedTestForReview.sessionDuration && (
                    <div className="px-3 py-1.5 bg-black/20 text-[10px] text-slate-400 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      Session Duration: {Math.floor(selectedTestForReview.sessionDuration / 60)}m {selectedTestForReview.sessionDuration % 60}s
                      {selectedTestForReview.ipAddress && <> · IP: {selectedTestForReview.ipAddress}</>}
                    </div>
                  )}
                  {selectedTestForReview.browserFingerprint?.userAgent && (
                    <div className="px-3 py-1.5 bg-black/20 text-[10px] text-slate-400 border-t truncate" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      Browser: {selectedTestForReview.browserFingerprint.userAgent.substring(0, 100)}...
                    </div>
                  )}
                </div>
              )}

              {/* HR REVIEW FORM */}
              <form onSubmit={handleReviewCodingTest} className="space-y-4 pt-3 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-300">Score (0 - 100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={reviewFormData.score}
                      onChange={(e) => setReviewFormData({ ...reviewFormData, score: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl px-3 py-2 text-xs outline-none bg-black/40 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-300">Verdict & Shortlist Action</label>
                    <select
                      value={reviewFormData.verdict}
                      onChange={(e) => setReviewFormData({ ...reviewFormData, verdict: e.target.value })}
                      className="w-full rounded-xl px-3 py-2 text-xs outline-none bg-black/40 border border-slate-700 text-white font-semibold"
                    >
                      <option value="passed">✅ PASSED (Shortlist for Interview)</option>
                      <option value="failed">❌ FAILED</option>
                      <option value="resubmit">🔄 Request Resubmission</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">Faculty Review Feedback / Notes</label>
                  <textarea
                    rows="3"
                    placeholder="Feedback comments for candidate performance..."
                    value={reviewFormData.hrFeedback}
                    onChange={(e) => setReviewFormData({ ...reviewFormData, hrFeedback: e.target.value })}
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none bg-black/40 border border-slate-700 text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowReviewModal(false); setSelectedTestForReview(null); }}
                    className="px-4 py-2 text-xs rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition"
                  >
                    Save Review & Update Candidate
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Live Code IDE Modal */}
      {showCompilerPreview && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-5xl h-[85vh] rounded-2xl flex flex-col overflow-hidden border shadow-2xl" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div className="px-5 py-3 border-b flex justify-between items-center bg-black/40" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-2">
                <FaCode className="text-purple-400 text-lg" />
                <h3 className="font-bold text-sm text-white">Faculty Live Code Compiler & Assessment Playground</h3>
              </div>
              <button onClick={() => setShowCompilerPreview(false)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
            </div>
            <div className="flex-1 p-3 overflow-hidden">
              <CompilerEmbed
                language="python"
                title="Faculty Coding Playground"
                subtitle="Live Environment Sandbox"
                hrName={currentUser?.name || "LPU Faculty"}
                iframeHeight={540}
              />
            </div>
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

export default LpuFacultyDashboard;