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
  importLinkedIn,
  importLinkedInPDF,
  importLinkedInText,
  linkedinLogin,
  linkedinSessionStatus,
  linkedinLogout,
  analyzeMyProfile,
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

const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}_linkedin_${Date.now()}${ext}`);
  },
});

const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files are allowed"), false);
};

const pdfUpload = multer({
  storage: pdfStorage,
  fileFilter: pdfFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get("/me", protect, getMyProfile);
router.get("/completion", protect, getProfileCompletion);
router.put("/", protect, updateProfile);
router.post("/photo", protect, upload.single("photo"), uploadPhoto);
router.post("/cover", protect, upload.single("photo"), uploadCoverPhoto);
router.post("/import-linkedin", protect, importLinkedIn);
router.post("/import-linkedin-pdf", protect, pdfUpload.single("pdf"), importLinkedInPDF);
router.post("/import-linkedin-text", protect, importLinkedInText);
router.post("/linkedin-login", protect, linkedinLogin);
router.get("/linkedin-session", protect, linkedinSessionStatus);
router.post("/linkedin-logout", protect, linkedinLogout);
router.get("/analyze", protect, analyzeMyProfile);
router.get("/:userId", protect, getProfileById);
router.post("/view/:userId", protect, trackProfileView);

module.exports = router;
