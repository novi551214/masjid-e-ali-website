// ================================================================
// MASJID-E-ALI — Admin Auth Controller
// Real password hashing (bcrypt) + signed JWTs. Replaces the old
// client-side "ADMIN_PASSWORD" constant from the prototype.
// ================================================================

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../database/db");
const { JWT_SECRET } = require("../middleware/auth");

const TOKEN_EXPIRY = "8h";

function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const admin = db.prepare("SELECT * FROM admins WHERE username = ?").get(username);
  if (!admin) {
    // Same error for "no such user" and "wrong password" — avoids leaking
    // which usernames exist.
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const valid = bcrypt.compareSync(password, admin.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const token = jwt.sign(
    { sub: admin.id, username: admin.username },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  res.json({ token, expiresIn: TOKEN_EXPIRY });
}

function logout(req, res) {
  // Stateless JWTs can't be "revoked" server-side without a blocklist.
  // For this scale (single admin, low frequency), the client simply
  // discards the token. If you need real revocation, add a
  // `revoked_tokens` table keyed by JWT `jti` and check it in
  // middleware/auth.js.
  res.json({ message: "Logged out. Discard the token on the client." });
}

module.exports = { login, logout };
