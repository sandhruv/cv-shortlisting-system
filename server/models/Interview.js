const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 60 },
    location: { type: String, enum: ["Online", "In-Person", "Phone"], default: "Online" },
    meetingLink: { type: String, default: "" },
    notes: { type: String, default: "" },
    status: { type: String, enum: ["scheduled", "completed", "cancelled", "rescheduled"], default: "scheduled" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    roomName: { type: String, default: "" }, // 👈 new: Jitsi room name
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comments: { type: String, default: "" },
      decision: { type: String, enum: ["", "selected", "rejected", "hold"], default: "" },
    },
    callActive: { type: Boolean, default: false },
    aiAnalysis: {
      transcript: { type: String, default: "" },
      personalityAnalysis: { type: String, default: "" },
      suitability: { type: String, default: "" },
      status: { type: String, enum: ["pending", "processing", "completed", "failed"], default: "pending" }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);
