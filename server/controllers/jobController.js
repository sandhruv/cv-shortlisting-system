const Job = require("../models/Job");
const Application = require("../models/Application");

exports.createJob = async (req, res) => {
  try {
    const { title, description, requirements, location } = req.body;
    if (!title || !description || !location) {
      return res.status(400).json({ message: "Title, description, and location are required" });
    }
    const job = await Job.create({
      title,
      description,
      requirements,
      location,
      postedBy: req.user.id,
    });
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
    const { title, description, requirements, location } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (requirements !== undefined) updates.requirements = requirements;
    if (location !== undefined) updates.location = location;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update" });
    }
    const updated = await Job.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
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
