// ================================================================
// MASJID-E-ALI — Events Routes
// GET    /api/events                  (public)
// POST   /api/events                  (admin only, multipart — optional "poster" file)
// PUT    /api/events/:id              (admin only, multipart — optional "poster" file)
// DELETE /api/events/:id              (admin only)
// POST   /api/events/upload-poster    (admin only, multipart — body.id + "poster" file)
// ================================================================

const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  listEvents, createEvent, updateEvent, deleteEvent, uploadPoster
} = require("../controllers/eventController");
const { requireAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");
const Event = require("../models/Event");

// Events don't get an id until they're inserted, but multer needs one
// *before* that (for the on-disk filename) when creating with a bundled
// poster upload. Generate it up front and stash it on the request so both
// the upload middleware and the controller use the same id.
function assignEventId(req, res, next) {
  req.eventId = Event.generateId();
  next();
}

// Turns multer's file-size/file-type rejection into a clear 400 instead of
// falling through to the generic 500 handler in server.js.
function handleUploadErrors(err, req, res, next) {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Poster image must be 2MB or smaller." });
  }
  if (err) {
    return res.status(400).json({ error: "Upload failed. Use a JPG, PNG, or WebP image under 2MB." });
  }
  next();
}

router.get("/", listEvents);
router.post("/", requireAdmin, assignEventId, upload.single("poster"), handleUploadErrors, createEvent);
router.put("/:id", requireAdmin, upload.single("poster"), handleUploadErrors, updateEvent);
router.delete("/:id", requireAdmin, deleteEvent);
router.post("/upload-poster", requireAdmin, upload.single("poster"), handleUploadErrors, uploadPoster);

module.exports = router;
