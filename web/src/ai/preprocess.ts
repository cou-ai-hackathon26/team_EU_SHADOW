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

/**
 * Preprocesses an image to match the ML pipeline (ml/agroleaf_ml/preprocess.py):
 * 1. Resizes shorter side to RESIZE_SHORTER (256) using bilinear interpolation
 * 2. Centre-crops to inputSize × inputSize (224 × 224)
 * 3. Normalises using mean & std
 * 4. Returns Float32Array in NCHW order (3 × inputSize × inputSize)
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
  const newW = Math.max(1, Math.round(srcW * scale))
  const newH = Math.max(1, Math.round(srcH * scale))

  const cropLeft = Math.floor((newW - inputSize) / 2)
  const cropTop = Math.floor((newH - inputSize) / 2)

  const pixelsPerChannel = inputSize * inputSize
  const out = new Float32Array(3 * pixelsPerChannel)

  for (let y = 0; y < inputSize; y++) {
    const scaledY = y + cropTop
    const srcY = scaledY / scale

    const y0 = Math.min(Math.max(0, Math.floor(srcY)), srcH - 1)
    const y1 = Math.min(y0 + 1, srcH - 1)
    const dy = Math.max(0, Math.min(1, srcY - y0))

    for (let x = 0; x < inputSize; x++) {
      const scaledX = x + cropLeft
      const srcX = scaledX / scale

      const x0 = Math.min(Math.max(0, Math.floor(srcX)), srcW - 1)
      const x1 = Math.min(x0 + 1, srcW - 1)
      const dx = Math.max(0, Math.min(1, srcX - x0))

      const idx00 = (y0 * srcW + x0) * 4
      const idx01 = (y0 * srcW + x1) * 4
      const idx10 = (y1 * srcW + x0) * 4
      const idx11 = (y1 * srcW + x1) * 4

      // Bilinear interpolation for R, G, B
      const r =
        (1 - dx) * (1 - dy) * data[idx00] +
        dx * (1 - dy) * data[idx01] +
        (1 - dx) * dy * data[idx10] +
        dx * dy * data[idx11]

      const g =
        (1 - dx) * (1 - dy) * data[idx00 + 1] +
        dx * (1 - dy) * data[idx01 + 1] +
        (1 - dx) * dy * data[idx10 + 1] +
        dx * dy * data[idx11 + 1]

      const b =
        (1 - dx) * (1 - dy) * data[idx00 + 2] +
        dx * (1 - dy) * data[idx01 + 2] +
        (1 - dx) * dy * data[idx10 + 2] +
        dx * dy * data[idx11 + 2]

      const targetIdx = y * inputSize + x
      out[targetIdx] = (r / 255.0 - mean[0]) / std[0]
      out[pixelsPerChannel + targetIdx] = (g / 255.0 - mean[1]) / std[1]
      out[2 * pixelsPerChannel + targetIdx] = (b / 255.0 - mean[2]) / std[2]
    }
  }

  return out
}
