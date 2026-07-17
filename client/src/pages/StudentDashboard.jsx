import { useEffect, useState } from "react";
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
} from "react-icons/fa";
import api from "../services/api";
import VideoCall from "../components/VideoCall";

function StudentDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [myResume, setMyResume] = useState(null);
  const [activeTab, setActiveTab] = useState("jobs");
  const [searchTerm, setSearchTerm] = useState("");
  const [interviews, setInterviews] = useState([]);
  const [videoCallRoom, setVideoCallRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user") || "{}");
  });

  // Golden dark theme colors
  const theme = {
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
      alert("Failed to load jobs");
    }
  };

  const fetchMyApps = async () => {
    try {
      const res = await api.get("/applications/me");
      setMyApps(res.data);
    } catch (err) {
      alert("Failed to load applications");
    }
  };

  const fetchMyResume = async () => {
    try {
      const res = await api.get("/resume/me");
      setMyResume(res.data);
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

  useEffect(() => {
    fetchJobs();
    fetchMyApps();
    fetchMyResume();
    fetchMyInterviews();
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
        alert("Only PDF, DOC, DOCX allowed");
        e.target.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File must be less than 5MB");
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
      alert("CV uploaded and processed successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

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
      <header className="border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: theme.gold }}>
            <FaBuilding className="text-white text-lg" />
          </div>
          <span className="text-xl font-semibold tracking-tight" style={{ color: theme.text }}>
            Nexus<span style={{ color: theme.gold }}>Corp</span>
          </span>
          <span className="ml-3 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(212, 168, 67, 0.2)', color: theme.gold }}>
            Student
          </span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm transition" style={{ color: theme.textSecondary }} onMouseEnter={(e) => e.currentTarget.style.color = theme.text} onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}>
          <FaSignOutAlt size={16} /> Sign out
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-6" style={{ color: theme.text }}>Student Dashboard</h1>

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
                      <h3 className="text-lg font-semibold" style={{ color: theme.text }}>{job.title}</h3>
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
                                alert("Please upload your resume first (go to My Resume tab)");
                                return;
                              }
                              try {
                                await api.post(`/applications/jobs/${job._id}/apply`);
                                alert("Application submitted!");
                                fetchMyApps();
                              } catch (err) {
                                alert(err.response?.data?.message || "Application failed");
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
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: theme.border }}>
                  {myApps.map((app) => (
                    <tr key={app._id}>
                      <td className="px-6 py-4 text-sm" style={{ color: theme.text }}>{app.job.title}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: theme.textSecondary }}>{app.job.location}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          app.status === "shortlisted" ? "bg-green-900/30 text-green-400" : 
                          app.status === "rejected" ? "bg-red-900/30 text-red-400" : 
                          "bg-yellow-900/30 text-yellow-400"
                        }`}>{app.status}</span>
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
      </div>

      {/* Video Call Modal */}
      {videoCallRoom && (
        <VideoCall roomId={videoCallRoom} user={currentUser} onClose={() => setVideoCallRoom(null)} />
      )}
    </div>
  );
}

export default StudentDashboard;