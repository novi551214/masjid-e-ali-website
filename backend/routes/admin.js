// ================================================================
// MASJID-E-ALI — Admin Auth Routes
// POST /api/admin/login
// POST /api/admin/logout
// ================================================================

const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const { login, logout } = require("../controllers/adminController");

// Slow down brute-force password guessing on the login endpoint specifically.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                  // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." }
});

router.post("/login", loginLimiter, login);
router.post("/logout", logout);

module.exports = router;
