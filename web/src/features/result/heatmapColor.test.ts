import { describe, it, expect } from 'vitest'
import { heatmapToRGBA } from './heatmapColor'

describe('F11 heatmapColor', () => {
  it('3. heatmapToRGBA(): 0 -> transparent (স্বচ্ছ), 1 -> red (লাল)', () => {
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
