let previewCanvas;
let controlsEl;
let textListEl;
let imageSlotsEl;
let assetBadgeEl;
let statusEl;
let toastEl;
let onChangeCallback = () => {};

let dragState = null;
let estimateTimer = null;
let previewZoom = 1;

const PREVIEW_ZOOM_MIN = 0.25;
const PREVIEW_ZOOM_MAX = 5;
const PREVIEW_ZOOM_STEP = 0.25;

const FONT_OPTIONS = [
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Verdana, sans-serif',
  'Trebuchet MS, sans-serif',
  'Impact, sans-serif',
  'Courier New, monospace',
];

function initUI(elements, onChange) {
  previewCanvas = elements.previewCanvas;
  controlsEl = elements.controlsEl;
  textListEl = elements.textListEl;
  imageSlotsEl = elements.imageSlotsEl;
  assetBadgeEl = elements.assetBadgeEl;
  statusEl = elements.statusEl;
  toastEl = elements.toastEl;
  onChangeCallback = onChange;

  bindStaticControls();
  bindCanvasDrag();
  bindPreviewResizeObserver();
  renderAllControls();
}

function triggerChange() {
  onChangeCallback();
  scheduleEstimate();
}

function scheduleEstimate() {
  clearTimeout(estimateTimer);
  estimateTimer = setTimeout(updateStatusEstimate, 400);
}

async function updateStatusEstimate() {
  const state = getState();
  const asset = getAsset();
  const { width: wMm, height: hMm } = asset.physicalMm;
  try {
    const est = await estimateExportSize(state, renderPoster);
    statusEl.textContent = `${wMm}×${hMm} mm · ${asset.dpi} DPI · ${asset.width}×${asset.height} px · est. ${formatBytes(est.size)} (${est.format})`;
  } catch {
    statusEl.textContent = `${wMm}×${hMm} mm · ${asset.dpi} DPI · ${asset.width}×${asset.height} px`;
  }
}

function showToast(message, isWarning = false) {
  toastEl.textContent = message;
  toastEl.classList.toggle('warning', isWarning);
  toastEl.classList.add('visible');
  setTimeout(() => toastEl.classList.remove('visible'), 4000);
}

function normalizeHexColor(value) {
  let hex = value.trim();
  if (!hex.startsWith('#')) hex = `#${hex}`;
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex.toLowerCase();
  return null;
}

function setBackgroundColor(hex) {
  updateBackground({ color: hex });
  document.getElementById('bg-color').value = hex;
  document.getElementById('bg-color-hex').value = hex;
  triggerChange();
}

function setTextColor(id, hex) {
  updateTextLayer(id, { color: hex });
  const picker = document.querySelector(`[data-text-color="${id}"]`);
  const hexInput = document.querySelector(`[data-text-color-hex="${id}"]`);
  if (picker) picker.value = hex;
  if (hexInput) hexInput.value = hex;
  triggerChange();
}

function isPosterMode() {
  return !isBusinessCardMode();
}

function getCanvasWrap() {
  return document.getElementById('canvas-wrap');
}

function clampPreviewZoom(value) {
  return Math.min(PREVIEW_ZOOM_MAX, Math.max(PREVIEW_ZOOM_MIN, value));
}

function setPreviewZoom(value, options = {}) {
  const { reset = false } = options;
  if (reset) {
    previewZoom = 1;
  } else {
    previewZoom = clampPreviewZoom(value);
  }
  scalePreviewCanvas();
  updateZoomUi();
}

function getWrapContentSize(wrap) {
  const style = getComputedStyle(wrap);
  const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  return {
    width: Math.max(0, wrap.clientWidth - padX - 8),
    height: Math.max(0, wrap.clientHeight - padY - 8),
  };
}

function computeFitScale() {
  const asset = getAsset();
  const wrap = getCanvasWrap();
  if (!wrap) return 1;

  const { width: maxW, height: maxH } = getWrapContentSize(wrap);
  let availH = maxH;

  if (isBusinessCardMode()) {
    const labels = document.getElementById('card-preview-labels');
    if (labels && !labels.hidden) {
      availH -= labels.offsetHeight + 8;
    }
  }

  if (maxW <= 0 || availH <= 0) return 1;
  return Math.min(maxW / asset.width, availH / asset.height);
}

function updateZoomUi() {
  const zoomBar = document.getElementById('preview-zoom');
  if (!zoomBar) return;

  const show = isPosterMode();
  zoomBar.hidden = !show;
  zoomBar.style.display = show ? 'flex' : 'none';

  const levelEl = document.getElementById('zoom-level');
  const zoomOutBtn = document.getElementById('zoom-out');
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomSlider = document.getElementById('zoom-slider');

  if (levelEl) {
    levelEl.textContent = `${Math.round(previewZoom * 100)}%`;
  }
  if (zoomSlider) {
    zoomSlider.value = String(Math.round(previewZoom * 100));
  }
  if (zoomOutBtn) {
    zoomOutBtn.disabled = previewZoom <= PREVIEW_ZOOM_MIN;
  }
  if (zoomInBtn) {
    zoomInBtn.disabled = previewZoom >= PREVIEW_ZOOM_MAX;
  }
}

function isBusinessCardMode() {
  return getState().assetType === 'business-card';
}

function setCardPageUiVisible(visible) {
  const tabs = document.getElementById('page-tabs');
  const row = document.getElementById('card-preview-labels');
  const frontLabel = document.getElementById('card-label-front');
  const backLabel = document.getElementById('card-label-back');

  if (tabs) {
    tabs.hidden = !visible;
    tabs.style.display = visible ? 'flex' : 'none';
  }
  if (row) {
    row.hidden = !visible;
    row.style.display = visible ? 'flex' : 'none';
  }
  if (!visible && frontLabel && backLabel) {
    frontLabel.classList.remove('active');
    backLabel.classList.remove('active');
  }
}

function updatePageTabs() {
  const isCard = isBusinessCardMode();
  setCardPageUiVisible(isCard);

  if (isCard) {
    const active = getActivePageKey();
    document.getElementById('page-tab-front').classList.toggle('active', active === 'front');
    document.getElementById('page-tab-back').classList.toggle('active', active === 'back');
    updateCardPreviewLabels();
  }
}

function updateCardPreviewLabels() {
  const row = document.getElementById('card-preview-labels');
  const frontLabel = document.getElementById('card-label-front');
  const backLabel = document.getElementById('card-label-back');
  const gapSpacer = document.getElementById('card-label-gap');
  if (!row || !frontLabel || !backLabel || !gapSpacer) return;

  if (!isBusinessCardMode()) {
    setCardPageUiVisible(false);
    return;
  }

  const asset = getAsset();
  row.hidden = false;
  row.style.display = 'flex';
  const displayW = previewCanvas.offsetWidth;
  const scale = displayW / asset.width;
  const frontW = asset.sideWidth * scale;
  const gapW = asset.gapPx * scale;
  const backW = asset.sideWidth * scale;

  row.style.width = `${displayW}px`;
  frontLabel.style.width = `${frontW}px`;
  gapSpacer.style.width = `${gapW}px`;
  backLabel.style.width = `${backW}px`;

  const active = getActivePageKey();
  frontLabel.classList.toggle('active', active === 'front');
  backLabel.classList.toggle('active', active === 'back');
}

function switchToCardPage(pageKey) {
  setActivePage(pageKey);
  updatePageTabs();
  renderBackgroundControls();
  renderImageControls();
  renderTextControls();
  triggerChange();
}

function bindStaticControls() {
  document.getElementById('asset-type').addEventListener('change', (e) => {
    migrateAssetType(e.target.value);
    setCardPageUiVisible(e.target.value === 'business-card');
    if (e.target.value !== 'business-card') {
      setPreviewZoom(1, { reset: true });
    }
    renderAllControls();
    triggerChange();
  });

  document.getElementById('zoom-in').addEventListener('click', () => {
    setPreviewZoom(previewZoom + PREVIEW_ZOOM_STEP);
  });

  document.getElementById('zoom-out').addEventListener('click', () => {
    setPreviewZoom(previewZoom - PREVIEW_ZOOM_STEP);
  });

  document.getElementById('zoom-fit').addEventListener('click', () => {
    setPreviewZoom(1, { reset: true });
  });

  document.getElementById('zoom-slider').addEventListener('input', (e) => {
    setPreviewZoom(Number(e.target.value) / 100);
  });

  const canvasWrap = getCanvasWrap();
  if (canvasWrap) {
    canvasWrap.addEventListener(
      'wheel',
      (e) => {
        if (!isPosterMode()) return;
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? -PREVIEW_ZOOM_STEP : PREVIEW_ZOOM_STEP;
        setPreviewZoom(previewZoom + delta);
      },
      { passive: false }
    );
  }

  document.getElementById('page-tab-front').addEventListener('click', () => {
    switchToCardPage('front');
  });

  document.getElementById('page-tab-back').addEventListener('click', () => {
    switchToCardPage('back');
  });

  document.getElementById('card-label-front').addEventListener('click', () => {
    switchToCardPage('front');
  });

  document.getElementById('card-label-back').addEventListener('click', () => {
    switchToCardPage('back');
  });

  document.getElementById('bg-mode-color').addEventListener('change', () => {
    updateBackground({ mode: 'color' });
    renderBackgroundControls();
    triggerChange();
  });
  document.getElementById('bg-mode-image').addEventListener('change', () => {
    updateBackground({ mode: 'image' });
    renderBackgroundControls();
    triggerChange();
  });

  document.getElementById('bg-color').addEventListener('input', (e) => {
    setBackgroundColor(e.target.value.toLowerCase());
  });

  document.getElementById('bg-color-hex').addEventListener('input', (e) => {
    const hex = normalizeHexColor(e.target.value);
    if (hex) setBackgroundColor(hex);
  });

  document.getElementById('bg-color-hex').addEventListener('blur', (e) => {
    const hex = normalizeHexColor(e.target.value) || getActivePage().background.color;
    e.target.value = hex;
    document.getElementById('bg-color').value = hex;
  });

  document.getElementById('bg-blur').addEventListener('input', (e) => {
    updateBackground({ blur: Number(e.target.value) });
    document.getElementById('bg-blur-val').textContent = `${e.target.value}%`;
    triggerChange();
  });

  document.getElementById('bg-image-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const loaded = await loadImageFromFile(file);
    updateBackground({ src: loaded.src, image: loaded.image, mode: 'image' });
    document.getElementById('bg-mode-image').checked = true;
    renderBackgroundControls();
    triggerChange();
  });

  document.getElementById('add-text').addEventListener('click', () => {
    addTextLayer();
    renderTextControls();
    triggerChange();
  });

  document.getElementById('add-image').addEventListener('click', () => {
    addImageSlot();
    renderImageControls();
    triggerChange();
  });

  document.getElementById('export-format').addEventListener('change', (e) => {
    setState({ exportFormat: e.target.value });
    scheduleEstimate();
  });

  document.getElementById('export-btn').addEventListener('click', async () => {
    const btn = document.getElementById('export-btn');
    btn.disabled = true;
    btn.textContent = 'Exporting…';
    try {
      const result = await exportPoster(getState(), renderPoster);
      downloadBlob(result.blob, result.filename);
      const asset = getAsset();
      showToast(
        `Exported: ${asset.label} ${result.format} · ${formatBytes(result.size)}`,
        !!result.warning
      );
      if (result.warning) setTimeout(() => showToast(result.warning, true), 500);
    } catch (err) {
      showToast(err.message || 'Export failed. Please try again.', true);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Download';
    }
  });
}

function renderAllControls() {
  const state = getState();
  const asset = getAsset();

  document.getElementById('asset-type').value = state.assetType;
  assetBadgeEl.textContent = formatAssetBadge(asset);
  document.getElementById('export-format').value = state.exportFormat;

  updatePageTabs();
  const hintEl = document.getElementById('preview-hint');
  if (hintEl) {
    if (isBusinessCardMode()) {
      hintEl.textContent =
        'Drag to move. Select an image and drag corner handles to resize. Business card: use Front/Back labels or click a side to edit it.';
    } else {
      hintEl.textContent =
        'Drag to move. Select an image and drag corner handles to resize. Use +/−, the slider, or Ctrl+scroll to zoom.';
    }
  }
  updateZoomUi();
  renderBackgroundControls();
  renderImageControls();
  renderTextControls();
  updateStatusEstimate();
}

function renderBackgroundControls() {
  const bg = getActivePage().background;
  document.getElementById(`bg-mode-${bg.mode}`).checked = true;
  document.getElementById('bg-color').value = bg.color;
  document.getElementById('bg-color-hex').value = bg.color;
  document.getElementById('bg-blur').value = bg.blur;
  document.getElementById('bg-blur-val').textContent = `${bg.blur}%`;
  document.getElementById('bg-color-wrap').style.display = bg.mode === 'color' ? 'block' : 'none';
  document.getElementById('bg-image-wrap').style.display = bg.mode === 'image' ? 'block' : 'none';
}

function renderImageControls() {
  imageSlotsEl.innerHTML = '';
  const state = getState();
  const pageKey = getActivePageKey();
  const images = getActivePage().images;

  images.forEach((slot, index) => {
    const card = document.createElement('div');
    card.className = `card${state.selected?.type === 'image' && state.selected.index === index && state.selected.page === pageKey ? ' selected' : ''}`;
    card.innerHTML = `
      <div class="card-header">
        <h3>Image ${index + 1}</h3>
        <div class="card-header-actions">
          <label class="toggle">
            <input type="checkbox" data-img-visible="${index}" ${slot.visible ? 'checked' : ''} />
            Show
          </label>
          ${images.length > 1 ? `<button type="button" class="btn-small danger" data-img-remove="${index}">Remove</button>` : ''}
        </div>
      </div>
      <label class="file-btn">
        Upload image
        <input type="file" accept="image/*" data-img-upload="${index}" hidden />
      </label>
      <label>Rounded corners <span data-img-radius-val="${index}">${slot.borderRadius}px</span>
        <input type="range" data-img-radius="${index}" min="0" max="100" value="${slot.borderRadius}" />
      </label>
      <label class="toggle">
        <input type="checkbox" data-img-lock="${index}" ${slot.lockAspect ? 'checked' : ''} />
        Lock aspect ratio
      </label>
    `;
    imageSlotsEl.appendChild(card);
  });

  imageSlotsEl.querySelectorAll('[data-img-upload]').forEach((input) => {
    input.addEventListener('change', async (e) => {
      const index = Number(e.target.dataset.imgUpload);
      const file = e.target.files[0];
      if (!file) return;
      const loaded = await loadImageFromFile(file);
      const ratio = loaded.naturalHeight / loaded.naturalWidth;
      updateImageSlot(index, {
        src: loaded.src,
        image: loaded.image,
        naturalWidth: loaded.naturalWidth,
        naturalHeight: loaded.naturalHeight,
        visible: true,
        height: Math.round(getActivePage().images[index].width * ratio),
      });
      setState({ selected: { type: 'image', index, page: getActivePageKey() } });
      renderImageControls();
      triggerChange();
    });
  });

  imageSlotsEl.querySelectorAll('[data-img-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeImageSlot(Number(btn.dataset.imgRemove));
      renderImageControls();
      triggerChange();
    });
  });

  bindImageInputs();
}

function bindImageInputs() {
  const bind = (selector, handler) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.addEventListener('input', handler);
      el.addEventListener('change', handler);
    });
  };

  bind('[data-img-visible]', (e) => {
    const index = Number(e.target.dataset.imgVisible);
    updateImageSlot(index, { visible: e.target.checked });
    triggerChange();
  });

  bind('[data-img-radius]', (e) => {
    const index = Number(e.target.dataset.imgRadius);
    const val = Number(e.target.value);
    updateImageSlot(index, { borderRadius: val });
    const label = document.querySelector(`[data-img-radius-val="${index}"]`);
    if (label) label.textContent = `${val}px`;
    triggerChange();
  });

  bind('[data-img-lock]', (e) => {
    updateImageSlot(Number(e.target.dataset.imgLock), { lockAspect: e.target.checked });
  });
}

function renderTextControls() {
  textListEl.innerHTML = '';
  const state = getState();
  const pageKey = getActivePageKey();
  const texts = getActivePage().texts;

  texts.forEach((text) => {
    const card = document.createElement('div');
    card.className = `card${state.selected?.type === 'text' && state.selected.id === text.id && state.selected.page === pageKey ? ' selected' : ''}`;
    card.innerHTML = `
      <div class="card-header">
        <h3>Text ${text.id}</h3>
        ${texts.length > 1 ? `<button type="button" class="btn-small danger" data-text-remove="${text.id}">Remove</button>` : ''}
      </div>
      <label>Content
        <textarea rows="2" data-text-content="${text.id}">${text.content}</textarea>
      </label>
      <div class="grid-2">
        <label>Max width <input type="number" data-text-maxw="${text.id}" value="${text.maxWidth}" min="50" /></label>
        <label>Font size <input type="number" data-text-size="${text.id}" value="${text.fontSize}" min="8" max="300" /></label>
      </div>
      <label>Font
        <select data-text-font="${text.id}">
          ${FONT_OPTIONS.map((f) => `<option value="${f}" ${text.fontFamily === f ? 'selected' : ''}>${f.split(',')[0]}</option>`).join('')}
        </select>
      </label>
      <label>Color</label>
      <div class="color-hex-row">
        <input type="color" data-text-color="${text.id}" value="${text.color}" />
        <input type="text" class="hex-input" data-text-color-hex="${text.id}" value="${text.color}" spellcheck="false" maxlength="7" />
      </div>
      <label>Align
        <select data-text-align="${text.id}">
          <option value="left" ${text.align === 'left' ? 'selected' : ''}>Left</option>
          <option value="center" ${text.align === 'center' ? 'selected' : ''}>Center</option>
          <option value="right" ${text.align === 'right' ? 'selected' : ''}>Right</option>
        </select>
      </label>
      <div class="inline-toggles">
        <label class="toggle"><input type="checkbox" data-text-bold="${text.id}" ${text.bold ? 'checked' : ''} /> Bold</label>
        <label class="toggle"><input type="checkbox" data-text-italic="${text.id}" ${text.italic ? 'checked' : ''} /> Italic</label>
      </div>
    `;
    textListEl.appendChild(card);
  });

  textListEl.querySelectorAll('[data-text-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeTextLayer(Number(btn.dataset.textRemove));
      renderTextControls();
      triggerChange();
    });
  });

  bindTextInputs();
}

function bindTextInputs() {
  document.querySelectorAll('[data-text-content]').forEach((el) => {
    el.addEventListener('input', () => {
      updateTextLayer(Number(el.dataset.textContent), { content: el.value });
      triggerChange();
    });
  });

  document.querySelectorAll('[data-text-maxw]').forEach((el) => {
    el.addEventListener('input', () => {
      updateTextLayer(Number(el.dataset.textMaxw), { maxWidth: Number(el.value) });
      triggerChange();
    });
  });

  document.querySelectorAll('[data-text-size]').forEach((el) => {
    el.addEventListener('input', () => {
      updateTextLayer(Number(el.dataset.textSize), { fontSize: Number(el.value) });
      triggerChange();
    });
  });

  document.querySelectorAll('[data-text-font]').forEach((el) => {
    el.addEventListener('change', () => {
      updateTextLayer(Number(el.dataset.textFont), { fontFamily: el.value });
      triggerChange();
    });
  });

  document.querySelectorAll('[data-text-color]').forEach((el) => {
    const id = Number(el.dataset.textColor);
    el.addEventListener('input', () => {
      setTextColor(id, el.value.toLowerCase());
    });
  });

  document.querySelectorAll('[data-text-color-hex]').forEach((el) => {
    const id = Number(el.dataset.textColorHex);
    el.addEventListener('input', () => {
      const hex = normalizeHexColor(el.value);
      if (hex) setTextColor(id, hex);
    });
    el.addEventListener('blur', () => {
      const text = getActivePage().texts.find((t) => t.id === id);
      const hex = normalizeHexColor(el.value) || text.color;
      el.value = hex;
      const picker = document.querySelector(`[data-text-color="${id}"]`);
      if (picker) picker.value = hex;
    });
  });

  document.querySelectorAll('[data-text-align]').forEach((el) => {
    el.addEventListener('change', () => {
      updateTextLayer(Number(el.dataset.textAlign), { align: el.value });
      triggerChange();
    });
  });

  document.querySelectorAll('[data-text-bold]').forEach((el) => {
    el.addEventListener('change', () => {
      updateTextLayer(Number(el.dataset.textBold), { bold: el.checked });
      triggerChange();
    });
  });

  document.querySelectorAll('[data-text-italic]').forEach((el) => {
    el.addEventListener('change', () => {
      updateTextLayer(Number(el.dataset.textItalic), { italic: el.checked });
      triggerChange();
    });
  });
}

function getPageBoundsForDrag(pageKey) {
  const asset = getAsset();
  if (isBusinessCardMode()) {
    return { width: asset.sideWidth, height: asset.sideHeight };
  }
  return { width: asset.width, height: asset.height };
}

function applyImageResize(handle, start, mouseX, mouseY, lockAspect, naturalW, naturalH, pageWidth, pageHeight) {
  const min = 20;
  const right = start.x + start.width;
  const bottom = start.y + start.height;
  let x = start.x;
  let y = start.y;
  let width = start.width;
  let height = start.height;

  switch (handle) {
    case 'se':
      width = Math.max(min, mouseX - start.x);
      height = Math.max(min, mouseY - start.y);
      break;
    case 'sw':
      width = Math.max(min, right - mouseX);
      x = right - width;
      height = Math.max(min, mouseY - start.y);
      break;
    case 'ne':
      width = Math.max(min, mouseX - start.x);
      height = Math.max(min, bottom - mouseY);
      y = bottom - height;
      break;
    case 'nw':
      width = Math.max(min, right - mouseX);
      x = right - width;
      height = Math.max(min, bottom - mouseY);
      y = bottom - height;
      break;
    default:
      break;
  }

  if (lockAspect && naturalW && naturalH) {
    const ratio = naturalH / naturalW;
    height = Math.max(min, Math.round(width * ratio));
    if (handle === 'sw' || handle === 'nw') x = right - width;
    if (handle === 'ne' || handle === 'nw') y = bottom - height;
  }

  return clampToPageBounds({ x, y, width, height }, pageWidth, pageHeight);
}

function ensureActivePageForHit(hit) {
  if (!hit?.page) return;
  const asset = getAsset();
  if (isBusinessCardMode() && getActivePageKey() !== hit.page) {
    setActivePage(hit.page);
    updatePageTabs();
    renderBackgroundControls();
    renderImageControls();
    renderTextControls();
  }
}

function bindCanvasDrag() {
  previewCanvas.addEventListener('mousedown', (e) => {
    const pos = canvasToLogical(previewCanvas, e.clientX, e.clientY);
    const hit = hitTest(getState(), pos.x, pos.y);

    if (!hit) {
      const resolved = resolveCanvasToPage(getState(), pos.x, pos.y);
      if (!resolved.inGap && isBusinessCardMode() && getActivePageKey() !== resolved.pageKey) {
        setActivePage(resolved.pageKey);
        updatePageTabs();
        renderBackgroundControls();
        renderImageControls();
        renderTextControls();
      }
      setState({ selected: null });
      renderImageControls();
      renderTextControls();
      triggerChange();
      return;
    }

    ensureActivePageForHit(hit);

    setState({
      selected:
        hit.type === 'image'
          ? { type: 'image', index: hit.index, page: hit.page }
          : { type: 'text', id: hit.id, page: hit.page },
    });
    const pageState = getPageState(hit.page);
    const bounds = getPageBoundsForDrag(hit.page);

    if (hit.type === 'image' && hit.handle) {
      const slot = pageState.images[hit.index];
      dragState = {
        mode: 'resize',
        hit,
        handle: hit.handle,
        startSlot: { x: slot.x, y: slot.y, width: slot.width, height: slot.height },
        mouseX: hit.localX,
        mouseY: hit.localY,
        pageKey: hit.page,
        pageWidth: bounds.width,
        pageHeight: bounds.height,
      };
    } else if (hit.type === 'image') {
      const slot = pageState.images[hit.index];
      dragState = {
        mode: 'move',
        hit,
        startX: slot.x,
        startY: slot.y,
        mouseX: hit.localX,
        mouseY: hit.localY,
        pageKey: hit.page,
        pageWidth: bounds.width,
        pageHeight: bounds.height,
      };
    } else {
      const text = pageState.texts.find((t) => t.id === hit.id);
      dragState = {
        mode: 'move',
        hit,
        startX: text.x,
        startY: text.y,
        mouseX: hit.localX,
        mouseY: hit.localY,
        pageKey: hit.page,
        pageWidth: bounds.width,
        pageHeight: bounds.height,
      };
    }

    renderImageControls();
    renderTextControls();
    triggerChange();
  });

  previewCanvas.addEventListener('mousemove', (e) => {
    if (dragState) return;
    const pos = canvasToLogical(previewCanvas, e.clientX, e.clientY);
    const hit = hitTest(getState(), pos.x, pos.y);
    if (hit?.type === 'image' && hit.handle) {
      previewCanvas.style.cursor = getResizeCursor(hit.handle);
    } else if (hit) {
      previewCanvas.style.cursor = 'grab';
    } else {
      previewCanvas.style.cursor = 'default';
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragState) return;
    const pos = canvasToLogical(previewCanvas, e.clientX, e.clientY);
    const asset = getAsset();
    const layout = getPageLayout(asset).find((p) => p.pageKey === dragState.pageKey);
    const localX = pos.x - layout.offsetX;
    const localY = pos.y - layout.offsetY;

    if (dragState.pageKey !== getActivePageKey()) {
      setActivePage(dragState.pageKey);
      updatePageTabs();
    }

    if (dragState.mode === 'resize' && dragState.hit.type === 'image') {
      const slot = getActivePage().images[dragState.hit.index];
      const next = applyImageResize(
        dragState.handle,
        dragState.startSlot,
        localX,
        localY,
        slot.lockAspect,
        slot.naturalWidth,
        slot.naturalHeight,
        dragState.pageWidth,
        dragState.pageHeight
      );
      updateImageSlot(dragState.hit.index, next);
    } else if (dragState.hit.type === 'image') {
      const dx = localX - dragState.mouseX;
      const dy = localY - dragState.mouseY;
      const slot = getActivePage().images[dragState.hit.index];
      const next = clampToPageBounds(
        {
          x: Math.round(dragState.startX + dx),
          y: Math.round(dragState.startY + dy),
          width: slot.width,
          height: slot.height,
        },
        dragState.pageWidth,
        dragState.pageHeight
      );
      updateImageSlot(dragState.hit.index, { x: next.x, y: next.y });
    } else {
      const dx = localX - dragState.mouseX;
      const dy = localY - dragState.mouseY;
      updateTextLayer(dragState.hit.id, {
        x: Math.round(dragState.startX + dx),
        y: Math.round(dragState.startY + dy),
      });
    }

    triggerChange();
  });

  window.addEventListener('mouseup', () => {
    dragState = null;
    previewCanvas.style.cursor = 'grab';
  });
}

function scalePreviewCanvas() {
  const asset = getAsset();
  const fitScale = computeFitScale();
  const scale = isPosterMode() ? fitScale * previewZoom : Math.min(fitScale, 1);
  const displayW = Math.floor(asset.width * scale);
  const displayH = Math.floor(asset.height * scale);

  previewCanvas.style.width = `${displayW}px`;
  previewCanvas.style.height = `${displayH}px`;

  updateCardPreviewLabels();
  updateZoomUi();
}

function bindPreviewResizeObserver() {
  const wrap = getCanvasWrap();
  if (!wrap || wrap.dataset.resizeObserved) return;

  const observer = new ResizeObserver(() => {
    scalePreviewCanvas();
  });
  observer.observe(wrap);
  wrap.dataset.resizeObserved = '1';
}

function refreshPreview() {
  renderPoster(previewCanvas, getState());
  requestAnimationFrame(() => {
    scalePreviewCanvas();
  });
}
