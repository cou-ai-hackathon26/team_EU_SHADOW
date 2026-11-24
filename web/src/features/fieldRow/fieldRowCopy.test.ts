import { describe, it, expect } from 'vitest'
import {
  FIELD_ROW_COPY,
  STATUS_COPY,
  ABSTAIN_COPY,
  progressText,
  summaryLine,
} from './fieldRowCopy'
import { ABSTENTION_REASONS, type FieldSummary, type LeafStatus } from '../../ai/fieldRow.types'

const BANGLA_CHAR_REGEX = /[\u0980-\u09FF]/

const BANNED_PATTERNS = [
  /carbendazim/i,
  /tricyclazole/i,
  /mancozeb/i,
  /hexaconazole/i,
  /propiconazole/i,
  /chlorpyrifos/i,
  /cartap/i,
  /malathion/i,
  /fipronil/i,
  /cypermethrin/i,
  /thiamethoxam/i,
  /imidacloprid/i,
  /pesticide/i,
  /fungicide/i,
  /insecticide/i,
  /কার্বেনডাজিম/,
  /ট্রাইসাইক্লাজোল/,
  /ম্যানকোজেব/,
  /হেক্সাকোনাজোল/,
  /প্রোপিকোনাজোল/,
  /ক্লোরপাইরিফস/,
  /কারটাপ/,
  /ম্যালাথিয়ন/,
  /ফিপ্রোনিল/,
  /সাইপারমেথ্রিন/,
  /থায়ামেথোক্সাম/,
  /ইমিডাক্লোপ্রিড/,
  /কীটনাশক/,
  /ছত্রাকনাশক/,
  /বালাইনাশক/,
  /[0-9০-৯]+\s*(?:ml|mL|milli|l|g|gm|gram|kg|লিটার|মিলি|গ্রাম|কেজি)(?![a-zA-Z])/i,
  /ডোজ/i,
  /\bdose\b/i,
]

describe('fieldRowCopy (C1 + C2 UI Copy & Safety)', () => {
  it('1. progressText formats progress with correct localized digits and wording', () => {
    expect(progressText(3, 8, 'bn')).toBe('পাতা ৩/৮ বিশ্লেষণ হচ্ছে…')
    expect(progressText(3, 8, 'en')).toBe('Analyzing leaf 3/8…')
  })

  it('2. STATUS_COPY covers all 4 LeafStatus values with non-empty bn and en', () => {
    const statuses: LeafStatus[] = ['healthy', 'diseased', 'uncertain', 'abstained']
    for (const st of statuses) {
      expect(STATUS_COPY[st]).toBeDefined()
      expect(STATUS_COPY[st].bn.trim().length).toBeGreaterThan(0)
      expect(STATUS_COPY[st].en.trim().length).toBeGreaterThan(0)
      expect(BANGLA_CHAR_REGEX.test(STATUS_COPY[st].bn)).toBe(true)
      expect(BANGLA_CHAR_REGEX.test(STATUS_COPY[st].en)).toBe(false)
    }
  })

  it('3. ABSTAIN_COPY covers exactly the 3 AbstentionReason entries with title, desc, and tip', () => {
    expect(Object.keys(ABSTAIN_COPY).sort()).toEqual([...ABSTENTION_REASONS].sort())

    for (const reason of ABSTENTION_REASONS) {
      const entry = (ABSTAIN_COPY as any)[reason]
      expect(entry).toBeDefined()
      expect(entry.title).toBeDefined()
      expect(entry.desc).toBeDefined()
      expect(entry.tip).toBeDefined()

      for (const section of ['title', 'desc', 'tip'] as const) {
        const pair = entry[section]
        expect(pair.bn.trim().length).toBeGreaterThan(0)
        expect(pair.en.trim().length).toBeGreaterThan(0)
        expect(BANGLA_CHAR_REGEX.test(pair.bn)).toBe(true)
        expect(BANGLA_CHAR_REGEX.test(pair.en)).toBe(false)
      }
    }
  })

  it('4. FIELD_ROW_COPY contains all required UI keys with valid bn and en strings', () => {
    const requiredKeys = [
      'title',
      'hint',
      'summaryTitle',
      'detecting',
      'cancel',
      'retry',
      'totalLeaves',
      'screened',
      'healthyCount',
      'diseasedCount',
      'uncertainCount',
      'skippedCount',
      'highestRisk',
      'maxConfidence',
      'noLeafFound',
      'gridFallbackNote',
      'fieldDisclaimer',
    ]

    for (const k of requiredKeys) {
      const pair = (FIELD_ROW_COPY as any)[k]
      expect(pair, `Missing FIELD_ROW_COPY key: "${k}"`).toBeDefined()
      expect(pair.bn.trim().length).toBeGreaterThan(0)
      expect(pair.en.trim().length).toBeGreaterThan(0)
      expect(BANGLA_CHAR_REGEX.test(pair.bn)).toBe(true)
      expect(BANGLA_CHAR_REGEX.test(pair.en)).toBe(false)
    }
  })

  it('5. strictly adheres to banned pesticide and chemical names policy', () => {
    const allText: string[] = []

    for (const val of Object.values(FIELD_ROW_COPY)) {
      allText.push((val as any).bn, (val as any).en)
    }
    for (const val of Object.values(STATUS_COPY)) {
      allText.push(val.bn, val.en)
    }
    for (const val of Object.values(ABSTAIN_COPY)) {
      const entry = val as any
      allText.push(entry.title.bn, entry.title.en, entry.desc.bn, entry.desc.en)
      if (entry.tip) allText.push(entry.tip.bn, entry.tip.en)
    }

    for (const text of allText) {
      for (const pattern of BANNED_PATTERNS) {
        expect(
          pattern.test(text),
          `Found banned pattern "${pattern}" in copy: "${text}"`,
        ).toBe(false)
      }
    }
  })

  it('6. summaryLine formats localized human-readable summary string with Bangla digits', () => {
    const mockSummary: FieldSummary = {
      totalRegions: 8,
      screened: 7,
      healthy: 5,
      diseased: 2,
      uncertain: 0,
      abstained: 1,
      byDisease: { blast: 2 },
      abstainedByReason: { dead_leaf: 1, not_rice: 0, unrelated_crop: 0 },
      highestRisk: { classId: 'blast', count: 2, maxConfidence: 0.89 },
      diseasedShare: 2 / 7,
      fieldAbstain: null,
    }

    const bnLine = summaryLine(mockSummary, 'bn')
    expect(bnLine).toContain('৮টি')
    expect(bnLine).toContain('৫টি সুস্থ')
    expect(bnLine).toContain('২টি রোগাক্রান্ত')
    expect(bnLine).toContain('১টি বাদ')

    const enLine = summaryLine(mockSummary, 'en')
    expect(enLine).toContain('8 leaves')
    expect(enLine).toContain('5 healthy')
    expect(enLine).toContain('2 diseased')
    expect(enLine).toContain('1 skipped')
  })
})
