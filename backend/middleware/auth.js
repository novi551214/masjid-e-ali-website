// ================================================================
// MASJID-E-ALI — Auth Middleware
// Verifies a JWT bearer token on protected (admin-only) routes.
// ================================================================

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "";

if (JWT_SECRET.length < 32 || /change|replace|example|secret/i.test(JWT_SECRET)) {
  // Fail loudly at startup rather than silently signing tokens with "undefined"
  throw new Error(
    "JWT_SECRET must be a non-placeholder value of at least 32 characters. Copy .env.example to .env and generate a new secret before starting the server."
  );
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or malformed Authorization header." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload; // { sub, username, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

module.exports = { requireAdmin, JWT_SECRET };
