const mongoose = require("mongoose");

const profileSubmissionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hr: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    message: { type: String, default: "" },
    hrComment: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProfileSubmission", profileSubmissionSchema);
