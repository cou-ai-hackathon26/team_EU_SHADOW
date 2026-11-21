import { useEffect, useState } from 'react'
import ConfusionMatrix from './ConfusionMatrix'
import {
  getClassLabelBn,
  getTierLabelBn,
  toBanglaDigits,
  toBanglaPercent,
} from './format'
import HowItWorks from './HowItWorks'
import { loadReport, type ReportLoadResult } from './loadReport'

export default function AccuracyScreen() {
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
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center p-6 text-slate-600">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-leaf-600 border-t-transparent" />
          <p className="font-medium">লোড হচ্ছে…</p>
        </div>
      </main>
    )
  }

  if (loadState.status === 'missing') {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-4 sm:p-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h1 className="text-2xl font-bold text-leaf-800">
            মডেল মূল্যায়ন ও সঠিকতা
          </h1>
          <div className="mt-3 rounded-xl border border-leaf-200 bg-leaf-50 p-4 text-sm text-slate-800">
            <p className="font-semibold text-leaf-800">
              মডেলের ফলাফল শীঘ্রই আসছে
            </p>
            <p className="mt-1 text-slate-600 text-xs">
              আমাদের স্ক্র্যাচ-ট্রেইন্ড মডেলের মূল্যায়ন ডেটা ও মেট্রিক্স প্রস্তুত
              হচ্ছে। পাইপলাইনের টেস্ট সম্পন্ন হলে বিস্তারিত ফলাফল এখানে দেখা যাবে।
            </p>
          </div>
        </header>

        <HowItWorks />

        <footer className="rounded-xl bg-white p-4 text-center text-xs text-slate-500 border border-slate-200">
          এটি প্রাথমিক স্ক্রিনিং, চূড়ান্ত রোগ নির্ণয় নয়। প্রয়োজনে কৃষি কল
          সেন্টার <strong className="text-slate-800">১৬১২৩</strong>-এ যোগাযোগ
          করুন।
        </footer>
      </main>
    )
  }

  const { report, meta } = loadState

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-4 sm:p-6">
      {/* Top Banner & Title */}
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-leaf-800">
            মডেল সঠিকতা ও পারফরম্যান্স
          </h1>
          {meta.trainedFromScratch ? (
            <span className="inline-flex items-center rounded-full bg-leaf-100 px-3 py-1 text-xs font-semibold text-leaf-800 border border-leaf-200">
              শূন্য থেকে প্রশিক্ষিত মডেল
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-warn-500">
              Temporary Prototype — Pretrained Model
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-600">
          আর্কিটেকচার: {meta.architecture} · ভার্সন: {meta.version} · ইনপুট:{' '}
          {toBanglaDigits(meta.inputSize)}×{toBanglaDigits(meta.inputSize)}
        </p>

        {/* High-level stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 text-center">
          <div className="rounded-xl bg-leaf-50 p-3 border border-leaf-100">
            <span className="text-xs text-slate-600">সার্বিক নির্ভুলতা</span>
            <p className="text-xl sm:text-2xl font-bold text-leaf-800">
              {toBanglaPercent(report.test.accuracy)}
            </p>
          </div>
          <div className="rounded-xl bg-leaf-50 p-3 border border-leaf-100">
            <span className="text-xs text-slate-600">ম্যাক্রো এফ১</span>
            <p className="text-xl sm:text-2xl font-bold text-leaf-800">
              {toBanglaPercent(report.test.macroF1)}
            </p>
          </div>
          <div className="rounded-xl bg-leaf-50 p-3 border border-leaf-100">
            <span className="text-xs text-slate-600">টেস্ট নমুনা (n)</span>
            <p className="text-xl sm:text-2xl font-bold text-slate-800">
              {toBanglaDigits(report.test.n)}
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
        <h3 className="font-bold text-slate-900">
          শ্রেণীভিত্তিক ফলাফল (Per-class Metrics)
        </h3>
        <p className="mt-0.5 text-xs text-slate-600 mb-3">
          প্রতিটি স্বতন্ত্র ধানপাতার রোগের শনাক্তকরণ সক্ষমতা ও সাপোর্ট।
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[480px] border-collapse text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th scope="col" className="p-2.5 font-semibold text-slate-800">
                  রোগ / শ্রেণী
                </th>
                <th scope="col" className="p-2.5 font-semibold text-slate-800 text-right">
                  প্রিসিশন
                </th>
                <th scope="col" className="p-2.5 font-semibold text-slate-800 text-right">
                  রিকল
                </th>
                <th scope="col" className="p-2.5 font-semibold text-slate-800 text-right">
                  এফ১
                </th>
                <th scope="col" className="p-2.5 font-semibold text-slate-800 text-right">
                  নমুনার সংখ্যা
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
                    {getClassLabelBn(row.classId)}
                  </td>
                  <td className="p-2.5 text-right text-slate-700">
                    {toBanglaPercent(row.precision)}
                  </td>
                  <td className="p-2.5 text-right text-slate-700">
                    {toBanglaPercent(row.recall)}
                  </td>
                  <td className="p-2.5 text-right font-semibold text-leaf-800">
                    {toBanglaPercent(row.f1)}
                  </td>
                  <td className="p-2.5 text-right text-slate-600">
                    {toBanglaDigits(row.support)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tier Breakdown Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="font-bold text-slate-900">
          কনফিডেন্স স্তরভিত্তিক পারফরম্যান্স
        </h3>
        <p className="mt-0.5 text-xs text-slate-600 mb-3">
          মডেলের আত্মবিশ্বাস অনুযায়ী ৪টি স্তরে কভারেজ ও সঠিকতার অনুপাত।
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[360px] border-collapse text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th scope="col" className="p-2.5 font-semibold text-slate-800">
                  ফলাফল স্তর
                </th>
                <th scope="col" className="p-2.5 font-semibold text-slate-800 text-right">
                  কভারেজ (Coverage)
                </th>
                <th scope="col" className="p-2.5 font-semibold text-slate-800 text-right">
                  নির্ভুলতা (Accuracy)
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
                    {getTierLabelBn(tier.tier)}
                  </td>
                  <td className="p-2.5 text-right text-slate-700">
                    {toBanglaPercent(tier.coverage)}
                  </td>
                  <td className="p-2.5 text-right font-semibold text-leaf-800">
                    {toBanglaPercent(tier.accuracy)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Limitations List */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="font-bold text-slate-900">মডেলের সীমাবদ্ধতা</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs text-slate-700">
          {report.limitations.map((lim, idx) => (
            <li key={`lim-${idx}`}>{lim.bn}</li>
          ))}
        </ul>
      </section>

      {/* Dataset Credit */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="font-bold text-slate-900">ডেটাসেট তথ্য ও স্বত্ব</h3>
        <div className="mt-2 text-xs space-y-1 text-slate-700">
          <p>
            নাম:{' '}
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
            লাইসেন্স: <span className="font-medium">{report.dataset.license}</span>
          </p>
          <p className="text-slate-600">
            নমুনা বন্টন: ট্রেন ({toBanglaDigits(report.dataset.images.train)}),
            ভ্যালিডেশন ({toBanglaDigits(report.dataset.images.val)}), টেস্ট (
            {toBanglaDigits(report.dataset.images.test)})
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Mandatory Disclaimer */}
      <footer className="rounded-xl bg-white p-4 text-center text-xs text-slate-500 border border-slate-200">
        এটি প্রাথমিক স্ক্রিনিং, চূড়ান্ত রোগ নির্ণয় নয়। প্রয়োজনে কৃষি কল
        সেন্টার <strong className="text-slate-800">১৬১২৩</strong>-এ যোগাযোগ
        করুন।
      </footer>
    </main>
  )
}
export { AccuracyScreen }
