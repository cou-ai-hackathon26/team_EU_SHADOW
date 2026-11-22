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
      className={`inline-flex min-h-[48px] items-center justify-center gap-3 rounded-2xl px-5 py-2.5 text-sm sm:text-base font-bold shadow-2xs transition-all active:scale-[0.98] ${
        isSpeaking
          ? 'border-2 border-amber-400 bg-amber-50 text-amber-950 shadow-amber-200/50 hover:bg-amber-100'
          : 'border-2 border-emerald-600/30 bg-gradient-to-r from-emerald-50 to-emerald-100/60 text-emerald-950 hover:border-emerald-600 hover:bg-emerald-100'
      } ${className}`}
    >
      {isSpeaking ? (
        <>
          <div className="flex items-center gap-1 h-4">
            <span className="w-1 bg-amber-600 rounded-full animate-bounce h-3"></span>
            <span className="w-1 bg-amber-600 rounded-full animate-bounce delay-75 h-4"></span>
            <span className="w-1 bg-amber-600 rounded-full animate-bounce delay-150 h-2.5"></span>
          </div>
          <svg
            className="h-5 w-5 text-amber-800"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
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
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-white shadow-2xs">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </span>
          <span>শুনুন (বাংলায় ভয়েস পরামর্শ)</span>
        </>
      )}
    </button>
  )
}
