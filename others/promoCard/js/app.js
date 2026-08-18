const HEADER_NAMES = new Set(["code", "promo", "promo code", "promocode", "codes"]);

const state = {
  imageUrl: null,
  naturalWidth: 0,
  naturalHeight: 0,
  codes: [""],
  selectedIndex: 0,
  urlTemplate: "https://play.google.com/redeem?code={CODE}",
  fontFamily: "Fredoka",
  fontSize: 48,
  fontColor: "#ffffff",
  qrSize: 22,
  textPos: { x: 8, y: 72 },
  qrPos: { x: 72, y: 68 },
};

let qr = null;
let exporting = false;

const els = {};

function $(id) {
  return document.getElementById(id);
}

function currentCode() {
  return (state.codes[state.selectedIndex] || "").trim();
}

const REDEEM_PRESETS = {
  play: "https://play.google.com/redeem?code={CODE}",
  apple: "https://apps.apple.com/redeem?ctx=offercodes&id=YOUR_APP_ID&code={CODE}",
};

function qrPayload(code) {
  const tpl = state.urlTemplate.trim();
  const value = (code || "").trim();
  if (!tpl) return value || " ";
  return tpl.replaceAll("{CODE}", encodeURIComponent(value));
}

function sanitizeFilename(code) {
  const cleaned = String(code)
    .trim()
    .replace(/[\/\\:*?"<>|]/g, "-")
    .replace(/\s+/g, " ");
  return cleaned || "promo";
}

function uniqueCodes(list) {
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const code = String(raw).trim();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

function waitFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function isHeaderCell(value) {
  return HEADER_NAMES.has(String(value || "").trim().toLowerCase());
}

function bindElements() {
  els.imageInput = $("image-input");
  els.imageName = $("image-name");
  els.promoInput = $("promo-input");
  els.excelInput = $("excel-input");
  els.textInput = $("text-input");
  els.codePickerWrap = $("code-picker-wrap");
  els.codePicker = $("code-picker");
  els.codeCount = $("code-count");
  els.urlTemplate = $("url-template");
  els.redeemPreset = $("redeem-preset");
  els.qrResolved = $("qr-resolved");
  els.fontFamily = $("font-family");
  els.fontSize = $("font-size");
  els.fontSizeVal = $("font-size-val");
  els.fontColor = $("font-color");
  els.fontColorHex = $("font-color-hex");
  els.qrSize = $("qr-size");
  els.qrSizeVal = $("qr-size-val");
  els.downloadBtn = $("download-btn");
  els.exportStatus = $("export-status");
  els.statusLine = $("status-line");
  els.emptyState = $("empty-state");
  els.card = $("promo-card");
  els.cardImage = $("card-image");
  els.textLayer = $("text-layer");
  els.qrLayer = $("qr-layer");
  els.qrCanvas = $("qr-canvas");
  els.qrResize = $("qr-resize");
}

function setCodes(codes, selectIndex = 0) {
  state.codes = uniqueCodes(codes);
  if (!state.codes.length) state.codes = [""];
  state.selectedIndex = Math.min(selectIndex, state.codes.length - 1);
  els.promoInput.value = currentCode();
  renderCodePicker();
  updateOverlays();
  updateDownloadLabel();
}

function renderCodePicker() {
  const many = state.codes.length > 1;
  els.codePickerWrap.hidden = !many;
  els.codePicker.replaceChildren();
  state.codes.forEach((code, i) => {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = code;
    option.selected = i === state.selectedIndex;
    els.codePicker.appendChild(option);
  });
  els.codeCount.textContent = many ? `${state.codes.length} codes loaded` : "";
}

function updateDownloadLabel() {
  const n = state.codes.filter(Boolean).length;
  els.downloadBtn.textContent = n > 1 ? "Download all PNGs (folder)" : "Download PNG";
  els.downloadBtn.disabled = !state.imageUrl || n === 0 || exporting;
}

function applyPositions() {
  els.textLayer.style.left = `${state.textPos.x}%`;
  els.textLayer.style.top = `${state.textPos.y}%`;
  els.qrLayer.style.left = `${state.qrPos.x}%`;
  els.qrLayer.style.top = `${state.qrPos.y}%`;
}

function makeQrTransparent() {
  const canvas = els.qrCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 220 && data[i + 1] > 220 && data[i + 2] > 220) {
      data[i + 3] = 0;
    }
  }
  ctx.putImageData(image, 0, 0);
}

function updateOverlays() {
  const code = currentCode();
  els.textLayer.textContent = code;
  els.textLayer.style.display = code ? "" : "none";
  els.textLayer.style.fontFamily = `"${state.fontFamily}", sans-serif`;
  els.textLayer.style.fontSize = `${state.fontSize}px`;
  els.textLayer.style.color = state.fontColor;
  els.qrLayer.style.width = `${state.qrSize}%`;
  els.qrLayer.style.display = code ? "" : "none";
  applyPositions();

  const payload = qrPayload(code);
  els.qrResolved.textContent = code ? `QR opens: ${payload}` : "Enter a promo code to generate the QR.";
  if (qr) {
    qr.value = payload || " ";
    makeQrTransparent();
  }
}

function showCard() {
  els.emptyState.hidden = true;
  els.card.hidden = false;
  els.statusLine.textContent = `${state.naturalWidth} × ${state.naturalHeight}`;
  updateDownloadLabel();
}

function makeDraggable(layer, posKey) {
  layer.addEventListener("pointerdown", (event) => {
    if (exporting || event.button !== 0 || !state.imageUrl) return;
    if (event.target.closest(".resize-handle")) return;
    event.preventDefault();
    layer.setPointerCapture(event.pointerId);
    const cardRect = els.card.getBoundingClientRect();
    const layerRect = layer.getBoundingClientRect();
    const offsetX = event.clientX - layerRect.left;
    const offsetY = event.clientY - layerRect.top;

    const onMove = (moveEvent) => {
      const rect = els.card.getBoundingClientRect();
      let left = moveEvent.clientX - rect.left - offsetX;
      let top = moveEvent.clientY - rect.top - offsetY;
      const maxX = Math.max(0, rect.width - layerRect.width);
      const maxY = Math.max(0, rect.height - layerRect.height);
      left = Math.max(0, Math.min(maxX, left));
      top = Math.max(0, Math.min(maxY, top));
      state[posKey] = {
        x: (left / rect.width) * 100,
        y: (top / rect.height) * 100,
      };
      applyPositions();
    };

    const onUp = () => {
      layer.removeEventListener("pointermove", onMove);
      layer.removeEventListener("pointerup", onUp);
    };

    layer.addEventListener("pointermove", onMove);
    layer.addEventListener("pointerup", onUp);
  });
}

function makeQrResizable() {
  els.qrResize.addEventListener("pointerdown", (event) => {
    if (exporting || event.button !== 0 || !state.imageUrl) return;
    event.preventDefault();
    event.stopPropagation();
    els.qrResize.setPointerCapture(event.pointerId);

    const onMove = (moveEvent) => {
      const rect = els.card.getBoundingClientRect();
      const left = (state.qrPos.x / 100) * rect.width;
      const top = (state.qrPos.y / 100) * rect.height;
      const width = moveEvent.clientX - rect.left - left;
      const height = moveEvent.clientY - rect.top - top;
      const size = Math.max(width, height);
      const pct = Math.round((size / rect.width) * 100);
      state.qrSize = Math.max(8, Math.min(90, pct));
      els.qrSize.value = String(state.qrSize);
      els.qrSizeVal.textContent = `${state.qrSize}%`;
      updateOverlays();
    };

    const onUp = () => {
      els.qrResize.removeEventListener("pointermove", onMove);
      els.qrResize.removeEventListener("pointerup", onUp);
    };

    els.qrResize.addEventListener("pointermove", onMove);
    els.qrResize.addEventListener("pointerup", onUp);
  });
}

function parseExcelColumn(buffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
  let values = rows.map((row) => (row && row[0] != null ? String(row[0]) : "")).map((v) => v.trim());
  if (values.length && isHeaderCell(values[0])) values = values.slice(1);
  return uniqueCodes(values);
}

function parseTextCodes(text) {
  const parts = text.split(/,|\r?\n/).map((part) => part.trim()).filter(Boolean);
  return uniqueCodes(parts);
}

async function captureCardPng() {
  await document.fonts.ready;
  await waitFrame();
  const scale = state.naturalWidth && els.card.offsetWidth
    ? state.naturalWidth / els.card.offsetWidth
    : 2;
  const canvas = await html2canvas(els.card, {
    scale,
    useCORS: true,
    backgroundColor: null,
    logging: false,
  });
  return canvasToBlob(canvas);
}

async function downloadCards() {
  const codes = state.codes.filter(Boolean);
  if (!state.imageUrl || !codes.length) return;

  exporting = true;
  els.card.classList.add("exporting");
  updateDownloadLabel();

  const previousIndex = state.selectedIndex;
  try {
    if (codes.length === 1) {
      els.exportStatus.textContent = "Creating PNG…";
      state.selectedIndex = state.codes.indexOf(codes[0]);
      updateOverlays();
      const blob = await captureCardPng();
      downloadBlob(blob, `${sanitizeFilename(codes[0])}.png`);
      els.exportStatus.textContent = `Saved ${sanitizeFilename(codes[0])}.png`;
    } else {
      const zip = new JSZip();
      const folder = zip.folder("promo-cards");
      for (let i = 0; i < codes.length; i++) {
        els.exportStatus.textContent = `Creating ${i + 1} / ${codes.length}…`;
        state.selectedIndex = state.codes.indexOf(codes[i]);
        els.codePicker.value = String(state.selectedIndex);
        updateOverlays();
        const blob = await captureCardPng();
        folder.file(`${sanitizeFilename(codes[i])}.png`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, "promo-cards.zip");
      els.exportStatus.textContent = `Saved promo-cards.zip (${codes.length} PNGs)`;
    }
  } catch (err) {
    console.error(err);
    els.exportStatus.textContent = "Could not create the download. Try again.";
  } finally {
    state.selectedIndex = previousIndex;
    updateOverlays();
    renderCodePicker();
    exporting = false;
    els.card.classList.remove("exporting");
    updateDownloadLabel();
  }
}

function initQr() {
  qr = new QRious({
    element: els.qrCanvas,
    value: qrPayload(currentCode()),
    size: 256,
    level: "M",
    background: "#ffffff",
    foreground: "#000000",
  });
  makeQrTransparent();
}

function bindEvents() {
  els.imageInput.addEventListener("change", () => {
    const file = els.imageInput.files[0];
    if (!file) return;
    if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
    state.imageUrl = URL.createObjectURL(file);
    els.imageName.textContent = file.name;
    els.cardImage.onload = () => {
      state.naturalWidth = els.cardImage.naturalWidth;
      state.naturalHeight = els.cardImage.naturalHeight;
      showCard();
      updateOverlays();
    };
    els.cardImage.src = state.imageUrl;
  });

  els.promoInput.addEventListener("input", () => {
    const value = els.promoInput.value;
    if (state.codes.length <= 1) {
      setCodes([value], 0);
    } else {
      state.codes[state.selectedIndex] = value;
      state.codes = uniqueCodes(state.codes.length ? state.codes : [value]);
      if (state.selectedIndex >= state.codes.length) state.selectedIndex = 0;
      renderCodePicker();
      updateOverlays();
      updateDownloadLabel();
    }
  });

  els.codePicker.addEventListener("change", () => {
    state.selectedIndex = Number(els.codePicker.value) || 0;
    els.promoInput.value = currentCode();
    updateOverlays();
  });

  els.excelInput.addEventListener("change", async () => {
    const file = els.excelInput.files[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const codes = parseExcelColumn(buffer);
      if (!codes.length) {
        els.exportStatus.textContent = "No codes found in the first column.";
        return;
      }
      setCodes(codes, 0);
      els.exportStatus.textContent = `Loaded ${codes.length} code${codes.length > 1 ? "s" : ""} from Excel.`;
    } catch (err) {
      console.error(err);
      els.exportStatus.textContent = "Could not read that Excel file.";
    }
    els.excelInput.value = "";
  });

  els.textInput.addEventListener("change", async () => {
    const file = els.textInput.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const codes = parseTextCodes(text);
      if (!codes.length) {
        els.exportStatus.textContent = "No codes found in that text file.";
        return;
      }
      setCodes(codes, 0);
      els.exportStatus.textContent = `Loaded ${codes.length} code${codes.length > 1 ? "s" : ""} from text file.`;
    } catch (err) {
      console.error(err);
      els.exportStatus.textContent = "Could not read that text file.";
    }
    els.textInput.value = "";
  });

  els.urlTemplate.addEventListener("input", () => {
    state.urlTemplate = els.urlTemplate.value;
    const match = Object.entries(REDEEM_PRESETS).find(([, url]) => url === state.urlTemplate.trim());
    els.redeemPreset.value = match ? match[0] : "custom";
    updateOverlays();
  });

  els.redeemPreset.addEventListener("change", () => {
    const preset = REDEEM_PRESETS[els.redeemPreset.value];
    if (preset) {
      state.urlTemplate = preset;
      els.urlTemplate.value = preset;
    }
    updateOverlays();
  });

  els.fontFamily.addEventListener("change", () => {
    state.fontFamily = els.fontFamily.value;
    updateOverlays();
  });

  els.fontSize.addEventListener("input", () => {
    state.fontSize = Number(els.fontSize.value);
    els.fontSizeVal.textContent = `${state.fontSize}px`;
    updateOverlays();
  });

  els.fontColor.addEventListener("input", () => {
    state.fontColor = els.fontColor.value;
    els.fontColorHex.value = state.fontColor;
    updateOverlays();
  });

  els.fontColorHex.addEventListener("input", () => {
    const hex = els.fontColorHex.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      state.fontColor = hex;
      els.fontColor.value = hex;
      updateOverlays();
    }
  });

  els.qrSize.addEventListener("input", () => {
    state.qrSize = Number(els.qrSize.value);
    els.qrSizeVal.textContent = `${state.qrSize}%`;
    updateOverlays();
  });

  els.downloadBtn.addEventListener("click", downloadCards);

  makeDraggable(els.textLayer, "textPos");
  makeDraggable(els.qrLayer, "qrPos");
  makeQrResizable();
}

function init() {
  bindElements();
  initQr();
  bindEvents();
  renderCodePicker();
  updateOverlays();
  updateDownloadLabel();
}

init();
