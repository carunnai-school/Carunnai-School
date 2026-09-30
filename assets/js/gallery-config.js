/* =====================================================================
   GOOGLE DRIVE GALLERY — SETTINGS
   ---------------------------------------------------------------------
   Photos uploaded to Google Drive show up on gallery.html automatically.
   Each sub-folder inside the main folder becomes one album (filter button).

   Drive layout example:
     Carunnai Website Gallery/          <- main folder (share this one)
        Vocational Training/
        Classroom/
        Independence Day 2026/
        Outings/

   ONE-TIME SETUP
   1. Share the MAIN folder:  Right-click > Share > General access >
      "Anyone with the link" > Viewer.  (Sub-folders inherit this.)
   2. Copy the folder ID from its link:
        https://drive.google.com/drive/folders/THIS_PART_IS_THE_ID
      and paste it into rootFolderId below.
   3. Create a free API key:
        console.cloud.google.com > create a project >
        "APIs & Services" > Library > enable "Google Drive API" >
        Credentials > Create credentials > API key.
      Then edit the key:
        Application restrictions > Websites >
          add  carunnaispecialachoolandhome.in  followed by  /  and  *
          (for local testing also add  localhost  with the same ending)
        API restrictions > Restrict key > Google Drive API.
      Paste the key into apiKey below.
   4. Upload the site. New photos appear on the next page load
      (after up to cacheMinutes, per visitor).

   Tips
   - Album name = folder name. Photo caption = the file's Drive
     "Description" if you add one, otherwise the album name.
   - Albums are shown newest folder first (change albumOrder).
   - Albums on the website = sub-folders in Drive (empty ones too).
     Add a folder in Drive and it shows up; delete it and it disappears.
   - If Drive can't be reached (or apiKey is empty) the built-in photos
     are shown instead, so the page is never blank.
   ===================================================================== */
window.CARUNNAI_GALLERY = {
  // false = show the photos stored in the website (assets/img/gallery)
  // true  = load albums from Google Drive (needs apiKey below)
  useDrive: true,

  apiKey: "AIzaSyAdRXSuXrANWKpn1b-mlVwUXcBn0370LW8",
  rootFolderId: "1c_Zj5CoEHKBWo1vYsDFbPAzTlR2UlW5w",

  // "drive+local" = Drive albums first, then the built-in photos
  // "drive"       = only Drive photos (built-in photos used only if Drive fails)
  mode: "drive",

  albumOrder: "newest",  // "newest" | "oldest" | "name"
  photosPerPage: 40,     // "Load more" button after this many
  cacheMinutes: 5        // how long a visitor's browser reuses the photo list
};
