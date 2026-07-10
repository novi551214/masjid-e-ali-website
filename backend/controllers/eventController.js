// ================================================================
// MASJID-E-ALI — Events Controller
// ================================================================

const fs = require("fs");
const path = require("path");
const Event = require("../models/Event");

function removeUploadedFile(posterUrl) {
  if (!posterUrl) return;
  const filePath = path.join(__dirname, "..", posterUrl.replace(/^\/uploads\//, "uploads/"));
  fs.unlink(filePath, () => {});
}

function posterFieldsFromUpload(req, title) {
  if (!req.file) return {};
  return {
    poster_url: `/uploads/posters/${req.file.filename}`,
    poster_alt: title
  };
}

function listEvents(req, res) {
  res.json(Event.getAll());
}

function createEvent(req, res) {
  const { title, date, speakers, schedule, description } = req.body;

  if (!title || !title.trim() || !date || !date.trim()) {
    removeUploadedFile(req.file && `/uploads/posters/${req.file.filename}`);
    return res.status(400).json({ error: "Both 'title' and 'date' are required." });
  }

  const event = Event.create({
    id: req.eventId,
    title: title.trim(),
    date: date.trim(),
    speakers: (speakers || "").trim(),
    schedule: (schedule || "").trim(),
    description: (description || "").trim(),
    ...posterFieldsFromUpload(req, title.trim())
  });

  res.status(201).json(event);
}

function updateEvent(req, res) {
  const { id } = req.params;
  const existing = Event.getById(id);
  if (!existing) {
    return res.status(404).json({ error: `Event "${id}" not found.` });
  }

  const { title, date, speakers, schedule, description, removePoster } = req.body;

  let posterFields = {};
  if (req.file) {
    removeUploadedFile(existing.poster_url);
    posterFields = posterFieldsFromUpload(req, (title || existing.title).trim());
  } else if (removePoster === "true" || removePoster === true) {
    removeUploadedFile(existing.poster_url);
    posterFields = { poster_url: null, poster_alt: null };
  }

  const updated = Event.update(id, { title, date, speakers, schedule, description, ...posterFields });
  res.json(updated);
}

function deleteEvent(req, res) {
  const { id } = req.params;
  const existing = Event.getById(id);
  if (!existing) {
    return res.status(404).json({ error: `Event "${id}" not found.` });
  }
  removeUploadedFile(existing.poster_url);
  Event.remove(id);
  res.status(204).send();
}

function uploadPoster(req, res) {
  const { id } = req.body;
  const existing = id && Event.getById(id);
  if (!existing) {
    return res.status(404).json({ error: `Event "${id}" not found.` });
  }
  if (!req.file) {
    return res.status(400).json({ error: "No image file uploaded." });
  }

  removeUploadedFile(existing.poster_url);
  const updated = Event.setPoster(id, {
    url: `/uploads/posters/${req.file.filename}`,
    alt: existing.title
  });
  res.json(updated);
}

module.exports = { listEvents, createEvent, updateEvent, deleteEvent, uploadPoster };
