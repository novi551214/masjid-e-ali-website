// ================================================================
// MASJID-E-ALI — Live Broadcast Status Route
// GET /api/live-status   (public)
// PUT /api/live-status   (admin only) — body: { videoUrl }
// ================================================================

const express = require("express");
const router = express.Router();

const { requireAdmin } = require("../middleware/auth");
const { getLiveStatus, setLiveStatus } = require("../controllers/liveController");

router.get("/", getLiveStatus);
router.put("/", requireAdmin, setLiveStatus);

module.exports = router;
