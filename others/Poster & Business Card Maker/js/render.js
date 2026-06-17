function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawBackground(ctx, pageState, w, h) {
  const bg = pageState.background;
  if (bg.mode === 'color' || !bg.image) {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  const img = bg.image;
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;

  if (imgRatio > canvasRatio) {
    sw = img.naturalHeight * canvasRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / canvasRatio;
    sy = (img.naturalHeight - sh) / 2;
  }

  const blurPx = (bg.blur / 100) * 40;

  if (blurPx > 0) {
    ctx.save();
    ctx.filter = `blur(${blurPx}px)`;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  }
}

function computeCoverCrop(img, boxW, boxH, alignH, alignV) {
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  const boxRatio = boxW / boxH;
  const imgRatio = imgW / imgH;

  let sw;
  let sh;
  if (imgRatio > boxRatio) {
    sh = imgH;
    sw = imgH * boxRatio;
  } else {
    sw = imgW;
    sh = imgW / boxRatio;
  }

  let sx = 0;
  let sy = 0;

  if (alignH === 'left') sx = 0;
  else if (alignH === 'right') sx = imgW - sw;
  else sx = (imgW - sw) / 2;

  if (alignV === 'top') sy = 0;
  else if (alignV === 'bottom') sy = imgH - sh;
  else sy = (imgH - sh) / 2;

  return { sx, sy, sw, sh };
}

function drawImageRounded(ctx, slot) {
  if (!slot.visible || !slot.image) return;

  const { x, y, width, height, borderRadius, alignH, alignV, image } = slot;
  const crop = computeCoverCrop(image, width, height, alignH, alignV);

  ctx.save();
  roundRectPath(ctx, x, y, width, height, borderRadius);
  ctx.clip();
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, x, y, width, height);
  ctx.restore();
}

function buildFontString(text) {
  const style = text.italic ? 'italic ' : '';
  const weight = text.bold ? 'bold ' : '';
  return `${style}${weight}${text.fontSize}px ${text.fontFamily}`;
}

function wrapTextLines(ctx, content, maxWidth) {
  const paragraphs = content.split('\n');
  const lines = [];

  for (const paragraph of paragraphs) {
    if (paragraph === '') {
      lines.push('');
      continue;
    }
    const words = paragraph.split(/\s+/);
    let current = '';

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  }

  return lines;
}

function getTextMetrics(ctx, text) {
  ctx.font = buildFontString(text);
  const lineHeight = text.fontSize * 1.2;
  const lines = wrapTextLines(ctx, text.content, text.maxWidth);
  const height = lines.length * lineHeight;
  return { lines, lineHeight, height, width: text.maxWidth };
}

function getAlignX(text) {
  if (text.align === 'center') return text.x + text.maxWidth / 2;
  if (text.align === 'right') return text.x + text.maxWidth;
  return text.x;
}

function drawTextLayer(ctx, text) {
  ctx.save();
  ctx.font = buildFontString(text);
  ctx.fillStyle = text.color;
  ctx.textAlign = text.align;
  ctx.textBaseline = 'top';

  const { lines, lineHeight } = getTextMetrics(ctx, text);
  const alignX = getAlignX(text);

  lines.forEach((line, i) => {
    ctx.fillText(line, alignX, text.y + i * lineHeight);
  });
  ctx.restore();
}

function renderPageState(ctx, pageState, offsetX, offsetY, w, h) {
  ctx.save();
  ctx.translate(offsetX, offsetY);
  drawBackground(ctx, pageState, w, h);
  pageState.images.forEach((slot) => drawImageRounded(ctx, slot));
  pageState.texts.forEach((text) => drawTextLayer(ctx, text));
  ctx.restore();
}

function drawCardGap(ctx, x, y, gapWidth, height) {
  ctx.save();
  ctx.fillStyle = '#e8e4df';
  ctx.fillRect(x, y, gapWidth, height);
  ctx.strokeStyle = 'rgba(107, 101, 96, 0.25)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  ctx.strokeRect(x + 0.5, y + 0.5, gapWidth - 1, height - 1);
  ctx.restore();
}

function drawActivePageOutline(ctx, offsetX, offsetY, w, h) {
  ctx.save();
  ctx.strokeStyle = 'rgba(91, 143, 199, 0.35)';
  ctx.lineWidth = 3;
  ctx.strokeRect(offsetX + 1, offsetY + 1, w - 2, h - 2);
  ctx.restore();
}

const HANDLE_SIZE = 14;

function getImageHandlePoints(slot) {
  const { x, y, width, height } = slot;
  return [
    { x, y, handle: 'nw' },
    { x: x + width, y, handle: 'ne' },
    { x: x + width, y: y + height, handle: 'se' },
    { x, y: y + height, handle: 'sw' },
  ];
}

function hitTestImageHandle(slot, canvasX, canvasY) {
  for (const pt of getImageHandlePoints(slot)) {
    if (
      canvasX >= pt.x - HANDLE_SIZE &&
      canvasX <= pt.x + HANDLE_SIZE &&
      canvasY >= pt.y - HANDLE_SIZE &&
      canvasY <= pt.y + HANDLE_SIZE
    ) {
      return pt.handle;
    }
  }
  return null;
}

function getResizeCursor(handle) {
  const map = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize' };
  return map[handle] || 'grab';
}

function getPageLayout(asset) {
  if (asset.pages === 2) {
    const gap = asset.gapPx || 0;
    return [
      {
        pageKey: 'front',
        offsetX: 0,
        offsetY: 0,
        width: asset.sideWidth,
        height: asset.sideHeight,
      },
      {
        pageKey: 'back',
        offsetX: asset.sideWidth + gap,
        offsetY: 0,
        width: asset.sideWidth,
        height: asset.sideHeight,
      },
    ];
  }
  return [{ pageKey: 'single', offsetX: 0, offsetY: 0, width: asset.width, height: asset.height }];
}

function isInCardGap(asset, canvasX, canvasY) {
  if (asset.pages !== 2 || !asset.gapPx) return false;
  const gapStart = asset.sideWidth;
  const gapEnd = gapStart + asset.gapPx;
  return canvasX >= gapStart && canvasX < gapEnd && canvasY >= 0 && canvasY <= asset.height;
}

function resolveCanvasToPage(state, canvasX, canvasY) {
  const asset = ASSET_TYPES[state.assetType];
  const layout = getPageLayout(asset);

  if (isInCardGap(asset, canvasX, canvasY)) {
    return {
      pageKey: getActivePageKey(),
      localX: 0,
      localY: 0,
      pageWidth: asset.sideWidth,
      pageHeight: asset.sideHeight,
      inGap: true,
    };
  }

  for (const page of layout) {
    if (
      canvasX >= page.offsetX &&
      canvasX < page.offsetX + page.width &&
      canvasY >= page.offsetY &&
      canvasY < page.offsetY + page.height
    ) {
      return {
        pageKey: page.pageKey,
        localX: canvasX - page.offsetX,
        localY: canvasY - page.offsetY,
        pageWidth: page.width,
        pageHeight: page.height,
      };
    }
  }

  const last = layout[layout.length - 1];
  return {
    pageKey: last.pageKey,
    localX: Math.min(Math.max(canvasX - last.offsetX, 0), last.width),
    localY: Math.min(Math.max(canvasY - last.offsetY, 0), last.height),
    pageWidth: last.width,
    pageHeight: last.height,
  };
}

function drawSelectionBox(ctx, state, asset) {
  const sel = state.selected;
  if (!sel || !sel.page) return;

  const pageState = getPageState(sel.page);
  const layout = getPageLayout(asset).find((p) => p.pageKey === sel.page);
  if (!layout) return;

  const ox = layout.offsetX;
  const oy = layout.offsetY;

  ctx.save();
  ctx.translate(ox, oy);
  ctx.strokeStyle = '#4f8cff';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);

  if (sel.type === 'image') {
    const slot = pageState.images[sel.index];
    if (slot?.visible && slot.image) {
      ctx.strokeRect(slot.x, slot.y, slot.width, slot.height);
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#4f8cff';
      ctx.lineWidth = 2;
      getImageHandlePoints(slot).forEach((pt) => {
        ctx.fillRect(pt.x - HANDLE_SIZE / 2, pt.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
        ctx.strokeRect(pt.x - HANDLE_SIZE / 2, pt.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
      });
    }
  } else if (sel.type === 'text') {
    const text = pageState.texts.find((t) => t.id === sel.id);
    if (text) {
      const { height } = getTextMetrics(ctx, text);
      ctx.strokeRect(text.x, text.y, text.maxWidth, height);
    }
  }

  ctx.restore();
}

function renderPoster(canvas, state, options = {}) {
  const { showOverlay = true, showSelection = true } = options;
  const asset = ASSET_TYPES[state.assetType];
  const w = asset.width;
  const h = asset.height;

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const layout = getPageLayout(asset);
  if (asset.pages === 2 && asset.gapPx) {
    drawCardGap(ctx, asset.sideWidth, 0, asset.gapPx, asset.height);
  }
  layout.forEach((page) => {
    const pageState = getPageState(page.pageKey);
    renderPageState(ctx, pageState, page.offsetX, page.offsetY, page.width, page.height);
  });

  if (showOverlay && asset.pages === 2) {
    const active = layout.find((p) => p.pageKey === getActivePageKey());
    if (active) {
      drawActivePageOutline(ctx, active.offsetX, active.offsetY, active.width, active.height);
    }
  }

  if (showSelection) {
    drawSelectionBox(ctx, state, asset);
  }

  return canvas;
}

function hitTestPage(pageState, localX, localY) {
  for (let i = pageState.images.length - 1; i >= 0; i--) {
    const slot = pageState.images[i];
    if (!slot.visible || !slot.image) continue;
    const handle = hitTestImageHandle(slot, localX, localY);
    if (handle) return { type: 'image', index: i, handle };
  }

  for (let i = pageState.texts.length - 1; i >= 0; i--) {
    const text = pageState.texts[i];
    const ctx = document.createElement('canvas').getContext('2d');
    const { height } = getTextMetrics(ctx, text);
    if (
      localX >= text.x &&
      localX <= text.x + text.maxWidth &&
      localY >= text.y &&
      localY <= text.y + height
    ) {
      return { type: 'text', id: text.id };
    }
  }

  for (let i = pageState.images.length - 1; i >= 0; i--) {
    const slot = pageState.images[i];
    if (!slot.visible || !slot.image) continue;
    if (
      localX >= slot.x &&
      localX <= slot.x + slot.width &&
      localY >= slot.y &&
      localY <= slot.y + slot.height
    ) {
      return { type: 'image', index: i };
    }
  }

  return null;
}

function hitTest(state, canvasX, canvasY) {
  const asset = ASSET_TYPES[state.assetType];
  const layout = getPageLayout(asset);

  for (let i = layout.length - 1; i >= 0; i--) {
    const page = layout[i];
    if (
      canvasX < page.offsetX ||
      canvasX >= page.offsetX + page.width ||
      canvasY < page.offsetY ||
      canvasY >= page.offsetY + page.height
    ) {
      continue;
    }

    const localX = canvasX - page.offsetX;
    const localY = canvasY - page.offsetY;
    const hit = hitTestPage(getPageState(page.pageKey), localX, localY);
    if (hit) {
      return { ...hit, page: page.pageKey, localX, localY };
    }
  }

  return null;
}

function canvasToLogical(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

function clampToPageBounds(values, pageWidth, pageHeight) {
  const min = 0;
  let { x, y, width, height } = values;
  width = Math.max(20, Math.min(width, pageWidth));
  height = Math.max(20, Math.min(height, pageHeight));
  x = Math.max(min, Math.min(x, pageWidth - width));
  y = Math.max(min, Math.min(y, pageHeight - height));
  return { x, y, width, height };
}
