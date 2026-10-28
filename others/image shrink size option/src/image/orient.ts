export function applyOrientation(canvas: HTMLCanvasElement, orientation: number | undefined): HTMLCanvasElement {
  if (!orientation || orientation === 1) return canvas

  const w = canvas.width
  const h = canvas.height
  const out = document.createElement("canvas")
  const ctx = out.getContext("2d")
  if (!ctx) return canvas

  switch (orientation) {
    case 2:
      out.width = w
      out.height = h
      ctx.translate(w, 0)
      ctx.scale(-1, 1)
      break
    case 3:
      out.width = w
      out.height = h
      ctx.translate(w, h)
      ctx.rotate(Math.PI)
      break
    case 4:
      out.width = w
      out.height = h
      ctx.translate(0, h)
      ctx.scale(1, -1)
      break
    case 5:
      out.width = h
      out.height = w
      ctx.rotate(0.5 * Math.PI)
      ctx.scale(1, -1)
      break
    case 6:
      out.width = h
      out.height = w
      ctx.rotate(0.5 * Math.PI)
      ctx.translate(0, -h)
      break
    case 7:
      out.width = h
      out.height = w
      ctx.rotate(0.5 * Math.PI)
      ctx.translate(w, -h)
      ctx.scale(-1, 1)
      break
    case 8:
      out.width = h
      out.height = w
      ctx.rotate(-0.5 * Math.PI)
      ctx.translate(-w, 0)
      break
    default:
      return canvas
  }

  ctx.drawImage(canvas, 0, 0)
  return out
}
