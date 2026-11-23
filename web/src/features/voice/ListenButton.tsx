import { useState, useEffect } from 'react'
import { Volume2, VolumeX, Square } from 'lucide-react'
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
      <div className={`inline-flex flex-col items-start gap-1.5 ${className}`}>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex min-h-[52px] cursor-not-allowed items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-[15px] font-bold text-slate-400 opacity-80"
        >
          <VolumeX className="h-5 w-5" />
          <span>শুনুন</span>
        </button>
        <span className="text-[13px] font-medium text-slate-500">
          ভয়েস সাপোর্ট নেই (আপনার ব্রাউজারে ভয়েস সুবিধা নেই)
        </span>
      </div>
    )
  }

  if (!hasBanglaVoice) {
    return (
      <div className={`inline-flex flex-col items-start gap-1.5 ${className}`}>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex min-h-[52px] cursor-not-allowed items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-[15px] font-bold text-slate-400 opacity-80"
        >
          <VolumeX className="h-5 w-5" />
          <span>শুনুন</span>
        </button>
        <span className="text-[13px] font-medium text-slate-500">
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
      className={`inline-flex min-h-[56px] items-center justify-center gap-3 rounded-2xl px-6 py-3.5 text-[16px] font-bold shadow-sm transition-all active:scale-[0.98] select-none ${
        isSpeaking
          ? 'border-2 border-[#F59E0B] bg-[#FFFBEB] text-[#B45309] shadow-[0_6px_20px_rgba(245,158,11,0.25)] hover:bg-[#FEF3C7]'
          : 'border-2 border-[#0B5D3B]/30 bg-gradient-to-r from-[#E6F4ED] to-white text-[#0B5D3B] hover:border-[#0B5D3B] hover:bg-[#E6F4ED]'
      } ${className}`}
    >
      {isSpeaking ? (
        <>
          <div className="flex items-center gap-1 h-5" aria-hidden="true">
            <span className="w-1.5 bg-[#B45309] rounded-full animate-bounce h-3.5"></span>
            <span className="w-1.5 bg-[#B45309] rounded-full animate-bounce delay-100 h-5"></span>
            <span className="w-1.5 bg-[#B45309] rounded-full animate-bounce delay-200 h-3"></span>
          </div>
          <Square className="h-5 w-5 fill-current" />
          <span>থামুন</span>
        </>
      ) : (
        <>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0B5D3B] text-white shadow-xs">
            <Volume2 className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <span>শুনুন (বাংলা ভয়েস পরামর্শ)</span>
        </>
      )}
    </button>
  )
}
