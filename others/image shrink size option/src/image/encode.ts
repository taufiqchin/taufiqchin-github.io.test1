import type { OutputFormat } from "../app/types"

const MIME: Record<OutputFormat, string> = {
  webp: "image/webp",
  jpeg: "image/jpeg",
  png: "image/png",
  avif: "image/avif",
}

export function formatToMime(format: OutputFormat): string {
  return MIME[format]
}

export function extensionForFormat(format: OutputFormat): string {
  if (format === "jpeg") return "jpg"
  return format
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  quality: number,
): Promise<Blob> {
  const mime = MIME[format]
  const q = Math.min(1, Math.max(0.01, quality / 100))

  if (format === "png") {
    return blobFromCanvas(canvas, "image/png")
  }

  try {
    return await blobFromCanvas(canvas, mime, q)
  } catch {
    if (format === "avif") {
      return blobFromCanvas(canvas, "image/webp", q)
    }
    throw new Error(`Cannot encode as ${format} in this browser`)
  }
}

function blobFromCanvas(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Encoding failed"))),
      type,
      quality,
    )
  })
}

export async function detectAvifSupport(): Promise<boolean> {
  if (typeof document === "undefined") return false
  const c = document.createElement("canvas")
  c.width = c.height = 1
  try {
    const b = await blobFromCanvas(c, "image/avif", 0.5)
    return b.type === "image/avif"
  } catch {
    return false
  }
}
