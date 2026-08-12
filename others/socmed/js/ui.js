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

const ASSET_GROUP_ORDER = ['Feed Posts', 'Stories', 'Other Feed', 'App Branding'];

const ASSET_ORDER_BY_GROUP = {
  'Feed Posts': ['instagram-feed'],
  Stories: ['instagram-story'],
  'Other Feed': ['facebook-feed-landscape', 'facebook-feed-portrait'],
  'App Branding': ['app-logo', 'profile-picture', 'facebook-cover'],
};

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

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeHexColor(value) {
  let hex = value.trim();
  if (!hex.startsWith('#')) hex = `#${hex}`;
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex.toLowerCase();
  return null;
}

function setBackgroundColor(hex) {
  updateBackground({ color: hex });
  const picker = document.getElementById('bg-color');
  const hexInput = document.getElementById('bg-color-hex');
  if (picker) picker.value = hex;
  if (hexInput) hexInput.value = hex;
  renderBackgroundPresets();
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
  document.getElementById('asset-type-list').addEventListener('change', (e) => {
    if (e.target.name !== 'asset-type') return;
    setState({ assetType: e.target.value });
    applyAssetLayout(e.target.value);
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
    const picker = document.getElementById('bg-color');
    if (picker) picker.value = hex;
    renderBackgroundPresets();
  });

  document.getElementById('bg-color-presets').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-bg-preset]');
    if (!btn) return;
    setBackgroundColor(btn.dataset.bgPreset);
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
        `Exported: ${asset.width}×${asset.height} ${result.format} · ${formatBytes(result.size)}`,
        !!result.warning
      );
      if (result.warning) setTimeout(() => showToast(result.warning, true), 500);
    } catch (err) {
      showToast('Export failed. Please try again.', true);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Download';
    }
  });
}

function renderAssetTypeControls() {
  const container = document.getElementById('asset-type-list');
  const state = getState();
  container.innerHTML = '';

  ASSET_GROUP_ORDER.forEach((groupName) => {
    const keys = ASSET_ORDER_BY_GROUP[groupName];
    if (!keys?.length) return;

    const groupEl = document.createElement('div');
    groupEl.className = 'asset-type-group';

    const groupLabel = document.createElement('p');
    groupLabel.className = 'asset-type-group-label';
    groupLabel.textContent = groupName;
    groupEl.appendChild(groupLabel);

    keys.forEach((key) => {
      const asset = ASSET_TYPES[key];
      if (!asset) return;

      const label = document.createElement('label');
      label.className = 'asset-type-option';
      label.innerHTML = `
        <input type="radio" name="asset-type" value="${key}" ${state.assetType === key ? 'checked' : ''} />
        <span class="asset-type-option-text">
          <strong>${asset.label}</strong>
          <span class="asset-type-size">${asset.width}×${asset.height}</span>
        </span>
      `;
      groupEl.appendChild(label);
    });

    container.appendChild(groupEl);
  });
}

function renderAllControls() {
  const state = getState();
  const asset = getAsset();

  renderAssetTypeControls();
  assetBadgeEl.textContent = formatAssetBadge(asset);
  const promoEl = document.getElementById('asset-promo');
  if (promoEl) {
    promoEl.textContent = formatAssetPromotion(asset);
    promoEl.style.display = asset.promotionNote ? 'block' : 'none';
  }

  document.getElementById('export-format').value = state.exportFormat;

  renderBackgroundControls();
  renderImageControls();
  renderTextControls();
  updateStatusEstimate();
}

function isPresetBackgroundColor(hex) {
  const normalized = hex.toLowerCase();
  return BG_COLOR_PRESETS.some((preset) => preset.color.toLowerCase() === normalized);
}

function renderBackgroundPresets() {
  const container = document.getElementById('bg-color-presets');
  if (!container) return;

  const current = getState().background.color.toLowerCase();
  container.innerHTML = BG_COLOR_PRESETS.map((preset) => {
    const hex = preset.color.toLowerCase();
    const active = current === hex ? ' is-active' : '';
    return `<button type="button" class="bg-color-swatch${active}" data-bg-preset="${hex}" title="${preset.label}" aria-label="${preset.label}" style="--swatch-color: ${hex}"></button>`;
  }).join('');

  const pickerWrap = document.getElementById('bg-color-picker-wrap');
  if (pickerWrap) {
    pickerWrap.classList.toggle('is-active', !isPresetBackgroundColor(current));
  }
}

function renderBackgroundControls() {
  const bg = getState().background;
  document.getElementById(`bg-mode-${bg.mode}`).checked = true;
  const picker = document.getElementById('bg-color');
  const hexInput = document.getElementById('bg-color-hex');
  if (picker) picker.value = bg.color;
  if (hexInput) hexInput.value = bg.color;
  document.getElementById('bg-blur').value = bg.blur;
  document.getElementById('bg-blur-val').textContent = `${bg.blur}%`;
  document.getElementById('bg-color-wrap').style.display = bg.mode === 'color' ? 'block' : 'none';
  document.getElementById('bg-image-wrap').style.display = bg.mode === 'image' ? 'block' : 'none';
  renderBackgroundPresets();
}

function isProfileMode() {
  return Boolean(getAsset().profileMode);
}

function renderImageControls() {
  imageSlotsEl.innerHTML = '';
  const state = getState();
  const profileMode = isProfileMode();

  state.images.forEach((slot, index) => {
    const isProfileSlot = profileMode && index === 0;
    const card = document.createElement('div');
    card.className = `card${state.selected?.type === 'image' && state.selected.index === index ? ' selected' : ''}`;
    card.innerHTML = `
      <div class="card-header">
        <h3>${isProfileSlot ? 'Profile photo' : `Image ${index + 1}`}</h3>
        <div class="card-header-actions">
          <label class="toggle">
            <input type="checkbox" data-img-visible="${index}" ${slot.visible ? 'checked' : ''} />
            Show
          </label>
          ${!isProfileSlot && state.images.length > 1 ? `<button type="button" class="btn-small danger" data-img-remove="${index}">Remove</button>` : ''}
        </div>
      </div>
      <label class="file-btn">
        Upload image
        <input type="file" accept="image/*" data-img-upload="${index}" hidden />
      </label>
      ${slot.fileName ? `<p class="image-file-name">${escapeHtml(slot.fileName)}</p>` : ''}
      ${isProfileSlot ? '<p class="asset-promo">Photo fits inside the circle on your background color.</p>' : `
      <label>Rounded corners <span data-img-radius-val="${index}">${slot.borderRadius}px</span>
        <input type="range" data-img-radius="${index}" min="0" max="100" value="${slot.borderRadius}" />
      </label>
      <label class="toggle">
        <input type="checkbox" data-img-lock="${index}" ${slot.lockAspect ? 'checked' : ''} />
        Lock aspect ratio
      </label>
      <label class="toggle">
        <input type="checkbox" data-img-fit="${index}" ${slot.fitMode ? 'checked' : ''} />
        Fit image (contain)
      </label>
      `}
    `;
    imageSlotsEl.appendChild(card);
  });

  imageSlotsEl.querySelectorAll('[data-img-upload]').forEach((input) => {
    input.addEventListener('change', async (e) => {
      const index = Number(e.target.dataset.imgUpload);
      const file = e.target.files[0];
      if (!file) return;
      const loaded = await loadImageFromFile(file);
      const asset = getAsset();

      if (asset.profileMode && index === 0) {
        const bounds = getProfileCircleBounds(asset.width, asset.height);
        updateImageSlot(index, {
          src: loaded.src,
          image: loaded.image,
          fileName: file.name,
          naturalWidth: loaded.naturalWidth,
          naturalHeight: loaded.naturalHeight,
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          borderRadius: Math.round(bounds.radius),
          fitMode: true,
          lockAspect: true,
          visible: true,
        });
      } else {
        const ratio = loaded.naturalHeight / loaded.naturalWidth;
        updateImageSlot(index, {
          src: loaded.src,
          image: loaded.image,
          fileName: file.name,
          naturalWidth: loaded.naturalWidth,
          naturalHeight: loaded.naturalHeight,
          visible: true,
          height: Math.round(getState().images[index].width * ratio),
        });
      }

      setState({ selected: { type: 'image', index } });
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

  bind('[data-img-fit]', (e) => {
    updateImageSlot(Number(e.target.dataset.imgFit), { fitMode: e.target.checked });
    triggerChange();
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

function applyImageResize(handle, start, mouseX, mouseY, lockAspect, naturalW, naturalH, rotation = 0) {
  const min = 20;
  if (!rotation) {
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

  const opposite = { nw: 'se', se: 'nw', ne: 'sw', sw: 'ne' };
  const opp = opposite[handle];
  const anchorLocal = {
    nw: { x: -start.width / 2, y: -start.height / 2 },
    ne: { x: start.width / 2, y: -start.height / 2 },
    se: { x: start.width / 2, y: start.height / 2 },
    sw: { x: -start.width / 2, y: start.height / 2 },
  }[opp];
  const startSlot = { ...start, rotation };
  const anchorWorld = transformLocalPoint(startSlot, anchorLocal.x, anchorLocal.y);
  const dragWorld = { x: mouseX, y: mouseY };
  const newCx = (anchorWorld.x + dragWorld.x) / 2;
  const newCy = (anchorWorld.y + dragWorld.y) / 2;

  const rad = -degToRad(rotation);
  const dx = dragWorld.x - anchorWorld.x;
  const dy = dragWorld.y - anchorWorld.y;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  let width = Math.max(min, Math.abs(dx * cos - dy * sin));
  let height = Math.max(min, Math.abs(dx * sin + dy * cos));

  if (lockAspect && naturalW && naturalH) {
    const ratio = naturalH / naturalW;
    if (width / height > naturalW / naturalH) width = height / ratio;
    else height = width * ratio;
  }

  return {
    x: Math.round(newCx - width / 2),
    y: Math.round(newCy - height / 2),
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
      renderImageControls();
      renderTextControls();
      triggerChange();
      return;
    }

    setState({
      selected:
        hit.type === 'image' ? { type: 'image', index: hit.index } : { type: 'text', id: hit.id },
    });
    const state = getState();

    if (hit.type === 'image' && hit.handle === 'rotate') {
      const slot = state.images[hit.index];
      dragState = {
        mode: 'rotate',
        hit,
        startRotation: slot.rotation || 0,
        startAngle: computeImageRotationAngle(slot, pos.x, pos.y),
      };
    } else if (hit.type === 'image' && hit.handle) {
      const slot = state.images[hit.index];
      dragState = {
        mode: 'resize',
        hit,
        handle: hit.handle,
        startSlot: { x: slot.x, y: slot.y, width: slot.width, height: slot.height },
        startRotation: slot.rotation || 0,
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

    if (dragState.mode === 'rotate' && dragState.hit.type === 'image') {
      const slot = getState().images[dragState.hit.index];
      const angle = computeImageRotationAngle(slot, pos.x, pos.y);
      updateImageSlot(dragState.hit.index, {
        rotation: dragState.startRotation + (angle - dragState.startAngle),
      });
      previewCanvas.style.cursor = 'grabbing';
    } else if (dragState.mode === 'resize' && dragState.hit.type === 'image') {
      const slot = getState().images[dragState.hit.index];
      const next = applyImageResize(
        dragState.handle,
        dragState.startSlot,
        pos.x,
        pos.y,
        slot.lockAspect,
        slot.naturalWidth,
        slot.naturalHeight,
        dragState.startRotation
      );
      const updates = { ...next };
      if (getAsset().profileMode && dragState.hit.index === 0) {
        updates.borderRadius = Math.round(Math.min(next.width, next.height) / 2);
        updates.fitMode = true;
        updates.lockAspect = true;
      }
      updateImageSlot(dragState.hit.index, updates);
    } else if (dragState.mode === 'move' && dragState.hit.type === 'image') {
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
  const panel = wrap.closest('.preview-panel');
  const wrapPadding = 32;

  const maxW = Math.max(wrap.clientWidth - wrapPadding, 100);

  let maxH = wrap.clientHeight - wrapPadding;
  if (panel) {
    const header = panel.querySelector('.preview-header');
    const hint = panel.querySelector('.hint');
    const panelStyles = getComputedStyle(panel);
    const panelPadY =
      parseFloat(panelStyles.paddingTop) + parseFloat(panelStyles.paddingBottom);
    const headerH = header?.offsetHeight ?? 0;
    const hintH = hint?.offsetHeight ?? 0;
    const viewportH = window.innerHeight;
    const panelTop = panel.getBoundingClientRect().top;
    maxH = viewportH - panelTop - headerH - hintH - panelPadY - wrapPadding - 16;
  }

  maxH = Math.max(maxH, 120);

  const scale = Math.min(maxW / asset.width, maxH / asset.height);
  if (!Number.isFinite(scale) || scale <= 0) return;

  previewCanvas.style.width = `${Math.round(asset.width * scale)}px`;
  previewCanvas.style.height = `${Math.round(asset.height * scale)}px`;
}

function refreshPreview() {
  renderPoster(previewCanvas, getState());
  scalePreviewCanvas();
}
