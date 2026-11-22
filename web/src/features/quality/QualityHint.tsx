import type { QualityReport } from '../../ai/types'
import { useT } from '../../i18n/useT'
import AnalyzeButton from '../result/AnalyzeButton'

export interface QualityHintProps {
  report: QualityReport | null
  onAnalyze?: () => void
  isAnalyzing?: boolean
}

export default function QualityHint({ report, onAnalyze, isAnalyzing = false }: QualityHintProps) {
  const { t } = useT()

  if (!report) {
    return null
  }

  const warnings: string[] = []

  if (report.tooDark) {
    warnings.push(t('qualityTooDark'))
  } else if (report.tooBright) {
    warnings.push(t('qualityTooBright'))
  }

  if (report.tooBlurry) {
    warnings.push(t('qualityTooBlurry'))
  }

  const hasWarnings = warnings.length > 0

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-leaf-800/10 bg-white p-4 shadow-xs">
      {hasWarnings ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-900"
        >
          <div className="flex items-start gap-2.5">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-amber-950">{t('qualityWarningTitle')}</span>
              <ul className="list-inside list-disc space-y-0.5 text-amber-900">
                {warnings.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
              <span className="mt-1 text-[11px] text-amber-800/90">
                {t('qualityCanProceed')}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-leaf-600/20 bg-leaf-50/80 px-3 py-2 text-xs text-leaf-800">
          <svg
            className="h-4 w-4 text-leaf-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span className="font-medium">{t('qualityGood')}</span>
        </div>
      )}

      {/* Render the Analyze button only when the onAnalyze prop is given */}
      {onAnalyze && (
        <AnalyzeButton
          onAnalyze={onAnalyze}
          loading={isAnalyzing}
        />
      )}
    </div>
  )
}
