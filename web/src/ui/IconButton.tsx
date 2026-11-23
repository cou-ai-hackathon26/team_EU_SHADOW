import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  icon: ReactNode
  label: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant = 'outline', size = 'md', className = '', disabled, ...props },
  ref
) {
  const sizeClasses = {
    sm: 'h-11 w-11 min-h-[44px] min-w-[44px]',
    md: 'h-12 w-12 min-h-[48px] min-w-[48px]',
    lg: 'h-14 w-14 min-h-[56px] min-w-[56px]',
  }[size]

  const variantClasses = {
    primary: 'bg-[#0B5D3B] text-white shadow-md hover:bg-[#094d31]',
    secondary: 'bg-[#E6F4ED] text-[#0B5D3B] hover:bg-[#d0ebd9]',
    outline: 'border border-[#E3E8DC] bg-white text-[#0E1F16] hover:bg-slate-50 shadow-2xs',
    ghost: 'bg-transparent text-[#0B5D3B] hover:bg-[#E6F4ED]/60',
  }[variant]

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-2xl transition-all focus:outline-none focus-visible:ring-3 focus-visible:ring-emerald-700/50 disabled:opacity-50 disabled:pointer-events-none ${sizeClasses} ${variantClasses} ${className}`}
      {...(props as HTMLMotionProps<'button'>)}
    >
      {icon}
    </motion.button>
  )
})
