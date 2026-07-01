/**
 * Dual language: English (default) + Bahasa Malaysia (bm).
 * Code in examples (html/css/js) is never translated.
 */
const I18n = (function () {
  const STORAGE_KEY = "mwd-lang";
  let lang = localStorage.getItem(STORAGE_KEY) || "en";
  let uiStrings = null;
  let modulesMetaBm = null;
  const bmOverlayCache = new Map();

  function getLang() {
    return lang;
  }

  function setLang(next) {
    if (next !== "en" && next !== "bm") return;
    lang = next;
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next === "bm" ? "ms" : "en";
    updateLangButtons();
    window.dispatchEvent(new CustomEvent("langchange", { detail: { lang: next } }));
  }

  function toggleLang() {
    setLang(lang === "en" ? "bm" : "en");
  }

  async function init() {
    document.documentElement.lang = lang === "bm" ? "ms" : "en";
    const res = await fetch("content/locales/ui.json");
    if (!res.ok) throw new Error("Failed to load UI translations");
    uiStrings = await res.json();
    if (lang === "bm") {
      await loadModulesMetaBm();
    }
    updateLangButtons();
    return lang;
  }

  async function loadModulesMetaBm() {
    if (modulesMetaBm) return modulesMetaBm;
    const res = await fetch("content/locales/modules.bm.json");
    if (!res.ok) return (modulesMetaBm = {});
    modulesMetaBm = await res.json();
    return modulesMetaBm;
  }

  function t(key) {
    if (!uiStrings) return key;
    return uiStrings[lang]?.[key] ?? uiStrings.en?.[key] ?? key;
  }

  function getTrackTitle(trackId, fallback) {
    if (lang === "en") return fallback;
    return modulesMetaBm?.tracks?.[trackId] || fallback;
  }

  function getModuleTitle(moduleId, fallback) {
    if (lang === "en") return fallback;
    return modulesMetaBm?.modules?.[moduleId]?.title || fallback;
  }

  function getModuleSummary(moduleId, fallback) {
    if (lang === "en") return fallback;
    return modulesMetaBm?.modules?.[moduleId]?.summary || fallback;
  }

  function bmPathFromJsonPath(jsonPath) {
    const base = jsonPath.split("/").pop();
    return `content/locales/bm/${base}`;
  }

  async function loadBmOverlay(jsonPath) {
    if (lang === "en") return null;
    if (bmOverlayCache.has(jsonPath)) return bmOverlayCache.get(jsonPath);
    const path = bmPathFromJsonPath(jsonPath);
    const res = await fetch(path);
    if (!res.ok) {
      bmOverlayCache.set(jsonPath, null);
      return null;
    }
    const data = await res.json();
    bmOverlayCache.set(jsonPath, data);
    return data;
  }

  function mergeGuide(baseGuide, bmGuide) {
    if (!bmGuide) return baseGuide;
    if (!baseGuide) return bmGuide;
    const merged = { ...baseGuide, ...bmGuide };
    if (bmGuide.steps) merged.steps = bmGuide.steps;
    return merged;
  }

  function mergeModule(base, overlay, moduleId) {
    if (lang === "en" || !overlay) {
      const title = getModuleTitle(moduleId, base.title);
      const summary = getModuleSummary(moduleId, base.summary);
      if (lang === "bm" && (title !== base.title || summary !== base.summary)) {
        return { ...base, title, summary };
      }
      return base;
    }

    const out = { ...base };
    if (overlay.title) out.title = overlay.title;
    else out.title = getModuleTitle(moduleId, base.title);
    if (overlay.summary) out.summary = overlay.summary;
    else out.summary = getModuleSummary(moduleId, base.summary);
    if (overlay.guide || base.guide) {
      out.guide = mergeGuide(base.guide, overlay.guide);
    }
    if (base.examples && overlay.examples) {
      const bmMap = Array.isArray(overlay.examples)
        ? Object.fromEntries(overlay.examples.map((e) => [e.id, e]))
        : overlay.examples;
      out.examples = base.examples.map((ex) => {
        const bm = bmMap[ex.id];
        if (!bm) return ex;
        return {
          ...ex,
          title: bm.title || ex.title,
          description: bm.description || ex.description,
        };
      });
    }
    if (base.practice && overlay.practice) {
      out.practice = {
        ...base.practice,
        description: overlay.practice.description || base.practice.description,
        hints: overlay.practice.hints || base.practice.hints,
      };
    }
    return out;
  }

  async function applyModuleLocale(module, jsonPath, moduleId) {
    if (lang === "en") return module;
    await loadModulesMetaBm();
    const overlay = await loadBmOverlay(jsonPath);
    return mergeModule(module, overlay, moduleId);
  }

  function clearBmCache() {
    bmOverlayCache.clear();
  }

  function updateLangButtons() {
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      const active = btn.dataset.lang === lang;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function bindLangToggle() {
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.lang && btn.dataset.lang !== lang) {
          setLang(btn.dataset.lang);
        }
      });
    });
  }

  function applyPageUi() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = t(key);
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = val;
      } else {
        el.textContent = val;
      }
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.title = t(el.getAttribute("data-i18n-title"));
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-title")));
    });
    const pageTitle = document.querySelector("title");
    if (pageTitle?.dataset.i18nTitle) {
      pageTitle.textContent = t(pageTitle.dataset.i18nTitle);
    }
  }

  return {
    init,
    getLang,
    setLang,
    toggleLang,
    t,
    getTrackTitle,
    getModuleTitle,
    applyModuleLocale,
    loadModulesMetaBm,
    clearBmCache,
    bindLangToggle,
    applyPageUi,
    updateLangButtons,
  };
})();
