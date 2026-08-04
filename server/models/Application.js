const mongoose = require("mongoose");
const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "shortlisted", "coding_test_assigned", "coding_test_submitted", "coding_test_passed", "coding_test_failed", "rejected"],
      default: "pending"
    },
    cvUrl: { type: String },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Application", applicationSchema);
