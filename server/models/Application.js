const mongoose = require("mongoose");
const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "shortlisted", "rejected"], default: "pending" },
    cvUrl: { type: String },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Application", applicationSchema);
