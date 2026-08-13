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
    // ── Anti-cheat & security fields ──────────────────────────────
    antiCheatLog: {
      warnings: { type: Number, default: 0 },
      tabSwitches: { type: Number, default: 0 },
      rightClickAttempts: { type: Number, default: 0 },
      clipboardAttempts: { type: Number, default: 0 },
      devToolsOpened: { type: Number, default: 0 },
      keyboardBlockAttempts: { type: Number, default: 0 },
      mouseLeaveCount: { type: Number, default: 0 },
      focusLossCount: { type: Number, default: 0 },
      codePasteCount: { type: Number, default: 0 },
      fullscreenExits: { type: Number, default: 0 },
      screenshotAttempts: { type: Number, default: 0 },
      violationTimestamps: [{ type: Date }],
      events: [{ type: String }],
    },
    ipAddress: { type: String, default: "" },
    browserFingerprint: {
      userAgent: { type: String, default: "" },
      screenResolution: { type: String, default: "" },
      timezone: { type: String, default: "" },
      language: { type: String, default: "" },
      platform: { type: String, default: "" },
      cookieEnabled: { type: Boolean, default: true },
      doNotTrack: { type: String, default: "" },
      hardwareConcurrency: { type: Number, default: 0 },
      deviceMemory: { type: Number, default: 0 },
      colorDepth: { type: Number, default: 0 },
    },
    violationCount: { type: Number, default: 0 },
    sessionDuration: { type: Number, default: 0 },
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
