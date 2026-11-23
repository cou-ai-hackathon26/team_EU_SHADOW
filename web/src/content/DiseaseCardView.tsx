import { Search, Sprout, ShieldCheck, PhoneCall } from 'lucide-react'
import type { DiseaseCard } from './types'
import { SeverityChip } from '../ui/SeverityChip'

export interface DiseaseCardViewProps {
  card: DiseaseCard
  lang?: 'bn' | 'en'
  className?: string
}

export function DiseaseCardView({
  card,
  lang = 'bn',
  className = '',
}: DiseaseCardViewProps) {
  const isBn = lang === 'bn'

  const labels = {
    symptoms: isBn ? 'লক্ষণসমূহ' : 'Key Symptoms',
    causes: isBn ? 'রোগের কারণ' : 'Favorable Conditions / Causes',
    prevention: isBn ? 'প্রতিরোধ ও পরিচর্যা' : 'Prevention & Care',
    expertAdvice: isBn ? 'কখন বিশেষজ্ঞের পরামর্শ নেবেন' : 'When to Call an Expert',
    sources: isBn ? 'তথ্যসূত্র ও গাইডলাইন' : 'Official References',
  }

  return (
    <article
      className={`rounded-3xl border border-[#E3E8DC] bg-white p-5 sm:p-6 shadow-sm transition-all ${className}`}
      aria-labelledby={`disease-heading-${card.id}`}
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#E3E8DC] pb-3">
        <h3
          id={`disease-heading-${card.id}`}
          className="text-xl sm:text-2xl font-black text-[#0E1F16] tracking-tight"
        >
          {card.name[lang]}
        </h3>
        <SeverityChip level={card.severity} lang={lang} />
      </div>

      {/* Summary */}
      <p className="mb-5 text-[16px] sm:text-[17px] leading-relaxed text-[#4A5F52]">
        {card.summary[lang]}
      </p>

      {/* Symptoms */}
      <div className="mb-4">
        <h4 className="mb-2 text-[15px] font-bold text-[#0E1F16] flex items-center gap-2">
          <Search className="h-4 w-4 text-[#0B5D3B]" strokeWidth={2.4} />
          <span>{labels.symptoms}</span>
        </h4>
        <ul className="list-inside list-disc space-y-1.5 text-[15px] sm:text-[16px] text-[#0E1F16]">
          {card.symptoms.map((symptom, idx) => (
            <li key={idx} className="leading-snug">
              {symptom[lang]}
            </li>
          ))}
        </ul>
      </div>

      {/* Causes */}
      <div className="mb-4">
        <h4 className="mb-2 text-[15px] font-bold text-[#0E1F16] flex items-center gap-2">
          <Sprout className="h-4 w-4 text-[#B45309]" strokeWidth={2.4} />
          <span>{labels.causes}</span>
        </h4>
        <ul className="list-inside list-disc space-y-1.5 text-[15px] sm:text-[16px] text-[#0E1F16]">
          {card.causes.map((cause, idx) => (
            <li key={idx} className="leading-snug">
              {cause[lang]}
            </li>
          ))}
        </ul>
      </div>

      {/* Prevention & Care */}
      <div className="mb-4 rounded-2xl bg-gradient-to-br from-[#E6F4ED]/60 to-white p-4 border border-[#0B5D3B]/20 shadow-2xs">
        <h4 className="mb-2 text-[15px] font-bold text-[#0B5D3B] flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#0B5D3B]" strokeWidth={2.4} />
          <span>{labels.prevention}</span>
        </h4>
        <ul className="list-inside list-disc space-y-1.5 text-[15px] sm:text-[16px] text-[#0E1F16]">
          {card.prevention.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {item[lang]}
            </li>
          ))}
        </ul>
      </div>

      {/* When to Call Expert */}
      <div className="mb-4 rounded-2xl bg-[#FFFBEB] p-4 border border-[#FDE68A] shadow-2xs">
        <h4 className="mb-1 text-[15px] font-bold text-[#B45309] flex items-center gap-2">
          <PhoneCall className="h-4 w-4 text-[#B45309]" strokeWidth={2.4} />
          <span>{labels.expertAdvice}</span>
        </h4>
        <p className="text-[15px] leading-relaxed text-[#0E1F16] font-medium">
          {card.whenToCallExpert[lang]}
        </p>
      </div>

      {/* Sources */}
      {card.sources.length > 0 && (
        <div className="mt-4 border-t border-[#E3E8DC] pt-3 text-[14px] text-[#4A5F52]">
          <span className="font-bold text-[#0E1F16]">{labels.sources}: </span>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {card.sources.map((src, idx) => (
              <a
                key={idx}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0B5D3B] underline hover:text-[#073823] transition-colors font-medium"
              >
                [{src.publisher}] {src.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
