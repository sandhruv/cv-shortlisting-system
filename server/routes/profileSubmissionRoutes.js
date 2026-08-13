const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  sendProfileToHR,
  getMySubmissions,
  getMyReceivedSubmissions,
  updateSubmissionStatus,
  getHRUsers,
} = require("../controllers/profileSubmissionController");

router.use(protect);

router.get("/hr-users", getHRUsers);
router.post("/send", sendProfileToHR);
router.get("/mine", getMySubmissions);
router.get("/received", getMyReceivedSubmissions);
router.put("/:id/status", updateSubmissionStatus);

module.exports = router;
