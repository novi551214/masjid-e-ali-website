// ================================================================
// MASJID-E-ALI — UI Module
// Mobile nav, scroll reveal, forms, success modal, venmo copy
// ================================================================

(function () {
  'use strict';

  const UIModule = {};

  /* ── 1. init ─────────────────────────────────────────────── */
  UIModule.init = function () {
    UIModule.initMobileNav();
    UIModule.initRevealObserver();
    UIModule.initSuccessModal();
    UIModule.initForms();
    UIModule.initVenmoCopy();
    UIModule.initFooterYear();
    UIModule.initPamphletLightbox();
    UIModule.initHeroVideo();
  };

  /* ── Hero Video ──────────────────────────────────────────── */
  // The `autoplay` HTML attribute alone isn't reliably honored on every
  // mobile browser/OS combination — explicitly calling play() is the
  // robust fallback (muted + playsinline already satisfy autoplay policy,
  // so this succeeds silently; the .catch is just a safety net for the
  // rare case a browser still blocks it, leaving the poster image showing).
  UIModule.initHeroVideo = function () {
    const video = document.querySelector('.hero-video');
    if (!video) return;
    const tryPlay = function () { video.play().catch(function () {}); };
    if (video.readyState >= 2) tryPlay();
    else video.addEventListener('loadeddata', tryPlay, { once: true });
  };

  /* ── 2. Mobile Nav ───────────────────────────────────────── */
  UIModule.openMobileMenu = function () {
    const menu = document.getElementById('navMenu');
    const overlay = document.getElementById('navOverlay');
    const btn = document.getElementById('hamburgerBtn');
    if (menu)    menu.classList.add('open');
    if (overlay) overlay.classList.add('show');
    if (btn)     btn.setAttribute('aria-expanded', 'true');
  };

  UIModule.closeMobileMenu = function () {
    const menu = document.getElementById('navMenu');
    const overlay = document.getElementById('navOverlay');
    const btn = document.getElementById('hamburgerBtn');
    if (menu)    menu.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    if (btn)     btn.setAttribute('aria-expanded', 'false');
  };

  UIModule.initMobileNav = function () {
    const hamburger = document.getElementById('hamburgerBtn');
    const overlay   = document.getElementById('navOverlay');

    if (hamburger) {
      hamburger.addEventListener('click', function () {
        const menu = document.getElementById('navMenu');
        menu && menu.classList.contains('open')
          ? UIModule.closeMobileMenu()
          : UIModule.openMobileMenu();
      });
    }
    if (overlay) overlay.addEventListener('click', UIModule.closeMobileMenu);

    document.querySelectorAll('.has-dropdown > .nav-link').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        if (window.innerWidth <= 980) {
          e.preventDefault();
          if (btn.parentElement) btn.parentElement.classList.toggle('mobile-open');
        }
      });
    });
  };

  /* ── 3. Scroll Reveal ────────────────────────────────────── */
  UIModule.initRevealObserver = function () {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.add('in-view');
      });
      return;
    }
    const observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal:not(.in-view)').forEach(function (el) {
      observer.observe(el);
    });
    window._revealObserver = observer;
  };

  UIModule.refreshRevealObserver = function () {
    if (!window._revealObserver) { UIModule.initRevealObserver(); return; }
    document.querySelectorAll('.reveal:not(.in-view)').forEach(function (el) {
      window._revealObserver.observe(el);
    });
  };

  /* ── 4. Success Modal ────────────────────────────────────── */
  UIModule.showSuccessModal = function (message) {
    const text    = document.getElementById('successModalText');
    const overlay = document.getElementById('successModalOverlay');
    if (text)    text.textContent = message || 'Your submission has been received.';
    if (overlay) overlay.classList.add('show');
  };

  UIModule.closeSuccessModal = function () {
    const overlay = document.getElementById('successModalOverlay');
    if (overlay) overlay.classList.remove('show');
  };

  UIModule.initSuccessModal = function () {
    const closeBtn = document.getElementById('successModalClose');
    const overlay  = document.getElementById('successModalOverlay');
    if (closeBtn) closeBtn.addEventListener('click', UIModule.closeSuccessModal);
    if (overlay)  overlay.addEventListener('click', function (e) {
      if (e.target === overlay) UIModule.closeSuccessModal();
    });
  };

  /* ── 5. Forms ────────────────────────────────────────────── */
  UIModule.initForms = function () {
    UIModule.initSubmissionForm('contactForm', {
      endpoint: '/api/submissions/contact',
      fields: { name: 'conName', email: 'conEmail', phone: 'conPhone', subject: 'conSubject', message: 'conMessage' },
      successMsg: 'Your message has been received. JazakAllah Khair!'
    });
    UIModule.initSubmissionForm('scholarForm', {
      endpoint: '/api/submissions/scholar',
      fields: { name: 'scholName', email: 'scholEmail', phone: 'scholPhone', topic: 'scholTopic', question: 'scholQuestion' },
      successMsg: 'Your question has been sent to Maulana Rizwan Rizvi. JazakAllah Khair!'
    });
  };

  UIModule.initSubmissionForm = function (formId, cfg) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const payload = {};
      Object.keys(cfg.fields).forEach(function (key) {
        const el = document.getElementById(cfg.fields[key]);
        payload[key] = el ? el.value.trim() : '';
      });
      if (submitBtn) submitBtn.disabled = true;

      fetch(API_BASE + cfg.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (r) {
          if (!r.ok) return r.json().then(function (d) { throw new Error(d.error || 'Request failed'); });
          return r.json();
        })
        .then(function () {
          form.reset();
          UIModule.showSuccessModal(cfg.successMsg);
        })
        .catch(function (err) {
          alert('Sorry, something went wrong sending this — ' + err.message + '. Please try again or call us at 1-732-564-1331.');
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  };

  /* ── Pamphlet Lightbox ───────────────────────────────────── */
  UIModule.initPamphletLightbox = function () {
    document.addEventListener('click', function (e) {
      const overlay = document.getElementById('pamphletLightboxOverlay');
      if (!overlay) return;
      const btn = e.target.closest('.event-poster-btn');
      if (btn) {
        const img = document.getElementById('pamphletLightboxImg');
        if (img) img.src = btn.dataset.pamphlet;
        overlay.classList.add('show');
        return;
      }
      if (e.target.id === 'pamphletLightboxClose' || e.target === overlay) {
        overlay.classList.remove('show');
      }
    });
  };

  /* ── 6. Venmo Copy ───────────────────────────────────────── */
  UIModule.initVenmoCopy = function () {
    const btn = document.getElementById('copyVenmoBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      const id = '@Masjid-e-Ali-NJ';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(id).then(function () {
          const orig = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(function () { btn.textContent = orig; }, 1600);
        }).catch(function () { alert('Venmo ID: ' + id); });
      } else {
        alert('Venmo ID: ' + id);
      }
    });
  };

  /* ── 7. Footer Year ──────────────────────────────────────── */
  UIModule.initFooterYear = function () {
    const el = document.getElementById('footerYear');
    if (el) el.textContent = new Date().getFullYear();
  };

  /* ── Attach to window ────────────────────────────────────── */
  window.UIModule = UIModule;

})();
