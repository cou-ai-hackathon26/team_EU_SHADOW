import { describe, it, expect, vi, afterEach } from 'vitest'
import { assessQuality, QUALITY_THRESHOLDS } from './quality'
import type { QualityReport } from '../../ai/types'

function createSolidImageData(width: number, height: number, r: number, g: number, b: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
    data[i + 3] = 255
  }
  return {
    width,
    height,
    data,
    colorSpace: 'srgb',
  } as ImageData
}

function createCheckerboardImageData(width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const isWhite = (x + y) % 2 === 0
      const val = isWhite ? 255 : 0
      data[idx] = val
      data[idx + 1] = val
      data[idx + 2] = val
      data[idx + 3] = 255
    }
  }
  return {
    width,
    height,
    data,
    colorSpace: 'srgb',
  } as ImageData
}

describe('assessQuality (F3)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('conforms to QualityReport contract type', () => {
    const normal = createSolidImageData(32, 32, 128, 128, 128)
    const report: QualityReport | null = assessQuality(normal)
    expect(report).not.toBeNull()
    expect(report).toHaveProperty('brightness')
    expect(report).toHaveProperty('sharpness')
    expect(report).toHaveProperty('tooDark')
    expect(report).toHaveProperty('tooBright')
    expect(report).toHaveProperty('tooBlurry')
  })

  it('identifies black image as tooDark and white image as tooBright', () => {
    // All black
    const blackImage = createSolidImageData(32, 32, 0, 0, 0)
    const blackReport = assessQuality(blackImage)
    expect(blackReport).not.toBeNull()
    expect(blackReport!.tooDark).toBe(true)
    expect(blackReport!.tooBright).toBe(false)
    expect(blackReport!.brightness).toBeLessThan(QUALITY_THRESHOLDS.TOO_DARK)

    // All white
    const whiteImage = createSolidImageData(32, 32, 255, 255, 255)
    const whiteReport = assessQuality(whiteImage)
    expect(whiteReport).not.toBeNull()
    expect(whiteReport!.tooBright).toBe(true)
    expect(whiteReport!.tooDark).toBe(false)
    expect(whiteReport!.brightness).toBeGreaterThan(QUALITY_THRESHOLDS.TOO_BRIGHT)
  })

  it('identifies solid color image as tooBlurry and checkerboard as sharp', () => {
    // Solid gray image (Laplacian variance is 0)
    const solidImage = createSolidImageData(32, 32, 120, 120, 120)
    const solidReport = assessQuality(solidImage)
    expect(solidReport).not.toBeNull()
    expect(solidReport!.sharpness).toBe(0)
    expect(solidReport!.tooBlurry).toBe(true)

    // Checkerboard pattern (high variance, sharp edges)
    const checkerboard = createCheckerboardImageData(32, 32)
    const sharpReport = assessQuality(checkerboard)
    expect(sharpReport).not.toBeNull()
    expect(sharpReport!.sharpness).toBeGreaterThan(QUALITY_THRESHOLDS.TOO_BLURRY)
    expect(sharpReport!.tooBlurry).toBe(false)
  })

  it('returns null when canvas.getContext("2d") returns null', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    const fakeImg = new Image()
    Object.defineProperty(fakeImg, 'width', { value: 100 })
    Object.defineProperty(fakeImg, 'height', { value: 100 })

    const result = assessQuality(fakeImg)
    expect(result).toBeNull()
  })

  it('keeps thresholds defined in a single constant object', () => {
    expect(QUALITY_THRESHOLDS.TOO_DARK).toBeDefined()
    expect(QUALITY_THRESHOLDS.TOO_BRIGHT).toBeDefined()
    expect(QUALITY_THRESHOLDS.TOO_BLURRY).toBeDefined()
    expect(QUALITY_THRESHOLDS.MAX_EVAL_DIM).toBeLessThanOrEqual(256)
  })
})
