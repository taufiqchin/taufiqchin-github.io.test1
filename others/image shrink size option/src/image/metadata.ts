import exifr from "exifr"
import type { ExifInfo } from "../app/types"

export async function readExif(file: File): Promise<ExifInfo> {
  try {
    const data = await exifr.parse(file, { pick: ["Orientation", "Make", "Model"] })
    if (!data) return {}
    return {
      orientation: data.Orientation,
      make: data.Make,
      model: data.Model,
    }
  } catch {
    return {}
  }
}

export function formatExifSummary(info: ExifInfo): string {
  const parts: string[] = []
  if (info.make || info.model) parts.push([info.make, info.model].filter(Boolean).join(" "))
  if (info.orientation) parts.push(`Orientation ${info.orientation}`)
  return parts.length ? parts.join(" · ") : "No EXIF summary"
}
