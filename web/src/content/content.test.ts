import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DISEASE_CLASS_IDS, NOT_RICE_CLASS_ID } from '../ai/classes'
import type { DiseaseCard } from './types'
import { getCard } from './getCard'
import diseasesData from './diseases.json'
import { DiseaseCardView } from './DiseaseCardView'

const EXPECTED_IDS = [
  ...DISEASE_CLASS_IDS,
  NOT_RICE_CLASS_ID,
  'not_sure',
] as const

export const BANNED_PATTERNS = [
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

describe('F6: Disease Cards Content & Logic', () => {
  const cards = diseasesData as DiseaseCard[]

  it('contains exactly 8 cards for 6 disease classes + not_rice + not_sure', () => {
    expect(cards).toHaveLength(8)
    const cardIds = cards.map((c: DiseaseCard) => c.id)
    for (const expectedId of EXPECTED_IDS) {
      expect(cardIds).toContain(expectedId)
    }
  })

  it('adheres to DiseaseCard schema with non-empty bn and en strings', () => {
    for (const card of cards) {
      expect(EXPECTED_IDS).toContain(card.id)
      expect(['none', 'watch', 'act']).toContain(card.severity)

      expect(card.name.bn.trim().length).toBeGreaterThan(0)
      expect(card.name.en.trim().length).toBeGreaterThan(0)

      expect(card.summary.bn.trim().length).toBeGreaterThan(0)
      expect(card.summary.en.trim().length).toBeGreaterThan(0)

      expect(card.whenToCallExpert.bn.trim().length).toBeGreaterThan(0)
      expect(card.whenToCallExpert.en.trim().length).toBeGreaterThan(0)

      expect(card.symptoms.length).toBeGreaterThan(0)
      card.symptoms.forEach((s) => {
        expect(s.bn.trim().length).toBeGreaterThan(0)
        expect(s.en.trim().length).toBeGreaterThan(0)
      })

      expect(card.causes.length).toBeGreaterThan(0)
      card.causes.forEach((c) => {
        expect(c.bn.trim().length).toBeGreaterThan(0)
        expect(c.en.trim().length).toBeGreaterThan(0)
      })

      expect(card.prevention.length).toBeGreaterThan(0)
      card.prevention.forEach((p) => {
        expect(p.bn.trim().length).toBeGreaterThan(0)
        expect(p.en.trim().length).toBeGreaterThan(0)
      })
    }
  })

  it('every card has at least one https source from BRRI, DAE, or IRRI', () => {
    const validPublishers = new Set(['BRRI', 'DAE', 'IRRI'])
    for (const card of cards) {
      expect(card.sources.length).toBeGreaterThan(0)
      const hasOfficial = card.sources.some((s) => validPublishers.has(s.publisher))
      expect(hasOfficial).toBe(true)

      for (const s of card.sources) {
        expect(s.url.startsWith('https://')).toBe(true)
        expect(s.title.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('no source url in diseases.json may be a bare home page (url path must not be empty or "/")', () => {
    for (const card of cards) {
      for (const s of card.sources) {
        const parsed = new URL(s.url)
        expect(
          parsed.pathname !== '' && parsed.pathname !== '/',
          `Source URL "${s.url}" in card "${card.id}" must not be a bare home page`
        ).toBe(true)
      }
    }
  })

  it('flags dose units with English and Bangla numbers', () => {
    const doseSamples = ['10 লিটার', '১০ গ্রাম', '৫ মিলি', '2 kg', '20ml']
    for (const sample of doseSamples) {
      const matched = BANNED_PATTERNS.some((pattern) => pattern.test(sample))
      expect(matched, `Expected dose sample "${sample}" to be flagged by banned patterns`).toBe(true)
    }
  })

  it('strictly adheres to banned-words policy (no chemical names, pesticide brands, or dosage metrics)', () => {
    const jsonString = JSON.stringify(cards)
    for (const pattern of BANNED_PATTERNS) {
      const match = jsonString.match(pattern)
      expect(match, `Found banned word or dosage pattern "${pattern}" in diseases content`).toBeNull()
    }
  })

  it('getCard returns correct card by classId and falls back to not_sure for unknown ids', () => {
    const blastCard = getCard('blast')
    expect(blastCard.id).toBe('blast')
    expect(blastCard.name.en).toMatch(/blast/i)

    const healthyCard = getCard('healthy')
    expect(healthyCard.id).toBe('healthy')
    expect(healthyCard.severity).toBe('none')

    // fallback for invalid or missing IDs
    const unknownCard = getCard('non_existent_disease_xyz')
    expect(unknownCard.id).toBe('not_sure')
  })
})

describe('F6: DiseaseCardView component', () => {
  it('renders card details in Bengali by default', () => {
    const card = getCard('blast')
    render(React.createElement(DiseaseCardView, { card, lang: 'bn' }))

    expect(screen.getByRole('heading', { name: card.name.bn })).toBeDefined()
    expect(screen.getByText(card.summary.bn)).toBeDefined()
    expect(screen.getByText(card.whenToCallExpert.bn)).toBeDefined()
  })

  it('renders card details in English when requested', () => {
    const card = getCard('blast')
    render(React.createElement(DiseaseCardView, { card, lang: 'en' }))

    expect(screen.getByRole('heading', { name: card.name.en })).toBeDefined()
    expect(screen.getByText(card.summary.en)).toBeDefined()
    expect(screen.getByText(card.whenToCallExpert.en)).toBeDefined()
  })
})
