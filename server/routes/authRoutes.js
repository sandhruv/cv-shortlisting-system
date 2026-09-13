const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { register, login, lpuLogin, forgotPassword, resetPassword, registerFace, faceLogin } = require("../controllers/authController");

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { message: "Too many login attempts. Try again later." } });
const faceLoginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { message: "Too many face login attempts. Try again later." } });
const registerFaceLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { message: "Too many face registration attempts. Try again later." } });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { message: "Too many registration attempts. Try again later." } });
const forgotLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 3, message: { message: "Too many password reset attempts. Try again later." } });

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/lpu-login", loginLimiter, lpuLogin);
router.post("/forgot-password", forgotLimiter, forgotPassword);
router.post("/reset-password", forgotLimiter, resetPassword);
router.post("/register-face", registerFaceLimiter, registerFace);
router.post("/face-login", faceLoginLimiter, faceLogin);

module.exports = router;
