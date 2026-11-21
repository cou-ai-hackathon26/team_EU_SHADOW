export interface DisclaimerProps {
  lang?: 'bn' | 'en'
  className?: string
}

export function Disclaimer({ lang = 'bn', className = '' }: DisclaimerProps = {}) {
  const isBn = lang === 'bn'

  return (
    <aside
      role="note"
      aria-label={isBn ? 'সতর্কবার্তা ও দায়িত্বশীল এআই নির্দেশনা' : 'Safety disclaimer'}
      className={`flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-950 shadow-sm sm:p-4 sm:text-sm ${className}`}
    >
      <svg
        className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
      <div className="leading-relaxed">
        <strong className="font-semibold text-amber-900">
          {isBn ? 'প্রাথমিক স্ক্রিনিং:' : 'Preliminary screening:'}
        </strong>{' '}
        {isBn
          ? 'এটি প্রাথমিক স্ক্রিনিং, চূড়ান্ত রোগ নির্ণয় নয়। মাঠপর্যায়ে নিশ্চিত হতে নিকটস্থ কৃষি কর্মকর্তার পরামর্শ নিন অথবা কৃষি কল সেন্টার ১৬১২৩ নম্বরে যোগাযোগ করুন।'
          : 'This is a preliminary screening, not a definitive diagnosis. Consult your local agriculture officer or call Krishi Call Center 16123 to verify.'}
      </div>
    </aside>
  )
}
