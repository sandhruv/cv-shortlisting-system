const Job = require("../models/Job");
const Application = require("../models/Application");
const User = require("../models/User");
const Resume = require("../models/Resume");
const { cacheGet, cacheSet, cacheDelPattern, isRedisConnected } = require("../config/redis");

exports.getHRStats = async (req, res) => {
  try {
    if (!["HR", "Admin", "LPU Admin", "LPU Faculty"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied." });
    }

    // Check cache first
    const cacheKey = `analytics:hr:${req.user.id}`;
    if (isRedisConnected()) {
      const cached = await cacheGet(cacheKey);
      if (cached) return res.json(cached);
    }

    let jobQuery = {};
    if (req.user.role === "HR") {
      jobQuery.postedBy = req.user.id;
    } else if (["LPU Admin", "LPU Faculty"].includes(req.user.role)) {
      jobQuery.scope = "lpu";
    }
    const jobs = await Job.find(jobQuery).select("_id title");
    const jobIds = jobs.map(j => j._id);

    const totalJobs = jobs.length;

    const [statusCounts, appsPerJob, recentApps] = await Promise.all([
      Application.aggregate([
        { $match: { job: { $in: jobIds } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Application.aggregate([
        { $match: { job: { $in: jobIds } } },
        { $group: { _id: "$job", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Application.find({ job: { $in: jobIds } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("student", "name")
        .populate("job", "title"),
    ]);

    const totalApplications = statusCounts.reduce((sum, s) => sum + s.count, 0);
    const shortlisted = statusCounts.find(s => s._id === "shortlisted")?.count || 0;
    const rejected = statusCounts.find(s => s._id === "rejected")?.count || 0;
    const pending = statusCounts.find(s => s._id === "pending")?.count || 0;

    const titleMap = {};
    jobs.forEach(j => { titleMap[j._id.toString()] = j.title; });
    const appsPerJobResult = appsPerJob.map(a => ({
      title: titleMap[a._id.toString()] || "Unknown",
      applications: a.count,
    }));

    // Cache for 2 minutes
    if (isRedisConnected()) {
      await cacheSet(cacheKey, result, 120);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    // Check cache first
    const cacheKey = "analytics:admin";
    if (isRedisConnected()) {
      const cached = await cacheGet(cacheKey);
      if (cached) return res.json(cached);
    }

    const totalUsers = await User.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalApplications = await Application.countDocuments();
    const totalResumes = await Resume.countDocuments();

    const shortlisted = await Application.countDocuments({ status: "shortlisted" });
    const rejected = await Application.countDocuments({ status: "rejected" });
    const pending = await Application.countDocuments({ status: "pending" });

    const jobIds = await Job.find().select("_id title");
    const appsPerJob = await Application.aggregate([
      { $match: { job: { $in: jobIds.map(j => j._id) } } },
      { $group: { _id: "$job", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    const titleMap = {};
    jobIds.forEach(j => { titleMap[j._id.toString()] = j.title; });
    const appsPerJobResult = appsPerJob.map(a => ({
      title: titleMap[a._id.toString()] || "Unknown",
      applications: a.count,
    }));

    const result = {
      totalUsers,
      totalJobs,
      totalApplications,
      totalResumes,
      shortlisted,
      rejected,
      pending,
      appsPerJob: appsPerJobResult,
    };

    // Cache for 3 minutes
    if (isRedisConnected()) {
      await cacheSet(cacheKey, result, 180);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

