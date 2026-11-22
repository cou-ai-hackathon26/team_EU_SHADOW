import type { Prediction } from '../../ai/types'
import {
  estimateSpread,
  SEVERITY_BAND_LABELS_BN,
} from './estimateSpread'

export interface SeverityBadgeProps {
  prediction?: Prediction | null
  className?: string
}

export function SeverityBadge({
  prediction,
  className = '',
}: SeverityBadgeProps) {
  if (!prediction) return null
  if (prediction.tier !== 'high') return null
  const top1 = prediction.top[0]
  if (!top1 || top1.classId === 'healthy') return null
  if (!prediction.heatmap || prediction.heatmap.length === 0) return null

  const size =
    prediction.heatmapSize || Math.round(Math.sqrt(prediction.heatmap.length))
  const estimate = estimateSpread(prediction.heatmap, size)
  if (!estimate) return null

  const bandLabel = SEVERITY_BAND_LABELS_BN[estimate.band]

  return (
    <div
      className={`flex flex-col items-center justify-center gap-1.5 text-center ${className}`}
      data-testid="severity-badge"
    >
      <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-900/15 bg-white px-3.5 py-1 text-xs font-bold text-slate-800 shadow-2xs">
        <span className="text-slate-500 font-medium">আক্রান্ত এলাকা:</span>
        <span className="text-emerald-900">{bandLabel}</span>
      </div>
      <p className="text-[11px] text-slate-500">
        আনুমানিক (হিটম্যাপ থেকে), মাপা ক্ষতের পরিমাণ নয়
      </p>
    </div>
  )
}
