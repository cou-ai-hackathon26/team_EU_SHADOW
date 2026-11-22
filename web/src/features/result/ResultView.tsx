import { useEffect, useMemo } from 'react'
import type { Prediction } from '../../ai/types'
import { getCard } from '../../content/getCard'
import { DiseaseCardView } from '../../content/DiseaseCardView'
import { Disclaimer } from '../../components/Disclaimer'
import { HelpCall } from '../../components/HelpCall'
import { HeatmapOverlay } from './HeatmapOverlay'
import { SeverityBadge } from '../severity/SeverityBadge'
import { UrgentCallout } from '../severity/UrgentCallout'
import { estimateSpread } from '../severity/estimateSpread'
import { ShareButton } from '../share/ShareButton'
import { ListenButton } from '../voice/ListenButton'
import ConfidenceMeter from './ConfidenceMeter'

export interface ResultViewProps {
  prediction?: Prediction | null
  error?: Error | string | null
  onReset?: () => void
  lang?: 'bn' | 'en'
  image?: HTMLImageElement | null
  imageFile?: File | Blob | null
}

export default function ResultView({
  prediction,
  error,
  onReset,
  lang = 'bn',
  image,
  imageFile,
}: ResultViewProps) {
  const isBn = lang === 'bn'

  const objectUrl = useMemo(() => {
    if (imageFile) {
      return URL.createObjectURL(imageFile)
    }
    return image?.src ?? null
  }, [imageFile, image])

  const severityEstimate = useMemo(() => {
    if (!prediction || prediction.tier !== 'high') return null
    if (!prediction.heatmap) return null
    if (prediction.top[0]?.classId === 'healthy') return null
    const size =
      prediction.heatmapSize || Math.round(Math.sqrt(prediction.heatmap.length))
    return estimateSpread(prediction.heatmap, size)
  }, [prediction])

  useEffect(() => {
    return () => {
      if (objectUrl && objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [objectUrl])

  // 1. Error state handling (Engine error without crashing the app)
  if (error) {
    const errorText = typeof error === 'string' ? error : error.message
    return (
      <section className="flex flex-col gap-4" aria-live="assertive">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-5 text-slate-800 shadow-sm">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-6 w-6 shrink-0 text-rose-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-bold text-rose-950">
                {isBn ? 'মডেল চালাতে সমস্যা হয়েছে' : 'Analysis Error'}
              </h2>
              <p className="text-xs text-rose-800">
                {isBn
                  ? 'ছবিটি প্রক্রিয়াকরণ করার সময় একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন বা অন্য ছবি দিন।'
                  : errorText}
              </p>
            </div>
          </div>

          {onReset && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onReset}
                className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-xs font-semibold text-rose-900 transition-colors hover:bg-rose-100"
              >
                {isBn ? 'পুনরায় চেষ্টা করুন' : 'Try Again'}
              </button>
            </div>
          )}
        </div>

        <Disclaimer lang={lang} />
        <HelpCall lang={lang} />
      </section>
    )
  }

  if (!prediction) {
    return null
  }

  const { tier, top, trainedFromScratch } = prediction
  const top1 = top[0]
  const top2 = top[1]

  const top1Card = top1 ? getCard(top1.classId) : getCard('not_sure')
  const top2Card = top2 ? getCard(top2.classId) : null

  return (
    <section className="flex flex-col gap-5" aria-labelledby="result-heading">
      {/* Temporary Prototype badge if not trained from scratch */}
      {!trainedFromScratch && (
        <div
          role="note"
          className="rounded-xl border border-indigo-200 bg-indigo-50/90 px-3.5 py-2 text-center text-xs font-semibold text-indigo-900 shadow-xs"
        >
          Temporary Prototype — Pretrained Model
        </div>
      )}

      {/* Tier 1: High Confidence */}
      {tier === 'high' && top1 && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs sm:p-5">
            <span className="inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
              {isBn ? 'নিশ্চিত ফলাফল' : 'High Confidence'}
            </span>
            <h2 id="result-heading" className="mt-2 text-2xl font-bold text-slate-900">
              {top1Card.name[lang]}
            </h2>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              {top1Card.summary[lang]}
            </p>

            <ConfidenceMeter
              prob={top1.prob}
              label={isBn ? 'শনাক্তকরণের আত্মবিশ্বাস' : 'Model Confidence'}
              lang={lang}
              className="mt-3.5"
            />

            <div className="mt-4 pt-3 border-t border-emerald-900/10">
              <ListenButton card={top1Card} tier={tier} className="w-full sm:w-auto" />
            </div>
          </div>

          {/* Disease Card (Mehedi F6) */}
          <DiseaseCardView card={top1Card} lang={lang} />
        </div>
      )}

      {/* Tier 2: Medium Confidence */}
      {tier === 'medium' && top1 && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-xs sm:p-5">
            <span className="inline-block rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-900">
              {isBn
                ? (top2 ? 'দুটো সম্ভাবনা (মাঝারি নিশ্চয়তা)' : 'মাঝারি নিশ্চয়তা')
                : (top2 ? 'Moderate Confidence (Two Possibilities)' : 'Moderate Confidence')}
            </span>
            <h2 id="result-heading" className="mt-2 text-lg font-bold text-slate-900">
              {isBn ? 'সম্ভাব্য রোগের লক্ষণ' : 'Possible Conditions'}
            </h2>

            {/* Clearer photo request banner */}
            <div className="mt-3 rounded-xl border border-amber-300 bg-white/90 p-3 text-xs text-amber-950">
              <p className="font-semibold">
                {isBn ? 'পরিষ্কার ছবির অনুরোধ:' : 'Clearer Photo Requested:'}
              </p>
              <p className="mt-0.5 text-slate-700">
                {isBn
                  ? 'মডেল পুরোপুরি নিশ্চিত হতে পারছে না। সঠিক ফল নিশ্চিত করতে ভালো আলোতে আরও স্পষ্ট ছবি তুলুন।'
                  : 'Please retake a clearer photo in good lighting to get a conclusive result.'}
              </p>
            </div>

            {/* Options */}
            <div className={`mt-4 grid grid-cols-1 gap-3 ${top2 && top2Card ? 'sm:grid-cols-2' : ''}`}>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                <span className="text-xs font-semibold text-slate-500">
                  {isBn ? (top2 ? 'সম্ভাবনা ১' : 'সম্ভাব্য রোগ') : (top2 ? 'Option 1' : 'Possible Condition')}
                </span>
                <p className="text-base font-bold text-slate-900">{top1Card.name[lang]}</p>
                <ConfidenceMeter prob={top1.prob} lang={lang} className="mt-2" />
              </div>

              {top2 && top2Card && (
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">
                    {isBn ? 'সম্ভাবনা ২' : 'Option 2'}
                  </span>
                  <p className="text-base font-bold text-slate-900">{top2Card.name[lang]}</p>
                  <ConfidenceMeter prob={top2.prob} lang={lang} className="mt-2" />
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-amber-900/10">
              <ListenButton card={top1Card} tier={tier} secondCard={top2Card ?? undefined} className="w-full sm:w-auto" />
            </div>
          </div>

          <DiseaseCardView card={top1Card} lang={lang} />
          {top2 && top2Card && <DiseaseCardView card={top2Card} lang={lang} />}
        </div>
      )}

      {/* Tier 3: Low Confidence */}
      {tier === 'low' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-slate-300 bg-white p-5 sm:p-6 shadow-sm">
            <span className="inline-block rounded-full bg-slate-100 px-3.5 py-1 text-xs font-bold text-slate-800">
              {isBn ? 'অনিশ্চিত অবস্থা' : 'Uncertain'}
            </span>
            <h2 id="result-heading" className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">
              {isBn ? 'আমি নিশ্চিত নই' : 'I am not sure'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {isBn
                ? 'ছবিটি দেখে মডেল নির্দিষ্ট কোনো রোগ নিশ্চিত করতে পারেনি। মাঠপর্যায়ে কোনো ঝুঁকি না নিয়ে কৃষি কর্মকর্তার পরামর্শ নিন।'
                : 'The model could not identify any disease with certainty. Please seek human expert advice.'}
            </p>
          </div>
        </div>
      )}

      {/* Tier 4: Not Rice */}
      {tier === 'not_rice' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-5 sm:p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-200 text-rose-800 font-bold">
                ✕
              </span>
              <div>
                <h2 id="result-heading" className="text-xl sm:text-2xl font-bold text-rose-950">
                  {isBn ? 'এটি ধানপাতা মনে হচ্ছে না' : 'Not Rice Leaf'}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-rose-900">
                  {isBn
                    ? 'আপলোডকৃত ছবিটি ধানগাছের পাতা হিসেবে শনাক্ত করা যায়নি। অনুগ্রহ করে শুধু ধানক্ষেতের আক্রান্ত পাতার স্পষ্ট ছবি দিন।'
                    : 'The uploaded image does not appear to be a rice leaf. Please upload a clear photo of a rice leaf.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Overlay (F11) - under the result card (not rendered for not_rice) */}
      {tier !== 'not_rice' && (
        <HeatmapOverlay
          prediction={prediction}
          imageSrc={objectUrl ?? image?.src}
        />
      )}

      {/* F18: Severity Badge & Urgent Callout directly under HeatmapOverlay */}
      <SeverityBadge prediction={prediction} />
      <UrgentCallout
        tier={tier}
        card={top1Card}
        severity={severityEstimate}
      />

      {/* Action Buttons: Share (F15) & Reset */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <ShareButton
          input={{
            prediction,
            image: image ?? undefined,
            severity: severityEstimate ?? undefined,
          }}
          className="w-full sm:w-auto"
        />

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border-2 border-emerald-900/15 bg-white px-6 py-3 text-sm font-bold text-slate-800 shadow-2xs transition-all hover:bg-emerald-50/60 hover:border-emerald-700/30 active:scale-98"
          >
            <svg
              className="h-4 w-4 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            <span>{isBn ? 'অন্য পাতা পরীক্ষা করুন' : 'Scan Another Leaf'}</span>
          </button>
        )}
      </div>

      {/* Safety Disclaimer (F7) included in all tiers */}
      <Disclaimer lang={lang} />
      <HelpCall lang={lang} />
    </section>
  )
}
