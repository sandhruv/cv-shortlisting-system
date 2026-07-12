const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { isHRorAdmin } = require("../middleware/roleMiddleware");
const {
  createJob,
  getJobs,
  updateJob,
  deleteJob,
} = require("../controllers/jobController");

router.use(protect);
router.post("/", isHRorAdmin, createJob);
router.get("/", getJobs);
router.put("/:id", isHRorAdmin, updateJob);
router.delete("/:id", isHRorAdmin, deleteJob);

module.exports = router;
