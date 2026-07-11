// ================================================================
// MASJID-E-ALI — Database Connection & Schema
// Uses better-sqlite3: zero-config, file-based, no separate DB server
// to install. Swap this file out for a Postgres/MySQL client later
// without touching routes/controllers — they only call the exported
// helper functions below.
// ================================================================

const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "masjid.db");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");

// ---- Schema ----------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS prayer_times (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- single-row table (current override)
    date_gregorian TEXT,
    date_hijri TEXT,
    imsaak TEXT,
    fajar TEXT,
    sunrise TEXT,
    duhr TEXT,
    asr TEXT,
    sunset TEXT,
    maghrib TEXT,
    isha TEXT,
    midnight TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    speakers TEXT,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('contact', 'scholar')),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Single-row table: the currently live YouTube video(s), set manually by
  -- an admin when a stream starts (see models/Broadcast.js). Two independent
  -- slots since parallel English/Urdu majalis sometimes broadcast at once.
  -- NULL in either column means that slot isn't live right now.
  -- Urdu defaults to hidden — most days only English broadcasts, and the
  -- admin explicitly shows Urdu on the rare day both run in parallel.
  CREATE TABLE IF NOT EXISTS broadcast (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    video_id_english TEXT,
    video_id_urdu TEXT,
    visible_english INTEGER NOT NULL DEFAULT 1,
    visible_urdu INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// ---- Migrations (safe to re-run on an already-populated DB) -----
let eventCols = db.prepare("PRAGMA table_info(events)").all().map((c) => c.name);
if (!eventCols.includes("schedule")) {
  db.exec("ALTER TABLE events ADD COLUMN schedule TEXT");
}
if (!eventCols.includes("poster_url")) {
  if (eventCols.includes("pamphlet_url")) {
    db.exec("ALTER TABLE events RENAME COLUMN pamphlet_url TO poster_url");
  } else {
    db.exec("ALTER TABLE events ADD COLUMN poster_url TEXT");
  }
}
eventCols = db.prepare("PRAGMA table_info(events)").all().map((c) => c.name);
if (!eventCols.includes("poster_alt")) {
  db.exec("ALTER TABLE events ADD COLUMN poster_alt TEXT");
}

let broadcastCols = db.prepare("PRAGMA table_info(broadcast)").all().map((c) => c.name);
if (broadcastCols.includes("video_id") && !broadcastCols.includes("video_id_english")) {
  db.exec("ALTER TABLE broadcast RENAME COLUMN video_id TO video_id_english");
  broadcastCols = db.prepare("PRAGMA table_info(broadcast)").all().map((c) => c.name);
}
if (!broadcastCols.includes("video_id_english")) {
  db.exec("ALTER TABLE broadcast ADD COLUMN video_id_english TEXT");
}
if (!broadcastCols.includes("video_id_urdu")) {
  db.exec("ALTER TABLE broadcast ADD COLUMN video_id_urdu TEXT");
}
if (!broadcastCols.includes("visible_english")) {
  db.exec("ALTER TABLE broadcast ADD COLUMN visible_english INTEGER NOT NULL DEFAULT 1");
}
if (!broadcastCols.includes("visible_urdu")) {
  db.exec("ALTER TABLE broadcast ADD COLUMN visible_urdu INTEGER NOT NULL DEFAULT 0");
}

module.exports = db;
