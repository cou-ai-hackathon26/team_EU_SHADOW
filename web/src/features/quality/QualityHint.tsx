import { AlertTriangle, CheckCircle2 } from 'lucide-react'
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
    <div className="flex flex-col gap-3 rounded-2xl border border-[#E3E8DC] bg-white p-4 shadow-2xs">
      {hasWarnings ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-4 text-[15px] text-[#0E1F16] shadow-2xs"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#B45309]">
              <AlertTriangle className="h-4 w-4" strokeWidth={2.4} />
            </span>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-[#B45309]">{t('qualityWarningTitle')}</span>
              <ul className="list-inside list-disc space-y-1 text-[#0E1F16]">
                {warnings.map((msg, idx) => (
                  <li key={idx} className="leading-snug">{msg}</li>
                ))}
              </ul>
              <span className="mt-1 text-[14px] text-[#B45309] font-medium">
                {t('qualityCanProceed')}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-[15px] text-[#15803D] shadow-2xs">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-[#15803D] text-white">
            <CheckCircle2 className="h-4 w-4" strokeWidth={2.4} />
          </span>
          <span className="font-bold">{t('qualityGood')}</span>
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
