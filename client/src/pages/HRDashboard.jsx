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
  FaCode,
  FaRobot,
  FaMicrophone,
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
import RazorpayCheckout from "../components/RazorpayCheckout";
import CompilerEmbed from "../components/CompilerEmbed";
import ProctoringViewer from "../components/ProctoringViewer";
import Toast, { useToast } from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

function HRDashboard() {
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
    interviewMode: "human",
  });
  const [showAiReportModal, setShowAiReportModal] = useState(false);
  const [selectedAiReport, setSelectedAiReport] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

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
    testCases: [{ input: "", expectedOutput: "", description: "" }],
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
  const [videoCallRoom, setVideoCallRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user") || "{}");
  });
  const [paymentPlan, setPaymentPlan] = useState("monthly");

  // Profile Submissions states
  const [profileSubmissions, setProfileSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [hrComment, setHrComment] = useState("");

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
      toast("Failed to fetch jobs", "error");
    }
  };

  const fetchApplicants = async (jobId) => {
    try {
      const [appRes, subRes] = await Promise.all([
        api.get(`/applications/jobs/${jobId}/applicants`),
        api.get("/profile-submissions/received"),
      ]);
      setApplications(appRes.data);
      setProfileSubmissions(subRes.data);
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

  const fetchProfileSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const res = await api.get("/profile-submissions/received");
      setProfileSubmissions(res.data);
    } catch (err) {
      toast("Failed to load profile submissions", "error");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleSubmissionStatus = async (id, status) => {
    try {
      await api.put(`/profile-submissions/${id}/status`, { status, hrComment });
      toast(`Profile ${status}`);
      setShowSubmissionModal(false);
      setSelectedSubmission(null);
      setHrComment("");
      fetchProfileSubmissions();
    } catch (err) {
      toast(err.response?.data?.message || "Update failed", "error");
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
      setApplications(prev => prev.map(app => app._id === selectedAppForTest._id ? { ...app, status: "coding_test_assigned" } : app));
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
      setCodingTests(prev => prev.map(t => t._id === selectedTestForReview._id ? { ...t, ...reviewFormData, status: reviewFormData.verdict === "passed" ? "passed" : "failed" } : t));
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
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handlePaymentSuccess = (updatedUser) => {
    const nextUser = { ...currentUser, ...updatedUser };
    setCurrentUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
    toast("Subscription activated successfully.");
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
      setApplications(prev => prev.map(app => app._id === applicationId ? { ...app, status } : app));
      toast(`Application ${status}`);
    } catch (err) {
      toast(err.response?.data?.message || "Update failed", "error");
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/interviews", {
        applicationId: selectedApplication._id,
        ...interviewData,
      });
      toast(interviewData.interviewMode === "ai" ? "AI Interview scheduled! AI questions are being generated." : "Interview scheduled successfully!");
      setShowInterviewModal(false);
      setSelectedApplication(null);
      setInterviewData({ scheduledAt: "", duration: 60, location: "Online", meetingLink: "", notes: "", interviewMode: "human" });
      setHrInterviews(prev => [res.data.interview || res.data, ...prev]);
      fetchHRInterviews();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to schedule interview", "error");
    }
  };

  const handleViewAiReport = async (interview) => {
    try {
      const res = await api.get(`/interviews/${interview._id}/ai-report`);
      setSelectedAiReport(res.data);
      setShowAiReportModal(true);
    } catch (err) {
      toast(err.response?.data?.message || "Failed to load AI report", "error");
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
      <Toast toasts={toasts} remove={removeToast} />
      <header className="border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
        <div className="flex items-center gap-3">
          <img src="/vettora-logo.png" alt="Vettora Logo" className="h-9 object-contain rounded-lg border border-white/10 p-0.5 bg-black/30" />
          <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(212, 168, 67, 0.2)', color: theme.gold }}>
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

        {currentUser.role === "HR" && (
          <div className="rounded-xl border shadow-sm p-5 mb-8" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>HR Subscription</p>
                <p className="text-lg font-semibold mt-1" style={{ color: theme.text }}>
                  Current plan: <span className="text-[#d4af37]">{currentUser.subscriptionPlan || "trial"}</span>
                </p>
                <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>
                  {currentUser.planEndsAt ? `Valid until ${new Date(currentUser.planEndsAt).toLocaleDateString()}` : "Use trial or upgrade with Razorpay"}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <select
                  value={paymentPlan}
                  onChange={(e) => setPaymentPlan(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text, border: `1px solid ${theme.border}` }}
                >
                  <option value="monthly">Monthly - ₹200</option>
                  <option value="yearly">Yearly - ₹1800</option>
                </select>
                <RazorpayCheckout
                  plan={paymentPlan}
                  amount={paymentPlan === "yearly" ? 1800 : 200}
                  user={currentUser}
                  onSuccess={handlePaymentSuccess}
                />
              </div>
            </div>
          </div>
        )}

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
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "coding_tests" ? "border-b-2" : ""}`}
            style={{ 
              color: activeTab === "coding_tests" ? theme.text : theme.textSecondary,
              borderColor: activeTab === "coding_tests" ? theme.gold : 'transparent'
            }}
            onClick={() => { setActiveTab("coding_tests"); fetchHRCodingTests(); }}
          >
            <FaCode className="inline mr-1" /> Coding Tests
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
                      <td className="px-6 py-4 text-sm flex items-center flex-wrap gap-2">
                        <button
                          onClick={() => {
                            const sub = profileSubmissions.find(s => s.student?._id === app.student?._id);
                            if (sub) {
                              setSelectedSubmission(sub);
                              setHrComment("");
                              setShowSubmissionModal(true);
                            }
                          }}
                          className="text-white px-3 py-1 rounded hover:opacity-80 transition text-xs flex items-center gap-1"
                          style={{ backgroundColor: theme.gold, opacity: profileSubmissions.some(s => s.student?._id === app.student?._id) ? 1 : 0.4 }}
                        >
                          <FaEye size={12} /> View Profile
                        </button>

                        {["shortlisted", "coding_test_passed"].includes(app.status) && (
                          <button onClick={() => openInterviewModal(app)} className="text-white px-3 py-1 rounded hover:opacity-80 transition text-xs flex items-center gap-1" style={{ backgroundColor: theme.gold }}>
                            <FaCalendarAlt size={12} /> Schedule Interview
                          </button>
                        )}

                        <button
                          onClick={() => openCodingTestModal(app)}
                          className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition text-xs flex items-center gap-1"
                        >
                          <FaCode size={12} /> Assign Coding Test
                        </button>

                        {app.status !== "shortlisted" && (
                          <button 
                            onClick={() => handleStatusUpdate(app._id, "shortlisted")} 
                            className="text-white px-3 py-1 rounded hover:opacity-80 transition text-xs"
                            style={{ backgroundColor: theme.gold }}
                          >
                            Shortlist
                          </button>
                        )}

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
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Mode</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: theme.border }}>
                    {hrInterviews.map((iv) => {
                      const status = iv.status?.toLowerCase ? iv.status.toLowerCase() : iv.status;
                      const isAi = iv.interviewMode === "ai";
                      return (
                        <tr key={iv._id}>
                          <td className="px-6 py-4 text-sm" style={{ color: theme.text }}>{iv.job?.title || "Unknown"}</td>
                          <td className="px-6 py-4 text-sm" style={{ color: theme.text }}>{iv.application?.student?.name || "Unknown"}</td>
                          <td className="px-6 py-4 text-sm">
                            {isAi ? (
                              <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-purple-900/40 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1.5">
                                <FaRobot size={11} /> AI Voice
                              </span>
                            ) : (
                              <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-blue-900/40 text-blue-300 border border-blue-500/30 inline-flex items-center gap-1.5">
                                <FaVideo size={11} /> Human Video
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm" style={{ color: theme.textSecondary }}>{new Date(iv.scheduledAt).toLocaleString()}</td>
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
                            {isAi ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleViewAiReport(iv)}
                                  className="text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition text-xs flex items-center gap-1.5 shadow"
                                  style={{ backgroundColor: theme.gold }}
                                >
                                  <FaRobot size={12} /> View AI Report
                                </button>
                                {status === "scheduled" && (
                                  <button onClick={() => handleUpdateInterviewStatus(iv._id, "cancelled")} className="bg-red-600/80 text-white px-2.5 py-1 rounded hover:bg-red-700 transition text-xs">
                                    Cancel
                                  </button>
                                )}
                              </div>
                            ) : (
                              status === "scheduled" && (
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
                              )
                            )}
                            {!isAi && status === "completed" && (
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

        {activeTab === "coding_tests" && (
          <div className="rounded-xl border shadow-sm overflow-hidden" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: theme.border }}>
              <h2 className="text-lg font-semibold" style={{ color: theme.text }}>Assigned Coding Assessments</h2>
              <button onClick={fetchHRCodingTests} className="transition hover:opacity-80" style={{ color: theme.textSecondary }}>
                <FaSync />
              </button>
            </div>
            {loadingCodingTests ? (
              <div className="p-8 text-center" style={{ color: theme.textSecondary }}>Loading coding assessments...</div>
            ) : codingTests.length === 0 ? (
              <div className="p-8 text-center" style={{ color: theme.textSecondary }}>No coding tests assigned yet. Click "Assign Coding Test" under Applicants to send a test.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y" style={{ borderColor: theme.border }}>
                  <thead style={{ backgroundColor: 'rgba(212, 168, 67, 0.1)' }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Job</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Candidate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Test Title & Language</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Verdict</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: theme.border }}>
                    {codingTests.map((t) => (
                      <tr key={t._id}>
                        <td className="px-6 py-4 text-sm" style={{ color: theme.text }}>{t.job?.title || "Role"}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: theme.text }}>
                          {t.student?.name || "Candidate"}
                          <div className="text-xs" style={{ color: theme.textSecondary }}>{t.student?.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-semibold" style={{ color: theme.text }}>{t.title}</div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-500/30 uppercase font-mono mt-1 inline-block">
                            {t.language}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: theme.textSecondary }}>{t.durationMinutes} mins</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            t.status === "submitted" ? "bg-blue-900/40 text-blue-400 border border-blue-500/30" :
                            t.status === "reviewed" ? "bg-emerald-900/40 text-emerald-400 border border-emerald-500/30" :
                            t.status === "in_progress" ? "bg-amber-900/40 text-amber-400 border border-amber-500/30 animate-pulse" :
                            "bg-gray-800 text-gray-300 border border-gray-700"
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {t.verdict ? (
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                              t.verdict === "passed" ? "bg-green-900/50 text-green-400 border border-green-500/40" :
                              "bg-red-900/50 text-red-400 border border-red-500/40"
                            }`}>
                              {t.verdict}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">Pending Review</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                          <button
                            onClick={() => openReviewModal(t)}
                            className="text-white px-3 py-1.5 rounded-lg hover:opacity-80 transition text-xs flex items-center gap-1 font-medium"
                            style={{ backgroundColor: theme.gold }}
                          >
                            <FaEye size={12} /> Review Code
                          </button>
                          <button
                            onClick={() => { setProctoringTest(t); setShowProctoringViewer(true); }}
                            className="text-white px-3 py-1.5 rounded-lg hover:opacity-80 transition text-xs flex items-center gap-1 font-medium"
                            style={{ background: t.status === "in_progress" ? "#15803d" : "#1e3a5f" }}
                            title={t.status === "in_progress" ? "Watch live camera" : "View captured snapshots"}
                          >
                            📷 {t.status === "in_progress" ? "🔴 Live" : `Snaps (${(t.proctorSnapshots || []).length})`}
                          </button>
                        </td>
                      </tr>
                    ))}
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
                  {/* CV Data */}
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

                  {/* AI Interview Questions Button */}
                  <div className="border-t pt-4" style={{ borderColor: theme.border }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold" style={{ color: theme.text }}>🤖 AI Interview Questions</p>
                        <p className="text-xs" style={{ color: theme.textSecondary }}>Generated from CV + Job profile via Groq AI</p>
                      </div>
                      <button
                        onClick={generateInterviewQs}
                        disabled={loadingAiQs}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition hover:opacity-85 disabled:opacity-50"
                        style={{
                          background: `linear-gradient(135deg, #8B1A1A, #c4831a)`,
                          color: "#fff",
                          boxShadow: "0 2px 12px rgba(139,26,26,0.35)",
                        }}
                      >
                        {loadingAiQs ? (
                          <>
                            <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                            Generating…
                          </>
                        ) : (
                          <>
                            🤖 Generate 10 Interview Q&amp;As
                          </>
                        )}
                      </button>
                    </div>

                    {/* Questions List */}
                    {aiInterviewQs.length > 0 && (
                      <div className="space-y-3 mt-3">
                        {aiInterviewQs.map((q, i) => (
                          <div key={i} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.border}` }}>
                            <div className="flex items-start gap-3 p-3" style={{ background: "rgba(139,26,26,0.12)" }}>
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
                <label className="block text-sm font-medium mb-1.5" style={{ color: theme.text }}>Interview Type / Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInterviewData({ ...interviewData, interviewMode: "human" })}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                      interviewData.interviewMode === "human"
                        ? "border-amber-500 bg-amber-500/10 text-white"
                        : "border-gray-800 bg-gray-900/40 text-gray-400 hover:border-gray-700"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-blue-900/30 text-blue-400">
                      <FaVideo size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Human Interview</div>
                      <div className="text-[10px] text-gray-400">Live 1-on-1 Video Call</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInterviewData({ ...interviewData, interviewMode: "ai" })}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                      interviewData.interviewMode === "ai"
                        ? "border-purple-500 bg-purple-500/15 text-white"
                        : "border-gray-800 bg-gray-900/40 text-gray-400 hover:border-gray-700"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-purple-900/40 text-purple-300">
                      <FaRobot size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        AI Interview
                        <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500 text-black font-extrabold">NEW</span>
                      </div>
                      <div className="text-[10px] text-gray-400">Groq Voice & Evaluation</div>
                    </div>
                  </button>
                </div>
              </div>

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
                <button type="submit" className="text-white px-4 py-2 text-sm rounded-lg transition font-semibold" style={{ backgroundColor: theme.gold }}>
                  {interviewData.interviewMode === "ai" ? "Schedule AI Interview" : "Schedule Interview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Interview Report Modal */}
      {showAiReportModal && selectedAiReport && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div className="flex justify-between items-center pb-4 border-b" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-900/30 text-purple-300 border border-purple-500/30">
                  <FaRobot size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: theme.text }}>
                    AI Interview Assessment Report
                  </h2>
                  <p className="text-xs" style={{ color: theme.textSecondary }}>
                    Candidate: <strong style={{ color: theme.text }}>{selectedAiReport.candidate?.name || "Candidate"}</strong> ({selectedAiReport.candidate?.email}) • Job: <strong style={{ color: theme.text }}>{selectedAiReport.job?.title}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => { setShowAiReportModal(false); setSelectedAiReport(null); }} className="text-xl hover:opacity-70" style={{ color: theme.textSecondary }}>✕</button>
            </div>

            <div className="py-5 space-y-5">
              {/* Score & Decision Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border flex flex-col items-center justify-center text-center" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                  <div className="text-xs font-semibold uppercase mb-1" style={{ color: theme.textSecondary }}>Overall Score</div>
                  <div className="text-3xl font-extrabold" style={{ color: theme.gold }}>
                    {selectedAiReport.feedback?.rating ? `${selectedAiReport.feedback.rating}/5` : "Pending"}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">AI Evaluated</div>
                </div>

                <div className="p-4 rounded-xl border flex flex-col items-center justify-center text-center" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                  <div className="text-xs font-semibold uppercase mb-1" style={{ color: theme.textSecondary }}>AI Recommendation</div>
                  <div className={`text-base font-bold uppercase px-3 py-1 rounded-full mt-1 ${
                    selectedAiReport.feedback?.decision === "selected" ? "bg-green-900/40 text-green-400 border border-green-500/30" :
                    selectedAiReport.feedback?.decision === "rejected" ? "bg-red-900/40 text-red-400 border border-red-500/30" :
                    "bg-yellow-900/40 text-yellow-400 border border-yellow-500/30"
                  }`}>
                    {selectedAiReport.feedback?.decision || "Pending"}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">Suggested Action</div>
                </div>

                <div className="p-4 rounded-xl border flex flex-col items-center justify-center text-center" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                  <div className="text-xs font-semibold uppercase mb-1" style={{ color: theme.textSecondary }}>Session Status</div>
                  <div className="text-sm font-semibold capitalize text-purple-300">
                    {selectedAiReport.aiInterview?.status || selectedAiReport.status}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    {selectedAiReport.aiInterview?.completedAt ? new Date(selectedAiReport.aiInterview.completedAt).toLocaleTimeString() : "Scheduled"}
                  </div>
                </div>
              </div>

              {/* 🛡️ AI Proctoring & Speech Telemetry Card */}
              {selectedAiReport.proctoring && (
                <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center justify-between" style={{ color: theme.gold }}>
                    <span>🛡️ AI Proctoring & Speech Telemetry</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-900/40 text-green-400 border border-green-500/30">
                      INTEGRITY: {selectedAiReport.proctoring.integrityScore || 100}%
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg border flex flex-col items-center justify-center text-center" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">Tab Switches</span>
                      <span className={`text-base font-extrabold mt-0.5 ${selectedAiReport.proctoring.tabSwitches > 0 ? "text-amber-400" : "text-green-400"}`}>
                        {selectedAiReport.proctoring.tabSwitches || 0}
                      </span>
                      <span className="text-[9px] text-gray-400 mt-0.5">
                        {selectedAiReport.proctoring.tabSwitches > 0 ? "Flagged Warning" : "Clean Session"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border flex flex-col items-center justify-center text-center" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">Speech Pacing</span>
                      <span className="text-base font-extrabold mt-0.5 text-blue-400">
                        {selectedAiReport.proctoring.wordsPerMinute || 125} WPM
                      </span>
                      <span className="text-[9px] text-gray-400 mt-0.5">Words Per Minute</span>
                    </div>

                    <div className="p-2.5 rounded-lg border flex flex-col items-center justify-center text-center" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">Filler Words</span>
                      <span className={`text-base font-extrabold mt-0.5 ${selectedAiReport.proctoring.fillerWordsCount > 5 ? "text-amber-400" : "text-purple-400"}`}>
                        {selectedAiReport.proctoring.fillerWordsCount || 0}
                      </span>
                      <span className="text-[9px] text-gray-400 mt-0.5">"Um/Like/Actually"</span>
                    </div>

                    <div className="p-2.5 rounded-lg border flex flex-col items-center justify-center text-center" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">Confidence Index</span>
                      <span className="text-base font-extrabold mt-0.5 text-green-400">
                        {selectedAiReport.proctoring.confidenceScore || 90}%
                      </span>
                      <span className="text-[9px] text-gray-400 mt-0.5">Voice Fluency</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Candidate Resume Profile */}
              {selectedAiReport.candidateResume && (
                <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: theme.gold }}>
                    <span>📄 Candidate Resume Highlights</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {selectedAiReport.candidateResume.technical_skills && (
                      <div className="p-2.5 rounded-lg border" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                        <strong className="text-white">Technical Skills:</strong>
                        <p className="mt-1" style={{ color: theme.textSecondary }}>{selectedAiReport.candidateResume.technical_skills}</p>
                      </div>
                    )}
                    {selectedAiReport.candidateResume.project_details && (
                      <div className="p-2.5 rounded-lg border" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                        <strong className="text-white">Projects from CV:</strong>
                        <p className="mt-1" style={{ color: theme.textSecondary }}>{selectedAiReport.candidateResume.project_details}</p>
                      </div>
                    )}
                    {selectedAiReport.candidateResume.certifications && (
                      <div className="p-2.5 rounded-lg border" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                        <strong className="text-white">Certifications:</strong>
                        <p className="mt-1" style={{ color: theme.textSecondary }}>{selectedAiReport.candidateResume.certifications}</p>
                      </div>
                    )}
                    {selectedAiReport.candidateResume.other_info && (
                      <div className="p-2.5 rounded-lg border" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                        <strong className="text-white">Education & Background:</strong>
                        <p className="mt-1" style={{ color: theme.textSecondary }}>{selectedAiReport.candidateResume.other_info}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Summary / Feedback */}
              <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: theme.gold }}>
                  <span>📋 Executive Feedback & Suggestions</span>
                </h3>
                <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap" style={{ color: theme.text }}>
                  {selectedAiReport.feedback?.comments || selectedAiReport.aiAnalysis?.feedbackAndSuggestions || "AI evaluation in progress or no response submitted yet."}
                </p>
              </div>

              {/* AI Interview Questions & Candidate Answers Breakdown */}
              {((selectedAiReport.aiInterview?.qaList && selectedAiReport.aiInterview.qaList.length > 0) || (selectedAiReport.aiInterview?.questions && selectedAiReport.aiInterview.questions.length > 0)) && (
                <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center justify-between" style={{ color: theme.gold }}>
                    <span>❓ Detailed Questions & Candidate Answers</span>
                    <span className="text-[10px] text-gray-400 font-normal">Question-by-Question AI Breakdown</span>
                  </h3>
                  <div className="space-y-3">
                    {(selectedAiReport.aiInterview.qaList && selectedAiReport.aiInterview.qaList.length > 0
                      ? selectedAiReport.aiInterview.qaList
                      : selectedAiReport.aiInterview.questions.map(q => ({ question: q, answer: "Answer recorded verbally.", score: 4, feedback: "Evaluated by AI." }))
                    ).map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border space-y-2.5" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                        {/* Question */}
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-extrabold text-purple-400 shrink-0">Q{idx + 1}:</span>
                          <span className="text-xs font-semibold" style={{ color: theme.text }}>{item.question}</span>
                        </div>

                        {/* Candidate's Actual Spoken Answer */}
                        <div className="p-2.5 rounded-lg bg-black/40 border border-gray-800 text-xs">
                          <div className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <FaMicrophone size={10} /> Candidate's Spoken Answer:
                          </div>
                          <p className="text-xs leading-relaxed italic" style={{ color: theme.text }}>
                            "{item.answer || "Verbal answer provided by candidate during the interview."}"
                          </p>
                        </div>

                        {/* AI Feedback & Score for this Question */}
                        {item.feedback && (
                          <div className="flex items-center justify-between text-[11px] pt-1 text-gray-400">
                            <span className="flex items-center gap-1 text-purple-300">
                              <span>🎯 AI Feedback:</span> {item.feedback}
                            </span>
                            {item.score && (
                              <span className="px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-500/30 font-bold shrink-0">
                                {item.score}/5
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Candidate Audio Transcript */}
              {selectedAiReport.aiAnalysis?.transcript && (
                <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: theme.textSecondary }}>
                    <FaMicrophone size={12} /> Full Audio Transcript (Groq Whisper)
                  </h3>
                  <div className="p-3 rounded-lg border max-h-48 overflow-y-auto text-xs leading-relaxed font-mono" style={{ backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.textSecondary }}>
                    {selectedAiReport.aiAnalysis.transcript}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: theme.border }}>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition hover:opacity-80"
                style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, color: theme.text }}
              >
                <span>📄 Print / Export PDF</span>
              </button>

              <button
                onClick={() => { setShowAiReportModal(false); setSelectedAiReport(null); }}
                className="px-5 py-2 text-xs font-semibold rounded-lg shadow transition hover:opacity-90"
                style={{ backgroundColor: theme.gold, color: "#000" }}
              >
                Close Report
              </button>
            </div>
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

      {/* Assign Coding Test Modal */}
      {showCodingTestModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="rounded-2xl p-6 w-full max-w-2xl shadow-2xl my-8 border" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.text }}>
                <FaCode className="text-purple-400" /> Assign Coding Assessment
              </h2>
              <button onClick={() => { setShowCodingTestModal(false); setSelectedAppForTest(null); }} className="hover:opacity-80 text-xl text-slate-400">✕</button>
            </div>
            <p className="text-xs mb-4" style={{ color: theme.textSecondary }}>
              Candidate: <strong style={{ color: theme.text }}>{selectedAppForTest?.student?.name}</strong> ({selectedAppForTest?.student?.email})
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
                <label className="block text-xs font-semibold mb-1 text-slate-300">Problem Statement / Question Description</label>
                <textarea
                  rows="4"
                  required
                  value={codingTestForm.description}
                  onChange={(e) => setCodingTestForm({ ...codingTestForm, description: e.target.value })}
                  placeholder="Describe the coding problem, input constraints, and expected logic..."
                  className="w-full rounded-xl px-3.5 py-2 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text, border: `1px solid ${theme.border}` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">Programming Language</label>
                  <div className="flex gap-2">
                  <select
                    value={codingTestForm.language}
                    onChange={(e) => setCodingTestForm({ ...codingTestForm, language: e.target.value })}
                    className="flex-1 rounded-xl px-3.5 py-2 text-xs outline-none focus:ring-1 focus:ring-purple-500 capitalize"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text, border: `1px solid ${theme.border}` }}
                  >
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="javascript">JavaScript</option>
                    <option value="c">C</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="php">PHP</option>
                    <option value="ruby">Ruby</option>
                    <option value="swift">Swift</option>
                    <option value="kotlin">Kotlin</option>
                    <option value="typescript">TypeScript</option>
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
                  <label className="block text-xs font-semibold mb-1 text-slate-300">HR Review Feedback / Notes</label>
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

      {/* Compiler preview (student view) */}
      {showCompilerPreview && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className="w-full max-w-5xl my-6">
            <div className="flex justify-between items-center mb-3 px-1">
              <div>
                <h3 className="text-lg font-bold text-white">Student Compiler Preview</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Language: <span className="text-purple-300 font-mono uppercase">{codingTestForm.language}</span>
                  {selectedAppForTest?.student?.name && (
                    <> · Candidate: <span className="text-slate-200">{selectedAppForTest.student.name}</span></>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompilerPreview(false)}
                className="text-slate-400 hover:text-white text-xl px-2"
              >
                ✕
              </button>
            </div>
            <CompilerEmbed
              language={codingTestForm.language}
              onLanguageChange={(lang) => setCodingTestForm((prev) => ({ ...prev, language: lang }))}
              title="Code Compiler"
              subtitle={codingTestForm.title || "Preview before sending assessment"}
              hrName={currentUser?.name || "HR"}
              candidateName={selectedAppForTest?.student?.name}
              iframeHeight={520}
            />
          </div>
        </div>
      )}

      {/* Profile Submission Review Modal */}
      {showSubmissionModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: theme.bgCard, borderColor: theme.border, border: '1px solid' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold" style={{ color: theme.text }}>Review Student Profile</h2>
              <button onClick={() => { setShowSubmissionModal(false); setSelectedSubmission(null); }} className="hover:opacity-80 text-xl" style={{ color: theme.textSecondary }}>✕</button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(212, 168, 67, 0.05)', border: `1px solid ${theme.border}` }}>
                {selectedSubmission.profile?.photo && (
                  <img src={selectedSubmission.profile.photo} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2" style={{ borderColor: theme.gold }} />
                )}
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: theme.text }}>{selectedSubmission.student?.name}</h3>
                  <p className="text-sm" style={{ color: theme.textSecondary }}>{selectedSubmission.student?.email}</p>
                  {selectedSubmission.profile?.headline && <p className="text-sm mt-1" style={{ color: theme.gold }}>{selectedSubmission.profile.headline}</p>}
                </div>
              </div>

              {selectedSubmission.profile?.about && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: theme.gold }}>About</p>
                  <p className="text-sm" style={{ color: theme.text }}>{selectedSubmission.profile.about}</p>
                </div>
              )}

              {selectedSubmission.profile?.skills?.length > 0 && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: theme.gold }}>Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedSubmission.profile.skills.map((skill, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(212, 168, 67, 0.15)', color: theme.gold }}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedSubmission.profile?.experiences?.length > 0 && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: theme.gold }}>Experience</p>
                  {selectedSubmission.profile.experiences.map((exp, i) => (
                    <div key={i} className="text-sm mb-1" style={{ color: theme.text }}>
                      <strong>{exp.title}</strong> at {exp.company} ({exp.startDate} - {exp.endDate || "Present"})
                    </div>
                  ))}
                </div>
              )}

              {selectedSubmission.profile?.education?.length > 0 && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: theme.gold }}>Education</p>
                  {selectedSubmission.profile.education.map((edu, i) => (
                    <div key={i} className="text-sm mb-1" style={{ color: theme.text }}>
                      <strong>{edu.school}</strong> - {edu.degree} {edu.fieldOfStudy} ({edu.startYear} - {edu.endYear})
                    </div>
                  ))}
                </div>
              )}

              {selectedSubmission.message && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: theme.gold }}>Student Message</p>
                  <p className="text-sm" style={{ color: theme.text }}>{selectedSubmission.message}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>Your Comment (optional)</label>
                <textarea
                  rows="3"
                  placeholder="Add feedback for the student..."
                  value={hrComment}
                  onChange={(e) => setHrComment(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                  style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-3 border-t" style={{ borderColor: theme.border }}>
                <button
                  onClick={() => handleSubmissionStatus(selectedSubmission._id, "rejected")}
                  className="bg-red-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-red-700 transition"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleSubmissionStatus(selectedSubmission._id, "approved")}
                  className="text-white px-4 py-2 text-sm rounded-lg transition hover:opacity-80"
                  style={{ backgroundColor: theme.gold }}
                >
                  Approve
                </button>
              </div>
            </div>
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