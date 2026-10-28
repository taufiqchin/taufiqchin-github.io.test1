import type { DimensionResult } from "../app/types"
import Pica from "pica"

const pica = Pica()

export async function resizeCanvas(
  source: HTMLCanvasElement,
  targetW: number,
  targetH: number,
): Promise<HTMLCanvasElement> {
  if (source.width === targetW && source.height === targetH) return source

  const dest = document.createElement("canvas")
  dest.width = targetW
  dest.height = targetH
  await pica.resize(source, dest, { unsharpAmount: 0 })
  return dest
}

export async function renderWithLetterbox(
  source: HTMLCanvasElement,
  dim: DimensionResult,
): Promise<HTMLCanvasElement> {
  if (!dim.letterbox) {
    return resizeCanvas(source, dim.width, dim.height)
  }
  const { padX, padY, boxW, boxH } = dim.letterbox
  const scaled = await resizeCanvas(source, boxW - padX * 2, boxH - padY * 2)
  const out = document.createElement("canvas")
  out.width = boxW
  out.height = boxH
  const ctx = out.getContext("2d")
  if (!ctx) throw new Error("Canvas not supported")
  ctx.fillStyle = "#00000000"
  ctx.clearRect(0, 0, boxW, boxH)
  ctx.drawImage(scaled, padX, padY)
  return out
}

export async function renderSocialCover(source: HTMLCanvasElement, boxW: number, boxH: number): Promise<HTMLCanvasElement> {
  const sw = source.width
  const sh = source.height
  const scale = Math.max(boxW / sw, boxH / sh)
  const rw = Math.round(sw * scale)
  const rh = Math.round(sh * scale)
  const scaled = await resizeCanvas(source, rw, rh)
  const out = document.createElement("canvas")
  out.width = boxW
  out.height = boxH
  const ctx = out.getContext("2d")
  if (!ctx) throw new Error("Canvas not supported")
  const sx = Math.max(0, Math.floor((rw - boxW) / 2))
  const sy = Math.max(0, Math.floor((rh - boxH) / 2))
  ctx.drawImage(scaled, sx, sy, boxW, boxH, 0, 0, boxW, boxH)
  return out
}
