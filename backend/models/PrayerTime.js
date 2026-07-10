// ================================================================
// MASJID-E-ALI — PrayerTime Model
// ================================================================

const db = require("../database/db");

const FIELDS = [
  "date_gregorian", "date_hijri", "imsaak", "fajar", "sunrise",
  "duhr", "asr", "sunset", "maghrib", "isha", "midnight"
];

function getCurrent() {
  const row = db.prepare("SELECT * FROM prayer_times WHERE id = 1").get();
  return row || null;
}

function update(data) {
  const existing = getCurrent();
  const merged = { ...existing, ...data };

  const setClause = FIELDS.map((f) => `${f} = @${f}`).join(", ");
  const stmt = db.prepare(`
    INSERT INTO prayer_times (id, ${FIELDS.join(", ")}, updated_at)
    VALUES (1, ${FIELDS.map((f) => `@${f}`).join(", ")}, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET ${setClause}, updated_at = CURRENT_TIMESTAMP
  `);

  const params = {};
  FIELDS.forEach((f) => { params[f] = merged[f] ?? null; });
  stmt.run(params);

  return getCurrent();
}

module.exports = { getCurrent, update, FIELDS };
