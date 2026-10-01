# Carunnai Special School & Home – Website

Static website (HTML, CSS, JavaScript only – no build step, no framework) for
Carunnai Special School & Home, Puducherry.

Live: https://carunnai-school.github.io/Carunnai-School/

## Pages

| File | Page |
|---|---|
| `index.html` | Home |
| `about.html` | About Us – story, journey, mission & vision, founders, team |
| `our-home.html` | Our Home – residential care |
| `programmes.html` | Programmes – age tabs, therapies, skills |
| `gallery.html` | Gallery – photo albums from |
| `get-involved.html` | Donate, sponsor, volunteer, give in kind, wish list |
| `faq.html` | Frequently asked questions |
| `contact.html` | Address, phone, email, admission steps, map |
| `404.html` | Page not found |

## Folders

```
assets/
  css/style.css            all styles (light "storybook" theme)
  js/main.js               menu, scroll animations, counters, tabs, FAQ
  js/gallery.js            gallery albums, photo/video filter, viewer, video player
  js/hostel.js             home page hostel photos
  js/gallery-config.js     settings  <- edit this
  js/i18n.js               English / Tamil / Hindi switcher
  js/i18n-dict.js          all Tamil + Hindi translations
  img/gallery/g01–g49.jpg  photos (full size, used in the photo viewer)
  img/gallery/thumbs/      small copies used on every page – do NOT delete
  img/logo/                logo, favicon
  img/og-image.jpg         preview image for WhatsApp / Facebook links
```

## Gallery photos (Google Drive)

The gallery reads albums straight from the shared Drive folder
**"Carunnai Webpage Content"**. Each sub-folder = one album.

- **Add photos or videos:** upload to a sub-folder (JPG/PNG photos, MP4 videos).
  Videos get a ▶ play button and open in a video player; visitors can switch
  between **All / Photos / Videos**.
- **New album:** create a new sub-folder (newest folder shows first).
- **Remove:** delete in Drive.
- **Caption:** in Drive, right-click the photo → File information → Details → *Description*.

Changes show on the site within about 5 minutes. No code change or push is needed.

Settings are in `assets/js/gallery-config.js`:

- `useDrive: true` – load from Drive. `false` = use the photos in `assets/img/gallery`.
- `apiKey` – Google Cloud API key. It is restricted to the API and to these websites:
  `carunnai-school.github.io/*`, `carunnaispecialachoolandhome.in/*`,
  `*.carunnaispecialachoolandhome.in/*`, `localhost/*`.
  If the site moves to a new address, add it to the key's website list.
- `rootFolderId` – ID of the main Drive folder.

If Drive can't be reached, the built-in photos are shown, so the page is never empty.

## Home page – "Our hostel"

The hostel section on the home page shows the latest 4 photos from the
folder whose name contains **Hostel** (`assets/js/hostel.js`). The
"Watch hostel videos" button opens `gallery.html#album=hostel&type=video`.
Facility list is in `index.html` (section `id="hostel"`).

## Languages

English is the default. The **English | தமிழ் | हिन्दी** switch is in the top bar
(and in the mobile menu). The choice is remembered across pages.

To change a translation, search the English sentence in `assets/js/i18n-dict.js`
and edit the Tamil (`"ta"`) or Hindi (`"hi"`) text next to it.
If you change English text in an HTML page, update the same sentence in
`i18n-dict.js` too, or that line will stay in English when Tamil/Hindi is selected.
Names, address, phone and email are intentionally not translated.

## Other pages' photos

Photos on Home, About, Our Home, Programmes etc. come from
`assets/img/gallery/thumbs/gNN.jpg` (and `gNN.jpg`). To change one, replace
the file with a new photo **using the same file name**.

## Contact details used on the site

- Phone: +91 94436 32645 (C. Ganesh, Founder)
- Email: carunnai@gmail.com
- Address: No. 30, 5th Cross, Kamban Nagar, Reddiarpalayam, Puducherry – 605010
- Donations: Google Form linked from every "Donate" button

## Publish

```
git add -A
git commit -m "Describe the change"
git push
```
GitHub Pages updates the live site a minute or two after the push.

---
Designed by Arun G R & Venkatapathi K – Stark InnovationZ
