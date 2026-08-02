const mongoose = require("mongoose");
const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: String, required: true },
    location: { type: String, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    allocatedFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    allocatedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    scope: {
      type: String,
      enum: ["general", "lpu"],
      default: "general",
      index: true,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Job", jobSchema);
