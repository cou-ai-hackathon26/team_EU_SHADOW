import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { buildSpokenText, pickVoice } from './speak'
import { ListenButton } from './ListenButton'
import type { DiseaseCard } from '../../content/types'
import { getCard } from '../../content/getCard'

describe('F8: Voice readout logic (speak.ts)', () => {
  const blastCard: DiseaseCard = getCard('blast')
  const healthyCard: DiseaseCard = getCard('healthy')

  it('1. buildSpokenText generates natural Bangla sentences across tiers', () => {
    // High tier disease
    const highText = buildSpokenText(blastCard, 'high')
    expect(highText).toContain(blastCard.name.bn)
    expect(highText).toContain('১৬১২৩')

    // High tier healthy
    const healthyText = buildSpokenText(healthyCard, 'high')
    expect(healthyText).toContain('সুস্থ')
    expect(healthyText).toContain('লক্ষণ নেই')

    // Medium tier
    const mediumText = buildSpokenText(blastCard, 'medium')
    expect(mediumText).toContain('সম্ভাব্য')
    expect(mediumText).toContain(blastCard.name.bn)

    // Low tier
    const lowText = buildSpokenText(blastCard, 'low')
    expect(lowText).toContain('নিশ্চিত হতে পারছি না')

    // Not rice tier
    const notRiceCard = getCard('not_rice')
    const notRiceText = buildSpokenText(notRiceCard, 'not_rice')
    expect(notRiceText).toContain('ধানপাতা মনে হচ্ছে না')
  })

  it('2. pickVoice selects bn-BD voice when present', () => {
    const mockVoices = [
      { name: 'US English', lang: 'en-US' } as SpeechSynthesisVoice,
      { name: 'Bangla India', lang: 'bn-IN' } as SpeechSynthesisVoice,
      { name: 'Bangla Bangladesh', lang: 'bn-BD' } as SpeechSynthesisVoice,
    ]

    const selected = pickVoice(mockVoices)
    expect(selected?.lang).toBe('bn-BD')

    // fallback to generic bn
    const withoutBd = [
      { name: 'US English', lang: 'en-US' } as SpeechSynthesisVoice,
      { name: 'Bangla India', lang: 'bn-IN' } as SpeechSynthesisVoice,
    ]
    expect(pickVoice(withoutBd)?.lang).toBe('bn-IN')

    // empty when no bangla voice
    expect(pickVoice([{ name: 'US English', lang: 'en-US' } as SpeechSynthesisVoice])).toBeUndefined()
  })
})

describe('F8: ListenButton component', () => {
  const blastCard = getCard('blast')
  const originalSpeechSynthesis = window.speechSynthesis

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    Object.defineProperty(window, 'speechSynthesis', {
      value: originalSpeechSynthesis,
      writable: true,
      configurable: true,
    })
  })

  it('3. disables button and shows explanation when speechSynthesis is unavailable', () => {
    // simulate browser without speech synthesis
    Object.defineProperty(window, 'speechSynthesis', {
      value: undefined,
      writable: true,
      configurable: true,
    })

    render(<ListenButton card={blastCard} tier="high" />)

    const button = screen.getByRole('button') as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(screen.getByText(/ভয়েস সুবিধা নেই|ভয়েস সাপোর্ট নেই/)).toBeDefined()
  })

  it('4. speaks when clicked and cancels speech when unmounted', () => {
    const cancelMock = vi.fn()
    const speakMock = vi.fn()
    const getVoicesMock = vi.fn().mockReturnValue([])

    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        cancel: cancelMock,
        speak: speakMock,
        getVoices: getVoicesMock,
        speaking: false,
      },
      writable: true,
      configurable: true,
    })

    // Mock SpeechSynthesisUtterance using Vitest official stubGlobal
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      vi.fn().mockImplementation(function (text: string) {
        return { text, lang: '', voice: null }
      })
    )

    const { unmount } = render(<ListenButton card={blastCard} tier="high" />)

    const button = screen.getByRole('button', { name: /শুনুন/i }) as HTMLButtonElement
    expect(button.disabled).toBe(false)

    fireEvent.click(button)
    expect(speakMock).toHaveBeenCalledTimes(1)

    // Unmount stops speech (requirement: Screen বদলালে কথা থেমে যায়)
    unmount()
    expect(cancelMock).toHaveBeenCalled()
  })
})
