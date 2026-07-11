// ================================================================
// MASJID-E-ALI — Main Application Entry Point
// ================================================================
// Initialization order:
// 1. UIModule  — mobile nav, forms, reveal observer, venmo, year
// 2. AdminModule — DataStore + admin panel bindings
// 3. Router    — hash-based SPA navigation
// 4. PrayerModule — AlAdhan API fetch, grid + date bar render
// 5. LiveBroadcastModule — polls backend for current live YouTube video
// ================================================================

document.addEventListener('DOMContentLoaded', function () {
  UIModule.init();
  AdminModule.init();
  Router.init();
  PrayerModule.init();
  if (window.LiveBroadcastModule) window.LiveBroadcastModule.init();
  // Load events from backend on startup; falls back to localStorage if unreachable
  if (window.loadAndRenderEvents) window.loadAndRenderEvents();
});
