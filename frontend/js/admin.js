// ================================================================
// MASJID-E-ALI — Admin Panel Module
// Wired to the real backend API (backend/server.js). Events are
// entirely backend-driven — no client-side (localStorage) fallback.
// ================================================================

// ── API config ────────────────────────────────────────────────────
// Change this to your live backend URL when deploying.
// e.g. "https://api.masjid-e-ali.org"
var API_BASE = window.MEA_API_BASE || "http://localhost:4000";

// Holds the JWT token after successful login
var _adminToken = null;

// ── Default Data (prayer times only — events are backend-only) ────

var DEFAULT_PRAYER_OVERRIDE = {
  dateGregorian: "", dateHijri: "",
  imsaak: "", fajar: "", sunrise: "", duhr: "",
  asr: "", sunset: "", maghrib: "", isha: "", midnight: ""
};

// ── API helpers ───────────────────────────────────────────────────

function _apiFetch(path, options) {
  var opts = options || {};
  var headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
  if (_adminToken) headers["Authorization"] = "Bearer " + _adminToken;
  return fetch(API_BASE + path, Object.assign({}, opts, { headers: headers }));
}

// Multipart requests must NOT set Content-Type manually (the browser needs
// to add its own boundary), so this skips the JSON header _apiFetch adds.
function _apiFetchForm(path, options) {
  var opts = options || {};
  var headers = Object.assign({}, opts.headers || {});
  if (_adminToken) headers["Authorization"] = "Bearer " + _adminToken;
  return fetch(API_BASE + path, Object.assign({}, opts, { headers: headers }));
}

// ── DataStore (prayer times only) ──────────────────────────────────

window.DataStore = {
  PRAYER_KEY: "mea_prayer_times",

  getPrayerTimes: function () {
    try {
      var raw = localStorage.getItem(this.PRAYER_KEY);
      return raw ? JSON.parse(raw) : Object.assign({}, DEFAULT_PRAYER_OVERRIDE);
    } catch (e) { return Object.assign({}, DEFAULT_PRAYER_OVERRIDE); }
  },
  setPrayerTimes: function (data) {
    localStorage.setItem(this.PRAYER_KEY, JSON.stringify(data));
  },
  resetPrayerTimes: function () {
    localStorage.removeItem(this.PRAYER_KEY);
  }
};

// ── renderEvents (public) ─────────────────────────────────────────

function escapeHtml(str) {
  var d = document.createElement("div");
  d.textContent = (str == null ? "" : str);
  return d.innerHTML;
}

// Events are entirely backend-driven — no localStorage fallback.
window.loadAndRenderEvents = function () {
  _apiFetch("/api/events")
    .then(function (r) { return r.json(); })
    .then(function (events) { window.renderEvents(events); })
    .catch(function () {
      var grid = document.getElementById("eventGrid");
      if (grid) {
        grid.innerHTML = '<div class="event-empty" style="grid-column:1/-1;">' +
          '<i class="fa-regular fa-calendar" style="font-size:2rem;color:var(--gold-deep);margin-bottom:14px;display:block;"></i>' +
          'Unable to load events right now. Please check back soon.</div>';
      }
    });
};

function _scheduleListHtml(schedule) {
  var lines = (schedule || "").split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
  if (!lines.length) return "";
  return '<div class="event-schedule">' +
    '<div class="event-schedule-label"><i class="fa-regular fa-clock"></i>&nbsp; Program Schedule</div>' +
    '<ul>' + lines.map(function (l) { return "<li>" + escapeHtml(l) + "</li>"; }).join("") + '</ul>' +
    '</div>';
}

window.renderEvents = function (events) {
  var list = events || [];
  var grid = document.getElementById("eventGrid");
  if (!grid) return;

  if (!list.length) {
    grid.innerHTML = '<div class="event-empty" style="grid-column:1/-1;">' +
      '<i class="fa-regular fa-calendar" style="font-size:2rem;color:var(--gold-deep);margin-bottom:14px;display:block;"></i>' +
      'No upcoming events are currently scheduled. Please check back soon.</div>';
    return;
  }

  grid.innerHTML = list.map(function (ev) {
    var posterUrl = ev.poster_url ? API_BASE + ev.poster_url : "";
    var altText = escapeHtml(ev.poster_alt || ev.title);
    return '<div class="event-card reveal in-view">' +
      (posterUrl
        ? '<button type="button" class="event-poster-btn" data-pamphlet="' + posterUrl + '">' +
          '<img class="event-poster" src="' + posterUrl + '" alt="' + altText + '"></button>'
        : '<div class="event-poster-fallback"><i class="fa-solid fa-mosque"></i></div>') +
      '<div class="event-date"><i class="fa-regular fa-calendar-days"></i>&nbsp; ' +
      escapeHtml(ev.date) + '</div>' +
      '<div class="event-body">' +
      '<h3>' + escapeHtml(ev.title) + '</h3>' +
      (ev.speakers ? '<div class="speakers"><i class="fa-solid fa-microphone-lines"></i>&nbsp; ' + escapeHtml(ev.speakers) + '</div>' : '') +
      _scheduleListHtml(ev.schedule) +
      (ev.description ? '<p>' + escapeHtml(ev.description) + '</p>' : '') +
      '</div></div>';
  }).join("");
};

// ── AdminModule ───────────────────────────────────────────────────

window.AdminModule = (function () {

  var _gearClicks = 0;
  var _gearTimer  = null;
  var _editingEventId = null;
  var _posterFile = null;       // pending File object selected via drag-drop/browse
  var _posterRemoved = false;   // admin explicitly removed the existing poster while editing

  var ALLOWED_POSTER_TYPES = ["image/jpeg", "image/png", "image/webp"];
  var MAX_POSTER_BYTES = 2 * 1024 * 1024;

  function _el(id) { return document.getElementById(id); }

  function openAdminLogin() {
    _el("adminPasswordInput").value = "";
    _el("adminUsernameInput") && (_el("adminUsernameInput").value = "");
    _el("adminLoginError").style.display = "none";
    _el("adminLoginOverlay").classList.add("show");
    setTimeout(function () {
      (_el("adminUsernameInput") || _el("adminPasswordInput")).focus();
    }, 50);
  }

  function closeAdminLogin() {
    _el("adminLoginOverlay").classList.remove("show");
  }

  function attemptLogin() {
    var username = (_el("adminUsernameInput") ? _el("adminUsernameInput").value : "admin");
    var password = _el("adminPasswordInput").value;

    _apiFetch("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ username: username, password: password })
    })
    .then(function (r) {
      if (!r.ok) throw new Error("invalid");
      return r.json();
    })
    .then(function (data) {
      _adminToken = data.token;
      openAdminPanel();
    })
    .catch(function () {
      _el("adminLoginError").style.display = "block";
      _el("adminLoginError").textContent = "Login failed. Check your username/password, or ensure the backend server is running (see README.md).";
    });
  }

  function openAdminPanel() {
    closeAdminLogin();
    renderAdminPrayerForm();
    renderAdminEventsList();
    renderAdminSubmissionsList();
    _el("adminPanelOverlay").classList.add("show");
  }

  function closeAdminPanel() {
    _adminToken = null;
    _el("adminPanelOverlay").classList.remove("show");
    _apiFetch("/api/admin/logout", { method: "POST" }).catch(function(){});
  }

  function renderAdminPrayerForm() {
    _apiFetch("/api/prayer-times")
      .then(function (r) { return r.json(); })
      .then(function (data) { _fillPrayerForm(data); })
      .catch(function () { _fillPrayerForm(DataStore.getPrayerTimes()); });
  }

  function _fillPrayerForm(data) {
    var map = {
      admDateGregorian: data.date_gregorian || data.dateGregorian || "",
      admDateHijri:     data.date_hijri     || data.dateHijri     || "",
      admImsaak:        data.imsaak   || "",
      admFajar:         data.fajar    || "",
      admSunrise:       data.sunrise  || "",
      admDuhr:          data.duhr     || "",
      admAsr:           data.asr      || "",
      admSunset:        data.sunset   || "",
      admMaghrib:       data.maghrib  || "",
      admIsha:          data.isha     || "",
      admMidnight:      data.midnight || ""
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = map[id];
    });
  }

  // ── Poster dropzone ──────────────────────────────────────────────

  function _resetPosterUI() {
    _posterFile = null;
    _posterRemoved = false;
    _el("admPosterInput").value = "";
    _el("admPosterPreview").hidden = true;
    _el("admPosterPreview").src = "";
    _el("admPosterDropzoneEmpty").hidden = false;
    _el("admPosterRemove").hidden = true;
    _el("admPosterError").style.display = "none";
  }

  function _showPosterPreview(src) {
    _el("admPosterPreview").src = src;
    _el("admPosterPreview").hidden = false;
    _el("admPosterDropzoneEmpty").hidden = true;
    _el("admPosterRemove").hidden = false;
  }

  function _showPosterError(msg) {
    var errEl = _el("admPosterError");
    errEl.textContent = msg;
    errEl.style.display = "block";
  }

  function _handlePosterFile(file) {
    if (!file) return;
    if (ALLOWED_POSTER_TYPES.indexOf(file.type) === -1) {
      _showPosterError("Please use a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_POSTER_BYTES) {
      _showPosterError("Poster image must be 2MB or smaller.");
      return;
    }
    _el("admPosterError").style.display = "none";
    _posterFile = file;
    _posterRemoved = false;
    _showPosterPreview(URL.createObjectURL(file));
  }

  function initPosterDropzone() {
    var zone = _el("admPosterDropzone");
    var input = _el("admPosterInput");

    zone.addEventListener("click", function (e) {
      if (e.target.closest("#admPosterRemove")) return;
      input.click();
    });
    zone.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); }
    });
    input.addEventListener("change", function () {
      _handlePosterFile(input.files[0]);
    });

    ["dragenter", "dragover"].forEach(function (evt) {
      zone.addEventListener(evt, function (e) {
        e.preventDefault();
        zone.classList.add("dragover");
      });
    });
    ["dragleave", "dragend"].forEach(function (evt) {
      zone.addEventListener(evt, function (e) {
        e.preventDefault();
        zone.classList.remove("dragover");
      });
    });
    zone.addEventListener("drop", function (e) {
      e.preventDefault();
      zone.classList.remove("dragover");
      var file = e.dataTransfer.files && e.dataTransfer.files[0];
      _handlePosterFile(file);
    });

    _el("admPosterRemove").addEventListener("click", function (e) {
      e.stopPropagation();
      var hadExisting = !_el("admPosterPreview").hidden && !_posterFile;
      _resetPosterUI();
      if (hadExisting) _posterRemoved = true;
    });
  }

  // ── Events admin list ─────────────────────────────────────────────

  function renderAdminEventsList() {
    _apiFetch("/api/events")
      .then(function (r) { return r.json(); })
      .then(function (events) { _renderEventRows(events); })
      .catch(function () {
        _el("adminEventsList").innerHTML = '<p style="font-size:.88rem;color:var(--charcoal-soft);">Could not load events — check that the backend is running.</p>';
      });
  }

  function _renderEventRows(events) {
    var list = _el("adminEventsList");
    if (!list) return;

    if (!events.length) {
      list.innerHTML = '<p style="font-size:.88rem;color:var(--charcoal-soft);">No events yet. Add one below.</p>';
      return;
    }

    // Newest first for the admin's own management view.
    var sorted = events.slice().sort(function (a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    });

    list.innerHTML = sorted.map(function (ev) {
      return '<div class="event-admin-row" data-event-id="' + ev.id + '">' +
        '<div class="row-top">' +
        (ev.poster_url
          ? '<img src="' + API_BASE + ev.poster_url + '" class="poster-thumb" alt="Poster thumbnail">'
          : '<div class="poster-thumb poster-thumb-empty"><i class="fa-solid fa-mosque"></i></div>') +
        '<div class="row-top-text"><h4>' + escapeHtml(ev.title) + '</h4>' +
        '<div style="font-size:.82rem;color:var(--gold-deep);font-weight:700;">' + escapeHtml(ev.date) + '</div>' +
        '<div style="font-size:.82rem;color:var(--charcoal-soft);">' + escapeHtml(ev.speakers || "") + '</div>' +
        '</div>' +
        '<div class="row-actions">' +
        '<button type="button" class="admin-edit-event" title="Edit"><i class="fa-solid fa-pen"></i></button>' +
        '<button type="button" class="admin-delete-event" title="Delete"><i class="fa-solid fa-trash"></i></button>' +
        '</div></div>' +
        '</div>';
    }).join("");

    list.querySelectorAll(".admin-delete-event").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.closest(".event-admin-row").dataset.eventId;
        if (!confirm("Delete this event? This cannot be undone.")) return;
        _apiFetch("/api/events/" + id, { method: "DELETE" })
          .then(function (r) {
            if (!r.ok) throw new Error();
            if (_editingEventId === id) _resetEventForm();
            renderAdminEventsList();
            window.loadAndRenderEvents();
          })
          .catch(function () {
            alert("Could not delete this event. Please try again.");
          });
      });
    });

    list.querySelectorAll(".admin-edit-event").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.closest(".event-admin-row").dataset.eventId;
        _apiFetch("/api/events")
          .then(function (r) { return r.json(); })
          .then(function (events2) {
            var ev = events2.find(function (e) { return e.id === id; });
            if (!ev) return;
            _el("admEvTitle").value       = ev.title;
            _el("admEvDate").value        = ev.date;
            _el("admEvSpeakers").value    = ev.speakers || "";
            _el("admEvSchedule").value    = ev.schedule || "";
            _el("admEvDescription").value = ev.description || "";
            _resetPosterUI();
            if (ev.poster_url) _showPosterPreview(API_BASE + ev.poster_url);

            _editingEventId = id;
            _el("admEventFormHeading").textContent = "Edit Event";
            _el("admAddEvent").innerHTML = 'Update Event <i class="fa-solid fa-check"></i>';
            _el("admCancelEdit").hidden = false;
            _el("admAddEvent").scrollIntoView({ behavior: "smooth", block: "center" });
          });
      });
    });
  }

  function renderAdminSubmissionsList() {
    _apiFetch("/api/submissions")
      .then(function (r) { return r.json(); })
      .then(function (subs) { _renderSubmissionRows(subs); })
      .catch(function () {
        _el("adminSubmissionsList").innerHTML = '<p style="font-size:.88rem;color:var(--charcoal-soft);">Could not load submissions — check that the backend is running.</p>';
      });
  }

  function _renderSubmissionRows(subs) {
    var list = _el("adminSubmissionsList");
    if (!list) return;
    if (!subs.length) {
      list.innerHTML = '<p style="font-size:.88rem;color:var(--charcoal-soft);">No submissions yet.</p>';
      return;
    }
    list.innerHTML = subs.map(function (s) {
      var typeLabel = s.type === "scholar" ? "Ask the Scholar" : "Contact Us";
      return '<div class="event-admin-row">' +
        '<div class="row-top"><h4>' + escapeHtml(s.name) +
        ' &mdash; <span style="font-weight:400;font-size:.8rem;color:var(--gold-deep);">' + typeLabel + '</span></h4>' +
        '<span style="font-size:.75rem;color:var(--charcoal-soft);">' + escapeHtml((s.created_at || "").replace("T", " ").slice(0, 16)) + '</span></div>' +
        '<div style="font-size:.82rem;color:var(--charcoal-soft);">' + escapeHtml(s.email) + (s.phone ? " &middot; " + escapeHtml(s.phone) : "") + '</div>' +
        '<div style="font-size:.85rem;font-weight:700;color:var(--green-deep);margin-top:6px;">' + escapeHtml(s.subject) + '</div>' +
        '<p style="font-size:.88rem;margin:6px 0 0;">' + escapeHtml(s.message) + '</p>' +
        '</div>';
    }).join("");
  }

  function flashButton(btn, text) {
    var orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> ' + text;
    setTimeout(function () { btn.innerHTML = orig; }, 1600);
  }

  function _resetEventForm() {
    _editingEventId = null;
    _el("admEventFormHeading").textContent = "Add New Event";
    _el("admAddEvent").innerHTML = 'Add Event <i class="fa-solid fa-plus"></i>';
    _el("admCancelEdit").hidden = true;
    _el("admEvTitle").value = _el("admEvDate").value = _el("admEvSpeakers").value =
      _el("admEvSchedule").value = _el("admEvDescription").value = "";
    _resetPosterUI();
    _el("admEventSaveError").style.display = "none";
  }

  function init() {
    initPosterDropzone();

    // Gear: 5 clicks in 2.5s
    _el("adminGearBtn").addEventListener("click", function () {
      _gearClicks++;
      clearTimeout(_gearTimer);
      _gearTimer = setTimeout(function () { _gearClicks = 0; }, 2500);
      if (_gearClicks >= 5) { _gearClicks = 0; openAdminLogin(); }
    });

    if (new URLSearchParams(window.location.search).get("admin") === "true") {
      openAdminLogin();
    }

    _el("adminLoginSubmit").addEventListener("click", attemptLogin);
    _el("adminPasswordInput").addEventListener("keydown", function (e) {
      if (e.key === "Enter") attemptLogin();
    });
    _el("adminLoginClose").addEventListener("click", closeAdminLogin);
    _el("adminLoginOverlay").addEventListener("click", function (e) {
      if (e.target === _el("adminLoginOverlay")) closeAdminLogin();
    });

    _el("adminPanelClose").addEventListener("click", closeAdminPanel);
    _el("admLogout").addEventListener("click", closeAdminPanel);
    _el("adminPanelOverlay").addEventListener("click", function (e) {
      if (e.target === _el("adminPanelOverlay")) closeAdminPanel();
    });

    document.querySelectorAll(".admin-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        document.querySelectorAll(".admin-tab").forEach(function (t) { t.classList.remove("active"); });
        document.querySelectorAll(".admin-section").forEach(function (s) { s.classList.remove("active"); });
        tab.classList.add("active");
        _el("adminTab-" + tab.dataset.adminTab).classList.add("active");
      });
    });

    // Save prayer times → backend, then localStorage fallback
    _el("admSavePrayer").addEventListener("click", function () {
      var payload = {
        date_gregorian: _el("admDateGregorian").value.trim(),
        date_hijri:     _el("admDateHijri").value.trim(),
        imsaak:   _el("admImsaak").value.trim(),
        fajar:    _el("admFajar").value.trim(),
        sunrise:  _el("admSunrise").value.trim(),
        duhr:     _el("admDuhr").value.trim(),
        asr:      _el("admAsr").value.trim(),
        sunset:   _el("admSunset").value.trim(),
        maghrib:  _el("admMaghrib").value.trim(),
        isha:     _el("admIsha").value.trim(),
        midnight: _el("admMidnight").value.trim()
      };

      _apiFetch("/api/prayer-times", { method: "PUT", body: JSON.stringify(payload) })
        .then(function (r) { return r.json(); })
        .then(function () {
          if (window.PrayerModule) window.PrayerModule.fetchAndRender();
          flashButton(_el("admSavePrayer"), "Saved!");
        })
        .catch(function () {
          DataStore.setPrayerTimes(payload);
          if (window.PrayerModule) window.PrayerModule.fetchAndRender();
          flashButton(_el("admSavePrayer"), "Saved (local)");
        });
    });

    // Add / update event — bundled multipart submit (text fields + optional poster)
    _el("admAddEvent").addEventListener("click", function () {
      var title       = _el("admEvTitle").value.trim();
      var date        = _el("admEvDate").value.trim();
      var speakers    = _el("admEvSpeakers").value.trim();
      var schedule    = _el("admEvSchedule").value.trim();
      var description = _el("admEvDescription").value.trim();

      if (!title || !date) { alert("Please provide at least a title and date."); return; }

      var method = _editingEventId ? "PUT" : "POST";
      var path   = _editingEventId ? "/api/events/" + _editingEventId : "/api/events";

      var fd = new FormData();
      fd.append("title", title);
      fd.append("date", date);
      fd.append("speakers", speakers);
      fd.append("schedule", schedule);
      fd.append("description", description);
      if (_posterFile) fd.append("poster", _posterFile);
      else if (_editingEventId && _posterRemoved) fd.append("removePoster", "true");

      _el("admEventSaveError").style.display = "none";

      _apiFetchForm(path, { method: method, body: fd })
        .then(function (r) {
          if (!r.ok) return r.json().then(function (d) { throw new Error(d.error || "Could not save event."); });
          return r.json();
        })
        .then(function () {
          _resetEventForm();
          renderAdminEventsList();
          window.loadAndRenderEvents();
        })
        .catch(function (err) {
          var errEl = _el("admEventSaveError");
          errEl.textContent = err.message || "Could not save event. Please try again.";
          errEl.style.display = "block";
        });
    });

    _el("admCancelEdit").addEventListener("click", _resetEventForm);

    // Reset prayer timings to default (events have no client-side default —
    // they live entirely in the database)
    _el("admResetDefaults").addEventListener("click", function () {
      if (!confirm("Restore original prayer timings?")) return;
      DataStore.resetPrayerTimes();
      renderAdminPrayerForm();
      if (window.PrayerModule) window.PrayerModule.fetchAndRender();
      flashButton(_el("admResetDefaults"), "Reset Done");
    });
  }

  return {
    init: init,
    openAdminLogin: openAdminLogin,
    closeAdminLogin: closeAdminLogin,
    openAdminPanel: openAdminPanel,
    closeAdminPanel: closeAdminPanel,
    renderAdminPrayerForm: renderAdminPrayerForm,
    renderAdminEventsList: renderAdminEventsList,
    renderAdminSubmissionsList: renderAdminSubmissionsList
  };

})();
