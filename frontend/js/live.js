// ================================================================
// MASJID-E-ALI — Live Broadcast Module
// Polls the backend for the admin-set live video(s) and embeds them.
// Two independent slots — English and Urdu — since parallel majalis
// in both languages sometimes broadcast at the same time. Each slot
// can also be hidden entirely by the admin (the common case is only
// one language broadcasting on a given day).
// ================================================================

window.LiveBroadcastModule = (function () {

  var CHECK_INTERVAL_MS = 90 * 1000;
  var _pollTimer = null;
  var _currentVideoId = { english: null, urdu: null };

  var SLOTS = [
    { key: "english", frameId: "broadcastFrameEnglish", columnId: "broadcastColumnEnglish" },
    { key: "urdu",    frameId: "broadcastFrameUrdu",    columnId: "broadcastColumnUrdu" }
  ];

  function _apiBase() { return window.MEA_API_BASE || "http://localhost:4000"; }

  function _offlineHtml() {
    return '<div class="broadcast-offline">' +
      '<i class="fa-solid fa-video-slash"></i>' +
      '<p>Not broadcasting live right now.</p>' +
      '<span>Check back during Friday prayers or special programs.</span>' +
      '</div>';
  }

  function _renderSlot(slotKey, frameId, columnId, slotStatus) {
    var column = document.getElementById(columnId);
    var frame = document.getElementById(frameId);
    if (!frame || !column || !slotStatus) return;

    column.hidden = !slotStatus.visible;
    if (!slotStatus.visible) return; // don't bother touching hidden content

    if (slotStatus.live && slotStatus.videoId) {
      if (slotStatus.videoId === _currentVideoId[slotKey]) return; // already showing it
      _currentVideoId[slotKey] = slotStatus.videoId;
      frame.innerHTML =
        '<iframe src="https://www.youtube.com/embed/' + slotStatus.videoId + '?autoplay=1" ' +
        'title="Masjid-e-Ali Live Broadcast" ' +
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
        'allowfullscreen></iframe>';
    } else {
      if (_currentVideoId[slotKey] === null && frame.querySelector(".broadcast-offline")) return; // already offline
      _currentVideoId[slotKey] = null;
      frame.innerHTML = _offlineHtml();
    }
  }

  function _render(status) {
    SLOTS.forEach(function (s) { _renderSlot(s.key, s.frameId, s.columnId, status[s.key]); });

    var bothHidden = document.getElementById("broadcastBothHidden");
    if (bothHidden) {
      var anyVisible = SLOTS.some(function (s) { return status[s.key] && status[s.key].visible; });
      bothHidden.hidden = anyVisible;
    }
  }

  function checkNow() {
    fetch(_apiBase() + "/api/live-status")
      .then(function (r) { return r.json(); })
      .then(_render)
      .catch(function () { /* leave current state as-is if the check fails */ });
  }

  function init() {
    if (!document.getElementById("broadcastFrameEnglish")) return;
    checkNow();
    _pollTimer = setInterval(checkNow, CHECK_INTERVAL_MS);
  }

  return { init: init, checkNow: checkNow };

})();
