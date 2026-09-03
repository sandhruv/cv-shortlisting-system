const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { isHRorAdmin } = require("../middleware/roleMiddleware");
const {
  scheduleInterview,
  getMyInterviews,
  getJobInterviews,
  updateInterviewStatus,
  addFeedback,
  startInterviewCall,
  stopInterviewCall,
  startAiInterview,
  submitAiInterview,
  getAiInterview,
  getAiInterviewReport,
  generateTTS,
  handleAiTurn,
} = require("../controllers/interviewController");

const multer = require("multer");
const rateLimit = require("express-rate-limit");
const ttsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many text-to-speech requests. Please try again shortly.",
});
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/") || file.mimetype === "video/webm") {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"));
    }
  },
});

router.use(protect);

router.get("/me", getMyInterviews);
router.post("/", isHRorAdmin, scheduleInterview);
router.get("/job", isHRorAdmin, getJobInterviews);
router.get("/job/:jobId", isHRorAdmin, getJobInterviews);
router.post("/tts", ttsLimiter, generateTTS);
router.get("/:id/ai", getAiInterview);
router.post("/:id/ai-start", startAiInterview);
router.post("/:id/ai-turn", handleAiTurn);
router.post("/:id/ai-submit", upload.single("audio"), submitAiInterview);
router.get("/:id/ai-report", isHRorAdmin, getAiInterviewReport);
router.put("/:id/call/start", isHRorAdmin, startInterviewCall);
router.put("/:id/call/stop", isHRorAdmin, stopInterviewCall);
router.put("/:id", isHRorAdmin, updateInterviewStatus);
router.put("/:id/feedback", isHRorAdmin, addFeedback);
router.post("/:id/analyze-audio", isHRorAdmin, upload.single("audio"), require("../controllers/interviewController").analyzeAudio);

module.exports = router;
