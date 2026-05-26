# Modern Web Development Resource Center

A static learning site for HTML, CSS, and JavaScript. Each lesson includes:

- **Examples** — described code you can read, **Copy**, and **Run** with live output
- **Practice lab** — edit HTML/CSS/JS, **Run**, and **Reset** to test your own code

## Quick start

From this folder, start a local server (required for `fetch`, AJAX, and loading lesson JSON):

```bash
npx --yes serve .
```

Open `http://localhost:3000` (or the URL shown in the terminal).

> Opening `index.html` directly (`file://`) will **not** load lessons or examples correctly.

## Project structure

```
index.html              Home page
lesson.html?module=…    Lesson page
content/
  index.json            Navigation catalog (tracks + module list)
  modules/*.json        One JSON file per lesson (examples + practice)
  examples/             Optional external demo files (AJAX, localStorage)
js/                     App logic
css/                    Styles
```

## Adding or editing content

### New example on an existing lesson

1. Open `content/modules/<lesson-id>.json`.
2. Add an object to the `examples` array (`id`, `title`, `description`, and `files` or `fileRefs`).
3. Refresh the browser.

### New lesson page

1. Create `content/modules/my-lesson.json` (copy an existing file as a template).
2. Add an entry to `content/index.json` under `modules` with `jsonPath` pointing to your file.

### Inline vs file-based code

- **Inline:** put code in `files.html`, `files.css`, `files.js` inside the module JSON.
- **Files:** use `fileRefs` and optional `previewSrc` for demos that need separate assets (see `js-ajax-json.json`).

## Original course materials

PowerPoint decks and extra demos remain in `1. Slides/` (outside this site).
