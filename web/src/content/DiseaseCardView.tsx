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
      className={`rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-6 shadow-sm transition-all ${className}`}
      aria-labelledby={`disease-heading-${card.id}`}
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/10 pb-3">
        <h3
          id={`disease-heading-${card.id}`}
          className="text-xl font-extrabold text-emerald-950 sm:text-2xl tracking-tight"
        >
          {card.name[lang]}
        </h3>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${
            severityStyles[card.severity]
          }`}
        >
          {labels.severity[card.severity]}
        </span>
      </div>

      {/* Summary */}
      <p className="mb-5 text-sm sm:text-base leading-relaxed text-slate-700">
        {card.summary[lang]}
      </p>

      {/* Symptoms */}
      <div className="mb-4">
        <h4 className="mb-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
          <span className="text-emerald-700">🔍</span> {labels.symptoms}
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
        <h4 className="mb-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
          <span className="text-amber-700">🌱</span> {labels.causes}
        </h4>
        <ul className="list-inside list-disc space-y-1.5 text-sm text-slate-700">
          {card.causes.map((cause, idx) => (
            <li key={idx} className="leading-snug">
              {cause[lang]}
            </li>
          ))}
        </ul>
      </div>

      {/* Prevention & Care */}
      <div className="mb-4 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-white p-4 border border-emerald-900/10 shadow-2xs">
        <h4 className="mb-2 text-sm font-bold text-emerald-950 flex items-center gap-1.5">
          <span>🛡️</span> {labels.prevention}
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
      <div className="mb-4 rounded-2xl bg-amber-50/80 p-4 border border-amber-300/80 shadow-2xs">
        <h4 className="mb-1 text-sm font-bold text-amber-950 flex items-center gap-1.5">
          <span>📞</span> {labels.expertAdvice}
        </h4>
        <p className="text-sm leading-relaxed text-amber-950 font-medium">
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
                className="text-emerald-700 underline hover:text-emerald-900 transition-colors font-medium"
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
