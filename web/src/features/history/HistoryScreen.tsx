import { useState, useEffect } from 'react'
import { getScans, deleteScan, clearAllScans, type ScanRecord } from './historyStore'
import { useT, type Lang } from '../../i18n/useT'

function toBengaliNumerals(num: number): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return num.toString().replace(/\d/g, (d) => bnDigits[parseInt(d, 10)])
}

function formatDate(timestamp: number, lang: Lang = 'bn'): string {
  try {
    const d = new Date(timestamp)
    return d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return new Date(timestamp).toLocaleDateString()
  }
}

export function HistoryScreen() {
  const { lang } = useT()
  const isBn = lang === 'bn'
  const [scans, setScans] = useState<ScanRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => {
    let active = true
    getScans()
      .then((records) => {
        if (active) {
          setScans(records)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [])

  const handleDelete = async (id: string) => {
    await deleteScan(id)
    setScans((prev) => prev.filter((item) => item.id !== id))
  }

  const handleClearAll = async () => {
    await clearAllScans()
    setScans([])
    setShowClearConfirm(false)
  }

  return (
    <section className="flex flex-col gap-4 pb-8">
      {/* Header — always rendered immediately so users & test runners see the h1 heading */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{isBn ? 'স্ক্যান ইতিহাস' : 'Scan History'}</h1>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            {isBn ? 'আপনার ডিভাইসে সংরক্ষিত পূর্ববর্তী পরীক্ষার ফলাফল। সকল তথ্য সম্পূর্ণ অফলাইনে থাকে।' : 'Earlier results saved on this device. Everything stays offline.'}
          </p>
        </div>

        {!loading && scans.length > 0 && (
          <div>
            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-600 font-medium">{isBn ? 'সব মুছবেন?' : 'Delete all?'}</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition"
                >
                  {isBn ? 'হ্যাঁ, মুছুন' : 'Yes, delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 transition"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>{isBn ? 'সব মুছুন' : 'Delete all'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center sm:p-12">
          <p className="text-sm text-slate-500">{isBn ? 'ইতিহাস লোড হচ্ছে...' : 'Loading history...'}</p>
        </div>
      ) : scans.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <svg
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900 sm:text-lg">
            {isBn ? 'কোনো স্ক্যান ইতিহাস নেই' : 'No scan history yet'}
          </h2>
          <p className="mt-1.5 max-w-sm text-xs text-slate-500 sm:text-sm">
            {isBn ? 'আপনি এখনও কোনো পাতা পরীক্ষা করেননি। নতুন পাতা পরীক্ষা করলে তা স্বয়ংক্রিয়ভাবে এখানে সংরক্ষিত থাকবে।' : 'You have not checked any leaves yet. New scans are saved here automatically.'}
          </p>
          <a
            href="#/"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>{isBn ? 'নতুন পাতা স্ক্যান করুন' : 'Scan a new leaf'}</span>
          </a>
        </div>
      ) : (
        /* Scans List */
        <div className="grid gap-3 sm:gap-4">
          {scans.map((scan) => {
            const percent = Math.round(scan.confidence * 100)
            const percentBn = isBn ? toBengaliNumerals(percent) : String(percent)
            return (
              <article
                key={scan.id}
                className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs transition hover:border-slate-300 sm:p-4"
              >
                {/* Thumbnail */}
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-100 sm:h-20 sm:w-20">
                  <img
                    src={scan.thumbnail}
                    alt={scan.diseaseName[lang]}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                      {scan.diseaseName[lang]}
                    </h2>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                        scan.tier === 'high'
                          ? 'bg-emerald-50 text-emerald-700'
                          : scan.tier === 'medium'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {percentBn}%
                    </span>
                  </div>

                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {isBn ? `${scan.diseaseName.en} • ` : ''}{formatDate(scan.timestamp, lang)}
                  </p>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleDelete(scan.id)}
                  aria-label={isBn ? 'মুছুন' : 'Delete'}
                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                  title={isBn ? 'এই ফলাফলটি মুছুন' : 'Delete this result'}
                >
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
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </article>
            )
          })}
        </div>
      )}

      {/* Safety disclaimer comes from the page Layout (one per page). */}
    </section>
  )
}
export default HistoryScreen
