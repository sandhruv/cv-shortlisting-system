const express = require("express");
const router = express.Router();
const { register, login, lpuLogin } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/lpu-login", lpuLogin);

module.exports = router;
