const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");
const {
  getAllUsers,
  createUser,
  updateRole,
  deleteUser,
  getStats,
  getAllJobs,
  getAllApplications,
  getAllResumes,
  getAllInterviews, // 👈 new
} = require("../controllers/adminController");

router.use(protect, isAdmin);

router.get("/users", getAllUsers);
router.post("/users", createUser);
router.put("/users/:id/role", updateRole);
router.delete("/users/:id", deleteUser);

router.get("/stats", getStats);
router.get("/jobs", getAllJobs);
router.get("/applications", getAllApplications);
router.get("/resumes", getAllResumes);
router.get("/interviews", getAllInterviews); // 👈 new

module.exports = router;
