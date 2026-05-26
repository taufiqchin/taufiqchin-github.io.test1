document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("tracks-container");
  try {
    const index = await ContentAPI.loadIndex();
    Router.renderHomeTracks(container, index);
  } catch (err) {
    container.innerHTML = `<p class="error-msg">Could not load lessons. Run a local server from the project folder.<br>${err.message}</p>`;
  }
});
