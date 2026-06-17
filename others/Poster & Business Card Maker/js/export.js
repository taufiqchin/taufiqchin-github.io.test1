function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
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
  let warning = null;
  const largeLimit = 50 * 1024 * 1024;
  if (blob.size > largeLimit) {
    warning = `PNG is ${formatBytes(blob.size)}. Large print sizes may produce big files.`;
  }
  return {
    blob,
    filename: `${asset.filename}.png`,
    format: 'PNG',
    size: blob.size,
    warning,
  };
}

async function exportAsJpeg(canvas, asset) {
  const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
  return {
    blob,
    filename: `${asset.filename}.jpg`,
    format: 'JPEG',
    size: blob.size,
    warning: null,
  };
}

async function exportAsPdf(canvas, asset) {
  if (!window.jspdf?.jsPDF) {
    throw new Error('PDF library not loaded');
  }

  const widthMm = asset.physicalMm.width;
  const heightMm = asset.physicalMm.height;
  const pdf = new window.jspdf.jsPDF({
    orientation: widthMm > heightMm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [widthMm, heightMm],
    compress: true,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  pdf.addImage(imgData, 'JPEG', 0, 0, widthMm, heightMm);
  const blob = pdf.output('blob');

  return {
    blob,
    filename: `${asset.filename}.pdf`,
    format: 'PDF',
    size: blob.size,
    warning: null,
  };
}

async function exportAsDocx(canvas, asset) {
  if (typeof window.exportAsDocx !== 'function') {
    throw new Error('DOCX export is still loading. Please try again in a moment.');
  }
  return window.exportAsDocx(canvas, asset);
}

async function exportPoster(state, renderFn) {
  const asset = ASSET_TYPES[state.assetType];
  const offscreen = document.createElement('canvas');
  renderFn(offscreen, state, { showOverlay: false, showSelection: false });

  switch (state.exportFormat) {
    case 'jpeg':
      return exportAsJpeg(offscreen, asset);
    case 'pdf':
      return exportAsPdf(offscreen, asset);
    case 'docx':
      return exportAsDocx(offscreen, asset);
    default:
      return exportAsPng(offscreen, asset);
  }
}

async function estimateExportSize(state, renderFn) {
  const asset = ASSET_TYPES[state.assetType];
  const offscreen = document.createElement('canvas');
  renderFn(offscreen, state, { showOverlay: false, showSelection: false });

  if (state.exportFormat === 'pdf') {
    const jpeg = await canvasToBlob(offscreen, 'image/jpeg', 0.85);
    return { size: Math.round(jpeg.size * 1.1), format: 'PDF (est.)' };
  }

  if (state.exportFormat === 'docx') {
    const png = await canvasToBlob(offscreen, 'image/png');
    return { size: Math.round(png.size * 1.05), format: 'DOCX (est.)' };
  }

  if (state.exportFormat === 'jpeg') {
    const jpeg = await canvasToBlob(offscreen, 'image/jpeg', 0.85);
    return { size: jpeg.size, format: 'JPEG (est.)' };
  }

  const png = await canvasToBlob(offscreen, 'image/png');
  return { size: png.size, format: 'PNG (est.)' };
}
