const Application = require("../models/Application");
const Job = require("../models/Job");

const VALID_APPLICATION_STATUSES = ["pending", "shortlisted", "coding_test_assigned", "coding_test_submitted", "coding_test_passed", "coding_test_failed", "rejected"];
const ALLOWED_JOB_MANAGEMENT_ROLES = ["Admin", "LPU Admin", "HR", "LPU Faculty"];

const canManageJob = (req, job) => {
  if (!job) return false;
  return (
    job.postedBy.toString() === req.user.id ||
    ALLOWED_JOB_MANAGEMENT_ROLES.includes(req.user.role)
  );
};

exports.getApplicants = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (!canManageJob(req, job)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const isLpuFaculty = req.user.role === "LPU Faculty";
    const studentFilter = isLpuFaculty && job.scope === "lpu" && Array.isArray(job.allocatedStudents) && job.allocatedStudents.length > 0
      ? { student: { $in: job.allocatedStudents } }
      : {};

    const applications = await Application.find({ job: jobId, ...studentFilter })
      .populate("student", "name email uid")
      .populate("job", "title allocatedStudents allocatedFaculty");
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
    if (!canManageJob(req, app.job)) {
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
    if (!(["Student", "LPU Student"].includes(req.user.role))) {
      return res.status(403).json({ message: "Only students can apply" });
    }
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.scope === "lpu" && Array.isArray(job.allocatedStudents) && job.allocatedStudents.length > 0) {
      const isAssignedStudent = job.allocatedStudents.some((studentId) => studentId.toString() === req.user.id);
      if (!isAssignedStudent) {
        return res.status(403).json({ message: "This LPU job is assigned only to the selected students." });
      }
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
    if (!(["Student", "LPU Student"].includes(req.user.role))) {
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
