import { describe, it, expect } from 'vitest'
import {
  generateCaseSummaryText,
  generateCaseSummaryCanvas,
  SUMMARY_CANVAS_WIDTH,
  SUMMARY_CANVAS_HEIGHT,
  type CaseSummaryInput,
} from './caseSummary'

describe('F15 Case Summary', () => {
  const dummyPrediction: CaseSummaryInput['prediction'] = {
    tier: 'high',
    top: [
      { classId: 'blast', prob: 0.92 },
      { classId: 'brown_spot', prob: 0.05 },
    ],
    modelVersion: 'v1-mnv3s-scratch',
    trainedFromScratch: true,
    latencyMs: 145,
  }

  const sampleInput: CaseSummaryInput = {
    prediction: dummyPrediction,
    date: new Date('2026-11-22T10:30:00Z'),
  }

  it('1. Summary contains disease name (Bangla), tier, date, model version, and 16123, with no location', () => {
    const text = generateCaseSummaryText(sampleInput)

    // Disease name in Bangla
    expect(text).toContain('ব্লাস্ট')

    // Tier in Bangla
    expect(text).toContain('নিশ্চিত')

    // Model version
    expect(text).toContain('v1-mnv3s-scratch')

    // Helpline 16123
    expect(text).toContain('১৬১২৩')

    // Date
    expect(text).toMatch(/তারিখ|২০২৬|2026/)

    // STRICT CHECK: location must NOT be present
    expect(text.toLowerCase()).not.toContain('location')
    expect(text.toLowerCase()).not.toContain('gps')
    expect(text.toLowerCase()).not.toContain('latitude')
    expect(text.toLowerCase()).not.toContain('longitude')
    expect(text).not.toContain('স্থান')
    expect(text).not.toContain('অবস্থান')
  })

  it('2. Canvas has fixed specific dimensions', async () => {
    expect(SUMMARY_CANVAS_WIDTH).toBe(720)
    expect(SUMMARY_CANVAS_HEIGHT).toBe(960)

    const canvas = await generateCaseSummaryCanvas(sampleInput)
    expect(canvas.width).toBe(SUMMARY_CANVAS_WIDTH)
    expect(canvas.height).toBe(SUMMARY_CANVAS_HEIGHT)
  })
})
