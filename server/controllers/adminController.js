const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Resume = require("../models/Resume");
const Interview = require("../models/Interview");
const bcrypt = require("bcrypt");
const xlsx = require("xlsx");
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, uid, role, password } = req.body;
    if (!name || (!email && !uid) || !role || !password) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    if (role === "Admin") {
      const adminExists = await User.findOne({ role: "Admin" });
      if (adminExists) {
        return res.status(403).json({ message: "An Admin already exists. Cannot create another Admin." });
      }
    }
    
    const finalEmail = email || (role.startsWith("LPU") && uid ? `${uid}@lpu.edu.dummy` : null);
    const isHr = role === "HR";
    const subscriptionPlan = isHr ? "trial" : "inactive";
    const trialEndsAt = isHr ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null;
    const planEndsAt = null;

    if (finalEmail) {
      const existing = await User.findOne({ email: finalEmail });
      if (existing) return res.status(400).json({ message: "Email already exists" });
    }
    if (uid) {
      const existingUid = await User.findOne({ uid });
      if (existingUid) return res.status(400).json({ message: "UID already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: finalEmail,
      uid,
      role,
      password: hashed,
      subscriptionPlan,
      trialEndsAt,
      planEndsAt,
    });
    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name,
        email: finalEmail,
        uid,
        role,
        subscriptionPlan,
        trialEndsAt,
        planEndsAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const validRoles = ["Admin", "HR", "Student"];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    if (role === "Admin") {
      const adminExists = await User.findOne({ role: "Admin" });
      if (adminExists) return res.status(403).json({ message: "An Admin already exists." });
    }
    const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Role updated", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;
    const validPlans = ["trial", "monthly", "yearly", "inactive"];

    if (!plan || !validPlans.includes(plan)) {
      return res.status(400).json({ message: "Invalid subscription plan" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "HR") {
      return res.status(400).json({ message: "Subscription plan can only be managed for HR users" });
    }

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneMonthEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const oneYearEndsAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    if (plan === "trial") {
      user.subscriptionPlan = "trial";
      user.trialEndsAt = trialEndsAt;
      user.planEndsAt = null;
    } else if (plan === "monthly") {
      user.subscriptionPlan = "monthly";
      user.trialEndsAt = null;
      user.planEndsAt = oneMonthEndsAt;
    } else if (plan === "yearly") {
      user.subscriptionPlan = "yearly";
      user.trialEndsAt = null;
      user.planEndsAt = oneYearEndsAt;
    } else {
      user.subscriptionPlan = "inactive";
      user.trialEndsAt = null;
      user.planEndsAt = null;
    }

    await user.save();
    res.json({
      message: "Subscription updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        trialEndsAt: user.trialEndsAt,
        planEndsAt: user.planEndsAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const isLpuAdmin = req.user.role === "LPU Admin";

    const userFilter = isLpuAdmin
      ? { role: { $in: ["LPU Admin", "LPU Faculty", "LPU Student"] } }
      : {};

    const jobFilter = isLpuAdmin ? { scope: "lpu" } : {};

    const totalUsers = await User.countDocuments(userFilter);
    const totalJobs = await Job.countDocuments(jobFilter);

    const jobDocs = await Job.find(jobFilter).select("_id");
    const jobIds = jobDocs.map((job) => job._id);

    const lpuStudentIds = await User.find({ role: "LPU Student" }).select("_id");
    const studentIdList = lpuStudentIds.map((user) => user._id);

    const totalApplications = await Application.countDocuments({
      job: { $in: jobIds },
    });
    const totalResumes = await Resume.countDocuments({
      student: { $in: studentIdList },
    });

    const recentJobs = await Job.find(jobFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("postedBy", "name");

    const recentApps = await Application.find({ job: { $in: jobIds } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("student", "name")
      .populate("job", "title");

    const recentResumes = await Resume.find({ student: { $in: studentIdList } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("student", "name");

    res.json({
      stats: { totalUsers, totalJobs, totalApplications, totalResumes },
      recentJobs,
      recentApps,
      recentResumes,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate("postedBy", "name email").sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllApplications = async (req, res) => {
  try {
    const apps = await Application.find()
      .populate("student", "name email")
      .populate("job", "title")
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllResumes = async (req, res) => {
  try {
    const resumes = await Resume.find()
      .populate("student", "name email")
      .sort({ createdAt: -1 });
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 👇 NEW: Get all interviews (with feedback)
exports.getAllInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find()
      .populate("job", "title")
      .populate({
        path: "application",
        populate: { path: "student", select: "name email" }
      })
      .sort({ createdAt: -1 });
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.bulkUploadLpu = async (req, res) => {
  try {
    const { targetRole } = req.body; // e.g. "LPU Faculty", "LPU Student"
    
    if (!req.file) {
      return res.status(400).json({ message: "No Excel file uploaded" });
    }
    
    const validRoles = ["LPU Faculty", "LPU Student"];
    if (!validRoles.includes(targetRole)) {
      return res.status(400).json({ message: "Invalid target role for bulk upload" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let createdCount = 0;
    let errors = [];

    for (const [index, row] of data.entries()) {
      const uid = row.UID ? String(row.UID).trim() : null;
      const password = row.Password ? String(row.Password) : null;
      const name = row.Name ? String(row.Name).trim() : `LPU User ${uid || index}`;
      const email = row.Email ? String(row.Email).trim() : `${uid || index}@lpu.edu.dummy`;
      const role = row.Role && validRoles.includes(row.Role) ? row.Role : targetRole;

      if (!uid || !password) {
        errors.push(`Row ${index + 2}: Missing UID or Password`);
        continue;
      }

      const existingUser = await User.findOne({ $or: [{ uid }, { email }] });
      if (existingUser) {
        errors.push(`Row ${index + 2}: User with UID ${uid} or Email ${email} already exists`);
        continue;
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
          name,
          email,
          uid,
          password: hashedPassword,
          role
        });
        createdCount++;
      } catch (err) {
        errors.push(`Row ${index + 2}: Failed to create user - ${err.message}`);
      }
    }

    res.status(200).json({
      message: `Bulk upload complete. Created ${createdCount} users.`,
      errors
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
