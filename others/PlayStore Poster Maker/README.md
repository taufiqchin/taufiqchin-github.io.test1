# Play Store Poster Maker

A single-page web app to create Google Play marketing graphics with a **live preview**. No install or build step — open `index.html` in your browser.

## Quick start

1. Open `index.html` in Chrome, Edge, or Firefox.
2. Choose an asset type matching Google Play Console (Graphics, Phone, or Tablet).
3. Set background, add images and text, drag elements on the preview.
4. Choose PNG or JPEG and click **Download Poster**.

## Supported assets (Google Play Console)

| Asset | Canvas size | Format | Max size |
|-------|-------------|--------|----------|
| **App Icon** | 512 × 512 | PNG or JPEG | 1 MB |
| **Feature Graphic** | 1,024 × 500 | PNG or JPEG | 15 MB |
| **Phone Screenshot** (9:16) | 1,080 × 1,920 | PNG or JPEG | 8 MB |
| **Phone Screenshot** (16:9) | 1,920 × 1,080 | PNG or JPEG | 8 MB |
| **7-inch Tablet** (9:16) | 1,080 × 1,920 | PNG or JPEG | 8 MB |
| **7-inch Tablet** (16:9) | 1,920 × 1,080 | PNG or JPEG | 8 MB |
| **10-inch Tablet** (9:16) | 1,600 × 2,844 | PNG or JPEG | 8 MB |
| **10-inch Tablet** (16:9) | 2,560 × 1,440 | PNG or JPEG | 8 MB |

**Play Console rules reflected:**
- Phone & 7-inch tablet: 16:9 or 9:16, each side 320–3,840 px
- 10-inch tablet: 16:9 or 9:16, each side 1,080–7,680 px
- Phone promotion: use ≥1,080 px per side and upload 4+ screenshots

## Features

- **Live WYSIWYG preview**
- **Background** — solid color or image with blur
- **Overlay images** (2 slots) — position, size, align, rounded corners
- **Text** — word wrap, alignment, font controls
- **Feature Graphic safe zone** — optional guide overlay
- **Export** — PNG (default) or JPEG, compressed to Play Console limits

## Google Play reference

[Add preview assets (Play Console Help)](https://support.google.com/googleplay/android-developer/answer/9866151)
