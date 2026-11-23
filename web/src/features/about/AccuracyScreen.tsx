import { useEffect, useState } from 'react'
import ConfusionMatrix from './ConfusionMatrix'
import { classLabel, num, pct, tierLabel } from './format'
import { useT } from '../../i18n/useT'
import HowItWorks from './HowItWorks'
import { loadReport, type ReportLoadResult } from './loadReport'
import NotRiceSection from './NotRiceSection'

export default function AccuracyScreen() {
  const { lang } = useT()
  const isBn = lang === 'bn'
  const title = isBn ? 'কীভাবে কাজ করে — মডেল সঠিকতা' : 'How it works — model accuracy'
  const [loadState, setLoadState] = useState<ReportLoadResult | null>(null)

  useEffect(() => {
    let isMounted = true
    loadReport().then((result) => {
      if (isMounted) {
        setLoadState(result)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  if (!loadState) {
    return (
      <section className="flex flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h1 className="text-2xl font-bold text-leaf-800">
            {title}
          </h1>
          <div className="mt-4 flex items-center gap-3 text-slate-600">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-leaf-600 border-t-transparent" />
            <p className="font-medium">{isBn ? 'লোড হচ্ছে…' : 'Loading…'}</p>
          </div>
        </header>
      </section>
    )
  }

  if (loadState.status === 'missing') {
    return (
      <section className="flex flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h1 className="text-2xl font-bold text-leaf-800">
            {title}
          </h1>
          <div className="mt-3 rounded-xl border border-leaf-200 bg-leaf-50 p-4 text-sm text-slate-800">
            <p className="font-semibold text-leaf-800">
              {isBn ? 'মডেলের ফলাফল শীঘ্রই আসছে' : 'Model results coming soon'}
            </p>
            <p className="mt-1 text-slate-600 text-xs">
              {isBn ? 'আমাদের স্ক্র্যাচ-ট্রেইন্ড মডেলের মূল্যায়ন ডেটা ও মেট্রিক্স প্রস্তুত হচ্ছে। পাইপলাইনের টেস্ট সম্পন্ন হলে বিস্তারিত ফলাফল এখানে দেখা যাবে।' : 'The evaluation data and metrics for our from-scratch model are being prepared. Detailed results will appear here once testing is done.'}
            </p>
          </div>
        </header>

        <HowItWorks />
      </section>
    )
  }

  const { report, meta } = loadState

  return (
    <section className="flex flex-col gap-6">
      {/* Top Banner & Title */}
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-leaf-800">
            {title}
          </h1>
          {meta.trainedFromScratch ? (
            <span className="inline-flex items-center rounded-full bg-leaf-100 px-3 py-1 text-xs font-semibold text-leaf-800 border border-leaf-200">
              {isBn ? 'শূন্য থেকে প্রশিক্ষিত মডেল' : 'Trained from scratch'}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-warn-500">
              Temporary Prototype — Pretrained Model
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-600">
          {isBn ? 'আর্কিটেকচার:' : 'Architecture:'} {meta.architecture} · {isBn ? 'ভার্সন:' : 'Version:'} {meta.version} ·{' '}
          {isBn ? 'ইনপুট:' : 'Input:'} {num(meta.inputSize, lang)}×{num(meta.inputSize, lang)}
        </p>

        {/* High-level stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 text-center">
          <div className="rounded-xl bg-leaf-50 p-3 border border-leaf-100">
            <span className="text-xs text-slate-600">{isBn ? 'সার্বিক নির্ভুলতা' : 'Overall accuracy'}</span>
            <p className="text-xl sm:text-2xl font-bold text-leaf-800">
              {pct(report.test.accuracy, lang)}
            </p>
          </div>
          <div className="rounded-xl bg-leaf-50 p-3 border border-leaf-100">
            <span className="text-xs text-slate-600">{isBn ? 'ম্যাক্রো এফ১' : 'Macro F1'}</span>
            <p className="text-xl sm:text-2xl font-bold text-leaf-800">
              {pct(report.test.macroF1, lang)}
            </p>
          </div>
          <div className="rounded-xl bg-leaf-50 p-3 border border-leaf-100">
            <span className="text-xs text-slate-600">{isBn ? 'টেস্ট নমুনা (n)' : 'Test samples (n)'}</span>
            <p className="text-xl sm:text-2xl font-bold text-slate-800">
              {num(report.test.n, lang)}
            </p>
          </div>
        </div>
      </header>

      {/* Confusion Matrix */}
      <ConfusionMatrix
        matrix={report.test.confusionMatrix}
        classes={report.test.classes}
      />

      {/* Per-class Metrics Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="font-bold text-slate-900">
          {isBn ? 'শ্রেণীভিত্তিক ফলাফল (Per-class Metrics)' : 'Per-class metrics'}
        </h2>
        <p className="mt-0.5 text-xs text-slate-600 mb-3">
          {isBn ? 'প্রতিটি স্বতন্ত্র ধানপাতার রোগের শনাক্তকরণ সক্ষমতা ও সাপোর্ট।' : 'How well each rice leaf disease is identified, with its sample count.'}
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[480px] border-collapse text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th scope="col" className="p-2.5 font-semibold text-slate-800">
                  {isBn ? 'রোগ / শ্রেণী' : 'Disease / class'}
                </th>
                <th scope="col" className="p-2.5 font-semibold text-slate-800 text-right">
                  {isBn ? 'প্রিসিশন' : 'Precision'}
                </th>
                <th scope="col" className="p-2.5 font-semibold text-slate-800 text-right">
                  {isBn ? 'রিকল' : 'Recall'}
                </th>
                <th scope="col" className="p-2.5 font-semibold text-slate-800 text-right">
                  {isBn ? 'এফ১' : 'F1'}
                </th>
                <th scope="col" className="p-2.5 font-semibold text-slate-800 text-right">
                  {isBn ? 'নমুনার সংখ্যা' : 'Samples'}
                </th>
              </tr>
            </thead>
            <tbody>
              {report.test.perClass.map((row) => (
                <tr
                  key={row.classId}
                  className="border-b border-slate-100 hover:bg-slate-50/70"
                >
                  <td className="p-2.5 font-medium text-slate-800">
                    {classLabel(row.classId, lang)}
                  </td>
                  <td className="p-2.5 text-right text-slate-700">
                    {pct(row.precision, lang)}
                  </td>
                  <td className="p-2.5 text-right text-slate-700">
                    {pct(row.recall, lang)}
                  </td>
                  <td className="p-2.5 text-right font-semibold text-leaf-800">
                    {pct(row.f1, lang)}
                  </td>
                  <td className="p-2.5 text-right text-slate-600">
                    {num(row.support, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Not-Rice Verification Section (if present in report) */}
      {report.notRice && <NotRiceSection notRice={report.notRice} />}

      {/* Tier Breakdown Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="font-bold text-slate-900">
          {isBn ? 'কনফিডেন্স স্তরভিত্তিক পারফরম্যান্স' : 'Performance by confidence tier'}
        </h2>
        <p className="mt-0.5 text-xs text-slate-600 mb-3">
          {isBn ? 'মডেলের আত্মবিশ্বাস অনুযায়ী ৪টি স্তরে কভারেজ ও সঠিকতার অনুপাত।' : 'Coverage and accuracy in the 4 tiers, by model confidence.'}
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[360px] border-collapse text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th scope="col" className="p-2.5 font-semibold text-slate-800">
                  {isBn ? 'ফলাফল স্তর' : 'Result tier'}
                </th>
                <th scope="col" className="p-2.5 font-semibold text-slate-800 text-right">
                  {isBn ? 'কভারেজ (Coverage)' : 'Coverage'}
                </th>
                <th scope="col" className="p-2.5 font-semibold text-slate-800 text-right">
                  {isBn ? 'নির্ভুলতা (Accuracy)' : 'Accuracy'}
                </th>
              </tr>
            </thead>
            <tbody>
              {report.tiers.map((tier) => (
                <tr
                  key={tier.tier}
                  className="border-b border-slate-100 hover:bg-slate-50/70"
                >
                  <td className="p-2.5 font-semibold text-slate-800">
                    {tierLabel(tier.tier, lang)}
                  </td>
                  <td className="p-2.5 text-right text-slate-700">
                    {pct(tier.coverage, lang)}
                  </td>
                  <td className="p-2.5 text-right font-semibold text-leaf-800">
                    {pct(tier.accuracy, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Limitations List */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="font-bold text-slate-900">{isBn ? 'মডেলের সীমাবদ্ধতা' : 'Model limitations'}</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs text-slate-700">
          {report.limitations.map((lim, idx) => (
            <li key={`lim-${idx}`}>{isBn ? lim.bn : lim.en}</li>
          ))}
        </ul>
      </section>

      {/* Dataset Credit */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="font-bold text-slate-900">{isBn ? 'ডেটাসেট তথ্য ও স্বত্ব' : 'Dataset and credits'}</h2>
        <div className="mt-2 text-xs space-y-1 text-slate-700">
          <p>
            {isBn ? 'নাম:' : 'Name:'}{' '}
            <a
              href={report.dataset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-leaf-800 font-semibold underline"
            >
              {report.dataset.name}
            </a>
          </p>
          <p>
            {isBn ? 'লাইসেন্স:' : 'Licence:'} <span className="font-medium">{report.dataset.license}</span>
          </p>
          <p className="text-slate-600">
            {isBn ? 'নমুনা বন্টন: ট্রেন' : 'Split: train'} ({num(report.dataset.images.train, lang)}),{' '}
            {isBn ? 'ভ্যালিডেশন' : 'validation'} ({num(report.dataset.images.val, lang)}),{' '}
            {isBn ? 'টেস্ট' : 'test'} ({num(report.dataset.images.test, lang)})
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />
    </section>
  )
}
export { AccuracyScreen }
