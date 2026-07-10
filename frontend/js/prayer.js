// ================================================================
// MASJID-E-ALI — Prayer Times Module
// Uses AlAdhan API: https://api.aladhan.com/v1/timingsByCity
// ================================================================

// Shia Ithna-Ashari (Jafari) approximate fallback times for Somerset, NJ
// Fajr 16°, Isha 14°, Maghrib 4° after sunset, Asr = shadow doubles
const DEFAULT_PRAYER_TIMES = {
  Imsak:   "03:30",
  Fajr:    "03:46",
  Sunrise: "05:33",
  Dhuhr:   "13:02",
  Asr:     "17:45",   // Jafari Asr — later than Shafi (shadow doubles)
  Maghrib: "21:10",   // ~17 min after sunset (redness leaves sky)
  Isha:    "22:05",   // 14° below horizon
  Midnight:"00:15"
};

const PRAYER_DISPLAY = [
  { key: "Imsak",   label: "Imsaak"   },
  { key: "Fajr",    label: "Fajr"     },
  { key: "Sunrise", label: "Sunrise"  },
  { key: "Dhuhr",   label: "Duhr"     },
  { key: "Asr",     label: "Asr"      },
  { key: "Maghrib", label: "Maghrib"  },
  { key: "Isha",    label: "Isha"     },
  { key: "Midnight",label: "Midnight" }
];

// Keys eligible for "next prayer" countdown (skip Imsak, Sunrise, Midnight)
const COUNTDOWN_PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

window.PrayerModule = (function () {

  let _timings = {};
  let _hijriDate = "";
  let _gregorianDate = "";
  let _countdownInterval = null;

  // ── Helpers ──────────────────────────────────────────────────

  function _parseTime(hhmm) {
    if (!hhmm || hhmm === "—") return null;
    const clean = hhmm.replace(/\s*(AM|PM)/i, "").trim();
    const parts = clean.split(":");
    if (parts.length < 2) return null;
    return { h: parseInt(parts[0], 10), m: parseInt(parts[1], 10) };
  }

  function _toMinutes(hhmm) {
    const t = _parseTime(hhmm);
    if (!t) return -1;
    return t.h * 60 + t.m;
  }

  function _formatGregorian(dateStr) {
    // dateStr from API: "02 Jul 2026" or JS Date
    try {
      const d = dateStr ? new Date(dateStr) : new Date();
      return d.toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
    } catch (e) {
      return new Date().toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
    }
  }

  function _formatHijri(hijri) {
    if (!hijri) return "";
    return hijri.month.en + " " + hijri.day + ", " + hijri.year + " AH";
  }

  // ── API Fetch ─────────────────────────────────────────────────

  async function fetchAndRender() {
    try {
      // Shia Ithna-Ashari (Jafari) calculation:
      //   method=0 = custom angles
      //   methodSettings=16,4,14 → Fajr 16°, Maghrib 4° after sunset, Isha 14°
      //   midnightMode=1 → midnight = midpoint Maghrib→Fajr (Jafari standard)
      //
      // We fetch TWO calls in parallel:
      //   Call A: school=0 (Shafi) — correct Fajr, Maghrib, Isha, Midnight
      //   Call B: school=1 (Hanafi) — correct Asr (shadow doubles = Jafari Asr)
      // Then we combine: take Asr from Call B, everything else from Call A.

      const BASE = "https://api.aladhan.com/v1/timingsByCity?city=Somerset&country=US&state=NJ" +
        "&method=0&methodSettings=16,4,14&midnightMode=1";

      const [resA, resB] = await Promise.all([
        fetch(BASE + "&school=0"),
        fetch(BASE + "&school=1")
      ]);

      if (!resA.ok || !resB.ok) throw new Error("API error");

      const [jsonA, jsonB] = await Promise.all([resA.json(), resB.json()]);
      const dataA = jsonA.data;
      const dataB = jsonB.data;

      // Start with all times from Call A (Shafi — correct Fajr/Maghrib/Isha)
      _timings = Object.assign({}, DEFAULT_PRAYER_TIMES, dataA.timings);

      // Override Asr with Hanafi/Jafari time from Call B (shadow doubles)
      if (dataB.timings && dataB.timings.Asr) {
        _timings.Asr = dataB.timings.Asr;
      }
      // Also use AsrHanafi if the API exposes it separately
      if (dataB.timings && dataB.timings.AsrHanafi) {
        _timings.Asr = dataB.timings.AsrHanafi;
      }

      _hijriDate     = _formatHijri(dataA.date.hijri);
      _gregorianDate = _formatGregorian(dataA.date.readable);

      // Cache to localStorage
      localStorage.setItem("mea_prayer_api_cache", JSON.stringify({
        timings: _timings,
        hijri: _hijriDate,
        gregorian: _gregorianDate,
        cached_at: Date.now()
      }));

    } catch (err) {
      console.warn("PrayerModule: API fetch failed, using cache/defaults.", err);
      // Try cache
      try {
        const cached = JSON.parse(localStorage.getItem("mea_prayer_api_cache") || "null");
        if (cached && cached.timings) {
          _timings = cached.timings;
          _hijriDate = cached.hijri || "";
          _gregorianDate = cached.gregorian || _formatGregorian();
        } else {
          throw new Error("no cache");
        }
      } catch (_) {
        _timings = Object.assign({}, DEFAULT_PRAYER_TIMES);
        _gregorianDate = _formatGregorian();
        _hijriDate = "";
      }
    }

    // Check admin override
    _applyAdminOverride();

    renderDateBar();
    renderPrayerGrid();
    startCountdown();
  }

  // ── Admin Override ────────────────────────────────────────────

  function _applyAdminOverride() {
    try {
      const override = JSON.parse(localStorage.getItem("mea_prayer_times") || "null");
      if (!override) return;
      // Merge admin times on top of API times
      const map = {
        imsaak: "Imsak", fajar: "Fajr", sunrise: "Sunrise",
        duhr: "Dhuhr", asr: "Asr", sunset: "Sunset",
        maghrib: "Maghrib", isha: "Isha", midnight: "Midnight"
      };
      Object.keys(map).forEach(function (k) {
        if (override[k]) _timings[map[k]] = override[k];
      });
      if (override.dateGregorian) _gregorianDate = override.dateGregorian;
      if (override.dateHijri)     _hijriDate     = override.dateHijri;
    } catch (e) { /* ignore */ }
  }

  // ── Render Date Bar ───────────────────────────────────────────

  function renderDateBar() {
    const greg  = document.getElementById("gregorianDate");
    const hijri = document.getElementById("hijriDate");
    const pgGreg  = document.getElementById("prayerGregorianDate");
    const pgHijri = document.getElementById("prayerHijriDate");

    const gText = _gregorianDate || _formatGregorian();
    const hText = _hijriDate     || "";

    if (greg)    greg.textContent    = gText;
    if (hijri)   hijri.textContent   = hText;
    if (pgGreg)  pgGreg.textContent  = gText;
    if (pgHijri) pgHijri.textContent = hText;
  }

  // ── Render Prayer Grid ────────────────────────────────────────

  function renderPrayerGrid() {
    const grid = document.getElementById("prayerGrid");
    if (!grid) return;

    const nextKey = _getNextPrayerKey();

    grid.innerHTML = PRAYER_DISPLAY.map(function (p) {
      const time = _timings[p.key] || "--:--";
      const isNext = (p.key === nextKey);
      return '<div class="prayer-item' + (isNext ? " next-prayer" : "") + '">' +
        '<div class="label">' + p.label + '</div>' +
        '<div class="time">' + time + '</div>' +
        '</div>';
    }).join("");
  }

  // ── Next Prayer ───────────────────────────────────────────────

  function _getNextPrayerKey() {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    for (let i = 0; i < COUNTDOWN_PRAYERS.length; i++) {
      const key = COUNTDOWN_PRAYERS[i];
      const min = _toMinutes(_timings[key]);
      if (min > nowMin) return key;
    }
    // Past Isha — next is Fajr (tomorrow)
    return "Fajr";
  }

  // ── Countdown ─────────────────────────────────────────────────

  function startCountdown() {
    if (_countdownInterval) clearInterval(_countdownInterval);
    _tick();
    _countdownInterval = setInterval(_tick, 1000);
  }

  function _tick() {
    const el = document.getElementById("nextPrayerCountdown");
    if (!el) return;

    const nextKey = _getNextPrayerKey();
    const t = _parseTime(_timings[nextKey]);
    if (!t) { el.textContent = ""; return; }

    const now = new Date();
    let targetMs = new Date(
      now.getFullYear(), now.getMonth(), now.getDate(),
      t.h, t.m, 0
    ).getTime();

    // If next prayer is Fajr and we're past Isha, target is tomorrow
    if (targetMs <= now.getTime()) targetMs += 24 * 60 * 60 * 1000;

    const diff = Math.max(0, Math.floor((targetMs - now.getTime()) / 1000));
    const hh = Math.floor(diff / 3600);
    const mm = Math.floor((diff % 3600) / 60);
    const ss = diff % 60;

    const pad = function (n) { return String(n).padStart(2, "0"); };
    el.textContent = "Next: " + nextKey + " in " + pad(hh) + "h " + pad(mm) + "m " + pad(ss) + "s";

    // Re-render grid every minute to update highlight
    if (ss === 0) renderPrayerGrid();
  }

  // ── Schedule midnight re-fetch ─────────────────────────────────

  function _scheduleMidnightRefresh() {
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(), now.getMonth(), now.getDate() + 1,
      0, 1, 0 // 12:01 AM next day
    );
    const msUntilMidnight = midnight.getTime() - now.getTime();
    setTimeout(function () {
      fetchAndRender();
      _scheduleMidnightRefresh();
    }, msUntilMidnight);
  }

  // ── Public API ────────────────────────────────────────────────

  return {
    init: function () {
      fetchAndRender();
      _scheduleMidnightRefresh();
      // Also re-fetch every 60 min
      setInterval(fetchAndRender, 60 * 60 * 1000);
    },
    fetchAndRender:  fetchAndRender,
    renderPrayerGrid: renderPrayerGrid,
    renderDateBar:   renderDateBar,
    startCountdown:  startCountdown,
    getLastTimings:  function () { return _timings; }
  };

})();
