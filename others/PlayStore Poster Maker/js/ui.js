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
  try {
    const est = await estimateExportSize(state, renderPoster);
    statusEl.textContent = `${asset.width}×${asset.height} · max ${asset.maxLabel} · est. ${formatBytes(est.size)} (${est.format})`;
  } catch {
    statusEl.textContent = `${asset.width}×${asset.height} · max ${asset.maxLabel}`;
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

function bindStaticControls() {
  document.getElementById('asset-type').addEventListener('change', (e) => {
    setState({ assetType: e.target.value });
    renderAllControls();
    triggerChange();
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
    const hex = normalizeHexColor(e.target.value) || getState().background.color;
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

  document.getElementById('show-safe-zone').addEventListener('change', (e) => {
    setState({ showSafeZone: e.target.checked });
    triggerChange();
  });

  document.getElementById('add-text').addEventListener('click', () => {
    addTextLayer();
    renderTextControls();
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
        `Exported: ${asset.width}×${asset.height} ${result.format} · ${formatBytes(result.size)}`,
        !!result.warning
      );
      if (result.warning) setTimeout(() => showToast(result.warning, true), 500);
    } catch (err) {
      showToast('Export failed. Please try again.', true);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Download Poster';
    }
  });
}

function renderAllControls() {
  const state = getState();
  const asset = getAsset();

  document.getElementById('asset-type').value = state.assetType;
  assetBadgeEl.textContent = formatAssetBadge(asset);
  const promoEl = document.getElementById('asset-promo');
  if (promoEl) {
    promoEl.textContent = formatAssetPromotion(asset);
    promoEl.style.display = asset.promotionNote ? 'block' : 'none';
  }

  const safeZoneWrap = document.getElementById('safe-zone-wrap');
  safeZoneWrap.style.display = state.assetType === 'feature-graphic' ? 'block' : 'none';
  document.getElementById('show-safe-zone').checked = state.showSafeZone;
  document.getElementById('export-format').value = state.exportFormat;

  renderBackgroundControls();
  renderImageControls();
  renderTextControls();
  updateStatusEstimate();
}

function renderBackgroundControls() {
  const bg = getState().background;
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
  getState().images.forEach((slot, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-header">
        <h3>Image ${index + 1}</h3>
        <label class="toggle">
          <input type="checkbox" data-img-visible="${index}" ${slot.visible ? 'checked' : ''} />
          Show
        </label>
      </div>
      <label class="file-btn">
        Upload image
        <input type="file" accept="image/*" data-img-upload="${index}" hidden />
      </label>
      <div class="grid-2">
        <label>X <input type="number" data-img-x="${index}" value="${slot.x}" min="0" /></label>
        <label>Y <input type="number" data-img-y="${index}" value="${slot.y}" min="0" /></label>
        <label>Width <input type="number" data-img-w="${index}" value="${slot.width}" min="10" /></label>
        <label>Height <input type="number" data-img-h="${index}" value="${slot.height}" min="10" /></label>
      </div>
      <label>Align H
        <select data-img-align-h="${index}">
          <option value="left" ${slot.alignH === 'left' ? 'selected' : ''}>Left</option>
          <option value="center" ${slot.alignH === 'center' ? 'selected' : ''}>Center</option>
          <option value="right" ${slot.alignH === 'right' ? 'selected' : ''}>Right</option>
        </select>
      </label>
      <label>Align V
        <select data-img-align-v="${index}">
          <option value="top" ${slot.alignV === 'top' ? 'selected' : ''}>Top</option>
          <option value="center" ${slot.alignV === 'center' ? 'selected' : ''}>Center</option>
          <option value="bottom" ${slot.alignV === 'bottom' ? 'selected' : ''}>Bottom</option>
        </select>
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
        height: Math.round(getState().images[index].width * ratio),
      });
      setState({ selected: { type: 'image', index } });
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

  bind('[data-img-x]', (e) => {
    const index = Number(e.target.dataset.imgX);
    updateImageSlot(index, { x: Number(e.target.value) });
    triggerChange();
  });

  bind('[data-img-y]', (e) => {
    const index = Number(e.target.dataset.imgY);
    updateImageSlot(index, { y: Number(e.target.value) });
    triggerChange();
  });

  bind('[data-img-w]', (e) => {
    const index = Number(e.target.dataset.imgW);
    const slot = getState().images[index];
    const width = Number(e.target.value);
    const updates = { width };
    if (slot.lockAspect && slot.naturalWidth) {
      updates.height = Math.round(width * (slot.naturalHeight / slot.naturalWidth));
      const hInput = document.querySelector(`[data-img-h="${index}"]`);
      if (hInput) hInput.value = updates.height;
    }
    updateImageSlot(index, updates);
    triggerChange();
  });

  bind('[data-img-h]', (e) => {
    const index = Number(e.target.dataset.imgH);
    const slot = getState().images[index];
    const height = Number(e.target.value);
    const updates = { height };
    if (slot.lockAspect && slot.naturalHeight) {
      updates.width = Math.round(height * (slot.naturalWidth / slot.naturalHeight));
      const wInput = document.querySelector(`[data-img-w="${index}"]`);
      if (wInput) wInput.value = updates.width;
    }
    updateImageSlot(index, updates);
    triggerChange();
  });

  bind('[data-img-align-h]', (e) => {
    updateImageSlot(Number(e.target.dataset.imgAlignH), { alignH: e.target.value });
    triggerChange();
  });

  bind('[data-img-align-v]', (e) => {
    updateImageSlot(Number(e.target.dataset.imgAlignV), { alignV: e.target.value });
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

  state.texts.forEach((text) => {
    const card = document.createElement('div');
    card.className = `card${state.selected?.type === 'text' && state.selected.id === text.id ? ' selected' : ''}`;
    card.innerHTML = `
      <div class="card-header">
        <h3>Text ${text.id}</h3>
        ${state.texts.length > 1 ? `<button type="button" class="btn-small danger" data-text-remove="${text.id}">Remove</button>` : ''}
      </div>
      <label>Content
        <textarea rows="2" data-text-content="${text.id}">${text.content}</textarea>
      </label>
      <div class="grid-2">
        <label>X <input type="number" data-text-x="${text.id}" value="${text.x}" min="0" /></label>
        <label>Y <input type="number" data-text-y="${text.id}" value="${text.y}" min="0" /></label>
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

  document.querySelectorAll('[data-text-x]').forEach((el) => {
    el.addEventListener('input', () => {
      updateTextLayer(Number(el.dataset.textX), { x: Number(el.value) });
      triggerChange();
    });
  });

  document.querySelectorAll('[data-text-y]').forEach((el) => {
    el.addEventListener('input', () => {
      updateTextLayer(Number(el.dataset.textY), { y: Number(el.value) });
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
      const text = getState().texts.find((t) => t.id === id);
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

function syncControlsFromDrag() {
  const state = getState();
  const sel = state.selected;
  if (!sel) return;

  if (sel.type === 'image') {
    const slot = state.images[sel.index];
    const xInput = document.querySelector(`[data-img-x="${sel.index}"]`);
    const yInput = document.querySelector(`[data-img-y="${sel.index}"]`);
    const wInput = document.querySelector(`[data-img-w="${sel.index}"]`);
    const hInput = document.querySelector(`[data-img-h="${sel.index}"]`);
    if (xInput) xInput.value = Math.round(slot.x);
    if (yInput) yInput.value = Math.round(slot.y);
    if (wInput) wInput.value = Math.round(slot.width);
    if (hInput) hInput.value = Math.round(slot.height);
  } else if (sel.type === 'text') {
    const text = state.texts.find((t) => t.id === sel.id);
    const xInput = document.querySelector(`[data-text-x="${sel.id}"]`);
    const yInput = document.querySelector(`[data-text-y="${sel.id}"]`);
    if (xInput) xInput.value = Math.round(text.x);
    if (yInput) yInput.value = Math.round(text.y);
  }
}

function applyImageResize(handle, start, mouseX, mouseY, lockAspect, naturalW, naturalH) {
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

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  };
}

function bindCanvasDrag() {
  previewCanvas.addEventListener('mousedown', (e) => {
    const pos = canvasToLogical(previewCanvas, e.clientX, e.clientY);
    const hit = hitTest(getState(), pos.x, pos.y);
    if (!hit) {
      setState({ selected: null });
      triggerChange();
      return;
    }

    setState({
      selected:
        hit.type === 'image' ? { type: 'image', index: hit.index } : { type: 'text', id: hit.id },
    });
    const state = getState();

    if (hit.type === 'image' && hit.handle) {
      const slot = state.images[hit.index];
      dragState = {
        mode: 'resize',
        hit,
        handle: hit.handle,
        startSlot: { x: slot.x, y: slot.y, width: slot.width, height: slot.height },
        mouseX: pos.x,
        mouseY: pos.y,
      };
    } else if (hit.type === 'image') {
      const slot = state.images[hit.index];
      dragState = {
        mode: 'move',
        hit,
        startX: slot.x,
        startY: slot.y,
        mouseX: pos.x,
        mouseY: pos.y,
      };
    } else {
      const text = state.texts.find((t) => t.id === hit.id);
      dragState = {
        mode: 'move',
        hit,
        startX: text.x,
        startY: text.y,
        mouseX: pos.x,
        mouseY: pos.y,
      };
    }

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

    if (dragState.mode === 'resize' && dragState.hit.type === 'image') {
      const slot = getState().images[dragState.hit.index];
      const next = applyImageResize(
        dragState.handle,
        dragState.startSlot,
        pos.x,
        pos.y,
        slot.lockAspect,
        slot.naturalWidth,
        slot.naturalHeight
      );
      updateImageSlot(dragState.hit.index, next);
    } else if (dragState.hit.type === 'image') {
      const dx = pos.x - dragState.mouseX;
      const dy = pos.y - dragState.mouseY;
      updateImageSlot(dragState.hit.index, {
        x: Math.round(dragState.startX + dx),
        y: Math.round(dragState.startY + dy),
      });
    } else {
      const dx = pos.x - dragState.mouseX;
      const dy = pos.y - dragState.mouseY;
      updateTextLayer(dragState.hit.id, {
        x: Math.round(dragState.startX + dx),
        y: Math.round(dragState.startY + dy),
      });
    }

    syncControlsFromDrag();
    triggerChange();
  });

  window.addEventListener('mouseup', () => {
    dragState = null;
    previewCanvas.style.cursor = 'grab';
  });
}

function scalePreviewCanvas() {
  const asset = getAsset();
  const wrap = previewCanvas.parentElement;
  const maxW = wrap.clientWidth - 32;
  const maxH = wrap.clientHeight - 32;
  const scale = Math.min(maxW / asset.width, maxH / asset.height, 1);
  previewCanvas.style.width = `${asset.width * scale}px`;
  previewCanvas.style.height = `${asset.height * scale}px`;
}

function refreshPreview() {
  renderPoster(previewCanvas, getState());
  scalePreviewCanvas();
}
