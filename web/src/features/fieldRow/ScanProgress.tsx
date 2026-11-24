import { ProgressBar } from '../../ui/ProgressBar'
import { progressText } from './fieldRowCopy'
import { Loader2, XCircle } from 'lucide-react'

export interface ScanProgressProps {
  stage: 'detecting' | 'classifying' | 'summarizing'
  done: number
  total: number
  lang?: 'bn' | 'en'
  onCancel?: () => void
}

export function ScanProgress({
  stage,
  done,
  total,
  lang = 'bn',
  onCancel,
}: ScanProgressProps) {
  const isBn = lang === 'bn'

  const message =
    stage === 'detecting'
      ? isBn
        ? 'ছবিতে পাতা খোঁজা হচ্ছে…'
        : 'Finding leaves in image…'
      : progressText(done, total, lang)

  const prob = total > 0 ? done / total : stage === 'detecting' ? 0.15 : 0

  return (
    <div
      data-testid="scan-progress"
      className="flex flex-col gap-4 rounded-3xl border border-emerald-600/20 bg-gradient-to-br from-emerald-50/90 to-white p-5 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-[#0B5D3B]" />
        <span className="text-base font-bold text-[#0E1F16]">{message}</span>
      </div>

      <ProgressBar
        prob={prob}
        lang={lang}
        showPercent={total > 0}
        className="w-full"
      />

      {onCancel && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-4 py-1.5 text-xs font-bold text-rose-800 transition hover:bg-rose-100 active:scale-95"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>{isBn ? 'বাতিল করুন' : 'Cancel'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
