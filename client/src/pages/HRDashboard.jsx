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
  FaSun,
  FaMoon,
  FaBars,
  FaBell,
} from "react-icons/fa";
import DashboardSidebar from "../components/DashboardSidebar";
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

/* ═══════════════════════════════════════════════════════════════
   THEME PALETTES (JaspreetImpex: teal + navy + amber)
═══════════════════════════════════════════════════════════════ */
const T = {
  dark: {
    page: "bg-[#0a0f1e] text-slate-100",
    card: "bg-[#0f1729]/85 border-white/15",
    cardText: "text-white",
    cardSub: "text-slate-400",
    input: "bg-[#0d1225] border-slate-700/80 text-white placeholder:text-slate-500 focus:border-[#0d6e6e]",
    label: "text-slate-300",
    icon: "text-slate-400",
    divider: "border-slate-800",
    footer: "text-slate-500",
    badge: "text-[#0d6e6e]",
    featureCard: "bg-white/[0.03] border-white/10",
    featureTitle: "text-slate-200",
    featureDesc: "text-slate-400",
    link: "text-[#0d6e6e]",
    btnGold: "from-[#0d6e6e] via-[#0f7d7d] to-[#095454] text-white",
    btnGoldDisabled: "bg-[#0d6e6e]/30 text-slate-300",
    tableHead: "bg-white/[0.04]",
    tableRow: "hover:bg-white/[0.03]",
    tableBorder: "border-white/[0.06]",
    tableBorderLight: "border-white/[0.04]",
    hoverLight: "hover:bg-white/5",
    hoverTextStrong: "hover:text-white",
    surface: "bg-[#0f1729]/85 border-white/[0.08]",
    surfaceHover: "hover:border-[#0d6e6e]/20",
    textMuted: "text-white/40",
    textMutedLight: "text-white/50",
    textMutedDark: "text-white/30",
    textBright: "text-white/80",
    accentBg: "bg-[#0d6e6e]/10",
    accentText: "text-[#0d6e6e]",
    accentBorder: "border-[#0d6e6e]/30",
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
    logoBg: "bg-[#080d1a]",
    logoBorder: "border-[#0d6e6e]/30",
    logoShadow: "shadow-[0_0_30px_rgba(13,110,110,0.12)]",
    sidebarBg: "#0b1020",
    sidebarBorder: "rgba(255,255,255,0.06)",
    sidebarCard: "rgba(255,255,255,0.03)",
    sidebarMuted: "rgba(255,255,255,0.45)",
    sidebarActive: "rgba(13,110,110,0.10)",
    sidebarDanger: "#e57373",
    sidebarDangerBg: "rgba(139,26,26,0.06)",
  },
  light: {
    page: "bg-[#f4f7fa] text-[#333333]",
    card: "bg-white/90 border-[#0d6e6e]/15 shadow-xl",
    cardText: "text-[#333333]",
    cardSub: "text-[#666666]",
    input: "bg-[#f8f9fa] border-[#0d6e6e]/25 text-[#333333] placeholder:text-[#9ca3af] focus:border-[#0d6e6e]",
    label: "text-[#333333]",
    icon: "text-[#6c757d]",
    divider: "border-[#0d6e6e]/15",
    footer: "text-[#6c757d]",
    badge: "text-[#0d6e6e]",
    featureCard: "bg-[#f4f7fa]/80 border-[#0d6e6e]/12",
    featureTitle: "text-[#0f1729]",
    featureDesc: "text-[#666666]",
    link: "text-[#0d6e6e]",
    btnGold: "from-[#0d6e6e] via-[#0f7d7d] to-[#095454] text-white",
    btnGoldDisabled: "bg-[#0d6e6e]/25 text-[#6c757d]",
    tableHead: "bg-[#f4f7fa]/80",
    tableRow: "hover:bg-[#f4f7fa]/60",
    tableBorder: "border-[#0d6e6e]/12",
    tableBorderLight: "border-[#0d6e6e]/08",
    hoverLight: "hover:bg-black/5",
    hoverTextStrong: "hover:text-[#333333]",
    surface: "bg-white/80 border-[#0d6e6e]/15",
    surfaceHover: "hover:border-[#0d6e6e]/30",
    textMuted: "text-[#666666]",
    textMutedLight: "text-[#9ca3af]",
    textMutedDark: "text-[#6c757d]",
    textBright: "text-[#333333]",
    accentBg: "bg-[#0d6e6e]/10",
    accentText: "text-[#0d6e6e]",
    accentBorder: "border-[#0d6e6e]/30",
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
    logoBg: "bg-[#f4f7fa]",
    logoBorder: "border-[#0d6e6e]/25",
    logoShadow: "shadow-[0_0_20px_rgba(13,110,110,0.08)]",
    sidebarBg: "#ffffff",
    sidebarBorder: "rgba(13,110,110,0.15)",
    sidebarCard: "rgba(255,255,255,0.7)",
    sidebarMuted: "#6c757d",
    sidebarActive: "rgba(13,110,110,0.08)",
    sidebarDanger: "#8b1a1a",
    sidebarDangerBg: "rgba(139,26,26,0.05)",
  },
};

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
  const [themeMode, setThemeMode] = useState("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  // Theme colors (matching AdminDashboard T palette)
  const t = T[themeMode];
  const theme = {
    bg: themeMode === "dark" ? "#0a0f1e" : "#0d6e6e",
    bgSecondary: themeMode === "dark" ? "#0e1422" : "#ffffff",
    bgCard: themeMode === "dark" ? "#0e1422" : "#ffffff",
    border: themeMode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(197,160,89,0.2)",
    text: themeMode === "dark" ? "#f8fafc" : "#1a1510",
    textSecondary: themeMode === "dark" ? "#94a3b8" : "#6b5a3a",
    gold: "#0d6e6e",
    goldLight: "#f3e5ab",
    goldDark: "#095454",
    goldGlow: "rgba(13,110,110,0.18)",
  };
  const themeColors = {
    cardBg: themeMode === "dark" ? "rgba(14,20,34,0.85)" : "rgba(255,255,255,0.85)",
    borderColor: themeMode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
    textColor: themeMode === "dark" ? "#ffffff" : "#1a1a2e",
    textSecondaryColor: themeMode === "dark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
    textMutedColor: themeMode === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
  };

  return (
    <div className={`login-neo min-h-screen ${t.page} relative overflow-hidden font-sans transition-colors duration-500`} data-theme={themeMode}>
      {/* Ambient Glow Background */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none transition-colors duration-500"
        style={{ background: themeMode === "dark" ? "linear-gradient(to bottom right, rgba(13,110,110,0.08), rgba(139,26,26,0.08), transparent)" : "linear-gradient(to bottom right, rgba(13,110,110,0.10), rgba(139,26,26,0.05), transparent)" }} />
      <div className="absolute -bottom-40 -right-40 w-[650px] h-[650px] rounded-full blur-[150px] pointer-events-none transition-colors duration-500"
        style={{ background: themeMode === "dark" ? "linear-gradient(to top left, rgba(13,110,110,0.08), rgba(88,28,135,0.12), transparent)" : "linear-gradient(to top left, rgba(13,110,110,0.06), rgba(139,26,26,0.03), transparent)" }} />
      <div className="absolute inset-0 bg-[size:32px_32px] opacity-30 pointer-events-none"
        style={{ backgroundImage: `linear-gradient(to right, ${t.gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${t.gridLine} 1px, transparent 1px)` }} />
      <Toast toasts={toasts} remove={removeToast} />
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        items={[
          { key: "jobs", label: "Jobs", icon: FaBriefcase },
          { key: "applicants", label: "Applicants", icon: FaUsers },
          { key: "interviews", label: "Interviews", icon: FaCalendarAlt },
          { key: "coding_tests", label: "Coding Tests", icon: FaCode },
          { key: "analytics", label: "Analytics", icon: FaChartBar },
        ]}
        activeKey={activeTab}
        onSelect={(key) => { setActiveTab(key); setSidebarOpen(false); }}
        onLogout={handleLogout}
        theme={{ background: t.sidebarBg, border: t.sidebarBorder, card: t.sidebarCard, text: t.cardText, muted: t.sidebarMuted, accent: "#0d6e6e", danger: t.sidebarDanger, dangerBackground: t.sidebarDangerBg, activeBackground: t.sidebarActive }}
        userName={currentUser.name || currentUser.email || "HR User"} userRole={currentUser.role || "HR"}
      />
      <header className={`sticky top-0 z-20 backdrop-blur-xl border-b transition-colors duration-300 ${t.surface}`}>
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(true)} className={`p-2 rounded-xl border ${t.tableBorder} ${t.textMuted} ${t.hoverLight} transition-all lg:hidden`} aria-label="Open navigation">
              <FaBars size={16} />
            </button>
            <div>
              <h1 className={`text-lg font-bold ${t.cardText}`}>HR Dashboard</h1>
              <p className={`text-[11px] mt-0.5 ${t.textMutedDark}`}>CV Shortlisting & Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setThemeMode((c) => c === "dark" ? "light" : "dark")}
              className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300"
              style={{
                background: themeMode === "dark" ? "rgba(30,35,50,0.8)" : "rgba(255,255,255,0.8)",
                borderColor: themeMode === "dark" ? "rgba(13,110,110,0.3)" : "rgba(139,105,20,0.3)",
                boxShadow: themeMode === "dark" ? "0 0 20px rgba(13,110,110,0.15)" : "0 0 20px rgba(139,105,20,0.10)",
              }}
              aria-label="Toggle theme">
              {themeMode === "dark" ? <FaSun className="text-[#0d6e6e] text-sm" /> : <FaMoon className="text-[#8B6914] text-sm" />}
            </button>
            <button className={`relative p-2 rounded-xl border ${t.tableBorder} ${t.textMuted} ${t.hoverLight} transition-all`}>
              <FaBell size={15} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </div>
      </header>

      <div className={`transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-64"}`}>
      <div className="px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className={`text-lg font-bold ${t.cardText}`}>HR Dashboard</h1>
            <p className={`text-[11px] mt-0.5 ${t.textMutedDark}`}>Manage jobs, applicants & CV shortlisting</p>
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-2xl bg-gradient-to-r ${t.btnGold} hover:brightness-110 transition-all`}
          >
            <FaPlus /> Post Job
          </button>
        </div>

        {currentUser.role === "HR" && (
          <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-5 border transition-colors duration-300 mb-8`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className={`text-xs font-medium uppercase tracking-wider ${t.textMutedDark}`}>HR Subscription</p>
                <p className={`text-lg font-semibold mt-1 ${t.cardText}`}>
                  Current plan: <span className={t.accentText}>{currentUser.subscriptionPlan || "trial"}</span>
                </p>
                <p className={`text-sm mt-1 ${t.cardSub}`}>
                  {currentUser.planEndsAt ? `Valid until ${new Date(currentUser.planEndsAt).toLocaleDateString()}` : "Use trial or upgrade with Razorpay"}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <select
                  value={paymentPlan}
                  onChange={(e) => setPaymentPlan(e.target.value)}
                  className={`px-3 py-2 rounded-2xl text-sm ${t.input} border outline-none transition-all`}
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
          <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-5 border transition-colors duration-300`}>
            <p className={`text-xs font-medium uppercase tracking-wider ${t.textMutedDark}`}>Total Jobs</p>
            <p className={`text-2xl font-semibold mt-1 ${t.cardText}`}>{stats.totalJobs}</p>
          </div>
          <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-5 border transition-colors duration-300`}>
            <p className={`text-xs font-medium uppercase tracking-wider ${t.textMutedDark}`}>Total Applicants</p>
            <p className={`text-2xl font-semibold mt-1 ${t.cardText}`}>{stats.totalApplicants}</p>
          </div>
          <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-5 border transition-colors duration-300`}>
            <p className={`text-xs font-medium uppercase tracking-wider ${t.textMutedDark}`}>Shortlisted</p>
            <p className={`text-2xl font-semibold mt-1 ${t.accentText}`}>{stats.shortlisted}</p>
          </div>
          <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-5 border transition-colors duration-300`}>
            <p className={`text-xs font-medium uppercase tracking-wider ${t.textMutedDark}`}>Pending</p>
            <p className={`text-2xl font-semibold mt-1 ${t.warningText}`}>{stats.pending}</p>
          </div>
        </div>

        <div className={`flex gap-2 mb-6 border-b ${t.tableBorder}`}>
          <button 
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "jobs" ? "border-b-2" : ""}`}
            style={{ 
              color: activeTab === "jobs" ? (themeMode === "dark" ? "#ffffff" : "#1a1510") : theme.textSecondary,
              borderColor: activeTab === "jobs" ? "#0d6e6e" : 'transparent'
            }}
            onClick={() => setActiveTab("jobs")}
          >
            My Jobs
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "applicants" ? "border-b-2" : ""}`}
            style={{ 
              color: activeTab === "applicants" ? (themeMode === "dark" ? "#ffffff" : "#1a1510") : theme.textSecondary,
              borderColor: activeTab === "applicants" ? "#0d6e6e" : 'transparent'
            }}
            onClick={handleApplicantsClick}
          >
            Applicants
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "interviews" ? "border-b-2" : ""}`}
            style={{ 
              color: activeTab === "interviews" ? (themeMode === "dark" ? "#ffffff" : "#1a1510") : theme.textSecondary,
              borderColor: activeTab === "interviews" ? "#0d6e6e" : 'transparent'
            }}
            onClick={() => { setActiveTab("interviews"); fetchHRInterviews(); }}
          >
            My Interviews
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "coding_tests" ? "border-b-2" : ""}`}
            style={{ 
              color: activeTab === "coding_tests" ? (themeMode === "dark" ? "#ffffff" : "#1a1510") : theme.textSecondary,
              borderColor: activeTab === "coding_tests" ? "#0d6e6e" : 'transparent'
            }}
            onClick={() => { setActiveTab("coding_tests"); fetchHRCodingTests(); }}
          >
            <FaCode className="inline mr-1" /> Coding Tests
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "analytics" ? "border-b-2" : ""}`}
            style={{ 
              color: activeTab === "analytics" ? (themeMode === "dark" ? "#ffffff" : "#1a1510") : theme.textSecondary,
              borderColor: activeTab === "analytics" ? "#0d6e6e" : 'transparent'
            }}
            onClick={() => { setActiveTab("analytics"); fetchAnalytics(); }}
          >
            <FaChartBar className="inline mr-1" /> Analytics
          </button>
        </div>

        {activeTab === "jobs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div key={job._id} className={`${t.surface} backdrop-blur-2xl rounded-3xl p-5 border transition-colors duration-300 hover:${t.surfaceHover}`}>
                <h3 className={`text-lg font-bold ${t.cardText}`}>{job.title}</h3>
                <p className={`text-sm mt-1 ${t.cardSub}`}>{job.location}</p>
                <p className={`text-sm mt-2 line-clamp-2 ${t.cardSub}`}>{job.description}</p>
                <div className="flex justify-between items-center mt-4">
                  <button onClick={() => fetchApplicants(job._id)} className={`text-sm hover:underline flex items-center gap-1 ${t.link}`}>
                    <FaEye size={14} /> View Applicants
                  </button>
                  <button onClick={() => handleDeleteJob(job._id)} className={`${t.dangerText} hover:text-red-400 transition p-1.5 ${t.dangerBg} rounded-xl`}>
                    <FaTrash size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "applicants" && (
          <div className={`${t.surface} backdrop-blur-2xl rounded-3xl overflow-hidden border transition-colors duration-300`}>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead><tr className={`border-b ${t.tableBorder}`}>
                  {["Student","Email","Status","Resume","Actions"].map((h) => <th key={h} className={`px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider ${t.textMutedDark}`}>{h}</th>)}
                </tr></thead>
                <tbody className={`divide-y ${t.tableBorderLight}`}>
                  {applications.map((app) => (
                    <tr key={app._id} className={`${t.tableRow} transition-colors`}>
                      <td className={`px-6 py-4 text-sm font-medium ${t.textBright}`}>{app.student?.name || "Unknown"}</td>
                      <td className={`px-6 py-4 text-sm ${t.textMuted}`}>{app.student?.email || ""}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[11px] px-2.5 py-1 rounded-lg font-medium ${
                          app.status === "shortlisted" ? `${t.accentBg} ${t.accentText}` : 
                          app.status === "rejected" ? `${t.dangerBg} ${t.dangerText}` : 
                          `${t.featureCard} ${t.textMuted}`
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
                          className={`${t.accentText} font-medium hover:underline text-xs flex items-center gap-1.5`}
                        >
                          <FaFileAlt size={11} /> View
                        </button>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => {
                              const sub = profileSubmissions.find(s => s.student?._id === app.student?._id);
                              if (sub) {
                                setSelectedSubmission(sub);
                                setHrComment("");
                                setShowSubmissionModal(true);
                              }
                            }}
                            className={`${t.accentBg} ${t.accentText} px-3 py-1.5 rounded-xl hover:brightness-110 transition text-xs font-medium flex items-center gap-1`}
                            style={{ opacity: profileSubmissions.some(s => s.student?._id === app.student?._id) ? 1 : 0.4 }}
                          >
                            <FaEye size={12} /> View Profile
                          </button>

                          {["shortlisted", "coding_test_passed"].includes(app.status) && (
                            <button onClick={() => openInterviewModal(app)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r ${t.btnGold} hover:brightness-110 transition`}>
                              <FaCalendarAlt size={12} /> Schedule Interview
                            </button>
                          )}

                          <button
                            onClick={() => openCodingTestModal(app)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r ${t.btnGold} hover:brightness-110 transition`}
                          >
                            <FaCode size={12} /> Assign Coding Test
                          </button>

                          {app.status !== "shortlisted" && (
                            <button onClick={() => handleStatusUpdate(app._id, "shortlisted")} className={`${t.accentBg} ${t.accentText} px-3 py-1.5 rounded-xl hover:brightness-110 transition text-xs font-medium disabled:opacity-30`} disabled={app.status === "shortlisted"}>
                              Shortlist
                            </button>
                          )}

                          <button onClick={() => handleStatusUpdate(app._id, "rejected")} className={`${t.dangerBg} ${t.dangerText} px-3 py-1.5 rounded-xl ${t.dangerHover} transition text-xs font-medium disabled:opacity-30`} disabled={app.status === "rejected"}>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "interviews" && (
          <div className={`${t.surface} backdrop-blur-2xl rounded-3xl overflow-hidden border transition-colors duration-300`}>
            <div className={`flex justify-between items-center p-4 border-b ${t.tableBorder}`}>
              <h2 className={`text-lg font-bold ${t.cardText}`}>Scheduled Interviews</h2>
              <button onClick={fetchHRInterviews} className={`transition ${t.textMuted} ${t.hoverLight} p-2 rounded-xl`}>
                <FaSync />
              </button>
            </div>
            {loadingInterviews ? (
              <div className={`p-8 text-center ${t.textMuted}`}>Loading...</div>
            ) : hrInterviews.length === 0 ? (
              <div className={`p-8 text-center ${t.textMuted}`}>No interviews scheduled yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead><tr className={`border-b ${t.tableBorder}`}>
                    {["Job","Candidate","Mode","Date & Time","Status","Actions"].map((h) => <th key={h} className={`px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider ${t.textMutedDark}`}>{h}</th>)}
                  </tr></thead>
                  <tbody className={`divide-y ${t.tableBorderLight}`}>
                    {hrInterviews.map((iv) => {
                      const status = iv.status?.toLowerCase ? iv.status.toLowerCase() : iv.status;
                      const isAi = iv.interviewMode === "ai";
                      return (
                        <tr key={iv._id} className={`${t.tableRow} transition-colors`}>
                          <td className={`px-6 py-4 text-sm font-medium ${t.textBright}`}>{iv.job?.title || "Unknown"}</td>
                          <td className={`px-6 py-4 text-sm ${t.textBright}`}>{iv.application?.student?.name || "Unknown"}</td>
                          <td className="px-6 py-4 text-sm">
                            {isAi ? (
                              <span className="text-[11px] px-2.5 py-1 rounded-lg font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 inline-flex items-center gap-1.5">
                                <FaRobot size={11} /> AI Voice
                              </span>
                            ) : (
                              <span className="text-[11px] px-2.5 py-1 rounded-lg font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1.5">
                                <FaVideo size={11} /> Human Video
                              </span>
                            )}
                          </td>
                          <td className={`px-6 py-4 text-sm ${t.textMuted}`}>{new Date(iv.scheduledAt).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[11px] px-2.5 py-1 rounded-lg font-medium ${
                              status === "completed" ? `${t.successBg} ${t.successText}` : 
                              status === "cancelled" ? `${t.dangerBg} ${t.dangerText}` : 
                              `${t.warningBg} ${t.warningText}`
                            }`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {isAi ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleViewAiReport(iv)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r ${t.btnGold} hover:brightness-110 transition`}
                                >
                                  <FaRobot size={12} /> View AI Report
                                </button>
                                {status === "scheduled" && (
                                  <button onClick={() => handleUpdateInterviewStatus(iv._id, "cancelled")} className={`${t.dangerBg} ${t.dangerText} px-2.5 py-1 rounded-xl ${t.dangerHover} transition text-xs font-medium`}>
                                    Cancel
                                  </button>
                                )}
                              </div>
                            ) : (
                              status === "scheduled" && (
                                <>
                                  <button onClick={() => handleUpdateInterviewStatus(iv._id, "completed")} className={`${t.accentBg} ${t.accentText} px-3 py-1.5 rounded-xl hover:brightness-110 transition text-xs font-medium mr-2`}>
                                    Complete
                                  </button>
                                  <button onClick={() => handleUpdateInterviewStatus(iv._id, "cancelled")} className={`${t.dangerBg} ${t.dangerText} px-3 py-1.5 rounded-xl ${t.dangerHover} transition text-xs font-medium`}>
                                    Cancel
                                  </button>
                                  {!iv.callActive ? (
                                    <button
                                      onClick={() => handleStartInterviewCall(iv)}
                                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r ${t.btnGold} hover:brightness-110 transition ml-2`}
                                    >
                                      <FaVideo size={12} /> Start Call
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => setVideoCallRoom(iv._id)}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r ${t.btnGold} hover:brightness-110 transition ml-2`}
                                      >
                                        <FaVideo size={12} /> Join Call
                                      </button>
                                      <button
                                        onClick={() => handleStopInterviewCall(iv)}
                                        className={`${t.dangerBg} ${t.dangerText} px-3 py-1.5 rounded-xl ${t.dangerHover} transition text-xs font-medium ml-2`}
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
                                className="text-[#0f1729] px-3 py-1 rounded mr-2 hover:opacity-80 transition text-xs flex items-center gap-1 inline-flex bg-gradient-to-r from-[#0d6e6e] via-[#0f7d7d] to-[#095454]"
                                style={{ backgroundColor: "#0d6e6e" }}
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
          <div className={`${t.surface} backdrop-blur-2xl rounded-3xl overflow-hidden border transition-colors duration-300`}>
            <div className={`flex justify-between items-center p-4 border-b ${t.tableBorder}`}>
              <h2 className={`text-lg font-bold ${t.cardText}`}>Assigned Coding Assessments</h2>
              <button onClick={fetchHRCodingTests} className={`transition ${t.textMuted} ${t.hoverLight} p-2 rounded-xl`}>
                <FaSync />
              </button>
            </div>
            {loadingCodingTests ? (
              <div className={`p-8 text-center ${t.textMuted}`}>Loading coding assessments...</div>
            ) : codingTests.length === 0 ? (
              <div className={`p-8 text-center ${t.textMuted}`}>No coding tests assigned yet. Click "Assign Coding Test" under Applicants to send a test.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead><tr className={`border-b ${t.tableBorder}`}>
                    {["Job","Candidate","Test Title & Language","Duration","Status","Verdict","Actions"].map((h) => <th key={h} className={`px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider ${t.textMutedDark}`}>{h}</th>)}
                  </tr></thead>
                  <tbody className={`divide-y ${t.tableBorderLight}`}>
                    {codingTests.map((ct) => (
                      <tr key={ct._id} className={`${t.tableRow} transition-colors`}>
                        <td className={`px-6 py-4 text-sm font-medium ${t.textBright}`}>{ct.job?.title || "Role"}</td>
                        <td className={`px-6 py-4 text-sm ${t.textBright}`}>
                          {ct.student?.name || "Candidate"}
                          <div className={`text-xs ${t.textMuted}`}>{ct.student?.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className={`font-semibold ${t.textBright}`}>{ct.title}</div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase font-mono mt-1 inline-block">
                            {ct.language}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm ${t.textMuted}`}>{ct.durationMinutes} mins</td>
                        <td className="px-6 py-4">
                          <span className={`text-[11px] px-2.5 py-1 rounded-lg font-medium ${
                            ct.status === "submitted" ? `${t.infoBg} ${t.infoText}` :
                            ct.status === "reviewed" ? `${t.successBg} ${t.successText}` :
                            ct.status === "in_progress" ? `${t.warningBg} ${t.warningText} animate-pulse` :
                            `${t.featureCard} ${t.textMuted}`
                          }`}>
                            {ct.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {ct.verdict ? (
                            <span className={`text-[11px] px-2.5 py-1 rounded-lg font-bold uppercase ${
                              ct.verdict === "passed" ? `${t.successBg} ${t.successText}` :
                              `${t.dangerBg} ${t.dangerText}`
                            }`}>
                              {ct.verdict}
                            </span>
                          ) : (
                            <span className={`text-xs ${t.textMuted}`}>Pending Review</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => openReviewModal(ct)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r ${t.btnGold} hover:brightness-110 transition`}
                            >
                              <FaEye size={12} /> Review Code
                            </button>
                            <button
                              onClick={() => { setProctoringTest(ct); setShowProctoringViewer(true); }}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r ${ct.status === "in_progress" ? "from-emerald-500 to-emerald-600" : "from-blue-500 to-blue-600"} text-white hover:brightness-110 transition`}
                              title={ct.status === "in_progress" ? "Watch live camera" : "View captured snapshots"}
                            >
                              📷 {ct.status === "in_progress" ? "🔴 Live" : `Snaps (${(ct.proctorSnapshots || []).length})`}
                            </button>
                          </div>
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
                  <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-4 border transition-colors duration-300`}>
                    <p className={`text-xs font-medium ${t.textMutedDark}`}>Total Jobs</p>
                    <p className={`text-2xl font-semibold ${t.cardText}`}>{analyticsData.totalJobs}</p>
                  </div>
                  <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-4 border transition-colors duration-300`}>
                    <p className={`text-xs font-medium ${t.textMutedDark}`}>Applications</p>
                    <p className={`text-2xl font-semibold ${t.cardText}`}>{analyticsData.totalApplications}</p>
                  </div>
                  <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-4 border transition-colors duration-300`}>
                    <p className={`text-xs font-medium ${t.textMutedDark}`}>Shortlisted</p>
                    <p className={`text-2xl font-semibold ${t.accentText}`}>{analyticsData.shortlisted}</p>
                  </div>
                  <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-4 border transition-colors duration-300`}>
                    <p className={`text-xs font-medium ${t.textMutedDark}`}>Rejected</p>
                    <p className={`text-2xl font-semibold ${t.dangerText}`}>{analyticsData.rejected}</p>
                  </div>
                  <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-4 border transition-colors duration-300`}>
                    <p className={`text-xs font-medium ${t.textMutedDark}`}>Shortlist Rate</p>
                    <p className={`text-2xl font-semibold ${t.accentText}`}>{analyticsData.shortlistRate}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-4 border transition-colors duration-300`}>
                    <h3 className={`text-sm font-bold mb-4 ${t.cardText}`}>Applications per Job</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.appsPerJob}>
                        <CartesianGrid strokeDasharray="3 3" stroke={themeMode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(197,160,89,0.15)"} />
                        <XAxis dataKey="title" tick={{ fontSize: 10, fill: themeMode === "dark" ? "#94a3b8" : "#6b5a3a" }} />
                        <YAxis tick={{ fill: themeMode === "dark" ? "#94a3b8" : "#6b5a3a" }} />
                        <Tooltip contentStyle={{ backgroundColor: themeMode === "dark" ? "#0e1422" : "#ffffff", borderColor: themeMode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(197,160,89,0.2)", color: themeMode === "dark" ? "#ffffff" : "#1a1510" }} />
                        <Legend wrapperStyle={{ color: themeMode === "dark" ? "#ffffff" : "#1a1510" }} />
                        <Bar dataKey="applications" fill="#0d6e6e" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-4 border transition-colors duration-300`}>
                    <h3 className={`text-sm font-bold mb-4 ${t.cardText}`}>Status Distribution</h3>
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
                          <Cell fill="#0d6e6e" />
                          <Cell fill="#ef4444" />
                          <Cell fill="#f59e0b" />
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: themeMode === "dark" ? "#0e1422" : "#ffffff", borderColor: themeMode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(197,160,89,0.2)", color: themeMode === "dark" ? "#ffffff" : "#1a1510" }} />
                        <Legend wrapperStyle={{ color: themeMode === "dark" ? "#ffffff" : "#1a1510" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={`${t.surface} backdrop-blur-2xl rounded-3xl p-4 border transition-colors duration-300 mt-6`}>
                  <h3 className={`text-sm font-bold mb-4 ${t.cardText}`}>Recent Applications</h3>
                  <ul className={`divide-y ${t.tableBorderLight}`}>
                    {analyticsData.recentApps && analyticsData.recentApps.map((app) => (
                      <li key={app._id} className="py-2 text-sm">
                        <span className={`font-medium ${t.textBright}`}>{app.student?.name || "Unknown"}</span> applied to <span className={`font-medium ${t.accentText}`}>{app.job?.title || "Job"}</span>
                        <span className={`text-xs ml-2 ${t.textMuted}`}>{new Date(app.createdAt).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className={`text-center py-12 ${t.textMuted}`}>No analytics data available.</div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Resume Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${t.card} backdrop-blur-2xl rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl transition-colors duration-300`}>

            {/* Header */}
            <div className={`flex justify-between items-center p-5 border-b ${t.tableBorder}`}>
              <div>
                <h2 className={`text-lg font-bold flex items-center gap-2 ${t.cardText}`}>
                  <FaFileAlt className={t.accentText} /> Resume Details
                </h2>
                {resumeJobCtx.title && (
                  <p className={`text-xs mt-0.5 ${t.cardSub}`}>Job: {resumeJobCtx.title}</p>
                )}
              </div>
              <button
                onClick={() => { setShowResumeModal(false); setSelectedResume(null); setAiInterviewQs([]); }}
                className={`${t.textMuted} hover:text-white text-xl transition`}
              >✕</button>
            </div>

            <div className="p-5">
              {loadingResume ? (
                <p className={`text-center py-8 ${t.textMuted}`}>Loading resume…</p>
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
                      <div key={label} className={`${t.featureCard} rounded-xl p-3 border`}>
                        <div className={`text-xs font-semibold mb-1 ${t.accentText}`}>{label}</div>
                        <div className={`text-xs ${t.cardText}`}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {selectedResume.extractedData?.project_details && selectedResume.extractedData.project_details !== "Not found" && (
                    <div className={`${t.featureCard} rounded-xl p-3 mb-5 border`}>
                      <div className={`text-xs font-semibold mb-1 ${t.accentText}`}>🗂 Projects</div>
                      <div className={`text-xs ${t.cardText}`}>{selectedResume.extractedData.project_details}</div>
                    </div>
                  )}

                  {/* AI Interview Questions Button */}
                  <div className={`border-t pt-4 ${t.tableBorder}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className={`text-sm font-bold ${t.cardText}`}>🤖 AI Interview Questions</p>
                        <p className={`text-xs ${t.cardSub}`}>Generated from CV + Job profile via Groq AI</p>
                      </div>
                      <button
                        onClick={generateInterviewQs}
                        disabled={loadingAiQs}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition bg-gradient-to-r ${t.btnGold} hover:brightness-110 disabled:opacity-50`}
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
                              <span className="text-xs font-black rounded-full w-6 h-6 flex items-center justify-center shrink-0" style={{ background: "#0d6e6e", color: "#000" }}>{q.no || i + 1}</span>
                              <div className="flex-1">
                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold mr-2" style={{
                                  background: q.type === "Technical" ? "#1e3a5f" : q.type === "Behavioral" ? "#1a3a1a" : "#3a1a3a",
                                  color: q.type === "Technical" ? "#60a5fa" : q.type === "Behavioral" ? "#4ade80" : "#c084fc",
                                }}>{q.type}</span>
                                <p className="text-sm font-semibold mt-1" style={{ color: theme.text }}>{q.question}</p>
                              </div>
                            </div>
                            <div className="p-3" style={{ background: themeColors.cardBg }}>
                              <p className="text-xs font-semibold mb-1" style={{ color: "#0d6e6e" }}>✅ Model Answer</p>
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
                    className="p-3 rounded-xl border text-left transition flex items-center gap-2.5"
                    style={{
                      borderColor: interviewData.interviewMode === "human" ? "rgba(245,158,11,0.5)" : themeColors.borderColor,
                      backgroundColor: interviewData.interviewMode === "human" ? "rgba(245,158,11,0.1)" : "rgba(0,0,0,0.15)",
                      color: themeColors.textColor,
                    }}
                  >
                    <div className="p-2 rounded-lg bg-blue-900/30 text-blue-400">
                      <FaVideo size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold" style={{ color: themeColors.textColor }}>Human Interview</div>
                      <div className="text-[10px]" style={{ color: themeColors.textSecondaryColor }}>Live 1-on-1 Video Call</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInterviewData({ ...interviewData, interviewMode: "ai" })}
                    className="p-3 rounded-xl border text-left transition flex items-center gap-2.5"
                    style={{
                      borderColor: interviewData.interviewMode === "ai" ? "rgba(168,85,247,0.5)" : themeColors.borderColor,
                      backgroundColor: interviewData.interviewMode === "ai" ? "rgba(168,85,247,0.15)" : "rgba(0,0,0,0.15)",
                      color: themeColors.textColor,
                    }}
                  >
                    <div className="p-2 rounded-lg bg-purple-900/40 text-purple-300">
                      <FaRobot size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1" style={{ color: themeColors.textColor }}>
                        AI Interview
                        <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500 text-black font-extrabold">NEW</span>
                      </div>
                      <div className="text-[10px]" style={{ color: themeColors.textSecondaryColor }}>Groq Voice & Evaluation</div>
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
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d6e6e]/50"
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
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d6e6e]/50"
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
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d6e6e]/50"
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
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d6e6e]/50"
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
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d6e6e]/50"
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
                <button type="submit" className="text-[#0f1729] px-4 py-2 text-sm rounded-lg transition font-semibold bg-gradient-to-r from-[#0d6e6e] via-[#0f7d7d] to-[#095454]">
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
                  <div className="text-3xl font-extrabold" style={{ color: "#0d6e6e" }}>
                    {selectedAiReport.feedback?.rating ? `${selectedAiReport.feedback.rating}/5` : "Pending"}
                  </div>
                  <div className="text-[11px] mt-1" style={{ color: themeColors.textSecondaryColor }}>AI Evaluated</div>
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
                  <div className="text-[11px] mt-1" style={{ color: themeColors.textSecondaryColor }}>Suggested Action</div>
                </div>

                <div className="p-4 rounded-xl border flex flex-col items-center justify-center text-center" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                  <div className="text-xs font-semibold uppercase mb-1" style={{ color: theme.textSecondary }}>Session Status</div>
                  <div className="text-sm font-semibold capitalize text-purple-300">
                    {selectedAiReport.aiInterview?.status || selectedAiReport.status}
                  </div>
                  <div className="text-[11px] mt-1" style={{ color: themeColors.textSecondaryColor }}>
                    {selectedAiReport.aiInterview?.completedAt ? new Date(selectedAiReport.aiInterview.completedAt).toLocaleTimeString() : "Scheduled"}
                  </div>
                </div>
              </div>

              {/* 🛡️ AI Proctoring & Speech Telemetry Card */}
              {selectedAiReport.proctoring && (
                <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center justify-between" style={{ color: "#0d6e6e" }}>
                    <span>🛡️ AI Proctoring & Speech Telemetry</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-900/40 text-green-400 border border-green-500/30">
                      INTEGRITY: {selectedAiReport.proctoring.integrityScore || 100}%
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg border flex flex-col items-center justify-center text-center" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                      <span className="text-[10px] font-semibold uppercase" style={{ color: themeColors.textSecondaryColor }}>Tab Switches</span>
                      <span className={`text-base font-extrabold mt-0.5 ${selectedAiReport.proctoring.tabSwitches > 0 ? "text-amber-400" : "text-green-400"}`}>
                        {selectedAiReport.proctoring.tabSwitches || 0}
                      </span>
                      <span className="text-[9px] mt-0.5" style={{ color: themeColors.textSecondaryColor }}>
                        {selectedAiReport.proctoring.tabSwitches > 0 ? "Flagged Warning" : "Clean Session"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border flex flex-col items-center justify-center text-center" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                      <span className="text-[10px] font-semibold uppercase" style={{ color: themeColors.textSecondaryColor }}>Speech Pacing</span>
                      <span className="text-base font-extrabold mt-0.5 text-blue-400">
                        {selectedAiReport.proctoring.wordsPerMinute || 125} WPM
                      </span>
                      <span className="text-[9px] mt-0.5" style={{ color: themeColors.textSecondaryColor }}>Words Per Minute</span>
                    </div>

                    <div className="p-2.5 rounded-lg border flex flex-col items-center justify-center text-center" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                      <span className="text-[10px] font-semibold uppercase" style={{ color: themeColors.textSecondaryColor }}>Filler Words</span>
                      <span className={`text-base font-extrabold mt-0.5 ${selectedAiReport.proctoring.fillerWordsCount > 5 ? "text-amber-400" : "text-purple-400"}`}>
                        {selectedAiReport.proctoring.fillerWordsCount || 0}
                      </span>
                      <span className="text-[9px] mt-0.5" style={{ color: themeColors.textSecondaryColor }}>"Um/Like/Actually"</span>
                    </div>

                    <div className="p-2.5 rounded-lg border flex flex-col items-center justify-center text-center" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                      <span className="text-[10px] font-semibold uppercase" style={{ color: themeColors.textSecondaryColor }}>Confidence Index</span>
                      <span className="text-base font-extrabold mt-0.5 text-green-400">
                        {selectedAiReport.proctoring.confidenceScore || 90}%
                      </span>
                      <span className="text-[9px] mt-0.5" style={{ color: themeColors.textSecondaryColor }}>Voice Fluency</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Candidate Resume Profile */}
              {selectedAiReport.candidateResume && (
                <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#0d6e6e" }}>
                    <span>📄 Candidate Resume Highlights</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {selectedAiReport.candidateResume.technical_skills && (
                      <div className="p-2.5 rounded-lg border" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                        <strong style={{ color: themeColors.textColor }}>Technical Skills:</strong>
                        <p className="mt-1" style={{ color: theme.textSecondary }}>{selectedAiReport.candidateResume.technical_skills}</p>
                      </div>
                    )}
                    {selectedAiReport.candidateResume.project_details && (
                      <div className="p-2.5 rounded-lg border" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                        <strong style={{ color: themeColors.textColor }}>Projects from CV:</strong>
                        <p className="mt-1" style={{ color: theme.textSecondary }}>{selectedAiReport.candidateResume.project_details}</p>
                      </div>
                    )}
                    {selectedAiReport.candidateResume.certifications && (
                      <div className="p-2.5 rounded-lg border" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                        <strong style={{ color: themeColors.textColor }}>Certifications:</strong>
                        <p className="mt-1" style={{ color: theme.textSecondary }}>{selectedAiReport.candidateResume.certifications}</p>
                      </div>
                    )}
                    {selectedAiReport.candidateResume.other_info && (
                      <div className="p-2.5 rounded-lg border" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                        <strong style={{ color: themeColors.textColor }}>Education & Background:</strong>
                        <p className="mt-1" style={{ color: theme.textSecondary }}>{selectedAiReport.candidateResume.other_info}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Summary / Feedback */}
              <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#0d6e6e" }}>
                  <span>📋 Executive Feedback & Suggestions</span>
                </h3>
                <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap" style={{ color: theme.text }}>
                  {selectedAiReport.feedback?.comments || selectedAiReport.aiAnalysis?.feedbackAndSuggestions || "AI evaluation in progress or no response submitted yet."}
                </p>
              </div>

              {/* AI Interview Questions & Candidate Answers Breakdown */}
              {((selectedAiReport.aiInterview?.qaList && selectedAiReport.aiInterview.qaList.length > 0) || (selectedAiReport.aiInterview?.questions && selectedAiReport.aiInterview.questions.length > 0)) && (
                <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center justify-between" style={{ color: "#0d6e6e" }}>
                    <span>❓ Detailed Questions & Candidate Answers</span>
                    <span className="text-[10px] font-normal" style={{ color: themeColors.textSecondaryColor }}>Question-by-Question AI Breakdown</span>
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
                        <div className="p-2.5 rounded-lg bg-black/40 border text-xs" style={{ borderColor: themeColors.borderColor }}>
                          <div className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <FaMicrophone size={10} /> Candidate's Spoken Answer:
                          </div>
                          <p className="text-xs leading-relaxed italic" style={{ color: theme.text }}>
                            "{item.answer || "Verbal answer provided by candidate during the interview."}"
                          </p>
                        </div>

                        {/* AI Feedback & Score for this Question */}
                        {item.feedback && (
                          <div className="flex items-center justify-between text-[11px] pt-1" style={{ color: themeColors.textSecondaryColor }}>
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
                style={{ backgroundColor: "#0d6e6e", color: "#000" }}
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
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d6e6e]/50"
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
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d6e6e]/50"
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
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d6e6e]/50"
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
                <button type="submit" className="text-[#0f1729] px-4 py-2 text-sm rounded-lg transition bg-gradient-to-r from-[#0d6e6e] via-[#0f7d7d] to-[#095454]">
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
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d6e6e]/50"
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
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d6e6e]/50"
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
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d6e6e]/50"
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
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d6e6e]/50"
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
                <button type="submit" className="text-[#0f1729] px-4 py-2 text-sm rounded-lg transition bg-gradient-to-r from-[#0d6e6e] via-[#0f7d7d] to-[#095454]">
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
              <button onClick={() => { setShowCodingTestModal(false); setSelectedAppForTest(null); }} className="hover:opacity-80 text-xl" style={{ color: themeColors.textSecondaryColor }}>✕</button>
            </div>
            <p className="text-xs mb-4" style={{ color: theme.textSecondary }}>
              Candidate: <strong style={{ color: theme.text }}>{selectedAppForTest?.student?.name}</strong> ({selectedAppForTest?.student?.email})
            </p>

            <form onSubmit={handleCreateCodingTest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: themeColors.textColor }}>Assessment Title</label>
                <input
                  type="text"
                  required
                  value={codingTestForm.title}
                  onChange={(e) => setCodingTestForm({ ...codingTestForm, title: e.target.value })}
                  className="w-full rounded-xl px-3.5 py-2 text-xs outline-none focus:ring-1 focus:ring-[#0d6e6e]/50"
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text, border: `1px solid ${theme.border}` }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: themeColors.textColor }}>Problem Statement / Question Description</label>
                <textarea
                  rows="4"
                  required
                  value={codingTestForm.description}
                  onChange={(e) => setCodingTestForm({ ...codingTestForm, description: e.target.value })}
                  placeholder="Describe the coding problem, input constraints, and expected logic..."
                  className="w-full rounded-xl px-3.5 py-2 text-xs outline-none focus:ring-1 focus:ring-[#0d6e6e]/50"
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text, border: `1px solid ${theme.border}` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: themeColors.textColor }}>Programming Language</label>
                  <div className="flex gap-2">
                  <select
                    value={codingTestForm.language}
                    onChange={(e) => setCodingTestForm({ ...codingTestForm, language: e.target.value })}
                    className="flex-1 rounded-xl px-3.5 py-2 text-xs outline-none focus:ring-1 focus:ring-[#0d6e6e]/50 capitalize"
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
                    className="shrink-0 px-3 py-2 text-xs font-semibold rounded-xl text-[#0f1729] bg-gradient-to-r from-[#0d6e6e] via-[#0f7d7d] to-[#095454] hover:opacity-80 transition whitespace-nowrap"
                    title="Preview student compiler"
                  >
                    Preview IDE
                  </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: themeColors.textColor }}>Timer Limit (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    required
                    value={codingTestForm.durationMinutes}
                    onChange={(e) => setCodingTestForm({ ...codingTestForm, durationMinutes: parseInt(e.target.value) || 30 })}
                    className="w-full rounded-xl px-3.5 py-2 text-xs outline-none focus:ring-1 focus:ring-[#0d6e6e]/50"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text, border: `1px solid ${theme.border}` }}
                  />
                </div>
              </div>

              {/* TEST CASES MANAGEMENT */}
              <div className="border pt-3 p-3.5 rounded-xl space-y-3" style={{ borderColor: theme.border, backgroundColor: themeColors.cardBg }}>
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
                      <span className="text-[11px] font-semibold" style={{ color: themeColors.textSecondaryColor }}>Test Case #{idx + 1}</span>
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
                        className="rounded-lg px-2.5 py-1.5 text-xs bg-black/40 border"
                        style={{ borderColor: themeColors.borderColor, color: themeColors.textColor }}
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
                        className="rounded-lg px-2.5 py-1.5 text-xs bg-black/40 border"
                        style={{ borderColor: themeColors.borderColor, color: themeColors.textColor }}
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
                  className="px-5 py-2 text-xs font-semibold rounded-xl text-[#0f1729] bg-gradient-to-r from-[#0d6e6e] via-[#0f7d7d] to-[#095454] hover:opacity-80 transition"
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
              <button onClick={() => { setShowReviewModal(false); setSelectedTestForReview(null); }} className="hover:opacity-80 text-xl" style={{ color: themeColors.textSecondaryColor }}>✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-black/30 p-3 rounded-xl border" style={{ borderColor: themeColors.borderColor }}>
                <div>
                  <span className="block" style={{ color: themeColors.textSecondaryColor }}>Candidate:</span>
                  <span className="font-semibold text-sm" style={{ color: themeColors.textColor }}>{selectedTestForReview?.student?.name}</span>
                  <span className="block" style={{ color: themeColors.textSecondaryColor }}>{selectedTestForReview?.student?.email}</span>
                </div>
                <div>
                  <span className="block" style={{ color: themeColors.textSecondaryColor }}>Assessment:</span>
                  <span className="font-semibold text-sm" style={{ color: themeColors.textColor }}>{selectedTestForReview?.title}</span>
                  <span className="block text-purple-300 uppercase font-mono">{selectedTestForReview?.language}</span>
                </div>
              </div>

              {/* SUBMITTED CODE DISPLAY */}
              <div>
                <label className="block text-xs font-bold text-emerald-400 mb-1">Candidate's Submitted Code Solution:</label>
                {selectedTestForReview?.submittedCode ? (
                  <pre className="p-4 rounded-xl bg-[#0d0d18] border text-emerald-300 font-mono text-xs overflow-x-auto max-h-64 whitespace-pre-wrap" style={{ borderColor: themeColors.borderColor }}>
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
                  <span className="block font-semibold" style={{ color: themeColors.textSecondaryColor }}>Candidate Notes:</span>
                  <p className="p-2.5 rounded-lg bg-black/30" style={{ color: themeColors.textColor }}>{selectedTestForReview.submissionNotes}</p>
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
                        <span style={{ color: themeColors.textSecondaryColor }}>{item.label}:</span>
                        <span className="font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  {selectedTestForReview.sessionDuration && (
                    <div className="px-3 py-1.5 bg-black/20 text-[10px] border-t" style={{ color: themeColors.textSecondaryColor, borderColor: themeColors.borderColor }}>
                      Session Duration: {Math.floor(selectedTestForReview.sessionDuration / 60)}m {selectedTestForReview.sessionDuration % 60}s
                      {selectedTestForReview.ipAddress && <> · IP: {selectedTestForReview.ipAddress}</>}
                    </div>
                  )}
                  {selectedTestForReview.browserFingerprint?.userAgent && (
                    <div className="px-3 py-1.5 bg-black/20 text-[10px] border-t truncate" style={{ color: themeColors.textSecondaryColor, borderColor: themeColors.borderColor }}>
                      Browser: {selectedTestForReview.browserFingerprint.userAgent.substring(0, 100)}...
                    </div>
                  )}
                </div>
              )}

              {/* HR REVIEW FORM */}
              <form onSubmit={handleReviewCodingTest} className="space-y-4 pt-3 border-t" style={{ borderColor: themeColors.borderColor }}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: themeColors.textColor }}>Score (0 - 100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={reviewFormData.score}
                      onChange={(e) => setReviewFormData({ ...reviewFormData, score: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl px-3 py-2 text-xs outline-none bg-black/40 border"
                      style={{ borderColor: themeColors.borderColor, color: themeColors.textColor }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: themeColors.textColor }}>Verdict & Shortlist Action</label>
                    <select
                      value={reviewFormData.verdict}
                      onChange={(e) => setReviewFormData({ ...reviewFormData, verdict: e.target.value })}
                      className="w-full rounded-xl px-3 py-2 text-xs outline-none bg-black/40 border font-semibold"
                      style={{ borderColor: themeColors.borderColor, color: themeColors.textColor }}
                    >
                      <option value="passed">✅ PASSED (Shortlist for Interview)</option>
                      <option value="failed">❌ FAILED</option>
                      <option value="resubmit">🔄 Request Resubmission</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: themeColors.textColor }}>HR Review Feedback / Notes</label>
                  <textarea
                    rows="3"
                    placeholder="Feedback comments for candidate performance..."
                    value={reviewFormData.hrFeedback}
                    onChange={(e) => setReviewFormData({ ...reviewFormData, hrFeedback: e.target.value })}
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none bg-black/40 border"
                    style={{ borderColor: themeColors.borderColor, color: themeColors.textColor }}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowReviewModal(false); setSelectedTestForReview(null); }}
                    className="px-4 py-2 text-xs rounded-xl border"
                    style={{ borderColor: themeColors.borderColor, color: themeColors.textColor }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold rounded-xl text-[#0f1729] bg-gradient-to-r from-[#0d6e6e] via-[#0f7d7d] to-[#095454] hover:opacity-80 transition"
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
                <h3 className="text-lg font-bold" style={{ color: themeColors.textColor }}>Student Compiler Preview</h3>
                <p className="text-xs mt-1" style={{ color: themeColors.textSecondaryColor }}>
                  Language: <span className="text-purple-300 font-mono uppercase">{codingTestForm.language}</span>
                  {selectedAppForTest?.student?.name && (
                    <> · Candidate: <span style={{ color: themeColors.textColor }}>{selectedAppForTest.student.name}</span></>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompilerPreview(false)}
                className="hover:opacity-80 text-xl px-2"
                style={{ color: themeColors.textSecondaryColor }}
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
              <div className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(13,110,110, 0.05)', border: `1px solid ${theme.border}` }}>
                {selectedSubmission.profile?.photo && (
                  <img src={selectedSubmission.profile.photo} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2" style={{ borderColor: "#0d6e6e" }} />
                )}
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: theme.text }}>{selectedSubmission.student?.name}</h3>
                  <p className="text-sm" style={{ color: theme.textSecondary }}>{selectedSubmission.student?.email}</p>
                  {selectedSubmission.profile?.headline && <p className="text-sm mt-1" style={{ color: "#0d6e6e" }}>{selectedSubmission.profile.headline}</p>}
                </div>
              </div>

              {selectedSubmission.profile?.about && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#0d6e6e" }}>About</p>
                  <p className="text-sm" style={{ color: theme.text }}>{selectedSubmission.profile.about}</p>
                </div>
              )}

              {selectedSubmission.profile?.skills?.length > 0 && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#0d6e6e" }}>Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedSubmission.profile.skills.map((skill, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(13,110,110, 0.15)', color: "#0d6e6e" }}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedSubmission.profile?.experiences?.length > 0 && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#0d6e6e" }}>Experience</p>
                  {selectedSubmission.profile.experiences.map((exp, i) => (
                    <div key={i} className="text-sm mb-1" style={{ color: theme.text }}>
                      <strong>{exp.title}</strong> at {exp.company} ({exp.startDate} - {exp.endDate || "Present"})
                    </div>
                  ))}
                </div>
              )}

              {selectedSubmission.profile?.education?.length > 0 && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#0d6e6e" }}>Education</p>
                  {selectedSubmission.profile.education.map((edu, i) => (
                    <div key={i} className="text-sm mb-1" style={{ color: theme.text }}>
                      <strong>{edu.school}</strong> - {edu.degree} {edu.fieldOfStudy} ({edu.startYear} - {edu.endYear})
                    </div>
                  ))}
                </div>
              )}

              {selectedSubmission.message && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#0d6e6e" }}>Student Message</p>
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
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d6e6e]/50"
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
                  className="text-[#0f1729] px-4 py-2 text-sm rounded-lg transition hover:opacity-80 bg-gradient-to-r from-[#0d6e6e] via-[#0f7d7d] to-[#095454]"
                  style={{ backgroundColor: "#0d6e6e" }}
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