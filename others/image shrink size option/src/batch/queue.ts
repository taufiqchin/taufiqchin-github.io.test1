import { getEffectiveSettings } from "../app/resolveSettings"
import type { AppSettings } from "../app/settings"
import type { CropRect, QueueItem } from "../app/types"
import { processImage } from "../image/process"

export interface RunQueueOptions {
  items: QueueItem[]
  settings: AppSettings
  crop: CropRect | null
  onUpdate: (items: QueueItem[]) => void
  signal: AbortSignal
}

export async function runQueue(opts: RunQueueOptions): Promise<QueueItem[]> {
  const { settings, crop, onUpdate, signal } = opts
  const items = [...opts.items]

  for (let i = 0; i < items.length; i++) {
    if (signal.aborted) {
      items[i] = { ...items[i], status: "cancelled" }
      onUpdate([...items])
      continue
    }

    items[i] = { ...items[i], status: "processing", error: undefined }
    onUpdate([...items])

    try {
      const itemSettings = getEffectiveSettings(settings, items[i])
      const result = await processImage({
        file: items[i].file,
        settings: itemSettings,
        crop,
        signal,
      })
      items[i] = {
        ...items[i],
        status: "done",
        result,
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Processing failed"
      if (e instanceof DOMException && e.name === "AbortError") {
        items[i] = { ...items[i], status: "cancelled" }
      } else {
        items[i] = { ...items[i], status: "error", error: msg }
      }
    }
    onUpdate([...items])
  }

  return items
}
