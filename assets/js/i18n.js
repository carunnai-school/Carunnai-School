/* Carunnai language switcher: English (default) · தமிழ் · हिन्दी
   Translates the page in place using window.CARUNNAI_I18N (i18n-dict.js).
   The chosen language is remembered across pages. */
(function () {
  "use strict";
  var KEY = "carunnai-lang";
  var LANGS = ["en", "ta", "hi"];

  function getLang() {
    var m = location.search.match(/[?&]lang=(en|ta|hi)\b/);
    if (m) return m[1];
    try { var v = localStorage.getItem(KEY); if (LANGS.indexOf(v) > -1) return v; } catch (e) { /* storage blocked */ }
    return "en";
  }
  var lang = getLang();
  var storageOk = true;
  try { localStorage.setItem(KEY, lang); } catch (e) { storageOk = false; }
  window.CARUNNAI_LANG = lang;

  function done() { document.documentElement.classList.remove("i18n-wait"); }

  /* ---------- switcher buttons ---------- */
  function wireSwitchers() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-lang]"), function (b) {
      var on = b.getAttribute("data-lang") === lang;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.addEventListener("click", function () {
        var to = b.getAttribute("data-lang");
        if (to === lang) return;
        try { localStorage.setItem(KEY, to); } catch (e) { /* ignore */ }
        var url = location.pathname + location.search.replace(/([?&])lang=(en|ta|hi)&?/, "$1").replace(/[?&]$/, "");
        if (!storageOk || to !== "en") url += (url.indexOf("?") > -1 ? "&" : "?") + "lang=" + to;
        location.href = url + location.hash;
      });
    });
  }

  document.documentElement.lang = lang;
  var DICT = (window.CARUNNAI_I18N || {})[lang];
  if (lang === "en" || !DICT) {
    document.addEventListener("DOMContentLoaded", function () { wireSwitchers(); done(); });
    if (document.readyState !== "loading") { wireSwitchers(); done(); }
    return;
  }

  var PHOTO = { ta: function (n) { return n + " புகைப்படங்கள்"; }, hi: function (n) { return n + " तस्वीरें"; } };
  var OPEN = { ta: "புகைப்படத்தைத் திற: ", hi: "तस्वीर खोलें: " };
  var VIDEO = { ta: function (n) { return n + " காணொளிகள்"; }, hi: function (n) { return n + " वीडियो"; } };
  var PLAY = { ta: "காணொளியை இயக்கு: ", hi: "वीडियो चलाएँ: " };

  function norm(s) { return s.replace(/\s+/g, " ").trim(); }
  function lookup(s) {
    var k = norm(s);
    if (!k) return null;
    if (DICT.hasOwnProperty(k)) return DICT[k];
    var m = k.match(/^(\d+) photos?$/);
    if (m) return PHOTO[lang](m[1]);
    m = k.match(/^(\d+) videos?$/);
    if (m) return VIDEO[lang](m[1]);
    m = k.match(/^Open photo: (.+)$/);
    if (m) return OPEN[lang] + (DICT[m[1]] || m[1]);
    m = k.match(/^Play video: (.+)$/);
    if (m) return PLAY[lang] + (DICT[m[1]] || m[1]);
    return null;
  }

  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1 };
  function skipped(el) {
    for (var n = el; n && n.nodeType === 1; n = n.parentNode) {
      if (SKIP[n.tagName] || n.namespaceURI === "http://www.w3.org/2000/svg" || n.hasAttribute("data-no-i18n")) return true;
    }
    return false;
  }
  function hasDirectText(el) {
    for (var c = el.firstChild; c; c = c.nextSibling) if (c.nodeType === 3 && c.nodeValue.trim()) return true;
    return false;
  }
  function isInline(el) {
    var t = el.tagName;
    if (t === "A") return !!el.parentNode && hasDirectText(el.parentNode);
    if (t === "STRONG" || t === "EM" || t === "B" || t === "I" || t === "BR") return true;
    if (t === "SPAN" && (el.classList.contains("em") || el.classList.contains("mark"))) return true;
    return false;
  }
  function isSvg(el) { return el.namespaceURI === "http://www.w3.org/2000/svg"; }

  /* Elements mixing text with inline markup (strong, links, highlighted words) */
  function translateMixed(el) {
    if (el.__tr || isInline(el) || isSvg(el)) return;
    var kids = el.children, inl = [], anyInline = false;
    if (!kids.length) return;
    for (var i = 0; i < kids.length; i++) {
      if (isSvg(kids[i])) continue;
      if (!isInline(kids[i])) return;
      anyInline = true; inl.push(kids[i]);
    }
    if (!anyInline) return;
    var tr = lookup(el.textContent);
    if (tr === null) return;
    // keep icons before/after the text
    var nodes = Array.prototype.slice.call(el.childNodes), first = -1, last = -1;
    nodes.forEach(function (n, idx) {
      var content = n.nodeType === 1 ? !isSvg(n) : (n.nodeType === 3 && n.nodeValue.trim());
      if (content) { if (first < 0) first = idx; last = idx; }
    });
    var frag = document.createDocumentFragment(), re = /\{\{(\d+)(?::([^}]*))?\}\}/g, pos = 0, m;
    while ((m = re.exec(tr))) {
      if (m.index > pos) appendHTML(frag, tr.slice(pos, m.index));
      var src = inl[+m[1]];
      if (src) {
        var c = src.cloneNode(true);
        if (m[2] !== undefined) {
          var target = c.querySelector(".em") || c;
          if (target === c && c.querySelector("svg")) {
            Array.prototype.slice.call(c.childNodes).forEach(function (n) { if (!(n.nodeType === 1 && isSvg(n))) c.removeChild(n); });
            c.insertBefore(document.createTextNode(m[2]), c.firstChild);
          } else target.textContent = m[2];
        }
        frag.appendChild(c);
      }
      pos = re.lastIndex;
    }
    if (pos < tr.length) appendHTML(frag, tr.slice(pos));
    var anchor = nodes[last + 1] || null;
    for (var j = first; j <= last; j++) el.removeChild(nodes[j]);
    el.insertBefore(frag, anchor);
    el.__tr = true;
  }
  function appendHTML(frag, html) {
    if (html.indexOf("<") < 0) { frag.appendChild(document.createTextNode(html)); return; }
    var t = document.createElement("template"); t.innerHTML = html; frag.appendChild(t.content);
  }

  function translateText(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(function (t) {
      if (!t.nodeValue.trim() || !t.parentNode || skipped(t.parentNode)) return;
      var tr = lookup(t.nodeValue);
      if (tr === null || tr.indexOf("{{") > -1) return;
      var lead = t.nodeValue.match(/^\s*/)[0], trail = t.nodeValue.match(/\s*$/)[0];
      t.nodeValue = lead + tr + trail;
    });
  }
  function translateAttrs(root) {
    var els = root.querySelectorAll ? root.querySelectorAll("[alt],[aria-label],[title]") : [];
    var arr = Array.prototype.slice.call(els);
    if (root.nodeType === 1 && root.matches("[alt],[aria-label],[title]")) arr.push(root);
    arr.forEach(function (el) {
      if (el.hasAttribute("data-no-i18n")) return;
      ["alt", "aria-label", "title"].forEach(function (a) {
        var v = el.getAttribute(a); if (!v) return;
        var tr = lookup(v); if (tr !== null && tr.indexOf("{{") < 0) el.setAttribute(a, tr);
      });
    });
  }
  function apply(root) {
    if (root.nodeType === 3) { if (root.parentNode) translateText(root.parentNode); return; }
    if (root.nodeType !== 1 || skipped(root)) return;
    var all = Array.prototype.slice.call(root.querySelectorAll("*")); all.unshift(root);
    all.forEach(function (el) { if (!skipped(el)) translateMixed(el); });
    translateText(root);
    translateAttrs(root);
  }

  function run() {
    var t = lookup(document.title); if (t) document.title = t;
    var md = document.querySelector('meta[name="description"]');
    if (md) { var d = lookup(md.getAttribute("content")); if (d) md.setAttribute("content", d); }
    apply(document.body);
    // keep language on internal links when storage is unavailable
    if (!storageOk) Array.prototype.forEach.call(document.querySelectorAll('a[href$=".html"], a[href*=".html#"]'), function (a) {
      var h = a.getAttribute("href"); if (/^https?:/.test(h)) return;
      a.setAttribute("href", h.replace(/(\.html)(#.*)?$/, "$1?lang=" + lang + "$2"));
    });
    wireSwitchers();
    done();
    // translate content added later (gallery, lightbox, counters)
    new MutationObserver(function (muts) {
      muts.forEach(function (mu) { Array.prototype.forEach.call(mu.addedNodes, apply); });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
