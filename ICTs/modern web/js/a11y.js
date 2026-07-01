/**
 * Accessibility: text size, grayscale, reset. Persists in localStorage.
 */
const A11y = (function () {
  const STORAGE_KEY = "mwrc-a11y-v3";
  const MIN_LEVEL = -3;
  const MAX_LEVEL = 4;
  const STEP = 0.125;
  /** Level 0 = two steps larger than the original site default (old A+ twice). */
  const BASE_SCALE = 1.25;
  const DEFAULT_FONT_LEVEL = 0;

  let state = { fontLevel: DEFAULT_FONT_LEVEL, grayscale: false };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved.fontLevel === "number") state.fontLevel = saved.fontLevel;
        if (typeof saved.grayscale === "boolean") state.grayscale = saved.grayscale;
        return;
      }
      // Migrate grayscale from prior keys; reset text level to new larger baseline.
      for (const key of ["mwrc-a11y-v2", "mwrc-a11y"]) {
        const legacy = localStorage.getItem(key);
        if (!legacy) continue;
        const saved = JSON.parse(legacy);
        if (typeof saved.grayscale === "boolean") state.grayscale = saved.grayscale;
        saveState();
        break;
      }
    } catch {
      /* ignore */
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }

  function refreshCodeMirrors() {
    if (typeof CodeMirror === "undefined") return;
    document.querySelectorAll(".CodeMirror").forEach((el) => {
      if (el.CodeMirror) el.CodeMirror.refresh();
    });
  }

  function apply() {
    const scale = BASE_SCALE + state.fontLevel * STEP;
    document.documentElement.style.setProperty("--a11y-font-scale", String(scale));
    document.documentElement.classList.toggle("a11y-grayscale", state.grayscale);

    const grayBtn = document.getElementById("a11y-grayscale");
    if (grayBtn) {
      grayBtn.setAttribute("aria-pressed", state.grayscale ? "true" : "false");
      grayBtn.classList.toggle("is-active", state.grayscale);
    }

    refreshCodeMirrors();
  }

  function textBigger() {
    state.fontLevel = Math.min(MAX_LEVEL, state.fontLevel + 1);
    saveState();
    apply();
  }

  function textSmaller() {
    state.fontLevel = Math.max(MIN_LEVEL, state.fontLevel - 1);
    saveState();
    apply();
  }

  function toggleGrayscale() {
    state.grayscale = !state.grayscale;
    saveState();
    apply();
  }

  function reset() {
    state = { fontLevel: DEFAULT_FONT_LEVEL, grayscale: false };
    saveState();
    apply();
  }

  function bindControls() {
    document.getElementById("a11y-text-bigger")?.addEventListener("click", textBigger);
    document.getElementById("a11y-text-smaller")?.addEventListener("click", textSmaller);
    document.getElementById("a11y-grayscale")?.addEventListener("click", toggleGrayscale);
    document.getElementById("a11y-reset")?.addEventListener("click", reset);
  }

  function init() {
    loadState();
    apply();
    bindControls();
  }

  loadState();
  apply();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindControls);
  } else {
    bindControls();
  }

  return { init, reset, apply };
})();
