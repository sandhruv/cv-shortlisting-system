const Profile = require("../models/Profile");
const User = require("../models/User");

exports.getMyProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id }).populate("user", "name email uid role");
    if (!profile) {
      profile = await Profile.create({ user: req.user.id });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProfileById = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId }).populate("user", "name email uid role");
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ["headline", "about", "location", "phone", "website", "experiences", "education", "skills", "certifications", "projects", "isOpenToWork", "preferredRoles", "preferredLocations"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const profile = await Profile.findOneAndUpdate({ user: req.user.id }, updates, { new: true, upsert: true, runValidators: true }).populate("user", "name email uid role");
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const photoUrl = `/uploads/profiles/${req.file.filename}`;
    const profile = await Profile.findOneAndUpdate({ user: req.user.id }, { photo: photoUrl }, { new: true, upsert: true }).populate("user", "name email uid role");
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadCoverPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const coverUrl = `/uploads/profiles/${req.file.filename}`;
    const profile = await Profile.findOneAndUpdate({ user: req.user.id }, { coverPhoto: coverUrl }, { new: true, upsert: true }).populate("user", "name email uid role");
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.trackProfileView = async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.user.id) return res.json({ ok: true });
    const profile = await Profile.findOne({ user: userId });
    if (profile) {
      const alreadyViewed = profile.profileViews.some((v) => v.viewer.toString() === req.user.id);
      if (!alreadyViewed) {
        profile.profileViews.push({ viewer: req.user.id });
        await profile.save();
      }
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProfileCompletion = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.json({ score: 0, sections: {} });
    const sections = {
      photo: Boolean(profile.photo),
      headline: Boolean(profile.headline),
      about: Boolean(profile.about),
      location: Boolean(profile.location),
      phone: Boolean(profile.phone),
      experiences: (profile.experiences || []).length > 0,
      education: (profile.education || []).length > 0,
      skills: (profile.skills || []).length >= 3,
      certifications: (profile.certifications || []).length > 0,
      projects: (profile.projects || []).length > 0,
    };
    const total = Object.keys(sections).length;
    const done = Object.values(sections).filter(Boolean).length;
    const score = Math.round((done / total) * 100);
    res.json({ score, sections });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
