import { useEffect, useMemo } from 'react'
import { CheckCircle2, RotateCcw, AlertTriangle, AlertOctagon, HelpCircle, PhoneCall, Sparkles, CloudSun } from 'lucide-react'
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
import { SeverityChip } from '../../ui/SeverityChip'
import { ProgressBar } from '../../ui/ProgressBar'
import { RoadmapTimeline } from '../roadmap/RoadmapTimeline'

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

  // 1. Error state handling
  if (error) {
    const errorText = typeof error === 'string' ? error : error.message
    return (
      <section className="flex flex-col gap-5 w-full max-w-3xl mx-auto" aria-live="assertive">
        <div className="rounded-3xl border border-rose-200 bg-rose-50/95 p-6 text-[#0E1F16] shadow-sm">
          <div className="flex items-start gap-3.5">
            <AlertOctagon className="mt-0.5 h-6 w-6 shrink-0 text-rose-600" strokeWidth={2.4} />
            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl font-bold text-rose-950">
                {isBn ? 'মডেল চালাতে সমস্যা হয়েছে' : 'Analysis Error'}
              </h2>
              <p className="text-[16px] text-rose-900 leading-relaxed">
                {isBn
                  ? 'ছবিটি প্রক্রিয়াকরণ করার সময় একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন বা অন্য ছবি দিন।'
                  : errorText}
              </p>
            </div>
          </div>

          {onReset && (
            <div className="mt-5">
              <button
                type="button"
                onClick={onReset}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-[15px] font-bold text-white shadow-xs hover:bg-rose-700 active:scale-95"
              >
                <RotateCcw className="h-4 w-4" />
                <span>{isBn ? 'পুনরায় চেষ্টা করুন' : 'Try Again'}</span>
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
  const isHealthy = top1Card.id === 'healthy'

  return (
    <section className="flex flex-col gap-6 w-full max-w-3xl mx-auto" aria-labelledby="result-heading">
      {/* Prototype notice badge if applicable */}
      {!trainedFromScratch && (
        <div
          role="note"
          className="rounded-2xl border border-indigo-200 bg-indigo-50/90 px-4 py-2 text-center text-[15px] font-bold text-indigo-900 shadow-2xs"
        >
          Temporary Prototype — Pretrained Model
        </div>
      )}

      {/* Captured Photo on Top */}
      {objectUrl && (
        <div className="relative aspect-16/9 w-full overflow-hidden rounded-3xl border border-[#E3E8DC] bg-slate-900 shadow-sm">
          <img
            src={objectUrl}
            alt={isBn ? 'পরীক্ষিত পাতার ছবি' : 'Scanned leaf photo'}
            className="h-full w-full object-contain"
          />
          <div className="absolute top-3 left-3">
            <SeverityChip level={top1Card.severity} lang={lang} />
          </div>
        </div>
      )}

      {/* Tier 1: High Confidence Diagnosis */}
      {tier === 'high' && top1 && (
        <div className="flex flex-col gap-5">
          {isHealthy ? (
            /* Healthy celebratory card */
            <div className="rounded-3xl border-2 border-[#15803D]/30 bg-gradient-to-br from-[#E8F5EA] to-white p-6 shadow-md text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#15803D] text-white shadow-md">
                <CheckCircle2 className="h-9 w-9" strokeWidth={2.4} />
              </div>
              <h2 id="result-heading" className="text-2xl sm:text-3xl font-extrabold text-[#0B5D3B] tracking-tight">
                {isBn ? 'সুস্থ ধানগাছ! কোনো রোগের লক্ষণ নেই' : 'Healthy Leaf! No Disease Detected'}
              </h2>
              <p className="mt-2 text-[16px] text-[#4A5F52] leading-relaxed max-w-md mx-auto">
                {isBn
                  ? 'আপনার ধানের পাতা সম্পূর্ণ সুস্থ দেখা যাচ্ছে। নিয়মিত ক্ষেত পর্যবেক্ষণ ও সুষম সার প্রয়োগ অব্যাহত রাখুন।'
                  : 'Your rice leaf appears completely healthy. Maintain regular field inspection and balanced nutrition.'}
              </p>

              <div className="mt-5 max-w-sm mx-auto">
                <ProgressBar
                  prob={top1.prob}
                  label={isBn ? 'শনাক্তকরণের নিশ্চয়তা' : 'Model Confidence'}
                  lang={lang}
                />
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <ListenButton card={top1Card} tier={tier} />
              </div>
            </div>
          ) : (
            /* Disease Diagnosis Card */
            <div className="rounded-3xl border border-[#0B5D3B]/20 bg-gradient-to-br from-[#E6F4ED]/80 to-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0B5D3B] px-3.5 py-1 text-[14px] font-extrabold text-white shadow-2xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isBn ? 'নিশ্চিত ফলাফল' : 'High Confidence'}</span>
                </span>
                <SeverityChip level={top1Card.severity} lang={lang} />
              </div>

              <h2 id="result-heading" className="mt-2 text-2xl sm:text-3xl font-black text-[#0E1F16] tracking-tight">
                {top1Card.name[lang]}
              </h2>

              <p className="mt-2 text-[16px] text-[#4A5F52] leading-relaxed">
                {top1Card.summary[lang]}
              </p>

              <ProgressBar
                prob={top1.prob}
                label={isBn ? 'শনাক্তকরণের নিশ্চয়তা' : 'Model Confidence'}
                lang={lang}
                className="mt-4"
              />

              {/* Weather & Epidemiology Risk Notice */}
              <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 p-3.5 text-xs sm:text-sm text-amber-950">
                <CloudSun className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" strokeWidth={2.2} />
                <div>
                  <strong className="font-bold">{isBn ? 'আবহাওয়া ভিত্তিক সতর্কতা:' : 'Weather Advisory:'}</strong>{' '}
                  <span>
                    {isBn
                      ? 'আর্দ্র বা কুয়াশাচ্ছন্ন আবহাওয়ায় এই রোগটি পাশের ধানগাছে দ্রুত ছড়াতে পারে। ক্ষেতের পানি ও আগাছা ব্যবস্থাপনা নিশ্চিত করুন।'
                      : 'Humid or misty conditions can accelerate the spread of this condition to adjacent plants. Ensure proper water and weed management.'}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#0B5D3B]/10">
                <ListenButton card={top1Card} tier={tier} className="w-full sm:w-auto" />
              </div>
            </div>
          )}

          {/* Detailed Disease Care Card */}
          <DiseaseCardView card={top1Card} lang={lang} />
          <RoadmapTimeline
            prediction={prediction}
            card={top1Card}
            lang={lang}
            onReset={onReset}
          />
        </div>
      )}

      {/* Tier 2: Medium Confidence (2 Possibilities) */}
      {tier === 'medium' && top1 && (
        <div className="flex flex-col gap-5">
          <div className="rounded-3xl border border-[#FDE68A] bg-gradient-to-br from-[#FFFBEB] to-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] px-3.5 py-1 text-[14px] font-bold text-[#B45309]">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>
                  {isBn
                    ? (top2 ? 'দুটো সম্ভাবনা (মাঝারি নিশ্চয়তা)' : 'মাঝারি নিশ্চয়তা')
                    : (top2 ? 'Moderate Confidence (Two Possibilities)' : 'Moderate Confidence')}
                </span>
              </span>
            </div>

            <h2 id="result-heading" className="mt-2 text-xl sm:text-2xl font-bold text-[#0E1F16]">
              {isBn ? 'সম্ভাব্য রোগের লক্ষণ' : 'Possible Conditions'}
            </h2>

            {/* Clearer photo request banner */}
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#FDE68A] bg-white p-4 text-[15px] text-[#0E1F16] shadow-2xs">
              <AlertTriangle className="h-5 w-5 text-[#B45309] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#B45309]">
                  {isBn ? 'পরিষ্কার ছবির অনুরোধ:' : 'Clearer Photo Requested:'}
                </p>
                <p className="mt-0.5 text-[#4A5F52]">
                  {isBn
                    ? 'মডেল পুরোপুরি নিশ্চিত হতে পারছে না। সঠিক ফল নিশ্চিত করতে ভালো আলোতে আরও স্পষ্ট ছবি তুলুন।'
                    : 'Please retake a clearer photo in good lighting to get a conclusive result.'}
                </p>
              </div>
            </div>

            {/* Top 1 and Top 2 Possibility Cards */}
            <div className={`mt-5 grid grid-cols-1 gap-4 ${top2 && top2Card ? 'sm:grid-cols-2' : ''}`}>
              <div className="rounded-2xl border border-[#E3E8DC] bg-white p-4 shadow-2xs">
                <span className="text-[14px] font-bold text-[#4A5F52]">
                  {isBn ? (top2 ? 'সম্ভাবনা ১' : 'সম্ভাব্য রোগ') : (top2 ? 'Option 1' : 'Possible Condition')}
                </span>
                <p className="text-lg font-black text-[#0E1F16] mt-0.5">{top1Card.name[lang]}</p>
                <ProgressBar prob={top1.prob} lang={lang} className="mt-3" />
              </div>

              {top2 && top2Card && (
                <div className="rounded-2xl border border-[#E3E8DC] bg-white p-4 shadow-2xs">
                  <span className="text-[14px] font-bold text-[#4A5F52]">
                    {isBn ? 'সম্ভাবনা ২' : 'Option 2'}
                  </span>
                  <p className="text-lg font-black text-[#0E1F16] mt-0.5">{top2Card.name[lang]}</p>
                  <ProgressBar prob={top2.prob} lang={lang} className="mt-3" />
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#E3E8DC]">
              <ListenButton card={top1Card} tier={tier} secondCard={top2Card ?? undefined} className="w-full sm:w-auto" />
            </div>
          </div>

          <DiseaseCardView card={top1Card} lang={lang} />
          {top2 && top2Card && <DiseaseCardView card={top2Card} lang={lang} />}
          <RoadmapTimeline
            prediction={prediction}
            card={top1Card}
            lang={lang}
            onReset={onReset}
          />
        </div>
      )}

      {/* Tier 3: Low Confidence ("আমি নিশ্চিত নই") */}
      {tier === 'low' && (
        <div className="flex flex-col gap-5">
          <div className="rounded-3xl border border-[#E3E8DC] bg-white p-6 shadow-sm text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0F8F4] text-[#0B5D3B]">
              <HelpCircle className="h-8 w-8" strokeWidth={2.2} />
            </div>
            <h2 id="result-heading" className="text-2xl font-bold text-[#0E1F16]">
              {isBn ? 'আমি নিশ্চিত নই' : 'I am not sure'}
            </h2>
            <p className="mt-2 text-[16px] leading-relaxed text-[#4A5F52] max-w-md mx-auto">
              {isBn
                ? 'ছবিটি দেখে মডেল নির্দিষ্ট কোনো রোগ নিশ্চিত করতে পারেনি। মাঠপর্যায়ে কোনো ঝুঁকি না নিয়ে কৃষি কর্মকর্তার পরামর্শ নিন।'
                : 'The model could not identify any disease with certainty. Please seek human expert advice.'}
            </p>
          </div>
        </div>
      )}

      {/* Tier 4: Not Rice ("এটি ধানপাতা মনে হচ্ছে না") */}
      {tier === 'not_rice' && (
        <div className="flex flex-col gap-5">
          <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-200 text-rose-800 font-bold">
                ✕
              </span>
              <div>
                <h2 id="result-heading" className="text-2xl font-bold text-rose-950">
                  {isBn ? 'এটি ধানপাতা মনে হচ্ছে না' : 'Not Rice Leaf'}
                </h2>
                <p className="mt-2 text-[16px] leading-relaxed text-rose-900">
                  {isBn
                    ? 'আপলোডকৃত ছবিটি ধানগাছের পাতা হিসেবে শনাক্ত করা যায়নি। অনুগ্রহ করে শুধু ধানক্ষেতের আক্রান্ত পাতার স্পষ্ট ছবি দিন।'
                    : 'The uploaded image does not appear to be a rice leaf. Please upload a clear photo of a rice leaf.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Overlay (if not_rice, hidden) */}
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

      {/* Prominent Action Trio: কল করুন / আবার স্ক্যান / Share */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
        <a
          href="tel:16123"
          aria-label={isBn ? 'কৃষি কল সেন্টার ১৬১২৩ নম্বরে কল করুন' : 'Call Krishi Helpline 16123'}
          className="flex min-h-[56px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl border-2 border-[#F59E0B]/50 bg-[#FEF3C7] px-6 py-3.5 text-[16px] font-black text-[#B45309] shadow-sm transition-all hover:bg-[#FDE68A] active:scale-95"
        >
          <PhoneCall className="h-5 w-5" strokeWidth={2.4} />
          <span>{isBn ? 'কল করুন (১৬১২৩)' : 'Call 16123'}</span>
        </a>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="flex min-h-[56px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#0B5D3B] to-[#15803D] px-6 py-3.5 text-[16px] font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-95"
          >
            <RotateCcw className="h-5 w-5" strokeWidth={2.4} />
            <span>{isBn ? 'অন্য পাতা পরীক্ষা করুন' : 'Scan Another Leaf'}</span>
          </button>
        )}

        <ShareButton
          input={{
            prediction,
            image: image ?? undefined,
            severity: severityEstimate ?? undefined,
          }}
          className="w-full sm:w-auto"
        />
      </div>

      {/* Safety Disclaimer included in all result tiers */}
      <Disclaimer lang={lang} />
    </section>
  )
}
