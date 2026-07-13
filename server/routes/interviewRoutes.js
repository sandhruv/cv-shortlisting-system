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
} = require("../controllers/interviewController");

router.use(protect);

router.get("/me", getMyInterviews);
router.post("/", isHRorAdmin, scheduleInterview);
router.get("/job", isHRorAdmin, getJobInterviews);
router.get("/job/:jobId", isHRorAdmin, getJobInterviews);
router.put("/:id", isHRorAdmin, updateInterviewStatus);
router.put("/:id/feedback", isHRorAdmin, addFeedback);

module.exports = router;
