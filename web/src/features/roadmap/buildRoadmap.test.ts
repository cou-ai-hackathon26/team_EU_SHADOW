import { describe, it, expect } from 'vitest'
import { buildRoadmap } from './buildRoadmap'
import { getCard } from '../../content/getCard'
import type { Prediction } from '../../ai/types'
import type { DiseaseCard } from '../../content/types'
import { BANNED_PATTERNS } from '../../content/content.test'

describe('F17: buildRoadmap (pure function)', () => {
  const blastCard = getCard('blast')
  const healthyCard = getCard('healthy')
  const notSureCard = getCard('not_sure')
  const notRiceCard = getCard('not_rice')

  it('high blast → 4 steps in order with prevention text from the real card', () => {
    const pred: Prediction = {
      tier: 'high',
      top: [
        { classId: 'blast', prob: 0.94 },
        { classId: 'brown_spot', prob: 0.04 },
      ],
      modelVersion: 'v1.0.0',
      trainedFromScratch: true,
      latencyMs: 100,
    }

    const steps = buildRoadmap(pred, blastCard)
    expect(steps).not.toBeNull()
    expect(steps).toHaveLength(4)

    // Step 1: আজই
    const step1 = steps![0]
    expect(step1.id).toBe('today')
    expect(step1.title.bn).toContain('আজই')
    expect(step1.intro?.bn).toContain('আক্রান্ত পাতা ও আশেপাশের গাছ ভালো করে দেখুন')
    expect(step1.items).toBeDefined()
    expect(step1.items![0].bn).toBe(blastCard.prevention[0].bn)

    // Step 2: এই সপ্তাহে
    const step2 = steps![1]
    expect(step2.id).toBe('this_week')
    expect(step2.title.bn).toContain('এই সপ্তাহে')
    expect(step2.items).toBeDefined()
    // contains remaining prevention items (max 3)
    expect(step2.items![0].bn).toBe(blastCard.prevention[1].bn)
    if (blastCard.prevention.length > 2) {
      expect(step2.items![1].bn).toBe(blastCard.prevention[2].bn)
    }

    // Step 3: ৭ দিন পর
    const step3 = steps![2]
    expect(step3.id).toBe('seven_days')
    expect(step3.title.bn).toContain('৭ দিন পর')
    expect(step3.intro?.bn).toContain('একই জমির পাতার আবার ছবি তুলে পরীক্ষা করুন, দাগ বাড়ছে কি না দেখুন')
    expect(step3.hasReScanButton).toBe(true)
    expect(step3.hasHistoryLink).toBe(true)

    // Step 4: কখন কল করবেন
    const step4 = steps![3]
    expect(step4.id).toBe('call_expert')
    expect(step4.title.bn).toContain('কখন কল করবেন')
    expect(step4.intro?.bn).toBe(blastCard.whenToCallExpert.bn)
    expect(step4.hasCallButton).toBe(true)
  })

  it('high healthy → 3 steps and no disease names in any step', () => {
    const pred: Prediction = {
      tier: 'high',
      top: [
        { classId: 'healthy', prob: 0.98 },
      ],
      modelVersion: 'v1.0.0',
      trainedFromScratch: true,
      latencyMs: 90,
    }

    const steps = buildRoadmap(pred, healthyCard)
    expect(steps).not.toBeNull()
    expect(steps).toHaveLength(3)

    // Step 1: আজই / নিয়মিত জমি দেখুন + prevention (max 2)
    const step1 = steps![0]
    expect(step1.title.bn).toContain('আজই')
    expect(step1.intro?.bn).toContain('নিয়মিত (সপ্তাহে ১–২ বার) জমি দেখুন')
    expect(step1.items).toBeDefined()
    expect(step1.items![0].bn).toBe(healthyCard.prevention[0].bn)

    // Step 2: এই সপ্তাহে
    const step2 = steps![1]
    expect(step2.title.bn).toContain('এই সপ্তাহে')
    expect(step2.items).toBeDefined()
    expect(step2.items![0].bn).toBe(healthyCard.prevention[1].bn)

    // Step 3: 16123 step
    const step3 = steps![2]
    expect(step3.title.bn).toContain('কখন কল করবেন')
    expect(step3.intro?.bn).toBe(healthyCard.whenToCallExpert.bn)
    expect(step3.hasCallButton).toBe(true)

    // Verify no disease names in any step
    const allText = JSON.stringify(steps)
    expect(allText).not.toMatch(/ব্লাস্ট|ব্লাইট|স্মাট|টুংরো|blast|blight|smut|tungro/i)
  })

  it('medium → 2 steps and no disease names in any step', () => {
    const pred: Prediction = {
      tier: 'medium',
      top: [
        { classId: 'blast', prob: 0.55 },
        { classId: 'brown_spot', prob: 0.40 },
      ],
      modelVersion: 'v1.0.0',
      trainedFromScratch: true,
      latencyMs: 110,
    }

    const steps = buildRoadmap(pred, blastCard)
    expect(steps).not.toBeNull()
    expect(steps).toHaveLength(2)

    // Step 1: আগে ভালো আলোতে আরও স্পষ্ট ছবি তুলুন with re-scan button
    const step1 = steps![0]
    expect(step1.intro?.bn).toContain('আগে ভালো আলোতে আরও স্পষ্ট ছবি তুলুন')
    expect(step1.hasReScanButton).toBe(true)

    // Step 2: 16123 step
    const step2 = steps![1]
    expect(step2.title.bn).toContain('কখন কল করবেন')
    expect(step2.hasCallButton).toBe(true)

    // No disease names in any step
    const allText = JSON.stringify(steps)
    expect(allText).not.toMatch(/ব্লাস্ট|ব্লাইট|স্মাট|টুংরো|blast|blight|smut|tungro/i)
  })

  it('low → null', () => {
    const pred: Prediction = {
      tier: 'low',
      top: [
        { classId: 'blast', prob: 0.35 },
        { classId: 'brown_spot', prob: 0.33 },
      ],
      modelVersion: 'v1.0.0',
      trainedFromScratch: true,
      latencyMs: 100,
    }

    expect(buildRoadmap(pred, notSureCard)).toBeNull()
  })

  it('not_rice → null', () => {
    const pred: Prediction = {
      tier: 'not_rice',
      top: [
        { classId: 'not_rice', prob: 0.95 },
      ],
      modelVersion: 'v1.0.0',
      trainedFromScratch: true,
      latencyMs: 100,
    }

    expect(buildRoadmap(pred, notRiceCard)).toBeNull()
  })

  it('card with empty prevention → only steps 3–4', () => {
    const pred: Prediction = {
      tier: 'high',
      top: [
        { classId: 'blast', prob: 0.94 },
      ],
      modelVersion: 'v1.0.0',
      trainedFromScratch: true,
      latencyMs: 100,
    }

    const emptyPreventionCard: DiseaseCard = {
      ...blastCard,
      prevention: [],
    }

    const steps = buildRoadmap(pred, emptyPreventionCard)
    expect(steps).not.toBeNull()
    expect(steps).toHaveLength(2)

    // Only step 3 (৭ দিন পর) and step 4 (কখন কল করবেন)
    expect(steps![0].id).toBe('seven_days')
    expect(steps![0].title.bn).toContain('৭ দিন পর')
    expect(steps![1].id).toBe('call_expert')
    expect(steps![1].title.bn).toContain('কখন কল করবেন')
  })

  it('banned-words check: steps contain no pesticide, chemical or dosage strings', () => {
    const pred: Prediction = {
      tier: 'high',
      top: [{ classId: 'blast', prob: 0.92 }],
      modelVersion: 'v1.0.0',
      trainedFromScratch: true,
      latencyMs: 100,
    }

    const steps = buildRoadmap(pred, blastCard)
    expect(steps).not.toBeNull()

    const checkString = (text: string) => {
      for (const pattern of BANNED_PATTERNS) {
        expect(text).not.toMatch(pattern)
      }
    }

    steps?.forEach((step) => {
      checkString(step.title.bn)
      checkString(step.title.en)
      if (step.intro) {
        checkString(step.intro.bn)
        checkString(step.intro.en)
      }
      step.items?.forEach((item) => {
        checkString(item.bn)
        checkString(item.en)
      })
    })
  })
})
