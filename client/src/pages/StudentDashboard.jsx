import { useEffect, useState } from "react";
import { FaUpload, FaFileAlt, FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";
import api from "../services/api";

function StudentDashboard() {
  const [jobs, setJobs] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // "success" | "error"
  const [myResume, setMyResume] = useState(null);
  const [activeTab, setActiveTab] = useState("jobs");

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

  useEffect(() => {
    fetchJobs();
    fetchMyApps();
    fetchMyResume();
  }, []);

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
    setUploadStatus(null);
    try {
      const res = await api.post("/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadStatus("success");
      setSelectedFile(null);
      // Reset file input
      document.getElementById("fileInput").value = "";
      fetchMyResume();
      alert("CV uploaded and processed successfully!");
    } catch (err) {
      setUploadStatus("error");
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">🎓 Student Dashboard</h1>

        <div className="flex gap-4 mb-6 border-b">
          <button className={`pb-2 px-4 ${activeTab === "jobs" ? "border-b-2 border-blue-500 font-semibold" : "text-gray-500"}`} onClick={() => setActiveTab("jobs")}>Browse Jobs</button>
          <button className={`pb-2 px-4 ${activeTab === "myapps" ? "border-b-2 border-blue-500 font-semibold" : "text-gray-500"}`} onClick={() => setActiveTab("myapps")}>My Applications</button>
          <button className={`pb-2 px-4 ${activeTab === "resume" ? "border-b-2 border-blue-500 font-semibold" : "text-gray-500"}`} onClick={() => setActiveTab("resume")}>My Resume</button>
        </div>

        {activeTab === "jobs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => {
              const applied = hasApplied(job._id);
              const status = getStatus(job._id);
              return (
                <div key={job._id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
                  <h3 className="text-lg font-semibold">{job.title}</h3>
                  <p className="text-sm text-gray-600">{job.location}</p>
                  <p className="text-sm text-gray-700 mt-2">{job.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Requirements: {job.requirements}</p>
                  <div className="flex justify-between items-center mt-4">
                    {applied ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status === "shortlisted" ? "bg-green-100 text-green-800" : status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{status}</span>
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
                        className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                      >
                        Apply
                      </button>
                    )}
                    <span className="text-xs text-gray-400">Posted by {job.postedBy?.name || "HR"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "myapps" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {myApps.map((app) => (
                    <tr key={app._id}>
                      <td className="px-6 py-4">{app.job.title}</td>
                      <td className="px-6 py-4">{app.job.location}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${app.status === "shortlisted" ? "bg-green-100 text-green-800" : app.status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{app.status}</span>
                      </td>
                      <td className="px-6 py-4">{new Date(app.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "resume" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Your Resume/CV</h2>
            <p className="text-gray-600 mb-4">Upload your resume (PDF, DOC, DOCX) to apply for jobs. The system will extract your details and store them securely.</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Choose file</label>
              <input
                id="fileInput"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded border">
                <FaFileAlt className="text-blue-500" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <button
                  onClick={() => { setSelectedFile(null); document.getElementById("fileInput").value = ""; }}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className={`mt-4 px-6 py-2 rounded flex items-center gap-2 ${!selectedFile || uploading ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
            >
              <FaUpload /> {uploading ? "Processing..." : "Upload & Process"}
            </button>

            {myResume && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold mb-2">Last Uploaded Resume</h3>
                <p className="text-sm">File: {myResume.fileName}</p>
                <p className="text-sm">Status: {myResume.status}</p>
                <p className="text-sm">Uploaded: {new Date(myResume.createdAt).toLocaleString()}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600 hover:underline">View extracted data</summary>
                  <div className="mt-2 bg-gray-50 p-3 rounded text-sm">
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
      </div>
    </div>
  );
}

export default StudentDashboard;
