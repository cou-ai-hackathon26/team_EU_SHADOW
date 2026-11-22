import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { buildSpokenText, pickVoice } from './speak'
import { ListenButton } from './ListenButton'
import type { DiseaseCard } from '../../content/types'
import { getCard } from '../../content/getCard'

describe('F8: Voice readout logic (speak.ts)', () => {
  const blastCard: DiseaseCard = getCard('blast')
  const healthyCard: DiseaseCard = getCard('healthy')
  const brownSpotCard: DiseaseCard = getCard('brown_spot')

  it('1. buildSpokenText generates natural Bangla sentences across tiers', () => {
    // High tier disease
    const highText = buildSpokenText(blastCard, 'high')
    expect(highText).toContain(blastCard.name.bn)
    expect(highText).toContain('১৬১২৩')

    // High tier healthy
    const healthyText = buildSpokenText(healthyCard, 'high')
    expect(healthyText).toContain('সুস্থ')
    expect(healthyText).toContain('লক্ষণ নেই')

    // Medium tier without second card
    const mediumText = buildSpokenText(blastCard, 'medium')
    expect(mediumText).toContain('সম্ভাব্য')
    expect(mediumText).toContain(blastCard.name.bn)

    // Medium tier with second card (Fix 2 requirement)
    const mediumWithSecond = buildSpokenText(blastCard, 'medium', brownSpotCard)
    expect(mediumWithSecond).toContain(blastCard.name.bn)
    expect(mediumWithSecond).toContain(brownSpotCard.name.bn)
    expect(mediumWithSecond).toContain('পরিষ্কার ছবি')
    expect(mediumWithSecond).toContain('১৬১২৩')

    // Low tier (Fix 2 requirement: exact "আমি নিশ্চিত নই")
    const lowText = buildSpokenText(blastCard, 'low')
    expect(lowText).toContain('আমি নিশ্চিত নই')
    expect(lowText).toContain('ছবি')
    expect(lowText).toContain('১৬১২৩')

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
    const getVoicesMock = vi.fn().mockReturnValue([
      { name: 'Bangla BD', lang: 'bn-BD' } as SpeechSynthesisVoice,
    ])

    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        cancel: cancelMock,
        speak: speakMock,
        getVoices: getVoicesMock,
        speaking: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
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

  it('5. disables button and shows "এই ডিভাইসে বাংলা ভয়েস নেই — লেখাটি পড়ে দেখুন" when no bn voice is installed', () => {
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        cancel: vi.fn(),
        speak: vi.fn(),
        getVoices: vi.fn().mockReturnValue([
          { name: 'Alex', lang: 'en-US' } as SpeechSynthesisVoice,
        ]),
        speaking: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      writable: true,
      configurable: true,
    })

    render(<ListenButton card={blastCard} tier="high" />)

    const button = screen.getByRole('button') as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(screen.getByText('এই ডিভাইসে বাংলা ভয়েস নেই — লেখাটি পড়ে দেখুন')).toBeDefined()
  })

  it('6. enables button when voices arrive later through voiceschanged event with a bn-BD voice', () => {
    let voicesChangedHandler: (() => void) | undefined
    let currentVoices: SpeechSynthesisVoice[] = []

    const addEventListenerMock = vi.fn().mockImplementation((event, handler) => {
      if (event === 'voiceschanged') {
        voicesChangedHandler = handler
      }
    })

    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        cancel: vi.fn(),
        speak: vi.fn(),
        getVoices: vi.fn().mockImplementation(() => currentVoices),
        speaking: false,
        addEventListener: addEventListenerMock,
        removeEventListener: vi.fn(),
      },
      writable: true,
      configurable: true,
    })

    render(<ListenButton card={blastCard} tier="high" />)

    const button = screen.getByRole('button') as HTMLButtonElement
    // Initially disabled because currentVoices is []
    expect(button.disabled).toBe(true)

    // Now voices arrive asynchronously through voiceschanged
    act(() => {
      currentVoices = [
        { name: 'Bangla BD', lang: 'bn-BD' } as SpeechSynthesisVoice,
      ]
      voicesChangedHandler?.()
    })

    // Button should now become enabled
    const enabledButton = screen.getByRole('button', { name: /শুনুন/i }) as HTMLButtonElement
    expect(enabledButton.disabled).toBe(false)
  })
})
