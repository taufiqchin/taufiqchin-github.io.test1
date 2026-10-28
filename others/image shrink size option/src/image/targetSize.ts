import type { OutputFormat } from "../app/types"
import { canvasToBlob } from "./encode"

const MAX_ITER = 8

export async function encodeToTargetSize(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  targetBytes: number,
  startQuality: number,
): Promise<{ blob: Blob; quality: number; reached: boolean }> {
  if (format === "png") {
    const blob = await canvasToBlob(canvas, format, 100)
    return { blob, quality: 100, reached: blob.size <= targetBytes }
  }

  let lo = 5
  let hi = Math.min(100, Math.max(10, startQuality))
  let bestBlob = await canvasToBlob(canvas, format, hi)
  let bestQ = hi

  if (bestBlob.size <= targetBytes) {
    return { blob: bestBlob, quality: bestQ, reached: true }
  }

  for (let i = 0; i < MAX_ITER; i++) {
    const mid = Math.floor((lo + hi) / 2)
    const blob = await canvasToBlob(canvas, format, mid)
    if (blob.size <= targetBytes) {
      bestBlob = blob
      bestQ = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  return { blob: bestBlob, quality: bestQ, reached: bestBlob.size <= targetBytes }
}
