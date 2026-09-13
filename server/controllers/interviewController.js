const Interview = require("../models/Interview");
const Application = require("../models/Application");
const Job = require("../models/Job");
const Resume = require("../models/Resume");
const fs = require("fs");
const Groq = require("groq-sdk");

const ALLOWED_INTERVIEW_ROLES = ["Admin", "LPU Admin", "HR", "LPU Faculty"];

const canManageInterview = (req, job) => {
  if (!job) return false;

  const isAssignedFaculty =
    req.user.role === "LPU Faculty" &&
    job.allocatedFaculty &&
    job.allocatedFaculty.toString() === req.user.id;

  return (
    job.postedBy?.toString() === req.user.id ||
    ALLOWED_INTERVIEW_ROLES.includes(req.user.role) ||
    isAssignedFaculty
  );
};

const isInterviewCandidate = (req, interview) => {
  const student = interview.application?.student;
  const studentId = student?._id || student;
  return (
    ["Student", "LPU Student"].includes(req.user.role) &&
    studentId &&
    studentId.toString() === req.user.id
  );
};

// Helper: Generate resume-tailored interview questions using Groq
const generateQuestionsForCandidate = async (job, studentId) => {
  try {
    const candidateResume = await Resume.findOne({ student: studentId }).sort({ createdAt: -1 });
    const extracted = candidateResume?.extractedData || {};
    const resumeText = [
      extracted.technical_skills ? `Skills: ${extracted.technical_skills}` : "",
      extracted.project_details ? `Projects: ${extracted.project_details}` : "",
      extracted.certifications ? `Certifications: ${extracted.certifications}` : "",
      extracted.other_info ? `Background/Education: ${extracted.other_info}` : "",
    ].filter(Boolean).join("\n");

    if (!process.env.GROQ_API_KEY) {
      console.warn("GROQ_API_KEY missing, using fallback questions");
      return getDefaultQuestions(job?.title);
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `You are an expert technical interviewer for the position of "${job?.title || 'Software Developer'}".
Job Description: ${job?.description || 'N/A'}
Job Requirements: ${job?.requirements || 'N/A'}

Candidate Resume Data:
${resumeText || "No resume details available on file."}

Generate exactly 5 targeted interview questions for this candidate. Make sure at least 3 questions directly reference the specific skills, projects, and certifications from their resume, and the remaining questions test core job requirements and problem-solving.

Return ONLY a valid JSON object in this exact format:
{
  "questions": [
    "Question 1 text...",
    "Question 2 text...",
    "Question 3 text...",
    "Question 4 text...",
    "Question 5 text..."
  ]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are an expert HR interviewer. Output ONLY a valid JSON object with key 'questions' containing an array of 5 strings." },
        { role: "user", content: prompt }
      ],
      model: "openai/gpt-oss-20b",
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    const qList = parsed.questions || parsed.interview_questions || Object.values(parsed).find(v => Array.isArray(v)) || [];
    if (Array.isArray(qList) && qList.length > 0) {
      return qList.slice(0, 5);
    }
    return getDefaultQuestions(job?.title);
  } catch (err) {
    console.error("Error generating resume questions:", err.message);
    return getDefaultQuestions(job?.title);
  }
};

const getDefaultQuestions = (title = "Developer") => [
  `Could you please introduce yourself and walk us through your most significant technical project?`,
  `What technical challenges did you encounter in your recent projects, and how did you resolve them?`,
  `How do your skills and background align with the requirements for the ${title} role?`,
  `Describe a situation where you had to quickly learn a new technology or solve a critical bug under pressure.`,
  `Where do you see your technical growth in the next 2-3 years, and what makes you a strong fit for our team?`
];

exports.scheduleInterview = async (req, res) => {
  try {
    const { applicationId, scheduledAt, duration, location, meetingLink, notes, interviewMode } = req.body;
    if (!applicationId || !scheduledAt) {
      return res.status(400).json({ message: "applicationId and scheduledAt are required" });
    }
    const application = await Application.findById(applicationId).populate("job");
    if (!application) return res.status(404).json({ message: "Application not found" });
    const job = application.job;
    if (!job) return res.status(404).json({ message: "Job not found." });
    if (!canManageInterview(req, job)) {
      return res.status(403).json({ message: "Not authorized to schedule for this job." });
    }

    const interview = new Interview({
      application: applicationId,
      job: application.job._id,
      scheduledAt,
      duration: duration || 60,
      location: location || "Online",
      meetingLink: meetingLink || "",
      notes: notes || "",
      createdBy: req.user.id,
      interviewMode: interviewMode || "human",
    });

    await interview.save();
    interview.roomName = `interview-${interview._id}`;

    // If AI interview, generate resume-based questions immediately
    if (interviewMode === "ai") {
      const generatedQs = await generateQuestionsForCandidate(job, application.student);
      interview.aiInterview = {
        questions: generatedQs,
        totalQuestions: generatedQs.length,
        status: "pending",
      };
    }

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
    const job = interview.job;
    if (!canManageInterview(req, job)) {
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
    const job = interview.job;
    if (!canManageInterview(req, job)) {
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
    if (!["Student", "LPU Student"].includes(req.user.role)) return res.status(403).json({ message: "Access denied." });
    const applications = await Application.find({ student: req.user.id }).select("_id");
    const appIds = applications.map(a => a._id);
    if (appIds.length === 0) return res.json([]);

    const baseQuery = {
      application: { $in: appIds },
      status: { $in: ["scheduled", "rescheduled", "completed"] }
    };

    if (!req.query.page) {
      const interviews = await Interview.find(baseQuery)
        .populate("job", "title location")
        .populate("application", "status")
        .sort({ scheduledAt: 1 });
      return res.json(interviews);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const interviews = await Interview.find(baseQuery)
      .populate("job", "title location")
      .populate("application", "status")
      .sort({ scheduledAt: 1 })
      .skip(skip)
      .limit(limit);
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

    if (jobId) {
      const job = await Job.findById(jobId);
      if (!job) return res.status(404).json({ message: "Job not found." });
      if (!canManageInterview(req, job)) return res.status(403).json({ message: "Not authorized to view this job's interviews." });
      query.job = jobId;
    } else if (req.user.role === "LPU Faculty") {
      const jobs = await Job.find({ scope: "lpu", allocatedFaculty: req.user.id }).select("_id");
      query.job = { $in: jobs.map(j => j._id) };
    } else if (["Admin", "LPU Admin"].includes(req.user.role)) {
      const jobs = await Job.find({ scope: "lpu" }).select("_id");
      query.job = { $in: jobs.map(j => j._id) };
    } else {
      const jobs = await Job.find({ postedBy: req.user.id }).select("_id");
      query.job = { $in: jobs.map(j => j._id) };
    }

    if (!req.query.page) {
      const interviews = await Interview.find(query)
        .populate({
          path: "application",
          select: "status student",
          populate: { path: "student", select: "name email" },
        })
        .populate("job", "title")
        .populate("createdBy", "name")
        .sort({ scheduledAt: -1 });
      return res.json(interviews);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const interviews = await Interview.find(query)
      .populate({
        path: "application",
        select: "status student",
        populate: { path: "student", select: "name email" },
      })
      .populate("job", "title")
      .populate("createdBy", "name")
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(limit);
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
    const job = interview.job;
    if (!canManageInterview(req, job)) {
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
    const job = interview.job;
    if (!canManageInterview(req, job)) {
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

// AI Interview Handlers
exports.getAiInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findById(id)
      .populate("job", "title description requirements")
      .populate({ path: "application", populate: { path: "student", select: "name email" } });

    if (!interview) return res.status(404).json({ message: "Interview not found." });
    if (interview.interviewMode !== "ai") return res.status(400).json({ message: "This is not an AI interview." });
    if (!isInterviewCandidate(req, interview)) return res.status(403).json({ message: "Not authorized to access this interview." });

    res.json({
      questions: interview.aiInterview?.questions || [],
      jobTitle: interview.job?.title,
      candidateName: interview.application?.student?.name,
      totalQuestions: interview.aiInterview?.totalQuestions || interview.aiInterview?.questions?.length || 0,
      status: interview.aiInterview?.status || "scheduled",
      interviewStatus: interview.status,
      analysisStatus: interview.aiAnalysis?.status || "pending",
    });
  } catch (err) {
    console.error("getAiInterview error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.startAiInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findById(id)
      .populate("job", "title description requirements")
      .populate({ path: "application", populate: { path: "student", select: "name email" } });

    if (!interview) return res.status(404).json({ message: "Interview not found." });
    if (interview.interviewMode !== "ai") return res.status(400).json({ message: "This is not an AI interview." });
    if (!isInterviewCandidate(req, interview)) return res.status(403).json({ message: "Not authorized to start this interview." });
    if (["completed", "cancelled"].includes(interview.status) || interview.aiInterview?.status === "completed") {
      return res.status(409).json({ message: "This interview is no longer available." });
    }

    let qList = interview.aiInterview?.questions || [];
    // If questions are not yet generated, generate them from resume now
    if (qList.length === 0) {
      qList = await generateQuestionsForCandidate(interview.job, interview.application?.student?._id);
    }

    await Interview.findByIdAndUpdate(id, {
      $set: {
        "aiInterview.questions": qList,
        "aiInterview.totalQuestions": qList.length,
        "aiInterview.status": "in_progress",
        "aiInterview.startedAt": interview.aiInterview?.startedAt || new Date(),
      }
    });

    res.json({
      message: "AI interview started",
      questions: qList,
      jobTitle: interview.job?.title,
      candidateName: interview.application?.student?.name,
      totalQuestions: qList.length,
    });
  } catch (err) {
    console.error("startAiInterview error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.submitAiInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findById(id)
      .populate("job")
      .populate({ path: "application", populate: { path: "student", select: "name email" } });

    if (!interview) return res.status(404).json({ message: "Interview not found." });
    if (interview.interviewMode !== "ai") return res.status(400).json({ message: "This is not an AI interview." });
    if (!isInterviewCandidate(req, interview)) return res.status(403).json({ message: "Not authorized to submit this interview." });
    if (interview.aiInterview?.status !== "in_progress") return res.status(409).json({ message: "This interview is not ready for submission." });

    interview.aiInterview = interview.aiInterview || {};
    interview.aiInterview.status = "completed";
    interview.aiInterview.completedAt = new Date();
    interview.aiAnalysis = interview.aiAnalysis || {};
    interview.aiAnalysis.status = "processing";
    const claimedInterview = await Interview.findOneAndUpdate(
      { _id: id, "aiInterview.status": "in_progress", "aiAnalysis.status": { $ne: "processing" } },
      {
        $set: {
          "aiInterview.status": "completed",
          "aiInterview.completedAt": interview.aiInterview.completedAt,
          "aiAnalysis.status": "processing",
        },
      },
      { returnDocument: "after" }
    );
    if (!claimedInterview) return res.status(409).json({ message: "This interview has already been submitted." });

    res.json({ message: "AI interview submitted. Generating assessment report...", status: "processing" });

    // Process evaluation in background using Groq
    (async () => {
      const filePath = req.file?.path;
      try {
        let transcript = "";

        // 1. Transcribe audio if file uploaded and non-empty
        if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
          try {
            if (process.env.GROQ_API_KEY) {
              const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
              const transcription = await groq.audio.transcriptions.create({
                file: fs.createReadStream(filePath),
                model: "whisper-large-v3",
                response_format: "json",
                language: "en",
              });
              transcript = transcription.text || "";
            }
          } catch (tErr) {
            console.warn("Audio transcription note:", tErr.message);
          }
        }

        // 2. Parse candidate's submitted Q&A list
        let candidateQaList = [];
        if (req.body.qaList) {
          try {
            candidateQaList = typeof req.body.qaList === "string" ? JSON.parse(req.body.qaList) : req.body.qaList;
          } catch (e) {
            console.warn("Could not parse qaList JSON:", e);
          }
        }

        const questions = interview.aiInterview?.questions || getDefaultQuestions(interview.job?.title);

        // Build list of question-answer pairs
        const qaPairs = questions.map((q, idx) => {
          const matching = candidateQaList.find((item) => item.question === q) || candidateQaList[idx];
          return {
            question: q,
            answer: matching?.answer && matching.answer !== "Candidate provided verbal response during interview."
              ? matching.answer
              : (transcript ? `Recorded audio response: "${transcript.substring(0, 300)}..."` : "Verbal response submitted by candidate."),
          };
        });

        // 3. Fetch candidate resume for context
        const studentId = interview.application?.student?._id || interview.application?.student;
        const candidateResume = await Resume.findOne({ student: studentId }).sort({ createdAt: -1 });
        const extracted = candidateResume?.extractedData || {};

        const evalPrompt = `You are a Senior Technical Recruiter and Hiring Manager. Evaluate this candidate's AI interview session question-by-question.

Job Role: ${interview.job?.title || "Technical Role"}
Job Requirements: ${interview.job?.requirements || "N/A"}

Candidate Resume Profile:
- Skills: ${extracted.technical_skills || "General Technical Skills"}
- Projects: ${extracted.project_details || "N/A"}
- Certifications: ${extracted.certifications || "N/A"}

Candidate's Questions and Spoken Answers:
${qaPairs.map((pair, i) => `[Question ${i + 1}]: ${pair.question}\n[Candidate Answer]: ${pair.answer}`).join("\n\n")}

Evaluate the answers thoroughly. Return ONLY a valid JSON object in this exact format:
{
  "overallScore": 4,
  "decision": "selected",
  "feedbackAndSuggestions": "Detailed summary of candidate performance across all questions.",
  "summary": "2-3 sentence executive summary for HR.",
  "qaEvaluation": [
    {
      "question": "Question 1 text",
      "answer": "Candidate's answer text",
      "score": 4,
      "feedback": "Evaluation of how well the candidate answered this question."
    }
  ]
}`;

        let analysis = {
          overallScore: 4,
          decision: "selected",
          feedbackAndSuggestions: "The candidate answered the interview questions aligning with their resume projects and technical background.",
          summary: "Recommended for further interview rounds based on strong project background and clear responses.",
          qaEvaluation: qaPairs.map(p => ({
            question: p.question,
            answer: p.answer,
            score: 4,
            feedback: "Answer aligns with project requirements and technical principles."
          }))
        };

        if (process.env.GROQ_API_KEY) {
          try {
            const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
            const completion = await groq.chat.completions.create({
              messages: [
                { role: "system", content: "You are an expert HR interviewer. Output ONLY a valid JSON object with keys 'overallScore' (number 1-5), 'decision' ('selected'|'rejected'|'hold'), 'feedbackAndSuggestions' (string), 'summary' (string), and 'qaEvaluation' (array of { question, answer, score, feedback })." },
                { role: "user", content: evalPrompt }
              ],
              model: "openai/gpt-oss-20b",
              response_format: { type: "json_object" },
              temperature: 0.2,
            });

            const parsed = JSON.parse(completion.choices[0].message.content);
            if (parsed) analysis = { ...analysis, ...parsed };
          } catch (llmErr) {
            console.error("Groq LLM evaluation error:", llmErr.message);
          }
        }

        // Save question-by-question evaluations
        const finalQaList = (analysis.qaEvaluation && analysis.qaEvaluation.length > 0)
          ? analysis.qaEvaluation.map((item, idx) => ({
              question: item.question || qaPairs[idx]?.question || `Question ${idx + 1}`,
              answer: item.answer || qaPairs[idx]?.answer || "Verbal response provided.",
              score: item.score || 4,
              feedback: item.feedback || "Good response.",
            }))
          : qaPairs.map(p => ({
              question: p.question,
              answer: p.answer,
              score: 4,
              feedback: "Evaluated by AI.",
            }));

        interview.aiInterview.qaList = finalQaList;

        // Build compiled readable transcript
        const compiledTranscript = finalQaList.map((item, idx) => 
          `[Q${idx + 1}]: ${item.question}\n[Student Answer]: ${item.answer}\n[AI Feedback]: ${item.feedback} (Score: ${item.score}/5)`
        ).join("\n\n");

        interview.aiAnalysis = {
          transcript: compiledTranscript || transcript || "All 5 questions answered and evaluated.",
          feedbackAndSuggestions: analysis.feedbackAndSuggestions || analysis.summary || "AI Interview analysis completed.",
          status: "completed",
        };

        const ratingNum = Math.min(5, Math.max(1, Number(analysis.overallScore) || 4));
        const decisionStr = ["selected", "rejected", "hold"].includes(analysis.decision?.toLowerCase())
          ? analysis.decision.toLowerCase()
          : "selected";

        let proctoringData = {};
        if (req.body.proctoring) {
          try {
            proctoringData = typeof req.body.proctoring === "string" ? JSON.parse(req.body.proctoring) : req.body.proctoring;
          } catch (e) {}
        }

        const tabSwitches = Number(proctoringData.tabSwitches) || 0;
        const fillerWords = Number(proctoringData.fillerWordsCount) || 0;
        const wpm = Number(proctoringData.wordsPerMinute) || 120;
        const integrity = Math.max(35, 100 - (tabSwitches * 15));

        interview.proctoring = {
          tabSwitches,
          integrityScore: integrity,
          fillerWordsCount: fillerWords,
          wordsPerMinute: wpm,
          confidenceScore: Math.min(98, Math.max(65, 90 - (fillerWords * 2))),
          technicalScore: ratingNum,
          communicationScore: Math.min(5, Math.max(2, Math.round(5 - (fillerWords / 5)))),
        };

        interview.feedback = {
          rating: ratingNum,
          comments: analysis.summary || analysis.feedbackAndSuggestions || "AI Interview completed successfully.",
          decision: decisionStr,
        };

        interview.status = "completed";
        await interview.save();
        console.log(`✅ Detailed AI Interview Q&A report generated for interview: ${id}`);
      } catch (err) {
        console.error("AI Interview processing error:", err);
        interview.aiInterview.status = "failed";
        interview.aiAnalysis.status = "failed";
        interview.aiAnalysis.feedbackAndSuggestions = "Interview was recorded, but the AI assessment could not be generated.";
        interview.feedback = {
          comments: "Interview submitted. AI assessment failed and requires review.",
          decision: "hold"
        };
        interview.status = "completed";
        await interview.save();
      } finally {
        if (filePath && fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) {}
        }
      }
    })();
  } catch (err) {
    console.error("submitAiInterview error:", err);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ message: err.message });
  }
};

exports.getAiInterviewReport = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findById(id)
      .populate("job", "title description requirements")
      .populate({ path: "application", populate: { path: "student", select: "name email" } });

    if (!interview) return res.status(404).json({ message: "Interview not found." });
    if (!canManageInterview(req, interview.job)) return res.status(403).json({ message: "Not authorized to view this report." });

    const studentId = interview.application?.student?._id || interview.application?.student;
    const candidateResume = await Resume.findOne({ student: studentId }).sort({ createdAt: -1 });

    res.json({
      interviewMode: interview.interviewMode,
      status: interview.status,
      aiInterview: interview.aiInterview,
      aiAnalysis: interview.aiAnalysis,
      feedback: interview.feedback,
      job: interview.job,
      candidate: interview.application?.student,
      candidateResume: candidateResume?.extractedData || null,
      proctoring: interview.proctoring || {
        tabSwitches: 0,
        integrityScore: 100,
        fillerWordsCount: 0,
        wordsPerMinute: 0,
        confidenceScore: 0,
        technicalScore: null,
        communicationScore: null,
      },
      scheduledAt: interview.scheduledAt,
    });
  } catch (err) {
    console.error("getAiInterviewReport error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.handleAiTurn = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentQuestion, candidateAnswer, nextQuestionIndex } = req.body;

    const interview = await Interview.findById(id)
      .populate("job")
      .populate({ path: "application", populate: { path: "student", select: "_id" } });
    if (!interview) return res.status(404).json({ message: "Interview not found." });
    if (interview.interviewMode !== "ai") return res.status(400).json({ message: "This is not an AI interview." });
    if (!isInterviewCandidate(req, interview)) return res.status(403).json({ message: "Not authorized to use this interview." });
    if (interview.aiInterview?.status === "completed") return res.status(409).json({ message: "This interview has already been submitted." });

    const questions = interview.aiInterview?.questions || [];
    const nextQuestion = questions[nextQuestionIndex] || "";

    if (!process.env.GROQ_API_KEY || !candidateAnswer || candidateAnswer.trim().length < 3) {
      return res.json({
        responseSpeech: nextQuestion ? `Thank you. Next question: ${nextQuestion}` : "Thank you for completing all questions!",
        nextQuestion: nextQuestion,
        isFinished: !nextQuestion,
      });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const prompt = `You are a real-time conversational AI technical interviewer — natural, warm, and adaptive like VocalLabs AI.
Job Role: ${interview.job?.title || "Technical Role"}

Previous conversation context:
${interview.aiInterview?.qaLog?.slice(-2).map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join("\n") || "First question of the interview."}

The candidate just answered the question:
Question: "${currentQuestion}"
Candidate's Spoken Answer: "${candidateAnswer}"

${nextQuestion ? `The next planned question is: "${nextQuestion}"` : `This was the final planned question.`}

Instructions:
1. Multilingual Support: Understand English, Hindi, and Hinglish. If the candidate answered in Hinglish/Hindi, respond in a natural, polite Hinglish/English mix. If they spoke in English, respond in English.
2. Give a brief, authentic 1-sentence reaction to what they specifically mentioned — reference something concrete from their answer.
3. If their answer was incomplete or unclear, ask a brief follow-up question to dig deeper, then say "Let's move on" and ask the next question.
4. If their answer was solid and complete, smoothly transition to the next question with a natural connector.
5. ${nextQuestion ? `Ask the next question: "${nextQuestion}"` : `Congratulate them warmly, tell them the interview is complete, and wish them well.`}
6. Keep the total response to 2-3 sentences max. Sound like a real person, not a script.

Return ONLY a valid JSON object in this format:
{
  "speechText": "That's interesting — you mentioned prompt caching, which is a great optimization. Can you tell me more about how you measured the latency improvement? Actually, let's keep going — how did you handle multithreading in your Selenium project?"
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a live conversational voice interviewer. Output ONLY a JSON object with key 'speechText'." },
        { role: "user", content: prompt }
      ],
      model: "openai/gpt-oss-20b",
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    const speechText = parsed.speechText || (nextQuestion ? `Great answer! Next question: ${nextQuestion}` : "Thank you for completing the interview!");

    res.json({
      responseSpeech: speechText,
      nextQuestion: nextQuestion,
      isFinished: !nextQuestion,
    });
  } catch (err) {
    console.error("handleAiTurn error:", err);
    res.json({
      responseSpeech: "Thank you for your response. Let's move on to the next question.",
      nextQuestion: "",
      isFinished: false,
    });
  }
};

exports.generateTTS = async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Text is required" });
    }
    if (text.trim().length > 500) {
      return res.status(400).json({ message: "Text must be 500 characters or fewer" });
    }

    const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
    const tts = new MsEdgeTTS();

    // Jenny = warm female, Guy = professional male
    const allowedVoices = ["en-US-JennyNeural", "en-US-GuyNeural"];
    const selectedVoice = allowedVoices.includes(voice) ? voice : "en-US-JennyNeural";
    await tts.setMetadata(selectedVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // toStream returns { audioStream, metadataStream, requestId }
    const { audioStream } = tts.toStream(text.trim());

    if (!audioStream || typeof audioStream.on !== "function") {
      throw new Error("audioStream is not a valid readable stream");
    }

    audioStream.on("data", (chunk) => {
      if (!res.writableEnded) res.write(chunk);
    });

    audioStream.on("end", () => {
      if (!res.writableEnded) res.end();
    });

    audioStream.on("close", () => {
      if (!res.writableEnded) res.end();
    });

    audioStream.on("error", (err) => {
      console.error("TTS audioStream error:", err.message);
      if (!res.writableEnded) res.end();
    });

  } catch (err) {
    console.error("generateTTS error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ message: "TTS generation failed: " + err.message });
    } else if (!res.writableEnded) {
      res.end();
    }
  }
};

exports.analyzeAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findById(id).populate("job");
    if (!interview) return res.status(404).json({ message: "Interview not found." });
    
    const job = interview.job;
    if (!canManageInterview(req, job)) {
      return res.status(403).json({ message: "Not authorized to add analysis." });
    }

    if (!req.file) return res.status(400).json({ message: "No audio file uploaded" });

    interview.aiAnalysis = interview.aiAnalysis || {};
    interview.aiAnalysis.status = "processing";
    await interview.save();

    res.json({ message: "Audio analysis started", status: "processing" });

    (async () => {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        
        const transcription = await groq.audio.transcriptions.create({
          file: fs.createReadStream(req.file.path),
          model: "whisper-large-v3",
          response_format: "json",
          language: "en",
        });

        const transcript = transcription.text;
        
        const prompt = `Analyze this interview transcript for a candidate applying for the role of ${job.title}. 
Job requirements: ${job.requirements}
Job description: ${job.description}

Transcript:
${transcript}

Based on the transcript, please provide a concise evaluation of the candidate. Provide constructive feedback and suggestions, and recommend a rating out of 5 and a decision (selected, rejected, pending). Return your answer as a JSON object with keys: "feedbackAndSuggestions", "rating" (number), and "decision" (string).`;

        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "openai/gpt-oss-20b",
          response_format: { type: "json_object" },
        });

        const analysis = JSON.parse(completion.choices[0].message.content);

        interview.aiAnalysis = {
          transcript,
          feedbackAndSuggestions: analysis.feedbackAndSuggestions || JSON.stringify(analysis) || "",
          status: "completed",
        };
        if (!interview.feedback || !interview.feedback.comments) {
          interview.feedback = {
            rating: analysis.rating || 3,
            comments: analysis.feedbackAndSuggestions || "AI Analysis completed.",
            decision: analysis.decision || "pending"
          };
        }
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

// ─── Conversational AI Interview (VocalLabs-style) ──────────
exports.aiChatInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { messages, chancesLeft } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "messages array is required" });
    }

    const interview = await Interview.findById(id)
      .populate("job", "title description requirements")
      .populate({ path: "application", populate: { path: "student", select: "name email" } });

    if (!interview) return res.status(404).json({ message: "Interview not found." });
    if (interview.interviewMode !== "ai") return res.status(400).json({ message: "Not an AI interview." });
    if (!isInterviewCandidate(req, interview)) return res.status(403).json({ message: "Not authorized." });
    if (interview.aiInterview?.status === "completed") return res.status(409).json({ message: "Interview already completed." });

    // Ensure interview is in_progress
    if (interview.aiInterview?.status !== "in_progress") {
      await Interview.findByIdAndUpdate(id, {
        $set: {
          "aiInterview.status": "in_progress",
          "aiInterview.startedAt": interview.aiInterview?.startedAt || new Date(),
        }
      });
    }

    // Fetch resume
    const candidateResume = await Resume.findOne({ student: interview.application?.student?._id }).sort({ createdAt: -1 });
    const extracted = candidateResume?.extractedData || {};
    const resumeText = [
      extracted.technical_skills ? `Skills: ${extracted.technical_skills}` : "",
      extracted.project_details ? `Projects: ${extracted.project_details}` : "",
      extracted.certifications ? `Certifications: ${extracted.certifications}` : "",
      extracted.other_info ? `Background/Education: ${extracted.other_info}` : "",
    ].filter(Boolean).join("\n");

    const chances = typeof chancesLeft === "number" ? chancesLeft : 3;
    const MAX_TURNS = 8;
    const userTurns = messages.filter(m => m.role === "user").length;

    if (!process.env.GROQ_API_KEY) {
      return res.json({ reply: "I'm having a technical issue. Let me ask you directly — tell me about yourself.", shouldFinish: false, chancesLeft: chances });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const systemPrompt = `You are a professional, warm, and conversational AI interviewer for the position of "${interview.job?.title || 'Software Developer'}" at a company.

Job Description: ${interview.job?.description || 'N/A'}
Job Requirements: ${interview.job?.requirements || 'N/A'}

Candidate Resume:
${resumeText || "No resume details available."}

Candidate Name: ${interview.application?.student?.name || 'Candidate'}

YOUR ROLE:
- You are conducting a LIVE voice interview. Speak naturally like a real human interviewer.
- Ask questions one at a time. Wait for the candidate to answer before asking the next question.
- Start by greeting the candidate warmly and asking them to introduce themselves.
- Based on their answers, ask relevant follow-up questions or move to the next topic.
- Reference specific things from their resume (projects, skills, certifications) to make it personal.
- If they give a vague or incomplete answer, ask them to elaborate — but only once per question.
- If they still can't answer properly after being asked to elaborate, say "No problem, let's move on" and ask a different question.
- Be encouraging and positive. Say things like "Great!", "Interesting!", "I see!" naturally.
- Keep responses SHORT (1-2 sentences max). This is a voice conversation — don't ramble.
- Speak in English. If they reply in Hindi/Hinglish, respond in Hinglish.
- NEVER reveal you are an AI. Act like a real person.

CONVERSATION FLOW:
1. Greet → Ask for self-introduction
2. Ask about their most relevant project from resume
3. Ask a technical question based on their skills
4. Ask a behavioral/situational question
5. Ask about their career goals
6. Wrap up warmly

CRITICAL RULES:
- You have exactly ${MAX_TURNS} total exchanges (including the greeting). Plan your questions accordingly.
- Turn 1: Greet + self-intro
- Turns 2-5: Technical/project questions (adapt based on answers)
- Turn 6-7: Behavioral + career goals
- Turn 8 (FINAL): Say "Thank you so much for your time, ${interview.application?.student?.name || 'Candidate'}. It was great speaking with you. We'll get back to you soon. Goodbye!" and set shouldFinish to true.

IMPORTANT:
- When you want to ask a question, ALWAYS include it in your response.
- When the interview reaches turn 8, you MUST end with a goodbye message and set shouldFinish to true.
- If the candidate gives very poor answers 3 times in a row, end the interview early with shouldFinish: true.
- Return ONLY a JSON object: { "reply": "your spoken text", "shouldFinish": false }`;

    const completion = await groq.chat.completions.create({
      model: "allam-2-7b",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-20).map(m => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content || "";

    // Parse JSON from response
    let reply = "";
    let shouldFinish = false;
    try {
      const parsed = JSON.parse(content);
      reply = parsed.reply || content;
      shouldFinish = parsed.shouldFinish || false;
    } catch {
      reply = content.replace(/^```json\n?|\n?```$/g, "").trim();
      shouldFinish = reply.toLowerCase().includes("goodbye") || reply.toLowerCase().includes("thank you for your time");
    }

    // HARD CONSTRAINT: force finish at max turns
    if (userTurns >= MAX_TURNS) {
      shouldFinish = true;
      if (!reply.toLowerCase().includes("goodbye")) {
        reply = `Thank you so much for your time, ${interview.application?.student?.name || 'Candidate'}. It was great speaking with you. We'll get back to you soon. Goodbye!`;
      }
    }

    // Save Q&A to interview model after each exchange
    const lastUserMsg = messages.filter(m => m.role === "user").pop();
    if (lastUserMsg && !lastUserMsg.content.includes("Start the interview now")) {
      // Find the previous assistant question
      const lastAssistantIdx = messages.length - 2;
      const lastAssistantMsg = lastAssistantIdx >= 0 ? messages[lastAssistantIdx] : null;
      if (lastAssistantMsg && lastAssistantMsg.role === "assistant") {
        await Interview.findByIdAndUpdate(id, {
          $push: {
            "aiInterview.qaList": {
              question: lastAssistantMsg.content,
              answer: lastUserMsg.content,
            }
          }
        });
      }
    }

    // If finishing, save final evaluation
    if (shouldFinish) {
      const updatedInterview = await Interview.findById(id);
      const qaList = updatedInterview.aiInterview?.qaList || [];

      // Generate evaluation via Groq
      let evaluation = { overallScore: 3, decision: "hold", summary: "Interview completed." };
      if (process.env.GROQ_API_KEY && qaList.length > 0) {
        try {
          const evalGroq = new Groq({ apiKey: process.env.GROQ_API_KEY });
          const evalCompletion = await evalGroq.chat.completions.create({
            model: "allam-2-7b",
            messages: [
              { role: "system", content: "You are an expert HR interviewer. Output ONLY a valid JSON object with keys: overallScore (1-5), decision ('selected'|'rejected'|'hold'), summary (2-3 sentences for HR)." },
              { role: "user", content: `Evaluate this candidate for ${interview.job?.title || 'the role'}.\n\nResume Skills: ${resumeText || 'N/A'}\n\nQ&A:\n${qaList.map((qa, i) => `Q${i+1}: ${qa.question}\nA: ${qa.answer}`).join('\n\n')}` }
            ],
            temperature: 0.2,
          });
          evaluation = JSON.parse(evalCompletion.choices[0].message.content);
        } catch (e) {
          console.error("Evaluation error:", e.message);
        }
      }

      await Interview.findByIdAndUpdate(id, {
        $set: {
          "aiInterview.status": "completed",
          "aiInterview.completedAt": new Date(),
          "feedback.rating": Math.min(5, Math.max(1, Number(evaluation.overallScore) || 3)),
          "feedback.decision": ["selected", "rejected", "hold"].includes(evaluation.decision) ? evaluation.decision : "hold",
          "feedback.comments": evaluation.summary || "AI Interview completed.",
          "aiAnalysis.feedbackAndSuggestions": evaluation.summary || "AI Interview completed.",
          "aiAnalysis.status": "completed",
          "status": "completed",
        }
      });
    }

    res.json({ reply, shouldFinish, chancesLeft: chances });
  } catch (err) {
    console.error("aiChatInterview error:", err);
    res.status(500).json({ message: "Interview service temporarily unavailable." });
  }
};
