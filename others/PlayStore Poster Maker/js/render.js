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

function drawBackground(ctx, state, w, h) {
  const bg = state.background;
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

  const { x, y, width, height, borderRadius, alignH, alignV, image, rotation } = slot;
  const crop = computeCoverCrop(image, width, height, alignH, alignV);
  const cx = x + width / 2;
  const cy = y + height / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(degToRad(rotation || 0));
  roundRectPath(ctx, -width / 2, -height / 2, width, height, borderRadius);
  ctx.clip();
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, -width / 2, -height / 2, width, height);
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

function drawSafeZone(ctx, w, h) {
  const margin = 50;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 80, 80, 0.8)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);
  ctx.fillStyle = 'rgba(255, 80, 80, 0.08)';
  ctx.fillRect(0, 0, w, margin);
  ctx.fillRect(0, h - margin, w, margin);
  ctx.fillRect(0, margin, margin, h - margin * 2);
  ctx.fillRect(w - margin, margin, margin, h - margin * 2);
  ctx.restore();
}

function drawSelectionBox(ctx, state) {
  const sel = state.selected;
  if (!sel) return;

  ctx.save();
  ctx.strokeStyle = '#4f8cff';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);

  if (sel.type === 'image') {
    const slot = state.images[sel.index];
    if (slot?.visible && slot.image) {
      const corners = getImageHandlePoints(slot);
      const topCenter = getTopCenterPoint(slot);
      const rotatePt = getRotationHandlePoint(slot);

      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      corners.slice(1).forEach((pt) => ctx.lineTo(pt.x, pt.y));
      ctx.closePath();
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(topCenter.x, topCenter.y);
      ctx.lineTo(rotatePt.x, rotatePt.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(rotatePt.x, rotatePt.y, ROTATE_HANDLE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#4f8cff';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      corners.forEach((pt) => {
        ctx.fillRect(pt.x - HANDLE_SIZE / 2, pt.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
        ctx.strokeRect(pt.x - HANDLE_SIZE / 2, pt.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
      });
    }
  } else if (sel.type === 'text') {
    const text = state.texts.find((t) => t.id === sel.id);
    if (text) {
      const { height } = getTextMetrics(ctx, text);
      ctx.strokeRect(text.x, text.y, text.maxWidth, height);
    }
  }

  ctx.restore();
}

const HANDLE_SIZE = 14;
const ROTATE_HANDLE_OFFSET = 32;
const ROTATE_HANDLE_RADIUS = 8;

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function getImageCenter(slot) {
  return {
    cx: slot.x + slot.width / 2,
    cy: slot.y + slot.height / 2,
  };
}

function transformLocalPoint(slot, localX, localY) {
  const { cx, cy } = getImageCenter(slot);
  const rad = degToRad(slot.rotation || 0);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: cx + localX * cos - localY * sin,
    y: cy + localX * sin + localY * cos,
  };
}

function getImageHandlePoints(slot) {
  const hw = slot.width / 2;
  const hh = slot.height / 2;
  return [
    { ...transformLocalPoint(slot, -hw, -hh), handle: 'nw' },
    { ...transformLocalPoint(slot, hw, -hh), handle: 'ne' },
    { ...transformLocalPoint(slot, hw, hh), handle: 'se' },
    { ...transformLocalPoint(slot, -hw, hh), handle: 'sw' },
  ];
}

function getTopCenterPoint(slot) {
  return transformLocalPoint(slot, 0, -slot.height / 2);
}

function getRotationHandlePoint(slot) {
  return transformLocalPoint(slot, 0, -slot.height / 2 - ROTATE_HANDLE_OFFSET);
}

function hitTestPointDistance(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

function hitTestImageHandle(slot, canvasX, canvasY) {
  const rotatePt = getRotationHandlePoint(slot);
  if (hitTestPointDistance(canvasX, canvasY, rotatePt.x, rotatePt.y) <= ROTATE_HANDLE_RADIUS + 4) {
    return 'rotate';
  }

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

function pointInRotatedSlot(slot, px, py) {
  const { cx, cy } = getImageCenter(slot);
  const rad = -degToRad(slot.rotation || 0);
  const dx = px - cx;
  const dy = py - cy;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  return Math.abs(localX) <= slot.width / 2 && Math.abs(localY) <= slot.height / 2;
}

function computeImageRotationAngle(slot, mouseX, mouseY) {
  const { cx, cy } = getImageCenter(slot);
  return (Math.atan2(mouseY - cy, mouseX - cx) * 180) / Math.PI;
}

function getResizeCursor(handle) {
  const map = {
    nw: 'nwse-resize',
    se: 'nwse-resize',
    ne: 'nesw-resize',
    sw: 'nesw-resize',
    rotate: 'grab',
  };
  return map[handle] || 'grab';
}

function renderPoster(canvas, state, options = {}) {
  const { showOverlay = true, showSelection = true } = options;
  const asset = ASSET_TYPES[state.assetType];
  const w = asset.width;
  const h = asset.height;

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  drawBackground(ctx, state, w, h);
  state.images.forEach((slot) => drawImageRounded(ctx, slot));
  state.texts.forEach((text) => drawTextLayer(ctx, text));

  if (showOverlay && state.showSafeZone && state.assetType === 'feature-graphic') {
    drawSafeZone(ctx, w, h);
  }
  if (showSelection) {
    drawSelectionBox(ctx, state);
  }

  return canvas;
}

function hitTest(state, canvasX, canvasY) {
  for (let i = state.images.length - 1; i >= 0; i--) {
    const slot = state.images[i];
    if (!slot.visible || !slot.image) continue;
    const handle = hitTestImageHandle(slot, canvasX, canvasY);
    if (handle) return { type: 'image', index: i, handle };
  }

  for (let i = state.texts.length - 1; i >= 0; i--) {
    const text = state.texts[i];
    const ctx = document.createElement('canvas').getContext('2d');
    const { height } = getTextMetrics(ctx, text);
    if (
      canvasX >= text.x &&
      canvasX <= text.x + text.maxWidth &&
      canvasY >= text.y &&
      canvasY <= text.y + height
    ) {
      return { type: 'text', id: text.id };
    }
  }

  for (let i = state.images.length - 1; i >= 0; i--) {
    const slot = state.images[i];
    if (!slot.visible || !slot.image) continue;
    if (pointInRotatedSlot(slot, canvasX, canvasY)) {
      return { type: 'image', index: i };
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
