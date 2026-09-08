import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUpload,
  FaFileAlt,
  FaBuilding,
  FaSignOutAlt,
  FaSearch,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaVideo,
  FaCode,
  FaDownload,
  FaMagic,
  FaSpinner,
  FaRobot,
  FaMicrophone,
  FaBars,
  FaSun,
  FaMoon,
} from "react-icons/fa";
import api from "../services/api";
import VideoCall from "../components/VideoCall";
import CodingTestView from "../components/CodingTestView";
import Toast, { useToast } from "../components/Toast";
import StudentProfile from "./StudentProfile";
import TypingTest from "../components/TypingTest";
import DashboardSidebar from "../components/DashboardSidebar";

function StudentDashboard() {
  const navigate = useNavigate();
  const { toasts, add: toast, remove: removeToast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [myResume, setMyResume] = useState(null);
  const [activeTab, setActiveTab] = useState("jobs");
  const [searchTerm, setSearchTerm] = useState("");
  const [interviews, setInterviews] = useState([]);
  const [codingTests, setCodingTests] = useState([]);
  const [activeTestId, setActiveTestId] = useState(null);
  const [videoCallRoom, setVideoCallRoom] = useState(null);
  const [atsGenerating, setAtsGenerating] = useState(false);
  const [atsResume, setAtsResume] = useState(null);
  const [showAtsPreview, setShowAtsPreview] = useState(false);
  const [hrUsers, setHrUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedHrId, setSelectedHrId] = useState("");
  const [sendMsg, setSendMsg] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user") || "{}");
  });
  const isLpuStudent = currentUser.role === "LPU Student";
  const [themeMode, setThemeMode] = useState("dark");

  const themeColors = themeMode === "dark"
    ? {
        bg: '#0a0f1a',
        bgSecondary: '#0e1422',
        bgCard: '#0e1422',
        bgInput: '#070a12',
        border: 'rgba(255,255,255,0.08)',
        text: '#ffffff',
        textSecondary: 'rgba(255,255,255,0.5)',
        gold: '#d4af37',
        goldLight: '#f3e5ab',
        goldDark: '#996515',
        goldGlow: isLpuStudent ? 'rgba(212, 175, 55, 0.18)' : 'rgba(212, 175, 55, 0.15)',
        green: '#4ade80',
        red: '#f87171',
        yellow: '#fbbf24',
        cardBg: "rgba(14,20,34,0.85)",
        borderColor: "rgba(255,255,255,0.08)",
        textColor: "#ffffff",
        textMutedColor: "rgba(255,255,255,0.5)",
        textSecondaryColor: "rgba(255,255,255,0.4)",
        disabledBg: "rgba(255,255,255,0.1)",
        badgeGreenBg: "rgba(34,197,94,0.15)",
        badgeGreenText: "#4ade80",
        badgeRedBg: "rgba(239,68,68,0.15)",
        badgeRedText: "#f87171",
        badgeYellowBg: "rgba(234,179,8,0.15)",
        badgeYellowText: "#fbbf24",
        badgeBlueBg: "rgba(59,130,246,0.15)",
        badgeBlueText: "#60a5fa",
        badgePurpleBg: "rgba(168,85,247,0.15)",
        badgePurpleText: "#c084fc",
        badgeAmberBg: "rgba(245,158,11,0.15)",
        badgeAmberText: "#fbbf24",
        accentBlue: "#38bdf8",
        inputBorder: "rgba(255,255,255,0.1)",
      }
    : {
        bg: '#f0f2f5',
        bgSecondary: '#ffffff',
        bgCard: '#ffffff',
        bgInput: '#f8f4ec',
        border: 'rgba(0,0,0,0.1)',
        text: '#1a1a2e',
        textSecondary: 'rgba(0,0,0,0.5)',
        gold: '#996515',
        goldLight: '#d4af37',
        goldDark: '#6b4f0a',
        goldGlow: 'rgba(153, 101, 21, 0.12)',
        green: '#16a34a',
        red: '#dc2626',
        yellow: '#d97706',
        cardBg: "rgba(255,255,255,0.85)",
        borderColor: "rgba(0,0,0,0.1)",
        textColor: "#1a1a2e",
        textMutedColor: "rgba(0,0,0,0.5)",
        textSecondaryColor: "rgba(0,0,0,0.4)",
        disabledBg: "rgba(0,0,0,0.05)",
        badgeGreenBg: "rgba(22,163,74,0.12)",
        badgeGreenText: "#16a34a",
        badgeRedBg: "rgba(220,38,38,0.12)",
        badgeRedText: "#dc2626",
        badgeYellowBg: "rgba(217,119,6,0.12)",
        badgeYellowText: "#d97706",
        badgeBlueBg: "rgba(37,99,235,0.12)",
        badgeBlueText: "#2563eb",
        badgePurpleBg: "rgba(147,51,234,0.12)",
        badgePurpleText: "#9333ea",
        badgeAmberBg: "rgba(180,83,9,0.12)",
        badgeAmberText: "#b45309",
        accentBlue: "#0284c7",
        inputBorder: "rgba(0,0,0,0.15)",
      };
  const theme = themeColors;

  const fetchJobs = async () => {
    try {
      const res = await api.get("/jobs");
      setJobs(res.data);
    } catch (err) {
      toast("Failed to load jobs", "error");
    }
  };

  const fetchMyApps = async () => {
    try {
      const res = await api.get("/applications/me");
      setMyApps(res.data);
    } catch (err) {
      toast("Failed to load applications", "error");
    }
  };

  const fetchMyResume = async () => {
    try {
      const res = await api.get("/resume/me");
      setMyResume(res.data);
      setAtsResume(res.data.atsResume || null);
    } catch (err) {
      // No resume uploaded yet
    }
  };

  const fetchMyInterviews = async () => {
    try {
      const res = await api.get("/interviews/me");
      setInterviews(res.data);
    } catch (err) {
      // No interviews yet
    }
  };

  const fetchMyCodingTests = async () => {
    try {
      const res = await api.get("/coding-tests/my-tests");
      setCodingTests(res.data);
    } catch (err) {
      // No tests yet
    }
  };

  const fetchHRUsers = async () => {
    try {
      const res = await api.get("/profile-submissions/hr-users");
      setHrUsers(res.data);
    } catch (err) {
      // ignore
    }
  };

  const fetchMySubmissions = async () => {
    try {
      const res = await api.get("/profile-submissions/mine");
      setSubmissions(res.data);
    } catch (err) {
      // ignore
    }
  };

  const handleSendProfile = async () => {
    if (!selectedHrId) {
      toast("Please select an HR user", "error");
      return;
    }
    try {
      await api.post("/profile-submissions/send", { hrId: selectedHrId, message: sendMsg });
      toast("Profile sent to HR!");
      setSelectedHrId("");
      setSendMsg("");
      fetchMySubmissions();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to send profile", "error");
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchMyApps();
    fetchMyResume();
    fetchMyInterviews();
    fetchMyCodingTests();
    fetchHRUsers();
    fetchMySubmissions();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validExts = [".pdf", ".doc", ".docx"];
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!validExts.includes(ext)) {
        toast("Only PDF, DOC, DOCX allowed", "error");
        e.target.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast("File must be less than 5MB", "error");
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("resume", selectedFile);

    setUploading(true);
    try {
      const res = await api.post("/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSelectedFile(null);
      document.getElementById("fileInput").value = "";
      fetchMyResume();
      toast("CV uploaded and processed successfully!");
    } catch (err) {
      toast(err.response?.data?.message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateATS = async () => {
    setAtsGenerating(true);
    try {
      const res = await api.post("/resume/generate-ats");
      setAtsResume(res.data.atsResume);
      toast("ATS-friendly resume generated!");
    } catch (err) {
      toast(err.response?.data?.message || "ATS generation failed", "error");
    } finally {
      setAtsGenerating(false);
    }
  };

  const handleDownloadATS = async () => {
    try {
      const res = await api.get("/resume/download-ats", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "ATS_Resume.html");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast(err.response?.data?.message || "Download failed", "error");
    }
  };

  const statusSummary = useMemo(() => {
    const total = myApps.length;
    const shortlisted = myApps.filter((app) => app.status === "shortlisted").length;
    const pending = myApps.filter((app) => app.status === "pending").length;
    const rejected = myApps.filter((app) => app.status === "rejected").length;
    const upcoming = interviews.filter((interview) => interview.status === "scheduled").length;

    return { total, shortlisted, pending, rejected, upcoming };
  }, [myApps, interviews]);

  const hasApplied = (jobId) => myApps.some((app) => app.job._id === jobId);
  const getStatus = (jobId) => {
    const app = myApps.find((a) => a.job._id === jobId);
    return app ? app.status : null;
  };

  const filteredJobs = jobs.filter((job) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      job.title.toLowerCase().includes(term) ||
      job.location.toLowerCase().includes(term) ||
      (job.postedBy?.name && job.postedBy.name.toLowerCase().includes(term))
    );
  });

  const getInterviewRoom = (interview) => interview.roomName || `interview-${interview._id}`;

  const sidebarItems = [
    { key: "jobs", label: "Browse Jobs", icon: FaBuilding },
    { key: "myapps", label: "My Applications", icon: FaFileAlt },
    { key: "resume", label: "My Resume", icon: FaUpload },
    { key: "interviews", label: "My Interviews", icon: FaVideo },
    { key: "coding_tests", label: "Coding Assessments", icon: FaCode },
    { key: "profile", label: "Profile", icon: FaSearch },
    { key: "typing", label: "Typing Test", icon: FaClock },
  ];

  return (
    <div className="min-h-screen login-neo relative overflow-hidden" style={{ backgroundColor: theme.bg, color: theme.text }}>

      {/* Ambient Glow Background */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#d4af37]/[0.07] blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[650px] h-[650px] rounded-full bg-[#d4af37]/[0.05] blur-[150px] pointer-events-none" />

      <Toast toasts={toasts} remove={removeToast} />
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        items={sidebarItems}
        activeKey={activeTab}
        onSelect={(key) => { setActiveTab(key); setSidebarOpen(false); }}
        onLogout={handleLogout}
        theme={{
          background: theme.bgSecondary,
          card: theme.bgCard,
          border: theme.border,
          text: theme.text,
          muted: theme.textSecondary,
          accent: theme.gold,
          activeBackground: isLpuStudent ? "rgba(255, 107, 43, 0.12)" : "rgba(212, 168, 67, 0.12)",
        }}
        userName={currentUser.name || currentUser.email || "User"}
        userRole={currentUser.role || "User"}
      />
      <header className="backdrop-blur-2xl border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: theme.bgSecondary + 'd9', borderColor: theme.border }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="rounded-xl p-2 transition hover:opacity-80"
            style={{ backgroundColor: theme.bgCard, color: theme.gold, border: `1px solid ${theme.border}` }}
            aria-label="Open sidebar"
          >
            <FaBars size={16} />
          </button>
          <img src="/vettora-logo.png" alt="Vettora Logo" className="h-9 object-contain rounded-lg border border-[#d4af37]/30 p-0.5" style={{ backgroundColor: theme.cardBg }} />
          <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(212, 168, 67, 0.2)', color: theme.gold }}>
            {isLpuStudent ? "LPU Student" : "Student Portal"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setThemeMode((c) => (c === "dark" ? "light" : "dark"))}
            className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300"
            style={{
              background: themeMode === "dark" ? "rgba(30,35,50,0.8)" : "rgba(255,255,255,0.8)",
              borderColor: themeMode === "dark" ? "rgba(212,175,55,0.3)" : "rgba(139,105,20,0.3)",
              boxShadow: themeMode === "dark" ? "0 0 20px rgba(212,175,55,0.15)" : "0 0 20px rgba(139,105,20,0.10)",
            }}
            aria-label="Toggle theme">
            {themeMode === "dark" ? <FaSun className="text-[#d4af37] text-sm" /> : <FaMoon className="text-[#8B6914] text-sm" />}
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm transition" style={{ color: theme.textSecondary }} onMouseEnter={(e) => e.currentTarget.style.color = theme.text} onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}>
            <FaSignOutAlt size={16} /> Sign out
          </button>
        </div>
      </header>

      <div className={`max-w-7xl mx-auto px-6 py-8 transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-64"}`}>
        <h1 className="text-2xl font-semibold mb-6" style={{ color: theme.text }}>{isLpuStudent ? "LPU Student Dashboard" : "Student Dashboard"}</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl p-4 backdrop-blur-2xl" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary + 'd9' }}>
            <div className="text-xs uppercase" style={{ color: theme.textSecondary }}>Applications</div>
            <div className="text-2xl font-bold mt-1" style={{ color: theme.text }}>{statusSummary.total}</div>
          </div>
          <div className="rounded-xl p-4 backdrop-blur-2xl" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary + 'd9' }}>
            <div className="text-xs uppercase" style={{ color: theme.textSecondary }}>Shortlisted</div>
            <div className="text-2xl font-bold mt-1" style={{ color: theme.green }}>{statusSummary.shortlisted}</div>
          </div>
          <div className="rounded-xl p-4 backdrop-blur-2xl" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary + 'd9' }}>
            <div className="text-xs uppercase" style={{ color: theme.textSecondary }}>Pending</div>
            <div className="text-2xl font-bold mt-1" style={{ color: theme.yellow }}>{statusSummary.pending}</div>
          </div>
          <div className="rounded-xl p-4 backdrop-blur-2xl" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary + 'd9' }}>
            <div className="text-xs uppercase" style={{ color: theme.textSecondary }}>Upcoming Interviews</div>
            <div className="text-2xl font-bold mt-1" style={{ color: theme.accentBlue }}>{statusSummary.upcoming}</div>
          </div>
        </div>

        {isLpuStudent && (
          <div className="rounded-xl p-5 mb-6 backdrop-blur-2xl" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary + 'd9' }}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
              <h2 className="text-lg font-semibold" style={{ color: theme.text }}>LPU Student Progress Tracker</h2>
              <span className="text-xs" style={{ color: theme.textSecondary }}>
                Next step: {statusSummary.upcoming > 0 ? "Attend upcoming interview" : statusSummary.shortlisted > 0 ? "Wait for final feedback" : "Keep applying to assigned jobs"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg p-3" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bgCard + 'd9' }}>
                <div style={{ color: theme.textSecondary }}>Applications Submitted</div>
                <div className="font-semibold mt-1" style={{ color: theme.text }}>{statusSummary.total}</div>
              </div>
              <div className="rounded-lg p-3" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bgCard + 'd9' }}>
                <div style={{ color: theme.textSecondary }}>Shortlisted Stage</div>
                <div className="font-semibold mt-1" style={{ color: theme.green }}>{statusSummary.shortlisted}</div>
              </div>
              <div className="rounded-lg p-3" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bgCard + 'd9' }}>
                <div style={{ color: theme.textSecondary }}>Interview Readiness</div>
                <div className="font-semibold mt-1" style={{ color: theme.accentBlue }}>{statusSummary.upcoming}</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <button
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "jobs" ? "border-b-2" : ""}`}
            style={{ 
              color: activeTab === "jobs" ? theme.text : theme.textSecondary,
              borderColor: activeTab === "jobs" ? theme.gold : 'transparent'
            }}
            onClick={() => setActiveTab("jobs")}
          >
            Browse Jobs
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "myapps" ? "border-b-2" : ""}`}
            style={{ 
              color: activeTab === "myapps" ? theme.text : theme.textSecondary,
              borderColor: activeTab === "myapps" ? theme.gold : 'transparent'
            }}
            onClick={() => setActiveTab("myapps")}
          >
            My Applications
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "resume" ? "border-b-2" : ""}`}
            style={{ 
              color: activeTab === "resume" ? theme.text : theme.textSecondary,
              borderColor: activeTab === "resume" ? theme.gold : 'transparent'
            }}
            onClick={() => setActiveTab("resume")}
          >
            My Resume
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "interviews" ? "border-b-2" : ""}`}
            style={{ 
              color: activeTab === "interviews" ? theme.text : theme.textSecondary,
              borderColor: activeTab === "interviews" ? theme.gold : 'transparent'
            }}
            onClick={() => setActiveTab("interviews")}
          >
            My Interviews
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "coding_tests" ? "border-b-2" : ""}`}
            style={{ 
              color: activeTab === "coding_tests" ? theme.text : theme.textSecondary,
              borderColor: activeTab === "coding_tests" ? theme.gold : 'transparent'
            }}
            onClick={() => setActiveTab("coding_tests")}
          >
            <FaCode className="inline mr-1" /> Coding Assessments {codingTests.length > 0 && `(${codingTests.length})`}
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "profile" ? "border-b-2" : ""}`}
            style={{ 
              color: activeTab === "profile" ? theme.text : theme.textSecondary,
              borderColor: activeTab === "profile" ? theme.gold : 'transparent'
            }}
            onClick={() => setActiveTab("profile")}
          >
            <FaUpload className="inline mr-1" /> Profile
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "typing" ? "border-b-2" : ""}`}
            style={{ 
              color: activeTab === "typing" ? theme.text : theme.textSecondary,
              borderColor: activeTab === "typing" ? theme.gold : 'transparent'
            }}
            onClick={() => setActiveTab("typing")}
          >
            <FaCode className="inline mr-1" /> Typing Test
          </button>
        </div>

        {activeTab === "jobs" && (
          <div>
            <div className="mb-6">
              <div className="relative max-w-md">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.textSecondary }} />
                <input
                  type="text"
                  placeholder="Search jobs by title, location, or HR..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition focus:ring-2 focus:ring-[#d4af37]/50"
                  style={{ backgroundColor: theme.bgCard + 'd9', border: `1px solid ${theme.inputBorder}`, color: theme.textColor }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.length === 0 ? (
                <div className="col-span-full text-center py-12" style={{ color: theme.textSecondary }}>
                  {searchTerm ? "No jobs match your search." : "No jobs available right now."}
                </div>
              ) : (
                filteredJobs.map((job) => {
                  const applied = hasApplied(job._id);
                  const status = getStatus(job._id);
                  return (
                    <div key={job._id} className="rounded-xl shadow-sm p-5 hover:shadow-md transition backdrop-blur-2xl" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary + 'd9' }}>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold" style={{ color: theme.text }}>{job.title}</h3>
                        {isLpuStudent && (
                          <span className="text-[10px] px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(255, 107, 43, 0.2)', color: theme.gold }}>
                            {job.allocatedStudents?.some((student) => student?._id === currentUser._id || student?.uid === currentUser.uid)
                              ? "Assigned to You"
                              : "LPU Opportunity"}
                          </span>
                        )}
                      </div>
                      <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>{job.location}</p>
                      <p className="text-sm mt-2 line-clamp-2" style={{ color: theme.textSecondary }}>{job.description}</p>
                      <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>Requirements: {job.requirements}</p>
                      <div className="flex justify-between items-center mt-4">
                        {applied ? (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{
                            backgroundColor: status === "shortlisted" ? theme.badgeGreenBg : status === "rejected" ? theme.badgeRedBg : theme.badgeYellowBg,
                            color: status === "shortlisted" ? theme.badgeGreenText : status === "rejected" ? theme.badgeRedText : theme.badgeYellowText,
                          }}>{status}</span>
                        ) : (
                          <button
                            onClick={async () => {
                              if (!myResume) {
                                toast("Please upload your resume first (go to My Resume tab)", "error");
                                return;
                              }
                              try {
                                await api.post(`/applications/jobs/${job._id}/apply`);
                                toast("Application submitted!");
                                fetchMyApps();
                              } catch (err) {
                                toast(err.response?.data?.message || "Application failed", "error");
                              }
                            }}
                            className="bg-gradient-to-r from-[#d4af37] via-[#c5a059] to-[#996515] text-[#0a0f1a] px-4 py-1 rounded text-sm font-semibold transition hover:opacity-80"
                          >
                            Apply
                          </button>
                        )}
                        <span className="text-xs" style={{ color: theme.textSecondary }}>Posted by {job.postedBy?.name || "HR"}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === "myapps" && (
          <div className="rounded-xl shadow-sm overflow-hidden backdrop-blur-2xl" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary + 'd9' }}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y" style={{ borderColor: theme.borderColor }}>
                <thead className="bg-[#d4af37]/[0.1]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Job</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Applied On</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: theme.borderColor }}>
                  {myApps.map((app) => (
                    <tr key={app._id}>
                      <td className="px-6 py-4 text-sm" style={{ color: theme.text }}>{app.job.title}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: theme.textSecondary }}>{app.job.location}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{
                          backgroundColor: app.status === "shortlisted" ? theme.badgeGreenBg : app.status === "rejected" ? theme.badgeRedBg : theme.badgeYellowBg,
                          color: app.status === "shortlisted" ? theme.badgeGreenText : app.status === "rejected" ? theme.badgeRedText : theme.badgeYellowText,
                        }}>{app.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: theme.textSecondary }}>{new Date(app.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "resume" && (
          <div className="rounded-xl shadow-sm p-6 backdrop-blur-2xl" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary + 'd9' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: theme.text }}>Upload Your Resume/CV</h2>
            <p className="text-sm mb-4" style={{ color: theme.textSecondary }}>Upload your resume (PDF, DOC, DOCX) to apply for jobs. The system will extract your details and store them securely.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>Choose file</label>
              <input
                id="fileInput"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium transition file:bg-gradient-to-r file:from-[#d4af37] file:via-[#c5a059] file:to-[#996515] file:text-[#0a0f1a] file:font-semibold"
                style={{ 
                  color: theme.textSecondary
                }}
              />
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-[#d4af37]/[0.05]" style={{ borderColor: theme.borderColor }}>
                <FaFileAlt style={{ color: theme.gold }} />
                <span className="text-sm font-medium" style={{ color: theme.text }}>{selectedFile.name}</span>
                <button onClick={() => { setSelectedFile(null); document.getElementById("fileInput").value = ""; }} className="ml-auto text-sm hover:opacity-80" style={{ color: theme.red }}>Remove</button>
              </div>
            )}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className={`mt-4 px-6 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                !selectedFile || uploading 
                  ? `opacity-50 cursor-not-allowed` 
                  : "bg-gradient-to-r from-[#d4af37] via-[#c5a059] to-[#996515] text-[#0a0f1a] hover:opacity-80"
              }`}
              style={(!selectedFile || uploading) ? { backgroundColor: theme.disabledBg } : {}}
            >
              <FaUpload /> {uploading ? "Processing..." : "Upload & Process"}
            </button>
            {myResume && (
              <div className="mt-6 border-t pt-4" style={{ borderColor: theme.borderColor }}>
                <h3 className="font-semibold mb-2" style={{ color: theme.text }}>Last Uploaded Resume</h3>
                <p className="text-sm" style={{ color: theme.textSecondary }}>File: {myResume.fileName}</p>
                <p className="text-sm" style={{ color: theme.textSecondary }}>Status: {myResume.status}</p>
                <p className="text-sm" style={{ color: theme.textSecondary }}>Uploaded: {new Date(myResume.createdAt).toLocaleString()}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium hover:underline" style={{ color: theme.gold }}>View extracted data</summary>
                    <div className="mt-2 p-3 rounded-lg text-sm border bg-[#d4af37]/[0.05]" style={{ borderColor: theme.borderColor }}>
                    <p><strong style={{ color: theme.gold }}>Email:</strong> <span style={{ color: theme.text }}>{myResume.extractedData?.email || "Not found"}</span></p>
                    <p><strong style={{ color: theme.gold }}>Contact:</strong> <span style={{ color: theme.text }}>{myResume.extractedData?.contact_no || "Not found"}</span></p>
                    <p><strong style={{ color: theme.gold }}>Skills:</strong> <span style={{ color: theme.text }}>{myResume.extractedData?.technical_skills || "Not found"}</span></p>
                    <p><strong style={{ color: theme.gold }}>Projects:</strong> <span style={{ color: theme.text }}>{myResume.extractedData?.project_details || "Not found"}</span></p>
                    <p><strong style={{ color: theme.gold }}>Certifications:</strong> <span style={{ color: theme.text }}>{myResume.extractedData?.certifications || "Not found"}</span></p>
                    <p><strong style={{ color: theme.gold }}>Other Info:</strong> <span style={{ color: theme.text }}>{myResume.extractedData?.other_info || "Not found"}</span></p>
                  </div>
                </details>

                {/* ── ATS Resume Generator ── */}
                <div className="mt-4 p-4 rounded-xl border bg-[#d4af37]/[0.05]" style={{ borderColor: theme.borderColor }}>
                  <div className="flex items-center gap-2 mb-2">
                    <FaMagic style={{ color: theme.gold }} />
                    <h4 className="font-semibold text-sm" style={{ color: theme.text }}>AI ATS Resume Generator</h4>
                  </div>
                  <p className="text-xs mb-3" style={{ color: theme.textSecondary }}>
                    Generate an ATS-optimized version of your resume that passes automated screening systems.
                  </p>

                  {atsResume?.html ? (
                    <div className="space-y-2">
                      <p className="text-xs" style={{ color: theme.green }}>
                        ✓ ATS resume generated on {new Date(atsResume.generatedAt).toLocaleString()}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowAtsPreview(!showAtsPreview)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition hover:opacity-80 bg-gradient-to-r from-[#d4af37] via-[#c5a059] to-[#996515] text-[#0a0f1a]"
                        >
                          <FaFileAlt size={11} /> {showAtsPreview ? "Hide Preview" : "Preview"}
                        </button>
                        <button
                          onClick={handleDownloadATS}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-[#d4af37]/30 text-[#d4af37] bg-transparent transition hover:opacity-80"
                        >
                          <FaDownload size={11} /> Download HTML
                        </button>
                        <button
                          onClick={handleGenerateATS}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border bg-transparent transition hover:opacity-80"
                          style={{ borderColor: theme.borderColor, color: theme.textSecondaryColor }}
                        >
                          <FaMagic size={11} /> Regenerate
                        </button>
                      </div>

                      {showAtsPreview && (
                        <div className="mt-3 rounded-lg border overflow-hidden" style={{ borderColor: theme.border }}>
                          <div className="p-2 text-xs font-medium border-b flex items-center justify-between" style={{ borderColor: theme.border, backgroundColor: theme.bgInput + 'd9', color: theme.textSecondary }}>
                            <span>ATS Resume Preview</span>
                            <span className="text-[10px] opacity-60">HTML format</span>
                          </div>
                          <div
                            className="p-4 bg-white text-black text-xs overflow-auto max-h-[400px]"
                            dangerouslySetInnerHTML={{ __html: atsResume.html }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerateATS}
                      disabled={atsGenerating}
                      className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition ${
                        atsGenerating ? "opacity-60 cursor-not-allowed" : "bg-gradient-to-r from-[#d4af37] via-[#c5a059] to-[#996515] text-[#0a0f1a] hover:opacity-80"
                      }`}
                      style={atsGenerating ? { backgroundColor: theme.disabledBg } : {}}
                    >
                      {atsGenerating ? (
                        <>
                          <FaSpinner className="animate-spin" size={12} /> Generating ATS Resume…
                        </>
                      ) : (
                        <>
                          <FaMagic size={12} /> Generate ATS Resume
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "interviews" && (
          <div>
            <h2 className="text-xl font-semibold mb-4" style={{ color: theme.text }}>Upcoming Interviews</h2>
            {interviews.length === 0 ? (
              <div className="rounded-xl shadow-sm p-8 text-center backdrop-blur-2xl" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary + 'd9', color: theme.textSecondary }}>
                No interviews scheduled yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {interviews.map((interview) => {
                  const status = interview.status?.toLowerCase ? interview.status.toLowerCase() : interview.status;
                  return (
                    <div key={interview._id} className="rounded-xl shadow-sm p-5 hover:shadow-md transition backdrop-blur-2xl" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary + 'd9' }}>
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(212, 168, 67, 0.1)' }}>
                          <FaCalendarAlt style={{ color: theme.gold }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold" style={{ color: theme.text }}>{interview.job.title}</h3>
                            {interview.interviewMode === "ai" ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1" style={{ backgroundColor: theme.badgePurpleBg, color: theme.badgePurpleText, border: `1px solid ${theme.badgePurpleText}40` }}>
                                <FaRobot size={10} /> AI Voice Interview
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1" style={{ backgroundColor: theme.badgeBlueBg, color: theme.badgeBlueText, border: `1px solid ${theme.badgeBlueText}40` }}>
                                <FaVideo size={10} /> Human Video
                              </span>
                            )}
                          </div>
                          <div className="text-sm space-y-1 mt-1" style={{ color: theme.textSecondary }}>
                            <p><FaClock className="inline mr-1" size={12} style={{ color: theme.gold }} /> {new Date(interview.scheduledAt).toLocaleString()}</p>
                            <p><FaMapMarkerAlt className="inline mr-1" size={12} style={{ color: theme.gold }} /> {interview.location}</p>
                            <p>Duration: {interview.duration} min</p>
                            {interview.meetingLink && interview.interviewMode !== "ai" && (
                              <p><FaVideo className="inline mr-1" size={12} style={{ color: theme.gold }} /> <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: theme.gold }}>Join meeting</a></p>
                            )}
                            {interview.notes && (
                              <p className="text-sm" style={{ color: theme.textSecondary }}>📝 {interview.notes}</p>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{
                              backgroundColor: status === "completed" ? theme.badgeGreenBg : status === "cancelled" ? theme.badgeRedBg : theme.badgeYellowBg,
                              color: status === "completed" ? theme.badgeGreenText : status === "cancelled" ? theme.badgeRedText : theme.badgeYellowText,
                            }}>
                              {status}
                            </span>

                            {/* Action Buttons */}
                            {status === "scheduled" && (
                              interview.interviewMode === "ai" ? (
                                <button
                                  onClick={() => navigate(`/voice-interview/${interview._id}`)}
                                  className="mt-3 bg-gradient-to-r from-[#d4af37] via-[#c5a059] to-[#996515] text-[#0a0f1a] font-semibold px-4 py-2 rounded-xl transition text-xs flex items-center gap-2 shadow-lg transform hover:scale-105"
                                >
                                  <FaRobot size={13} /> Start AI Voice Interview
                                </button>
                              ) : interview.callActive ? (
                                <button
                                  onClick={() => setVideoCallRoom(interview._id)}
                                  className="mt-2 bg-gradient-to-r from-[#d4af37] via-[#c5a059] to-[#996515] text-[#0a0f1a] px-3 py-1 rounded hover:opacity-80 transition text-xs flex items-center gap-1"
                                >
                                  <FaVideo size={12} /> Join Call
                                </button>
                              ) : (
                                <p className="mt-2 text-xs" style={{ color: theme.textSecondary }}>Waiting for HR to start the call.</p>
                              )
                            )}

                            {interview.feedback && interview.feedback.decision && (
                              <div className="mt-3 pt-2 border-t" style={{ borderColor: theme.borderColor }}>
                                <p className="text-sm font-medium" style={{ color: theme.text }}>Feedback:</p>
                                <p className="text-sm" style={{ color: theme.textSecondary }}>Rating: {interview.feedback.rating}/5</p>
                                <p className="text-sm" style={{ color: theme.textSecondary }}>Comments: {interview.feedback.comments}</p>
                                <p className="text-sm font-medium">Decision: <span style={{
                                  color: interview.feedback.decision === "selected" ? theme.badgeGreenText : interview.feedback.decision === "rejected" ? theme.badgeRedText : theme.badgeYellowText,
                                }}>{interview.feedback.decision}</span></p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "coding_tests" && (
          <div>
            <h2 className="text-xl font-semibold mb-4" style={{ color: theme.text }}>Assigned Coding Assessments</h2>
            {codingTests.length === 0 ? (
              <div className="rounded-xl shadow-sm p-8 text-center backdrop-blur-2xl" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary + 'd9', color: theme.textSecondary }}>
                No coding assessments assigned to you yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {codingTests.map((t) => (
                  <div key={t._id} className="rounded-xl shadow-sm p-5 hover:shadow-md transition space-y-3 backdrop-blur-2xl" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bgSecondary + 'd9' }}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg" style={{ color: theme.text }}>{t.title}</h3>
                      <span className="text-xs px-2.5 py-1 rounded-full uppercase font-mono font-bold" style={{ backgroundColor: theme.badgePurpleBg, color: theme.badgePurpleText, border: `1px solid ${theme.badgePurpleText}40` }}>
                        {t.language}
                      </span>
                    </div>

                    <p className="text-xs" style={{ color: theme.textSecondary }}>
                      Job Role: <strong style={{ color: theme.text }}>{t.job?.title || "Position"}</strong>
                    </p>

                    <div className="flex items-center gap-4 text-xs" style={{ color: theme.textSecondary }}>
                      <span><FaClock className="inline mr-1 text-purple-400" /> {t.durationMinutes} Mins Limit</span>
                      <span>Assigned by: {t.createdBy?.name || "HR"}</span>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t" style={{ borderColor: theme.borderColor }}>
                      <div>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{
                          backgroundColor: t.status === "submitted" ? theme.badgeBlueBg : t.status === "reviewed" ? theme.badgeGreenBg : t.status === "in_progress" ? theme.badgeAmberBg : theme.badgePurpleBg,
                          color: t.status === "submitted" ? theme.badgeBlueText : t.status === "reviewed" ? theme.badgeGreenText : t.status === "in_progress" ? theme.badgeAmberText : theme.badgePurpleText,
                          border: `1px solid ${(t.status === "submitted" ? theme.badgeBlueText : t.status === "reviewed" ? theme.badgeGreenText : t.status === "in_progress" ? theme.badgeAmberText : theme.badgePurpleText)}40`,
                          animation: t.status === "in_progress" ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
                        }}>
                          {t.status}
                        </span>
                        {t.verdict && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded font-bold uppercase" style={{ color: t.verdict === "passed" ? theme.badgeGreenText : theme.badgeRedText }}>
                            ({t.verdict})
                          </span>
                        )}
                      </div>

                      {t.status !== "submitted" && t.status !== "reviewed" ? (
                        <button
                          onClick={() => setActiveTestId(t._id)}
                          className="px-4 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md transition" style={{ color: '#ffffff' }}
                        >
                          <FaCode size={12} /> {t.status === "in_progress" ? "Continue Test" : "Start Test (Full Screen)"}
                        </button>
                      ) : (
                        <span className="text-xs font-medium flex items-center gap-1" style={{ color: theme.badgeGreenText }}>
                          ✓ Test Completed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div>
            <StudentProfile embed />
          </div>
        )}
        {activeTab === "typing" && (
          <TypingTest theme={theme} />
        )}
      </div>

      {/* Full-Screen Coding Assessment Environment Modal */}
      {activeTestId && (
        <CodingTestView
          testId={activeTestId}
          onClose={() => setActiveTestId(null)}
          onSubmitted={() => {
            fetchMyCodingTests();
            fetchMyApps();
          }}
        />
      )}

      {/* Video Call Modal */}
      {videoCallRoom && (
        <VideoCall roomId={videoCallRoom} user={currentUser} onClose={() => setVideoCallRoom(null)} />
      )}
    </div>
  );
}

export default StudentDashboard;