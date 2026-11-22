import type { ModelReport } from '../../ai/types'
import { toBanglaPercent } from './format'

interface NotRiceSectionProps {
  notRice: NonNullable<ModelReport['notRice']>
}

export default function NotRiceSection({ notRice }: NotRiceSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <h2 className="font-bold text-slate-900">ধানপাতা নয় যাচাই</h2>
      <p className="mt-0.5 text-xs text-slate-600 mb-3">
        ধানপাতা নয় এমন পাতা বা বহিরাগত ছবি ফিল্টার করে ভুল রোগ নির্ণয় ঠেকানোর
        জন্য গেটিং মেকানিজমের কার্যকারিতা ও মেট্রিক্স।
      </p>

      {/* 4-stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
          <span className="text-[11px] text-slate-600">
            ধানপাতা নয় বাতিল
          </span>
          <p className="mt-1 text-lg sm:text-xl font-bold text-leaf-800">
            {toBanglaPercent(notRice.notRiceTestRejected)}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
          <span className="text-[11px] text-slate-600">
            ধানপাতা ভুল বাতিল
          </span>
          <p className="mt-1 text-lg sm:text-xl font-bold text-rose-800">
            {toBanglaPercent(notRice.riceTestFalseReject)}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
          <span className="text-[11px] text-slate-600">
            বেস ৬-ক্লাস এফ১
          </span>
          <p className="mt-1 text-lg sm:text-xl font-bold text-slate-800">
            {toBanglaPercent(notRice.macroF1SixClassBase)}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
          <span className="text-[11px] text-slate-600">
            গেট সহ ৬-ক্লাস এফ১
          </span>
          <p className="mt-1 text-lg sm:text-xl font-bold text-leaf-800">
            {toBanglaPercent(notRice.macroF1SixClassWithGate)}
          </p>
        </div>
      </div>

      {/* Honest Disclosure / Note if present */}
      {notRice.bd5GateOnly?.note && (
        <p className="mt-3 text-xs text-slate-600 bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5">
          {notRice.bd5GateOnly.note}
        </p>
      )}

      {/* Sources and Licences */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <h3 className="text-xs font-semibold text-slate-800">
          ব্যবহৃত উৎসসমূহ ও লাইসেন্স:
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
