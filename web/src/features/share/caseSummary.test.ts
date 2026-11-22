import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateCaseSummaryText,
  generateCaseSummaryCanvas,
  generateCaseSummaryBlob,
  formatTierSummary,
  SUMMARY_CANVAS_WIDTH,
  SUMMARY_CANVAS_HEIGHT,
  type CaseSummaryInput,
} from './caseSummary'

describe('F15 Case Summary', () => {
  const dummyPredictionHigh: CaseSummaryInput['prediction'] = {
    tier: 'high',
    top: [
      { classId: 'blast', prob: 0.92 },
      { classId: 'brown_spot', prob: 0.05 },
    ],
    modelVersion: 'v1-mnv3s-scratch',
    trainedFromScratch: true,
    latencyMs: 145,
  }

  const dummyPredictionMedium: CaseSummaryInput['prediction'] = {
    tier: 'medium',
    top: [
      { classId: 'blast', prob: 0.65 },
      { classId: 'brown_spot', prob: 0.28 },
    ],
    modelVersion: 'v1-mnv3s-scratch',
    trainedFromScratch: true,
    latencyMs: 140,
  }

  const dummyPredictionLow: CaseSummaryInput['prediction'] = {
    tier: 'low',
    top: [
      { classId: 'tungro', prob: 0.45 },
      { classId: 'leaf_smut', prob: 0.35 },
    ],
    modelVersion: 'v1-mnv3s-scratch',
    trainedFromScratch: true,
    latencyMs: 150,
  }

  const dummyPredictionNotRice: CaseSummaryInput['prediction'] = {
    tier: 'not_rice',
    top: [
      { classId: 'not_rice', prob: 0.98 },
    ],
    modelVersion: 'v1-mnv3s-scratch',
    trainedFromScratch: true,
    latencyMs: 110,
  }

  const sampleInput: CaseSummaryInput = {
    prediction: dummyPredictionHigh,
    date: new Date('2026-11-22T10:30:00Z'),
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('1. formatTierSummary respects all four tiers', () => {
    // High tier: single disease name from content card
    expect(formatTierSummary(dummyPredictionHigh)).toBe('ব্লাস্ট রোগ')

    // Medium tier: "সম্ভাব্য: <top1> অথবা <top2>"
    expect(formatTierSummary(dummyPredictionMedium)).toBe(
      'সম্ভাব্য: ব্লাস্ট রোগ অথবা বাদামি দাগ রোগ',
    )

    // Low tier: "আমি নিশ্চিত নই — কৃষি কর্মকর্তাকে দেখান" (no disease name)
    const lowSummary = formatTierSummary(dummyPredictionLow)
    expect(lowSummary).toBe('আমি নিশ্চিত নই — কৃষি কর্মকর্তাকে দেখান')
    expect(lowSummary).not.toContain('টুংরো')
    expect(lowSummary).not.toContain('স্মাট')

    // Not-rice tier: "ছবিটি ধানপাতা মনে হচ্ছে না"
    expect(formatTierSummary(dummyPredictionNotRice)).toBe(
      'ছবিটি ধানপাতা মনে হচ্ছে না',
    )
  })

  it('2. Summary text contains disease info, tier, date, model version, and 16123, with no location', () => {
    const text = generateCaseSummaryText(sampleInput)

    // Disease name in Bangla from content card
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

  it('3. Canvas has fixed specific dimensions (720x960)', async () => {
    expect(SUMMARY_CANVAS_WIDTH).toBe(720)
    expect(SUMMARY_CANVAS_HEIGHT).toBe(960)

    const canvas = await generateCaseSummaryCanvas(sampleInput)
    expect(canvas.width).toBe(SUMMARY_CANVAS_WIDTH)
    expect(canvas.height).toBe(SUMMARY_CANVAS_HEIGHT)
  })

  it('4. generateCaseSummaryBlob resolves with real Blob from canvas.toBlob', async () => {
    const fakeBlob = new Blob(['png-content'], { type: 'image/png' })
    const toBlobSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((callback) => {
        callback(fakeBlob)
      })

    const blob = await generateCaseSummaryBlob(sampleInput)
    expect(toBlobSpy).toHaveBeenCalledWith(expect.any(Function), 'image/png')
    expect(blob).toBe(fakeBlob)
  })

  it('5. generateCaseSummaryBlob rejects when canvas.toBlob returns null', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (callback) => {
        callback(null)
      },
    )

    await expect(generateCaseSummaryBlob(sampleInput)).rejects.toThrow(
      'ক্যানভাস থেকে ছবি তৈরি করা যায়নি',
    )
  })

  it('6. includes severity line in text summary when severity estimate is provided', () => {
    const inputWithSeverity: CaseSummaryInput = {
      ...sampleInput,
      severity: { share: 0.25, band: 'medium' },
    }
    const text = generateCaseSummaryText(inputWithSeverity)
    expect(text).toContain('আক্রান্ত এলাকা (আনুমানিক, হিটম্যাপ থেকে): মাঝারি অংশে')
  })

  it('7. omits severity line in text summary when severity is not provided', () => {
    const text = generateCaseSummaryText(sampleInput)
    expect(text).not.toContain('আক্রান্ত এলাকা')
  })
})
