# SportLink — Brand & Favicon Assets

Production-ready logo, favicon, and PWA assets for **SportLink** — an app to find sports near you on a map.

> **Important for the implementer (e.g. Claude Code):**
> The files in this bundle are **final, production-ready assets** — SVG (vector, text already outlined → no font dependency), PNG (rasterized at standard sizes), ICO, and a PWA web manifest.
> **Do NOT recreate or redraw them.** Just copy the files into the project and wire up the `<head>` tags + manifest exactly as documented below. Pick ONE logo direction (A or B) for the live app icons/favicon; both are provided so the team can choose.

---

## 1. Folder structure

```
sportlink-brand/
├── README.md                  ← this file
├── logos/                     ← the master logo lockups (vector, scalable)
│   ├── SportLink Icon A.svg                 app icon — dark squircle (primary)
│   ├── SportLink Icon B.svg                 app icon — vivid gradient bg
│   ├── SportLink Horizontal A.svg           icon + wordmark, dark text (light bg)
│   ├── SportLink Horizontal A -reversed-.svg  white text (dark bg)
│   ├── SportLink Horizontal B.svg
│   ├── SportLink Horizontal B -reversed-.svg
│   ├── SportLink Vertical A.svg             stacked icon + wordmark
│   ├── SportLink Vertical B.svg
│   ├── SportLink Wordmark.svg               text only, navy
│   └── SportLink Wordmark -white-.svg       text only, white
├── favicon-A/                 ← complete favicon pack for Logo A
└── favicon-B/                 ← complete favicon pack for Logo B
```

Each `favicon-X/` folder contains:

| File | Use |
|------|-----|
| `favicon.ico` | Classic multi-size icon (16/32/48) for `<link rel="icon">` |
| `favicon.svg` | Modern scalable favicon (preferred by Chrome/Firefox/Safari) |
| `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png` | PNG fallbacks |
| `apple-touch-icon.png` | 180×180 — iOS home-screen icon |
| `icon-192.png`, `icon-512.png` | PWA / Android icons (`purpose: any`) |
| `maskable-192.png`, `maskable-512.png`, `maskable.svg` | Android adaptive (`purpose: maskable`, full-bleed safe zone) |
| `safari-pinned-tab.svg` | Monochrome mask icon for Safari pinned tabs |
| `site.webmanifest` | PWA manifest referencing the icons above |

---

## 2. How to install (web app)

1. **Choose a direction.** Logo **A** (dark navy squircle) is the recommended default; **B** is the vivid-background alternative. Copy the contents of the chosen `favicon-X/` folder into the web root (e.g. `public/` or `static/`).
2. Copy the logo lockups you need from `logos/` into your assets folder (e.g. `src/assets/`) and reference them in the UI (header, nav, splash, etc.).
3. Add this to the `<head>` of the document:

```html
<!-- Favicons -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#1FD37E">

<!-- PWA -->
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#0B1E3D">
```

> If files live in a subfolder instead of the web root, update the `href`/`src` paths and the `src` values inside `site.webmanifest` accordingly (they are currently root-relative).

---

## 3. Brand tokens

| Token | Value | Use |
|-------|-------|-----|
| Navy (bleu nuit) | `#0B1E3D` | Primary dark / "Sport" wordmark / theme color |
| Navy gradient | `#102A52` → `#07142A` | Icon A background |
| Vert dynamique | `#1FD37E` | Primary accent / "Link" wordmark / pin |
| Vert clair | `#5BEEA8` | Gradient highlight |
| Bleu | `#2B8CE0` | Gradient endpoint (pin / icon B bg) |
| Pin gradient | `#5BEEA8` → `#1FD37E` → `#2B8CE0` | The map-pin fill |

**Typography (wordmark):** the wordmark is set in **Sora** (Google Fonts), weights 700 (wordmark) / 800 (the "S" monogram). The logo SVGs have this text **converted to vector outlines**, so they render identically everywhere with **no font needed**. If you set "SportLink" as live HTML text elsewhere in the UI, load Sora:

```html
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&display=swap" rel="stylesheet">
```

Wordmark style: `font-weight: 700; letter-spacing: -0.03em;` — "Sport" in navy, "Link" in green.

---

## 4. Logo concept (for context)

- **Icon:** a map **pin** with a stylized **"S"** carved into its head — fusing the app's two ideas: location/map + Sport(Link). Two finishes: **A** (deep navy squircle, gradient pin) and **B** (vivid gradient background, navy pin).
- **Lockups:** horizontal (primary), vertical (stacked), and wordmark-only, each in a dark-text and a white (reversed) variant.

---

## 5. Need other formats?
The maintainers of this bundle can also provide: PNG exports of the lockups at arbitrary sizes, a monochrome single-color logo, social/OpenGraph images, or an animated SVG. Just ask.
