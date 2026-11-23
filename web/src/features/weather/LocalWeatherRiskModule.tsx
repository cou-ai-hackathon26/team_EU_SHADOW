import { useState, useEffect } from 'react'
import {
  BANGLADESH_DISTRICTS,
  findNearestDistrict,
  getDistrictById,
  type District,
} from './districts'
import {
  fetchDistrictWeather,
  type WeatherRiskReport,
} from './weatherService'
import { InteractiveMap } from './InteractiveMap'
import { useT } from '../../i18n/useT'
import {
  CloudSun,
  Droplets,
  Wind,
  Navigation,
  AlertTriangle,
  RotateCcw,
  Sprout,
  CheckCircle2,
  CloudRain,
  Compass,
} from 'lucide-react'

export interface LocalWeatherRiskModuleProps {
  className?: string
  lang?: 'bn' | 'en'
}

export function LocalWeatherRiskModule({
  className = '',
  lang: propLang,
}: LocalWeatherRiskModuleProps) {
  const { lang: globalLang } = useT()
  const lang = propLang || globalLang
  const isBn = lang === 'bn'

  // Load saved district from localStorage or default to Dhaka
  const [district, setDistrict] = useState<District>(() => {
    try {
      const savedId = localStorage.getItem('agroleaf_selected_district')
      if (savedId) {
        return getDistrictById(savedId)
      }
    } catch {
      // ignore storage error
    }
    return getDistrictById('dhaka')
  })

  const [report, setReport] = useState<WeatherRiskReport | null>(null)
  const [locating, setLocating] = useState<boolean>(false)
  const [gpsError, setGpsError] = useState<string | null>(null)

  // Fetch weather when district changes
  useEffect(() => {
    let isCancelled = false

    fetchDistrictWeather(district)
      .then((data) => {
        if (!isCancelled) {
          setReport(data)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch weather:', err)
      })

    return () => {
      isCancelled = true
    }
  }, [district])

  // Handle District Change
  const handleSelectDistrict = (id: string) => {
    const selected = getDistrictById(id)
    setDistrict(selected)
    setGpsError(null)
    try {
      localStorage.setItem('agroleaf_selected_district', selected.id)
    } catch {
      // storage blocked
    }
  }

  // Handle One-Tap GPS Auto-Location
  const handleAutoLocate = () => {
    if (!navigator.geolocation) {
      setGpsError(
        isBn
          ? 'আপনার ব্রাউজারে জিপিএস অবস্থান সমর্থন করে না।'
          : 'Geolocation is not supported by your browser.'
      )
      return
    }

    setLocating(true)
    setGpsError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const nearest = findNearestDistrict(latitude, longitude)
        setDistrict(nearest)
        setLocating(false)
        try {
          localStorage.setItem('agroleaf_selected_district', nearest.id)
        } catch {
          // ignore
        }
      },
      (err) => {
        console.warn('Geolocation error:', err)
        setLocating(false)
        setGpsError(
          isBn
            ? 'জিপিএস অনুমতি পাওয়া যায়নি। নিচের তালিকা থেকে জেলা বেছে নিন।'
            : 'GPS permission denied. Please select your district from the dropdown.'
        )
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  // Group districts by division for clean select
  const divisions = Array.from(new Set(BANGLADESH_DISTRICTS.map((d) => d.divisionBn)))

  return (
    <section
      id="weather-section"
      aria-labelledby="weather-risk-heading"
      className={`rounded-3xl border border-emerald-900/15 bg-white p-5 sm:p-6 shadow-sm transition-all ${className}`}
    >
      {/* Header: Title & Subtitle */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-900/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs">
              <CloudSun className="h-5 w-5" strokeWidth={2.3} />
            </span>
            <h2
              id="weather-risk-heading"
              className="text-xl sm:text-2xl font-black text-[#111827] tracking-tight"
            >
              {isBn ? 'স্থানীয় আবহাওয়া, ফসল ও রোগের ঝুঁকি' : 'Local Weather, Crop & Disease Risk'}
            </h2>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
            {isBn
              ? 'BRRI ও ওপেন-মেটিও আবহাওয়া তথ্যের ভিত্তিতে রোগ পূর্বাভাস, মৌসুমি যত্ন ও ৩ডি মানচিত্র'
              : 'Real-time weather epidemiology & 3D agronomic map for rice cultivation'}
          </p>
        </div>

        {/* GPS Auto-Detect Button */}
        <button
          type="button"
          onClick={handleAutoLocate}
          disabled={locating}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 disabled:opacity-60"
        >
          <Navigation className={`h-4 w-4 ${locating ? 'animate-spin' : ''}`} strokeWidth={2.4} />
          <span>
            {locating
              ? isBn
                ? 'অবস্থান খোঁজা হচ্ছে...'
                : 'Locating...'
              : isBn
                ? 'আমার এলাকা শনাক্ত করুন'
                : 'Auto GPS Detect'}
          </span>
        </button>
      </div>

      {gpsError && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs sm:text-sm text-amber-900 font-medium">
          {gpsError}
        </div>
      )}

      {/* District Selector Dropdown */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <label
          htmlFor="district-select"
          className="text-sm font-bold text-slate-800 shrink-0 flex items-center gap-1.5"
        >
          <Compass className="h-4 w-4 text-emerald-700" strokeWidth={2.4} />
          <span>{isBn ? 'জেলা নির্বাচন করুন:' : 'Select District:'}</span>
        </label>
        <select
          id="district-select"
          value={district.id}
          onChange={(e) => handleSelectDistrict(e.target.value)}
          className="min-h-[44px] flex-1 rounded-xl border border-slate-300 bg-slate-50/80 px-3.5 py-2 text-sm sm:text-base font-semibold text-slate-900 shadow-2xs focus:border-emerald-600 focus:bg-white focus:outline-hidden"
        >
          {divisions.map((divBn) => (
            <optgroup key={divBn} label={`${divBn} বিভাগ`}>
              {BANGLADESH_DISTRICTS.filter((d) => d.divisionBn === divBn).map((d) => (
                <option key={d.id} value={d.id}>
                  {isBn ? `${d.nameBn} (${d.nameEn})` : `${d.nameEn} (${d.nameBn})`}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <span className="text-xs text-slate-500 font-medium sm:self-center">
          {isBn
            ? `নির্বাচিত: ${district.nameBn} জেলা (${district.divisionBn} বিভাগ)`
            : `Selected: ${district.nameEn} (${district.divisionEn})`}
        </span>
      </div>

      {/* 2-Column Responsive Layout: Weather & Advisory on Left, 3D Map on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Live Weather & Disease Risk Assessments */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Current Live Weather Snapshot Card */}
          <div className="rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-emerald-50/70 via-slate-50/50 to-white p-4 sm:p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  {isBn ? 'বর্তমান মাঠের আবহাওয়া' : 'Current Weather Snapshot'}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#111827] mt-0.5">
                  {report ? `${report.weather.temp}°C` : '--°C'}
                </h3>
              </div>
              <div className="rounded-xl bg-white px-3.5 py-1.5 border border-emerald-900/10 shadow-2xs text-right">
                <span className="text-xs sm:text-sm font-bold text-emerald-950 block">
                  {report ? (isBn ? report.weather.conditionBn : report.weather.conditionEn) : isBn ? 'আবহাওয়া তথ্য লোড হচ্ছে...' : 'Loading weather...'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {isBn ? 'ওপেন-মেটিও লাইভ' : 'Open-Meteo Live'}
                </span>
              </div>
            </div>

            {/* Weather Metrics Grid */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-emerald-900/10">
              <div className="rounded-xl bg-white p-2.5 border border-emerald-900/10 text-center">
                <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                  <Droplets className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-[11px] font-semibold">{isBn ? 'আর্দ্রতা' : 'Humidity'}</span>
                </div>
                <span className="text-sm sm:text-base font-extrabold text-slate-900">
                  {report ? `${report.weather.humidity}%` : '--%'}
                </span>
              </div>

              <div className="rounded-xl bg-white p-2.5 border border-emerald-900/10 text-center">
                <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                  <CloudRain className="h-3.5 w-3.5 text-indigo-600" />
                  <span className="text-[11px] font-semibold">{isBn ? 'বৃষ্টির সম্ভাবনা' : 'Rain Prob'}</span>
                </div>
                <span className="text-sm sm:text-base font-extrabold text-slate-900">
                  {report ? `${report.weather.precipProb}%` : '--%'}
                </span>
              </div>

              <div className="rounded-xl bg-white p-2.5 border border-emerald-900/10 text-center">
                <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                  <Wind className="h-3.5 w-3.5 text-teal-600" />
                  <span className="text-[11px] font-semibold">{isBn ? 'বাতাস' : 'Wind'}</span>
                </div>
                <span className="text-sm sm:text-base font-extrabold text-slate-900">
                  {report ? `${report.weather.windSpeed} km/h` : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Disease Risk Meter List (BRRI Guidelines) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" strokeWidth={2.4} />
                <span>{isBn ? 'ধানের রোগ বিস্তারের ঝুঁকি' : 'Rice Disease Risk Meter'}</span>
              </h4>
              <span className="text-[11px] font-semibold text-slate-500">
                {isBn ? 'BRRI এপিডেমিওলজি' : 'BRRI Rules'}
              </span>
            </div>

            <div className="space-y-2.5">
              {report?.risks.map((risk) => {
                const isHigh = risk.riskLevel === 'high'
                const isMod = risk.riskLevel === 'moderate'
                const badgeClass = isHigh
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : isMod
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'

                return (
                  <div
                    key={risk.diseaseId}
                    className={`rounded-xl border p-3 transition-colors ${
                      isHigh
                        ? 'border-l-4 border-l-rose-600 border-rose-200 bg-rose-50/50'
                        : isMod
                          ? 'border-l-4 border-l-amber-500 border-amber-200 bg-amber-50/40'
                          : 'border-l-4 border-l-emerald-600 border-emerald-100 bg-emerald-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm sm:text-base text-slate-900">
                        {isBn ? risk.nameBn : risk.nameEn}
                      </span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-black ${badgeClass}`}>
                        {isBn ? risk.levelBn : risk.levelEn}
                      </span>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-slate-700 leading-snug">
                      {isBn ? risk.reasonBn : risk.reasonEn}
                    </p>
                    {isHigh && (
                      <p className="mt-1.5 text-xs font-semibold text-rose-950 bg-rose-100/80 p-2 rounded-lg">
                        <strong>{isBn ? 'পরামর্শ:' : 'Recommendation:'}</strong> {isBn ? risk.recommendationBn : risk.recommendationEn}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Seasonal Care & Crop Rotation Guide */}
          {report && (
            <div className="rounded-2xl border border-emerald-900/15 border-l-4 border-l-emerald-600 bg-gradient-to-br from-emerald-50/60 to-white p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <Sprout className="h-5 w-5 text-emerald-700" strokeWidth={2.4} />
                <h4 className="text-base font-bold text-emerald-950">
                  {isBn ? report.seasonAdvice.seasonBn : report.seasonAdvice.seasonEn} ({isBn ? report.seasonAdvice.periodBn : report.seasonAdvice.periodEn})
                </h4>
              </div>

              <div className="space-y-2 mb-3">
                {(isBn ? report.seasonAdvice.careTipsBn : report.seasonAdvice.careTipsEn).map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.4} />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>

              {/* Crop Rotation Advisory */}
              <div className="rounded-xl bg-white p-3 border border-emerald-900/10 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-1">
                  <RotateCcw className="h-3.5 w-3.5 text-emerald-700" strokeWidth={2.4} />
                  <span>{isBn ? 'শস্য পর্যায় ও মাটির উর্বরতা রক্ষা' : 'Crop Rotation Guide'}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {isBn ? report.seasonAdvice.rotationAdviceBn : report.seasonAdvice.rotationAdviceEn}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive 3D Map */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <Compass className="h-3.5 w-3.5 text-emerald-700" />
              <span>{isBn ? '৩ডি ক্ষেত্র মানচিত্র' : '3D Field Map'}</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              MapLibre GL 3D
            </span>
          </div>

          <InteractiveMap district={district} report={report} lang={lang} />

          <p className="text-[11px] text-slate-500 leading-tight">
            {isBn
              ? 'মানচিত্রটি আপনার ডিভাইসের জিপিএস বা নির্বাচিত জেলার স্থানাঙ্ক অনুযায়ী ৩ডি কোণে প্রদক্ষিণ করে। ডেটা সম্পূর্ণ লোকাল ব্রাউজারে সংরক্ষিত থাকে।'
              : 'The map tilts and centers on your selected district or GPS coordinates without storing location data remotely.'}
          </p>
        </div>
      </div>
    </section>
  )
}
