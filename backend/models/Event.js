// ================================================================
// MASJID-E-ALI — Event Model
// ================================================================

const crypto = require("crypto");
const db = require("../database/db");

function generateId() {
  return "evt-" + crypto.randomUUID();
}

function getAll() {
  return db.prepare("SELECT * FROM events ORDER BY created_at ASC").all();
}

function getById(id) {
  return db.prepare("SELECT * FROM events WHERE id = ?").get(id) || null;
}

function create({ id, title, date, speakers, schedule, description, poster_url, poster_alt }) {
  const eventId = id || generateId();
  db.prepare(`
    INSERT INTO events (id, title, date, speakers, schedule, description, poster_url, poster_alt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    eventId, title, date,
    speakers || "", schedule || "", description || "",
    poster_url || null, poster_alt || null
  );
  return getById(eventId);
}

function update(id, { title, date, speakers, schedule, description, poster_url, poster_alt }) {
  const existing = getById(id);
  if (!existing) return null;

  db.prepare(`
    UPDATE events
    SET title = ?, date = ?, speakers = ?, schedule = ?, description = ?,
        poster_url = ?, poster_alt = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title ?? existing.title,
    date ?? existing.date,
    speakers ?? existing.speakers,
    schedule ?? existing.schedule,
    description ?? existing.description,
    poster_url !== undefined ? poster_url : existing.poster_url,
    poster_alt !== undefined ? poster_alt : existing.poster_alt,
    id
  );
  return getById(id);
}

function remove(id) {
  const result = db.prepare("DELETE FROM events WHERE id = ?").run(id);
  return result.changes > 0;
}

function setPoster(id, { url, alt }) {
  const existing = getById(id);
  if (!existing) return null;
  db.prepare("UPDATE events SET poster_url = ?, poster_alt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
    url,
    alt || null,
    id
  );
  return getById(id);
}

module.exports = { generateId, getAll, getById, create, update, remove, setPoster };
