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

export function estimateSpread(
  _heatmap?: Float32Array,
  _size?: number,
): SeverityEstimate | null {
  return null
}
