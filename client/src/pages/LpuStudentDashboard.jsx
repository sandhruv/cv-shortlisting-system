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
} from "react-icons/fa";
import api from "../services/api";
import VideoCall from "../components/VideoCall";
import CodingTestView from "../components/CodingTestView";
import Toast, { useToast } from "../components/Toast";

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
  const [currentUser, setCurrentUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user") || "{}");
  });
  const isLpuStudent = currentUser.role === "LPU Student";

  const theme = isLpuStudent
    ? {
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
      }
    : {
        bg: '#0a0a0a',
        bgSecondary: '#1a1a1a',
        bgCard: '#1e1e1e',
        bgInput: '#0d0d0d',
        border: '#2a2a2a',
        text: '#f5f0e8',
        textSecondary: '#b8a88a',
        gold: '#d4a843',
        goldLight: '#f0d080',
        goldDark: '#b8922f',
        goldGlow: 'rgba(212, 168, 67, 0.15)',
        green: '#4ade80',
        red: '#f87171',
        yellow: '#fbbf24',
      };

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

  useEffect(() => {
    fetchJobs();
    fetchMyApps();
    fetchMyResume();
    fetchMyInterviews();
    fetchMyCodingTests();
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <Toast toasts={toasts} remove={removeToast} />
      <header className="border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
        <div className="flex items-center gap-3">
          <img src="/vettora-logo.png" alt="Vettora Logo" className="h-9 object-contain rounded-lg border border-white/10 p-0.5 bg-black/30" />
          <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(212, 168, 67, 0.2)', color: theme.gold }}>
            LPU Student
          </span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm transition" style={{ color: theme.textSecondary }} onMouseEnter={(e) => e.currentTarget.style.color = theme.text} onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}>
          <FaSignOutAlt size={16} /> Sign out
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-6" style={{ color: theme.text }}>{isLpuStudent ? "LPU Student Dashboard" : "Student Dashboard"}</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border p-4" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div className="text-xs uppercase" style={{ color: theme.textSecondary }}>Applications</div>
            <div className="text-2xl font-bold mt-1" style={{ color: theme.text }}>{statusSummary.total}</div>
          </div>
          <div className="rounded-xl border p-4" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div className="text-xs uppercase" style={{ color: theme.textSecondary }}>Shortlisted</div>
            <div className="text-2xl font-bold mt-1 text-emerald-400">{statusSummary.shortlisted}</div>
          </div>
          <div className="rounded-xl border p-4" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div className="text-xs uppercase" style={{ color: theme.textSecondary }}>Pending</div>
            <div className="text-2xl font-bold mt-1 text-amber-300">{statusSummary.pending}</div>
          </div>
          <div className="rounded-xl border p-4" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div className="text-xs uppercase" style={{ color: theme.textSecondary }}>Upcoming Interviews</div>
            <div className="text-2xl font-bold mt-1 text-sky-300">{statusSummary.upcoming}</div>
          </div>
        </div>

        {isLpuStudent && (
          <div className="rounded-xl border p-5 mb-6" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
              <h2 className="text-lg font-semibold" style={{ color: theme.text }}>LPU Student Progress Tracker</h2>
              <span className="text-xs" style={{ color: theme.textSecondary }}>
                Next step: {statusSummary.upcoming > 0 ? "Attend upcoming interview" : statusSummary.shortlisted > 0 ? "Wait for final feedback" : "Keep applying to assigned jobs"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg p-3" style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                <div style={{ color: theme.textSecondary }}>Applications Submitted</div>
                <div className="font-semibold mt-1" style={{ color: theme.text }}>{statusSummary.total}</div>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                <div style={{ color: theme.textSecondary }}>Shortlisted Stage</div>
                <div className="font-semibold mt-1 text-emerald-400">{statusSummary.shortlisted}</div>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                <div style={{ color: theme.textSecondary }}>Interview Readiness</div>
                <div className="font-semibold mt-1 text-sky-300">{statusSummary.upcoming}</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6 border-b" style={{ borderColor: theme.border }}>
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition focus:ring-2"
                  style={{ 
                    backgroundColor: theme.bgInput,
                    borderColor: theme.border,
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    placeholderColor: theme.textSecondary
                  }}
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
                    <div key={job._id} className="rounded-xl border shadow-sm p-5 hover:shadow-md transition" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
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
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            status === "shortlisted" ? "bg-green-900/30 text-green-400" : 
                            status === "rejected" ? "bg-red-900/30 text-red-400" : 
                            "bg-yellow-900/30 text-yellow-400"
                          }`}>{status}</span>
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
                            className="text-white px-4 py-1 rounded text-sm transition hover:opacity-80"
                            style={{ backgroundColor: theme.gold }}
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
          <div className="rounded-xl border shadow-sm overflow-hidden" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y" style={{ borderColor: theme.border }}>
                <thead style={{ backgroundColor: 'rgba(212, 168, 67, 0.1)' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Job</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Applied On</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: theme.textSecondary }}>Actions / Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: theme.border }}>
                  {myApps.map((app) => {
                    const assignedTest = codingTests.find((t) => t.application === app._id || t.application?._id === app._id);
                    return (
                      <tr key={app._id}>
                        <td className="px-6 py-4 text-sm font-medium" style={{ color: theme.text }}>{app.job?.title || "Role"}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: theme.textSecondary }}>{app.job?.location || "Remote"}</td>
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
                        <td className="px-6 py-4 text-sm" style={{ color: theme.textSecondary }}>{new Date(app.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          {app.status === "coding_test_assigned" && assignedTest ? (
                            <button
                              onClick={() => {
                                setActiveTestId(assignedTest._id);
                              }}
                              className="px-3 py-1.5 rounded-lg text-white font-medium text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow transition flex items-center gap-1.5 ml-auto"
                            >
                              <FaCode size={12} /> Start Assessment
                            </button>
                          ) : (
                            <span className="text-xs" style={{ color: theme.textSecondary }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "resume" && (
          <div className="rounded-xl border shadow-sm p-6" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: theme.text }}>Upload Your Resume/CV</h2>
            <p className="text-sm mb-4" style={{ color: theme.textSecondary }}>Upload your resume (PDF, DOC, DOCX) to apply for jobs. The system will extract your details and store them securely.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>Choose file</label>
              <input
                id="fileInput"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium transition"
                style={{ 
                  color: theme.textSecondary,
                  fileBackground: theme.gold,
                  fileColor: 'white'
                }}
              />
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 p-3 rounded-lg border" style={{ backgroundColor: 'rgba(212, 168, 67, 0.05)', borderColor: theme.border }}>
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
                  ? "opacity-50 cursor-not-allowed" 
                  : "text-white hover:opacity-80"
              }`}
              style={{ backgroundColor: !selectedFile || uploading ? theme.border : theme.gold }}
            >
              <FaUpload /> {uploading ? "Processing..." : "Upload & Process"}
            </button>
            {myResume && (
              <div className="mt-6 border-t pt-4" style={{ borderColor: theme.border }}>
                <h3 className="font-semibold mb-2" style={{ color: theme.text }}>Last Uploaded Resume</h3>
                <p className="text-sm" style={{ color: theme.textSecondary }}>File: {myResume.fileName}</p>
                <p className="text-sm" style={{ color: theme.textSecondary }}>Status: {myResume.status}</p>
                <p className="text-sm" style={{ color: theme.textSecondary }}>Uploaded: {new Date(myResume.createdAt).toLocaleString()}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium hover:underline" style={{ color: theme.gold }}>View extracted data</summary>
                  <div className="mt-2 p-3 rounded-lg text-sm border" style={{ backgroundColor: 'rgba(212, 168, 67, 0.05)', borderColor: theme.border }}>
                    <p><strong style={{ color: theme.gold }}>Email:</strong> <span style={{ color: theme.text }}>{myResume.extractedData?.email || "Not found"}</span></p>
                    <p><strong style={{ color: theme.gold }}>Contact:</strong> <span style={{ color: theme.text }}>{myResume.extractedData?.contact_no || "Not found"}</span></p>
                    <p><strong style={{ color: theme.gold }}>Skills:</strong> <span style={{ color: theme.text }}>{myResume.extractedData?.technical_skills || "Not found"}</span></p>
                    <p><strong style={{ color: theme.gold }}>Projects:</strong> <span style={{ color: theme.text }}>{myResume.extractedData?.project_details || "Not found"}</span></p>
                    <p><strong style={{ color: theme.gold }}>Certifications:</strong> <span style={{ color: theme.text }}>{myResume.extractedData?.certifications || "Not found"}</span></p>
                    <p><strong style={{ color: theme.gold }}>Other Info:</strong> <span style={{ color: theme.text }}>{myResume.extractedData?.other_info || "Not found"}</span></p>
                  </div>
                </details>

                {/* ── ATS Resume Generator ── */}
                <div className="mt-4 p-4 rounded-xl border" style={{ backgroundColor: 'rgba(212, 168, 67, 0.05)', borderColor: theme.border }}>
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
                          className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition hover:opacity-80"
                          style={{ backgroundColor: theme.gold, color: '#fff' }}
                        >
                          <FaFileAlt size={11} /> {showAtsPreview ? "Hide Preview" : "Preview"}
                        </button>
                        <button
                          onClick={handleDownloadATS}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition hover:opacity-80"
                          style={{ borderColor: theme.gold, color: theme.gold, backgroundColor: 'transparent' }}
                        >
                          <FaDownload size={11} /> Download HTML
                        </button>
                        <button
                          onClick={handleGenerateATS}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition hover:opacity-80"
                          style={{ borderColor: theme.border, color: theme.textSecondary, backgroundColor: 'transparent' }}
                        >
                          <FaMagic size={11} /> Regenerate
                        </button>
                      </div>

                      {showAtsPreview && (
                        <div className="mt-3 rounded-lg border overflow-hidden" style={{ borderColor: theme.border }}>
                          <div className="p-2 text-xs font-medium border-b flex items-center justify-between" style={{ backgroundColor: theme.bgInput, borderColor: theme.border, color: theme.textSecondary }}>
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
                        atsGenerating ? "opacity-60 cursor-not-allowed" : "text-white hover:opacity-80"
                      }`}
                      style={{ backgroundColor: atsGenerating ? theme.border : theme.gold }}
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
              <div className="rounded-xl border shadow-sm p-8 text-center" style={{ backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.textSecondary }}>
                No interviews scheduled yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {interviews.map((interview) => {
                  const status = interview.status?.toLowerCase ? interview.status.toLowerCase() : interview.status;
                  return (
                    <div key={interview._id} className="rounded-xl border shadow-sm p-5 hover:shadow-md transition" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(212, 168, 67, 0.1)' }}>
                          <FaCalendarAlt style={{ color: theme.gold }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold" style={{ color: theme.text }}>{interview.job.title}</h3>
                          <div className="text-sm space-y-1 mt-1" style={{ color: theme.textSecondary }}>
                            <p><FaClock className="inline mr-1" size={12} style={{ color: theme.gold }} /> {new Date(interview.scheduledAt).toLocaleString()}</p>
                            <p><FaMapMarkerAlt className="inline mr-1" size={12} style={{ color: theme.gold }} /> {interview.location}</p>
                            <p>Duration: {interview.duration} min</p>
                            {interview.meetingLink && (
                              <p><FaVideo className="inline mr-1" size={12} style={{ color: theme.gold }} /> <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: theme.gold }}>Join meeting</a></p>
                            )}
                            {interview.notes && (
                              <p className="text-sm" style={{ color: theme.textSecondary }}>📝 {interview.notes}</p>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              status === "scheduled" ? "bg-green-900/30 text-green-400" : 
                              "bg-yellow-900/30 text-yellow-400"
                            }`}>
                              {status}
                            </span>
                            {status === "scheduled" && interview.callActive ? (
                              <button
                                onClick={() => setVideoCallRoom(interview._id)}
                                className="mt-2 text-white px-3 py-1 rounded hover:opacity-80 transition text-xs flex items-center gap-1"
                                style={{ backgroundColor: theme.gold }}
                              >
                                <FaVideo size={12} /> Join Call
                              </button>
                            ) : status === "scheduled" ? (
                              <p className="mt-2 text-xs" style={{ color: theme.textSecondary }}>Waiting for HR to start the call.</p>
                            ) : null}
                            {interview.feedback && interview.feedback.decision && (
                              <div className="mt-3 pt-2 border-t" style={{ borderColor: theme.border }}>
                                <p className="text-sm font-medium" style={{ color: theme.text }}>Feedback:</p>
                                <p className="text-sm" style={{ color: theme.textSecondary }}>Rating: {interview.feedback.rating}/5</p>
                                <p className="text-sm" style={{ color: theme.textSecondary }}>Comments: {interview.feedback.comments}</p>
                                <p className="text-sm font-medium">Decision: <span className={`${
                                  interview.feedback.decision === "selected" ? "text-green-400" : 
                                  interview.feedback.decision === "rejected" ? "text-red-400" : 
                                  "text-yellow-400"
                                }`}>{interview.feedback.decision}</span></p>
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 p-4 rounded-xl border bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-transparent" style={{ borderColor: theme.border }}>
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: theme.text }}>
                  <FaCode className="text-purple-400" /> Assigned Coding Assessments
                </h2>
                <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>
                  Complete technical coding tests assigned by your LPU Faculty or HR recruiters.
                </p>
              </div>
              <button
                onClick={() => navigate("/test-compiler")}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition shadow flex items-center gap-2 shrink-0"
              >
                <FaCode size={14} /> Open Practice Code Sandbox
              </button>
            </div>
            {codingTests.length === 0 ? (
              <div className="rounded-xl border shadow-sm p-8 text-center" style={{ backgroundColor: theme.bgCard, borderColor: theme.border, color: theme.textSecondary }}>
                No coding assessments assigned to you yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {codingTests.map((t) => (
                  <div key={t._id} className="rounded-xl border shadow-sm p-5 hover:shadow-md transition space-y-3" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg" style={{ color: theme.text }}>{t.title}</h3>
                      <span className="text-xs px-2.5 py-1 rounded-full uppercase font-mono font-bold bg-purple-900/40 text-purple-300 border border-purple-500/30">
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

                    <div className="pt-2 flex items-center justify-between border-t" style={{ borderColor: theme.border }}>
                      <div>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          t.status === "submitted" ? "bg-blue-900/40 text-blue-400 border border-blue-500/30" :
                          t.status === "reviewed" ? "bg-emerald-900/40 text-emerald-400 border border-emerald-500/30" :
                          t.status === "in_progress" ? "bg-amber-900/40 text-amber-400 border border-amber-500/30 animate-pulse" :
                          "bg-purple-900/40 text-purple-300 border border-purple-500/30"
                        }`}>
                          {t.status}
                        </span>
                        {t.verdict && (
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded font-bold uppercase ${
                            t.verdict === "passed" ? "text-green-400" : "text-red-400"
                          }`}>
                            ({t.verdict})
                          </span>
                        )}
                      </div>

                      {t.status !== "submitted" && t.status !== "reviewed" ? (
                        <button
                          onClick={() => setActiveTestId(t._id)}
                          className="px-4 py-1.5 rounded-lg text-white font-semibold text-xs flex items-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md transition"
                        >
                          <FaCode size={12} /> {t.status === "in_progress" ? "Continue Test" : "Start Test (Full Screen)"}
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
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