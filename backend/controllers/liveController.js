// ================================================================
// MASJID-E-ALI — Live Broadcast Status Controller
// Manually admin-controlled: the admin pastes the YouTube video/live
// URL into the dashboard when a stream starts, and this just serves
// that video ID back out. No external API or credentials required.
// Two independent slots (english/urdu), each with its own live video
// and a visibility flag so the admin can hide the language that isn't
// in use on a normal (single-language) day.
// ================================================================

const Broadcast = require("../models/Broadcast");

// Accepts a full YouTube URL (watch, youtu.be, /live/, /embed/) or a bare
// video ID, and extracts the video ID.
function extractVideoId(input) {
  if (!input) return null;
  const trimmed = input.trim();

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/live\/|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{6,})/
  ];
  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m) return m[1];
  }

  // Already looks like a bare video ID
  if (/^[a-zA-Z0-9_-]{6,}$/.test(trimmed)) return trimmed;

  return null;
}

function _slotStatus(row, slot) {
  const videoId = row["video_id_" + slot] || null;
  return { live: !!videoId, videoId, visible: !!row["visible_" + slot] };
}

function _fullStatus(row) {
  return {
    configured: true,
    english: _slotStatus(row, "english"),
    urdu: _slotStatus(row, "urdu")
  };
}

function getLiveStatus(req, res) {
  res.json(_fullStatus(Broadcast.getCurrent()));
}

function setLiveStatus(req, res) {
  const { slot, videoUrl, visible } = req.body;

  if (!Broadcast.SLOTS.includes(slot)) {
    return res.status(400).json({ error: 'Field "slot" must be "english" or "urdu".' });
  }

  let row = Broadcast.getCurrent();

  if (typeof visible === "boolean") {
    row = Broadcast.setVisible(slot, visible);
  }

  if (typeof videoUrl === "string") {
    if (!videoUrl.trim()) {
      row = Broadcast.setVideoId(slot, null);
    } else {
      const videoId = extractVideoId(videoUrl);
      if (!videoId) {
        return res.status(400).json({ error: "Could not find a video ID in that URL. Paste the full YouTube video or live URL." });
      }
      row = Broadcast.setVideoId(slot, videoId);
    }
  }

  res.json(_fullStatus(row));
}

module.exports = { getLiveStatus, setLiveStatus };
