import { useEffect, useState } from "react";
import {
  FaPlus,
  FaEye,
  FaTrash,
  FaUsers,
  FaBriefcase,
  FaCheck,
  FaTimes,
  FaFileAlt,
} from "react-icons/fa";
import api from "../services/api";

function HRDashboard() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
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

  useEffect(() => {
    fetchJobs();
  }, []);

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
      await api.put(`/applications/applications/${applicationId}/status`, { status });
      alert(`Application ${status}`);
      fetchApplicants(selectedJobId);
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">💼 HR Dashboard</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FaPlus /> Post Job
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="text-2xl font-bold">{stats.totalJobs}</p>
              </div>
              <FaBriefcase className="text-blue-500 text-2xl" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Applicants</p>
                <p className="text-2xl font-bold">{stats.totalApplicants}</p>
              </div>
              <FaUsers className="text-green-500 text-2xl" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Shortlisted</p>
                <p className="text-2xl font-bold">{stats.shortlisted}</p>
              </div>
              <FaCheck className="text-yellow-500 text-2xl" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <FaTimes className="text-red-500 text-2xl" />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-6 border-b">
          <button
            className={`pb-2 px-4 ${activeTab === "jobs" ? "border-b-2 border-blue-500 font-semibold" : "text-gray-500"}`}
            onClick={() => setActiveTab("jobs")}
          >
            My Jobs
          </button>
          <button
            className={`pb-2 px-4 ${activeTab === "applicants" ? "border-b-2 border-blue-500 font-semibold" : "text-gray-500"}`}
            onClick={handleApplicantsClick}
          >
            Applicants
          </button>
        </div>

        {activeTab === "jobs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div key={job._id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
                <h3 className="text-lg font-semibold">{job.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{job.location}</p>
                <p className="text-sm text-gray-700 mt-2 line-clamp-2">{job.description}</p>
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => fetchApplicants(job._id)}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <FaEye /> View Applicants
                  </button>
                  <button
                    onClick={() => handleDeleteJob(job._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "applicants" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resume</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app._id}>
                      <td className="px-6 py-4">{app.student?.name || "Unknown"}</td>
                      <td className="px-6 py-4">{app.student?.email || ""}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${app.status === "shortlisted" ? "bg-green-100 text-green-800" : app.status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => viewResume(app.student._id)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <FaFileAlt /> View
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleStatusUpdate(app._id, "shortlisted")} className="bg-green-500 text-white px-3 py-1 rounded mr-2 hover:bg-green-600">Shortlist</button>
                        <button onClick={() => handleStatusUpdate(app._id, "rejected")} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Resume Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Resume Details</h2>
              <button onClick={() => { setShowResumeModal(false); setSelectedResume(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            {loadingResume ? (
              <p>Loading...</p>
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
              <p>No resume data</p>
            )}
          </div>
        </div>
      )}

      {/* Post Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Post New Job</h2>
            <form onSubmit={handleCreateJob}>
              <div className="space-y-4">
                <input type="text" placeholder="Job Title" value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} required className="w-full border rounded px-3 py-2" />
                <textarea placeholder="Description" value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} required rows="3" className="w-full border rounded px-3 py-2" />
                <input type="text" placeholder="Requirements (comma separated)" value={newJob.requirements} onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })} required className="w-full border rounded px-3 py-2" />
                <input type="text" placeholder="Location" value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} required className="w-full border rounded px-3 py-2" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HRDashboard;
