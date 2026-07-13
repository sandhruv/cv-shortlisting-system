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
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b border-[#e9edf4] px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#0f172a] rounded-lg flex items-center justify-center shadow-sm">
            <FaBuilding className="text-white text-lg" />
          </div>
          <span className="text-xl font-semibold text-[#0f172a] tracking-tight">
            Nexus<span className="text-[#1e293b]">Corp</span>
          </span>
          <span className="ml-3 text-xs font-medium text-[#94a3b8] bg-[#f1f5f9] px-2 py-0.5 rounded-full">Student</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-[#64748b] hover:text-[#0f172a] transition">
          <FaSignOutAlt size={16} /> Sign out
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-[#0f172a] mb-6">Student Dashboard</h1>

        <div className="flex gap-2 mb-6 border-b border-[#e9edf4]">
          <button
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "jobs" ? "border-b-2 border-[#0f172a] text-[#0f172a]" : "text-[#64748b] hover:text-[#0f172a]"}`}
            onClick={() => setActiveTab("jobs")}
          >
            Browse Jobs
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "myapps" ? "border-b-2 border-[#0f172a] text-[#0f172a]" : "text-[#64748b] hover:text-[#0f172a]"}`}
            onClick={() => setActiveTab("myapps")}
          >
            My Applications
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "resume" ? "border-b-2 border-[#0f172a] text-[#0f172a]" : "text-[#64748b] hover:text-[#0f172a]"}`}
            onClick={() => setActiveTab("resume")}
          >
            My Resume
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition ${activeTab === "interviews" ? "border-b-2 border-[#0f172a] text-[#0f172a]" : "text-[#64748b] hover:text-[#0f172a]"}`}
            onClick={() => setActiveTab("interviews")}
          >
            My Interviews
          </button>
        </div>

        {activeTab === "jobs" && (
          <div>
            <div className="mb-6">
              <div className="relative max-w-md">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="Search jobs by title, location, or HR..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e2e8f0] rounded-lg text-sm text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:ring-1 focus:ring-[#0f172a] focus:border-[#0f172a]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.length === 0 ? (
                <div className="col-span-full text-center py-12 text-[#94a3b8]">
                  {searchTerm ? "No jobs match your search." : "No jobs available right now."}
                </div>
              ) : (
                filteredJobs.map((job) => {
                  const applied = hasApplied(job._id);
                  const status = getStatus(job._id);
                  return (
                    <div key={job._id} className="bg-white rounded-xl border border-[#e9edf4] shadow-sm p-5 hover:shadow-md transition">
                      <h3 className="text-lg font-semibold text-[#0f172a]">{job.title}</h3>
                      <p className="text-sm text-[#64748b] mt-1">{job.location}</p>
                      <p className="text-sm text-[#64748b] mt-2 line-clamp-2">{job.description}</p>
                      <p className="text-xs text-[#94a3b8] mt-1">Requirements: {job.requirements}</p>
                      <div className="flex justify-between items-center mt-4">
                        {applied ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${status === "shortlisted" ? "bg-[#d1fae5] text-[#065f46]" : status === "rejected" ? "bg-[#fee2e2] text-[#991b1b]" : "bg-[#fef3c7] text-[#92400e]"}`}>{status}</span>
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
                            className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-4 py-1 rounded text-sm transition"
                          >
                            Apply
                          </button>
                        )}
                        <span className="text-xs text-[#94a3b8]">Posted by {job.postedBy?.name || "HR"}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === "myapps" && (
          <div className="bg-white rounded-xl border border-[#e9edf4] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Job</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#64748b] uppercase tracking-wider">Applied On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {myApps.map((app) => (
                    <tr key={app._id}>
                      <td className="px-6 py-4 text-sm text-[#0f172a]">{app.job.title}</td>
                      <td className="px-6 py-4 text-sm text-[#64748b]">{app.job.location}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${app.status === "shortlisted" ? "bg-[#d1fae5] text-[#065f46]" : app.status === "rejected" ? "bg-[#fee2e2] text-[#991b1b]" : "bg-[#fef3c7] text-[#92400e]"}`}>{app.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#64748b]">{new Date(app.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "resume" && (
          <div className="bg-white rounded-xl border border-[#e9edf4] shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Upload Your Resume/CV</h2>
            <p className="text-sm text-[#64748b] mb-4">Upload your resume (PDF, DOC, DOCX) to apply for jobs. The system will extract your details and store them securely.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#1e293b] mb-2">Choose file</label>
              <input
                id="fileInput"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="block w-full text-sm text-[#64748b] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#f1f5f9] file:text-[#0f172a] hover:file:bg-[#e2e8f0] transition"
              />
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 bg-[#f8fafc] p-3 rounded-lg border border-[#e9edf4]">
                <FaFileAlt className="text-[#0f172a]" />
                <span className="text-sm font-medium text-[#0f172a]">{selectedFile.name}</span>
                <button onClick={() => { setSelectedFile(null); document.getElementById("fileInput").value = ""; }} className="ml-auto text-[#ef4444] hover:text-[#dc2626] text-sm">Remove</button>
              </div>
            )}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className={`mt-4 px-6 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${!selectedFile || uploading ? "bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed" : "bg-[#0f172a] hover:bg-[#1e293b] text-white"}`}
            >
              <FaUpload /> {uploading ? "Processing..." : "Upload & Process"}
            </button>
            {myResume && (
              <div className="mt-6 border-t border-[#e9edf4] pt-4">
                <h3 className="font-semibold text-[#0f172a] mb-2">Last Uploaded Resume</h3>
                <p className="text-sm text-[#64748b]">File: {myResume.fileName}</p>
                <p className="text-sm text-[#64748b]">Status: {myResume.status}</p>
                <p className="text-sm text-[#64748b]">Uploaded: {new Date(myResume.createdAt).toLocaleString()}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-[#0f172a] font-medium hover:underline">View extracted data</summary>
                  <div className="mt-2 bg-[#f8fafc] p-3 rounded-lg text-sm border border-[#e9edf4]">
                    <p><strong>Email:</strong> {myResume.extractedData?.email || "Not found"}</p>
                    <p><strong>Contact:</strong> {myResume.extractedData?.contact_no || "Not found"}</p>
                    <p><strong>Skills:</strong> {myResume.extractedData?.technical_skills || "Not found"}</p>
                    <p><strong>Projects:</strong> {myResume.extractedData?.project_details || "Not found"}</p>
                    <p><strong>Certifications:</strong> {myResume.extractedData?.certifications || "Not found"}</p>
                    <p><strong>Other Info:</strong> {myResume.extractedData?.other_info || "Not found"}</p>
                  </div>
                </details>
              </div>
            )}
          </div>
        )}

        {activeTab === "interviews" && (
          <div>
            <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Upcoming Interviews</h2>
            {interviews.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#e9edf4] shadow-sm p-8 text-center text-[#64748b]">
                No interviews scheduled yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {interviews.map((interview) => {
                  const status = interview.status?.toLowerCase ? interview.status.toLowerCase() : interview.status;
                  return (
                    <div key={interview._id} className="bg-white rounded-xl border border-[#e9edf4] shadow-sm p-5 hover:shadow-md transition">
                      <div className="flex items-start gap-3">
                        <div className="bg-[#f1f5f9] p-2 rounded-lg">
                          <FaCalendarAlt className="text-[#0f172a]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#0f172a]">{interview.job.title}</h3>
                          <div className="text-sm text-[#64748b] space-y-1 mt-1">
                            <p><FaClock className="inline mr-1" size={12} /> {new Date(interview.scheduledAt).toLocaleString()}</p>
                            <p><FaMapMarkerAlt className="inline mr-1" size={12} /> {interview.location}</p>
                            <p>Duration: {interview.duration} min</p>
                            {interview.meetingLink && (
                              <p><FaVideo className="inline mr-1" size={12} /> <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="text-[#0f172a] underline">Join meeting</a></p>
                            )}
                            {interview.notes && (
                              <p className="text-sm text-[#64748b]">📝 {interview.notes}</p>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${status === "scheduled" ? "bg-[#d1fae5] text-[#065f46]" : "bg-[#fef3c7] text-[#92400e]"}`}>
                              {status}
                            </span>
                            {status === "scheduled" && (
                              <button
                                onClick={() => setVideoCallRoom(getInterviewRoom(interview))}
                                className="mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition text-xs flex items-center gap-1"
                              >
                                <FaVideo size={12} /> Join Call
                              </button>
                            )}
                            {interview.feedback && interview.feedback.decision && (
                              <div className="mt-3 pt-2 border-t border-[#e9edf4]">
                                <p className="text-sm font-medium">Feedback:</p>
                                <p className="text-sm text-[#64748b]">Rating: {interview.feedback.rating}/5</p>
                                <p className="text-sm text-[#64748b]">Comments: {interview.feedback.comments}</p>
                                <p className="text-sm font-medium">Decision: <span className={`${interview.feedback.decision === "selected" ? "text-green-600" : interview.feedback.decision === "rejected" ? "text-red-600" : "text-yellow-600"}`}>{interview.feedback.decision}</span></p>
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
        <VideoCall roomName={videoCallRoom} onClose={() => setVideoCallRoom(null)} />
      )}
    </div>
  );
}

export default StudentDashboard;
