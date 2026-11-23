import { AlertTriangle } from 'lucide-react'

export interface DisclaimerProps {
  lang?: 'bn' | 'en'
  compact?: boolean
  className?: string
  /** On desktop (lg+), render as a translucent amber glass pill for dark backgrounds. */
  darkOnDesktop?: boolean
}

export function Disclaimer({ lang = 'bn', compact = false, className = '', darkOnDesktop = false }: DisclaimerProps = {}) {
  const isBn = lang === 'bn'
  const dark = darkOnDesktop
    ? {
        box: 'lg:rounded-full lg:border-amber-400/30 lg:bg-amber-500/15 lg:text-amber-100 lg:shadow-none lg:items-center',
        icon: 'lg:bg-amber-400/20 lg:text-amber-300 lg:mt-0',
        strong: 'lg:text-amber-300',
      }
    : { box: '', icon: '', strong: '' }

  return (
    <aside
      role="note"
      aria-label={isBn ? 'সতর্কবার্তা ও দায়িত্বশীল এআই নির্দেশনা' : 'Safety disclaimer'}
      className={`flex items-start gap-2.5 sm:gap-3 rounded-2xl border border-amber-300/80 bg-[#FFFBEB]/95 ${
        compact ? 'py-1.5 px-3 text-[11.5px] sm:text-xs' : 'p-3.5 sm:p-4 text-[14px] sm:text-[15px]'
      } text-[#0E1F16] shadow-md backdrop-blur-sm ${dark.box} ${className}`}
    >
      <div className={`flex ${compact ? 'h-5 w-5 rounded-lg mt-0.5' : 'h-7 w-7 rounded-xl mt-0.5'} shrink-0 items-center justify-center bg-[#FEF3C7] text-[#B45309] ${dark.icon}`}>
        <AlertTriangle className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} strokeWidth={2.4} />
      </div>
      <div className={compact ? 'leading-tight' : 'leading-relaxed'}>
        <strong className={`font-bold text-[#B45309] ${dark.strong}`}>
          {isBn ? 'প্রাথমিক স্ক্রিনিং:' : 'Preliminary screening:'}
        </strong>{' '}
        {isBn
          ? 'এটি প্রাথমিক স্ক্রিনিং, চূড়ান্ত রোগ নির্ণয় নয়। মাঠপর্যায়ে নিশ্চিত হতে নিকটস্থ কৃষি কর্মকর্তার পরামর্শ নিন অথবা কৃষি কল সেন্টার ১৬১২৩ নম্বরে যোগাযোগ করুন।'
          : 'This is a preliminary screening, not a definitive diagnosis. Consult your local agriculture officer or call Krishi Call Center 16123 to verify.'}
      </div>
    </aside>
  )
}
