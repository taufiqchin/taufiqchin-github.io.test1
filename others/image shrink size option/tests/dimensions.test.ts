import { describe, expect, it } from "vitest"
import { resolveDimensions } from "../src/image/dimensions"
import { findPreset } from "../src/presets/catalog"

describe("resolveDimensions", () => {
  it("downscales to 720p height", () => {
    const preset = findPreset("v720")!
    const r = resolveDimensions({
      sourceWidth: 1920,
      sourceHeight: 1080,
      preset,
      allowUpscale: false,
      socialFit: "cover",
      custom: { customFit: "contain" },
    })
    expect(r.height).toBe(720)
    expect(r.width).toBe(1280)
    expect(r.upscaled).toBe(false)
  })

  it("does not upscale when preset larger than source", () => {
    const preset = findPreset("v1080")!
    const r = resolveDimensions({
      sourceWidth: 400,
      sourceHeight: 300,
      preset,
      allowUpscale: false,
      socialFit: "cover",
      custom: { customFit: "contain" },
    })
    expect(r.width).toBe(400)
    expect(r.height).toBe(300)
    expect(r.dimensionsUnchanged).toBe(true)
  })

  it("upscales with allowUpscale and percent 150", () => {
    const preset = findPreset("pct150")!
    const r = resolveDimensions({
      sourceWidth: 400,
      sourceHeight: 300,
      preset,
      allowUpscale: true,
      socialFit: "cover",
      custom: { customFit: "contain" },
    })
    expect(r.width).toBe(600)
    expect(r.height).toBe(450)
    expect(r.upscaled).toBe(true)
  })
})
