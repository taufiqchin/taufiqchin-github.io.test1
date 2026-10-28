import type { QueueItem } from "./types"
import type { AppSettings } from "./settings"

export type ItemOverrideFields = Pick<AppSettings, "category" | "presetId" | "format" | "quality">

export function createOverrideFromGlobal(global: AppSettings): ItemOverrideFields {
  return {
    category: global.category,
    presetId: global.presetId,
    format: global.format,
    quality: global.quality,
  }
}

export function getEffectiveSettings(global: AppSettings, item: QueueItem): AppSettings {
  if (!item.useOverride || !item.override) return global
  return {
    ...global,
    category: item.override.category ?? global.category,
    presetId: item.override.presetId ?? global.presetId,
    format: item.override.format ?? global.format,
    quality: item.override.quality ?? global.quality,
  }
}
