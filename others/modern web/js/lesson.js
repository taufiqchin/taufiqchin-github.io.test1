/** Multi-tab code block (read-only examples or editable practice). */
class CodeBlock {
  constructor(root, { readOnly = false, onRun = null } = {}) {
    if (!root) throw new Error("CodeBlock requires a root element");
    this.root = root;
    this.readOnly = readOnly;
    this.onRun = onRun;
    this.langs = ["html", "css", "js"];
    this.activeLang = "html";
    this.editors = {};
    this.files = { html: "", css: "", js: "" };
    this._built = false;
  }

  async init(files) {
    this.files = { ...files };
    if (!this._built) this._buildShell();
    await EditorRunner.ensureCodeMirror();
    for (const lang of this.langs) {
      const wrap = this.root.querySelector(`[data-editor="${lang}"]`);
      if (!wrap) continue;
      wrap.innerHTML = "";
      const ed = await EditorRunner.createEditor(
        wrap,
        this.files[lang],
        lang,
        this.readOnly
      );
      this.editors[lang] = ed;
      wrap.hidden = lang !== this.activeLang;
    }
    this._syncTabVisibility();
    requestAnimationFrame(() => {
      Object.values(this.editors).forEach((ed) => ed.refresh());
    });
  }

  _buildShell() {
    this._built = true;
    const tabs = this.langs
      .map(
        (l) =>
          `<button type="button" class="tab-btn${l === this.activeLang ? " active" : ""}" data-lang="${l}">${l.toUpperCase()}</button>`
      )
      .join("");
  const runBtn = this.onRun
      ? `<button type="button" class="btn btn--primary btn--small btn-run" aria-label="Run code">Run</button>`
      : "";
    const copyBtn = `<button type="button" class="btn btn--small btn-copy" aria-label="Copy code">Copy</button>`;

    this.root.innerHTML = `
      <div class="code-toolbar">
        ${tabs}
        <span class="toolbar-spacer"></span>
        ${copyBtn}
        ${runBtn}
      </div>
      ${this.langs
        .map(
          (l) =>
            `<div class="code-editor-wrap" data-editor="${l}" ${l !== this.activeLang ? "hidden" : ""}></div>`
        )
        .join("")}
    `;

    this.root.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.switchTab(btn.dataset.lang));
    });
    this.root.querySelector(".btn-copy")?.addEventListener("click", () => {
      const ed = this.editors[this.activeLang];
      EditorRunner.copyText(ed.getValue(), this.root.querySelector(".btn-copy"));
    });
    this.root.querySelector(".btn-run")?.addEventListener("click", () => {
      if (this.onRun) this.onRun(this.getFiles());
    });
  }

  switchTab(lang) {
    this.activeLang = lang;
    this.root.querySelectorAll(".tab-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.lang === lang);
    });
    this._syncTabVisibility();
    requestAnimationFrame(() => {
      this.editors[lang]?.refresh();
    });
  }

  _syncTabVisibility() {
    this.langs.forEach((l) => {
      const wrap = this.root.querySelector(`[data-editor="${l}"]`);
      if (wrap) wrap.hidden = l !== this.activeLang;
    });
  }

  getFiles() {
    return {
      html: this.editors.html?.getValue() ?? this.files.html,
      css: this.editors.css?.getValue() ?? this.files.css,
      js: this.editors.js?.getValue() ?? this.files.js,
    };
  }

  setFiles(files) {
    this.files = { ...files };
    for (const lang of this.langs) {
      if (this.editors[lang]) this.editors[lang].setValue(this.files[lang] || "");
    }
  }
}

function createOutputPanel(parent, id) {
  const panel = document.createElement("div");
  panel.className = "output-panel";
  panel.id = id;
  panel.innerHTML = `
    <h4>Output</h4>
    <iframe title="Preview" sandbox="allow-scripts allow-same-origin"></iframe>
    <pre class="console-output" hidden></pre>
  `;
  parent.appendChild(panel);
  return panel;
}

function resetOutputPanel(panel) {
  panel.innerHTML = `
    <h4>Output</h4>
    <iframe title="Preview" sandbox="allow-scripts allow-same-origin"></iframe>
    <pre class="console-output" hidden></pre>
  `;
}

function runExampleOutput(panel, example, files) {
  resetOutputPanel(panel);
  const iframe = panel.querySelector("iframe");
  const consoleEl = panel.querySelector(".console-output");
  panel.classList.add("visible");

  const outputType = example.outputType || "preview";

  if (outputType === "note") {
    iframe.remove();
    consoleEl.remove();
    EditorRunner.showNote(
      panel,
      example.note ||
        "Open the full demo with a local server (see README)."
    );
    return;
  }

  if (example.previewSrc) {
    EditorRunner.runExternal(iframe, example.previewSrc);
    return;
  }

  if (outputType === "console") {
    iframe.hidden = true;
    consoleEl.hidden = false;
    consoleEl.textContent = "";
    consoleEl.classList.add("visible");
    EditorRunner.runSrcdoc(iframe, files.html, files.css, files.js, "console", (text) => {
      consoleEl.textContent = text || "(no output)";
    });
    return;
  }

  EditorRunner.runSrcdoc(iframe, files.html, files.css, files.js, "preview");
}

async function renderExampleCard(example, practiceBlock) {
  const card = document.createElement("article");
  card.className = "example-card";
  card.dataset.exampleId = example.id;

  card.innerHTML = `
    <h3>${example.title}</h3>
    <p class="desc">${example.description}</p>
    <div class="example-editor"></div>
    <div class="card-actions">
      <button type="button" class="btn btn--primary btn--small btn-run-example">Run example</button>
      <button type="button" class="btn btn--small btn-try-lab">Try in practice lab</button>
      ${example.fullDemoUrl ? `<a class="btn btn--small" href="${example.fullDemoUrl}" target="_blank" rel="noopener">Open full demo</a>` : ""}
    </div>
  `;

  const editorRoot = card.querySelector(".example-editor");
  const outputPanel = createOutputPanel(card, `out-${example.id}`);
  const codeBlock = new CodeBlock(editorRoot, { readOnly: true });

  let resolved = example.files
    ? { ...example.files }
    : await ContentAPI.resolveExampleFiles(example);
  await codeBlock.init(resolved);

  card.querySelector(".btn-run-example").addEventListener("click", async () => {
    if (!example.files && example.fileRefs) {
      resolved = await ContentAPI.resolveExampleFiles(example);
    } else {
      resolved = codeBlock.getFiles();
    }
    runExampleOutput(outputPanel, example, resolved);
  });

  card.querySelector(".btn-try-lab").addEventListener("click", () => {
    practiceBlock.setFiles(codeBlock.getFiles());
    document.querySelector(".practice-panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  return card;
}

function setupSidebarMenu() {
  const toggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("lesson-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (!toggle || !sidebar) return;

  const mobileQuery = window.matchMedia("(max-width: 960px)");

  function closeSidebar() {
    sidebar.classList.remove("is-open");
    backdrop?.classList.remove("is-visible");
    backdrop?.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open lessons menu");
    document.body.style.overflow = "";
  }

  function openSidebar() {
    if (!mobileQuery.matches) return;
    sidebar.classList.add("is-open");
    backdrop?.classList.add("is-visible");
    backdrop?.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close lessons menu");
    document.body.style.overflow = "hidden";
  }

  toggle.addEventListener("click", () => {
    if (sidebar.classList.contains("is-open")) closeSidebar();
    else openSidebar();
  });

  backdrop?.addEventListener("click", closeSidebar);

  document.getElementById("lesson-nav")?.addEventListener("click", (e) => {
    if (mobileQuery.matches && e.target.closest(".nav-link")) closeSidebar();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("is-open")) closeSidebar();
  });

  mobileQuery.addEventListener("change", (e) => {
    if (!e.matches) closeSidebar();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const main = document.getElementById("lesson-main");
  const moduleId = Router.getModuleId();

  if (!moduleId) {
    main.innerHTML = `<p class="error-msg">No module selected. <a href="index.html">Back to home</a></p>`;
    return;
  }

  try {
    const index = await ContentAPI.loadIndex();
    Router.renderSidebar(document.getElementById("lesson-nav"), index, moduleId);

    const module = await ContentAPI.loadModule(moduleId);
    document.getElementById("lesson-title").textContent = module.title;
    document.getElementById("lesson-summary").textContent = module.summary || "";
    document.title = `${module.title} — Modern Web Resource Center`;

    const examplesEl = document.getElementById("examples-list");
    const practiceRoot = document.getElementById("practice-editor-root");
    const practiceOutput = createOutputPanel(
      document.getElementById("practice-output"),
      "practice-out"
    );

    const practiceBlock = new CodeBlock(practiceRoot, {
      readOnly: false,
      onRun: (files) => {
        const panel = practiceOutput;
        panel.classList.add("visible");
        const iframe = panel.querySelector("iframe");
        const consoleEl = panel.querySelector(".console-output");
        const mode = module.practice?.outputType || "preview";
        if (mode === "console") {
          iframe.hidden = true;
          consoleEl.hidden = false;
          consoleEl.textContent = "";
          EditorRunner.runSrcdoc(
            iframe,
            files.html,
            files.css,
            files.js,
            "console",
            (text) => {
              consoleEl.textContent = text || "(no output)";
              EditorRunner.fitConsoleElement(consoleEl);
            }
          );
        } else {
          consoleEl.hidden = true;
          iframe.hidden = false;
          EditorRunner.runSrcdoc(
            iframe,
            files.html,
            files.css,
            files.js,
            "preview",
            null,
            { autoHeight: true, minHeight: 60, maxHeight: 560 }
          );
        }
      },
    });
    const starter = module.practice?.starter || { html: "", css: "", js: "" };
    await practiceBlock.init(starter);

    document.getElementById("practice-desc").textContent =
      module.practice?.description || "Edit and run your code.";

    const hintsEl = document.getElementById("practice-hints");
    if (module.practice?.hints?.length) {
      hintsEl.innerHTML = module.practice.hints.map((h) => `<li>${h}</li>`).join("");
      hintsEl.hidden = false;
    } else {
      hintsEl.hidden = true;
    }

    document.getElementById("btn-reset-practice").addEventListener("click", () => {
      practiceBlock.setFiles(module.practice?.starter || { html: "", css: "", js: "" });
    });

    document.getElementById("btn-run-practice").addEventListener("click", () => {
      practiceBlock.root.querySelector(".btn-run")?.click();
    });

    for (const ex of module.examples || []) {
      examplesEl.appendChild(await renderExampleCard(ex, practiceBlock));
    }

    setupSidebarMenu();
  } catch (err) {
    main.innerHTML = `<p class="error-msg">${err.message}<br><a href="index.html">Back to home</a></p>`;
  }
});
