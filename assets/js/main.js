/* Carunnai Special School & Home — site interactions (no libraries) */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Header: shrink on scroll ---------- */
  var header = $(".site-header");
  var mbar = $(".mobile-bar");
  var toTop = $(".to-top");
  var ring = toTop ? $("circle", toTop) : null;
  var RING_LEN = 2 * Math.PI * 24;
  if (ring) { ring.style.strokeDasharray = RING_LEN; ring.style.strokeDashoffset = RING_LEN; }

  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 10);
    if (mbar) mbar.classList.toggle("show", y > 320);
    if (toTop) {
      toTop.classList.toggle("show", y > 500);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (ring && max > 0) ring.style.strokeDashoffset = RING_LEN * (1 - Math.min(y / max, 1));
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); });

  /* ---------- Mobile menu ---------- */
  var toggle = $(".menu-toggle");
  function setMenu(open) {
    document.body.classList.toggle("nav-open", open);
    if (toggle) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
  }
  if (toggle) {
    toggle.addEventListener("click", function () { setMenu(!document.body.classList.contains("nav-open")); });
    $$(".main-nav a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    window.addEventListener("resize", function () { if (window.innerWidth > 1080) setMenu(false); });
  }

  /* ---------- Active nav ---------- */
  var page = document.body.getAttribute("data-page");
  $$(".main-nav a[data-nav]").forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-nav") === page); });

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$("[data-reveal], .doodle");
  if (!reduced && "IntersectionObserver" in window) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); ro.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Counters ---------- */
  var counters = $$("[data-count]");
  function runCounter(el) {
    var end = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduced) { el.textContent = end + suffix; return; }
    var dur = 1600, t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCounter(en.target); co.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  } else counters.forEach(runCounter);

  /* ---------- Skill strip arrows ---------- */
  $$("[data-strip]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var strip = document.getElementById(btn.getAttribute("aria-controls"));
      if (!strip) return;
      var dir = btn.getAttribute("data-strip") === "next" ? 1 : -1;
      strip.scrollBy({ left: dir * Math.min(strip.clientWidth * 0.8, 680), behavior: reduced ? "auto" : "smooth" });
    });
  });

  /* ---------- Age tabs (programmes) ---------- */
  var ageTabs = $$(".tab[role=tab]");
  function openTab(tab, focus) {
    ageTabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) { panel.hidden = !on; panel.classList.toggle("show", on); }
    });
    if (focus) tab.focus();
  }
  ageTabs.forEach(function (t, i) {
    t.addEventListener("click", function () { openTab(t); });
    t.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) { e.preventDefault(); openTab(ageTabs[(i + d + ageTabs.length) % ageTabs.length], true); }
    });
  });

  /* ---------- FAQ accordion + tabs ---------- */
  $$(".faq-item").forEach(function (item) {
    var q = $(".faq-q", item);
    q.addEventListener("click", function () {
      var open = !item.classList.contains("open");
      item.classList.toggle("open", open);
      q.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
  var tabs = $$(".faq-tab");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var cat = tab.getAttribute("data-cat");
      tabs.forEach(function (t) { t.setAttribute("aria-selected", t === tab ? "true" : "false"); });
      $$(".faq-item").forEach(function (it) {
        it.hidden = !(cat === "all" || it.getAttribute("data-cat") === cat);
      });
    });
  });

  /* ---------- Contact form → email ---------- */
  var form = $("#enquiry-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var f = new FormData(form);
      var topic = f.get("topic") || "General enquiry";
      var lines = [
        "Name: " + (f.get("name") || ""),
        "Phone: " + (f.get("phone") || ""),
        "Email: " + (f.get("email") || ""),
        f.get("age") ? "Child's age: " + f.get("age") : "",
        "",
        f.get("message") || ""
      ].filter(function (l, idx) { return l !== "" || idx === 4; });
      var href = "mailto:carunnai@gmail.com?subject=" + encodeURIComponent("Website enquiry – " + topic) +
        "&body=" + encodeURIComponent(lines.join("\n"));
      window.location.href = href;
      var note = $(".form-note", form);
      if (note) note.textContent = "Your email app should open with the message ready to send. If it doesn't, please email carunnai@gmail.com or call +91 94436 32645.";
    });
  }

  /* ---------- Year ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
