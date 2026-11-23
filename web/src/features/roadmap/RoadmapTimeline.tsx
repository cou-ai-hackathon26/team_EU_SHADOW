import { useMemo } from 'react'
import { Calendar, RotateCcw, PhoneCall, History } from 'lucide-react'
import type { Prediction } from '../../ai/types'
import type { DiseaseCard } from '../../content/types'
import { buildRoadmap, type RoadmapStep } from './buildRoadmap'
import { bn } from '../../i18n/bn'
import { en } from '../../i18n/en'

export interface RoadmapTimelineProps {
  prediction?: Prediction | null
  card?: DiseaseCard | null
  steps?: RoadmapStep[] | null
  lang?: 'bn' | 'en'
  onReset?: () => void
  className?: string
}

const BANGLA_NUMERALS = ['১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']

export function RoadmapTimeline({
  prediction,
  card,
  steps: propSteps,
  lang = 'bn',
  onReset,
  className = '',
}: RoadmapTimelineProps) {
  const isBn = lang === 'bn'
  const strings = isBn ? bn : en

  const steps = useMemo(() => {
    if (propSteps) return propSteps
    return buildRoadmap(prediction, card)
  }, [propSteps, prediction, card])

  if (!steps || steps.length === 0) {
    return null
  }

  return (
    <div
      id="action-roadmap"
      className={`scroll-mt-20 rounded-3xl border border-[#0B5D3B]/20 bg-gradient-to-br from-[#F0F8F4] to-white p-5 sm:p-6 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-4 border-b border-[#0B5D3B]/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0B5D3B] text-white shadow-xs">
          <Calendar className="h-5 w-5" strokeWidth={2.4} />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-black text-[#0E1F16] tracking-tight">
            {strings.roadmapHeading}
          </h3>
          <p className="text-xs sm:text-sm font-medium text-[#4A5F52]">
            {isBn
              ? 'সুস্থ ফলনের জন্য ধাপে ধাপে করণীয় রোডম্যাপ'
              : 'Step-by-step action plan for healthy harvest'}
          </p>
        </div>
      </div>

      {/* Ordered List for screen readers */}
      <ol className="mt-5 space-y-5 relative before:absolute before:top-3 before:bottom-3 before:left-[17px] before:w-0.5 before:bg-[#0B5D3B]/20">
        {steps.map((step, idx) => {
          const stepNum = isBn ? BANGLA_NUMERALS[idx] ?? (idx + 1).toString() : (idx + 1).toString()
          const titleText = step.title[lang] || step.title.bn
          const introText = step.intro ? (step.intro[lang] || step.intro.bn) : null

          return (
            <li key={step.id || idx} className="relative flex items-start gap-3.5 group">
              {/* Step Dot */}
              <div
                className="relative z-10 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#0B5D3B] text-white font-extrabold text-sm shadow-xs border-2 border-white ring-2 ring-[#0B5D3B]/20"
                aria-hidden="true"
              >
                {stepNum}
              </div>

              {/* Step Content */}
              <div className="flex-1 rounded-2xl border border-[#E3E8DC] bg-white p-4 shadow-2xs">
                <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-[#0B5D3B]">
                  {titleText}
                </span>

                {introText && (
                  <p className="mt-1 text-sm sm:text-[15px] font-semibold text-[#0E1F16] leading-snug">
                    {introText}
                  </p>
                )}

                {/* Bullet items if any */}
                {step.items && step.items.length > 0 && (
                  <ul className="mt-2.5 space-y-1.5 pl-1">
                    {step.items.map((item, itemIdx) => (
                      <li
                        key={itemIdx}
                        className="text-xs sm:text-[13.5px] text-[#4A5F52] flex items-start gap-2 leading-relaxed"
                      >
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#15803D] shrink-0" />
                        <span>{item[lang] || item.bn}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Action buttons inside step */}
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  {/* Re-scan button */}
                  {step.hasReScanButton && (
                    <button
                      type="button"
                      onClick={onReset}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B5D3B] px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#073823] active:scale-95 transition-all"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>{strings.roadmapRescanBtn}</span>
                    </button>
                  )}

                  {/* History comparison link */}
                  {step.hasHistoryLink && (
                    <a
                      href="#/history"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs sm:text-sm font-bold text-[#0B5D3B] hover:bg-emerald-100 transition-colors"
                    >
                      <History className="h-3.5 w-3.5" />
                      <span>{strings.roadmapHistoryNote}</span>
                    </a>
                  )}

                  {/* Call 16123 button */}
                  {step.hasCallButton && (
                    <a
                      href="tel:16123"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs sm:text-sm font-black text-amber-950 hover:bg-amber-100 transition-colors shadow-2xs"
                    >
                      <PhoneCall className="h-3.5 w-3.5 text-amber-700" />
                      <span>{strings.roadmapCall16123}</span>
                    </a>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {/* Muted line under the timeline */}
      <div className="mt-5 pt-3.5 border-t border-[#0B5D3B]/10 text-center">
        <p className="text-xs sm:text-[13px] font-medium text-[#4A5F52]">
          {strings.roadmapMutedAdvice}
        </p>
      </div>
    </div>
  )
}
