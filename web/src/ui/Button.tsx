import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'lg',
    loading = false,
    icon,
    children,
    className = '',
    disabled,
    ...props
  },
  ref
) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2.5 rounded-2xl font-bold transition-all select-none focus:outline-none focus-visible:ring-3 focus-visible:ring-emerald-700/50 disabled:opacity-50 disabled:pointer-events-none'

  const sizeClasses = {
    sm: 'min-h-[44px] px-4 py-2 text-[15px]',
    md: 'min-h-[50px] px-5 py-2.5 text-[16px]',
    lg: 'min-h-[56px] px-6 py-3.5 text-[17px]',
  }[size]

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-[#0B5D3B] via-[#0E7446] to-[#15803D] text-white shadow-[0_10px_25px_-5px_rgba(11,93,59,0.35)] hover:shadow-[0_14px_30px_-5px_rgba(11,93,59,0.45)] hover:from-[#094d31] hover:to-[#126b33]',
    secondary:
      'bg-white text-[#0E1F16] border-2 border-[#0B5D3B]/20 shadow-xs hover:border-[#0B5D3B]/40 hover:bg-[#E6F4ED]/50',
    outline:
      'bg-white text-[#0E1F16] border border-[#E3E8DC] shadow-xs hover:bg-slate-50',
    ghost: 'bg-transparent text-[#0B5D3B] hover:bg-[#E6F4ED]/60',
    danger:
      'bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-500',
  }[variant]

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...(props as HTMLMotionProps<'button'>)}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </motion.button>
  )
})
