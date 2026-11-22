import { useState, useEffect, useId, useCallback } from 'react'
import { DIVISIONS, getDivisionById } from './divisions'
import { getPosition, roundCoord } from './location'
import { fetchForecast } from './openMeteo'
import {
  assessDiseases,
  TUNGRO_INFO_LINE,
  type AssessmentOutput,
  type RiskLevel,
} from './diseaseRisk'
import {
  loadWeatherCache,
  saveWeatherCache,
  WEATHER_MODE_KEY,
  WEATHER_DIVISION_KEY,
  type CachedWeatherV2,
} from './weatherCache'
import { getCard } from '../../content/getCard'

const WEEKDAYS_BN = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
]

function toBanglaDigits(val: number | string): string {
  const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(val).replace(/[0-9]/g, (d) => digits[parseInt(d, 10)] ?? d)
}

function formatUpdateHeader(timestamp: number): string {
  const d = new Date(timestamp)
  const weekday = WEEKDAYS_BN[d.getDay()]
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${weekday} ${toBanglaDigits(hh)}:${toBanglaDigits(mm)}`
}

const BADGE_CONFIG: Record<
  RiskLevel,
  { label: string; badgeClass: string }
> = {
  high: {
    label: 'ঝুঁকি: বেশি',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  medium: {
    label: 'ঝুঁকি: মাঝারি',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  low: {
    label: 'ঝুঁকি: কম',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  not_assessed: {
    label: 'আবহাওয়া দিয়ে বলা যায় না',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
}

export default function WeatherScreen() {
  const selectId = useId()
  const [mode, setMode] = useState<'gps' | 'division'>(() => {
    return (localStorage.getItem(WEATHER_MODE_KEY) as 'gps' | 'division') || 'gps'
  })
  const [selectedDivision, setSelectedDivision] = useState<string>(() => {
    return localStorage.getItem(WEATHER_DIVISION_KEY) || 'dhaka'
  })

  const [assessmentOutput, setAssessmentOutput] = useState<AssessmentOutput | null>(() => {
    const loaded = loadWeatherCache()
    return loaded && !loaded.isStale ? loaded.assessment : null
  })

  const [label, setLabel] = useState<string>(() => {
    const loaded = loadWeatherCache()
    return loaded ? loaded.cached.label : ''
  })

  const [fetchedAt, setFetchedAt] = useState<number | null>(() => {
    const loaded = loadWeatherCache()
    return loaded ? loaded.cached.fetchedAt : null
  })

  const [isOfflineView, setIsOfflineView] = useState<boolean>(() => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true
    const loaded = loadWeatherCache()
    return !isOnline && Boolean(loaded && !loaded.isStale)
  })

  const [isUnavailable, setIsUnavailable] = useState<boolean>(() => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true
    const loaded = loadWeatherCache()
    return !isOnline && (!loaded || loaded.isStale)
  })

  const [gpsError, setGpsError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch forecast for lat/lon
  const fetchAndAssess = useCallback(
    async (lat: number, lon: number, locLabel: string, activeMode: 'gps' | 'division') => {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true
      const loaded = loadWeatherCache()
      const hasFresh = Boolean(loaded && !loaded.isStale)

      if (!isOnline) {
        if (hasFresh && loaded) {
          setAssessmentOutput(loaded.assessment)
          setLabel(loaded.cached.label)
          setFetchedAt(loaded.cached.fetchedAt)
          setIsOfflineView(true)
          setIsUnavailable(false)
        } else {
          setAssessmentOutput(null)
          setIsOfflineView(false)
          setIsUnavailable(true)
        }
        return
      }

      setLoading(true)
      try {
        const roundedLat = roundCoord(lat)
        const roundedLon = roundCoord(lon)
        const hourly = await fetchForecast(roundedLat, roundedLon)
        const output = assessDiseases(hourly)
        const now = Date.now()

        const cacheEntry: CachedWeatherV2 = {
          mode: activeMode,
          lat: roundedLat,
          lon: roundedLon,
          label: locLabel,
          hourly,
          fetchedAt: now,
        }
        saveWeatherCache(cacheEntry)

        setAssessmentOutput(output)
        setLabel(locLabel)
        setFetchedAt(now)
        setIsOfflineView(false)
        setIsUnavailable(false)
        setGpsError(null)
      } catch {
        if (hasFresh && loaded) {
          setAssessmentOutput(loaded.assessment)
          setLabel(loaded.cached.label)
          setFetchedAt(loaded.cached.fetchedAt)
          setIsOfflineView(true)
          setIsUnavailable(false)
        } else {
          setAssessmentOutput(null)
          setIsOfflineView(false)
          setIsUnavailable(true)
        }
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  // Trigger GPS acquisition
  const requestGps = useCallback(() => {
    setGpsError(null)
    setMode('gps')
    localStorage.setItem(WEATHER_MODE_KEY, 'gps')

    getPosition()
      .then((coords) => {
        return fetchAndAssess(coords.lat, coords.lon, 'আপনার অবস্থান', 'gps')
      })
      .catch(() => {
        setGpsError('অবস্থান পাওয়া যায়নি — নিচে বিভাগ বেছে নিন')
      })
  }, [fetchAndAssess])

  // Initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      const storedMode = localStorage.getItem(WEATHER_MODE_KEY)

      if (storedMode === 'division') {
        const divId = localStorage.getItem(WEATHER_DIVISION_KEY) || 'dhaka'
        const div = getDivisionById(divId) || DIVISIONS[0]
        void fetchAndAssess(div.lat, div.lon, div.nameBn, 'division')
      } else {
        // Default / GPS mode: request GPS
        requestGps()
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [fetchAndAssess, requestGps])

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const divId = e.target.value
    if (!divId) return
    const div = getDivisionById(divId)
    if (!div) return

    setSelectedDivision(divId)
    setMode('division')
    setGpsError(null)
    localStorage.setItem(WEATHER_MODE_KEY, 'division')
    localStorage.setItem(WEATHER_DIVISION_KEY, divId)

    fetchAndAssess(div.lat, div.lon, div.nameBn, 'division')
  }

  const hasHighRisk = assessmentOutput?.diseases.some((d) => d.level === 'high')

  return (
    <section className="flex flex-col gap-5">
      {/* Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">
              🌦️
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                আবহাওয়া ও রোগ-ঝুঁকি
              </h1>
              {label && (
                <p className="text-xs font-semibold text-emerald-800">
                  {label}
                </p>
              )}
            </div>
          </div>

          {fetchedAt && (
            <span className="text-xs text-slate-500">
              {isOfflineView
                ? `ইন্টারনেট নেই — শেষ আপডেট: ${formatUpdateHeader(fetchedAt)}`
                : `শেষ আপডেট: ${formatUpdateHeader(fetchedAt)}`}
            </span>
          )}
        </div>

        {/* Location selector / GPS status */}
        <div className="mt-3 flex flex-col gap-2">
          {mode === 'gps' && !gpsError && (
            <p className="text-xs text-slate-600 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60">
              আবহাওয়া দেখাতে আপনার আনুমানিক অবস্থান (প্রায় ১ কিমি) ব্যবহার করা হবে — শুধু Open-Meteo-তে যায়, আমাদের কোনো সার্ভারে নয়।
            </p>
          )}

          {gpsError && (
            <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {gpsError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={requestGps}
              className="inline-flex items-center gap-1 rounded-xl border border-emerald-800/20 bg-emerald-100/60 px-3 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100 active:scale-95 transition-all"
            >
              📍 আমার অবস্থান ব্যবহার করুন
            </button>

            <div className="flex items-center gap-1.5">
              <label htmlFor={selectId} className="text-xs text-slate-600">
                অথবা বিভাগ বেছে নিন:
              </label>
              <select
                id={selectId}
                value={selectedDivision}
                onChange={handleDivisionChange}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 outline-hidden focus:border-emerald-500 focus:bg-white"
              >
                <option value="">বিভাগ নির্বাচন করুন</option>
                {DIVISIONS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameBn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && !assessmentOutput && (
        <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm text-center">
          <p className="text-sm text-slate-600">আবহাওয়ার পূর্বাভাস লোড হচ্ছে…</p>
        </div>
      )}

      {isUnavailable && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center">
          <p className="text-sm font-medium text-slate-700">
            এখন আবহাওয়ার তথ্য পাওয়া যাচ্ছে না।
          </p>
        </div>
      )}

      {/* Weather Content when data available */}
      {assessmentOutput && (
        <>
          {/* Summary Row: 4 tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="rounded-2xl border border-emerald-900/10 bg-white p-3 shadow-xs">
              <span className="text-[11px] text-slate-500">তাপমাত্রা</span>
              <p className="mt-1 text-base font-bold text-slate-900">
                {toBanglaDigits(assessmentOutput.summary.minTemp)}–{toBanglaDigits(assessmentOutput.summary.maxTemp)}°সে
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-900/10 bg-white p-3 shadow-xs">
              <span className="text-[11px] text-slate-500">সর্বোচ্চ আর্দ্রতা</span>
              <p className="mt-1 text-base font-bold text-slate-900">
                {toBanglaDigits(assessmentOutput.summary.maxRh)}%
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-900/10 bg-white p-3 shadow-xs">
              <span className="text-[11px] text-slate-500">মোট বৃষ্টি</span>
              <p className="mt-1 text-base font-bold text-slate-900">
                {toBanglaDigits(assessmentOutput.summary.totalRainMm)} মিমি
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-900/10 bg-white p-3 shadow-xs">
              <span className="text-[11px] text-slate-500">বৃষ্টির ঘণ্টা</span>
              <p className="mt-1 text-base font-bold text-slate-900">
                {toBanglaDigits(assessmentOutput.summary.rainyHours)}
              </p>
            </div>
          </div>

          {/* Disease List */}
          <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              ধানের প্রধান রোগসমূহের পূর্বাভাসভিত্তিক ঝুঁকি
            </h2>

            <div className="divide-y divide-slate-100">
              {assessmentOutput.diseases.map((d) => {
                const card = getCard(d.classId)
                const isTungro = d.classId === 'tungro'
                const badge = BADGE_CONFIG[d.level]

                return (
                  <div key={d.classId} className="py-3 first:pt-1 last:pb-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {card.name.bn}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${badge.badgeClass}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      {isTungro
                        ? TUNGRO_INFO_LINE
                        : `আগামী ৩ দিনে প্রায় ${toBanglaDigits(d.humidHours)} ঘণ্টা অনুকূল আর্দ্রতা ও তাপমাত্রা`}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Advice & Scan CTA under the list */}
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
              <p className="text-xs font-medium text-slate-800">
                {hasHighRisk
                  ? 'প্রতিদিন পাতা দেখুন, দাগ দেখলে স্ক্যান করুন বা ১৬১২৩-এ কল করুন।'
                  : 'নিয়মিত জমি দেখুন।'}
              </p>

              <a
                href="#/"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-700 px-4 py-3 text-center text-sm font-bold text-white shadow-sm hover:bg-emerald-800 active:scale-98 transition-all"
              >
                এখনই পাতা স্ক্যান করুন
              </a>
            </div>
          </div>
        </>
      )}

      {/* Footer Disclaimer & Credits */}
      <footer className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-center text-xs text-slate-500 shadow-2xs space-y-1">
        <p>* এটি আনুমানিক সতর্কতা, নিশ্চিত রোগ নির্ণয় নয়।</p>
        <p>
          আবহাওয়ার তথ্য:{' '}
          <a
            href="https://open-meteo.com"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-emerald-900 font-medium"
          >
            Open-Meteo.com (CC BY 4.0)
          </a>
        </p>
      </footer>
    </section>
  )
}
