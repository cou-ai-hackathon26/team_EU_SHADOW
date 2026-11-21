import type { ModelMeta } from './types'

export type PreprocessImageInput =
  | ImageBitmap
  | HTMLImageElement
  | HTMLCanvasElement
  | ImageData
  | { data: ArrayLike<number>; width: number; height: number }

const DEFAULT_INPUT_SIZE = 224
const RESIZE_SHORTER = 256
const DEFAULT_MEAN: [number, number, number] = [0.485, 0.456, 0.406]
const DEFAULT_STD: [number, number, number] = [0.229, 0.224, 0.225]

/**
 * Extracts raw RGBA pixel data from various image sources.
 *
 * Note: EXIF orientation must be applied before calling preprocess
 * (photo-input uses createImageBitmap with imageOrientation: 'from-image').
 */
function getPixelData(image: PreprocessImageInput): {
  data: ArrayLike<number>
  width: number
  height: number
} {
  if (
    'data' in image &&
    typeof image.width === 'number' &&
    typeof image.height === 'number'
  ) {
    return {
      data: image.data,
      width: image.width,
      height: image.height,
    }
  }

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas')
    const imgEl = image as any
    const w =
      imgEl.naturalWidth ||
      imgEl.videoWidth ||
      imgEl.width ||
      DEFAULT_INPUT_SIZE
    const h =
      imgEl.naturalHeight ||
      imgEl.videoHeight ||
      imgEl.height ||
      DEFAULT_INPUT_SIZE
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(image as CanvasImageSource, 0, 0)
      const imgData = ctx.getImageData(0, 0, w, h)
      return {
        data: imgData.data,
        width: w,
        height: h,
      }
    }
  }

  throw new Error('Unable to extract pixel data from image input')
}

interface Filter1D {
  indices: Int32Array
  weights: Float32Array
}

/**
 * Computes 1D separable triangle filter weights matching Pillow's Image.BILINEAR:
 * - center = (x + 0.5) / scale
 * - support = max(1, 1 / scale) so downscaling averages pixels (antialias)
 * - normalized weights sum to 1.0
 */
function computeFilterWeights(srcSize: number, dstSize: number): Filter1D[] {
  const scale = dstSize / srcSize
  const support = Math.max(1.0, 1.0 / scale)
  const filters: Filter1D[] = new Array(dstSize)

  for (let x = 0; x < dstSize; x++) {
    const center = (x + 0.5) / scale
    const xmin = Math.max(0, Math.floor(center - support))
    const xmax = Math.min(srcSize, Math.ceil(center + support))

    let count = 0
    for (let i = xmin; i < xmax; i++) {
      const d = Math.abs(i + 0.5 - center) / support
      if (d < 1.0) count++
    }

    const indices = new Int32Array(count)
    const weights = new Float32Array(count)
    let totalWeight = 0.0
    let k = 0
    for (let i = xmin; i < xmax; i++) {
      const d = Math.abs(i + 0.5 - center) / support
      if (d < 1.0) {
        const wt = 1.0 - d
        indices[k] = i
        weights[k] = wt
        totalWeight += wt
        k++
      }
    }

    if (totalWeight > 0.0) {
      for (let j = 0; j < count; j++) {
        weights[j] /= totalWeight
      }
    }

    filters[x] = { indices, weights }
  }

  return filters
}

/**
 * Preprocesses an image to match the ML pipeline (ml/agroleaf_ml/preprocess.py):
 * 1. Resizes shorter side to RESIZE_SHORTER (256) using Pillow-compatible separable bilinear interpolation
 * 2. Intermediate passes round/clamp to uint8 like Pillow
 * 3. Centre-crops to inputSize × inputSize (224 × 224) with floor((w-224)/2), floor((h-224)/2)
 * 4. Normalises using mean & std
 * 5. Returns Float32Array in NCHW order (3 × inputSize × inputSize)
 *
 * Note: EXIF orientation must be applied before calling preprocess
 * (the photo-input feature uses createImageBitmap with imageOrientation: 'from-image').
 */
export function preprocess(
  image: PreprocessImageInput,
  meta?: Partial<Pick<ModelMeta, 'inputSize' | 'mean' | 'std'>>,
): Float32Array {
  const inputSize = meta?.inputSize ?? DEFAULT_INPUT_SIZE
  const mean = meta?.mean ?? DEFAULT_MEAN
  const std = meta?.std ?? DEFAULT_STD

  const { data, width: srcW, height: srcH } = getPixelData(image)

  const scale = RESIZE_SHORTER / Math.min(srcW, srcH)
  const dstW = Math.max(1, Math.round(srcW * scale))
  const dstH = Math.max(1, Math.round(srcH * scale))

  const cropLeft = Math.floor((dstW - inputSize) / 2)
  const cropTop = Math.floor((dstH - inputSize) / 2)

  const filterH = computeFilterWeights(srcW, dstW)
  const filterV = computeFilterWeights(srcH, dstH)

  // Pass 1: Horizontal resample into intermediate buffer (srcH rows, inputSize cropped cols, 3 RGB channels)
  const inter = new Uint8Array(srcH * inputSize * 3)

  for (let y = 0; y < srcH; y++) {
    const rowOffset = y * srcW * 4
    for (let x = 0; x < inputSize; x++) {
      const dstX = cropLeft + x
      const { indices, weights } = filterH[dstX]
      let r = 0
      let g = 0
      let b = 0
      for (let k = 0; k < indices.length; k++) {
        const srcIdx = rowOffset + indices[k] * 4
        const wt = weights[k]
        r += data[srcIdx] * wt
        g += data[srcIdx + 1] * wt
        b += data[srcIdx + 2] * wt
      }
      const interIdx = (y * inputSize + x) * 3
      inter[interIdx] = Math.min(255, Math.max(0, Math.round(r)))
      inter[interIdx + 1] = Math.min(255, Math.max(0, Math.round(g)))
      inter[interIdx + 2] = Math.min(255, Math.max(0, Math.round(b)))
    }
  }

  // Pass 2: Vertical resample from intermediate buffer & normalise into NCHW output
  const pixelsPerChannel = inputSize * inputSize
  const out = new Float32Array(3 * pixelsPerChannel)

  for (let y = 0; y < inputSize; y++) {
    const dstY = cropTop + y
    const { indices, weights } = filterV[dstY]
    for (let x = 0; x < inputSize; x++) {
      let r = 0
      let g = 0
      let b = 0
      for (let k = 0; k < indices.length; k++) {
        const srcY = indices[k]
        const interIdx = (srcY * inputSize + x) * 3
        const wt = weights[k]
        r += inter[interIdx] * wt
        g += inter[interIdx + 1] * wt
        b += inter[interIdx + 2] * wt
      }

      const u8R = Math.min(255, Math.max(0, Math.round(r)))
      const u8G = Math.min(255, Math.max(0, Math.round(g)))
      const u8B = Math.min(255, Math.max(0, Math.round(b)))

      const targetIdx = y * inputSize + x
      out[targetIdx] = (u8R / 255.0 - mean[0]) / std[0]
      out[pixelsPerChannel + targetIdx] = (u8G / 255.0 - mean[1]) / std[1]
      out[2 * pixelsPerChannel + targetIdx] = (u8B / 255.0 - mean[2]) / std[2]
    }
  }

  return out
}
