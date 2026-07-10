# Masjid-e-Ali Website

Full website for Masjid-e-Ali (Muslim Foundation Inc.), Somerset, NJ —
a static frontend plus a small Node/Express backend that replaces the
old client-side-only admin panel with real authentication and a
real database.

```
masjid-e-ali-website/
├── frontend/          Static site (HTML/CSS/JS) — deploy anywhere
│   ├── index.html
│   ├── css/style.css
│   ├── js/            app.js, router.js, ui.js, admin.js, prayer.js
│   └── images/        logo, masjid photos, scholar portrait
├── backend/           Node/Express API — prayer times, events, admin auth
│   ├── server.js
│   ├── routes/        prayer-times.js, events.js, admin.js
│   ├── controllers/   prayerController.js, eventController.js, adminController.js
│   ├── models/        PrayerTime.js, Event.js
│   ├── middleware/     auth.js (JWT verification)
│   └── database/       db.js (schema), seed.js (initial admin + data)
├── .gitignore
└── README.md
```

---

## 1. Frontend

The frontend is a plain static site — no build step. Currently the
admin panel and prayer times still talk to `localStorage` (from the
original prototype). To connect it to the real backend below, update
`frontend/js/admin.js` and `frontend/js/prayer.js` to call the API
endpoints instead of (or in addition to) `localStorage` — see
**Section 3** for the exact endpoints available.

**To preview locally**, serve the `frontend/` folder with any static
file server, e.g.:

```bash
cd frontend
python3 -m http.server 5500
# then open http://localhost:5500
```

Do not open `index.html` directly via `file://` — the router and some
relative asset paths expect to be served over HTTP.

---

## 2. Backend Setup

### Requirements
- Node.js 18 or newer

### Install & run

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and set:
- `JWT_SECRET` — a long random string (generate one with the command shown in `.env.example`)
- `ADMIN_SEED_USERNAME` / `ADMIN_SEED_PASSWORD` — the admin login you'll use
- `CORS_ORIGIN` — the URL your frontend will be served from (e.g. `http://localhost:5500`, or your real domain in production)

Then seed the database (creates the admin user, a default prayer-times
row, and the 3 sample events) and start the server:

```bash
npm run seed
npm start
```

The API will be running at `http://localhost:4000` (or whatever `PORT`
you set). Data is stored in `backend/database/masjid.db`, a self-contained
SQLite file — no separate database server to install or manage.

> ⚠️ **Change the seeded admin password.** The `.env.example` default
> is a placeholder. Set a strong, unique `ADMIN_SEED_PASSWORD` in your
> real `.env` before running `npm run seed`.

---

## 3. API Reference

All responses are JSON. Protected routes require an
`Authorization: Bearer <token>` header, obtained from
`POST /api/admin/login`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | — | Basic uptime check |
| GET | `/api/prayer-times` | Public | Current prayer times |
| PUT | `/api/prayer-times` | Admin | Update one or more fields |
| GET | `/api/events` | Public | List all events |
| POST | `/api/events` | Admin | Create an event (`title`, `date` required) |
| PUT | `/api/events/:id` | Admin | Update an event |
| DELETE | `/api/events/:id` | Admin | Delete an event |
| POST | `/api/admin/login` | — | `{ username, password }` → `{ token, expiresIn }` |
| POST | `/api/admin/logout` | — | Client discards the token (stateless JWT) |

**Example — log in and update prayer times:**

```bash
curl -X POST http://localhost:4000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YOUR_PASSWORD"}'
# → { "token": "eyJ...", "expiresIn": "8h" }

curl -X PUT http://localhost:4000/api/prayer-times \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ..." \
  -d '{"fajar":"04:12","maghrib":"20:47"}'
```

Login attempts are rate-limited (10 per 15 minutes per IP) to slow
down password guessing.

---

## 4. Known Placeholders — Action Needed

These were intentionally left as placeholders rather than guessed:

- **Community Services** (Services page) has no dedicated source page
  yet — shown with a "Contact Us" placeholder card.
- **Live Broadcast embed** uses a YouTube channel *username*
  (`masjidealinj`), which the `live_stream?channel=` embed parameter
  technically expects as a channel *ID* (`UC...`). If the embed doesn't
  resolve, replace it with the real channel ID, or rely on the
  "Open on YouTube" fallback link already on that page.
- **ACH donation form** intentionally does **not** collect real bank
  account/routing numbers client-side (there's nowhere secure to send
  them without a backend for that specific purpose). It collects
  contact info and amount, and tells the donor the treasurer will
  follow up — update the copy/flow if you'd like this handled
  differently.

---

## 5. Security Notes

- Admin passwords are hashed with bcrypt (cost factor 12) — never
  stored in plain text.
- JWTs are signed with `JWT_SECRET` and expire after 8 hours.
- The login endpoint is rate-limited.
- `backend/database/masjid.db` and `.env` are git-ignored — never
  commit either one; both contain real secrets/credentials once seeded.
- CORS is restricted to `CORS_ORIGIN` — set this to your real frontend
  domain before deploying (not `*`).
