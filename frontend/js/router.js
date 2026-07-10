// ================================================================
// MASJID-E-ALI — Hash-Based SPA Router
// ================================================================

const VALID_ROUTES = ["home","about","services","schools","events","donate","contact","broadcast"];

window.Router = (function () {

  function navigateTo(route, scrollTargetId) {
    if (!VALID_ROUTES.includes(route)) route = "home";

    // Show/hide pages
    document.querySelectorAll(".page").forEach(function (p) {
      p.classList.remove("active");
    });
    const target = document.getElementById("page-" + route);
    if (target) target.classList.add("active");

    // Update nav active state
    document.querySelectorAll(".nav-link[data-route]").forEach(function (l) {
      l.classList.toggle("active", l.dataset.route === route);
    });

    // Close mobile menu if open
    if (window.UIModule && window.UIModule.closeMobileMenu) {
      window.UIModule.closeMobileMenu();
    }

    // Scroll to top instantly
    window.scrollTo({ top: 0, behavior: "auto" });

    // Smooth scroll to anchor if provided
    if (scrollTargetId) {
      requestAnimationFrame(function () {
        const el = document.getElementById(scrollTargetId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    // Refresh reveal animations for newly visible elements
    if (window.UIModule && window.UIModule.refreshRevealObserver) {
      window.UIModule.refreshRevealObserver();
    }

    // Refresh events grid when navigating to events page
    if (route === "events" && window.loadAndRenderEvents) {
      window.loadAndRenderEvents();
    }
  }

  function handleHashChange() {
    const hash = window.location.hash.replace("#", "") || "home";
    navigateTo(hash);
  }

  function init() {
    // Delegate clicks on [data-route] elements
    document.addEventListener("click", function (e) {
      const el = e.target.closest("[data-route]");
      if (!el) return;
      const route = el.dataset.route;
      const scrollId = el.dataset.scroll;
      if (route) {
        e.preventDefault();
        window.location.hash = route;
        navigateTo(route, scrollId);
      }
    });

    // Delegate clicks on [data-scroll] without [data-route]
    document.addEventListener("click", function (e) {
      const el = e.target.closest("[data-scroll]:not([data-route])");
      if (!el) return;
      e.preventDefault();
      const t = document.getElementById(el.dataset.scroll);
      if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    window.addEventListener("hashchange", handleHashChange);

    // Initial route on load
    handleHashChange();
  }

  return {
    init: init,
    navigateTo: navigateTo,
    handleHashChange: handleHashChange
  };

})();
