// ================================================================
// MASJID-E-ALI — Environment Config
// Local dev (localhost/127.0.0.1) keeps talking to localhost:4000
// automatically (see the fallback in admin.js). Everywhere else
// (Netlify, etc.) uses the deployed backend URL below — update this
// once you know your Render service's URL.
// ================================================================
(function () {
  var isLocal = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  if (!isLocal) {
    window.MEA_API_BASE = "https://REPLACE-WITH-YOUR-RENDER-URL.onrender.com";
  }
})();
