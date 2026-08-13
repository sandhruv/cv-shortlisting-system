const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { isHRorAdmin } = require("../middleware/roleMiddleware");
const {
  createCodingTest,
  getStudentTests,
  getHRTests,
  getTestById,
  startTest,
  submitTest,
  reviewTest,
  uploadSnapshot,
} = require("../controllers/codingTestController");

// ── Submission rate limiter (in-memory) ──────────────────────────
const rateLimit = require("express-rate-limit");

const submitLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute window
  max: 3,                     // max 3 submissions per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many submission attempts. Please wait a moment." },
  keyGenerator: (req) => `${req.user.id}_${req.params.id}`, // per-user per-test
});

const snapshotLimiter = rateLimit({
  windowMs: 30 * 1000,  // 30 second window
  max: 2,                 // max 2 snapshots per 30 seconds
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Snapshot rate limited. Please wait." },
  keyGenerator: (req) => `${req.user.id}_${req.params.id}`,
});

router.use(protect);

router.post("/", isHRorAdmin, createCodingTest);
router.get("/my-tests", getStudentTests);
router.get("/hr-tests", isHRorAdmin, getHRTests);
router.get("/:id", getTestById);
router.put("/:id/start", startTest);
router.put("/:id/submit", submitLimiter, submitTest);
router.put("/:id/review", isHRorAdmin, reviewTest);
router.put("/:id/snapshot", snapshotLimiter, uploadSnapshot);

module.exports = router;
