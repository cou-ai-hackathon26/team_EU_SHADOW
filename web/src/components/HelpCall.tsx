import { PhoneCall } from 'lucide-react'

export interface HelpCallProps {
  lang?: 'bn' | 'en'
  className?: string
}

export function HelpCall({ lang = 'bn', className = '' }: HelpCallProps = {}) {
  const isBn = lang === 'bn'

  return (
    <div
      className={`rounded-3xl border border-[#0B5D3B]/20 bg-gradient-to-br from-[#E6F4ED] to-white p-5 shadow-xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B5D3B] text-white shadow-md">
            <PhoneCall className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <div>
            <h4 className="text-[17px] font-bold text-[#0E1F16]">
              {isBn ? 'কৃষি কল সেন্টার ১৬১২৩' : 'Krishi Call Center 16123'}
            </h4>
            <p className="text-[15px] text-[#4A5F52] leading-tight mt-0.5">
              {isBn
                ? 'সরাসরি সরকারি কৃষি কর্মকর্তার তাৎক্ষণিক পরামর্শের জন্য'
                : 'Direct consultation with government agricultural experts'}
            </p>
          </div>
        </div>

        <a
          href="tel:16123"
          aria-label={isBn ? 'কৃষি কল সেন্টার ১৬১২৩ নম্বরে কল করুন' : 'Call Krishi Call Center at 16123'}
          className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#0B5D3B] to-[#15803D] px-6 py-3 text-[16px] font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-95 sm:self-auto"
        >
          <PhoneCall className="h-5 w-5" strokeWidth={2.4} />
          <span>{isBn ? 'এখনই কল করুন (১৬১২৩)' : 'Call Now (16123)'}</span>
        </a>
      </div>
    </div>
  )
}
