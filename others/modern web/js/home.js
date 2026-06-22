document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("tracks-container");
  try {
    await I18n.init();
    I18n.bindLangToggle();
    I18n.applyPageUi();
    await renderHome();
  } catch (err) {
    container.innerHTML = `<p class="error-msg">Could not load Modern Web modules. Run a local server from the project folder.<br>${err.message}</p>`;
  }
});

async function renderHome() {
  const container = document.getElementById("tracks-container");
  const index = await ContentAPI.loadIndex();
  Router.renderHomeTracks(container, index);
}

window.addEventListener("langchange", async () => {
  ContentAPI.clearModuleCache();
  I18n.clearBmCache();
  await I18n.loadModulesMetaBm();
  I18n.applyPageUi();
  await renderHome();
});
