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
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between text-[15px] sm:text-[16px]">
        <span className="font-bold text-[#0E1F16]">{displayLabel}</span>
        <span className="font-black text-[#0B5D3B] text-[16px] sm:text-[18px]">{percentText}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={displayLabel}
        className="h-3.5 w-full overflow-hidden rounded-full bg-[#E3E8DC] border border-[#E3E8DC]"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#0B5D3B] via-[#0E7446] to-[#22C55E] transition-all duration-500 shadow-xs"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
