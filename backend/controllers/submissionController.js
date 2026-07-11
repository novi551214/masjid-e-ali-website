// ================================================================
// MASJID-E-ALI — Submissions Controller (Contact Us + Contact Scholar)
// ================================================================

const Submission = require("../models/Submission");
const mailer = require("../utils/mailer");

function createContactSubmission(req, res) {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !name.trim() || !email || !email.trim() || !subject || !subject.trim() || !message || !message.trim()) {
    return res.status(400).json({ error: "Name, email, subject, and message are required." });
  }

  const record = Submission.create({
    type: "contact",
    name: name.trim(),
    email: email.trim(),
    phone: (phone || "").trim(),
    subject: subject.trim(),
    message: message.trim(),
  });

  res.status(201).json({ success: true, id: record.id });

  mailer
    .sendMail({
      to: process.env.CONTACT_TO_EMAIL || "info@masjid-e-ali.org",
      subject: `New Contact Form message: ${record.subject}`,
      text: `Name: ${record.name}\nEmail: ${record.email}\nPhone: ${record.phone || "—"}\n\n${record.message}`,
      replyTo: record.email,
    })
    .catch((err) => console.error("[mailer] contact email failed:", err.message));
}

function createScholarSubmission(req, res) {
  const { name, email, phone, topic, question } = req.body;

  if (!name || !name.trim() || !email || !email.trim() || !topic || !topic.trim() || !question || !question.trim()) {
    return res.status(400).json({ error: "Name, email, topic, and question are required." });
  }

  const record = Submission.create({
    type: "scholar",
    name: name.trim(),
    email: email.trim(),
    phone: (phone || "").trim(),
    subject: topic.trim(),
    message: question.trim(),
  });

  res.status(201).json({ success: true, id: record.id });

  mailer
    .sendMail({
      to: process.env.SCHOLAR_TO_EMAIL || "riz8663@gmail.com",
      subject: `New question for Maulana Rizwan Rizvi: ${record.subject}`,
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
