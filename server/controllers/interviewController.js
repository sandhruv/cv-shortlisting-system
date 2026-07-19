const Interview = require("../models/Interview");
const Application = require("../models/Application");
const Job = require("../models/Job");

exports.scheduleInterview = async (req, res) => {
  try {
    const { applicationId, scheduledAt, duration, location, meetingLink, notes } = req.body;
    if (!applicationId || !scheduledAt) {
      return res.status(400).json({ message: "applicationId and scheduledAt are required" });
    }
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
      .populate({
        path: "application",
        select: "status student",
        populate: { path: "student", select: "name email" },
      })
      .populate("job", "title")
      .populate("createdBy", "name")
      .sort({ scheduledAt: -1 });
    res.json(interviews);
  } catch (err) {
    console.error("getJobInterviews error:", err);
    res.status(500).json({ message: err.message });
  }
};

const VALID_INTERVIEW_STATUSES = ["scheduled", "completed", "cancelled", "rescheduled"];

exports.updateInterviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !VALID_INTERVIEW_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid interview status" });
    }
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
    const allowedDecisions = ["", "selected", "rejected", "hold"];
    if (rating !== undefined && (typeof rating !== "number" || rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
    }
    if (decision !== undefined && !allowedDecisions.includes(decision)) {
      return res.status(400).json({ message: "Invalid decision value" });
    }
    const interview = await Interview.findById(id).populate("job");
    if (!interview) return res.status(404).json({ message: "Interview not found." });
    const job = await Job.findById(interview.job._id);
    if (job.postedBy.toString() !== req.user.id && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to add feedback." });
    }
    interview.feedback = {
      rating: rating !== undefined ? rating : interview.feedback?.rating,
      comments: comments !== undefined ? comments : interview.feedback?.comments,
      decision: decision !== undefined ? decision : interview.feedback?.decision || "",
    };
    await interview.save();
    res.json({ message: "Feedback added successfully", interview });
  } catch (err) {
    console.error("addFeedback error:", err);
    res.status(500).json({ message: err.message });
  }
};

const fs = require("fs");
const Groq = require("groq-sdk");

exports.analyzeAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findById(id).populate("job");
    if (!interview) return res.status(404).json({ message: "Interview not found." });
    
    const job = await Job.findById(interview.job._id);
    if (job.postedBy.toString() !== req.user.id && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to add analysis." });
    }

    if (!req.file) return res.status(400).json({ message: "No audio file uploaded" });

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ message: "GROQ_API_KEY is not configured on the server." });
    }

    interview.aiAnalysis.status = "processing";
    await interview.save();

    res.json({ message: "Audio analysis started", status: "processing" });

    (async () => {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        
        // 1. Transcribe audio
        const transcription = await groq.audio.transcriptions.create({
          file: fs.createReadStream(req.file.path),
          model: "whisper-large-v3",
          response_format: "json",
          language: "en",
        });

        const transcript = transcription.text;
        
        // 2. Analyze with LLM
        const prompt = `Analyze this interview transcript for a candidate applying for the role of ${job.title}. 
Job requirements: ${job.requirements}
Job description: ${job.description}

Transcript:
${transcript}

Based on the transcript, please provide a concise evaluation of the candidate's personality and their suitability for this job role. Return your answer as a JSON object with two keys: "personalityAnalysis" and "suitability".`;

        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama-3.1-8b-instant",
          response_format: { type: "json_object" },
        });

        const analysis = JSON.parse(completion.choices[0].message.content);

        interview.aiAnalysis = {
          transcript,
          personalityAnalysis: analysis.personalityAnalysis || "",
          suitability: analysis.suitability || "",
          status: "completed",
        };
        await interview.save();
      } catch (err) {
        console.error("Groq Analysis Error:", err);
        interview.aiAnalysis.status = "failed";
        await interview.save();
      } finally {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      }
    })();
  } catch (err) {
    console.error("analyzeAudio error:", err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: err.message });
  }
};
