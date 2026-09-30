/* Carunnai gallery: Google Drive albums + built-in photos, filters, lightbox */
(function () {
  "use strict";
  var CFG = window.CARUNNAI_GALLERY || {};
  var PER_PAGE = CFG.photosPerPage || 40;
  var COLORS = ["c-terra", "c-leaf", "c-sky", "c-plum", "c-sun", "c-rose"];
  var $ = function (s, c) { return (c || document).querySelector(s); };

  /* ---------- Built-in photos ---------- */
  var LOCAL_ALBUMS = [
    { id: "skills", name: "Vocational Skills" },
    { id: "class", name: "Classroom Learning" },
    { id: "events", name: "Events & Celebrations" },
    { id: "guests", name: "Guests & Well-wishers" },
    { id: "outings", name: "Outings" }
  ];
  var LOCAL = [
    [1, "outings", "Students and staff on an outing with the hills behind them"],
    [2, "guests", "A guest honoured with a shawl at the school"],
    [3, "guests", "Visitors with the school team"],
    [4, "skills", "Students making coir rope together"],
    [5, "skills", "A student twisting coir fibre into rope"],
    [6, "skills", "Coir rope work in the activity room"],
    [7, "skills", "A student winding a coir rope ball"],
    [8, "skills", "Careful hands at work on a coir ball"],
    [9, "skills", "Coir rope balls made by our students"],
    [10, "skills", "Students weaving on a mat loom"],
    [11, "events", "Students gathered together in the school hall"],
    [12, "events", "Our school family outside the building"],
    [13, "guests", "A guest greeting a student"],
    [14, "guests", "Guests presenting a gift at the school"],
    [15, "guests", "Guests honoured at a school event"],
    [16, "class", "A writing activity in the painted classroom"],
    [17, "skills", "Crafts session with a teacher"],
    [18, "skills", "Learning cloth work with a trainer"],
    [19, "skills", "Vocational session with a trainer"],
    [20, "class", "Table activity in the classroom"],
    [21, "class", "A teacher guiding a student with drawing"],
    [22, "skills", "Students making flower garlands"],
    [23, "skills", "Learning to use a sewing machine"],
    [24, "skills", "Weaving on a vertical loom"],
    [25, "skills", "Weaving a coir mat on the loom"],
    [26, "skills", "Students showing products they made"],
    [27, "class", "Learning together at the colour tables"],
    [28, "class", "Group activity in the classroom"],
    [29, "class", "A lesson with the teacher"],
    [30, "class", "Busy hands at the activity tables"],
    [31, "guests", "Well-wishers visiting the school"],
    [32, "guests", "A bouquet for our guests"],
    [33, "guests", "Guests with the school team"],
    [34, "guests", "A guest meeting the children"],
    [35, "guests", "Visitors and staff together"],
    [36, "events", "Students seated for a celebration"],
    [37, "events", "Proudly holding the national flag"],
    [38, "guests", "Visitors with the school team"],
    [39, "events", "Independence Day celebration in the hall"],
    [40, "guests", "A guest welcomed with flowers"],
    [41, "events", "Independence Day parade under the trees"],
    [42, "events", "Flag bearers leading the celebration"],
    [43, "guests", "Guests visiting the school"],
    [44, "outings", "A trip to the waterfall"],
    [45, "outings", "A day out under the trees"],
    [46, "outings", "Group photo during an outing"],
    [47, "outings", "All smiles on a school trip"],
    [48, "outings", "A happy group selfie"],
    [49, "outings", "Students and staff in the hills"]
  ].map(function (r) {
    var n = (r[0] < 10 ? "0" : "") + r[0];
    return { thumb: "assets/img/gallery/thumbs/g" + n + ".jpg", full: "assets/img/gallery/g" + n + ".jpg", album: "local-" + r[1], alt: r[2] };
  });

  /* ---------- State ---------- */
  var albums = [];   // {id, name}
  var photos = [];   // {thumb, full, album, alt, fallback?}
  var current = "all";
  var shown = 0;
  var list = [];     // filtered
  var grid = $("#gal-grid"), filtersEl = $("#gal-filters"), statusEl = $("#gal-status"), moreBtn = $("#gal-more"), titleEl = $("#gal-album-title");

  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function albumName(id) { for (var i = 0; i < albums.length; i++) if (albums[i].id === id) return albums[i].name; return ""; }

  /* ---------- Google Drive ---------- */
  var API = "https://www.googleapis.com/drive/v3/files";
  function driveList(q, order) {
    var out = [];
    function page(token) {
      var url = API + "?q=" + encodeURIComponent(q) +
        "&key=" + encodeURIComponent(CFG.apiKey) +
        "&fields=" + encodeURIComponent("nextPageToken,files(id,name,description,createdTime)") +
        "&orderBy=" + encodeURIComponent(order) +
        "&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true" +
        (token ? "&pageToken=" + encodeURIComponent(token) : "");
      return fetch(url).then(function (r) {
        if (!r.ok) throw new Error("Drive API " + r.status);
        return r.json();
      }).then(function (d) {
        out = out.concat(d.files || []);
        return d.nextPageToken ? page(d.nextPageToken) : out;
      });
    }
    return page(null);
  }
  function niceCaption(file, fallback) {
    if (file.description) return file.description;
    var base = file.name.replace(/\.[a-z0-9]+$/i, "");
    if (/^(img|dsc|dscn|pxl|wa|vid|photo|image|screenshot|whatsapp)\b|^\W*[\d_\-\s]+\W*$/i.test(base) || /\d{6,}/.test(base)) return fallback;
    return base.replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim() || fallback;
  }
  function driveImage(id, w) { return "https://lh3.googleusercontent.com/d/" + id + "=w" + w; }
  function driveFallback(id, w) { return "https://drive.google.com/thumbnail?id=" + id + "&sz=w" + w; }

  function loadDrive() {
    if (CFG.useDrive === false || !CFG.apiKey || !CFG.rootFolderId) return Promise.reject(new Error("not configured"));
    var cacheKey = "carunnai-drive-" + CFG.rootFolderId;
    try {
      var cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
      if (cached && Date.now() - cached.t < (CFG.cacheMinutes || 10) * 60000) return Promise.resolve(cached.d);
    } catch (e) { /* storage unavailable */ }

    var order = CFG.albumOrder === "name" ? "name" : CFG.albumOrder === "oldest" ? "createdTime" : "createdTime desc";
    var imgQ = function (parent) { return "'" + parent + "' in parents and mimeType contains 'image/' and trashed = false"; };
    var folderQ = "'" + CFG.rootFolderId + "' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false";

    return driveList(folderQ, order).then(function (folders) {
      var jobs = folders.map(function (f) {
        return driveList(imgQ(f.id), "createdTime desc").then(function (files) { return { folder: f, files: files }; });
      });
      jobs.push(driveList(imgQ(CFG.rootFolderId), "createdTime desc").then(function (files) { return { folder: { id: "root", name: "More Photos" }, files: files }; }));
      return Promise.all(jobs);
    }).then(function (res) {
      var d = { albums: [], photos: [] };
      res.forEach(function (r) {
        // every Drive sub-folder becomes an album (even if still empty);
        // loose photos in the main folder appear only if there are any
        if (!r.files.length && r.folder.id === "root") return;
        var aid = "drive-" + r.folder.id;
        d.albums.push({ id: aid, name: r.folder.name, drive: true });
        r.files.forEach(function (f) {
          d.photos.push({
            thumb: driveImage(f.id, 640), full: driveImage(f.id, 1920),
            thumbFb: driveFallback(f.id, 640), fullFb: driveFallback(f.id, 1920),
            album: aid, alt: niceCaption(f, r.folder.name)
          });
        });
      });
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), d: d })); } catch (e) { /* ignore */ }
      return d;
    });
  }

  /* ---------- Rendering ---------- */
  function setStatus(txt, live) {
    if (!statusEl) return;
    statusEl.classList.toggle("local", !live);
    statusEl.innerHTML = '<span class="live" aria-hidden="true"></span>' + txt;
  }

  function buildFilters() {
    var counts = {};
    photos.forEach(function (p) { counts[p.album] = (counts[p.album] || 0) + 1; });
    var html = '<button class="filter c-terra" data-album="all" aria-pressed="true">All photos <span class="count">' + photos.length + "</span></button>";
    albums.forEach(function (a, i) {
      if (!counts[a.id] && !a.drive) return;
      html += '<button class="filter ' + COLORS[(i + 1) % COLORS.length] + '" data-album="' + a.id + '" aria-pressed="false">' +
        escapeHtml(a.name) + ' <span class="count">' + (counts[a.id] || 0) + "</span></button>";
    });
    filtersEl.innerHTML = html;
    filtersEl.addEventListener("click", function (e) {
      var b = e.target.closest(".filter");
      if (!b) return;
      select(b.getAttribute("data-album"), true);
    });
  }

  function select(id, updateHash) {
    if (id !== "all" && !albumName(id)) id = "all";
    current = id;
    Array.prototype.forEach.call(filtersEl.querySelectorAll(".filter"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-album") === id ? "true" : "false");
    });
    list = id === "all" ? photos : photos.filter(function (p) { return p.album === id; });
    if (titleEl) titleEl.innerHTML = "<h2>" + escapeHtml(id === "all" ? "All photos" : albumName(id)) + "</h2><span>" + list.length + " photo" + (list.length === 1 ? "" : "s") + "</span>";
    grid.innerHTML = "";
    shown = 0;
    renderMore();
    if (updateHash && history.replaceState) {
      var a = albums.filter(function (x) { return x.id === id; })[0];
      history.replaceState(null, "", id === "all" ? location.pathname : "#album=" + slug(a.name));
    }
  }

  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("show"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -30px 0px" }) : null;

  function renderMore() {
    var end = Math.min(shown + PER_PAGE, list.length);
    var frag = document.createDocumentFragment();
    for (var i = shown; i < end; i++) {
      var p = list[i];
      var a = document.createElement("a");
      a.className = "tile";
      a.href = p.full;
      a.setAttribute("data-index", i);
      a.setAttribute("aria-label", "Open photo: " + p.alt);
      var img = document.createElement("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.alt = p.alt;
      img.src = p.thumb;
      img.onload = function () { this.classList.add("loaded"); };
      (function (photo, el) {
        el.onerror = function () {
          if (photo.thumbFb && el.src !== photo.thumbFb) { el.src = photo.thumbFb; }
          else { el.closest(".tile").remove(); }
        };
      })(p, img);
      a.appendChild(img);
      if (current === "all") {
        var badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = albumName(p.album);
        a.appendChild(badge);
      }
      var cap = document.createElement("span");
      cap.className = "cap";
      cap.textContent = p.alt;
      a.appendChild(cap);
      frag.appendChild(a);
      if (io) io.observe(a); else a.classList.add("show");
    }
    grid.appendChild(frag);
    shown = end;
    if (moreBtn) moreBtn.hidden = shown >= list.length;
    if (!list.length) grid.innerHTML = '<p class="gal-empty">Photos coming soon to this album ♥</p>';
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* ---------- Lightbox ---------- */
  var lb = $("#lightbox"), lbImg = $("#lb-img"), lbCap = $("#lb-cap"), lbCount = $("#lb-count");
  var idx = 0, lastFocus = null, touchX = null;

  function show(i) {
    idx = (i + list.length) % list.length;
    var p = list[idx];
    lb.classList.add("loading");
    lbImg.classList.add("swap");
    var pre = new Image();
    pre.onload = function () {
      lbImg.src = pre.src; lbImg.alt = p.alt;
      lbImg.classList.remove("swap"); lb.classList.remove("loading");
    };
    pre.onerror = function () {
      if (p.fullFb && pre.src !== p.fullFb) pre.src = p.fullFb;
      else { lbImg.src = p.thumb; lbImg.classList.remove("swap"); lb.classList.remove("loading"); }
    };
    pre.src = p.full;
    lbCap.textContent = p.alt;
    lbCount.textContent = (idx + 1) + " / " + list.length;
    // preload neighbour
    var n = list[(idx + 1) % list.length]; if (n) { var x = new Image(); x.src = n.full; }
  }
  function openLb(i) {
    lastFocus = document.activeElement;
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    show(i);
    $(".lb-close", lb).focus();
  }
  function closeLb() {
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  if (lb) {
    grid.addEventListener("click", function (e) {
      var t = e.target.closest(".tile");
      if (!t) return;
      e.preventDefault();
      openLb(parseInt(t.getAttribute("data-index"), 10));
    });
    $(".lb-close", lb).addEventListener("click", closeLb);
    $(".lb-prev", lb).addEventListener("click", function () { show(idx - 1); });
    $(".lb-next", lb).addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb-stage")) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") closeLb();
      else if (e.key === "ArrowLeft") show(idx - 1);
      else if (e.key === "ArrowRight") show(idx + 1);
      else if (e.key === "Tab") {
        var f = lb.querySelectorAll("button"); var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    lb.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  }
  if (moreBtn) moreBtn.addEventListener("click", renderMore);

  /* ---------- Boot ---------- */
  function start(driveData) {
    var useLocal = !driveData || CFG.mode !== "drive";
    albums = []; photos = [];
    if (driveData) { albums = albums.concat(driveData.albums); photos = photos.concat(driveData.photos); }
    if (useLocal) {
      LOCAL_ALBUMS.forEach(function (a) { albums.push({ id: "local-" + a.id, name: a.name }); });
      photos = photos.concat(LOCAL);
    }
    buildFilters();
    var want = (location.hash.match(/album=([^&]+)/) || [])[1];
    var pick = "all";
    if (want) albums.forEach(function (a) { if (slug(a.name) === decodeURIComponent(want)) pick = a.id; });
    select(pick, false);
  }

  if (!grid) return;
  // skeletons while loading
  var sk = "";
  for (var s = 0; s < 8; s++) sk += '<div class="skeleton" style="height:' + (160 + (s * 53) % 140) + 'px"></div>';
  grid.innerHTML = sk;

  loadDrive().then(function (d) {
    setStatus("Live from our Google Drive albums", true);
    start(d);
  }).catch(function (err) {
    if (err && err.message !== "not configured" && window.console) console.warn("Drive gallery unavailable:", err);
    setStatus("Photo highlights", false);
    start(null);
  });
})();
