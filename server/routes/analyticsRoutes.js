const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { isHRorAdmin } = require("../middleware/roleMiddleware");
const { getHRStats, getAdminStats } = require("../controllers/analyticsController");

router.get("/hr", protect, isHRorAdmin, getHRStats);
router.get("/admin", protect, isHRorAdmin, getAdminStats);

module.exports = router;
