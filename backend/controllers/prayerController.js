// ================================================================
// MASJID-E-ALI — Prayer Times Controller
// ================================================================

const PrayerTime = require("../models/PrayerTime");

function getPrayerTimes(req, res) {
  const data = PrayerTime.getCurrent();
  if (!data) {
    return res.status(404).json({ error: "No prayer times set yet. Run the seed script." });
  }
  res.json(data);
}

function updatePrayerTimes(req, res) {
  const allowedFields = [
    "date_gregorian", "date_hijri", "imsaak", "fajar", "sunrise",
    "duhr", "asr", "sunset", "maghrib", "isha", "midnight"
  ];

  const payload = {};
  for (const field of allowedFields) {
    if (typeof req.body[field] === "string") {
      payload[field] = req.body[field].trim();
    }
  }

  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ error: "No valid prayer time fields provided." });
  }

  const updated = PrayerTime.update(payload);
  res.json(updated);
}

module.exports = { getPrayerTimes, updatePrayerTimes };
