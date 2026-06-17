// Default poster canvas background only (not the app UI theme)
const DEFAULT_POSTER_BG_COLOR = '#eed744';

function mmToPx(mm, dpi) {
  return Math.round(mm * (dpi / 25.4));
}

const CARD_WIDTH_MM = 85;
const CARD_HEIGHT_MM = 55;
const CARD_GAP_MM = 5;
const CARD_DPI = 300;
const CARD_SIDE_WIDTH = mmToPx(CARD_WIDTH_MM, CARD_DPI);
const CARD_SIDE_HEIGHT = mmToPx(CARD_HEIGHT_MM, CARD_DPI);
const CARD_GAP_PX = mmToPx(CARD_GAP_MM, CARD_DPI);

function makePosterAsset(label, widthMm, heightMm, dpi, filename) {
  return {
    label,
    group: 'Poster',
    width: mmToPx(widthMm, dpi),
    height: mmToPx(heightMm, dpi),
    dpi,
    physicalMm: { width: widthMm, height: heightMm },
    pages: 1,
    filename,
  };
}

const ASSET_TYPES = {
  a4: makePosterAsset('A4', 210, 297, 300, 'poster-a4'),
  a5: makePosterAsset('A5', 148, 210, 300, 'poster-a5'),
  a0: makePosterAsset('A0', 841, 1189, 150, 'poster-a0'),
  a1: makePosterAsset('A1', 594, 841, 150, 'poster-a1'),
  'business-card': {
    label: 'Business Card',
    group: 'Business Card',
    width: CARD_SIDE_WIDTH * 2 + CARD_GAP_PX,
    height: CARD_SIDE_HEIGHT,
    sideWidth: CARD_SIDE_WIDTH,
    sideHeight: CARD_SIDE_HEIGHT,
    gapPx: CARD_GAP_PX,
    gapMm: CARD_GAP_MM,
    dpi: CARD_DPI,
    physicalMm: { width: CARD_WIDTH_MM * 2 + CARD_GAP_MM, height: CARD_HEIGHT_MM },
    sidePhysicalMm: { width: CARD_WIDTH_MM, height: CARD_HEIGHT_MM },
    pages: 2,
    layout: 'side-by-side',
    filename: 'business-card-front-back',
  },
};

function createImageSlot() {
  return {
    src: null,
    image: null,
    naturalWidth: 0,
    naturalHeight: 0,
    x: 50,
    y: 50,
    width: 200,
    height: 200,
    alignH: 'center',
    alignV: 'center',
    borderRadius: 0,
    lockAspect: false,
    visible: true,
  };
}

function createTextLayer(id) {
  return {
    id,
    content: 'Your headline here',
    x: 80,
    y: 80,
    maxWidth: 400,
    fontSize: 48,
    fontFamily: 'Arial, sans-serif',
    color: '#2c2a28',
    bold: true,
    italic: false,
    align: 'left',
  };
}

function createPageState() {
  return {
    background: {
      mode: 'color',
      color: DEFAULT_POSTER_BG_COLOR,
      src: null,
      image: null,
      blur: 0,
    },
    images: [createImageSlot(), createImageSlot()],
    texts: [createTextLayer(1)],
    nextTextId: 2,
  };
}

function clonePageState(page) {
  return {
    background: { ...page.background },
    images: page.images.map((slot) => ({ ...slot })),
    texts: page.texts.map((text) => ({ ...text })),
    nextTextId: page.nextTextId,
  };
}

function createDefaultState() {
  return {
    assetType: 'a4',
    activePage: 'single',
    pages: {
      single: createPageState(),
      front: createPageState(),
      back: createPageState(),
    },
    exportFormat: 'png',
    selected: null,
  };
}

let state = createDefaultState();

function getState() {
  return state;
}

function setState(partial) {
  state = { ...state, ...partial };
  return state;
}

function isBusinessCardAsset(assetType) {
  return assetType === 'business-card';
}

function getActivePageKey() {
  const asset = getAsset();
  if (asset.pages === 2) {
    return state.activePage === 'back' ? 'back' : 'front';
  }
  return 'single';
}

function getPageState(pageKey) {
  return state.pages[pageKey];
}

function getActivePage() {
  return state.pages[getActivePageKey()];
}

function setActivePage(pageKey) {
  if (getAsset().pages === 2 && (pageKey === 'front' || pageKey === 'back')) {
    state.activePage = pageKey;
    state.selected = null;
  }
  return state;
}

function migrateAssetType(newAssetType) {
  const wasCard = isBusinessCardAsset(state.assetType);
  const isCard = isBusinessCardAsset(newAssetType);

  if (!wasCard && isCard) {
    state.pages.front = clonePageState(state.pages.single);
    state.pages.back = createPageState();
    state.activePage = 'front';
  } else if (wasCard && !isCard) {
    state.pages.single = clonePageState(state.pages.front);
    state.activePage = 'single';
  } else if (!wasCard && !isCard) {
    state.activePage = 'single';
  }

  state.assetType = newAssetType;
  state.selected = null;
  return state;
}

function updateBackground(updates) {
  const page = getActivePage();
  page.background = { ...page.background, ...updates };
  return state;
}

function updateImageSlot(index, updates) {
  const page = getActivePage();
  page.images[index] = { ...page.images[index], ...updates };
  return state;
}

function updateTextLayer(id, updates) {
  const page = getActivePage();
  page.texts = page.texts.map((t) => (t.id === id ? { ...t, ...updates } : t));
  return state;
}

function addTextLayer() {
  const page = getActivePage();
  const id = page.nextTextId;
  page.texts.push(createTextLayer(id));
  page.nextTextId += 1;
  state.selected = { type: 'text', id, page: getActivePageKey() };
  return state;
}

function removeTextLayer(id) {
  const page = getActivePage();
  if (page.texts.length <= 1) return state;
  page.texts = page.texts.filter((t) => t.id !== id);
  if (state.selected?.type === 'text' && state.selected.id === id) {
    state.selected = null;
  }
  return state;
}

function addImageSlot() {
  const page = getActivePage();
  const index = page.images.length;
  const slot = createImageSlot();
  slot.x = 50 + index * 30;
  slot.y = 50 + index * 30;
  page.images.push(slot);
  state.selected = { type: 'image', index, page: getActivePageKey() };
  return state;
}

function removeImageSlot(index) {
  const page = getActivePage();
  if (page.images.length <= 1) return state;
  page.images.splice(index, 1);
  if (state.selected?.type === 'image' && state.selected.page === getActivePageKey()) {
    if (state.selected.index === index) {
      state.selected = null;
    } else if (state.selected.index > index) {
      state.selected = { type: 'image', index: state.selected.index - 1, page: getActivePageKey() };
    }
  }
  return state;
}

function getAsset() {
  return ASSET_TYPES[state.assetType];
}

function formatAssetBadge(asset) {
  const { width: wMm, height: hMm } = asset.physicalMm;
  if (asset.pages === 2) {
    const side = asset.sidePhysicalMm;
    return `${asset.width}×${asset.height} px · ${asset.dpi} DPI · ${side.width}×${side.height} mm per side · ${asset.gapMm} mm gap (${wMm}×${hMm} mm combined)`;
  }
  return `${asset.width}×${asset.height} px · ${asset.dpi} DPI · ${wMm}×${hMm} mm`;
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () =>
        resolve({
          src: reader.result,
          image: img,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        });
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
