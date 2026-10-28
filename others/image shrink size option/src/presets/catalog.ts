import type { PresetCategory } from "../app/types"
import { SOCIAL_PRESETS } from "./social"

export interface PresetOption {
  id: string
  label: string
  category: PresetCategory
  videoHeight?: number
  longEdge?: number
  percent?: number
  socialId?: string
}

export const VIDEO_HEIGHT_PRESETS: PresetOption[] = [
  { id: "v240", label: "240p", category: "video", videoHeight: 240 },
  { id: "v360", label: "360p", category: "video", videoHeight: 360 },
  { id: "v480", label: "480p", category: "video", videoHeight: 480 },
  { id: "v540", label: "540p", category: "video", videoHeight: 540 },
  { id: "v720", label: "720p", category: "video", videoHeight: 720 },
  { id: "v900", label: "900p", category: "video", videoHeight: 900 },
  { id: "v1080", label: "1080p", category: "video", videoHeight: 1080 },
  { id: "v1440", label: "1440p (2K)", category: "video", videoHeight: 1440 },
  { id: "v2160", label: "2160p (4K)", category: "video", videoHeight: 2160 },
]

export const LONG_EDGE_VALUES = [640, 800, 1024, 1280, 1600, 1920, 2560, 3840, 4096]

export const LONG_EDGE_PRESETS: PresetOption[] = LONG_EDGE_VALUES.map((n) => ({
  id: `le${n}`,
  label: `${n}px long edge`,
  category: "longEdge" as PresetCategory,
  longEdge: n,
}))

export const PERCENT_REDUCE = [25, 50, 75, 90, 100]
export const PERCENT_INCREASE = [125, 150, 200]

export function getPercentPresets(allowUpscale: boolean): PresetOption[] {
  const values = allowUpscale ? [...PERCENT_REDUCE, ...PERCENT_INCREASE] : PERCENT_REDUCE
  return values.map((p) => ({
    id: `pct${p}`,
    label: `${p}%`,
    category: "percent",
    percent: p,
  }))
}

export const SOCIAL_PRESET_OPTIONS: PresetOption[] = SOCIAL_PRESETS.map((s) => ({
  id: s.id,
  label: s.label,
  category: "social",
  socialId: s.id,
}))

export const ORIGINAL_PRESET: PresetOption = {
  id: "original",
  label: "Original (compress only)",
  category: "original",
}

export function getPresetsForCategory(category: PresetCategory, allowUpscale: boolean): PresetOption[] {
  switch (category) {
    case "video":
      return VIDEO_HEIGHT_PRESETS
    case "longEdge":
      return LONG_EDGE_PRESETS
    case "percent":
      return getPercentPresets(allowUpscale)
    case "social":
      return SOCIAL_PRESET_OPTIONS
    case "original":
      return [ORIGINAL_PRESET]
    case "custom":
      return [{ id: "custom", label: "Custom limits / exact size", category: "custom" }]
  }
}

export function findPreset(id: string): PresetOption | undefined {
  const all = [
    ...VIDEO_HEIGHT_PRESETS,
    ...LONG_EDGE_PRESETS,
    ...getPercentPresets(true),
    ...SOCIAL_PRESET_OPTIONS,
    ORIGINAL_PRESET,
    { id: "custom", label: "Custom", category: "custom" as PresetCategory },
  ]
  return all.find((p) => p.id === id)
}

export function getSocialById(socialId: string) {
  return SOCIAL_PRESETS.find((s) => s.id === socialId)
}
