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
export function buildSpokenText(card: DiseaseCard, tier: ConfidenceTier): string {
  if (tier === 'not_rice') {
    return 'এটি ধানপাতা মনে হচ্ছে না। দয়া করে ধানের একটি পরিষ্কার পাতার ছবি তুলে আবার চেষ্টা করুন।'
  }

  if (tier === 'low') {
    return 'আমরা নিশ্চিত হতে পারছি না। লক্ষণ স্পষ্ট নয়। দয়া করে ভালো আলোয় পাতাটির নতুন ছবি তুলুন অথবা বিশেষজ্ঞের পরামর্শ নিতে ১৬১২৩ নম্বরে যোগাযোগ করুন।'
  }

  if (tier === 'medium') {
    const preventionSummary = card.prevention[0]?.bn || card.summary.bn
    return `শনাক্ত হয়েছে সম্ভাব্য ${card.name.bn}। তবে লক্ষণ পুরোপুরি স্পষ্ট নয়। প্রাথমিক পরামর্শ: ${preventionSummary}। নিশ্চিত হতে ১৬১২৩-এ যোগাযোগ করুন।`
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

    const voices = window.speechSynthesis.getVoices()
    const voice = pickVoice(voices)
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
