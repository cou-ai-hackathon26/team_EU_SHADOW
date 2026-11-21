import type { DiseaseCard } from './types'

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
    severity: {
      none: isBn ? 'স্বাভাবিক অবস্থা' : 'Normal / Healthy',
      watch: isBn ? 'নজরে রাখুন' : 'Keep Watch',
      act: isBn ? 'দ্রুত ব্যবস্থা নিন' : 'Action Recommended',
    },
  }

  const severityStyles = {
    none: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    watch: 'bg-amber-50 text-amber-800 border-amber-300',
    act: 'bg-rose-50 text-rose-800 border-rose-300',
  }

  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all sm:p-6 ${className}`}
      aria-labelledby={`disease-heading-${card.id}`}
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <h3
          id={`disease-heading-${card.id}`}
          className="text-xl font-bold text-slate-900 sm:text-2xl"
        >
          {card.name[lang]}
        </h3>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${
            severityStyles[card.severity]
          }`}
        >
          {labels.severity[card.severity]}
        </span>
      </div>

      {/* Summary */}
      <p className="mb-5 text-sm leading-relaxed text-slate-700 sm:text-base">
        {card.summary[lang]}
      </p>

      {/* Symptoms */}
      <div className="mb-4">
        <h4 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-900">
          {labels.symptoms}
        </h4>
        <ul className="list-inside list-disc space-y-1.5 text-sm text-slate-700">
          {card.symptoms.map((symptom, idx) => (
            <li key={idx} className="leading-snug">
              {symptom[lang]}
            </li>
          ))}
        </ul>
      </div>

      {/* Causes */}
      <div className="mb-4">
        <h4 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-900">
          {labels.causes}
        </h4>
        <ul className="list-inside list-disc space-y-1.5 text-sm text-slate-700">
          {card.causes.map((cause, idx) => (
            <li key={idx} className="leading-snug">
              {cause[lang]}
            </li>
          ))}
        </ul>
      </div>

      {/* Prevention */}
      <div className="mb-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
        <h4 className="mb-2 text-sm font-bold text-slate-900">
          {labels.prevention}
        </h4>
        <ul className="list-inside list-disc space-y-1.5 text-sm text-slate-700">
          {card.prevention.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {item[lang]}
            </li>
          ))}
        </ul>
      </div>

      {/* When to Call Expert */}
      <div className="mb-4 rounded-xl bg-emerald-50/70 p-4 border border-emerald-200/80">
        <h4 className="mb-1 text-sm font-bold text-emerald-900">
          {labels.expertAdvice}
        </h4>
        <p className="text-sm leading-relaxed text-emerald-950">
          {card.whenToCallExpert[lang]}
        </p>
      </div>

      {/* Sources */}
      {card.sources.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{labels.sources}: </span>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {card.sources.map((src, idx) => (
              <a
                key={idx}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 underline hover:text-emerald-900 transition-colors"
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
