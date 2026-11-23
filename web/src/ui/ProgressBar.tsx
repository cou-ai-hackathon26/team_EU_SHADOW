import { motion } from 'framer-motion'
import { toBanglaPercent } from '../features/about/format'

export interface ProgressBarProps {
  prob: number // 0 to 1
  label?: string
  lang?: 'bn' | 'en'
  className?: string
  showPercent?: boolean
}

export function ProgressBar({
  prob,
  label,
  lang = 'bn',
  className = '',
  showPercent = true,
}: ProgressBarProps) {
  const percentage = Math.round(Math.min(1, Math.max(0, prob)) * 100)
  const isBn = lang === 'bn'
  const formattedPercent = isBn ? toBanglaPercent(prob, 0) : `${percentage}%`

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-[15px] font-bold text-[#0E1F16]">
          {label && <span>{label}</span>}
          {showPercent && (
            <span className="font-extrabold text-[#0B5D3B]">
              {formattedPercent}
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative h-3.5 w-full overflow-hidden rounded-full bg-[#E3E8DC]/80"
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-[#0B5D3B] via-[#0E7446] to-[#22C55E]"
        />
      </div>
    </div>
  )
}
