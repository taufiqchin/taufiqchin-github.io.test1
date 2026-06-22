function escapeHtml(text) {
  if (text == null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

class CodeBlock {
  constructor(root, { readOnly = false, onRun = null, contentPaddingLines = 1 } = {}) {
    if (!root) throw new Error("CodeBlock requires a root element");
    this.root = root;
    this.readOnly = readOnly;
    this.contentPaddingLines = contentPaddingLines;
    this.onRun = onRun;
    this.langs = ["html", "css"];
    this.activeLang = "html";
    this.editors = {};
    this.files = { html: "", css: "", js: "" };
    this.defaultFiles = { html: "", css: "", js: "" };
    this._built = false;
    this._suppressChange = false;
  }

  async init(files) {
    this.files = EditorRunner.normalizeFiles(files);
    this.defaultFiles = {
      html: this.files.html,
      css: this.files.css,
      js: "",
    };
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
      ed.on("change", () => this._onEditorChange(lang));
    }
    this._syncTabVisibility();
    requestAnimationFrame(() => {
      Object.values(this.editors).forEach((ed) => ed.refresh());
      this._fitEditorHeight(this.activeLang);
    });
  }

  _onEditorChange(lang) {
    if (this._suppressChange || lang !== this.activeLang) return;
    this._fitEditorHeight(lang);
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

  _getContentHeight(ed) {
    ed.refresh();
    return ed.heightAtLine(ed.lineCount(), "local");
  }

  _getEditorFitHeight(ed) {
    const lineHeight = ed.defaultTextHeight();
    return this._getContentHeight(ed) + lineHeight * this.contentPaddingLines;
  }

  _setEditorHeightPx(ed, height) {
    ed.setSize(null, height);
    const scroller = ed.getScrollerElement();
    scroller.style.overflow = "hidden";
    scroller.style.maxHeight = "none";
  }

  _fitEditorHeight(lang) {
    const ed = this.editors[lang];
    const wrap = this.root.querySelector(`[data-editor="${lang}"]`);
    if (!ed || !wrap) return;

    wrap.classList.add("code-editor-wrap--collapsible");
    this._setEditorHeightPx(ed, this._getEditorFitHeight(ed));
    requestAnimationFrame(() => ed.refresh());
  }

  switchTab(lang) {
    this.activeLang = lang;
    this.root.querySelectorAll(".tab-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.lang === lang);
    });
    this._syncTabVisibility();
    requestAnimationFrame(() => {
      this.editors[lang]?.refresh();
      this._fitEditorHeight(lang);
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
      js: "",
    };
  }

  _applyEditorValues(files) {
    this.files = { html: files.html || "", css: files.css || "", js: "" };
    this._suppressChange = true;
    if (this.editors.html) this.editors.html.setValue(this.files.html);
    if (this.editors.css) this.editors.css.setValue(this.files.css);
    this._suppressChange = false;
    requestAnimationFrame(() => {
      this.langs.forEach((lang) => this._fitEditorHeight(lang));
    });
  }

  setFiles(files) {
    const normalized = EditorRunner.normalizeFiles(files);
    this._applyEditorValues(normalized);
  }

  reset() {
    this._applyEditorValues(this.defaultFiles);
  }
}

function uiText(key) {
  return typeof I18n !== "undefined" ? I18n.t(key) : key;
}

function createOutputPanel(parent, id) {
  const panel = document.createElement("div");
  panel.className = "output-panel output-panel--side";
  panel.id = id;
  panel.innerHTML = `
    <h4>${uiText("outputLabel")}</h4>
    <p class="output-placeholder">${escapeHtml(uiText("runOutputPlaceholder"))}</p>
    <iframe title="Preview" sandbox="allow-scripts allow-same-origin" hidden></iframe>
    <pre class="console-output" hidden></pre>
  `;
  parent.appendChild(panel);
  return panel;
}

const PREVIEW_RUN_OPTS = { autoHeight: true, minHeight: 60, maxHeight: null };

function resetOutputPanel(panel) {
  panel.innerHTML = `
    <h4>${uiText("outputLabel")}</h4>
    <p class="output-placeholder">${escapeHtml(uiText("runOutputPlaceholder"))}</p>
    <iframe title="Preview" sandbox="allow-scripts allow-same-origin" hidden></iframe>
    <pre class="console-output" hidden></pre>
  `;
}

function runExampleOutput(panel, example, files) {
  resetOutputPanel(panel);
  const placeholder = panel.querySelector(".output-placeholder");
  const iframe = panel.querySelector("iframe");
  const consoleEl = panel.querySelector(".console-output");
  panel.classList.add("visible");

  const outputType = example.outputType || "preview";

  if (outputType === "note") {
    placeholder?.remove();
    iframe?.remove();
    consoleEl?.remove();
    EditorRunner.showNote(
      panel,
      example.note ||
        "Open the full demo with a local server (see README)."
    );
    return;
  }

  placeholder?.remove();

  if (outputType === "console") {
    iframe.hidden = true;
    consoleEl.hidden = false;
    consoleEl.textContent = "";
    EditorRunner.runSrcdoc(iframe, files.html, files.css, files.js, "console", (text) => {
      consoleEl.textContent = text || "(no output)";
      EditorRunner.fitConsoleElement(consoleEl);
    });
    return;
  }

  iframe.hidden = false;
  EditorRunner.runSrcdoc(
    iframe,
    files.html,
    files.css,
    files.js,
    "preview",
    null,
    PREVIEW_RUN_OPTS
  );
}

async function renderExampleCard(example, number) {
  const card = document.createElement("article");
  card.className = "example-card";
  card.dataset.exampleId = example.id;
  const title = number ? `${number}. ${example.title}` : example.title;

  card.innerHTML = `
    <h3>${escapeHtml(title)}</h3>
    <p class="desc">${escapeHtml(example.description)}</p>
    <div class="lab-workspace">
      <div class="lab-code-col">
        <div class="example-editor"></div>
        <div class="card-actions">
          <button type="button" class="btn btn--primary btn--small btn-run-example">${escapeHtml(uiText("runExample"))}</button>
          <button type="button" class="btn btn--small btn-reset-example">${escapeHtml(uiText("reset"))}</button>
          ${example.fullDemoUrl ? `<a class="btn btn--small" href="${example.fullDemoUrl}" target="_blank" rel="noopener">${escapeHtml(uiText("openFullDemo"))}</a>` : ""}
        </div>
      </div>
      <div class="lab-output-col"></div>
    </div>
  `;

  const editorRoot = card.querySelector(".example-editor");
  const outputCol = card.querySelector(".lab-output-col");
  const outputPanel = createOutputPanel(outputCol, `out-${example.id}`);
  if (example.id === "display-output") {
    outputPanel.classList.add("output-panel--display-output");
  }
  const codeBlock = new CodeBlock(editorRoot, { readOnly: false });

  const defaultFiles = example.files
    ? { ...example.files }
    : await ContentAPI.resolveExampleFiles(example);
  await codeBlock.init(defaultFiles);

  card.querySelector(".btn-run-example").addEventListener("click", () => {
    runExampleOutput(outputPanel, example, codeBlock.getFiles());
  });

  card.querySelector(".btn-reset-example").addEventListener("click", () => {
    codeBlock.reset();
  });

  return card;
}

let sidebarMenuBound = false;

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
    toggle.setAttribute("aria-label", uiText("openMenu"));
    document.body.style.overflow = "";
  }

  function openSidebar() {
    if (!mobileQuery.matches) return;
    sidebar.classList.add("is-open");
    backdrop?.classList.add("is-visible");
    backdrop?.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", uiText("closeMenu"));
    document.body.style.overflow = "hidden";
  }

  if (!sidebarMenuBound) {
    sidebarMenuBound = true;
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
  } else {
    toggle.setAttribute("aria-label", uiText("openMenu"));
  }
}

function renderGuide(module) {
  const guide = module.guide;
  const section = document.getElementById("lesson-guide-section");
  if (!guide || !section) return;

  const titleEl = document.getElementById("lesson-guide-title");
  const introEl = document.getElementById("lesson-guide-intro");
  const stepsEl = document.getElementById("lesson-guide-steps");
  const footerEl = document.getElementById("lesson-guide-footer");

  titleEl.textContent = guide.title || uiText("guideDefaultTitle");
  introEl.textContent = guide.intro || "";
  introEl.hidden = !guide.intro;

  stepsEl.innerHTML = (guide.steps || [])
    .map((step) => {
      if (typeof step === "string") return `<li>${escapeHtml(step)}</li>`;
      const heading = step.title ? `<strong>${escapeHtml(step.title)}</strong> ` : "";
      return `<li>${heading}${escapeHtml(step.text || "")}</li>`;
    })
    .join("");

  footerEl.textContent = guide.footer || "";
  footerEl.hidden = !guide.footer;

  section.hidden = !guide.steps?.length;
}

async function loadLessonPage() {
  const main = document.getElementById("lesson-main");
  const moduleId = Router.getModuleId();

  if (!moduleId) {
    main.innerHTML = `<p class="error-msg">${escapeHtml(uiText("noModule"))} <a href="index.html">${escapeHtml(uiText("backHome"))}</a></p>`;
    return;
  }

  try {
    const index = await ContentAPI.loadIndex();
    Router.renderSidebar(document.getElementById("lesson-nav"), index, moduleId);

    const module = await ContentAPI.loadModule(moduleId);
    document.getElementById("lesson-title").textContent = module.title;
    document.getElementById("lesson-summary").textContent = module.summary || "";
    document.title = `${module.title} — ${uiText("pageTitleLesson").split("—")[1]?.trim() || "Modern Web Resource Center"}`;

    const examplesHeading = document.querySelector('section[aria-label="Examples"] h2');
    const practiceHeading = document.querySelector('section[aria-label="Practice lab"] h2');
    if (examplesHeading) examplesHeading.textContent = uiText("examplesSection");
    if (practiceHeading) practiceHeading.textContent = uiText("practiceLab");

    const runPracticeBtn = document.getElementById("btn-run-practice");
    const resetPracticeBtn = document.getElementById("btn-reset-practice");
    if (runPracticeBtn) runPracticeBtn.textContent = uiText("runExample");
    if (resetPracticeBtn) resetPracticeBtn.textContent = uiText("reset");

    renderGuide(module);

    const examplesEl = document.getElementById("examples-list");
    examplesEl.innerHTML = "";

    const practiceOutParent = document.getElementById("practice-output");
    practiceOutParent.innerHTML = "";
    document.getElementById("practice-editor-root").innerHTML = "";

    const practiceRoot = document.getElementById("practice-editor-root");
    const practiceOutput = createOutputPanel(practiceOutParent, "practice-out");

    const practiceBlock = new CodeBlock(practiceRoot, { readOnly: false });
    const starter = EditorRunner.preparePracticeStarter(
      module.practice?.starter || { html: "", css: "", js: "" }
    );
    await practiceBlock.init(starter);

    function runPracticeOutput() {
      runExampleOutput(
        practiceOutput,
        { outputType: module.practice?.outputType || "preview" },
        practiceBlock.getFiles()
      );
    }

    document.getElementById("practice-desc").textContent =
      module.practice?.description || uiText("editPracticeDefault");

    const hintsEl = document.getElementById("practice-hints");
    if (module.practice?.hints?.length) {
      hintsEl.innerHTML = module.practice.hints.map((h) => `<li>${escapeHtml(h)}</li>`).join("");
      hintsEl.hidden = false;
    } else {
      hintsEl.innerHTML = "";
      hintsEl.hidden = true;
    }

    const newRunBtn = document.getElementById("btn-run-practice");
    const newResetBtn = document.getElementById("btn-reset-practice");
    newResetBtn.replaceWith(newResetBtn.cloneNode(true));
    newRunBtn.replaceWith(newRunBtn.cloneNode(true));
    document.getElementById("btn-reset-practice").addEventListener("click", () => {
      practiceBlock.reset();
    });
    document.getElementById("btn-run-practice").addEventListener("click", () => {
      runPracticeOutput();
    });

    for (const [i, ex] of (module.examples || []).entries()) {
      examplesEl.appendChild(await renderExampleCard(ex, i + 1));
    }

    setupSidebarMenu();
  } catch (err) {
    main.innerHTML = `<p class="error-msg">${escapeHtml(err.message)}<br><a href="index.html">${escapeHtml(uiText("backHome"))}</a></p>`;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await I18n.init();
  I18n.bindLangToggle();
  I18n.applyPageUi();
  await loadLessonPage();
});

window.addEventListener("langchange", async () => {
  ContentAPI.clearModuleCache();
  I18n.clearBmCache();
  await I18n.loadModulesMetaBm();
  I18n.applyPageUi();
  await loadLessonPage();
});
