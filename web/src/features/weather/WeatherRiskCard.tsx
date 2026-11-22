import { useState, useEffect, useId } from 'react'
import { DIVISIONS, getDivisionById } from './divisions'
import { fetchForecast } from './openMeteo'
import { assessRisk, ADVICE_LINES, type RiskAssessment } from './risk'
import {
  loadWeatherCache,
  saveWeatherCache,
  getStoredDivision,
  setStoredDivision,
} from './weatherCache'

function toBanglaDigits(val: number | string): string {
  const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(val).replace(/[0-9]/g, (d) => digits[parseInt(d, 10)] ?? d)
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  const hours = d.getHours().toString().padStart(2, '0')
  const mins = d.getMinutes().toString().padStart(2, '0')
  return `${toBanglaDigits(hours)}:${toBanglaDigits(mins)}`
}

export default function WeatherRiskCard() {
  const selectId = useId()
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>(() => {
    return getStoredDivision() ?? ''
  })

  // Initialize from cache if matching and fresh
  const [assessment, setAssessment] = useState<RiskAssessment | null>(() => {
    const divId = getStoredDivision()
    if (!divId) return null
    const cacheResult = loadWeatherCache()
    if (cacheResult && cacheResult.cached.divisionId === divId && !cacheResult.isStale) {
      return cacheResult.cached.assessment
    }
    return null
  })

  const [fetchedAt, setFetchedAt] = useState<number | null>(() => {
    const divId = getStoredDivision()
    if (!divId) return null
    const cacheResult = loadWeatherCache()
    if (cacheResult && cacheResult.cached.divisionId === divId && !cacheResult.isStale) {
      return cacheResult.cached.fetchedAt
    }
    return null
  })

  const [isOfflineView, setIsOfflineView] = useState<boolean>(() => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true
    const divId = getStoredDivision()
    if (!isOnline && divId) {
      const cacheResult = loadWeatherCache()
      return Boolean(cacheResult && cacheResult.cached.divisionId === divId && !cacheResult.isStale)
    }
    return false
  })

  const [isUnavailable, setIsUnavailable] = useState<boolean>(() => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true
    const divId = getStoredDivision()
    if (!isOnline && divId) {
      const cacheResult = loadWeatherCache()
      const hasFresh = Boolean(cacheResult && cacheResult.cached.divisionId === divId && !cacheResult.isStale)
      return !hasFresh
    }
    return false
  })

  const [loading, setLoading] = useState(false)

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedDivisionId(val)
    setStoredDivision(val)

    if (!val) {
      setAssessment(null)
      setFetchedAt(null)
      setIsOfflineView(false)
      setIsUnavailable(false)
      return
    }

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true
    const cacheResult = loadWeatherCache()
    const hasFresh =
      cacheResult !== null &&
      cacheResult.cached.divisionId === val &&
      !cacheResult.isStale

    if (!isOnline) {
      if (hasFresh && cacheResult) {
        setAssessment(cacheResult.cached.assessment)
        setFetchedAt(cacheResult.cached.fetchedAt)
        setIsOfflineView(true)
        setIsUnavailable(false)
      } else {
        setAssessment(null)
        setFetchedAt(null)
        setIsOfflineView(false)
        setIsUnavailable(true)
      }
    } else if (hasFresh && cacheResult) {
      setAssessment(cacheResult.cached.assessment)
      setFetchedAt(cacheResult.cached.fetchedAt)
      setIsOfflineView(false)
      setIsUnavailable(false)
    }
  }

  useEffect(() => {
    if (!selectedDivisionId) return

    let isMounted = true
    const div = getDivisionById(selectedDivisionId)
    if (!div) return

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true
    if (!isOnline) return

    const cacheResult = loadWeatherCache()
    const hasFreshCache =
      cacheResult !== null &&
      cacheResult.cached.divisionId === selectedDivisionId &&
      !cacheResult.isStale

    Promise.resolve().then(() => {
      if (isMounted) setLoading(true)
    })

    fetchForecast(div.lat, div.lon)
      .then((hourly) => {
        if (!isMounted) return
        const risk = assessRisk(hourly)
        const now = Date.now()
        saveWeatherCache({
          divisionId: selectedDivisionId,
          hourly,
          assessment: risk,
          fetchedAt: now,
        })
        setAssessment(risk)
        setFetchedAt(now)
        setIsOfflineView(false)
        setIsUnavailable(false)
      })
      .catch(() => {
        if (!isMounted) return
        if (hasFreshCache && cacheResult) {
          setAssessment(cacheResult.cached.assessment)
          setFetchedAt(cacheResult.cached.fetchedAt)
          setIsOfflineView(true)
          setIsUnavailable(false)
        } else {
          setAssessment(null)
          setFetchedAt(null)
          setIsOfflineView(false)
          setIsUnavailable(true)
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [selectedDivisionId])

  const badgeConfig = {
    low: {
      text: 'কম',
      bgClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    medium: {
      text: 'মাঝারি',
      bgClass: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    high: {
      text: 'বেশি',
      bgClass: 'bg-rose-50 text-rose-800 border-rose-200',
    },
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">
            🌦️
          </span>
          <h2 className="text-sm font-bold text-slate-800">
            আবহাওয়া-ভিত্তিক রোগ-ঝুঁকি সতর্কতা
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor={selectId} className="sr-only">
            বিভাগ নির্বাচন করুন
          </label>
          <select
            id={selectId}
            value={selectedDivisionId}
            onChange={handleDivisionChange}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 outline-hidden focus:border-emerald-500 focus:bg-white"
          >
            <option value="">আপনার বিভাগ বেছে নিন</option>
            {DIVISIONS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nameBn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedDivisionId && (
        <div className="mt-3">
          {loading && !assessment && (
            <p className="text-xs text-slate-500">আবহাওয়ার তথ্য লোড হচ্ছে…</p>
          )}

          {isUnavailable && (
            <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 border border-slate-200">
              এখন আবহাওয়ার তথ্য পাওয়া যাচ্ছে না।
            </p>
          )}

          {assessment && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${badgeConfig[assessment.level].bgClass}`}
                >
                  {badgeConfig[assessment.level].text}
                </span>

                {fetchedAt && (
                  <span className="text-[11px] text-slate-500">
                    {isOfflineView
                      ? `ইন্টারনেট নেই — শেষ আপডেট: ${formatTime(fetchedAt)}`
                      : `শেষ আপডেট: ${formatTime(fetchedAt)}`}
                  </span>
                )}
              </div>

              <p className="text-xs leading-relaxed text-slate-700">
                {ADVICE_LINES[assessment.level]}
              </p>
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500">
            <span>* এটি আনুমানিক সতর্কতা, নিশ্চিত রোগ নির্ণয় নয়।</span>
            <span>
              আবহাওয়ার তথ্য:{' '}
              <a
                href="https://open-meteo.com"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-emerald-900"
              >
                Open-Meteo.com
              </a>
            </span>
          </div>
        </div>
      )}

      {!selectedDivisionId && (
        <p className="mt-2 text-[11px] text-slate-500">
          আপনার বিভাগ নির্বাচন করলে আগামী ৩ দিনের আবহাওয়া বিশ্লেষণ করে সম্ভাব্য রোগ-ঝুঁকির আনুমানিক তথ্য দেখানো হবে।
          {' '}
          আবহাওয়ার তথ্য:{' '}
          <a
            href="https://open-meteo.com"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-emerald-900"
          >
            Open-Meteo.com
          </a>
        </p>
      )}
    </div>
  )
}
