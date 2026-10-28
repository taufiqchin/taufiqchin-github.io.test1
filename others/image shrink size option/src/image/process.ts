import type { CropRect, DimensionResult, OutputFormat, ProcessedImage, SocialFit } from "../app/types"
import type { AppSettings } from "../app/settings"
import { findPreset } from "../presets/catalog"
import { applyCropToCanvas, bitmapToCanvas, decodeImageFile } from "./decode"
import { resolveDimensions, type CustomLimits } from "./dimensions"
import { canvasToBlob, extensionForFormat } from "./encode"
import { readExif } from "./metadata"
import { applyOrientation } from "./orient"
import { renderSocialCover, renderWithLetterbox, resizeCanvas } from "./resize"
import { removeBackgroundFromCanvas } from "./removeBackground"
import { encodeToTargetSize } from "./targetSize"

export interface ProcessInput {
  file: File
  settings: AppSettings
  crop?: CropRect | null
  signal?: AbortSignal
}

export interface ProcessOutput extends ProcessedImage {
  dimensionInfo: DimensionResult
  exifSummary: string
  qualityUsed: number
  targetReached?: boolean
}

function settingsToCustom(settings: AppSettings): CustomLimits {
  return {
    maxWidth: settings.customMaxWidth ?? undefined,
    maxHeight: settings.customMaxHeight ?? undefined,
    exactWidth: settings.customExactWidth ?? undefined,
    exactHeight: settings.customExactHeight ?? undefined,
    customFit: settings.customFit,
  }
}

function baseName(name: string): string {
  const i = name.lastIndexOf(".")
  return i > 0 ? name.slice(0, i) : name
}

export async function processImage(input: ProcessInput): Promise<ProcessOutput> {
  const { file, settings, crop, signal } = input
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError")

  const preset = findPreset(settings.presetId)
  if (!preset) throw new Error("Unknown preset")

  const exif = await readExif(file)
  const { bitmap } = await decodeImageFile(file)
  if (signal?.aborted) {
    bitmap.close()
    throw new DOMException("Aborted", "AbortError")
  }

  let canvas = bitmapToCanvas(bitmap)
  bitmap.close()

  canvas = applyOrientation(canvas, exif.orientation)

  if (crop && crop.width > 0 && crop.height > 0) {
    canvas = applyCropToCanvas(canvas, crop)
  }

  const srcW = canvas.width
  const srcH = canvas.height

  const dim = resolveDimensions({
    sourceWidth: srcW,
    sourceHeight: srcH,
    preset,
    allowUpscale: settings.allowUpscale,
    socialFit: settings.socialFit as SocialFit,
    custom: settingsToCustom(settings),
  })

  let outputCanvas = canvas

  if (preset.category === "social" && settings.socialFit === "cover" && !dim.letterbox) {
    outputCanvas = await renderSocialCover(canvas, dim.width, dim.height)
  } else if (dim.letterbox) {
    outputCanvas = await renderWithLetterbox(canvas, dim)
  } else if (dim.width !== srcW || dim.height !== srcH) {
    outputCanvas = await resizeCanvas(canvas, dim.width, dim.height)
  } else if (
    preset.category === "custom" &&
    settings.customFit === "stretch" &&
    settings.customExactWidth &&
    settings.customExactHeight
  ) {
    outputCanvas = await resizeCanvas(canvas, dim.width, dim.height)
  }

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError")

  let blob: Blob
  let qualityUsed = settings.quality
  let targetReached: boolean | undefined
  const exportFormat: OutputFormat = settings.removeBackground ? "png" : (settings.format as OutputFormat)

  if (settings.removeBackground) {
    blob = await removeBackgroundFromCanvas(outputCanvas)
    qualityUsed = 100
  } else if (settings.targetSizeKb && exportFormat !== "png") {
    const targetBytes = settings.targetSizeKb * 1024
    const enc = await encodeToTargetSize(outputCanvas, exportFormat, targetBytes, settings.quality)
    blob = enc.blob
    qualityUsed = enc.quality
    targetReached = enc.reached
  } else {
    blob = await canvasToBlob(outputCanvas, exportFormat, settings.quality)
  }

  const ext = extensionForFormat(exportFormat)
  const fileName = `${baseName(file.name)}.${ext}`

  return {
    blob,
    width: outputCanvas.width,
    height: outputCanvas.height,
    fileName,
    mime: blob.type,
    qualityUsed,
    targetReached,
    dimensionInfo: dim,
    exifSummary: settings.stripMetadata ? "Metadata stripped on export" : "Metadata may be removed by re-encode",
  }
}
