import type { QualityReport } from '../../ai/types'

/**
 * Single source of truth for quality evaluation thresholds and limits.
 */
export const QUALITY_THRESHOLDS = {
  TOO_DARK: 40,
  TOO_BRIGHT: 220,
  TOO_BLURRY: 15,
  MAX_EVAL_DIM: 256,
} as const

function getImageData(source: ImageData | HTMLImageElement | HTMLCanvasElement): ImageData {
  if ('data' in source && 'width' in source && 'height' in source) {
    return source
  }

  const srcWidth = 'naturalWidth' in source ? source.naturalWidth || source.width : source.width
  const srcHeight = 'naturalHeight' in source ? source.naturalHeight || source.height : source.height

  let width = srcWidth
  let height = srcHeight

  // Downsample large images to <= 256px on mobile for high speed calculation
  if (width > QUALITY_THRESHOLDS.MAX_EVAL_DIM || height > QUALITY_THRESHOLDS.MAX_EVAL_DIM) {
    if (width >= height) {
      height = Math.round((height * QUALITY_THRESHOLDS.MAX_EVAL_DIM) / width)
      width = QUALITY_THRESHOLDS.MAX_EVAL_DIM
    } else {
      width = Math.round((width * QUALITY_THRESHOLDS.MAX_EVAL_DIM) / height)
      height = QUALITY_THRESHOLDS.MAX_EVAL_DIM
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, width)
  canvas.height = Math.max(1, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    // Fallback for headless environments without canvas rendering support
    return {
      width: Math.max(1, width),
      height: Math.max(1, height),
      data: new Uint8ClampedArray(Math.max(1, width) * Math.max(1, height) * 4),
      colorSpace: 'srgb',
    } as ImageData
  }

  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

/**
 * Assesses image quality: computes mean luma brightness and Laplacian variance sharpness.
 * Pure function of pixels; warnings never block analysis.
 */
export function assessQuality(
  source: ImageData | HTMLImageElement | HTMLCanvasElement
): QualityReport {
  const imageData = getImageData(source)
  const { width, height, data } = imageData
  const numPixels = width * height

  if (numPixels === 0) {
    return {
      brightness: 0,
      sharpness: 0,
      tooDark: true,
      tooBright: false,
      tooBlurry: true,
    }
  }

  // 1. Mean Luma calculation (ITU-R BT.601)
  const luma = new Float32Array(numPixels)
  let sumLuma = 0

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    luma[p] = y
    sumLuma += y
  }

  const brightness = Math.round((sumLuma / numPixels) * 10) / 10

  // 2. Laplacian variance for sharpness
  let sharpness = 0

  if (width >= 3 && height >= 3) {
    const laplacianValues: number[] = []
    let laplacianSum = 0

    for (let y = 1; y < height - 1; y++) {
      const rowOffset = y * width
      for (let x = 1; x < width - 1; x++) {
        const center = luma[rowOffset + x]
        const top = luma[rowOffset - width + x]
        const bottom = luma[rowOffset + width + x]
        const left = luma[rowOffset + x - 1]
        const right = luma[rowOffset + x + 1]

        // 4-neighbor Laplacian operator: L = top + bottom + left + right - 4 * center
        const lap = top + bottom + left + right - 4 * center
        laplacianValues.push(lap)
        laplacianSum += lap
      }
    }

    const n = laplacianValues.length
    if (n > 0) {
      const meanLap = laplacianSum / n
      let varianceSum = 0
      for (let i = 0; i < n; i++) {
        const diff = laplacianValues[i] - meanLap
        varianceSum += diff * diff
      }
      sharpness = Math.round((varianceSum / n) * 10) / 10
    }
  }

  const tooDark = brightness < QUALITY_THRESHOLDS.TOO_DARK
  const tooBright = brightness > QUALITY_THRESHOLDS.TOO_BRIGHT
  const tooBlurry = sharpness < QUALITY_THRESHOLDS.TOO_BLURRY

  return {
    brightness,
    sharpness,
    tooDark,
    tooBright,
    tooBlurry,
  }
}
