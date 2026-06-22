const Router = (function () {
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

  return { getModuleId, lessonUrl, renderSidebar, renderHomeTracks };
})();
