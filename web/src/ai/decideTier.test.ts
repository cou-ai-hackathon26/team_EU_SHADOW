import { describe, it, expect } from 'vitest'
import { decideTier } from './decideTier'
import type { ClassProb, ModelMeta } from './types'

const dummyMeta: ModelMeta = {
  version: 'v1-test',
  architecture: 'MobileNetV3-Small',
  trainedFromScratch: true,
  classes: [
    'healthy',
    'blast',
    'brown_spot',
    'leaf_smut',
    'tungro',
    'sheath_blight',
    'not_rice',
  ],
  inputSize: 224,
  mean: [0.485, 0.456, 0.406],
  std: [0.229, 0.224, 0.225],
  temperature: 1.0,
  thresholds: {
    high: 0.85,
    medium: 0.55,
    healthyHigh: 0.9,
    notRice: 0.5,
  },
  camOutput: false,
}

describe('decideTier', () => {
  it('returns not_rice when p(not_rice) >= thresholds.notRice', () => {
    const probs: ClassProb[] = [
      { classId: 'not_rice', prob: 0.52 },
      { classId: 'blast', prob: 0.48 },
    ]
    expect(decideTier(probs, dummyMeta)).toBe('not_rice')
  })

  it('returns high when top-1 >= thresholds.high', () => {
    const probs: ClassProb[] = [
      { classId: 'blast', prob: 0.88 },
      { classId: 'brown_spot', prob: 0.12 },
    ]
    expect(decideTier(probs, dummyMeta)).toBe('high')
  })

  it('returns medium when top-1 >= thresholds.medium and < thresholds.high', () => {
    const probs: ClassProb[] = [
      { classId: 'blast', prob: 0.7 },
      { classId: 'brown_spot', prob: 0.3 },
    ]
    expect(decideTier(probs, dummyMeta)).toBe('medium')
  })

  it('returns low otherwise (top-1 < thresholds.medium)', () => {
    const probs: ClassProb[] = [
      { classId: 'blast', prob: 0.45 },
      { classId: 'brown_spot', prob: 0.35 },
      { classId: 'tungro', prob: 0.2 },
    ]
    expect(decideTier(probs, dummyMeta)).toBe('low')
  })

  it('healthy as top-1 needs thresholds.healthyHigh to be high, otherwise drops to medium', () => {
    // 0.87 is >= high (0.85) but < healthyHigh (0.90) => must drop to medium
    const probsBelowHealthyHigh: ClassProb[] = [
      { classId: 'healthy', prob: 0.87 },
      { classId: 'blast', prob: 0.13 },
    ]
    expect(decideTier(probsBelowHealthyHigh, dummyMeta)).toBe('medium')

    // >= healthyHigh (0.90) => high
    const probsAboveHealthyHigh: ClassProb[] = [
      { classId: 'healthy', prob: 0.93 },
      { classId: 'blast', prob: 0.07 },
    ]
    expect(decideTier(probsAboveHealthyHigh, dummyMeta)).toBe('high')

    // < medium (0.55) => low
    const probsLowHealthy: ClassProb[] = [
      { classId: 'healthy', prob: 0.4 },
      { classId: 'blast', prob: 0.3 },
    ]
    expect(decideTier(probsLowHealthy, dummyMeta)).toBe('low')
  })

  it('when not_rice has highest prob but below thresholds.notRice, tier is graded only on best disease prob', () => {
    // not_rice is 0.48 (< 0.50). best disease is blast 0.40.
    // With medium threshold = 0.45, blast is below medium => must be 'low' (not 'medium' from not_rice)
    const metaWithLowMedium: ModelMeta = {
      ...dummyMeta,
      thresholds: {
        ...dummyMeta.thresholds,
        medium: 0.45,
        notRice: 0.5,
      },
    }
    const probs: ClassProb[] = [
      { classId: 'not_rice', prob: 0.48 },
      { classId: 'blast', prob: 0.40 },
      { classId: 'brown_spot', prob: 0.12 },
    ]
    expect(decideTier(probs, metaWithLowMedium)).toBe('low')

    // If best disease is >= medium (e.g. 0.46), it should be 'medium'
    const probsMediumDisease: ClassProb[] = [
      { classId: 'not_rice', prob: 0.48 },
      { classId: 'blast', prob: 0.46 },
      { classId: 'brown_spot', prob: 0.06 },
    ]
    expect(decideTier(probsMediumDisease, metaWithLowMedium)).toBe('medium')
  })
})
