const mongoose = require("mongoose");

const experienceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String },
  startDate: { type: String },
  endDate: { type: String },
  description: { type: String },
}, { _id: true });

const educationSchema = new mongoose.Schema({
  school: { type: String, required: true },
  degree: { type: String },
  fieldOfStudy: { type: String },
  startYear: { type: String },
  endYear: { type: String },
  cgpa: { type: String },
}, { _id: true });

const certificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  issuer: { type: String },
  date: { type: String },
  url: { type: String },
}, { _id: true });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  techStack: { type: String },
  link: { type: String },
}, { _id: true });

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    photo: { type: String, default: "" },
    coverPhoto: { type: String, default: "" },
    headline: { type: String, default: "" },
    about: { type: String, default: "" },
    location: { type: String, default: "" },
    phone: { type: String, default: "" },
    website: { type: String, default: "" },
    experiences: [experienceSchema],
    education: [educationSchema],
    skills: [{ type: String }],
    certifications: [certificationSchema],
    projects: [projectSchema],
    isOpenToWork: { type: Boolean, default: false },
    preferredRoles: { type: String, default: "" },
    preferredLocations: { type: String, default: "" },
    profileViews: [{
      viewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      viewedAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
