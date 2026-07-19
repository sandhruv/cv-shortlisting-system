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
} = require("../controllers/interviewController");

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router.use(protect);

router.get("/me", getMyInterviews);
router.post("/", isHRorAdmin, scheduleInterview);
router.get("/job", isHRorAdmin, getJobInterviews);
router.get("/job/:jobId", isHRorAdmin, getJobInterviews);
router.put("/:id/call/start", isHRorAdmin, startInterviewCall);
router.put("/:id/call/stop", isHRorAdmin, stopInterviewCall);
router.put("/:id", isHRorAdmin, updateInterviewStatus);
router.put("/:id/feedback", isHRorAdmin, addFeedback);
router.post("/:id/analyze-audio", isHRorAdmin, upload.single("audio"), require("../controllers/interviewController").analyzeAudio);

module.exports = router;
