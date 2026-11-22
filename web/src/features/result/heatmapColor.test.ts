import { describe, it, expect } from 'vitest'
import { cropRegion, heatmapToRGBA } from './heatmapColor'

describe('F11 heatmapColor', () => {
  it('1. cropRegion(w, h) calculates centred square crop of side (224/256)*min(w, h)', () => {
    // 400x300 image: min=300, side=(224/256)*300=262.5, left=(400-262.5)/2=68.75, top=(300-262.5)/2=18.75
    const crop400x300 = cropRegion(400, 300)
    expect(crop400x300.side).toBe(262.5)
    expect(crop400x300.left).toBe(68.75)
    expect(crop400x300.top).toBe(18.75)
    expect(crop400x300.leftPercent).toBeCloseTo((68.75 / 400) * 100, 4)
    expect(crop400x300.topPercent).toBeCloseTo((18.75 / 300) * 100, 4)
    expect(crop400x300.widthPercent).toBeCloseTo((262.5 / 400) * 100, 4)
    expect(crop400x300.heightPercent).toBeCloseTo((262.5 / 300) * 100, 4)

    // 256x256 image: min=256, side=224, left=16, top=16
    const cropSquare = cropRegion(256, 256)
    expect(cropSquare.side).toBe(224)
    expect(cropSquare.left).toBe(16)
    expect(cropSquare.top).toBe(16)
    expect(cropSquare.leftPercent).toBeCloseTo((16 / 256) * 100, 4)
    expect(cropSquare.topPercent).toBeCloseTo((16 / 256) * 100, 4)
  })

  it('2. heatmapToRGBA(): 0 -> transparent (স্বচ্ছ), 1 -> red (লাল)', () => {
    // 0 -> transparent (alpha = 0)
    const transparent = heatmapToRGBA(0)
    expect(transparent[3]).toBe(0)

    // 1 -> red (r = 255, g = 0, b = 0, a = 255)
    const red = heatmapToRGBA(1)
    expect(red[0]).toBe(255)
    expect(red[1]).toBe(0)
    expect(red[2]).toBe(0)
    expect(red[3]).toBe(255)

    // Intermediate value
    const mid = heatmapToRGBA(0.5)
    expect(mid[3]).toBeGreaterThan(0)
    expect(mid[3]).toBeLessThan(255)

    // Array support
    const arr = new Float32Array([0, 1])
    const rgba = heatmapToRGBA(arr)
    expect(rgba).toBeInstanceOf(Uint8ClampedArray)
    expect(rgba).toHaveLength(8)
    expect(rgba[3]).toBe(0)
    expect(rgba[4]).toBe(255)
    expect(rgba[7]).toBe(255)
  })
})
