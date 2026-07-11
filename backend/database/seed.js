// ================================================================
// MASJID-E-ALI — Database Seed Script
// Run once with: npm run seed
// Creates the initial admin user and default sample events.
// Safe to re-run — uses INSERT OR IGNORE / UPSERT patterns.
// ================================================================

require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("./db");

// ---- Admin user --------------------------------------------------
// ⚠️ CHANGE THIS PASSWORD before deploying to production.
// Set ADMIN_SEED_PASSWORD in your .env file to override the default.
const ADMIN_USERNAME = process.env.ADMIN_SEED_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "ChangeMe_Masjid2026!";

const existingAdmin = db.prepare("SELECT id FROM admins WHERE username = ?").get(ADMIN_USERNAME);

if (!existingAdmin) {
  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 12);
  db.prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)").run(ADMIN_USERNAME, hash);
  console.log(`✅ Admin user created — username: "${ADMIN_USERNAME}"`);
  console.log(`   Password: ${ADMIN_PASSWORD === "ChangeMe_Masjid2026!" ? "(default — CHANGE THIS, see .env.example)" : "(set from .env)"}`);
} else {
  console.log(`ℹ️  Admin user "${ADMIN_USERNAME}" already exists — skipping.`);
}

// ---- Default prayer times row -------------------------------------
// All fields blank by default: this row only exists to hold *admin
// overrides* for specific fields. Blank = "no override, use the live
// AlAdhan API calculation instead" (see frontend/js/prayer.js).
const existingPrayer = db.prepare("SELECT id FROM prayer_times WHERE id = 1").get();
if (!existingPrayer) {
  db.prepare(`
    INSERT INTO prayer_times (id, date_gregorian, date_hijri, imsaak, fajar, sunrise, duhr, asr, sunset, maghrib, isha, midnight)
    VALUES (1, '', '', '', '', '', '', '', '', '', '', '')
  `).run();
  console.log("✅ Default (blank) prayer times row created.");
} else {
  console.log("ℹ️  Prayer times row already exists — skipping.");
}

// ---- Default sample events -----------------------------------------
// One-time cleanup: the very first prototype seeded 3 placeholder events
// (evt-1/evt-2/evt-3). Remove them so re-running this script lands on the
// 10 real events below instead of leaving stale placeholders alongside them.
const placeholderIds = ["evt-1", "evt-2", "evt-3"];
const removePlaceholder = db.prepare("DELETE FROM events WHERE id = ?");
for (const id of placeholderIds) removePlaceholder.run(id);

const eventCount = db.prepare("SELECT COUNT(*) AS c FROM events").get().c;
if (eventCount === 0) {
  const insert = db.prepare(`
    INSERT INTO events (id, title, date, speakers, schedule, description) VALUES (?, ?, ?, ?, ?, ?)
  `);
  const defaults = [
    ["evt-muharram-1-12", "Muharram Majalis (1st-12th)", "June 16-27",
     "Maulana Jafar Banglori, Sayed Hadi Qazwini, Sayed Mehboob Mehdi, Sayed Saleh Qazwini, Sheikh Muslim Mehdi",
     "", ""],
    ["evt-shahadat-imam-sajjad", "Shahadat of Imam Sajjad (a.s)", "July 10-12",
     "Multiple",
     "6:45 PM Quran\n6:50 PM Soz/Salam\n7:25 PM Announcements\n7:30 PM Majlis\n8:20 PM Matam\n8:49 PM Namaz e Maghribain",
     ""],
    ["evt-njaa-shab-bedari", "NJAA Annual Shab Bedari", "July 11",
     "Various",
     "8:49 PM Namaz e Maghribain\n9:15 PM Quran\n9:20 PM Soz/Salam\n9:40 PM Announcements\n9:45 PM Majlis\n10:40 PM Matam & Shab Bedari",
     ""],
    ["evt-syed-ali-safdar-rizvi", "Syed Ali Safdar Rizvi Program", "July 12",
     "Syed Ali Safdar Rizvi", "", ""],
    ["evt-muharram-13-15", "Muharram Majalis (13th-15th)", "July 17-19",
     "(Speakers TBD)", "", ""],
    ["evt-muharram-16-18", "Muharram Majalis (16th-18th)", "July 24-26",
     "Sayed Hossein Qazwini, Sheikh Mirza Abbas", "", ""],
    ["evt-muharram-19-22", "Muharram Majalis (19th-22nd)", "July 31-Aug 4",
     "Sayed Hadi Qazwini, Sayed Mehboob Mehdi, Sayed Saleh Qazwini", "", ""],
    ["evt-muharram-23-25", "Muharram Majalis (23rd-25th)", "August 6-7",
     "Sayed Hossein Qazwini, Sheikh Jaffer H. Jaffer", "", ""],
    ["evt-muharram-26-28", "Muharram Majalis (26th-28th)", "August 11-12",
     "Sheikh Mirza Abbas, Maulana Sadiq Hasan", "", ""],
    ["evt-muharram-29-30", "Muharram Majalis (29th-30th)", "August 20-22",
     "(Speakers TBD)", "", ""]
  ];
  const insertMany = db.transaction((rows) => { for (const r of rows) insert.run(...r); });
  insertMany(defaults);
  console.log("✅ 10 default sample events created.");
} else {
  console.log("ℹ️  Events already exist — skipping default seed.");
}

console.log("\nSeed complete.");
