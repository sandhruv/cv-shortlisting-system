const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema({
  input: { type: String, default: "" },
  expectedOutput: { type: String, default: "" },
  description: { type: String, default: "" },
});

const codingTestSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    language: { type: String, default: "python" },
    testCases: [testCaseSchema],
    durationMinutes: { type: Number, default: 30 },
    status: {
      type: String,
      enum: ["assigned", "in_progress", "submitted", "reviewed"],
      default: "assigned",
    },
    submittedCode: { type: String, default: "" },
    submissionNotes: { type: String, default: "" },
    startedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    proctorSnapshots: [
      {
        imagePath: { type: String, required: true },
        capturedAt: { type: Date, default: Date.now },
      },
    ],
    score: { type: Number, default: null },
    hrFeedback: { type: String, default: "" },
    verdict: {
      type: String,
      enum: ["", "passed", "failed", "resubmit"],
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CodingTest", codingTestSchema);
