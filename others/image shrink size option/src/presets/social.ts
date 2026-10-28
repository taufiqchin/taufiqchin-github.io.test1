import type { SocialFit } from "../app/types"

export interface SocialPreset {
  id: string
  label: string
  width: number
  height: number
  defaultFit: SocialFit
}

export const SOCIAL_PRESETS: SocialPreset[] = [
  { id: "ig-post", label: "Instagram post", width: 1080, height: 1080, defaultFit: "cover" },
  { id: "ig-portrait", label: "Instagram portrait (4:5)", width: 1080, height: 1350, defaultFit: "cover" },
  { id: "ig-story", label: "Instagram story / Reels", width: 1080, height: 1920, defaultFit: "cover" },
  { id: "facebook", label: "Facebook post", width: 1200, height: 630, defaultFit: "cover" },
  { id: "x-post", label: "X (Twitter) post", width: 1600, height: 900, defaultFit: "cover" },
  { id: "linkedin", label: "LinkedIn post", width: 1200, height: 627, defaultFit: "cover" },
  { id: "youtube", label: "YouTube thumbnail", width: 1280, height: 720, defaultFit: "cover" },
  { id: "og", label: "Open Graph", width: 1200, height: 630, defaultFit: "cover" },
  { id: "sticker", label: "Sticker / chat (512²)", width: 512, height: 512, defaultFit: "contain" },
]
