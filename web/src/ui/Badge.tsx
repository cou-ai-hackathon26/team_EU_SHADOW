import { type ReactNode } from 'react'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'paddy'

export interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  icon?: ReactNode
  className?: string
}

export function Badge({ children, variant = 'default', icon, className = '' }: BadgeProps) {
  const variantClasses = {
    default: 'bg-slate-100 text-[#0E1F16] border-slate-200',
    paddy: 'bg-[#E6F4ED] text-[#0B5D3B] border-[#0B5D3B]/20',
    success: 'bg-[#E8F5EA] text-[#15803D] border-[#BBF7D0]',
    warning: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
    danger: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
  }[variant]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[15px] font-bold ${variantClasses} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  )
}
