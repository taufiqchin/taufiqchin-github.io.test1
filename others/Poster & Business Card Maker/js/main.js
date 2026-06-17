function main() {
  const previewCanvas = document.getElementById('preview-canvas');

  initUI(
    {
      previewCanvas,
      controlsEl: document.getElementById('controls'),
      textListEl: document.getElementById('text-list'),
      imageSlotsEl: document.getElementById('image-slots'),
      assetBadgeEl: document.getElementById('asset-badge'),
      statusEl: document.getElementById('status-line'),
      toastEl: document.getElementById('toast'),
    },
    () => refreshPreview()
  );

  refreshPreview();

  window.addEventListener('resize', () => {
    requestAnimationFrame(() => {
      scalePreviewCanvas();
    });
  });
}

document.addEventListener('DOMContentLoaded', main);
