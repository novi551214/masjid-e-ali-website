// ================================================================
// MASJID-E-ALI — Submissions Routes
// POST   /api/submissions/contact   (public)
// POST   /api/submissions/scholar   (public)
// GET    /api/submissions           (admin only)
// DELETE /api/submissions/:id       (admin only)
// ================================================================

const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const {
  createContactSubmission,
  createScholarSubmission,
  listSubmissions,
  deleteSubmission,
} = require("../controllers/submissionController");
const { requireAdmin } = require("../middleware/auth");

// Deter form-spam without blocking legitimate visitors.
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 submissions per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions. Please try again later." },
});

router.post("/contact", submitLimiter, createContactSubmission);
router.post("/scholar", submitLimiter, createScholarSubmission);
router.get("/", requireAdmin, listSubmissions);
router.delete("/:id", requireAdmin, deleteSubmission);

module.exports = router;
