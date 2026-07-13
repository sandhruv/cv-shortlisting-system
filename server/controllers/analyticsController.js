const Job = require("../models/Job");
const Application = require("../models/Application");
const User = require("../models/User");
const Resume = require("../models/Resume");

exports.getHRStats = async (req, res) => {
  try {
    if (req.user.role !== "HR" && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    let jobQuery = {};
    if (req.user.role === "HR") {
      jobQuery.postedBy = req.user.id;
    }
    const jobs = await Job.find(jobQuery).select("_id title");
    const jobIds = jobs.map(j => j._id);

    const totalJobs = jobs.length;

    const applications = await Application.find({ job: { $in: jobIds } });
    const totalApplications = applications.length;
    const shortlisted = applications.filter(a => a.status === "shortlisted").length;
    const rejected = applications.filter(a => a.status === "rejected").length;
    const pending = applications.filter(a => a.status === "pending").length;

    const appsPerJob = jobIds.map(jobId => {
      const count = applications.filter(a => a.job.toString() === jobId.toString()).length;
      const jobTitle = jobs.find(j => j._id.toString() === jobId.toString())?.title || "Unknown";
      return { jobId, title: jobTitle, applications: count };
    }).sort((a, b) => b.applications - a.applications);

    const recentApps = await Application.find({ job: { $in: jobIds } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("student", "name")
      .populate("job", "title");

    const shortlistRate = totalApplications > 0 ? (shortlisted / totalApplications) * 100 : 0;

    res.json({
      totalJobs,
      totalApplications,
      shortlisted,
      rejected,
      pending,
      shortlistRate: Math.round(shortlistRate * 10) / 10,
      appsPerJob: appsPerJob.slice(0, 10),
      recentApps,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalApplications = await Application.countDocuments();
    const totalResumes = await Resume.countDocuments();

    const shortlisted = await Application.countDocuments({ status: "shortlisted" });
    const rejected = await Application.countDocuments({ status: "rejected" });
    const pending = await Application.countDocuments({ status: "pending" });

    const jobIds = await Job.find().select("_id title");
    const appsPerJob = await Promise.all(jobIds.map(async (job) => {
      const count = await Application.countDocuments({ job: job._id });
      return { title: job.title, applications: count };
    }));
    appsPerJob.sort((a, b) => b.applications - a.applications);

    res.json({
      totalUsers,
      totalJobs,
      totalApplications,
      totalResumes,
      shortlisted,
      rejected,
      pending,
      appsPerJob: appsPerJob.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
