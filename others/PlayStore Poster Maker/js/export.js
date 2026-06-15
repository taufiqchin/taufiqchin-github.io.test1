function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

async function binarySearchQuality(canvas, maxBytes, type = 'image/jpeg') {
  let low = 0.1;
  let high = 0.95;
  let best = null;

  for (let i = 0; i < 12; i++) {
    const mid = (low + high) / 2;
    const blob = await canvasToBlob(canvas, type, mid);
    if (!blob) break;

    if (blob.size <= maxBytes) {
      best = { blob, quality: mid, type };
      low = mid;
    } else {
      high = mid;
    }
  }

  if (best) return best;

  const blob = await canvasToBlob(canvas, type, 0.1);
  return { blob, quality: 0.1, type };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportAsPng(canvas, asset) {
  const blob = await canvasToBlob(canvas, 'image/png');
  if (blob.size <= asset.maxBytes) {
    return {
      blob,
      filename: `${asset.filename}.png`,
      format: 'PNG',
      size: blob.size,
      warning: null,
    };
  }

  const result = await binarySearchQuality(canvas, asset.maxBytes);
  return {
    blob: result.blob,
    filename: `${asset.filename}.jpg`,
    format: 'JPEG',
    size: result.blob.size,
    warning: `PNG was ${formatBytes(blob.size)} (over ${asset.maxLabel}). Exported as compressed JPEG instead.`,
  };
}

async function exportAsJpeg(canvas, asset) {
  let blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
  if (blob.size <= asset.maxBytes) {
    return {
      blob,
      filename: `${asset.filename}.jpg`,
      format: 'JPEG',
      size: blob.size,
      warning: null,
    };
  }

  const result = await binarySearchQuality(canvas, asset.maxBytes);
  return {
    blob: result.blob,
    filename: `${asset.filename}.jpg`,
    format: 'JPEG',
    size: result.blob.size,
    warning: blob.size > asset.maxBytes ? 'JPEG quality reduced to stay under Google size limit.' : null,
  };
}

async function exportPoster(state, renderFn) {
  const asset = ASSET_TYPES[state.assetType];
  const offscreen = document.createElement('canvas');
  renderFn(offscreen, state, { showOverlay: false, showSelection: false });

  if (state.exportFormat === 'png') {
    return exportAsPng(offscreen, asset);
  }

  return exportAsJpeg(offscreen, asset);
}

async function estimateExportSize(state, renderFn) {
  const asset = ASSET_TYPES[state.assetType];
  const offscreen = document.createElement('canvas');
  renderFn(offscreen, state, { showOverlay: false, showSelection: false });

  if (state.exportFormat === 'png') {
    const png = await canvasToBlob(offscreen, 'image/png');
    if (png.size <= asset.maxBytes) return { size: png.size, format: 'PNG' };
    const jpeg = await canvasToBlob(offscreen, 'image/jpeg', 0.85);
    return {
      size: Math.min(jpeg.size, asset.maxBytes),
      format: 'PNG over limit → JPEG (est.)',
    };
  }

  const jpeg = await canvasToBlob(offscreen, 'image/jpeg', 0.85);
  return {
    size: Math.min(jpeg.size, asset.maxBytes),
    format: 'JPEG (est.)',
  };
}
