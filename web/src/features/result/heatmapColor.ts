/**
 * Crop maths for aligning heatmap to model's input region.
 * The model resizes the shorter side to 256 and center-crops 224x224.
 * Therefore, in original image pixels, the region seen by the model is
 * a centered square of side (224 / 256) * min(w, h).
 */
export interface CropRegion {
  side: number
  left: number
  top: number
  leftPercent: number
  topPercent: number
  widthPercent: number
  heightPercent: number
}

export function cropRegion(w: number, h: number): CropRegion {
  const side = (224 / 256) * Math.min(w, h)
  const left = (w - side) / 2
  const top = (h - side) / 2
  const leftPercent = w > 0 ? (left / w) * 100 : 0
  const topPercent = h > 0 ? (top / h) * 100 : 0
  const widthPercent = w > 0 ? (side / w) * 100 : 100
  const heightPercent = h > 0 ? (side / h) * 100 : 100

  return {
    side,
    left,
    top,
    leftPercent,
    topPercent,
    widthPercent,
    heightPercent,
  }
}

/**
 * Converts a normalized heat map value (0..1) to RGBA color components.
 * Pure function:
 * 0 -> transparent (স্বচ্ছ, alpha = 0)
 * 1 -> opaque red (লাল, [255, 0, 0, 255])
 */
export function heatmapToRGBA(val: number): [number, number, number, number]
export function heatmapToRGBA(val: Float32Array): Uint8ClampedArray
export function heatmapToRGBA(
  val: number | Float32Array,
): [number, number, number, number] | Uint8ClampedArray {
  if (typeof val === 'number') {
    const clamped = Math.max(0, Math.min(1, val))
    const r = 255
    const g = Math.round(255 * (1 - clamped))
    const b = 0
    const a = Math.round(clamped * 255)
    return [r, g, b, a]
  }

  const out = new Uint8ClampedArray(val.length * 4)
  for (let i = 0; i < val.length; i++) {
    const [r, g, b, a] = heatmapToRGBA(val[i])
    out[i * 4] = r
    out[i * 4 + 1] = g
    out[i * 4 + 2] = b
    out[i * 4 + 3] = a
  }
  return out
}
