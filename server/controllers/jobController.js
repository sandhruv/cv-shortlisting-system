const Job = require("../models/Job");
const Application = require("../models/Application");

exports.createJob = async (req, res) => {
  console.log("🔧 createJob called");
  console.log("req.user:", req.user);
  console.log("req.body:", req.body);
  try {
    const { title, description, requirements, location } = req.body;
    const job = await Job.create({
      title,
      description,
      requirements,
      location,
      postedBy: req.user.id,
    });
    console.log("✅ Job created:", job);
    res.status(201).json({ message: "Job created", job });
  } catch (err) {
    console.error("❌ Error in createJob:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getJobs = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "HR") query.postedBy = req.user.id;
    const jobs = await Job.find(query).populate("postedBy", "name email");
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.postedBy.toString() !== req.user.id && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized" });
    }
    const updated = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: "Job updated", job: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.postedBy.toString() !== req.user.id && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized" });
    }
    await job.deleteOne();
    await Application.deleteMany({ job: req.params.id });
    res.json({ message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
