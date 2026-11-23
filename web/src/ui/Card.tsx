import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, interactive = false, padding = 'md', className = '', ...props },
  ref
) {
  const paddingClasses = {
    none: '',
    sm: 'p-3.5 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  }[padding]

  const interactiveClasses = interactive
    ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-10px_rgba(14,31,22,0.12)]'
    : ''

  return (
    <div
      ref={ref}
      className={`rounded-3xl border border-[#E3E8DC] bg-white text-[#0E1F16] shadow-[0_8px_24px_-6px_rgba(14,31,22,0.06),0_1px_3px_rgba(0,0,0,0.03)] ${paddingClasses} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
})
