// ================================================================
// MASJID-E-ALI — Mailer (Gmail SMTP via nodemailer)
// Silently no-ops if credentials aren't configured yet, so the
// server still runs and submissions still save to the database
// before an admin has set up GMAIL_USER / GMAIL_APP_PASSWORD.
// ================================================================

const nodemailer = require("nodemailer");

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

let transporter = null;
if (GMAIL_USER && GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });
} else {
  console.warn(
    "[mailer] GMAIL_USER / GMAIL_APP_PASSWORD not set — submission emails will be skipped (form data is still saved to the database)."
  );
}

async function sendMail({ to, subject, text, replyTo }) {
  if (!transporter || !to) return;
  await transporter.sendMail({
    from: `"Masjid-e-Ali Website" <${GMAIL_USER}>`,
    to,
    subject,
    text,
    replyTo,
  });
}

module.exports = { sendMail };
