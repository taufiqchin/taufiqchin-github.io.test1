const Router = (function () {
  const STEM_MODULE_ID = "create-my-website";

  function getModuleId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("module") || "";
  }

  function lessonUrl(moduleId) {
    return `lesson.html?module=${encodeURIComponent(moduleId)}`;
  }

  function renderSidebar(container, index, activeId) {
    const tracks = ContentAPI.modulesByTrack(index);
    container.innerHTML = tracks
      .map(
        (track) => `
      <div class="nav-track">
        <div class="nav-track-title">${typeof I18n !== "undefined" ? I18n.getTrackTitle(track.id, track.title) : track.title}</div>
        ${track.modules
          .map(
            (m) => `
          <a class="nav-link${m.id === activeId ? " active" : ""}" href="${lessonUrl(m.id)}">${typeof I18n !== "undefined" ? I18n.getModuleTitle(m.id, m.title) : m.title}</a>
        `
          )
          .join("")}
      </div>
    `
      )
      .join("");
  }

  function escapeHtml(text) {
    if (text == null) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function exampleAnchorId(exampleId) {
    return `example-${exampleId}`;
  }

  function renderStemSidebar(container, module) {
    const examplesLabel =
      typeof I18n !== "undefined" ? I18n.t("stemExamplesNav") : "Examples";
    const exampleLinks = (module.examples || [])
      .map(
        (ex, i) => `
        <a class="nav-link nav-link--example" href="#${exampleAnchorId(ex.id)}" data-example-anchor="${exampleAnchorId(ex.id)}">${escapeHtml(`${i + 1}. ${ex.title}`)}</a>
      `
      )
      .join("");

    container.innerHTML = `
      <a class="nav-link nav-link--lesson active" href="${lessonUrl(STEM_MODULE_ID)}">${escapeHtml(module.title)}</a>
      <div class="nav-track nav-track--stem-examples">
        <div class="nav-track-title">${escapeHtml(examplesLabel)}</div>
        ${exampleLinks}
      </div>
    `;
  }

  function moduleCardLabel(meta) {
    if (meta.id === "create-my-website") {
      return typeof I18n !== "undefined" ? I18n.t("stemModule") : "STEM Module";
    }
    const lessonLabel = typeof I18n !== "undefined" ? I18n.t("lessonOrder") : "Lesson";
    return `${lessonLabel} ${meta.order}`;
  }

  function renderHomeTracks(container, index) {
    const tracks = ContentAPI.modulesByTrack(index);
    container.innerHTML = tracks
      .map((track) => {
        const badgeClass = `track-badge--${track.id}`;
        const trackTitle = typeof I18n !== "undefined" ? I18n.getTrackTitle(track.id, track.title) : track.title;
        return `
        <section class="track-section" id="track-${track.id}">
          <h3><span class="track-badge ${badgeClass}">${track.id}</span> ${trackTitle}</h3>
          <div class="module-grid">
            ${track.modules
              .map(
                (m) => `
              <a class="module-card" href="${lessonUrl(m.id)}">
                <h4>${typeof I18n !== "undefined" ? I18n.getModuleTitle(m.id, m.title) : m.title}</h4>
                <p>${moduleCardLabel(m)}</p>
              </a>
            `
              )
              .join("")}
          </div>
        </section>
      `;
      })
      .join("");
  }

  return {
    getModuleId,
    lessonUrl,
    renderSidebar,
    renderStemSidebar,
    renderHomeTracks,
    exampleAnchorId,
    STEM_MODULE_ID,
  };
})();
