import { describe, expect, it } from 'vitest'
import { summarizeField, screenFieldRow } from './fieldRow'
import type { LeafScreening } from './fieldRow.types'

function makeLeaf(overrides: Partial<LeafScreening>): LeafScreening {
  return {
    id: 1,
    box: { x: 0, y: 0, w: 50, h: 50 },
    source: 'leaf_region',
    status: 'healthy',
    label: 'healthy',
    confidence: 0.95,
    tier: 'high',
    abstain: null,
    margin: 0.8,
    entropy: 0.1,
    pNotRice: 0.01,
    color: { greenRatio: 0.8, brownRatio: 0.1, greyRatio: 0.1, meanSaturation: 0.6 },
    ...overrides,
  }
}

describe('fieldRow - summarizeField', () => {
  it('summarizes empty field', () => {
    const summary = summarizeField([])
    expect(summary.totalRegions).toBe(0)
    expect(summary.screened).toBe(0)
    expect(summary.healthy).toBe(0)
    expect(summary.diseased).toBe(0)
    expect(summary.uncertain).toBe(0)
    expect(summary.abstained).toBe(0)
    expect(summary.diseasedShare).toBe(0)
    expect(summary.highestRisk).toBeNull()
    expect(summary.fieldAbstain).toBeNull()
  })

  it('summarizes mix of healthy, diseased, uncertain, and abstained leaves', () => {
    const leaves: LeafScreening[] = [
      makeLeaf({ id: 1, status: 'healthy', label: 'healthy', confidence: 0.92 }),
      makeLeaf({ id: 2, status: 'healthy', label: 'healthy', confidence: 0.88 }),
      makeLeaf({ id: 3, status: 'diseased', label: 'blast', confidence: 0.85 }),
      makeLeaf({ id: 4, status: 'diseased', label: 'blast', confidence: 0.91 }),
      makeLeaf({ id: 5, status: 'diseased', label: 'brown_spot', confidence: 0.95 }),
      makeLeaf({ id: 6, status: 'uncertain', label: 'tungro', confidence: 0.40 }),
      makeLeaf({ id: 7, status: 'abstained', label: null, abstain: 'dead_leaf' }),
      makeLeaf({ id: 8, status: 'abstained', label: null, abstain: 'unrelated_crop' }),
    ]

    const summary = summarizeField(leaves)
    expect(summary.totalRegions).toBe(8)
    expect(summary.screened).toBe(6) // healthy + diseased + uncertain
    expect(summary.healthy).toBe(2)
    expect(summary.diseased).toBe(3)
    expect(summary.uncertain).toBe(1)
    expect(summary.abstained).toBe(2)
    expect(summary.diseasedShare).toBeCloseTo(3 / 5, 2) // diseased / (healthy + diseased)

    // highestRisk: blast has count 2, brown_spot has count 1 -> blast wins
    expect(summary.highestRisk).toEqual({
      classId: 'blast',
      count: 2,
      maxConfidence: 0.91,
    })

    // healthy is never a key in byDisease
    expect(summary.byDisease).toEqual({
      blast: 2,
      brown_spot: 1,
    })

    expect(summary.abstainedByReason).toEqual({
      not_rice: 0,
      dead_leaf: 1,
      unrelated_crop: 1,
    })
    expect(summary.fieldAbstain).toBeNull()
  })

  it('tie-breaks highestRisk by higher maxConfidence', () => {
    const leaves: LeafScreening[] = [
      makeLeaf({ id: 1, status: 'diseased', label: 'blast', confidence: 0.80 }),
      makeLeaf({ id: 2, status: 'diseased', label: 'tungro', confidence: 0.92 }),
    ]

    const summary = summarizeField(leaves)
    expect(summary.highestRisk).toEqual({
      classId: 'tungro',
      count: 1,
      maxConfidence: 0.92,
    })
  })

  it('sets fieldAbstain to dominant abstain reason when all leaves are abstained', () => {
    const leaves: LeafScreening[] = [
      makeLeaf({ id: 1, status: 'abstained', label: null, abstain: 'dead_leaf' }),
      makeLeaf({ id: 2, status: 'abstained', label: null, abstain: 'unrelated_crop' }),
      makeLeaf({ id: 3, status: 'abstained', label: null, abstain: 'unrelated_crop' }),
    ]

    const summary = summarizeField(leaves)
    expect(summary.screened).toBe(0)
    expect(summary.fieldAbstain).toBe('unrelated_crop')
  })
})
