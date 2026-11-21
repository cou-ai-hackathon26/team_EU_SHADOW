export interface HelpCallProps {
  lang?: 'bn' | 'en'
  className?: string
}

export function HelpCall({ lang = 'bn', className = '' }: HelpCallProps = {}) {
  const isBn = lang === 'bn'

  return (
    <div className={`rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 sm:p-4 shadow-sm ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-950 sm:text-base">
              {isBn ? 'কৃষি কল সেন্টার ১৬১২৩' : 'Krishi Call Center 16123'}
            </h4>
            <p className="text-xs text-emerald-800">
              {isBn
                ? 'সরাসরি সরকারি কৃষি কর্মকর্তার তাৎক্ষণিক পরামর্শের জন্য'
                : 'Direct consultation with government agricultural experts'}
            </p>
          </div>
        </div>

        <a
          href="tel:16123"
          aria-label={isBn ? 'কৃষি কল সেন্টার ১৬১২৩ নম্বরে কল করুন' : 'Call Krishi Call Center at 16123'}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.98] sm:self-auto"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span>{isBn ? 'এখনই কল করুন (১৬১২৩)' : 'Call Now (16123)'}</span>
        </a>
      </div>
    </div>
  )
}
