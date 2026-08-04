const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    uid: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: ["Admin", "HR", "Student", "LPU Admin", "LPU Faculty", "LPU Student"],
      default: "Student",
    },
    password: {
      type: String,
      required: true,
    },
    subscriptionPlan: {
      type: String,
      enum: ["trial", "monthly", "yearly", "inactive"],
      default: "trial",
    },
    trialEndsAt: {
      type: Date,
      default: null,
    },
    planEndsAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
