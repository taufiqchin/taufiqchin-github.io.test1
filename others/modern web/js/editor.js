/**
 * CodeMirror helpers and run/preview engine shared by examples and practice lab.
 */
const EditorRunner = (function () {
  const CM_BASE =
    "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16";
  let cmReady = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function loadCss(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  }

  function ensureCodeMirror() {
    if (cmReady) return cmReady;
    cmReady = (async () => {
      loadCss(`${CM_BASE}/codemirror.min.css`);
      loadCss(`${CM_BASE}/theme/elegant.min.css`);
      await loadScript(`${CM_BASE}/codemirror.min.js`);
      await loadScript(`${CM_BASE}/mode/xml/xml.min.js`);
      await loadScript(`${CM_BASE}/mode/css/css.min.js`);
      await loadScript(`${CM_BASE}/mode/javascript/javascript.min.js`);
      await loadScript(`${CM_BASE}/mode/htmlmixed/htmlmixed.min.js`);
    })();
    return cmReady;
  }

  function modeForLang(lang) {
    if (lang === "html") return "htmlmixed";
    if (lang === "css") return "css";
    return "javascript";
  }

  async function createEditor(container, value, lang, readOnly) {
    await ensureCodeMirror();
    const editor = CodeMirror(container, {
      value: value || "",
      mode: modeForLang(lang),
      theme: "elegant",
      lineNumbers: true,
      lineWrapping: true,
      fixedGutter: true,
      readOnly: readOnly ? true : false,
      cursorBlinkRate: readOnly ? -1 : 530,
      tabindex: readOnly ? -1 : 0,
    });
    editor._lang = lang;
    if (readOnly) {
      editor.getWrapperElement().classList.add("cm-readonly-example");
    }
    return editor;
  }

  function buildDocument(html, css, js, captureConsole) {
    let consoleScript = "";
    if (captureConsole) {
      consoleScript = `<script>
(function() {
  var lines = [];
  var orig = console.log;
  console.log = function() {
    var msg = Array.prototype.slice.call(arguments).map(function(a) {
      try { return typeof a === "object" ? JSON.stringify(a) : String(a); }
      catch(e) { return String(a); }
    }).join(" ");
    lines.push(msg);
    try {
      parent.postMessage({ type: "console-log", text: lines.join("\\n") }, "*");
    } catch(e) {}
    orig.apply(console, arguments);
  };
})();
<\/script>`;
    }

    const bodyHtml = html || "";
    const styleBlock = css ? `<style>${css}</style>` : "";
    const userScript = js ? `<script>${js}<\/script>` : "";

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
${styleBlock}
${consoleScript}
</head>
<body>
${bodyHtml}
${userScript}
</body>
</html>`;
  }

  function mergeFullHtml(html, css, js, captureConsole) {
    let doc = html;
    const consoleScript = captureConsole
      ? `<script>(function(){var o=console.log;console.log=function(){var m=Array.prototype.slice.call(arguments).join(" ");try{parent.postMessage({type:"console-log",text:m},"*");}catch(e){}o.apply(console,arguments);};})();<\/script>`
      : "";
    if (css && !/<style/i.test(doc)) {
      doc = doc.replace(/<\/head>/i, `<style>${css}</style></head>`);
    }
    if (consoleScript) {
      doc = doc.replace(/<\/head>/i, `${consoleScript}</head>`);
    }
    if (js && !/<script/i.test(doc)) {
      doc = doc.replace(/<\/body>/i, `<script>${js}<\/script></body>`);
    }
    return doc;
  }

  function isFullHtml(html) {
    return /^\s*<!DOCTYPE|^\s*<html/i.test(html || "");
  }

  const AUTO_HEIGHT_SCRIPT = `<script>
(function() {
  function reportHeight() {
    var root = document.documentElement;
    var body = document.body;
    var h = Math.max(
      root.scrollHeight, root.offsetHeight,
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0
    );
    try { parent.postMessage({ type: "preview-resize", height: h }, "*"); } catch (e) {}
  }
  window.addEventListener("load", reportHeight);
  window.addEventListener("resize", reportHeight);
  if (typeof MutationObserver !== "undefined" && document.body) {
    new MutationObserver(reportHeight).observe(document.body, {
      childList: true, subtree: true, attributes: true, characterData: true
    });
  }
  setTimeout(reportHeight, 0);
  setTimeout(reportHeight, 100);
  setTimeout(reportHeight, 300);
})();
<\/script>`;

  function injectAutoHeightScript(doc) {
    if (/<\/body>/i.test(doc)) {
      return doc.replace(/<\/body>/i, AUTO_HEIGHT_SCRIPT + "</body>");
    }
    return doc + AUTO_HEIGHT_SCRIPT;
  }

  function clearIframeListeners(iframe) {
    if (iframe._consoleHandler) {
      window.removeEventListener("message", iframe._consoleHandler);
      delete iframe._consoleHandler;
    }
    if (iframe._autoHeightHandler) {
      window.removeEventListener("message", iframe._autoHeightHandler);
      delete iframe._autoHeightHandler;
    }
  }

  function measureIframeHeight(iframe, min, max) {
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const h = Math.max(
        doc.documentElement.scrollHeight,
        doc.documentElement.offsetHeight,
        doc.body?.scrollHeight || 0,
        doc.body?.offsetHeight || 0
      );
      iframe.style.height = `${Math.min(max, Math.max(min, h))}px`;
    } catch {
      /* cross-origin or not ready */
    }
  }

  function bindAutoHeight(iframe, { min = 60, max = 560 } = {}) {
    const apply = (height) => {
      iframe.style.height = `${Math.min(max, Math.max(min, height || min))}px`;
    };

    const onMessage = (e) => {
      if (e.source !== iframe.contentWindow) return;
      if (e.data?.type === "preview-resize") apply(e.data.height);
    };
    window.addEventListener("message", onMessage);
    iframe._autoHeightHandler = onMessage;

    const measure = () => measureIframeHeight(iframe, min, max);
    iframe.addEventListener("load", () => {
      measure();
      setTimeout(measure, 50);
      setTimeout(measure, 250);
    });
  }

  function fitConsoleElement(el, { min = 40, max = 480 } = {}) {
    if (!el) return;
    el.style.height = "auto";
    el.style.maxHeight = "none";
    el.style.overflow = "visible";
    const text = el.textContent || "";
    const lines = Math.max(1, text.split("\n").length);
    const lineHeight =
      parseFloat(window.getComputedStyle(el).lineHeight) || 18;
    const padding = 16;
    const h = Math.min(max, Math.max(min, lines * lineHeight + padding));
    el.style.minHeight = `${h}px`;
  }

  function runSrcdoc(iframe, html, css, js, outputType, onConsole, options = {}) {
    const capture = outputType === "console";
    const { autoHeight = false, minHeight = 60, maxHeight = 560 } = options;

    clearIframeListeners(iframe);

    let doc = isFullHtml(html)
      ? mergeFullHtml(html, css, js, capture)
      : buildDocument(html, css, js, capture);

    if (autoHeight && !capture) {
      doc = injectAutoHeightScript(doc);
    }

    iframe.removeAttribute("src");
    iframe.srcdoc = doc;

    if (autoHeight && !capture) {
      bindAutoHeight(iframe, { min: minHeight, max: maxHeight });
    }

    if (capture && onConsole) {
      const handler = (e) => {
        if (e.data && e.data.type === "console-log") {
          onConsole(e.data.text);
        }
      };
      window.addEventListener("message", handler);
      iframe._consoleHandler = handler;
    }
  }

  function runExternal(iframe, url) {
    clearIframeListeners(iframe);
    iframe.removeAttribute("srcdoc");
    iframe.src = url;
  }

  function showNote(container, message) {
    container.innerHTML = `<div class="output-note">${message}</div>`;
    container.classList.add("visible");
  }

  async function copyText(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      if (button) {
        const prev = button.textContent;
        button.textContent = "Copied!";
        button.classList.add("copied");
        setTimeout(() => {
          button.textContent = prev;
          button.classList.remove("copied");
        }, 1500);
      }
    } catch {
      alert("Copy failed. Select the code and copy manually.");
    }
  }

  return {
    ensureCodeMirror,
    createEditor,
    modeForLang,
    buildDocument,
    runSrcdoc,
    runExternal,
    showNote,
    copyText,
    fitConsoleElement,
  };
})();
