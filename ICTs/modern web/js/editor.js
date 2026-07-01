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
      indentUnit: 2,
      tabSize: 2,
      indentWithTabs: false,
      smartIndent: true,
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
<style>html,body{margin:0;overflow:hidden;}</style>
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
    const inject = `<style>html,body{margin:0;overflow:hidden;}</style>${AUTO_HEIGHT_SCRIPT}`;
    if (/<\/body>/i.test(doc)) {
      return doc.replace(/<\/body>/i, `${inject}</body>`);
    }
    return doc + inject;
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

  function capHeight(value, min, max) {
    const h = Math.max(min, value || min);
    return max != null ? Math.min(max, h) : h;
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
      iframe.style.height = `${capHeight(h, min, max)}px`;
    } catch {
      /* cross-origin or not ready */
    }
  }

  function bindAutoHeight(iframe, { min = 60, max = null } = {}) {
    const apply = (height) => {
      iframe.style.height = `${capHeight(height, min, max)}px`;
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

  function fitConsoleElement(el, { min = 40, max = null } = {}) {
    if (!el) return;
    el.style.height = "auto";
    el.style.maxHeight = "none";
    el.style.overflow = "visible";
    const text = el.textContent || "";
    const lines = Math.max(1, text.split("\n").length);
    const lineHeight =
      parseFloat(window.getComputedStyle(el).lineHeight) || 18;
    const padding = 16;
    const h = capHeight(lines * lineHeight + padding, min, max);
    el.style.minHeight = `${h}px`;
  }

  function runSrcdoc(iframe, html, css, js, outputType, onConsole, options = {}) {
    const capture = outputType === "console";
    const { autoHeight = false, minHeight = 60, maxHeight = null } = options;

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

  function runExternal(iframe, url, options = {}) {
    clearIframeListeners(iframe);
    iframe.removeAttribute("srcdoc");
    iframe.src = url;
    if (options.autoHeight) {
      bindAutoHeight(iframe, {
        min: options.minHeight ?? 60,
        max: options.maxHeight ?? null,
      });
    }
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

  const VOID_HTML_TAGS =
    /^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;

  const SINGLE_LINE_BLOCK_TAGS = /^(?:h[1-6]|p)$/i;

  function tokenizeHtmlFragment(html) {
    return (html.match(/(<[^>]+>|[^<]+)/g) || [])
      .map((part) => {
        if (part.startsWith("<")) return part.trim();
        return part.replace(/\s+/g, " ");
      })
      .filter((part) => part.length > 0);
  }

  function braceDelta(line) {
    let delta = 0;
    let inStr = null;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inStr) {
        if (c === inStr && line[i - 1] !== "\\") inStr = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") {
        inStr = c;
        continue;
      }
      if (c === "{" || c === "[" || c === "(") delta++;
      if (c === "}" || c === "]" || c === ")") delta--;
    }
    return delta;
  }

  function formatJs(code) {
    if (!code?.trim()) return "";
    const lines = [];
    let depth = 0;

    for (const raw of code.replace(/\r\n/g, "\n").split("\n")) {
      const line = raw.trim();
      if (!line) {
        lines.push("");
        continue;
      }
      let lineDepth = depth;
      if (/^[}\])]/.test(line)) {
        depth = Math.max(0, depth - 1);
        lineDepth = depth;
      }
      lines.push(`${"  ".repeat(lineDepth)}${line}`);
      depth = Math.max(0, depth + braceDelta(line));
    }

    return lines.join("\n").trimEnd();
  }

  function splitTopLevelBlocks(text) {
    const blocks = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          blocks.push(text.slice(start, i + 1).trim());
          start = i + 1;
        }
      }
    }
    return blocks.filter(Boolean);
  }

  function formatCss(css) {
    if (!css?.trim()) return "";
    const lines = [];

    function emit(line, level) {
      lines.push(`${"  ".repeat(level)}${line}`);
    }

    function process(text, level) {
      for (const block of splitTopLevelBlocks(text)) {
        const open = block.indexOf("{");
        if (open === -1) continue;
        const header = block.slice(0, open).trim();
        const body = block.slice(open + 1, block.lastIndexOf("}")).trim();
        emit(`${header} {`, level);
        if (header.startsWith("@")) {
          process(body, level + 1);
        } else {
          body
            .split(";")
            .map((part) => part.trim())
            .filter(Boolean)
            .forEach((prop) => emit(`${prop};`, level + 1));
        }
        emit("}", level);
        lines.push("");
      }
    }

    process(css.trim(), 0);
    return lines.join("\n").trimEnd();
  }

  function isHtmlOpenTag(token) {
    if (!token.startsWith("<") || token.startsWith("</") || token.startsWith("<!")) {
      return false;
    }
    if (/\/>\s*$/.test(token)) return false;
    const tagName = token.match(/^<([\w-]+)/)?.[1]?.toLowerCase();
    return !(tagName && VOID_HTML_TAGS.test(tagName));
  }

  function htmlTagName(token) {
    return token.match(/^<\/?([\w-]+)/i)?.[1]?.toLowerCase() || "";
  }

  function findHtmlCloseIndex(tokens, openIndex, end) {
    const tagName = htmlTagName(tokens[openIndex]);
    if (!tagName) return -1;
    let depth = 1;
    for (let i = openIndex + 1; i < end; i++) {
      const token = tokens[i];
      if (token.startsWith("<!") || token.startsWith("<?")) continue;
      if (isHtmlOpenTag(token) && htmlTagName(token) === tagName) depth++;
      else if (new RegExp(`^</${tagName}>$`, "i").test(token)) {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  function inlineElementLine(openToken, tagName, text, depth) {
    const open = openToken.trim();
    const inner = text.trim();
    const line = inner ? `${open}${inner}</${tagName}>` : `${open}</${tagName}>`;
    return `${"  ".repeat(depth)}${line}`;
  }

  function formatHtmlStructure(html) {
    const tokens = tokenizeHtmlFragment(html);

    function formatRange(start, end, depth) {
      const lines = [];
      let i = start;

      while (i < end) {
        const token = tokens[i];

        if (!token.startsWith("<")) {
          if (!token.trim()) {
            i++;
            continue;
          }
          lines.push(`${"  ".repeat(depth)}${token}`);
          i++;
          continue;
        }

        if (token.startsWith("</")) {
          break;
        }

        if (token.startsWith("<!") || token.startsWith("<?")) {
          lines.push(`${"  ".repeat(depth)}${token}`);
          i++;
          continue;
        }

        const completeInline =
          /^<([\w-]+)(?:\s[^>]*)?>[\s\S]*<\/\1>\s*$/i.test(token);
        if (completeInline) {
          lines.push(`${"  ".repeat(depth)}${token}`);
          i++;
          continue;
        }

        if (!isHtmlOpenTag(token)) {
          lines.push(`${"  ".repeat(depth)}${token}`);
          i++;
          continue;
        }

        const tagName = htmlTagName(token);
        const closeIndex = findHtmlCloseIndex(tokens, i, end);
        if (closeIndex === -1) {
          lines.push(`${"  ".repeat(depth)}${token}`);
          i++;
          continue;
        }

        const innerTokens = tokens.slice(i + 1, closeIndex);

        if (SINGLE_LINE_BLOCK_TAGS.test(tagName)) {
          const innerHtml = innerTokens.join("");
          const open = token.trim();
          const line = innerHtml
            ? `${open}${innerHtml}</${tagName}>`
            : `${open}</${tagName}>`;
          lines.push(`${"  ".repeat(depth)}${line}`);
          i = closeIndex + 1;
          continue;
        }

        const hasElementChild = innerTokens.some(
          (t) =>
            (t.startsWith("<") && !t.startsWith("<!")) || /^\x00J\d+\x00$/.test(t)
        );

        if (!hasElementChild) {
          const text = innerTokens
            .filter((t) => !t.startsWith("<"))
            .join("")
            .trim();
          lines.push(inlineElementLine(token, tagName, text, depth));
          i = closeIndex + 1;
          continue;
        }

        lines.push(`${"  ".repeat(depth)}${token}`);
        lines.push(...formatRange(i + 1, closeIndex, depth + 1));
        lines.push(`${"  ".repeat(depth)}</${tagName}>`);
        i = closeIndex + 1;
      }

      return lines;
    }

    return formatRange(0, tokens.length, 0).join("\n");
  }

  const JS_SECTION_MARKER = "<!-- Js code below -->";

  function indentText(text, prefix) {
    if (!prefix || !text) return text;
    return text
      .split("\n")
      .map((line) => (line ? prefix + line : line))
      .join("\n");
  }

  function restoreJsSection(slot, lineIndent = "") {
    const scriptBody = slot.content;
    if (lineIndent) {
      return `${lineIndent}${JS_SECTION_MARKER}\n${lineIndent}${slot.open}\n${indentText(scriptBody, lineIndent + "  ")}\n${lineIndent}${slot.close}`;
    }
    return `${JS_SECTION_MARKER}\n${slot.open}\n${scriptBody}\n${slot.close}`;
  }

  function ensureJsInsideBody(html) {
    const stray = html.match(
      /<\/html>\s*(?:\n\s*)+(<!-- Js code below -->\s*<script\b[\s\S]*?<\/script>)/i
    );
    if (!stray) return html;
    const block = stray[1].trim();
    const without = html.replace(stray[0], "</html>");
    if (/<\/body>/i.test(without)) {
      return without.replace(/<\/body>/i, `\n\n${block}\n</body>`);
    }
    return without.replace(/<\/html>/i, `\n\n${block}\n</html>`);
  }

  function ensureBlankLineBeforeJsMarker(html) {
    if (!html.includes(JS_SECTION_MARKER)) return html;
    return html.replace(/\n+(\s*<!-- Js code below -->)/g, "\n\n$1");
  }

  function formatHtml(html, { fullDocument = false } = {}) {
    if (!html?.trim()) return "";
    const slots = [];
    let text = html.trim();

    text = text.replace(
      /\n*<!-- Js code below -->\s*(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi,
      (_, open, content, close) => {
        const id = slots.length;
        slots.push({
          type: "jsSection",
          open,
          content: formatJs(content.trim()),
          close,
        });
        return `\x00J${id}\x00`;
      }
    );

    text = text.replace(
      /(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi,
      (_, open, content, close) => {
        const id = slots.length;
        slots.push({ type: "script", open, content: formatJs(content.trim()), close });
        return `\x00S${id}\x00`;
      }
    );
    text = text.replace(/<!--[\s\S]*?-->/g, (comment) => {
      const id = slots.length;
      slots.push({ type: "comment", value: comment });
      return `\x00C${id}\x00`;
    });

    let formatted = formatHtmlStructure(text);
    formatted = formatted.replace(/^(\s*)\x00J(\d+)\x00/gm, (_, indent, id) => {
      const slot = slots[Number(id)];
      const bodyIndent = indent || (fullDocument ? "  " : "");
      return restoreJsSection(slot, bodyIndent);
    });
    formatted = formatted.replace(/\x00([SC])(\d+)\x00/g, (_, kind, id) => {
      const slot = slots[Number(id)];
      if (slot.type === "comment") return slot.value;
      return `${slot.open}\n${slot.content}\n${slot.close}`;
    });

    formatted = ensureBlankLineBeforeJsMarker(formatted);
    if (fullDocument) formatted = ensureJsInsideBody(formatted);
    return formatted.trimEnd();
  }

  function formatCode(value, lang, options = {}) {
    if (!value?.trim()) return value || "";
    if (lang === "css") return formatCss(value);
    if (lang === "html") return formatHtml(value, options);
    return value;
  }

  function mergeJsIntoHtml(html, js) {
    const trimmedJs = (js || "").trim();
    if (!trimmedJs) return html || "";
    const scriptBlock = `\n\n${JS_SECTION_MARKER}\n<script>\n${trimmedJs}\n</script>`;
    const htmlStr = html || "";
    if (/<\/body>/i.test(htmlStr)) {
      return htmlStr.replace(/<\/body>/i, `${scriptBlock}\n</body>`);
    }
    const trimmedHtml = htmlStr.replace(/\s+$/, "");
    return `${trimmedHtml}${scriptBlock}`;
  }

  function normalizeFiles(files) {
    const html = files?.html || "";
    const css = files?.css || "";
    const js = files?.js || "";
    const mergedHtml = js.trim() ? mergeJsIntoHtml(html, js) : html;
    return {
      html: formatCode(mergedHtml, "html"),
      css: formatCode(css, "css"),
      js: "",
    };
  }

  function practiceHtmlShell(bodyContent) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Practice</title>
</head>
<body>
${bodyContent.trim()}
</body>
</html>`;
  }

  function wrapPracticeHtml(html) {
    const trimmed = (html || "").trim();
    if (!trimmed) return practiceHtmlShell("  <!-- Your page content here -->");
    if (isFullHtml(trimmed)) {
      if (!/<meta[^>]+viewport/i.test(trimmed)) {
        return trimmed.replace(
          /<head([^>]*)>/i,
          '<head$1>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">'
        );
      }
      return trimmed;
    }
    return practiceHtmlShell(trimmed);
  }

  function preparePracticeStarter(files) {
    const html = files?.html || "";
    const css = files?.css || "";
    const js = files?.js || "";
    const mergedHtml = js.trim() ? mergeJsIntoHtml(html, js) : html;
    const wrapped = wrapPracticeHtml(mergedHtml);
    return {
      html: formatCode(wrapped, "html", { fullDocument: isFullHtml(wrapped) }),
      css: formatCode(css, "css"),
      js: "",
    };
  }

  return {
    ensureCodeMirror,
    createEditor,
    modeForLang,
    buildDocument,
    mergeJsIntoHtml,
    normalizeFiles,
    preparePracticeStarter,
    wrapPracticeHtml,
    formatCode,
    runSrcdoc,
    runExternal,
    showNote,
    copyText,
    fitConsoleElement,
  };
})();
