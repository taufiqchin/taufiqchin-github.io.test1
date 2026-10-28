import type { OutputFormat, PresetCategory, SocialFit, CustomFit } from "./types"

const STORAGE_KEY = "image-shrink-settings-v2"

export interface AppSettings {
  category: PresetCategory
  presetId: string
  format: OutputFormat
  quality: number
  allowUpscale: boolean
  stripMetadata: boolean
  socialFit: SocialFit
  customMaxWidth: number | null
  customMaxHeight: number | null
  customExactWidth: number | null
  customExactHeight: number | null
  customFit: CustomFit
  targetSizeKb: number | null
  removeBackground: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  category: "video",
  presetId: "v1080",
  format: "png",
  quality: 85,
  allowUpscale: false,
  stripMetadata: true,
  removeBackground: false,
  socialFit: "cover",
  customMaxWidth: null,
  customMaxHeight: null,
  customExactWidth: null,
  customExactHeight: null,
  customFit: "contain",
  targetSizeKb: null,
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
