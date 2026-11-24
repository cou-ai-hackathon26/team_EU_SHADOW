import { AlertOctagon, RotateCcw } from 'lucide-react'
import type { FieldSummary } from '../../ai/fieldRow.types'
import { ABSTENTION_REASONS } from '../../ai/fieldRow.types'
import { FIELD_ROW_COPY, STATUS_COPY, ABSTAIN_COPY } from './fieldRowCopy'
import { toBanglaDigits, toBanglaPercent } from '../about/format'
import { getCard } from '../../content/getCard'
import { HelpCall } from '../../components/HelpCall'
import { Disclaimer } from '../../components/Disclaimer'

export interface FieldSummaryCardProps {
  summary: FieldSummary
  lang?: 'bn' | 'en'
  onRetry?: () => void
}

export function FieldSummaryCard({
  summary,
  lang = 'bn',
  onRetry,
}: FieldSummaryCardProps) {
  const isBn = lang === 'bn'

  // If no leaf was screenable (fieldAbstain is set)
  if (summary.fieldAbstain) {
    const reason = summary.fieldAbstain
    const copy = ABSTAIN_COPY[reason]

    return (
      <div className="flex flex-col gap-5 w-full">
        <div className="rounded-3xl border border-amber-300 bg-amber-50/90 p-6 shadow-sm text-[#0E1F16]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-200 text-amber-900">
              <AlertOctagon className="h-6 w-6" strokeWidth={2.4} />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <h3 className="text-xl font-black text-amber-950">
                {copy.title[lang]}
              </h3>
              <p className="text-[15px] text-amber-900 leading-relaxed">
                {copy.desc[lang]}
              </p>
              {onRetry && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0B5D3B] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#0F5132] active:scale-95"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>{isBn ? 'আবার চেষ্টা করুন' : 'Try Again'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mandatory 16123 helpline and disclaimer in every state */}
        <HelpCall lang={lang} />
        <Disclaimer lang={lang} />
      </div>
    )
  }

  // Normal summary rendering
  const total = Math.max(1, summary.totalRegions)
  const healthyPct = (summary.healthy / total) * 100
  const diseasedPct = (summary.diseased / total) * 100
  const uncertainPct = (summary.uncertain / total) * 100
  const abstainedPct = (summary.abstained / total) * 100

  const highestRiskCard = summary.highestRisk
    ? getCard(summary.highestRisk.classId)
    : null

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="rounded-3xl border border-emerald-700/20 bg-gradient-to-br from-[#E6F4ED]/80 via-white to-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-emerald-700/10 pb-4">
          <h3 className="text-xl font-black text-[#0B5D3B]">
            {FIELD_ROW_COPY.summaryTitle[lang]}
          </h3>
          <span className="text-xs font-semibold text-[#4A5F52]">
            {isBn
              ? `মোট ${toBanglaDigits(summary.totalRegions)}টি পাতা (পরীক্ষিত ${toBanglaDigits(summary.screened)}টি)`
              : `Total ${summary.totalRegions} leaves (${summary.screened} screened)`}
          </span>
        </div>

        {/* Stacked bar visualization */}
        <div className="mt-4 flex flex-col gap-1.5">
          <div
            role="progressbar"
            aria-label={isBn ? 'পাতার স্বাস্থ্য অনুপাত' : 'Leaf health ratio'}
            className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100 shadow-inner"
          >
            {healthyPct > 0 && (
              <div
                style={{ width: `${healthyPct}%` }}
                title={`${STATUS_COPY.healthy[lang]}: ${summary.healthy}`}
                className="bg-[#16A34A] transition-all duration-300"
              />
            )}
            {diseasedPct > 0 && (
              <div
                style={{ width: `${diseasedPct}%` }}
                title={`${STATUS_COPY.diseased[lang]}: ${summary.diseased}`}
                className="bg-[#DC2626] transition-all duration-300"
              />
            )}
            {uncertainPct > 0 && (
              <div
                style={{ width: `${uncertainPct}%` }}
                title={`${STATUS_COPY.uncertain[lang]}: ${summary.uncertain}`}
                className="bg-[#D97706] transition-all duration-300"
              />
            )}
            {abstainedPct > 0 && (
              <div
                style={{ width: `${abstainedPct}%` }}
                title={`${STATUS_COPY.abstained[lang]}: ${summary.abstained}`}
                className="bg-[#6B7280] transition-all duration-300"
              />
            )}
          </div>
        </div>

        {/* 4 Status Counts Grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 text-center">
            <span className="text-xs font-bold text-emerald-800">
              {STATUS_COPY.healthy[lang]}
            </span>
            <span className="text-2xl font-black text-emerald-700">
              {isBn ? toBanglaDigits(summary.healthy) : summary.healthy}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/60 p-3 text-center">
            <span className="text-xs font-bold text-rose-800">
              {STATUS_COPY.diseased[lang]}
            </span>
            <span className="text-2xl font-black text-rose-700">
              {isBn ? toBanglaDigits(summary.diseased) : summary.diseased}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50/60 p-3 text-center">
            <span className="text-xs font-bold text-amber-800">
              {STATUS_COPY.uncertain[lang]}
            </span>
            <span className="text-2xl font-black text-amber-700">
              {isBn ? toBanglaDigits(summary.uncertain) : summary.uncertain}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-50/60 p-3 text-center">
            <span className="text-xs font-bold text-gray-700">
              {STATUS_COPY.abstained[lang]}
            </span>
            <span className="text-2xl font-black text-gray-700">
              {isBn ? toBanglaDigits(summary.abstained) : summary.abstained}
            </span>
          </div>
        </div>

        {/* Highest Risk Disease Callout */}
        {summary.highestRisk && highestRiskCard && (
          <div className="mt-5 rounded-2xl border border-rose-300/80 bg-rose-50/90 p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  {isBn ? 'সর্বাধিক ঝুঁকিপূর্ণ রোগ' : 'Highest-Risk Disease'}
                </span>
                <h4 className="text-lg font-black text-rose-950 mt-0.5">
                  {highestRiskCard.name[lang]} ({isBn ? `${toBanglaDigits(summary.highestRisk.count)}টি পাতা` : `${summary.highestRisk.count} leaves`})
                </h4>
              </div>
              <span className="inline-flex w-fit items-center rounded-full bg-rose-200/80 px-3 py-1 text-xs font-black text-rose-900">
                {isBn
                  ? `সর্বোচ্চ আস্থা ${toBanglaPercent(summary.highestRisk.maxConfidence, 0)}`
                  : `Max confidence ${Math.round(summary.highestRisk.maxConfidence * 100)}%`}
              </span>
            </div>
          </div>
        )}

        {/* Skipped by Reason breakdown */}
        {summary.abstained > 0 && (
          <div className="mt-4 flex flex-col gap-1.5 border-t border-emerald-700/10 pt-3">
            <span className="text-xs font-bold text-gray-700">
              {isBn ? 'বাদ দেওয়ার কারণসমূহ:' : 'Skipped reasons:'}
            </span>
            <ul className="flex flex-col gap-1 text-xs text-gray-600">
              {ABSTENTION_REASONS.map((reason) => {
                const count = summary.abstainedByReason[reason]
                if (!count) return null
                return (
                  <li key={reason} className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">
                      • {ABSTAIN_COPY[reason].title[lang]}
                    </span>
                    <span>
                      ({isBn ? toBanglaDigits(count) : count})
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {onRetry && (
          <div className="mt-5 pt-3 border-t border-emerald-700/10 flex justify-end">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-700/25 bg-white px-5 py-2 text-sm font-bold text-[#0B5D3B] shadow-xs transition hover:bg-emerald-50 active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{isBn ? 'নতুন স্ক্যান' : 'New Scan'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Mandatory HelpCall & Disclaimer */}
      <HelpCall lang={lang} />
      <Disclaimer lang={lang} />
    </div>
  )
}
