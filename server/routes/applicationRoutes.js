const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getApplicants,
  updateApplicationStatus,
  applyToJob,
  getMyApplications,
} = require("../controllers/applicationController");

router.use(protect);

router.get("/me", getMyApplications);
router.post("/jobs/:jobId/apply", applyToJob);
router.get("/jobs/:jobId/applicants", getApplicants);
router.put("/applications/:id/status", updateApplicationStatus);

module.exports = router;
