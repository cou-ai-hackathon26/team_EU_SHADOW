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
    <div className="flex flex-col gap-3 rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-2xs">
      {hasWarnings ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-amber-300 bg-amber-50/95 p-4 text-xs sm:text-sm text-amber-950 shadow-2xs"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-900 font-bold text-xs">
              ⚠️
            </span>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-amber-950">{t('qualityWarningTitle')}</span>
              <ul className="list-inside list-disc space-y-1 text-amber-900">
                {warnings.map((msg, idx) => (
                  <li key={idx} className="leading-snug">{msg}</li>
                ))}
              </ul>
              <span className="mt-1 text-xs text-amber-800 font-medium">
                {t('qualityCanProceed')}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50/90 px-4 py-3 text-xs sm:text-sm text-emerald-950 shadow-2xs">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
            ✓
          </span>
          <span className="font-semibold">{t('qualityGood')}</span>
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
