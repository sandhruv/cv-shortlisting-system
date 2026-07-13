const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Resume = require("../models/Resume");
const Interview = require("../models/Interview");
const bcrypt = require("bcrypt");

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
    const { name, email, role, password } = req.body;
    const validRoles = ["Admin", "HR", "Student"];

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password, and role are required" });
    }
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
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
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, role, password: hashed });
    res.status(201).json({ message: "User created successfully", user: { id: user._id, name, email, role } });
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
    const totalUsers = await User.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalApplications = await Application.countDocuments();
    const totalResumes = await Resume.countDocuments();

    const recentJobs = await Job.find().sort({ createdAt: -1 }).limit(5).populate("postedBy", "name");
    const recentApps = await Application.find().sort({ createdAt: -1 }).limit(5).populate("student", "name").populate("job", "title");
    const recentResumes = await Resume.find().sort({ createdAt: -1 }).limit(5).populate("student", "name");

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
