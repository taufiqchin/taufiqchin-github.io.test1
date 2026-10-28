import type { CropRect } from "../app/types"

const MAX_PIXELS = 8192 * 8192

export async function decodeImageFile(file: File): Promise<{ bitmap: ImageBitmap; width: number; height: number }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Unsupported file type")
  }
  const bitmap = await createImageBitmap(file)
  if (bitmap.width * bitmap.height > MAX_PIXELS) {
    bitmap.close()
    throw new Error("Image is too large to process safely in the browser")
  }
  return { bitmap, width: bitmap.width, height: bitmap.height }
}

export function bitmapToCanvas(bitmap: ImageBitmap): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas not supported")
  ctx.drawImage(bitmap, 0, 0)
  return canvas
}

export function applyCropToCanvas(source: HTMLCanvasElement, crop: CropRect): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(crop.width))
  canvas.height = Math.max(1, Math.round(crop.height))
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas not supported")
  ctx.drawImage(
    source,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )
  return canvas
}
