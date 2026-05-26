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
        <div class="nav-track-title">${track.title}</div>
        ${track.modules
          .map(
            (m) => `
          <a class="nav-link${m.id === activeId ? " active" : ""}" href="${lessonUrl(m.id)}">${m.title}</a>
        `
          )
          .join("")}
      </div>
    `
      )
      .join("");
  }

  function renderHomeTracks(container, index) {
    const tracks = ContentAPI.modulesByTrack(index);
    container.innerHTML = tracks
      .map((track) => {
        const badgeClass = `track-badge--${track.id}`;
        return `
        <section class="track-section" id="track-${track.id}">
          <h3><span class="track-badge ${badgeClass}">${track.id}</span> ${track.title}</h3>
          <div class="module-grid">
            ${track.modules
              .map(
                (m) => `
              <a class="module-card" href="${lessonUrl(m.id)}">
                <h4>${m.title}</h4>
                <p>Lesson ${m.order}</p>
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
