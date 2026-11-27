// ================================================================
// MASJID-E-ALI — Submissions Controller (Contact Us + Contact Scholar)
// ================================================================

const Submission = require("../models/Submission");
const mailer = require("../utils/mailer");
const { normalizeSubmission } = require("../lib/submissionValidation");

function createContactSubmission(req, res) {
  const { valid, data } = normalizeSubmission(req.body, "contact");
  const { name, email, phone, subject, message } = data;

  if (!valid) {
    return res.status(400).json({ error: "Provide a valid email and keep all required fields within their length limits." });
  }

  const record = Submission.create({
    type: "contact",
    name,
    email,
    phone,
    subject,
    message,
  });

  res.status(201).json({ success: true, id: record.id });

  mailer
    .sendMail({
      to: process.env.CONTACT_TO_EMAIL,
      subject: `New Contact Form message: ${record.subject}`,
      text: `Name: ${record.name}\nEmail: ${record.email}\nPhone: ${record.phone || "—"}\n\n${record.message}`,
      replyTo: record.email,
    })
    .catch((err) => console.error("[mailer] contact email failed:", err.message));
}

function createScholarSubmission(req, res) {
  const { valid, data } = normalizeSubmission(req.body, "scholar");
  const { name, email, phone, subject, message } = data;

  if (!valid) {
    return res.status(400).json({ error: "Provide a valid email and keep all required fields within their length limits." });
  }

  const record = Submission.create({
    type: "scholar",
    name,
    email,
    phone,
    subject,
    message,
  });

  res.status(201).json({ success: true, id: record.id });

  mailer
    .sendMail({
      to: process.env.SCHOLAR_TO_EMAIL,
      subject: `New scholar question: ${record.subject}`,
      text: `Name: ${record.name}\nEmail: ${record.email}\nPhone: ${record.phone || "—"}\n\n${record.message}`,
      replyTo: record.email,
    })
    .catch((err) => console.error("[mailer] scholar email failed:", err.message));
}

function listSubmissions(req, res) {
  res.json(Submission.getAll());
}

function deleteSubmission(req, res) {
  const { id } = req.params;
  const deleted = Submission.remove(id);
  if (!deleted) {
    return res.status(404).json({ error: `Submission "${id}" not found.` });
  }
  res.status(204).send();
}

module.exports = { createContactSubmission, createScholarSubmission, listSubmissions, deleteSubmission };
