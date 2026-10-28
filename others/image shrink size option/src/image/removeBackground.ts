/** Lazy-loads ONNX model on first use (may download ~40MB once, cached by browser). */
export async function removeBackgroundFromCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  const { removeBackground } = await import("@imgly/background-removal")
  const blob = await removeBackground(canvas, {
    output: { format: "image/png", quality: 1 },
  })
  if (!(blob instanceof Blob)) {
    throw new Error("Background removal failed")
  }
  return blob
}
