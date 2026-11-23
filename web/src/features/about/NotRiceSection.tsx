import type { ModelReport } from '../../ai/types'
import { num, pct } from './format'
import { useT } from '../../i18n/useT'

interface NotRiceSectionProps {
  notRice: NonNullable<ModelReport['notRice']>
}

export default function NotRiceSection({ notRice }: NotRiceSectionProps) {
  const { lang } = useT()
  const isBn = lang === 'bn'
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <h2 className="font-bold text-slate-900">{isBn ? 'ধানপাতা নয় যাচাই' : 'Not-a-rice-leaf check'}</h2>
      <p className="mt-0.5 text-xs text-slate-600 mb-3">
        {isBn ? 'ধানপাতা নয় এমন পাতা বা বহিরাগত ছবি ফিল্টার করে ভুল রোগ নির্ণয় ঠেকানোর জন্য গেটিং মেকানিজমের কার্যকারিতা ও মেট্রিক্স।' : 'How well the gate filters out non-rice leaves and unrelated photos to prevent wrong diagnoses.'}
      </p>

      {/* 4-stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
          <span className="text-[11px] text-slate-600">
            {isBn ? 'ধানপাতা নয় বাতিল' : 'Non-rice rejected'}
          </span>
          <p className="mt-1 text-lg sm:text-xl font-bold text-leaf-800">
            {pct(notRice.notRiceTestRejected, lang)}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
          <span className="text-[11px] text-slate-600">
            {isBn ? 'ধানপাতা ভুল বাতিল' : 'Rice wrongly rejected'}
          </span>
          <p className="mt-1 text-lg sm:text-xl font-bold text-rose-800">
            {pct(notRice.riceTestFalseReject, lang)}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
          <span className="text-[11px] text-slate-600">
            {isBn ? 'বেস ৬-ক্লাস এফ১' : 'Base 6-class F1'}
          </span>
          <p className="mt-1 text-lg sm:text-xl font-bold text-slate-800">
            {pct(notRice.macroF1SixClassBase, lang)}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
          <span className="text-[11px] text-slate-600">
            {isBn ? 'গেট সহ ৬-ক্লাস এফ১' : '6-class F1 with gate'}
          </span>
          <p className="mt-1 text-lg sm:text-xl font-bold text-leaf-800">
            {pct(notRice.macroF1SixClassWithGate, lang)}
          </p>
        </div>
      </div>

      {/* Screen Recapture Block */}
      {notRice.screenRecapture && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <h3 className="text-xs font-semibold text-slate-800 mb-2">
            {isBn ? 'স্ক্রিন থেকে তোলা ছবিতে' : 'On photos taken of a screen'}
          </h3>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
              <span className="text-[11px] text-slate-600">
                {isBn ? 'ধানপাতা নয় বাতিল' : 'Non-rice rejected'}
              </span>
              <p className="mt-1 text-lg sm:text-xl font-bold text-leaf-800">
                {pct(notRice.screenRecapture.notRiceRejected, lang, 0)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
              <span className="text-[11px] text-slate-600">
                {isBn ? 'গেট সহ ৬-ক্লাস এফ১' : '6-class F1 with gate'}
              </span>
              <p className="mt-1 text-lg sm:text-xl font-bold text-leaf-800">
                {pct(notRice.screenRecapture.macroF1SixClassWithGate, lang, 0)}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            {isBn ? 'মোবাইল/কম্পিউটার স্ক্রিনের ছবি তুলে পরীক্ষা করলে নির্ভুলতা কমে যায় — আসল পাতার ছবি তুলুন।' : 'Accuracy drops on photos of a phone or computer screen — photograph the real leaf.'}
          </p>
        </div>
      )}

      {/* Honest Disclosure / BD5 Gate-only note if present */}
      {notRice.bd5GateOnly && (
        <div className="mt-3 bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5">
          <p className="text-xs text-slate-800">
            {isBn ? 'সাদা কাগজে রাখা ধানপাতা (BD5, টেস্ট ' : 'Rice leaves on white paper (BD5, '}{num(notRice.bd5GateOnly.split?.test ?? 401, lang)}{isBn ? 'টি):' : ' test images):'}{' '}
            <strong className="font-bold text-slate-900">
              {isBn ? 'ভুল বাতিল' : 'wrongly rejected'} {pct(notRice.bd5GateOnly.testFalseReject, lang, 0)}
            </strong>
          </p>
          {isBn && notRice.bd5GateOnly.note && (
            <p className="mt-1 text-[11px] text-slate-500">
              {notRice.bd5GateOnly.note}
            </p>
          )}
        </div>
      )}

      {/* Sources and Licences */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <h3 className="text-xs font-semibold text-slate-800">
          {isBn ? 'ব্যবহৃত উৎসসমূহ ও লাইসেন্স:' : 'Sources and licences used:'}
        </h3>
        <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
          {notRice.sources.map((src, idx) => (
            <li
              key={`notrice-src-${idx}`}
              className="flex flex-wrap items-center gap-2"
            >
              <a
                href={src.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-leaf-800 underline hover:text-leaf-900"
              >
                {src.name}
              </a>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600 font-mono">
                {src.licence}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
