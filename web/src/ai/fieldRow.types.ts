import type { DiseaseClassId } from './classes'
import type { ConfidenceTier } from './types'
import type { PreprocessImageInput } from './preprocess'

/**
 * ONSITE CONTRACT (Challenge 1 field-row + Challenge 2 abstention).
 * Owner: Masum (src/ai/). UI = Tanjil, copy/tests = Mehedi. Do not rename fields without all three agreeing.
 */
export type AbstentionReason = 'not_rice' | 'dead_leaf' | 'unrelated_crop'
export const ABSTENTION_REASONS: readonly AbstentionReason[] = ['not_rice', 'dead_leaf', 'unrelated_crop'] as const

/** healthy/diseased need tier high|medium; low tier => uncertain; any abstain => abstained */
export type LeafStatus = 'healthy' | 'diseased' | 'uncertain' | 'abstained'

/** Pixels in the ORIGINAL image (after EXIF orientation). */
export interface LeafBox { x: number; y: number; w: number; h: number }

/** Share of pixels in the box, each 0..1. */
export interface LeafColorStats {
  greenRatio: number      // living-leaf green (hue ~60-170°, enough saturation)
  brownRatio: number      // dry/brown/yellow-dead (hue ~15-55°, low-mid value)
  greyRatio: number       // background/soil/sky/grey (low saturation)
  meanSaturation: number
}

export interface LeafScreening {
  id: number                              // 1-based, reading order (top→bottom, left→right)
  box: LeafBox
  source: 'leaf_region' | 'grid_tile'
  status: LeafStatus
  label: DiseaseClassId | null            // null when abstained
  confidence: number                      // calibrated top-1 prob among disease classes, 0..1
  tier: ConfidenceTier
  abstain: AbstentionReason | null
  margin: number                          // top1 - top2 prob (disease classes)
  entropy: number                         // normalised Shannon entropy over disease classes, 0..1
  pNotRice: number
  color: LeafColorStats
}

export interface FieldSummary {
  totalRegions: number
  screened: number                        // healthy + diseased + uncertain
  healthy: number
  diseased: number
  uncertain: number
  abstained: number
  byDisease: Partial<Record<DiseaseClassId, number>>   // diseased leaves only, 'healthy' never a key
  abstainedByReason: Record<AbstentionReason, number>
  /** disease with most diseased leaves; tie → higher maxConfidence. null if no diseased leaf */
  highestRisk: { classId: DiseaseClassId; count: number; maxConfidence: number } | null
  diseasedShare: number                   // diseased / (healthy + diseased), 0 if both 0
  /** set when NO leaf was screenable: the dominant abstain reason for the whole photo */
  fieldAbstain: AbstentionReason | null
}

export interface FieldRowResult {
  imageWidth: number
  imageHeight: number
  mode: 'leaf_regions' | 'grid_fallback'
  leaves: LeafScreening[]
  summary: FieldSummary
  modelVersion: string
  latencyMs: number
}

export interface FieldRowProgress { stage: 'detecting' | 'classifying' | 'summarizing'; done: number; total: number }

export interface FieldRowOptions {
  onProgress?: (p: FieldRowProgress) => void
  maxRegions?: number                     // default 24
  signal?: AbortSignal
}

/** Implemented in src/ai/fieldRow.ts (Masum). */
export type ScreenFieldRow = (image: PreprocessImageInput, opts?: FieldRowOptions) => Promise<FieldRowResult>
