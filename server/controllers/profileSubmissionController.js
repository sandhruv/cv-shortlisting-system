const ProfileSubmission = require("../models/ProfileSubmission");
const Profile = require("../models/Profile");
const User = require("../models/User");

// Student: send profile to an HR
exports.sendProfileToHR = async (req, res) => {
  try {
    if (!["Student", "LPU Student"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only students can send profiles" });
    }

    const { hrId, message } = req.body;
    if (!hrId) {
      return res.status(400).json({ message: "HR user ID is required" });
    }

    const hrUser = await User.findById(hrId);
    if (!hrUser || !["HR", "Admin"].includes(hrUser.role)) {
      return res.status(400).json({ message: "Invalid HR user" });
    }

    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: "Please create your profile first" });
    }

    const existing = await ProfileSubmission.findOne({
      student: req.user.id,
      hr: hrId,
      status: "pending",
    });
    if (existing) {
      return res.status(400).json({ message: "You already have a pending submission to this HR" });
    }

    const submission = await ProfileSubmission.create({
      student: req.user.id,
      hr: hrId,
      profile: profile._id,
      message: message || "",
    });

    res.status(201).json({ message: "Profile sent to HR successfully", submission });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Student: get my sent submissions
exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await ProfileSubmission.find({ student: req.user.id })
      .populate("hr", "name email")
      .populate("profile", "headline photo")
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR: get all profile submissions sent to me
exports.getMyReceivedSubmissions = async (req, res) => {
  try {
    const submissions = await ProfileSubmission.find({ hr: req.user.id })
      .populate("student", "name email")
      .populate("profile")
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR: approve or reject a submission
exports.updateSubmissionStatus = async (req, res) => {
  try {
    const { status, hrComment } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const submission = await ProfileSubmission.findOne({
      _id: req.params.id,
      hr: req.user.id,
    });
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    submission.status = status;
    submission.hrComment = hrComment || "";
    await submission.save();

    res.json({ message: `Profile ${status}`, submission });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR: get all HR users (for student to pick who to send to)
exports.getHRUsers = async (req, res) => {
  try {
    const hrUsers = await User.find({ role: { $in: ["HR", "Admin"] } })
      .select("name email role")
      .sort({ name: 1 });
    res.json(hrUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
