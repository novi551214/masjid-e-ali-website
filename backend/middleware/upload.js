// ================================================================
// MASJID-E-ALI — Poster Upload Middleware (multer)
// ================================================================

const fs = require("fs");
const path = require("path");
const multer = require("multer");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "posters");
fs.mkdirSync(UPLOAD_DIR, { recursive: true }); // multer does not create missing dirs itself

// Map from the (already-validated) MIME type rather than trusting the
// client-supplied original filename's extension — closes off any chance
// of special characters riding through into the stored filename/URL.
const EXT_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // req.params.id (edit), req.eventId (pre-generated on create — see
    // assignEventId in routes/events.js), or req.body.id (the flat
    // /upload-poster endpoint — the client must send the "id" field
    // before the "poster" file field so multer has parsed it by now).
    // Strip to a safe charset — this is attacker-reachable (req.body.id
    // isn't validated against the DB until after multer runs), so it must
    // not be trusted verbatim as part of a filesystem path.
    const rawId = req.params.id || req.eventId || (req.body && req.body.id) || "unknown";
    const id = String(rawId).replace(/[^a-zA-Z0-9_-]/g, "");
    const ext = EXT_BY_MIME[file.mimetype] || "";
    cb(null, `event-${id}-${Date.now()}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error("Unsupported file type."));
  }
  cb(null, true);
}

module.exports = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });
