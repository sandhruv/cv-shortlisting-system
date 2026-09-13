const ProfileSubmission = require("../models/ProfileSubmission");
const Profile = require("../models/Profile");
const Application = require("../models/Application");
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
    const baseQuery = { student: req.user.id };

    if (!req.query.page) {
      const submissions = await ProfileSubmission.find(baseQuery)
        .populate("hr", "name email")
        .populate("profile", "headline photo")
        .sort({ createdAt: -1 });
      return res.json(submissions);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const [submissions, total] = await Promise.all([
      ProfileSubmission.find(baseQuery)
        .populate("hr", "name email")
        .populate("profile", "headline photo")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ProfileSubmission.countDocuments(baseQuery),
    ]);
    res.json({ data: submissions, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR: get all profile submissions sent to me
exports.getMyReceivedSubmissions = async (req, res) => {
  try {
    // Auto-sync: batch fetch applications, existing submissions, and profiles
    try {
      const [hrApplications, existingSubmissions] = await Promise.all([
        Application.find()
          .populate({ path: "job", select: "postedBy", match: { postedBy: req.user.id } })
          .populate("student", "name email"),
        ProfileSubmission.find({ hr: req.user.id }).select("student"),
      ]);

      const existingStudentIds = new Set(existingSubmissions.map(s => s.student.toString()));
      const newSubmissions = [];

      for (const app of hrApplications) {
        if (!app.job || !app.student) continue;
        if (existingStudentIds.has(app.student._id.toString())) continue;
        existingStudentIds.add(app.student._id.toString());

        const profile = await Profile.findOne({ user: app.student._id });
        if (profile) {
          newSubmissions.push({
            hr: req.user.id,
            student: app.student._id,
            profile: profile._id,
            status: "pending",
          });
        }
      }

      if (newSubmissions.length > 0) {
        await ProfileSubmission.insertMany(newSubmissions);
      }
    } catch (syncErr) {
      console.error("Profile sync error:", syncErr.message);
    }

    const baseQuery = { hr: req.user.id };

    if (!req.query.page) {
      const submissions = await ProfileSubmission.find(baseQuery)
        .populate("student", "name email")
        .populate("profile")
        .sort({ createdAt: -1 });
      return res.json(submissions);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const [submissions, total] = await Promise.all([
      ProfileSubmission.find(baseQuery)
        .populate("student", "name email")
        .populate("profile")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ProfileSubmission.countDocuments(baseQuery),
    ]);
    res.json({ data: submissions, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR: get all HR users (for student to pick who to send to)
exports.getHRUsers = async (req, res) => {
  try {
    if (!req.query.page) {
      const hrUsers = await User.find({ role: { $in: ["HR", "Admin"] } })
        .select("name email role")
        .sort({ name: 1 });
      return res.json(hrUsers);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const [hrUsers, total] = await Promise.all([
      User.find({ role: { $in: ["HR", "Admin"] } })
        .select("name email role")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({ role: { $in: ["HR", "Admin"] } }),
    ]);
    res.json({ data: hrUsers, total, page, pages: Math.ceil(total / limit) });
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


