// Default poster canvas background only (not the app UI theme)
const DEFAULT_POSTER_BG_COLOR = '#eed744';

const ASSET_TYPES = {
  icon: {
    label: 'App Icon',
    group: 'Graphics',
    width: 512,
    height: 512,
    maxBytes: 1024 * 1024,
    maxLabel: '1 MB',
    formatNote: 'PNG or JPEG',
    aspectNote: '512×512 px',
    filename: 'app-icon-512x512',
  },
  'feature-graphic': {
    label: 'Feature Graphic',
    group: 'Graphics',
    width: 1024,
    height: 500,
    maxBytes: 15 * 1024 * 1024,
    maxLabel: '15 MB',
    formatNote: 'PNG or JPEG',
    aspectNote: '1,024×500 px',
    filename: 'feature-graphic-1024x500',
  },
  'phone-portrait': {
    label: 'Phone Screenshot (Portrait 9:16)',
    group: 'Phone',
    width: 1080,
    height: 1920,
    maxBytes: 8 * 1024 * 1024,
    maxLabel: '8 MB',
    formatNote: 'PNG or JPEG',
    aspectNote: '9:16 · 320–3,840 px per side',
    promotionNote: '≥1080 px per side for promotion (4+ screenshots)',
    filename: 'phone-screenshot-portrait-1080x1920',
  },
  'phone-landscape': {
    label: 'Phone Screenshot (Landscape 16:9)',
    group: 'Phone',
    width: 1920,
    height: 1080,
    maxBytes: 8 * 1024 * 1024,
    maxLabel: '8 MB',
    formatNote: 'PNG or JPEG',
    aspectNote: '16:9 · 320–3,840 px per side',
    promotionNote: '≥1080 px per side for promotion (4+ screenshots)',
    filename: 'phone-screenshot-landscape-1920x1080',
  },
  'tablet-7-portrait': {
    label: '7-inch Tablet Screenshot (Portrait 9:16)',
    group: 'Tablet',
    width: 1080,
    height: 1920,
    maxBytes: 8 * 1024 * 1024,
    maxLabel: '8 MB',
    formatNote: 'PNG or JPEG',
    aspectNote: '9:16 · 320–3,840 px per side',
    filename: 'tablet-7-screenshot-portrait-1080x1920',
  },
  'tablet-7-landscape': {
    label: '7-inch Tablet Screenshot (Landscape 16:9)',
    group: 'Tablet',
    width: 1920,
    height: 1080,
    maxBytes: 8 * 1024 * 1024,
    maxLabel: '8 MB',
    formatNote: 'PNG or JPEG',
    aspectNote: '16:9 · 320–3,840 px per side',
    filename: 'tablet-7-screenshot-landscape-1920x1080',
  },
  'tablet-10-portrait': {
    label: '10-inch Tablet Screenshot (Portrait 9:16)',
    group: 'Tablet',
    width: 1600,
    height: 2844,
    maxBytes: 8 * 1024 * 1024,
    maxLabel: '8 MB',
    formatNote: 'PNG or JPEG',
    aspectNote: '9:16 · 1,080–7,680 px per side',
    filename: 'tablet-10-screenshot-portrait-1600x2844',
  },
  'tablet-10-landscape': {
    label: '10-inch Tablet Screenshot (Landscape 16:9)',
    group: 'Tablet',
    width: 2560,
    height: 1440,
    maxBytes: 8 * 1024 * 1024,
    maxLabel: '8 MB',
    formatNote: 'PNG or JPEG',
    aspectNote: '16:9 · 1,080–7,680 px per side',
    filename: 'tablet-10-screenshot-landscape-2560x1440',
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

function createDefaultState() {
  return {
    assetType: 'feature-graphic',
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
    showSafeZone: true,
    selected: null,
    exportFormat: 'png',
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

function updateBackground(updates) {
  state.background = { ...state.background, ...updates };
  return state;
}

function updateImageSlot(index, updates) {
  state.images[index] = { ...state.images[index], ...updates };
  return state;
}

function updateTextLayer(id, updates) {
  state.texts = state.texts.map((t) => (t.id === id ? { ...t, ...updates } : t));
  return state;
}

function addTextLayer() {
  const id = state.nextTextId;
  state.texts.push(createTextLayer(id));
  state.nextTextId += 1;
  state.selected = { type: 'text', id };
  return state;
}

function removeTextLayer(id) {
  if (state.texts.length <= 1) return state;
  state.texts = state.texts.filter((t) => t.id !== id);
  if (state.selected?.type === 'text' && state.selected.id === id) {
    state.selected = null;
  }
  return state;
}

function addImageSlot() {
  const index = state.images.length;
  const slot = createImageSlot();
  slot.x = 50 + index * 30;
  slot.y = 50 + index * 30;
  state.images.push(slot);
  state.selected = { type: 'image', index };
  return state;
}

function removeImageSlot(index) {
  if (state.images.length <= 1) return state;
  state.images.splice(index, 1);
  if (state.selected?.type === 'image') {
    if (state.selected.index === index) {
      state.selected = null;
    } else if (state.selected.index > index) {
      state.selected = { type: 'image', index: state.selected.index - 1 };
    }
  }
  return state;
}

function getAsset() {
  return ASSET_TYPES[state.assetType];
}

function formatAssetBadge(asset) {
  let text = `${asset.width}×${asset.height} · ${asset.formatNote} · max ${asset.maxLabel}`;
  if (asset.aspectNote) text += ` · ${asset.aspectNote}`;
  return text;
}

function formatAssetPromotion(asset) {
  return asset.promotionNote || '';
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
