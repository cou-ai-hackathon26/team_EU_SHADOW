import { useState, useEffect, useCallback } from 'react'
import { getDivisionById } from './divisions'
import { getPosition, roundCoord, type Coordinates } from './location'
import { fetchForecast } from './openMeteo'
import { assessDiseases, TUNGRO_INFO_LINE, type AssessmentOutput, type RiskLevel } from './diseaseRisk'
import { loadWeatherCache, saveWeatherCache, WEATHER_MODE_KEY, type CachedWeatherV2 } from './weatherCache'
import { getCard } from '../../content/getCard'
import { CropRotationCard } from './CropRotationCard'
import { nearestDivisionId } from './cropRotation'
import { reverseGeocode } from './reverseGeocode'
import { useT, type Lang } from '../../i18n/useT'

/** Used when location permission is denied or still being detected. */
const FALLBACK_DIVISION = 'dhaka'

const TEXT = {
  bn: {
    title: 'আবহাওয়া ও রোগ-ঝুঁকি',
    autoLocation: '📍 অটো লোকেশন (আমার অবস্থান)',
    currentLocation: 'বর্তমান অবস্থান:',
    fallbackPlace: 'ঢাকা, বাংলাদেশ',
    privacy: 'আবহাওয়া দেখাতে আপনার আনুমানিক অবস্থান (প্রায় ১ কিমি) ব্যবহার করা হয় — শুধু Open-Meteo ও এলাকার নামের জন্য OpenStreetMap-এ যায়, আমাদের কোনো সার্ভারে নয়।',
    gpsDenied: 'অবস্থান পাওয়া যায়নি — ঢাকার আবহাওয়া দেখানো হচ্ছে। অবস্থান চালু করে আবার "অটো লোকেশন" চাপুন।',
    lastUpdate: 'শেষ আপডেট:',
    offlineLastUpdate: 'ইন্টারনেট নেই — শেষ আপডেট:',
    loading: 'আবহাওয়ার পূর্বাভাস লোড হচ্ছে…',
    unavailable: 'এখন আবহাওয়ার তথ্য পাওয়া যাচ্ছে না।',
    temperature: 'তাপমাত্রা',
    maxHumidity: 'সর্বোচ্চ আর্দ্রতা',
    totalRain: 'মোট বৃষ্টি',
    rainyHours: 'বৃষ্টির ঘণ্টা',
    celsius: '°সে',
    mm: 'মিমি',
    riskHeading: 'ধানের প্রধান রোগসমূহের পূর্বাভাসভিত্তিক ঝুঁকি',
    humidHours: (n: string) => `আগামী ৩ দিনে প্রায় ${n} ঘণ্টা অনুকূল আর্দ্রতা ও তাপমাত্রা`,
    tungro: TUNGRO_INFO_LINE,
    adviceHigh: 'প্রতিদিন পাতা দেখুন, দাগ দেখলে স্ক্যান করুন বা ১৬১২৩-এ কল করুন।',
    adviceNormal: 'নিয়মিত জমি দেখুন।',
    scanNow: 'এখনই পাতা স্ক্যান করুন',
    footerNote: '* এটি আনুমানিক সতর্কতা, নিশ্চিত রোগ নির্ণয় নয়।',
    weatherData: 'আবহাওয়ার তথ্য:',
    placeData: 'এলাকার নাম:',
    risk: { high: 'ঝুঁকি: বেশি', medium: 'ঝুঁকি: মাঝারি', low: 'ঝুঁকি: কম', not_assessed: 'আবহাওয়া দিয়ে বলা যায় না' },
    weekdays: ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'],
  },
  en: {
    title: 'Weather & Disease Risk',
    autoLocation: '📍 Auto Location (My Location)',
    currentLocation: 'Current Location:',
    fallbackPlace: 'Dhaka, Bangladesh',
    privacy: 'Your approximate location (about 1 km) is used for the weather — it goes only to Open-Meteo, and to OpenStreetMap for the area name, never to our servers.',
    gpsDenied: 'Location not available — showing the weather for Dhaka. Turn on location and tap "Auto Location" again.',
    lastUpdate: 'Last update:',
    offlineLastUpdate: 'No internet — last update:',
    loading: 'Loading the weather forecast…',
    unavailable: 'Weather data is not available right now.',
    temperature: 'Temperature',
    maxHumidity: 'Max humidity',
    totalRain: 'Total rain',
    rainyHours: 'Rainy hours',
    celsius: '°C',
    mm: 'mm',
    riskHeading: 'Forecast-based risk for the main rice diseases',
    humidHours: (n: string) => `About ${n} hours of favourable humidity and temperature in the next 3 days`,
    tungro: 'A virus disease spread by green leafhoppers — if you see leafhoppers in the field, call 16123.',
    adviceHigh: 'Check the leaves every day; scan any spots you see, or call 16123.',
    adviceNormal: 'Check the field regularly.',
    scanNow: 'Scan a leaf now',
    footerNote: '* This is an estimated alert, not a confirmed diagnosis.',
    weatherData: 'Weather data:',
    placeData: 'Area names:',
    risk: { high: 'Risk: high', medium: 'Risk: medium', low: 'Risk: low', not_assessed: 'Not assessable from weather' },
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
} as const

const BADGE_CLASS: Record<RiskLevel, string> = {
  high: 'bg-rose-50 text-rose-800 border-rose-200',
  medium: 'bg-amber-50 text-amber-800 border-amber-200',
  low: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  not_assessed: 'bg-slate-100 text-slate-700 border-slate-200',
}

function digits(val: number | string, lang: Lang): string {
  if (lang === 'en') return String(val)
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(val).replace(/[0-9]/g, (d) => bn[parseInt(d, 10)] ?? d)
}

function formatUpdate(timestamp: number, lang: Lang): string {
  const d = new Date(timestamp)
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${TEXT[lang].weekdays[d.getDay()]} ${digits(hh, lang)}:${digits(mm, lang)}`
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Ignore storage errors (private mode / quota exceeded)
  }
}

const isOnlineNow = () => (typeof navigator !== 'undefined' ? navigator.onLine !== false : true)

export default function WeatherScreen() {
  const { lang } = useT()
  const T = TEXT[lang]

  const [assessmentOutput, setAssessmentOutput] = useState<AssessmentOutput | null>(() => {
    const loaded = loadWeatherCache()
    return loaded && !loaded.isStale ? loaded.assessment : null
  })
  const [fetchedAt, setFetchedAt] = useState<number | null>(() => {
    const loaded = loadWeatherCache()
    return loaded && !loaded.isStale ? loaded.cached.fetchedAt : null
  })
  const [isOfflineView, setIsOfflineView] = useState<boolean>(() => {
    const loaded = loadWeatherCache()
    return !isOnlineNow() && Boolean(loaded && !loaded.isStale)
  })
  const [isUnavailable, setIsUnavailable] = useState<boolean>(() => {
    const loaded = loadWeatherCache()
    return !isOnlineNow() && (!loaded || loaded.isStale)
  })
  const [gpsDenied, setGpsDenied] = useState(false)
  const [loading, setLoading] = useState(false)
  // The (rounded) GPS point, its nearest division, and its area name in each language.
  const [coords, setCoords] = useState<Coordinates | null>(null)
  const [divisionId, setDivisionId] = useState<string | null>(null)
  const [placeNames, setPlaceNames] = useState<Partial<Record<Lang, string>>>({})

  const fetchAndAssess = useCallback(async (lat: number, lon: number, cacheLabel: string) => {
    const loaded = loadWeatherCache()
    const hasFresh = Boolean(loaded && !loaded.isStale)
    const fallBackToCache = () => {
      if (hasFresh && loaded) {
        setAssessmentOutput(loaded.assessment)
        setFetchedAt(loaded.cached.fetchedAt)
        setIsOfflineView(true)
        setIsUnavailable(false)
      } else {
        setAssessmentOutput(null)
        setIsOfflineView(false)
        setIsUnavailable(true)
      }
    }
    if (!isOnlineNow()) return fallBackToCache()

    setLoading(true)
    try {
      const roundedLat = roundCoord(lat)
      const roundedLon = roundCoord(lon)
      const hourly = await fetchForecast(roundedLat, roundedLon)
      const now = Date.now()
      const entry: CachedWeatherV2 = { mode: 'gps', lat: roundedLat, lon: roundedLon, label: cacheLabel, hourly, fetchedAt: now }
      saveWeatherCache(entry)
      setAssessmentOutput(assessDiseases(hourly))
      setFetchedAt(now)
      setIsOfflineView(false)
      setIsUnavailable(false)
    } catch {
      fallBackToCache()
    } finally {
      setLoading(false)
    }
  }, [])

  // অটো লোকেশন: GPS → forecast; on denial, Dhaka.
  const requestGps = useCallback(() => {
    safeSet(WEATHER_MODE_KEY, 'gps')
    getPosition()
      .then((c) => {
        setGpsDenied(false)
        setCoords(c)
        setDivisionId(nearestDivisionId(c.lat, c.lon))
        setPlaceNames({})
        return fetchAndAssess(c.lat, c.lon, 'gps')
      })
      .catch(() => {
        setGpsDenied(true)
        setCoords(null)
        setDivisionId(FALLBACK_DIVISION)
        const dhaka = getDivisionById(FALLBACK_DIVISION)
        if (dhaka) void fetchAndAssess(dhaka.lat, dhaka.lon, 'fallback-dhaka')
      })
  }, [fetchAndAssess])

  // Initial load: cached forecast first (instant), then ask for the location.
  useEffect(() => {
    const timer = setTimeout(() => requestGps(), 0)
    return () => clearTimeout(timer)
  }, [requestGps])

  // Area name in the current language; fetched again when the language changes.
  useEffect(() => {
    if (!coords || placeNames[lang]) return
    let cancelled = false
    void reverseGeocode(coords.lat, coords.lon, lang).then((name) => {
      if (!cancelled && name) setPlaceNames((p) => ({ ...p, [lang]: name }))
    })
    return () => {
      cancelled = true
    }
  }, [coords, lang, placeNames])

  const place = placeNames[lang] ?? T.fallbackPlace
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
            <h1 className="text-xl font-extrabold text-slate-900">{T.title}</h1>
          </div>
          {fetchedAt && (
            <span className="text-xs text-slate-500">
              {isOfflineView ? T.offlineLastUpdate : T.lastUpdate} {formatUpdate(fetchedAt, lang)}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-3">
          {gpsDenied ? (
            <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">{T.gpsDenied}</p>
          ) : (
            <p className="text-xs text-slate-600 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60">{T.privacy}</p>
          )}

          {/* Auto-location button + prominent current-location pill */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={requestGps}
              className="inline-flex items-center gap-1 rounded-xl border border-emerald-800/20 bg-emerald-100/60 px-3.5 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-100 active:scale-95 transition-all"
            >
              {T.autoLocation}
            </button>
            <p
              data-testid="current-place"
              className="text-base md:text-lg font-semibold text-emerald-950 bg-emerald-50 border border-emerald-300 px-4 py-2 rounded-xl"
            >
              <span className="font-medium text-emerald-800">{T.currentLocation} </span>
              <span>{place}</span>
            </p>
          </div>
        </div>
      </div>

      {loading && !assessmentOutput && (
        <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm text-center">
          <p className="text-sm text-slate-600">{T.loading}</p>
        </div>
      )}

      {isUnavailable && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center">
          <p className="text-sm font-medium text-slate-700">{T.unavailable}</p>
        </div>
      )}

      {assessmentOutput && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="rounded-2xl border border-emerald-900/10 bg-white p-3 shadow-xs">
              <span className="text-[11px] text-slate-500">{T.temperature}</span>
              <p className="mt-1 text-base font-bold text-slate-900">
                {digits(assessmentOutput.summary.minTemp, lang)}–{digits(assessmentOutput.summary.maxTemp, lang)}
                {T.celsius}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-900/10 bg-white p-3 shadow-xs">
              <span className="text-[11px] text-slate-500">{T.maxHumidity}</span>
              <p className="mt-1 text-base font-bold text-slate-900">{digits(assessmentOutput.summary.maxRh, lang)}%</p>
            </div>
            <div className="rounded-2xl border border-emerald-900/10 bg-white p-3 shadow-xs">
              <span className="text-[11px] text-slate-500">{T.totalRain}</span>
              <p className="mt-1 text-base font-bold text-slate-900">
                {digits(assessmentOutput.summary.totalRainMm, lang)} {T.mm}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-900/10 bg-white p-3 shadow-xs">
              <span className="text-[11px] text-slate-500">{T.rainyHours}</span>
              <p className="mt-1 text-base font-bold text-slate-900">{digits(assessmentOutput.summary.rainyHours, lang)}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">{T.riskHeading}</h2>
            <div className="divide-y divide-slate-100">
              {assessmentOutput.diseases.map((d) => {
                const card = getCard(d.classId)
                return (
                  <div key={d.classId} className="py-3 first:pt-1 last:pb-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-sm">{card.name[lang]}</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${BADGE_CLASS[d.level]}`}
                      >
                        {T.risk[d.level]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      {d.classId === 'tungro' ? T.tungro : T.humidHours(digits(d.humidHours, lang))}
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
              <p className="text-xs font-medium text-slate-800">{hasHighRisk ? T.adviceHigh : T.adviceNormal}</p>
              <a
                href="#/scan/rice"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-700 px-4 py-3 text-center text-sm font-bold text-white shadow-sm hover:bg-emerald-800 active:scale-98 transition-all"
              >
                {T.scanNow}
              </a>
            </div>
          </div>
        </>
      )}

      {/* ফসল চক্র পরামর্শ: always shown; season + region fallback when weather is unavailable */}
      <CropRotationCard
        divisionId={divisionId ?? FALLBACK_DIVISION}
        placeName={placeNames[lang] ?? (gpsDenied || !coords ? T.fallbackPlace : null)}
        summary={assessmentOutput?.summary ?? null}
      />

      <footer className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-center text-xs text-slate-500 shadow-2xs space-y-1">
        <p>{T.footerNote}</p>
        <p>
          {T.weatherData}{' '}
          <a href="https://open-meteo.com" target="_blank" rel="noreferrer" className="underline hover:text-emerald-900 font-medium">
            Open-Meteo.com (CC BY 4.0)
          </a>
        </p>
        <p>
          {T.placeData}{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-emerald-900 font-medium"
          >
            © OpenStreetMap contributors (Nominatim)
          </a>
        </p>
      </footer>
    </section>
  )
}
