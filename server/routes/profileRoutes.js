const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect } = require("../middleware/authMiddleware");
const {
  getMyProfile,
  getProfileById,
  updateProfile,
  uploadPhoto,
  uploadCoverPhoto,
  trackProfileView,
  getProfileCompletion,
} = require("../controllers/profileController");

const uploadDir = path.join(__dirname, "../uploads/profiles");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}_${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only images allowed"), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.get("/me", protect, getMyProfile);
router.get("/completion", protect, getProfileCompletion);
router.put("/", protect, updateProfile);
router.post("/photo", protect, upload.single("photo"), uploadPhoto);
router.post("/cover", protect, upload.single("photo"), uploadCoverPhoto);
router.get("/:userId", protect, getProfileById);
router.post("/view/:userId", protect, trackProfileView);

module.exports = router;
