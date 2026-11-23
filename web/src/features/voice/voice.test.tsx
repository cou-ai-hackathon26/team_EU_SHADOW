import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { buildSpokenText, pickVoice, useBanglaVoice } from './speak'
import { ListenButton } from './ListenButton'
import type { DiseaseCard } from '../../content/types'
import { getCard } from '../../content/getCard'

class FakeAudio {
  src: string
  currentTime = 0
  paused = true
  onplaying: (() => void) | null = null
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  static instances: FakeAudio[] = []

  constructor(src?: string) {
    this.src = src || ''
    FakeAudio.instances.push(this)
  }

  play(): Promise<void> {
    this.paused = false
    setTimeout(() => this.onplaying?.(), 0)
    return Promise.resolve()
  }

  pause(): void {
    this.paused = true
  }
}

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
  const brownSpotCard = getCard('brown_spot')
  const originalSpeechSynthesis = window.speechSynthesis
  const originalAudio = window.Audio

  beforeEach(() => {
    vi.clearAllMocks()
    FakeAudio.instances = []
    window.Audio = FakeAudio as unknown as typeof Audio
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      vi.fn().mockImplementation(function (text: string) {
        return { text, lang: '', voice: null }
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    window.Audio = originalAudio
    Object.defineProperty(window, 'speechSynthesis', {
      value: originalSpeechSynthesis,
      writable: true,
      configurable: true,
    })
  })

  it('3. disables button and shows explanation when both Audio and speechSynthesis are unavailable', () => {
    // @ts-expect-error simulating environment without Audio
    delete window.Audio
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

  it('4. disables button and shows "এই ডিভাইসে বাংলা ভয়েস নেই" when no Audio and no Bangla voice', () => {
    // @ts-expect-error simulating environment without Audio
    delete window.Audio
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

  it('5. No Bangla voice + high blast: button is ENABLED; clicking plays MP3; clicking again pauses; unmount pauses', async () => {
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

    const { unmount } = render(<ListenButton card={blastCard} tier="high" />)

    const button = screen.getByRole('button', { name: /শুনুন/i }) as HTMLButtonElement
    expect(button.disabled).toBe(false)

    fireEvent.click(button)
    expect(FakeAudio.instances.length).toBe(1)
    const audioInstance = FakeAudio.instances[0]
    expect(audioInstance.src).toMatch(/\/audio\/high-blast\.mp3$/)
    expect(audioInstance.paused).toBe(false)

    // Trigger onplaying to update state to playing (থামুন)
    act(() => {
      audioInstance.onplaying?.()
    })
    const pauseBtn = screen.getByRole('button', { name: /থামুন|পড়া বন্ধ করুন/i })
    expect(pauseBtn).toBeDefined()

    // Clicking again pauses
    fireEvent.click(pauseBtn)
    expect(audioInstance.paused).toBe(true)

    // Re-trigger and unmount
    fireEvent.click(screen.getByRole('button', { name: /শুনুন/i }))
    const secondAudio = FakeAudio.instances[1]
    expect(secondAudio.paused).toBe(false)
    unmount()
    expect(secondAudio.paused).toBe(true)
  })

  it('6. Bangla voice present + clip exists: still plays MP3, and speechSynthesis.speak is NOT called', () => {
    const speakMock = vi.fn()
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        cancel: vi.fn(),
        speak: speakMock,
        getVoices: vi.fn().mockReturnValue([
          { name: 'Bangla BD', lang: 'bn-BD' } as SpeechSynthesisVoice,
        ]),
        speaking: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      writable: true,
      configurable: true,
    })

    render(<ListenButton card={blastCard} tier="high" />)

    const button = screen.getByRole('button', { name: /শুনুন/i }) as HTMLButtonElement
    fireEvent.click(button)

    expect(FakeAudio.instances.length).toBe(1)
    expect(FakeAudio.instances[0].src).toMatch(/\/audio\/high-blast\.mp3$/)
    expect(speakMock).not.toHaveBeenCalled()
  })

  it('7. medium with secondCard + Bangla voice uses speechSynthesis, but with no Bangla voice plays medium-pair.mp3', () => {
    const speakMock = vi.fn()
    let spokenText = ''
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      vi.fn().mockImplementation(function (text: string) {
        spokenText = text
        return { text, lang: '', voice: null }
      })
    )

    // Case 1: Bangla voice present
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        cancel: vi.fn(),
        speak: speakMock,
        getVoices: vi.fn().mockReturnValue([
          { name: 'Bangla BD', lang: 'bn-BD' } as SpeechSynthesisVoice,
        ]),
        speaking: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      writable: true,
      configurable: true,
    })

    const { unmount: unmount1 } = render(
      <ListenButton card={blastCard} tier="medium" secondCard={brownSpotCard} />
    )
    fireEvent.click(screen.getByRole('button', { name: /শুনুন/i }))
    expect(speakMock).toHaveBeenCalled()
    expect(spokenText).toContain(blastCard.name.bn)
    expect(spokenText).toContain(brownSpotCard.name.bn)
    expect(FakeAudio.instances.length).toBe(0)
    unmount1()

    // Case 2: No Bangla voice present -> plays medium-pair.mp3
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

    render(
      <ListenButton card={blastCard} tier="medium" secondCard={brownSpotCard} />
    )
    fireEvent.click(screen.getByRole('button', { name: /শুনুন/i }))
    expect(FakeAudio.instances.length).toBe(1)
    expect(FakeAudio.instances[0].src).toMatch(/\/audio\/medium-pair\.mp3$/)
  })

  it('8. Audio play() rejects + Bangla voice: falls back to speechSynthesis.speak; Rejects + no voice: shows "অডিও চালানো যায়নি — লেখাটি পড়ে দেখুন"', async () => {
    class RejectingAudio extends FakeAudio {
      play(): Promise<void> {
        this.paused = true
        return Promise.reject(new Error('Audio playback blocked'))
      }
    }
    window.Audio = RejectingAudio as unknown as typeof Audio

    // Case 1: Bangla voice exists -> fallback to speak
    const speakMock = vi.fn()
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        cancel: vi.fn(),
        speak: speakMock,
        getVoices: vi.fn().mockReturnValue([
          { name: 'Bangla BD', lang: 'bn-BD' } as SpeechSynthesisVoice,
        ]),
        speaking: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      writable: true,
      configurable: true,
    })

    const { unmount: unmount1 } = render(<ListenButton card={blastCard} tier="high" />)
    fireEvent.click(screen.getByRole('button', { name: /শুনুন/i }))
    await act(async () => {
      await Promise.resolve()
    })
    expect(speakMock).toHaveBeenCalled()
    unmount1()

    // Case 2: No Bangla voice -> returns to শুনুন and displays error note
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        cancel: vi.fn(),
        speak: vi.fn(),
        getVoices: vi.fn().mockReturnValue([]),
        speaking: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      writable: true,
      configurable: true,
    })

    render(<ListenButton card={blastCard} tier="high" />)
    fireEvent.click(screen.getByRole('button', { name: /শুনুন/i }))
    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.getByText('অডিও চালানো যায়নি — লেখাটি পড়ে দেখুন')).toBeDefined()
  })

  it('9. No speechSynthesis at all but Audio exists: button still works with MP3', () => {
    Object.defineProperty(window, 'speechSynthesis', {
      value: undefined,
      writable: true,
      configurable: true,
    })

    render(<ListenButton card={blastCard} tier="high" />)
    const button = screen.getByRole('button', { name: /শুনুন/i }) as HTMLButtonElement
    expect(button.disabled).toBe(false)
    fireEvent.click(button)
    expect(FakeAudio.instances.length).toBe(1)
    expect(FakeAudio.instances[0].src).toMatch(/\/audio\/high-blast\.mp3$/)
  })

  it('10. The voiceschanged listener: a voice added later is picked up by useBanglaVoice', () => {
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

    function VoiceConsumer() {
      const { hasBanglaVoice, voice } = useBanglaVoice()
      return (
        <div>
          <span data-testid="has-voice">{String(hasBanglaVoice)}</span>
          <span data-testid="voice-lang">{voice?.lang || ''}</span>
        </div>
      )
    }

    render(<VoiceConsumer />)
    expect(screen.getByTestId('has-voice').textContent).toBe('false')

    act(() => {
      currentVoices = [{ name: 'Bangla BD', lang: 'bn-BD' } as SpeechSynthesisVoice]
      voicesChangedHandler?.()
    })

    expect(screen.getByTestId('has-voice').textContent).toBe('true')
    expect(screen.getByTestId('voice-lang').textContent).toBe('bn-BD')
  })
})
