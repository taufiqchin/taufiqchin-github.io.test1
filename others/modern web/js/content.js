/**
 * Loads content/index.json and per-module JSON files.
 */
const ContentAPI = (function () {
  let indexCache = null;
  const moduleCache = new Map();

  async function loadIndex() {
    if (indexCache) return indexCache;
    const res = await fetch("content/index.json");
    if (!res.ok) throw new Error("Failed to load content/index.json");
    indexCache = await res.json();
    return indexCache;
  }

  function getModuleMeta(index, moduleId) {
    return index.modules.find((m) => m.id === moduleId) || null;
  }

  async function loadModule(moduleId) {
    if (moduleCache.has(moduleId)) return moduleCache.get(moduleId);
    const index = await loadIndex();
    const meta = getModuleMeta(index, moduleId);
    if (!meta) throw new Error(`Unknown module: ${moduleId}`);
    const res = await fetch(meta.jsonPath);
    if (!res.ok) throw new Error(`Failed to load ${meta.jsonPath}`);
    const data = await res.json();
    moduleCache.set(moduleId, data);
    return data;
  }

  async function fetchText(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to fetch ${path}`);
    return res.text();
  }

  /** Resolve example to { html, css, js } from inline files or fileRefs. */
  async function resolveExampleFiles(example) {
    if (example.files) {
      return EditorRunner.normalizeFiles(example.files);
    }
    if (!example.fileRefs) {
      return { html: "", css: "", js: "" };
    }
    const refs = example.fileRefs;
    const htmlPath = refs.html || "";
    const cssPath = refs.css || "";
    const jsPath = refs.js || "";

    let html = "";
    let css = "";
    let js = "";

    if (htmlPath) {
      const raw = await fetchText(htmlPath);
      const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        html = bodyMatch[1].trim();
      } else {
        html = raw;
      }
      const styleMatch = raw.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      if (styleMatch && !cssPath) css = styleMatch[1].trim();
      const scriptMatches = [...raw.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
      const inlineScripts = scriptMatches.map((m) => m[1].trim()).filter(Boolean);
      if (inlineScripts.length && !jsPath) {
        js = inlineScripts.join("\n\n");
      }
    }
    if (cssPath) css = await fetchText(cssPath);
    if (jsPath) js = await fetchText(jsPath);

    return EditorRunner.normalizeFiles({ html, css, js });
  }

  function modulesByTrack(index) {
    return index.tracks.map((t) => ({
      ...t,
      modules: index.modules
        .filter((m) => m.track === t.id)
        .sort((a, b) => a.order - b.order),
    }));
  }

  return {
    loadIndex,
    loadModule,
    getModuleMeta,
    resolveExampleFiles,
    modulesByTrack,
  };
})();
