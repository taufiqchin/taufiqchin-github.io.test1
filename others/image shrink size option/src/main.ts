import "./styles.css"
import { registerSW } from "virtual:pwa-register"
import { createOverrideFromGlobal, getEffectiveSettings } from "./app/resolveSettings"
import { loadSettings, saveSettings, type AppSettings } from "./app/settings"
import type { CropRect, PresetCategory, QueueItem } from "./app/types"
import { runQueue } from "./batch/queue"
import { buildZip } from "./batch/zip"
import { detectAvifSupport } from "./image/encode"
import { megapixels, resolveDimensions } from "./image/dimensions"
import { formatExifSummary, readExif } from "./image/metadata"
import { processImage } from "./image/process"
import {
  ORIGINAL_PRESET,
  findPreset,
  getPresetsForCategory,
  type PresetOption,
} from "./presets/catalog"

registerSW({ immediate: true })

const app = document.querySelector<HTMLDivElement>("#app")!
let settings = loadSettings()
let queue: QueueItem[] = []
let selectedId: string | null = null
let cropRect: CropRect | null = null
let cropMode = false
let abortCtrl: AbortController | null = null
let beforeObjectUrl: string | null = null
let afterObjectUrl: string | null = null

function uid() {
  return crypto.randomUUID()
}

function selectedItem(): QueueItem | undefined {
  return queue.find((q) => q.id === selectedId)
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function revokePreviewUrls() {
  if (beforeObjectUrl) URL.revokeObjectURL(beforeObjectUrl)
  if (afterObjectUrl) URL.revokeObjectURL(afterObjectUrl)
  beforeObjectUrl = afterObjectUrl = null
}

function renderPresetOptions(category: PresetCategory, allowUpscale: boolean): PresetOption[] {
  return getPresetsForCategory(category, allowUpscale)
}

function syncPresetSelect(
  select: HTMLSelectElement,
  category: PresetCategory,
  presetId: string,
  allowUpscale: boolean,
): string {
  const options = renderPresetOptions(category, allowUpscale)
  let id = presetId
  if (!options.some((o) => o.id === id)) {
    id = options[0]?.id ?? ORIGINAL_PRESET.id
  }
  select.innerHTML = options.map((o) => `<option value="${o.id}">${o.label}</option>`).join("")
  select.value = id
  return id
}

function buildAllPresetsOptionsHtml(allowUpscale: boolean, selectedPresetId: string): string {
  const categories: PresetCategory[] = ["video", "longEdge", "percent", "social", "custom", "original"]
  const labels: Record<PresetCategory, string> = {
    video: "Video height",
    longEdge: "Long edge",
    percent: "Percent",
    social: "Social",
    custom: "Custom",
    original: "Original",
  }
  return categories
    .map((cat) => {
      const opts = getPresetsForCategory(cat, allowUpscale)
      const inner = opts
        .map((o) => `<option value="${o.id}" ${o.id === selectedPresetId ? "selected" : ""}>${o.label}</option>`)
        .join("")
      return `<optgroup label="${labels[cat]}">${inner}</optgroup>`
    })
    .join("")
}

function presetIdToCategory(presetId: string): PresetCategory {
  const p = findPreset(presetId)
  return p?.category ?? "video"
}

function updateQueueItem(id: string, patch: Partial<QueueItem>) {
  const idx = queue.findIndex((q) => q.id === id)
  if (idx < 0) return
  queue[idx] = { ...queue[idx], ...patch }
}

function buildShell() {
  app.innerHTML = `
  <header class="header">
    <div>
      <h1>Image Shrink</h1>
      <p class="tagline">Resize & compress locally — files never leave your device</p>
    </div>
    <span class="badge">Local processing only</span>
  </header>
  <main class="layout">
    <section class="panel controls">
      <div id="dropzone" class="dropzone" tabindex="0">
        <p><strong>Drop images</strong> or click to browse</p>
        <input id="fileInput" type="file" accept="image/*" multiple hidden />
      </div>
      <p class="section-label">Default settings (all files)</p>
      <div class="field">
        <label for="category">Preset category</label>
        <select id="category"></select>
      </div>
      <div class="field">
        <label for="preset">Preset</label>
        <select id="preset"></select>
      </div>
      <div id="customFields" class="custom-fields hidden">
        <div class="grid-2">
          <div class="field"><label>Max width</label><input id="customMaxW" type="number" min="1" placeholder="optional" /></div>
          <div class="field"><label>Max height</label><input id="customMaxH" type="number" min="1" placeholder="optional" /></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Exact width</label><input id="customExactW" type="number" min="1" placeholder="optional" /></div>
          <div class="field"><label>Exact height</label><input id="customExactH" type="number" min="1" placeholder="optional" /></div>
        </div>
        <div class="field">
          <label for="customFit">Exact fit</label>
          <select id="customFit">
            <option value="contain">Contain</option>
            <option value="cover">Cover</option>
            <option value="stretch">Stretch</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label for="format">Format</label>
        <select id="format">
          <option value="png">PNG</option>
          <option value="webp">WebP</option>
          <option value="jpeg">JPEG</option>
          <option value="avif">AVIF</option>
        </select>
      </div>
      <div class="field row">
        <label><input id="removeBackground" type="checkbox" /> Remove background (AI, exports PNG)</label>
      </div>
      <p id="bgRemoveNote" class="note hidden">First use downloads a small AI model (~40MB, cached). Processing may take longer.</p>
      <div class="field">
        <label for="quality">Quality <span id="qualityVal"></span></label>
        <input id="quality" type="range" min="5" max="100" />
      </div>
      <div class="field">
        <label for="targetKb">Target file size (KB, optional)</label>
        <input id="targetKb" type="number" min="1" placeholder="e.g. 200" />
      </div>
      <div class="field row">
        <label><input id="allowUpscale" type="checkbox" /> Allow upscale</label>
      </div>
      <div class="field row">
        <label><input id="stripMeta" type="checkbox" /> Strip metadata on export</label>
      </div>
      <div class="field">
        <label for="socialFit">Social fit</label>
        <select id="socialFit">
          <option value="cover">Cover (crop)</option>
          <option value="contain">Contain (letterbox)</option>
        </select>
      </div>
      <div class="field row">
        <label><input id="cropMode" type="checkbox" /> Crop mode (draw on preview)</label>
      </div>
      <p id="dimNote" class="note"></p>
      <p id="warnNote" class="warn hidden"></p>
      <div class="actions">
        <button id="btnProcess" type="button" class="primary">Process selected</button>
        <button id="btnProcessAll" type="button">Process all</button>
        <button id="btnCancel" type="button" disabled>Cancel</button>
      </div>
      <div class="actions">
        <button id="btnDownload" type="button" disabled>Download</button>
        <button id="btnZip" type="button" disabled>Download ZIP</button>
      </div>
    </section>
    <section class="panel preview-panel">
      <div class="compare-wrap">
        <div class="compare">
          <img id="imgBefore" alt="Before" />
          <div id="afterClip" class="after-clip"><img id="imgAfter" alt="After" /></div>
          <input id="compareSlider" type="range" min="0" max="100" value="50" class="compare-slider" />
        </div>
        <canvas id="cropCanvas" class="crop-canvas hidden"></canvas>
      </div>
      <dl id="stats" class="stats"></dl>
      <details class="exif"><summary>EXIF</summary><p id="exifText">—</p></details>
      <div id="itemOverridePanel" class="item-override hidden">
        <p class="section-label">Selected file overrides</p>
        <div class="field row">
          <label><input id="itemUseOverride" type="checkbox" /> Use custom preset for this file</label>
        </div>
        <div id="itemOverrideFields" class="item-override-fields hidden">
          <div class="field">
            <label for="itemCategory">Category</label>
            <select id="itemCategory"></select>
          </div>
          <div class="field">
            <label for="itemPreset">Preset</label>
            <select id="itemPreset"></select>
          </div>
          <div class="grid-2">
            <div class="field">
              <label for="itemFormat">Format</label>
              <select id="itemFormat">
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
                <option value="jpeg">JPEG</option>
                <option value="avif">AVIF</option>
              </select>
            </div>
            <div class="field">
              <label for="itemQuality">Quality</label>
              <input id="itemQuality" type="number" min="5" max="100" />
            </div>
          </div>
        </div>
      </div>
      <p class="section-label queue-heading">Batch queue</p>
      <ul id="queueList" class="queue"></ul>
    </section>
  </main>
  `
}

function readSettingsFromForm() {
  const q = (id: string) => document.getElementById(id) as HTMLInputElement | HTMLSelectElement
  settings.category = (q("category") as HTMLSelectElement).value as AppSettings["category"]
  settings.presetId = (q("preset") as HTMLSelectElement).value
  settings.format = (q("format") as HTMLSelectElement).value as AppSettings["format"]
  settings.quality = Number((q("quality") as HTMLInputElement).value)
  settings.allowUpscale = (q("allowUpscale") as HTMLInputElement).checked
  settings.stripMetadata = (q("stripMeta") as HTMLInputElement).checked
  settings.removeBackground = (q("removeBackground") as HTMLInputElement).checked
  settings.socialFit = (q("socialFit") as HTMLSelectElement).value as AppSettings["socialFit"]
  settings.customFit = (q("customFit") as HTMLSelectElement).value as AppSettings["customFit"]
  const t = (q("targetKb") as HTMLInputElement).value
  settings.targetSizeKb = t ? Number(t) : null
  const parseOpt = (id: string) => {
    const v = (q(id) as HTMLInputElement).value
    return v ? Number(v) : null
  }
  settings.customMaxWidth = parseOpt("customMaxW")
  settings.customMaxHeight = parseOpt("customMaxH")
  settings.customExactWidth = parseOpt("customExactW")
  settings.customExactHeight = parseOpt("customExactH")
  saveSettings(settings)
}

function applySettingsToForm() {
  const setVal = (id: string, val: string | number | boolean) => {
    const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null
    if (!el) return
    if (el instanceof HTMLInputElement && el.type === "checkbox") el.checked = Boolean(val)
    else (el as HTMLInputElement).value = String(val)
  }
  setVal("category", settings.category)
  settings.presetId = syncPresetSelect(
    document.getElementById("preset") as HTMLSelectElement,
    settings.category,
    settings.presetId,
    settings.allowUpscale,
  )
  setVal("format", settings.format)
  setVal("quality", settings.quality)
  setVal("allowUpscale", settings.allowUpscale)
  setVal("stripMeta", settings.stripMetadata)
  setVal("removeBackground", settings.removeBackground)
  document.getElementById("bgRemoveNote")!.classList.toggle("hidden", !settings.removeBackground)
  const formatSel = document.getElementById("format") as HTMLSelectElement
  formatSel.disabled = settings.removeBackground
  if (settings.removeBackground) formatSel.value = "png"
  setVal("socialFit", settings.socialFit)
  setVal("customFit", settings.customFit)
  setVal("customMaxW", settings.customMaxWidth ?? "")
  setVal("customMaxH", settings.customMaxHeight ?? "")
  setVal("customExactW", settings.customExactWidth ?? "")
  setVal("customExactH", settings.customExactHeight ?? "")
  setVal("targetKb", settings.targetSizeKb ?? "")
  document.getElementById("qualityVal")!.textContent = String(settings.quality)
  const customEl = document.getElementById("customFields")!
  customEl.classList.toggle("hidden", settings.category !== "custom")
  syncItemOverridePanel()
  void updateDimNote()
}

function readItemOverrideFromForm(): void {
  const item = selectedItem()
  if (!item) return
  const useOverride = (document.getElementById("itemUseOverride") as HTMLInputElement).checked
  if (!useOverride) {
    updateQueueItem(item.id, { useOverride: false })
    return
  }
  const category = (document.getElementById("itemCategory") as HTMLSelectElement).value as PresetCategory
  let presetId = (document.getElementById("itemPreset") as HTMLSelectElement).value
  presetId = syncPresetSelect(
    document.getElementById("itemPreset") as HTMLSelectElement,
    category,
    presetId,
    settings.allowUpscale,
  )
  const format = (document.getElementById("itemFormat") as HTMLSelectElement).value as AppSettings["format"]
  const quality = Number((document.getElementById("itemQuality") as HTMLInputElement).value)
  updateQueueItem(item.id, {
    useOverride: true,
    override: { category, presetId, format, quality },
  })
}

function syncItemOverridePanel() {
  const panel = document.getElementById("itemOverridePanel")!
  const fields = document.getElementById("itemOverrideFields")!
  const item = selectedItem()
  if (!item) {
    panel.classList.add("hidden")
    return
  }
  panel.classList.remove("hidden")

  const itemCatSel = document.getElementById("itemCategory") as HTMLSelectElement
  if (!itemCatSel.options.length) {
    const categories: PresetCategory[] = ["video", "longEdge", "percent", "social", "custom", "original"]
    itemCatSel.innerHTML = categories
      .map((c) => `<option value="${c}">${c === "longEdge" ? "Long edge" : c.charAt(0).toUpperCase() + c.slice(1)}</option>`)
      .join("")
  }

  const useOverride = Boolean(item.useOverride)
  ;(document.getElementById("itemUseOverride") as HTMLInputElement).checked = useOverride
  fields.classList.toggle("hidden", !useOverride)

  const base = item.useOverride && item.override ? item.override : createOverrideFromGlobal(settings)
  itemCatSel.value = base.category
  syncPresetSelect(
    document.getElementById("itemPreset") as HTMLSelectElement,
    base.category,
    base.presetId,
    settings.allowUpscale,
  )
  ;(document.getElementById("itemFormat") as HTMLSelectElement).value = base.format
  ;(document.getElementById("itemQuality") as HTMLInputElement).value = String(base.quality)
}

async function updateDimNote() {
  const note = document.getElementById("dimNote")!
  const warn = document.getElementById("warnNote")!
  const item = selectedItem()
  if (!item) {
    note.textContent = "Add an image to see output dimensions estimate."
    warn.classList.add("hidden")
    return
  }
  const eff = getEffectiveSettings(settings, item)
  const preset = findPreset(eff.presetId)
  if (!preset) return
  const bmp = await createImageBitmap(item.file)
  const dim = resolveDimensions({
    sourceWidth: bmp.width,
    sourceHeight: bmp.height,
    preset,
    allowUpscale: settings.allowUpscale,
    socialFit: settings.socialFit,
    custom: {
      maxWidth: settings.customMaxWidth ?? undefined,
      maxHeight: settings.customMaxHeight ?? undefined,
      exactWidth: settings.customExactWidth ?? undefined,
      exactHeight: settings.customExactHeight ?? undefined,
      customFit: settings.customFit,
    },
  })
  bmp.close()
  note.textContent = `Estimated output: ${dim.width}×${dim.height} · ${megapixels(dim.width, dim.height).toFixed(2)} MP`
  warn.classList.toggle("hidden", !dim.upscaled)
  if (dim.upscaled) warn.textContent = "Upscale enabled: output has more pixels than the source. Detail cannot be invented."
  if (dim.dimensionsUnchanged && preset.category !== "original") {
    note.textContent += " · Already smaller than preset — dimensions unchanged."
  }
  if (item.useOverride) {
    note.textContent += " · Using per-file preset override."
  }
}

function renderQueue() {
  const ul = document.getElementById("queueList")!
  ul.innerHTML = queue
    .map((q) => {
      const eff = getEffectiveSettings(settings, q)
      const presetLabel = findPreset(eff.presetId)?.label ?? eff.presetId
      const overrideSummary = q.useOverride
        ? `<span class="queue-badge">Custom · ${presetLabel} · ${eff.format.toUpperCase()} ${eff.quality}</span>`
        : `<span class="queue-badge muted">Default · ${presetLabel}</span>`
      return `<li class="queue-item ${q.id === selectedId ? "active" : ""}" data-id="${q.id}">
        <div class="queue-item-top">
          <span class="queue-name">${q.file.name}</span>
          <span class="status ${q.status}">${q.status}${q.error ? `: ${q.error}` : ""}${q.result ? ` · ${formatBytes(q.result.blob.size)}` : ""}</span>
        </div>
        <div class="queue-item-controls" data-id="${q.id}">
          <label class="queue-inline-check"><input type="checkbox" data-role="override-toggle" ${q.useOverride ? "checked" : ""} /> Custom</label>
          <select data-role="row-preset" class="queue-row-preset" ${q.useOverride ? "" : "disabled"}>${buildAllPresetsOptionsHtml(settings.allowUpscale, eff.presetId)}</select>
        </div>
        ${overrideSummary}
      </li>`
    })
    .join("")

  ul.querySelectorAll(".queue-item-top").forEach((row) => {
    row.addEventListener("click", () => {
      const li = row.closest(".queue-item") as HTMLElement
      selectedId = li.dataset.id ?? null
      renderQueue()
      syncItemOverridePanel()
      void refreshPreview()
      void updateDimNote()
    })
  })

  ul.querySelectorAll(".queue-item-controls").forEach((controls) => {
    const id = (controls as HTMLElement).dataset.id!
    const toggle = controls.querySelector('[data-role="override-toggle"]') as HTMLInputElement
    const presetSel = controls.querySelector('[data-role="row-preset"]') as HTMLSelectElement

    toggle.addEventListener("click", (e) => e.stopPropagation())
    presetSel.addEventListener("click", (e) => e.stopPropagation())
    presetSel.addEventListener("mousedown", (e) => e.stopPropagation())

    toggle.addEventListener("change", () => {
      const idx = queue.findIndex((x) => x.id === id)
      if (idx < 0) return
      if (toggle.checked) {
        const o = createOverrideFromGlobal(settings)
        queue[idx] = { ...queue[idx], useOverride: true, override: o }
      } else {
        queue[idx] = { ...queue[idx], useOverride: false }
      }
      if (selectedId === id) syncItemOverridePanel()
      renderQueue()
      void updateDimNote()
    })

    presetSel.addEventListener("change", () => {
      const idx = queue.findIndex((x) => x.id === id)
      if (idx < 0) return
      const presetId = presetSel.value
      const category = presetIdToCategory(presetId)
      const prev = queue[idx].override ?? createOverrideFromGlobal(settings)
      queue[idx] = {
        ...queue[idx],
        useOverride: true,
        override: { ...prev, category, presetId },
      }
      if (selectedId === id) syncItemOverridePanel()
      renderQueue()
      void updateDimNote()
    })
  })
  const done = queue.filter((q) => q.status === "done" && q.result)
  ;(document.getElementById("btnDownload") as HTMLButtonElement).disabled = !selectedItem()?.result
  ;(document.getElementById("btnZip") as HTMLButtonElement).disabled = done.length === 0
}

async function refreshPreview() {
  revokePreviewUrls()
  const item = selectedItem()
  const imgBefore = document.getElementById("imgBefore") as HTMLImageElement
  const imgAfter = document.getElementById("imgAfter") as HTMLImageElement
  const stats = document.getElementById("stats")!
  if (!item) {
    imgBefore.removeAttribute("src")
    imgAfter.removeAttribute("src")
    stats.innerHTML = ""
    document.getElementById("exifText")!.textContent = "—"
    return
  }
  beforeObjectUrl = URL.createObjectURL(item.file)
  imgBefore.src = beforeObjectUrl
  if (item.result) {
    afterObjectUrl = URL.createObjectURL(item.result.blob)
    imgAfter.src = afterObjectUrl
    const pct = ((1 - item.result.blob.size / item.file.size) * 100).toFixed(0)
    stats.innerHTML = `
      <div><dt>Original</dt><dd>${item.file.size ? formatBytes(item.file.size) : "—"}</dd></div>
      <div><dt>Output</dt><dd>${formatBytes(item.result.blob.size)} (${pct}% smaller)</dd></div>
      <div><dt>Dimensions</dt><dd>${item.result.width}×${item.result.height}</dd></div>
      <div><dt>Quality used</dt><dd>${item.result ? item.result.qualityUsed ?? settings.quality : settings.quality}</dd></div>`
  } else {
    imgAfter.removeAttribute("src")
    stats.innerHTML = `<div><dt>Original size</dt><dd>${formatBytes(item.file.size)}</dd></div>`
  }
  const exif = await readExif(item.file)
  document.getElementById("exifText")!.textContent = formatExifSummary(exif)
  setupCropCanvas()
}

function setupCropCanvas() {
  const canvas = document.getElementById("cropCanvas") as HTMLCanvasElement
  const img = document.getElementById("imgBefore") as HTMLImageElement
  canvas.classList.toggle("hidden", !cropMode || !img.src)
  if (canvas.classList.contains("hidden")) return
  const rect = img.getBoundingClientRect()
  canvas.width = Math.floor(rect.width)
  canvas.height = Math.floor(rect.height)
  canvas.style.width = `${rect.width}px`
  canvas.style.height = `${rect.height}px`
  const ctx = canvas.getContext("2d")!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (cropRect) {
    ctx.strokeStyle = "#38bdf8"
    ctx.lineWidth = 2
    ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height)
  }
}

function addFiles(files: FileList | File[]) {
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue
    queue.push({ id: uid(), file, status: "pending" })
  }
  if (!selectedId && queue.length) selectedId = queue[0].id
  renderQueue()
  void refreshPreview()
  void updateDimNote()
}

async function processOne(id: string) {
  const idx = queue.findIndex((q) => q.id === id)
  if (idx < 0) return
  const item = queue[idx]
  queue[idx] = { ...item, status: "processing" }
  renderQueue()
  try {
    readSettingsFromForm()
    readItemOverrideFromForm()
    const itemSettings = getEffectiveSettings(settings, queue[idx])
    const result = await processImage({
      file: item.file,
      settings: itemSettings,
      crop: cropRect,
      signal: abortCtrl?.signal,
    })
    queue[idx] = { ...queue[idx], status: "done", result }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed"
    queue[idx] = { ...queue[idx], status: "error", error: msg }
  }
  renderQueue()
  void refreshPreview()
}

async function wireEvents() {
  const categories: AppSettings["category"][] = ["video", "longEdge", "percent", "social", "custom", "original"]
  const catSel = document.getElementById("category") as HTMLSelectElement
  catSel.innerHTML = categories
    .map((c) => `<option value="${c}">${c === "longEdge" ? "Long edge" : c.charAt(0).toUpperCase() + c.slice(1)}</option>`)
    .join("")

  applySettingsToForm()

  const avifOk = await detectAvifSupport()
  if (!avifOk) {
    document.querySelectorAll('#format option[value="avif"], #itemFormat option[value="avif"]').forEach((el) => el.remove())
  }

  document.getElementById("dropzone")!.addEventListener("click", () => (document.getElementById("fileInput") as HTMLInputElement).click())
  document.getElementById("fileInput")!.addEventListener("change", (e) => {
    const input = e.target as HTMLInputElement
    if (input.files) addFiles(input.files)
    input.value = ""
  })
  const dz = document.getElementById("dropzone")!
  dz.addEventListener("dragover", (e) => {
    e.preventDefault()
    dz.classList.add("drag")
  })
  dz.addEventListener("dragleave", () => dz.classList.remove("drag"))
  dz.addEventListener("drop", (e) => {
    e.preventDefault()
    dz.classList.remove("drag")
    if (e.dataTransfer?.files) addFiles(e.dataTransfer.files)
  })

  const onSettingsChange = () => {
    readSettingsFromForm()
    applySettingsToForm()
    renderQueue()
    void updateDimNote()
  }
  ;["category", "preset", "format", "quality", "allowUpscale", "stripMeta", "removeBackground", "socialFit", "customFit", "targetKb", "customMaxW", "customMaxH", "customExactW", "customExactH"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", onSettingsChange)
    document.getElementById(id)?.addEventListener("input", onSettingsChange)
  })

  const onItemOverrideChange = () => {
    const item = selectedItem()
    const fields = document.getElementById("itemOverrideFields")!
    const useOverride = (document.getElementById("itemUseOverride") as HTMLInputElement).checked
    fields.classList.toggle("hidden", !useOverride)
    if (item && useOverride && !item.override) {
      updateQueueItem(item.id, { useOverride: true, override: createOverrideFromGlobal(settings) })
      syncItemOverridePanel()
    }
    readItemOverrideFromForm()
    renderQueue()
    void updateDimNote()
  }
  document.getElementById("itemUseOverride")!.addEventListener("change", onItemOverrideChange)
  ;["itemCategory", "itemPreset", "itemFormat", "itemQuality"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", onItemOverrideChange)
    document.getElementById(id)?.addEventListener("input", onItemOverrideChange)
  })
  document.getElementById("itemCategory")!.addEventListener("change", () => {
    const category = (document.getElementById("itemCategory") as HTMLSelectElement).value as PresetCategory
    syncPresetSelect(
      document.getElementById("itemPreset") as HTMLSelectElement,
      category,
      getPresetsForCategory(category, settings.allowUpscale)[0]?.id ?? ORIGINAL_PRESET.id,
      settings.allowUpscale,
    )
  })

  document.getElementById("compareSlider")!.addEventListener("input", (e) => {
    const v = Number((e.target as HTMLInputElement).value)
    const clip = document.getElementById("afterClip") as HTMLElement
    clip.style.clipPath = `inset(0 ${100 - v}% 0 0)`
  })

  document.getElementById("cropMode")!.addEventListener("change", (e) => {
    cropMode = (e.target as HTMLInputElement).checked
    cropRect = null
    setupCropCanvas()
  })

  const canvas = document.getElementById("cropCanvas") as HTMLCanvasElement
  let dragStart: { x: number; y: number } | null = null
  canvas.addEventListener("mousedown", (e) => {
    if (!cropMode) return
    dragStart = { x: e.offsetX, y: e.offsetY }
  })
  canvas.addEventListener("mouseup", (e) => {
    if (!dragStart) return
    const x = Math.min(dragStart.x, e.offsetX)
    const y = Math.min(dragStart.y, e.offsetY)
    const width = Math.abs(e.offsetX - dragStart.x)
    const height = Math.abs(e.offsetY - dragStart.y)
    dragStart = null
    if (width < 4 || height < 4) return
    const img = document.getElementById("imgBefore") as HTMLImageElement
    const scaleX = img.naturalWidth / canvas.width
    const scaleY = img.naturalHeight / canvas.height
    cropRect = { x: x * scaleX, y: y * scaleY, width: width * scaleX, height: height * scaleY }
    setupCropCanvas()
  })

  document.getElementById("btnProcess")!.addEventListener("click", async () => {
    if (!selectedId) return
    abortCtrl = new AbortController()
    setProcessing(true)
    await processOne(selectedId)
    setProcessing(false)
  })

  document.getElementById("btnProcessAll")!.addEventListener("click", async () => {
    abortCtrl = new AbortController()
    setProcessing(true)
    readSettingsFromForm()
    queue = await runQueue({
      items: queue,
      settings,
      crop: cropRect,
      signal: abortCtrl.signal,
      onUpdate: (items) => {
        queue = items
        renderQueue()
      },
    })
    setProcessing(false)
    void refreshPreview()
  })

  document.getElementById("btnCancel")!.addEventListener("click", () => abortCtrl?.abort())

  document.getElementById("btnDownload")!.addEventListener("click", () => {
    const r = selectedItem()?.result
    if (!r) return
    const a = document.createElement("a")
    a.href = URL.createObjectURL(r.blob)
    a.download = r.fileName
    a.click()
  })

  document.getElementById("btnZip")!.addEventListener("click", async () => {
    const done = queue.filter((q) => q.status === "done" && q.result).map((q) => q.result!)
    const blob = await buildZip(done)
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "images.zip"
    a.click()
  })

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && cropMode) {
      cropMode = false
      ;(document.getElementById("cropMode") as HTMLInputElement).checked = false
      cropRect = null
      setupCropCanvas()
    }
  })
}

function setProcessing(on: boolean) {
  ;(document.getElementById("btnCancel") as HTMLButtonElement).disabled = !on
  ;(document.getElementById("btnProcess") as HTMLButtonElement).disabled = on
  ;(document.getElementById("btnProcessAll") as HTMLButtonElement).disabled = on
}

buildShell()
void wireEvents()


