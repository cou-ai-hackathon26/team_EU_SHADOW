export interface ConfidenceMeterProps {
  prob: number // 0..1
  label?: string
  className?: string
}

function toBanglaDigits(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return num.toString().replace(/\d/g, (d) => bnDigits[Number(d)])
}

export default function ConfidenceMeter({ prob, label, className = '' }: ConfidenceMeterProps) {
  const clamped = Math.max(0, Math.min(1, prob))
  const percentage = Math.round(clamped * 100)
  const bnPercent = toBanglaDigits(percentage)

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{label ?? 'মডেলের আত্মবিশ্বাস'}</span>
        <span className="font-bold text-leaf-800">{bnPercent}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'আত্মবিশ্বাস'}
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
