import { zipSync } from "fflate"
import type { ProcessedImage } from "../app/types"

export async function buildZip(items: ProcessedImage[]): Promise<Blob> {
  const files: Record<string, Uint8Array> = {}
  for (const item of items) {
    files[item.fileName] = new Uint8Array(await item.blob.arrayBuffer())
  }
  const zipped = zipSync(files)
  return new Blob([zipped], { type: "application/zip" })
}
