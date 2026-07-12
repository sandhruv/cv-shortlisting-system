const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: { type: String, required: true },
    fileSize: { type: Number },
    extractedData: {
      email: { type: String },
      contact_no: { type: String },
      technical_skills: { type: String },
      project_details: { type: String },
      certifications: { type: String },
      other_info: { type: String },
    },
    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resume", resumeSchema);
