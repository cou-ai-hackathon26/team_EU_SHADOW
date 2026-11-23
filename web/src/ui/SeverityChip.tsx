import { AlertOctagon, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'

export type SeverityLevel = 'healthy' | 'mild' | 'moderate' | 'severe' | 'none' | 'watch' | 'act'

export interface SeverityChipProps {
  level: SeverityLevel
  label?: string
  lang?: 'bn' | 'en'
  className?: string
}

export function SeverityChip({
  level,
  label,
  lang = 'bn',
  className = '',
}: SeverityChipProps) {
  const isBn = lang === 'bn'

  // Normalize level
  const normalized: 'healthy' | 'mild' | 'moderate' | 'severe' =
    level === 'none' || level === 'healthy'
      ? 'healthy'
      : level === 'watch' || level === 'mild'
        ? 'mild'
        : level === 'moderate'
          ? 'moderate'
          : 'severe'

  const config = {
    healthy: {
      defaultLabel: isBn ? 'সুস্থ ধানগাছ' : 'Healthy Plant',
      icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-[#15803D]" strokeWidth={2.2} />,
      styles: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
    },
    mild: {
      defaultLabel: isBn ? 'প্রাথমিক লক্ষণ (নজরে রাখুন)' : 'Mild Symptoms',
      icon: <Info className="h-4 w-4 shrink-0 text-[#65A30D]" strokeWidth={2.2} />,
      styles: 'bg-[#F7FEE7] text-[#4D7C0F] border-[#D9F99D]',
    },
    moderate: {
      defaultLabel: isBn ? 'মাঝারি লক্ষণ' : 'Moderate Severity',
      icon: <AlertTriangle className="h-4 w-4 shrink-0 text-[#B45309]" strokeWidth={2.2} />,
      styles: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
    },
    severe: {
      defaultLabel: isBn ? 'মারাত্মক (দ্রুত ব্যবস্থা নিন)' : 'Severe Infection',
      icon: <AlertOctagon className="h-4 w-4 shrink-0 text-[#DC2626]" strokeWidth={2.2} />,
      styles: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
    },
  }[normalized]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[15px] font-bold shadow-2xs select-none ${config.styles} ${className}`}
    >
      {config.icon}
      <span>{label ?? config.defaultLabel}</span>
    </span>
  )
}
