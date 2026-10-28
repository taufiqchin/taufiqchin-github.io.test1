# Image Shrink

Browser-only app to **resize** and **compress** images. Files are processed on your device and are never uploaded.

## Features

- Presets: video heights (240p–4K), long-edge limits, percent scale, social templates, custom max/exact size
- Default export format: **PNG** (also WebP, JPEG, AVIF when supported)
- Optional **Remove background** (runs locally via AI; first run downloads a model, output is always PNG with transparency)
- Quality slider and optional target file size (KB)
- Allow upscale (off by default)
- EXIF summary, auto-orient, metadata strip toggle
- Batch queue with **per-file overrides** (custom preset/format/quality per row or in the selected-file panel), ZIP download, compare slider, crop on preview
- PWA for offline use after first load

## Commands

```bash
npm install
npm start
npm run build
npm test
```

(`npm start` and `npm run dev` do the same thing.)

### How to open the app

| Method | Steps |
|--------|--------|
| **Dev (best)** | `npm run dev` → open the URL Vite prints (e.g. `http://localhost:5173`) |
| **Live Server** | Run `npm run build` first, then start Live Server with root **`dist`** (see `.vscode/settings.json`) or right‑click **`dist/index.html`** → Open with Live Server |
| **Avoid** | Opening the **root** `index.html` with Live Server only — it loads raw TypeScript and the page stays blank or shows the setup hint |

Drop images, choose a preset, click **Process**, then **Download** or **Download ZIP**.

## Browser support

Recent Chrome, Edge, Firefox, or Safari recommended for WebP/AVIF encoding.
