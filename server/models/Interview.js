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
    interviewMode: { type: String, enum: ["human", "ai"], default: "human" },
    aiInterview: {
      questions: [{ type: String }],
      qaList: [
        {
          question: { type: String },
          answer: { type: String, default: "" },
          score: { type: Number },
          feedback: { type: String, default: "" },
        }
      ],
      totalQuestions: { type: Number, default: 5 },
      status: { type: String, enum: ["pending", "in_progress", "completed", "failed"], default: "pending" },
      startedAt: { type: Date },
      completedAt: { type: Date }
    },
    aiAnalysis: {
      transcript: { type: String, default: "" },
      feedbackAndSuggestions: { type: String, default: "" },
      status: { type: String, enum: ["pending", "processing", "completed", "failed"], default: "pending" }
    },
    proctoring: {
      tabSwitches: { type: Number, default: 0 },
      integrityScore: { type: Number, default: 100 },
      fillerWordsCount: { type: Number, default: 0 },
      wordsPerMinute: { type: Number, default: 0 },
      confidenceScore: { type: Number, default: 85 },
      technicalScore: { type: Number, default: 4 },
      communicationScore: { type: Number, default: 4 },
    }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Interview", interviewSchema);
