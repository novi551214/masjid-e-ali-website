// ================================================================
// MASJID-E-ALI — Prayer Times Routes
// GET  /api/prayer-times        (public)
// PUT  /api/prayer-times        (admin only)
// ================================================================

const express = require("express");
const router = express.Router();

const { getPrayerTimes, updatePrayerTimes } = require("../controllers/prayerController");
const { requireAdmin } = require("../middleware/auth");

router.get("/", getPrayerTimes);
router.put("/", requireAdmin, updatePrayerTimes);

module.exports = router;
