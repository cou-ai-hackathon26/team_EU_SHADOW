import { useState, useEffect } from 'react'
import type { DiseaseCard } from '../../content/types'
import type { ConfidenceTier } from '../../ai/types'

/**
 * Checks if the current browser environment supports the Web Speech API.
 */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && Boolean(window.speechSynthesis)
}

/**
 * Builds a natural, conversational Bangla explanation for farmers based on the diagnosed card and tier.
 */
export function buildSpokenText(
  card: DiseaseCard,
  tier: ConfidenceTier,
  secondCard?: DiseaseCard
): string {
  if (tier === 'not_rice') {
    return 'এটি ধানপাতা মনে হচ্ছে না। দয়া করে ধানের একটি পরিষ্কার পাতার ছবি তুলে আবার চেষ্টা করুন।'
  }

  if (tier === 'low') {
    return 'আমি নিশ্চিত নই। লক্ষণ স্পষ্ট নয়। দয়া করে ভালো আলোয় পাতাটির নতুন পরিষ্কার ছবি তুলুন অথবা বিশেষজ্ঞের পরামর্শ নিতে ১৬১২৩ নম্বরে যোগাযোগ করুন।'
  }

  if (tier === 'medium') {
    if (secondCard) {
      return `এটি সম্ভবত ${card.name.bn} অথবা ${secondCard.name.bn}। আরও পরিষ্কার ছবি তুলুন। নিশ্চিত হতে কৃষি কল সেন্টার ১৬১২৩-এ যোগাযোগ করুন।`
    }
    const preventionSummary = card.prevention[0]?.bn || card.summary.bn
    return `শনাক্ত হয়েছে সম্ভাব্য ${card.name.bn}। তবে লক্ষণ পুরোপুরি স্পষ্ট নয়। আরও পরিষ্কার ছবি তুলুন। প্রাথমিক পরামর্শ: ${preventionSummary}। নিশ্চিত হতে ১৬১২৩-এ যোগাযোগ করুন।`
  }

  // High confidence tier
  if (card.id === 'healthy') {
    return 'আপনার ধানপাতাটি সম্পূর্ণ সুস্থ দেখাচ্ছে। কোনো রোগের লক্ষণ নেই। নিয়মিত সুষম সার ও সেচ পরিচর্যা বজায় রাখুন।'
  }

  const primarySymptom = card.symptoms[0]?.bn ? `লক্ষণ: ${card.symptoms[0].bn}।` : ''
  const primaryPrevention = card.prevention[0]?.bn ? `প্রাথমিক প্রতিরোধ: ${card.prevention[0].bn}।` : ''

  return `শনাক্ত হয়েছে ${card.name.bn}। ${primarySymptom} ${primaryPrevention} জরুরি প্রয়োজনে সরাসরি কথা বলতে কৃষি কল সেন্টার ১৬১২৩ নম্বরে কল করুন।`
}

/**
 * Selects an appropriate Bengali voice from available synthesis voices, prioritizing bn-BD.
 */
export function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  if (!voices || voices.length === 0) return undefined

  // 1st priority: Exact Bangladesh Bangla
  const bdVoice = voices.find((v) => v.lang === 'bn-BD' || v.lang === 'bn_BD')
  if (bdVoice) return bdVoice

  // 2nd priority: Any Bangla locale
  const anyBnVoice = voices.find((v) => v.lang.toLowerCase().startsWith('bn'))
  if (anyBnVoice) return anyBnVoice

  return undefined
}

export interface BanglaVoiceState {
  supported: boolean
  voice: SpeechSynthesisVoice | undefined
  hasBanglaVoice: boolean
}

/**
 * React hook that inspects speech synthesis, listens to 'voiceschanged', and tracks Bangla voice availability.
 */
export function useBanglaVoice(): BanglaVoiceState {
  const supported = isSpeechSupported()
  const [voice, setVoice] = useState<SpeechSynthesisVoice | undefined>(() => {
    if (!supported || typeof window === 'undefined' || !window.speechSynthesis) return undefined
    try {
      return pickVoice(window.speechSynthesis.getVoices())
    } catch {
      return undefined
    }
  })

  useEffect(() => {
    if (!supported || typeof window === 'undefined' || !window.speechSynthesis) return

    const synth = window.speechSynthesis
    const updateVoice = () => {
      try {
        const voices = synth.getVoices()
        setVoice(pickVoice(voices))
      } catch {
        // ignore in mock environments
      }
    }

    updateVoice()

    synth.addEventListener?.('voiceschanged', updateVoice)
    const prevOnVoicesChanged = synth.onvoiceschanged
    synth.onvoiceschanged = updateVoice

    return () => {
      synth.removeEventListener?.('voiceschanged', updateVoice)
      if (synth.onvoiceschanged === updateVoice) {
        synth.onvoiceschanged = prevOnVoicesChanged
      }
    }
  }, [supported])

  return {
    supported,
    voice,
    hasBanglaVoice: Boolean(voice),
  }
}

/**
 * Cancels any active speech synthesis.
 */
export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    try {
      window.speechSynthesis.cancel()
    } catch {
      // ignore in test or unsupported environments
    }
  }
}

/**
 * Speaks the provided text using Web Speech API with bn-BD voice fallback.
 */
export function speakText(
  text: string,
  options?: {
    voice?: SpeechSynthesisVoice
    onStart?: () => void
    onEnd?: () => void
    onError?: () => void
  }
): { cancel: () => void } {
  if (!isSpeechSupported()) {
    options?.onError?.()
    return { cancel: () => {} }
  }

  stopSpeaking()

  try {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'bn-BD'

    const voice = options?.voice ?? pickVoice(window.speechSynthesis.getVoices())
    if (voice) {
      utterance.voice = voice
    }

    utterance.onstart = () => {
      options?.onStart?.()
    }

    utterance.onend = () => {
      options?.onEnd?.()
    }

    utterance.onerror = () => {
      options?.onError?.()
    }

    window.speechSynthesis.speak(utterance)

    return {
      cancel: stopSpeaking,
    }
  } catch {
    options?.onError?.()
    return { cancel: () => {} }
  }
}
