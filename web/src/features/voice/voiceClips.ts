import type { DiseaseCard } from '../../content/types'
import type { ConfidenceTier } from '../../ai/types'
import { getCard } from '../../content/getCard'
import { buildSpokenText } from './speak'
import manifestData from './voice-manifest.json'

export const MEDIUM_PAIR_TEXT =
  'এটি দুটি রোগের যেকোনো একটি হতে পারে — রোগ দুটির নাম স্ক্রিনে দেখুন। আরও পরিষ্কার ছবি তুলুন। নিশ্চিত হতে কৃষি কল সেন্টার ১৬১২৩-এ যোগাযোগ করুন।'

export const RICE_CLASS_IDS = [
  'healthy',
  'blast',
  'brown_spot',
  'leaf_smut',
  'tungro',
  'sheath_blight',
] as const

export type RiceClassId = (typeof RICE_CLASS_IDS)[number]

export interface VoiceManifestEntry {
  key: string
  file: string
  text: string
}

export function clipKeyFor(
  card: DiseaseCard,
  tier: ConfidenceTier,
  secondCard?: DiseaseCard
): string {
  if (tier === 'not_rice') {
    return 'not_rice'
  }
  if (tier === 'low') {
    return 'low'
  }
  if (tier === 'medium') {
    if (secondCard) {
      return 'medium-pair'
    }
    return `medium-${card.id}`
  }
  return `high-${card.id}`
}

export function buildVoiceManifest(): VoiceManifestEntry[] {
  const entries: VoiceManifestEntry[] = []

  for (const id of RICE_CLASS_IDS) {
    const key = `high-${id}`
    entries.push({
      key,
      file: `${key}.mp3`,
      text: buildSpokenText(getCard(id), 'high'),
    })
  }

  for (const id of RICE_CLASS_IDS) {
    const key = `medium-${id}`
    entries.push({
      key,
      file: `${key}.mp3`,
      text: buildSpokenText(getCard(id), 'medium'),
    })
  }

  entries.push({
    key: 'medium-pair',
    file: 'medium-pair.mp3',
    text: MEDIUM_PAIR_TEXT,
  })

  entries.push({
    key: 'low',
    file: 'low.mp3',
    text: buildSpokenText(getCard('not_sure'), 'low'),
  })

  entries.push({
    key: 'not_rice',
    file: 'not_rice.mp3',
    text: buildSpokenText(getCard('not_rice'), 'not_rice'),
  })

  return entries
}

export function clipUrl(key: string): string {
  const rawBase =
    typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
      ? import.meta.env.BASE_URL
      : ''
  const base = rawBase.replace(/\/$/, '')
  return `${base}/audio/${key}.mp3`
}

export function hasClip(key: string): boolean {
  if (!Array.isArray(manifestData)) return false
  return manifestData.some((entry: { key: string }) => entry.key === key)
}

export function playClip(
  url: string,
  options?: {
    onStart?: () => void
    onEnd?: () => void
    onError?: () => void
  }
): { cancel(): void } {
  if (typeof Audio === 'undefined') {
    options?.onError?.()
    return { cancel: () => {} }
  }

  const audio = new Audio(url)
  audio.onplaying = () => {
    options?.onStart?.()
  }
  audio.onended = () => {
    options?.onEnd?.()
  }
  audio.onerror = () => {
    options?.onError?.()
  }

  const playPromise = audio.play()
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {
      options?.onError?.()
    })
  }

  return {
    cancel: () => {
      try {
        audio.pause()
        audio.currentTime = 0
        audio.onplaying = null
        audio.onended = null
        audio.onerror = null
        audio.src = ''
      } catch {
        // ignore
      }
    },
  }
}
