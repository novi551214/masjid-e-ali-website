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
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === "production";

function allowedOrigins() {
  const raw = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "";
  const origins = raw.split(",").map((value) => value.trim()).filter(Boolean).map((value) => {
    try {
      return new URL(value).origin;
    } catch {
      throw new Error(`Invalid CORS origin: ${value}`);
    }
  });
  if (isProduction && origins.length === 0) {
    throw new Error("CORS_ORIGIN or CORS_ORIGINS must contain an exact HTTPS origin in production.");
  }
  return origins;
}

const ALLOWED_ORIGINS = allowedOrigins();

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  next();
});
app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(Object.assign(new Error("Origin not allowed by CORS."), { status: 403 }));
  },
}));
app.use(express.json({ limit: "100kb" }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---- Routes ------------------------------------------------------
app.use("/api/prayer-times", require("./routes/prayer-times"));
app.use("/api/events", require("./routes/events"));
app.use("/api/submissions", require("./routes/submissions"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/live-status", require("./routes/live"));

// ---- Health check --------------------------------------------------
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// ---- 404 fallback ---------------------------------------------------
app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

// ---- Error handler ----------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.status === 403 ? err.message : "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`Masjid-e-Ali API listening on http://localhost:${PORT}`);
  if (ALLOWED_ORIGINS.length === 0) {
    console.warn("No cross-origin frontend is configured; only requests without an Origin header will be accepted.");
  }
});
