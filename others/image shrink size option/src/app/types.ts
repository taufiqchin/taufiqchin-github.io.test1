export type PresetCategory =
  | "video"
  | "longEdge"
  | "percent"
  | "social"
  | "custom"
  | "original"

export type OutputFormat = "webp" | "jpeg" | "png" | "avif"
export type SocialFit = "cover" | "contain"
export type CustomFit = "contain" | "cover" | "stretch"

export interface CropRect { x: number; y: number; width: number; height: number }

export interface DimensionResult {
  width: number
  height: number
  upscaled: boolean
  dimensionsUnchanged: boolean
  letterbox?: { padX: number; padY: number; boxW: number; boxH: number }
}

export interface ProcessedImage {
  blob: Blob
  width: number
  height: number
  fileName: string
  mime: string
  qualityUsed?: number
  targetReached?: boolean
}

export type QueueStatus = "pending" | "processing" | "done" | "error" | "cancelled"

export interface QueueItemOverride {
  category: PresetCategory
  presetId: string
  format: OutputFormat
  quality: number
}

export interface QueueItem {
  id: string
  file: File
  status: QueueStatus
  error?: string
  result?: ProcessedImage
  /** When true, `override` replaces preset/format/quality for this file only. */
  useOverride?: boolean
  override?: QueueItemOverride
}

export interface ExifInfo {
  orientation?: number
  make?: string
  model?: string
}

