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
