import { type ReactNode } from 'react'
import { Card } from './Card'

export interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <Card className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#E6F4ED] text-[#0B5D3B] shadow-inner">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[#0E1F16]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-[16px] leading-relaxed text-[#4A5F52]">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </Card>
  )
}
