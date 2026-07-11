// ================================================================
// MASJID-E-ALI — Submission Model (Contact Us + Contact Scholar)
// ================================================================

const crypto = require("crypto");
const db = require("../database/db");

function getAll() {
  return db.prepare("SELECT * FROM submissions ORDER BY created_at DESC").all();
}

function getById(id) {
  return db.prepare("SELECT * FROM submissions WHERE id = ?").get(id) || null;
}

function create({ type, name, email, phone, subject, message }) {
  const id = "sub-" + crypto.randomUUID();
  db.prepare(`
    INSERT INTO submissions (id, type, name, email, phone, subject, message)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, type, name, email, phone || "", subject, message);
  return getById(id);
}

function remove(id) {
  const result = db.prepare("DELETE FROM submissions WHERE id = ?").run(id);
  return result.changes > 0;
}

module.exports = { getAll, getById, create, remove };
