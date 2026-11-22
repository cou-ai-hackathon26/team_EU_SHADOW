import { useState, useEffect } from 'react'
import type { DiseaseCard } from '../../content/types'
import type { ConfidenceTier } from '../../ai/types'
import { buildSpokenText, speakText, stopSpeaking, useBanglaVoice } from './speak'

export interface ListenButtonProps {
  card: DiseaseCard
  tier: ConfidenceTier
  secondCard?: DiseaseCard
  className?: string
}

export function ListenButton({ card, tier, secondCard, className = '' }: ListenButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const { supported, voice, hasBanglaVoice } = useBanglaVoice()

  // Requirement 4: Screen বদলালে কথা থেমে যায়
  useEffect(() => {
    return () => {
      stopSpeaking()
    }
  }, [])

  const handleToggle = () => {
    if (!supported || !hasBanglaVoice) return

    if (isSpeaking) {
      stopSpeaking()
      setIsSpeaking(false)
    } else {
      const text = buildSpokenText(card, tier, secondCard)
      setIsSpeaking(true)
      speakText(text, {
        voice,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      })
    }
  }

  if (!supported) {
    return (
      <div className={`inline-flex flex-col items-start gap-1 ${className}`}>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex min-h-[44px] cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400 opacity-80"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
          <span>শুনুন</span>
        </button>
        <span className="text-[11px] text-slate-500">
          ভয়েস সাপোর্ট নেই (আপনার ব্রাউজারে ভয়েস সুবিধা নেই)
        </span>
      </div>
    )
  }

  if (!hasBanglaVoice) {
    return (
      <div className={`inline-flex flex-col items-start gap-1 ${className}`}>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex min-h-[44px] cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400 opacity-80"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
          <span>শুনুন</span>
        </button>
        <span className="text-[11px] text-slate-500">
          এই ডিভাইসে বাংলা ভয়েস নেই — লেখাটি পড়ে দেখুন
        </span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isSpeaking ? 'পড়া বন্ধ করুন' : 'ফলাফল বাংলায় পড়ে শুনুন'}
      aria-pressed={isSpeaking}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition active:scale-[0.98] ${
        isSpeaking
          ? 'border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
          : 'border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-400'
      } ${className}`}
    >
      {isSpeaking ? (
        <>
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500"></span>
          </span>
          <svg
            className="h-5 w-5 text-amber-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
          <span>থামুন</span>
        </>
      ) : (
        <>
          <svg
            className="h-5 w-5 text-emerald-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
          <span>শুনুন (বাংলায় পড়ুন)</span>
        </>
      )}
    </button>
  )
}
