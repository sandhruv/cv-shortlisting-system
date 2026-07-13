const Interview = require("../models/Interview");
const Application = require("../models/Application");
const Job = require("../models/Job");

exports.scheduleInterview = async (req, res) => {
  try {
    const { applicationId, scheduledAt, duration, location, meetingLink, notes } = req.body;
    const application = await Application.findById(applicationId).populate("job");
    if (!application) return res.status(404).json({ message: "Application not found" });
    const job = await Job.findById(application.job._id);
    if (!job) return res.status(404).json({ message: "Job not found." });
    if (job.postedBy.toString() !== req.user.id && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to schedule for this job." });
    }

    // 👇 Create interview without roomName first to get _id
    const interview = new Interview({
      application: applicationId,
      job: application.job._id,
      scheduledAt,
      duration: duration || 60,
      location: location || "Online",
      meetingLink: meetingLink || "",
      notes: notes || "",
      createdBy: req.user.id,
    });
    // Generate room name using interview ID (after it's assigned)
    await interview.save();
    interview.roomName = `interview-${interview._id}`;
    await interview.save();

    res.status(201).json({ message: "Interview scheduled successfully", interview });
  } catch (err) {
    console.error("scheduleInterview error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.startInterviewCall = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findById(id).populate("job");
    if (!interview) return res.status(404).json({ message: "Interview not found." });
    const job = await Job.findById(interview.job._id);
    if (job.postedBy.toString() !== req.user.id && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to start the call." });
    }
    interview.callActive = true;
    await interview.save();
    res.json({ message: "Interview call started", interview });
  } catch (err) {
    console.error("startInterviewCall error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.stopInterviewCall = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findById(id).populate("job");
    if (!interview) return res.status(404).json({ message: "Interview not found." });
    const job = await Job.findById(interview.job._id);
    if (job.postedBy.toString() !== req.user.id && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to stop the call." });
    }
    interview.callActive = false;
    await interview.save();
    res.json({ message: "Interview call stopped", interview });
  } catch (err) {
    console.error("stopInterviewCall error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getMyInterviews = async (req, res) => {
  try {
    if (req.user.role !== "Student") return res.status(403).json({ message: "Access denied." });
    const applications = await Application.find({ student: req.user.id }).select("_id");
    const appIds = applications.map(a => a._id);
    if (appIds.length === 0) return res.json([]);
    const interviews = await Interview.find({
      application: { $in: appIds },
      status: { $in: ["scheduled", "rescheduled"] }
    })
      .populate("job", "title location")
      .populate("application", "status")
      .sort({ scheduledAt: 1 });
    res.json(interviews);
  } catch (err) {
    console.error("getMyInterviews error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getJobInterviews = async (req, res) => {
  try {
    const { jobId } = req.params;
    let query = {};
    if (jobId) { query.job = jobId; }
    else {
      const jobs = await Job.find({ postedBy: req.user.id }).select("_id");
      query.job = { $in: jobs.map(j => j._id) };
    }
    if (req.user.role !== "Admin") {
      const jobs = await Job.find({ postedBy: req.user.id }).select("_id");
      query.job = { $in: jobs.map(j => j._id) };
    }
    const interviews = await Interview.find(query)
      .populate("application", "status student")
      .populate("job", "title")
      .populate("createdBy", "name")
      .sort({ scheduledAt: -1 });
    res.json(interviews);
  } catch (err) {
    console.error("getJobInterviews error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateInterviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const interview = await Interview.findById(id).populate("job");
    if (!interview) return res.status(404).json({ message: "Interview not found." });
    const job = await Job.findById(interview.job._id);
    if (job.postedBy.toString() !== req.user.id && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to update this interview." });
    }
    interview.status = status;
    await interview.save();
    res.json({ message: "Interview status updated", interview });
  } catch (err) {
    console.error("updateInterviewStatus error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.addFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comments, decision } = req.body;
    const interview = await Interview.findById(id).populate("job");
    if (!interview) return res.status(404).json({ message: "Interview not found." });
    const job = await Job.findById(interview.job._id);
    if (job.postedBy.toString() !== req.user.id && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to add feedback." });
    }
    interview.feedback = { rating, comments, decision: decision || "" };
    await interview.save();
    res.json({ message: "Feedback added successfully", interview });
  } catch (err) {
    console.error("addFeedback error:", err);
    res.status(500).json({ message: err.message });
  }
};
