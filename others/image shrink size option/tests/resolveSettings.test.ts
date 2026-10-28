import { describe, expect, it } from "vitest"
import { createOverrideFromGlobal, getEffectiveSettings } from "../src/app/resolveSettings"
import { DEFAULT_SETTINGS } from "../src/app/settings"
import type { QueueItem } from "../src/app/types"

function fakeItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: "1",
    file: new File([], "test.jpg", { type: "image/jpeg" }),
    status: "pending",
    ...overrides,
  }
}

describe("getEffectiveSettings", () => {
  it("returns global when override disabled", () => {
    const item = fakeItem({ useOverride: false })
    expect(getEffectiveSettings(DEFAULT_SETTINGS, item).presetId).toBe(DEFAULT_SETTINGS.presetId)
  })

  it("merges override fields when enabled", () => {
    const item = fakeItem({
      useOverride: true,
      override: { ...createOverrideFromGlobal(DEFAULT_SETTINGS), presetId: "v720", quality: 60 },
    })
    const eff = getEffectiveSettings(DEFAULT_SETTINGS, item)
    expect(eff.presetId).toBe("v720")
    expect(eff.quality).toBe(60)
    expect(eff.allowUpscale).toBe(DEFAULT_SETTINGS.allowUpscale)
  })
})
