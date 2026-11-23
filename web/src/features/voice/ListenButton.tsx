import { useState, useEffect, useRef } from 'react'
import { Volume2, VolumeX, Square } from 'lucide-react'
import type { DiseaseCard } from '../../content/types'
import type { ConfidenceTier } from '../../ai/types'
import { buildSpokenText, speakText, stopSpeaking, useBanglaVoice } from './speak'
import { clipKeyFor, clipUrl, hasClip, playClip } from './voiceClips'

export interface ListenButtonProps {
  card: DiseaseCard
  tier: ConfidenceTier
  secondCard?: DiseaseCard
  className?: string
}

export function ListenButton({ card, tier, secondCard, className = '' }: ListenButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [errorNote, setErrorNote] = useState<string | null>(null)
  const { supported, voice, hasBanglaVoice } = useBanglaVoice()
  const playClipRef = useRef<{ cancel(): void } | null>(null)

  // Stop both speech synthesis and audio clips on unmount
  useEffect(() => {
    return () => {
      stopSpeaking()
      playClipRef.current?.cancel()
      playClipRef.current = null
    }
  }, [])

  const hasAudioSupport = typeof Audio !== 'undefined'

  const stopAll = () => {
    stopSpeaking()
    playClipRef.current?.cancel()
    playClipRef.current = null
    setIsSpeaking(false)
  }

  const handleToggle = () => {
    if (isSpeaking) {
      stopAll()
      return
    }

    setErrorNote(null)

    // Determine playback mechanism according to required source order:
    // (1) hasClip(exact key) -> MP3 via playClip
    // (2) else if hasBanglaVoice -> existing speakText
    // (3) else if key is 'medium-pair' path -> MP3 'medium-pair'
    // (4) else disabled state
    const exactKey = secondCard ? undefined : clipKeyFor(card, tier)

    const startSpeechFallback = () => {
      if (hasBanglaVoice) {
        const text = buildSpokenText(card, tier, secondCard)
        setIsSpeaking(true)
        speakText(text, {
          voice,
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        })
      } else {
        stopAll()
        setErrorNote('অডিও চালানো যায়নি — লেখাটি পড়ে দেখুন')
      }
    }

    const startClip = (key: string) => {
      if (!hasAudioSupport) {
        startSpeechFallback()
        return
      }

      setIsSpeaking(true)
      const url = clipUrl(key)
      playClipRef.current = playClip(url, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => {
          playClipRef.current = null
          setIsSpeaking(false)
        },
        onError: () => {
          playClipRef.current = null
          startSpeechFallback()
        },
      })
    }

    if (exactKey && hasClip(exactKey)) {
      startClip(exactKey)
    } else if (hasBanglaVoice) {
      startSpeechFallback()
    } else if (secondCard && hasClip('medium-pair')) {
      startClip('medium-pair')
    } else {
      // Cannot play
      stopAll()
    }
  }

  // Disabled condition: ONLY when no MP3 can be used AND there is no Bangla voice
  if (!hasAudioSupport && !supported) {
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

  if (!hasAudioSupport && !hasBanglaVoice) {
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

  const buttonElement = (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isSpeaking ? 'পড়া বন্ধ করুন' : 'ফলাফল বাংলায় পড়ে শুনুন'}
      aria-pressed={isSpeaking}
      className={`inline-flex min-h-[56px] items-center justify-center gap-3 rounded-2xl px-6 py-3.5 text-[16px] font-bold shadow-sm transition-all active:scale-[0.98] select-none ${
        isSpeaking
          ? 'border-2 border-[#F59E0B] bg-[#FFFBEB] text-[#B45309] shadow-[0_6px_20px_rgba(245,158,11,0.25)] hover:bg-[#FEF3C7]'
          : 'border-2 border-[#0B5D3B]/30 bg-gradient-to-r from-[#E6F4ED] to-white text-[#0B5D3B] hover:border-[#0B5D3B] hover:bg-[#E6F4ED]'
      } ${errorNote ? '' : className}`}
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

  if (errorNote) {
    return (
      <div className={`inline-flex flex-col items-start gap-1 ${className}`}>
        {buttonElement}
        <span className="text-[11px] text-slate-500">{errorNote}</span>
      </div>
    )
  }

  return buttonElement
}
