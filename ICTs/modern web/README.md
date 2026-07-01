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
index.html              Home page (lesson titles only)
lesson.html?module=…    Lesson page (summary, examples, practice)
content/
  index.json            Navigation catalog (tracks + module list)
  modules/*.json        One JSON file per lesson (all lesson content)
  modules/_template.json  Copy this to create a new lesson
  examples/             Optional external demo files (AJAX, localStorage)
js/                     App logic
css/                    Styles
```

## Where to add content

The home page (`index.html`) only shows **lesson titles**. It reads from `content/index.json`.

All **lesson content** (summary, code examples, practice lab) lives in `content/modules/<order>.<lesson-id>.json` (e.g. `1.html-intro.json`). The lesson page loads that file when you open `lesson.html?module=<lesson-id>`.

You do **not** edit `index.html` to add lesson body content — edit the JSON files instead.

### Module file reference

| Home page title | Edit this file |
|-----------------|----------------|
| Introduction to HTML | `content/modules/1.html-intro.json` |
| Text, Multimedia & Embedding | `content/modules/2.html-media.json` |
| Tables & Forms | `content/modules/3.html-forms.json` |
| CSS Fundamentals | `content/modules/4.css-1.json` |
| CSS Layout & Styling | `content/modules/5.css-2.json` |
| Intro to JavaScript | `content/modules/6.js-intro.json` |
| JavaScript Functions | `content/modules/7.js-functions.json` |
| DOM & Events | `content/modules/8.js-events.json` |
| JavaScript Objects | `content/modules/9.js-objects.json` |
| AJAX & JSON | `content/modules/10.js-ajax-json.json` |
| Web APIs | `content/modules/11.js-api.json` |
| Build a Full Website Page | `content/modules/12.full-page-capstone.json` |

### Three content areas in each module JSON

**1. Summary** — short intro under the lesson title:

```json
"summary": "Document structure, elements, attributes, and semantic markup."
```

**2. Examples** — add objects to the `examples` array:

```json
{
  "id": "basic-skeleton",
  "title": "Basic page skeleton",
  "description": "Minimum valid HTML5 document with head and body.",
  "outputType": "preview",
  "files": {
    "html": "<h1>Hello, HTML!</h1>",
    "css": "body { padding: 1rem; }",
    "js": ""
  }
}
```

Use `"outputType": "console"` for examples that print to a console panel instead of a live preview.

**3. Practice lab** — the editable editor on the lesson page:

```json
"practice": {
  "description": "Create a valid page with one h1 and a paragraph.",
  "outputType": "preview",
  "starter": {
    "html": "<!-- starter code -->",
    "css": "",
    "js": ""
  },
  "hints": ["Use <!DOCTYPE html>", "Only one <h1> per page"]
}
```

After saving, refresh the browser (with the local server running).

## Adding or editing content

### New example on an existing lesson

1. Open `content/modules/<order>.<lesson-id>.json` (e.g. `1.html-intro.json`).
2. Add an object to the `examples` array (`id`, `title`, `description`, and `files` or `fileRefs`).
3. Refresh the browser.

### New lesson page

1. Copy `content/modules/_template.json` to `content/modules/12.my-lesson.json` (use the next lesson number) and fill in your content.
2. Add an entry to `content/index.json` under `modules`:

```json
{
  "id": "my-lesson",
  "track": "html",
  "title": "My New Lesson Title",
  "order": 12,
  "jsonPath": "content/modules/12.my-lesson.json"
}
```

- `track` must be `"html"`, `"css"`, or `"js"`.
- `order` controls sort position on the home page and sidebar.
- The home page shows the title automatically; the lesson page loads everything else from your JSON file.

### Inline vs file-based code

- **Inline:** put code in `files.html`, `files.css`, `files.js` inside the module JSON.
- **Files:** use `fileRefs` and optional `previewSrc` for demos that need separate assets (see `js-ajax-json.json`):

```json
"fileRefs": {
  "html": "content/examples/ajax-xhr/index.html"
},
"previewSrc": "content/examples/ajax-xhr/index.html"
```

Put external demo assets under `content/examples/`.

## Original course materials

PowerPoint decks and extra demos remain in `1. Slides/` (outside this site).
