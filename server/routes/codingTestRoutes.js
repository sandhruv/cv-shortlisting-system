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
} = require("../controllers/codingTestController");

router.use(protect);

router.post("/", isHRorAdmin, createCodingTest);
router.get("/my-tests", getStudentTests);
router.get("/hr-tests", isHRorAdmin, getHRTests);
router.get("/:id", getTestById);
router.put("/:id/start", startTest);
router.put("/:id/submit", submitTest);
router.put("/:id/review", isHRorAdmin, reviewTest);

module.exports = router;
