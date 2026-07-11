// ================================================================
// MASJID-E-ALI — Broadcast Model
// Single-row table holding the currently live YouTube video(s) and
// whether each language's section shows on the public page at all,
// set manually by an admin (see controllers/liveController.js). Two
// independent slots — "english" and "urdu" — since parallel majalis
// in both languages sometimes broadcast at the same time (rare — the
// visibility flag lets the admin hide the language that isn't in use
// on a normal day instead of showing an empty "not live" section).
// ================================================================

const db = require("../database/db");

const SLOTS = ["english", "urdu"];

function getCurrent() {
  return db.prepare("SELECT * FROM broadcast WHERE id = 1").get() ||
    { id: 1, video_id_english: null, video_id_urdu: null, visible_english: 1, visible_urdu: 1 };
}

function setVideoId(slot, videoId) {
  if (!SLOTS.includes(slot)) throw new Error(`Unknown broadcast slot "${slot}"`);
  const column = "video_id_" + slot;
  db.prepare(`
    INSERT INTO broadcast (id, ${column}, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET ${column} = ?, updated_at = CURRENT_TIMESTAMP
  `).run(videoId, videoId);
  return getCurrent();
}

function setVisible(slot, visible) {
  if (!SLOTS.includes(slot)) throw new Error(`Unknown broadcast slot "${slot}"`);
  const column = "visible_" + slot;
  const value = visible ? 1 : 0;
  db.prepare(`
    INSERT INTO broadcast (id, ${column}, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET ${column} = ?, updated_at = CURRENT_TIMESTAMP
  `).run(value, value);
  return getCurrent();
}

module.exports = { SLOTS, getCurrent, setVideoId, setVisible };
