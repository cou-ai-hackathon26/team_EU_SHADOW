import { describe, it, expect } from 'vitest'
import { summaryLine } from './fieldRowCopy'
import type { FieldSummary } from '../../ai/fieldRow.types'

const DISEASE_NAMES = [
  'blast',
  'brown_spot',
  'leaf_smut',
  'tungro',
  'sheath_blight',
  'ব্লাস্ট',
  'বাদামি দাগ',
  'স্মাট',
  'টুংরো',
  'খোলপোড়া',
]

describe('fieldSummary.format (Field Summary Line & Abstention Formatting)', () => {
  it('1. formats normal mixed field summary in Bangla with Bangla digits', () => {
    const summary: FieldSummary = {
      totalRegions: 12,
      screened: 10,
      healthy: 7,
      diseased: 2,
      uncertain: 1,
      abstained: 2,
      byDisease: { blast: 2 },
      abstainedByReason: { dead_leaf: 2, not_rice: 0, unrelated_crop: 0 },
      highestRisk: { classId: 'blast', count: 2, maxConfidence: 0.91 },
      diseasedShare: 2 / 9,
      fieldAbstain: null,
    }

    const bn = summaryLine(summary, 'bn')
    expect(bn).toBe('১২টি পাতার মধ্যে ৭টি সুস্থ, ২টি রোগাক্রান্ত, ১টি অনিশ্চিত, ২টি বাদ')

    const en = summaryLine(summary, 'en')
    expect(en).toBe('12 leaves: 7 healthy, 2 diseased, 1 uncertain, 2 skipped')
  })

  it('2. formats all-healthy field row cleanly', () => {
    const summary: FieldSummary = {
      totalRegions: 6,
      screened: 6,
      healthy: 6,
      diseased: 0,
      uncertain: 0,
      abstained: 0,
      byDisease: {},
      abstainedByReason: { dead_leaf: 0, not_rice: 0, unrelated_crop: 0 },
      highestRisk: null,
      diseasedShare: 0,
      fieldAbstain: null,
    }

    expect(summaryLine(summary, 'bn')).toBe('৬টি পাতার মধ্যে ৬টি সুস্থ')
    expect(summaryLine(summary, 'en')).toBe('6 leaves: 6 healthy')
  })

  it('3. fieldAbstain summary NEVER names any disease for all 3 abstention reasons', () => {
    const reasons = ['not_rice', 'dead_leaf', 'unrelated_crop'] as const

    for (const reason of reasons) {
      const summary: FieldSummary = {
        totalRegions: 5,
        screened: 0,
        healthy: 0,
        diseased: 0,
        uncertain: 0,
        abstained: 5,
        byDisease: {},
        abstainedByReason: {
          not_rice: reason === 'not_rice' ? 5 : 0,
          dead_leaf: reason === 'dead_leaf' ? 5 : 0,
          unrelated_crop: reason === 'unrelated_crop' ? 5 : 0,
        },
        highestRisk: null,
        diseasedShare: 0,
        fieldAbstain: reason,
      }

      const bn = summaryLine(summary, 'bn')
      const en = summaryLine(summary, 'en')

      expect(bn.length).toBeGreaterThan(0)
      expect(en.length).toBeGreaterThan(0)

      for (const disease of DISEASE_NAMES) {
        expect(bn.toLowerCase(), `BN summary for ${reason} must not name disease ${disease}`).not.toContain(
          disease.toLowerCase(),
        )
        expect(en.toLowerCase(), `EN summary for ${reason} must not name disease ${disease}`).not.toContain(
          disease.toLowerCase(),
        )
      }
    }
  })

  it('4. handles empty 0-region field summary safely without throwing', () => {
    const summary: FieldSummary = {
      totalRegions: 0,
      screened: 0,
      healthy: 0,
      diseased: 0,
      uncertain: 0,
      abstained: 0,
      byDisease: {},
      abstainedByReason: { dead_leaf: 0, not_rice: 0, unrelated_crop: 0 },
      highestRisk: null,
      diseasedShare: 0,
      fieldAbstain: null,
    }

    expect(summaryLine(summary, 'bn')).toBe('কোনো পাতা পাওয়া যায়নি')
    expect(summaryLine(summary, 'en')).toBe('No leaves found')
  })
})
