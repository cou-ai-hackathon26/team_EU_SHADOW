import { describe, it, expect } from 'vitest'
import { validateFile } from '../src/features/capture/validateFile'
import { assessQuality } from '../src/features/quality/quality'
import { decideTier } from '../src/ai/decideTier'
import {
  createDarkImageData,
  createBrightImageData,
  createBlurryImageData,
  createSharpImageData,
  createOversizedFile,
  createInvalidExtensionFile,
} from './fixtures/mockImages'
import fixturesData from './fixtures/fixtures.json'
import type { ModelMeta } from '../src/ai/types'

const mockModelMeta: ModelMeta = {
  version: 'v1-mnv3s-scratch',
  architecture: 'MobileNetV3-Small',
  trainedFromScratch: true,
  classes: ['healthy', 'blast', 'brown_spot', 'leaf_smut', 'tungro', 'sheath_blight', 'not_rice'],
  inputSize: 224,
  mean: [0.485, 0.456, 0.406],
  std: [0.229, 0.224, 0.225],
  temperature: 1.0,
  thresholds: {
    high: 0.8,
    medium: 0.5,
    healthyHigh: 0.85,
    notRice: 0.35,
  },
  camOutput: false,
}

describe('F10: Edge-Case Test Suite (35 Edge-Case Scenarios)', () => {
  it('1. fixtures.json contains at least 30 edge-case definitions covering all required categories', () => {
    expect(fixturesData.length).toBeGreaterThanOrEqual(30)

    const categories = new Set(fixturesData.map((f) => f.category))
    expect(categories.has('class_coverage')).toBe(true)
    expect(categories.has('quality_blur')).toBe(true)
    expect(categories.has('quality_dark')).toBe(true)
    expect(categories.has('quality_bright')).toBe(true)
    expect(categories.has('not_rice')).toBe(true)
    expect(categories.has('file_validation')).toBe(true)
  })

  describe('2. File validation edge cases (file size & formats)', () => {
    it('rejects files larger than 10 MB (EC-34: oversized_file_11mb)', () => {
      const oversized = createOversizedFile(10.5)
      const result = validateFile(oversized)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('১০ মেগাবাইট')
    })

    it('rejects non-image file formats (EC-35: invalid_extension_document)', () => {
      const invalid = createInvalidExtensionFile()
      const result = validateFile(invalid)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('শুধুমাত্র JPG, PNG বা WebP')
    })

    it('accepts valid JPEG, PNG, and WebP files under 10 MB', () => {
      const validJpg = new File([new Uint8Array(100)], 'leaf.jpg', { type: 'image/jpeg' })
      const validPng = new File([new Uint8Array(100)], 'leaf.png', { type: 'image/png' })
      const validWebp = new File([new Uint8Array(100)], 'leaf.webp', { type: 'image/webp' })

      expect(validateFile(validJpg).valid).toBe(true)
      expect(validateFile(validPng).valid).toBe(true)
      expect(validateFile(validWebp).valid).toBe(true)
    })
  })

  describe('3. Image quality edge cases (dark, bright, blurry)', () => {
    it('detects dark underexposed images (EC-19 to EC-24)', () => {
      const darkImg = createDarkImageData(64, 64, 25)
      const report = assessQuality(darkImg)
      expect(report).not.toBeNull()
      expect(report!.tooDark).toBe(true)
      expect(report!.tooBright).toBe(false)
      expect(report!.brightness).toBeLessThan(40)
    })

    it('detects overexposed / glare images (EC-25 to EC-28)', () => {
      const brightImg = createBrightImageData(64, 64, 235)
      const report = assessQuality(brightImg)
      expect(report).not.toBeNull()
      expect(report!.tooBright).toBe(true)
      expect(report!.tooDark).toBe(false)
      expect(report!.brightness).toBeGreaterThan(220)
    })

    it('detects blurry images with low Laplacian sharpness (EC-13 to EC-18)', () => {
      const blurImg = createBlurryImageData(64, 64)
      const report = assessQuality(blurImg)
      expect(report).not.toBeNull()
      expect(report!.tooBlurry).toBe(true)
      expect(report!.sharpness).toBeLessThan(15)
    })

    it('passes sharp, well-lit leaf images without any warnings', () => {
      const sharpImg = createSharpImageData(64, 64)
      const report = assessQuality(sharpImg)
      expect(report).not.toBeNull()
      expect(report!.tooDark).toBe(false)
      expect(report!.tooBright).toBe(false)
      expect(report!.tooBlurry).toBe(false)
    })
  })

  describe('4. AI Confidence Tiers & Decision Rules', () => {
    it('routes high confidence predictions to "high" tier', () => {
      const topProbs = [
        { classId: 'blast' as const, prob: 0.92 },
        { classId: 'brown_spot' as const, prob: 0.05 },
      ]
      const tier = decideTier(topProbs, mockModelMeta)
      expect(tier).toBe('high')
    })

    it('routes medium confidence predictions to "medium" tier (top-2 prompt)', () => {
      const topProbs = [
        { classId: 'blast' as const, prob: 0.65 },
        { classId: 'brown_spot' as const, prob: 0.25 },
      ]
      const tier = decideTier(topProbs, mockModelMeta)
      expect(tier).toBe('medium')
    })

    it('routes low confidence predictions to "low" tier ("আমি নিশ্চিত নই")', () => {
      const topProbs = [
        { classId: 'blast' as const, prob: 0.42 },
        { classId: 'brown_spot' as const, prob: 0.38 },
      ]
      const tier = decideTier(topProbs, mockModelMeta)
      expect(tier).toBe('low')
    })

    it('routes not_rice class to "not_rice" tier ("এটি ধানপাতা মনে হচ্ছে না")', () => {
      const topProbs = [
        { classId: 'not_rice' as const, prob: 0.55 },
        { classId: 'blast' as const, prob: 0.2 },
      ]
      const tier = decideTier(topProbs, mockModelMeta)
      expect(tier).toBe('not_rice')
    })

    it('enforces stricter bar for "healthy" leaf before declaring healthy', () => {
      // 0.82 is above normal high threshold (0.80) but below healthyHigh (0.85)
      const topProbs = [
        { classId: 'healthy' as const, prob: 0.82 },
        { classId: 'blast' as const, prob: 0.1 },
      ]
      const tier = decideTier(topProbs, mockModelMeta)
      // Must not declare healthy high tier when below healthyHigh threshold
      expect(tier).toBe('medium')
    })
  })
})
