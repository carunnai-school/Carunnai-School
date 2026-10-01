/* Home page "Our hostel" section: shows the latest photos from the
   Drive folder whose name contains "Hostel". Falls back to the built-in
   photos already in the page if Drive is off or unreachable. */
(function () {
  "use strict";
  var CFG = window.CARUNNAI_GALLERY || {};
  var wrap = document.querySelector("[data-hostel-pics]");
  if (!wrap || CFG.useDrive === false || !CFG.apiKey || !CFG.rootFolderId) return;

  var API = "https://www.googleapis.com/drive/v3/files";
  function list(q, fields, order) {
    var url = API + "?q=" + encodeURIComponent(q) + "&key=" + encodeURIComponent(CFG.apiKey) +
      "&fields=" + encodeURIComponent("files(" + fields + ")") + "&orderBy=" + encodeURIComponent(order) +
      "&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true";
    return fetch(url).then(function (r) { if (!r.ok) throw new Error("Drive " + r.status); return r.json(); })
      .then(function (d) { return d.files || []; });
  }

  var cacheKey = "carunnai-hostel-" + CFG.rootFolderId;
  function cached() {
    try {
      var c = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
      if (c && Date.now() - c.t < (CFG.cacheMinutes || 10) * 60000) return c.d;
    } catch (e) { /* ignore */ }
    return null;
  }

  var c = cached();
  var p = c ? Promise.resolve(c) :
    list("'" + CFG.rootFolderId + "' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false", "id,name", "name")
      .then(function (folders) {
        var f = folders.filter(function (x) { return /hostel/i.test(x.name); })[0];
        if (!f) return null;
        return list("'" + f.id + "' in parents and (mimeType contains 'image/' or mimeType contains 'video/') and trashed = false",
          "id,mimeType", "createdTime desc").then(function (files) {
          var d = {
            photos: files.filter(function (x) { return /^image\//.test(x.mimeType); }).map(function (x) { return x.id; }),
            videos: files.filter(function (x) { return /^video\//.test(x.mimeType); }).length
          };
          try { sessionStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), d: d })); } catch (e) { /* ignore */ }
          return d;
        });
      });

  p.then(function (d) {
    if (!d) return;
    var vbtn = document.querySelector("[data-hostel-video]");
    if (vbtn) vbtn.hidden = d.videos === 0;
    if (!d.photos.length) return;
    var slots = wrap.querySelectorAll("[data-hostel-slot] img");
    Array.prototype.forEach.call(slots, function (img, i) {
      var id = d.photos[i];
      if (!id) return;
      var src = "https://lh3.googleusercontent.com/d/" + id + "=w700";
      var probe = new Image();
      probe.onload = function () {
        img.removeAttribute("srcset");
        img.removeAttribute("sizes");
        img.src = src;
        img.alt = "The Carunnai hostel";
      };
      probe.src = src;
    });
  }).catch(function () { /* keep built-in photos */ });
})();
