export const HOT_CELL_THRESHOLD = 0.5

export type SeverityBand = 'small' | 'medium' | 'large'

export interface SeverityEstimate {
  share: number
  band: SeverityBand
}

export const SEVERITY_BAND_LABELS_BN: Record<SeverityBand, string> = {
  small: 'অল্প অংশে',
  medium: 'মাঝারি অংশে',
  large: 'বড় অংশে',
}

/**
 * Pure function to estimate lesion spread from a class activation heatmap.
 * - Flat (all zero) or mismatched heatmap returns null.
 * - Hot cell is defined as cell >= HOT_CELL_THRESHOLD (0.5).
 * - share < 0.15 -> small
 * - 0.15 <= share <= 0.40 -> medium
 * - share > 0.40 -> large
 */
export function estimateSpread(
  heatmap?: Float32Array,
  size?: number,
): SeverityEstimate | null {
  if (!heatmap || !size || size <= 0) {
    return null
  }

  const expectedLength = size * size
  if (heatmap.length !== expectedLength) {
    return null
  }

  let allZero = true
  let hotCount = 0

  for (let i = 0; i < heatmap.length; i++) {
    const val = heatmap[i]
    if (val !== 0) {
      allZero = false
    }
    if (val >= HOT_CELL_THRESHOLD) {
      hotCount++
    }
  }

  if (allZero) {
    return null
  }

  const share = hotCount / heatmap.length

  let band: SeverityBand
  if (share < 0.15) {
    band = 'small'
  } else if (share <= 0.40) {
    band = 'medium'
  } else {
    band = 'large'
  }

  return { share, band }
}
