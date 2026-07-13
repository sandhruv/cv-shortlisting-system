const Application = require("../models/Application");
const Job = require("../models/Job");

const VALID_APPLICATION_STATUSES = ["pending", "shortlisted", "rejected"];

exports.getApplicants = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.postedBy.toString() !== req.user.id && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized" });
    }
    const applications = await Application.find({ job: jobId })
      .populate("student", "name email")
      .populate("job", "title");
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || typeof status !== "string" || !VALID_APPLICATION_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid application status" });
    }
    const app = await Application.findById(req.params.id).populate("job");
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (app.job.postedBy.toString() !== req.user.id && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized" });
    }
    app.status = status;
    await app.save();
    res.json({ message: "Application status updated", application: app });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.applyToJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    if (req.user.role !== "Student") {
      return res.status(403).json({ message: "Only students can apply" });
    }
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    const existing = await Application.findOne({ job: jobId, student: req.user.id });
    if (existing) {
      return res.status(400).json({ message: "Already applied" });
    }
    const application = await Application.create({
      job: jobId,
      student: req.user.id,
      status: "pending",
    });
    res.status(201).json({ message: "Applied successfully", application });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Student: get my applications
exports.getMyApplications = async (req, res) => {
  try {
    if (req.user.role !== "Student") {
      return res.status(403).json({ message: "Only students can access" });
    }
    const applications = await Application.find({ student: req.user.id })
      .populate("job", "title description location")
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
