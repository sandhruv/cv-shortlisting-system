const Job = require("../models/Job");
const Application = require("../models/Application");
const User = require("../models/User");
const { cacheGet, cacheSet, cacheDelPattern, isRedisConnected } = require("../config/redis");

exports.createJob = async (req, res) => {
  try {
    const { title, description, requirements, location, allocatedFaculty, allocatedStudents } = req.body;
    if (!title || !description || !location) {
      return res.status(400).json({ message: "Title, description, and location are required" });
    }

    const scope = ["LPU Admin", "LPU Faculty"].includes(req.user.role) ? "lpu" : "general";

    const job = await Job.create({
      title,
      description,
      requirements,
      location,
      scope,
      postedBy: req.user.id,
      allocatedFaculty: allocatedFaculty || null,
      allocatedStudents: Array.isArray(allocatedStudents) ? allocatedStudents : [],
    });

    // Invalidate jobs cache
    if (isRedisConnected()) {
      await cacheDelPattern("cache:*jobs*");
      await cacheDelPattern("analytics:*");
    }

    res.status(201).json({ message: "Job created", job });
  } catch (err) {
    console.error("❌ Error in createJob:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getJobs = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "Admin") {
      query = {};
    } else if (req.user.role === "HR") {
      query.postedBy = req.user.id;
    } else if (req.user.role === "Student") {
      const hrUsers = await User.find({ role: "HR" }).select("_id");
      const hrUserIds = hrUsers.map((u) => u._id);
      query = {
        $or: [
          { postedBy: { $in: hrUserIds } },
          { scope: "general" },
          { scope: { $ne: "lpu" } },
          { scope: { $exists: false } },
          { scope: null }
        ]
      };
    } else if (req.user.role === "LPU Student") {
      query = {
        scope: "lpu",
        allocatedStudents: req.user.id
      };
    } else if (req.user.role === "LPU Faculty") {
      query.scope = "lpu";
      query.allocatedFaculty = req.user.id;
    } else if (req.user.role === "LPU Admin") {
      query.scope = "lpu";
    }

    // Non-paginated: return array (backward compatible)
    if (!req.query.page) {
      const cacheKey = `cache:jobs:${req.user.role}:${req.user.id}:all`;
      if (isRedisConnected()) {
        const cached = await cacheGet(cacheKey);
        if (cached) return res.json(cached);
      }

      const jobs = await Job.find(query)
        .populate("postedBy", "name email role")
        .populate("allocatedFaculty", "name uid role")
        .populate("allocatedStudents", "name uid role")
        .sort({ createdAt: -1 });

      if (isRedisConnected()) {
        await cacheSet(cacheKey, jobs, 60);
      }

      return res.json(jobs);
    }

    // Paginated: return object with metadata
    const cacheKey = `cache:jobs:${req.user.role}:${req.user.id}:page:${req.query.page}:limit:${req.query.limit || 50}`;
    if (isRedisConnected()) {
      const cached = await cacheGet(cacheKey);
      if (cached) return res.json(cached);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate("postedBy", "name email role")
        .populate("allocatedFaculty", "name uid role")
        .populate("allocatedStudents", "name uid role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Job.countDocuments(query),
    ]);

    const result = { data: jobs, total, page, pages: Math.ceil(total / limit) };

    if (isRedisConnected()) {
      await cacheSet(cacheKey, result, 60);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.postedBy.toString() !== req.user.id && !(["Admin", "LPU Admin", "LPU Faculty"].includes(req.user.role))) {
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

    // Invalidate cache
    if (isRedisConnected()) {
      await cacheDelPattern("cache:*jobs*");
      await cacheDelPattern("analytics:*");
    }

    res.json({ message: "Job updated", job: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.postedBy.toString() !== req.user.id && !(["Admin", "LPU Admin", "LPU Faculty"].includes(req.user.role))) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await job.deleteOne();
    await Application.deleteMany({ job: req.params.id });

    // Invalidate cache
    if (isRedisConnected()) {
      await cacheDelPattern("cache:*jobs*");
      await cacheDelPattern("analytics:*");
    }

    res.json({ message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
