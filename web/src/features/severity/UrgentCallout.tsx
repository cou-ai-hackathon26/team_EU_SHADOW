import type { ConfidenceTier } from '../../ai/types'
import { useT } from '../../i18n/useT'
import type { DiseaseCard } from '../../content/types'
import type { SeverityEstimate } from './estimateSpread'

export interface UrgentCalloutProps {
  tier?: ConfidenceTier
  card?: DiseaseCard | null
  severity?: SeverityEstimate | null
  className?: string
}

export function UrgentCallout({
  tier,
  card,
  severity,
  className = '',
}: UrgentCalloutProps) {
  const { lang } = useT()
  const isBn = lang === 'bn'
  if (tier !== 'high') return null
  if (!card) return null

  const isLargeBand = severity?.band === 'large'
  const isActSeverity = card.severity === 'act'

  if (!isLargeBand && !isActSeverity) {
    return null
  }

  return (
    <aside
      aria-label={isBn ? 'জরুরি সতর্কতা' : 'Urgent alert'}
      className={`rounded-2xl border-2 border-rose-300 bg-rose-50/90 p-4 text-slate-900 shadow-xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white text-xs font-bold">
            !
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-rose-950">
              {isBn ? 'আজই ১৬১২৩ নম্বরে কল করুন' : 'Call 16123 today'}
            </h3>
            <p className="mt-0.5 text-xs text-rose-900">
              {isBn
                ? 'ফসলের ক্ষতি কমাতে দ্রুত নিকটস্থ উপসহকারী কৃষি কর্মকর্তা অথবা কৃষি কল সেন্টারে যোগাযোগ করুন।'
                : 'To limit crop loss, contact your nearest agriculture officer or the Krishi Call Centre soon.'}
            </p>
          </div>
        </div>
        <a
          href="tel:16123"
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-rose-700 active:scale-98"
        >
          <svg
            className="h-4 w-4 shrink-0 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span>{isBn ? '১৬১২৩ কল করুন' : 'Call 16123'}</span>
        </a>
      </div>
    </aside>
  )
}
