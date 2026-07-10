// ================================================================
// MASJID-E-ALI — Backend Server Entry Point
// ================================================================
// Run:
//   npm install
//   cp .env.example .env   (then edit .env — set a real JWT_SECRET
//                            and admin password before seeding)
//   npm run seed            (creates admin user + default data)
//   npm start                (or `npm run dev` for auto-restart)
//
// The server listens on PORT (default 4000) and exposes:
//   GET  /api/prayer-times
//   PUT  /api/prayer-times          (admin)
//   GET  /api/events
//   POST /api/events                (admin)
//   PUT  /api/events/:id            (admin)
//   DELETE /api/events/:id          (admin)
//   POST /api/events/:id/pamphlet   (admin)
//   DELETE /api/events/:id/pamphlet (admin)
//   POST /api/submissions/contact
//   POST /api/submissions/scholar
//   GET  /api/submissions           (admin)
//   POST /api/admin/login
//   POST /api/admin/logout
// ================================================================

require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || "*";

app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: "100kb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---- Routes ------------------------------------------------------
app.use("/api/prayer-times", require("./routes/prayer-times"));
app.use("/api/events", require("./routes/events"));
app.use("/api/submissions", require("./routes/submissions"));
app.use("/api/admin", require("./routes/admin"));

// ---- Health check --------------------------------------------------
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// ---- 404 fallback ---------------------------------------------------
app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

// ---- Error handler ----------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`Masjid-e-Ali API listening on http://localhost:${PORT}`);
  if (ALLOWED_ORIGIN === "*") {
    console.warn("⚠️  CORS_ORIGIN is '*' — fine for local dev, but set it to your real frontend domain in production.");
  }
});
