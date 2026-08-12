// Default canvas background only (not the app UI theme)
const DEFAULT_POSTER_BG_COLOR = '#f7d9bc';

const BG_COLOR_PRESETS = [
  { label: 'Nude', color: '#f7d9bc' },
  { label: 'Yellow', color: '#eed744' },
  { label: 'Light navy blue', color: '#8eabc9' },
  { label: 'Light green', color: '#88e788' },
  { label: 'White', color: '#ffffff' },
];

const ASSET_TYPES = {
  'instagram-feed': {
    label: 'Instagram,TikTok,Threads, FB Feed',
    group: 'Feed Posts',
    width: 1080,
    height: 1080,
    maxBytes: 8 * 1024 * 1024,
    maxLabel: '8 MB',
    formatNote: 'PNG or JPEG',
    aspectNote: '1:1 square post',
    filename: 'instagram-feed-1080x1080',
  },

  'instagram-story': {
    label: 'Instagram, TikTok, Whatsapp Story / Reels',
    group: 'Stories',
    width: 1080,
    height: 1920,
    maxBytes: 8 * 1024 * 1024,
    maxLabel: '8 MB',
    formatNote: 'PNG or JPEG',
    aspectNote: '9:16 vertical',
    filename: 'instagram-story-1080x1920',
  },


  'facebook-feed-landscape': {
    label: 'Facebook Feed (Landscape)',
    group: 'Other Feed',
    width: 1200,
    height: 630,
    maxBytes: 8 * 1024 * 1024,
    maxLabel: '8 MB',
    formatNote: 'PNG or JPEG',
    aspectNote: '1.91:1 link/image post',
    filename: 'facebook-feed-landscape-1200x630',
  },
  'facebook-feed-portrait': {
    label: 'Facebook Feed (Portrait)',
    group: 'Other Feed',
    width: 1080,
    height: 1350,
    maxBytes: 8 * 1024 * 1024,
    maxLabel: '8 MB',
    formatNote: 'PNG or JPEG',
    aspectNote: '4:5 portrait feed',
    filename: 'facebook-feed-portrait-1080x1350',
  },
  

  'app-logo': {
    label: 'App Logo',
    group: 'App Branding',
    width: 512,
    height: 512,
    maxBytes: 1024 * 1024,
    maxLabel: '1 MB',
    formatNote: 'PNG or JPEG',
    aspectNote: '512×512 square logo',
    filename: 'app-logo-512x512',
    logoMode: true,
  },
  'profile-picture': {
    label: 'Profile Picture',
    group: 'App Branding',
    width: 1080,
    height: 1080,
    maxBytes: 8 * 1024 * 1024,
    maxLabel: '8 MB',
    formatNote: 'PNG or JPEG',
    aspectNote: 'Circular fit · square export',
    promotionNote: 'Photo fits inside a circle on your background color.',
    filename: 'profile-picture-1080x1080',
    profileMode: true,
  },
  'facebook-cover': {
    label: 'Facebook Cover',
    group: 'App Branding',
    width: 1640,
    height: 624,
    maxBytes: 8 * 1024 * 1024,
    maxLabel: '8 MB',
    formatNote: 'PNG or JPEG',
    aspectNote: '1640×624 page cover',
    filename: 'facebook-cover-1640x624',
  },
};

function createImageSlot() {
  return {
    src: null,
    image: null,
    fileName: null,
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
    fitMode: false,
    rotation: 0,
    visible: true,
  };
}

function createTextLayer(id) {
  return {
    id,
    content: '',
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
    assetType: 'instagram-feed',
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

function getProfileCircleBounds(w, h) {
  const size = Math.round(Math.min(w, h) * 0.9);
  return {
    x: (w - size) / 2,
    y: (h - size) / 2,
    width: size,
    height: size,
    radius: size / 2,
  };
}

function applyAssetLayout(assetType) {
  const asset = ASSET_TYPES[assetType];
  if (!asset) return state;

  if (asset.profileMode) {
    const bounds = getProfileCircleBounds(asset.width, asset.height);
    state.images[0] = {
      ...state.images[0],
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      borderRadius: Math.round(bounds.radius),
      fitMode: true,
      lockAspect: true,
      visible: true,
    };
    for (let i = 1; i < state.images.length; i++) {
      state.images[i] = { ...state.images[i], fitMode: false };
    }
  } else {
    state.images = state.images.map((slot) => ({ ...slot, fitMode: false }));
  }

  return state;
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
