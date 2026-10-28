import type { CustomFit, DimensionResult, SocialFit } from "../app/types"
import type { PresetOption } from "../presets/catalog"
import { getSocialById } from "../presets/catalog"

export interface CustomLimits {
  maxWidth?: number
  maxHeight?: number
  exactWidth?: number
  exactHeight?: number
  customFit: CustomFit
}

export interface ResolveOptions {
  sourceWidth: number
  sourceHeight: number
  preset: PresetOption
  allowUpscale: boolean
  socialFit: SocialFit
  custom: CustomLimits
}

function clampScale(scale: number, allowUpscale: boolean): number {
  return allowUpscale ? scale : Math.min(1, scale)
}

function scaleToHeight(w: number, h: number, targetH: number, allowUpscale: boolean) {
  const scale = clampScale(targetH / h, allowUpscale)
  const nw = Math.max(1, Math.round(w * scale))
  const nh = Math.max(1, Math.round(h * scale))
  const unchanged = !allowUpscale && scale === 1 && targetH > h
  return { width: nw, height: nh, upscaled: nw * nh > w * h, dimensionsUnchanged: unchanged && targetH > h }
}

function scaleToLongEdge(w: number, h: number, longEdge: number, allowUpscale: boolean) {
  const long = Math.max(w, h)
  const scale = clampScale(longEdge / long, allowUpscale)
  const nw = Math.max(1, Math.round(w * scale))
  const nh = Math.max(1, Math.round(h * scale))
  return {
    width: nw,
    height: nh,
    upscaled: nw * nh > w * h,
    dimensionsUnchanged: !allowUpscale && long <= longEdge,
  }
}

function scalePercent(w: number, h: number, percent: number, allowUpscale: boolean) {
  if (percent > 100 && !allowUpscale) {
    return { width: w, height: h, upscaled: false, dimensionsUnchanged: true }
  }
  const scale = percent / 100
  const nw = Math.max(1, Math.round(w * scale))
  const nh = Math.max(1, Math.round(h * scale))
  return { width: nw, height: nh, upscaled: nw * nh > w * h, dimensionsUnchanged: false }
}

function fitSocial(
  w: number,
  h: number,
  boxW: number,
  boxH: number,
  fit: SocialFit,
  allowUpscale: boolean,
): DimensionResult {
  if (fit === "cover") {
    const scale = Math.max(boxW / w, boxH / h)
    const useScale = allowUpscale ? scale : Math.min(1, scale)
    if (!allowUpscale && useScale === 1 && (w < boxW || h < boxH)) {
      return { width: w, height: h, upscaled: false, dimensionsUnchanged: true }
    }
    return { width: boxW, height: boxH, upscaled: boxW * boxH > w * h, dimensionsUnchanged: false }
  }
  const scale = Math.min(boxW / w, boxH / h)
  const useScale = allowUpscale ? scale : Math.min(1, scale)
  const nw = Math.max(1, Math.round(w * useScale))
  const nh = Math.max(1, Math.round(h * useScale))
  const padX = Math.floor((boxW - nw) / 2)
  const padY = Math.floor((boxH - nh) / 2)
  return {
    width: boxW,
    height: boxH,
    upscaled: boxW * boxH > w * h,
    dimensionsUnchanged: !allowUpscale && nw === w && nh === h,
    letterbox: { padX, padY, boxW, boxH },
  }
}

function resolveCustom(w: number, h: number, custom: CustomLimits, allowUpscale: boolean): DimensionResult {
  const { maxWidth, maxHeight, exactWidth, exactHeight, customFit } = custom

  if (exactWidth && exactHeight) {
    if (customFit === "stretch") {
      return {
        width: exactWidth,
        height: exactHeight,
        upscaled: exactWidth * exactHeight > w * h,
        dimensionsUnchanged: false,
      }
    }
    if (customFit === "cover") {
      return fitSocial(w, h, exactWidth, exactHeight, "cover", allowUpscale)
    }
    return fitSocial(w, h, exactWidth, exactHeight, "contain", allowUpscale)
  }

  let scale = 1
  if (maxWidth && maxHeight) {
    scale = Math.min(maxWidth / w, maxHeight / h)
  } else if (maxWidth) {
    scale = maxWidth / w
  } else if (maxHeight) {
    scale = maxHeight / h
  } else {
    return { width: w, height: h, upscaled: false, dimensionsUnchanged: true }
  }
  scale = clampScale(scale, allowUpscale)
  const nw = Math.max(1, Math.round(w * scale))
  const nh = Math.max(1, Math.round(h * scale))
  return {
    width: nw,
    height: nh,
    upscaled: nw * nh > w * h,
    dimensionsUnchanged: scale === 1 && !allowUpscale,
  }
}

export function resolveDimensions(opts: ResolveOptions): DimensionResult {
  const { sourceWidth: w, sourceHeight: h, preset, allowUpscale, socialFit, custom } = opts

  if (preset.category === "original") {
    return { width: w, height: h, upscaled: false, dimensionsUnchanged: true }
  }

  if (preset.category === "video" && preset.videoHeight) {
    const r = scaleToHeight(w, h, preset.videoHeight, allowUpscale)
    return r
  }

  if (preset.category === "longEdge" && preset.longEdge) {
    return scaleToLongEdge(w, h, preset.longEdge, allowUpscale)
  }

  if (preset.category === "percent" && preset.percent != null) {
    return scalePercent(w, h, preset.percent, allowUpscale)
  }

  if (preset.category === "social" && preset.socialId) {
    const social = getSocialById(preset.socialId)
    if (!social) return { width: w, height: h, upscaled: false, dimensionsUnchanged: true }
    return fitSocial(w, h, social.width, social.height, socialFit, allowUpscale)
  }

  if (preset.category === "custom") {
    return resolveCustom(w, h, custom, allowUpscale)
  }

  return { width: w, height: h, upscaled: false, dimensionsUnchanged: true }
}

export function megapixels(w: number, h: number): number {
  return (w * h) / 1_000_000
}
