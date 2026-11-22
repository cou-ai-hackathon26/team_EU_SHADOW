export interface ConfidenceMeterProps {
  prob: number // 0..1
  label?: string
  className?: string
  lang?: 'bn' | 'en'
}

function toBanglaDigits(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return num.toString().replace(/\d/g, (d) => bnDigits[Number(d)])
}

export default function ConfidenceMeter({
  prob,
  label,
  className = '',
  lang = 'bn',
}: ConfidenceMeterProps) {
  const clamped = Math.max(0, Math.min(1, prob))
  const percentage = Math.round(clamped * 100)
  const percentText = lang === 'bn' ? `${toBanglaDigits(percentage)}%` : `${percentage}%`
  const defaultLabel = lang === 'bn' ? 'মডেলের আত্মবিশ্বাস' : 'Model Confidence'
  const displayLabel = label ?? defaultLabel

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{displayLabel}</span>
        <span className="font-bold text-leaf-800">{percentText}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={displayLabel}
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/60"
      >
        <div
          className="h-full rounded-full bg-leaf-800 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
