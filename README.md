# Crystal Cascade

A gem-matching puzzle game for phones, packaged as an installable Progressive Web App (PWA).
Twenty levels on a 7×7 board, with Line Blasters, Bombs and Prisms, frost, stones and chained gems,
sound and vibration, hints, and saved progress. It works offline once installed.

## Project layout

```
public/                 Everything Vercel serves
  index.html            The whole game (HTML, CSS and JavaScript in one file)
  manifest.webmanifest  App name, colours and icons used when installing
  sw.js                 Service worker: caches the game so it runs offline
  icons/                App icons, favicon and Apple touch icon
tools/make-icons.mjs    Regenerates every icon from code
vercel.json             Static hosting settings and headers
```

There is no build step and no runtime dependencies.

## Deploy to Vercel

1. In Vercel, choose **Add New → Project** and import this GitHub repository.
2. Leave the settings as they are. `vercel.json` already sets the framework to *Other* and the output folder to `public`.
3. Click **Deploy**. Every push to the main branch redeploys automatically.

From the command line instead: `npx vercel` (preview) or `npx vercel --prod`.

## Install it on your phone

PWAs need HTTPS, which every Vercel URL has.

- **Android (Chrome):** open the site and tap **Install the app** at the bottom of the level map,
  or use the browser menu → *Install app*.
- **iPhone / iPad (Safari):** open the site, tap **Share**, then **Add to Home Screen**.

The game then opens full screen from its own icon and keeps working without a connection.
Stars and best scores are stored on the device.

## Run locally

```
npm run dev
```

then open <http://localhost:3000>. The service worker only runs on `localhost` or HTTPS, not from a `file://` URL.

## Releasing an update

When you change any file in `public/`, bump `VERSION` at the top of `public/sw.js` (for example `v1` → `v2`).
Installed copies fetch the new version the next time they open with a connection.

## Regenerating the icons

```
npm run icons
```

This installs `sharp` temporarily and rewrites everything in `public/icons/`.
