import { useState } from 'react'
import { Leaf, Sprout, ShieldCheck, CloudRain } from 'lucide-react'
import { useT } from '../../i18n/useT'
import type { WeatherSummary } from './diseaseRisk'
import { getDivisionById } from './divisions'
import { recommendRotation } from './cropRotation'

export interface CropRotationCardProps {
  /** Division id (from the selector, or nearest to GPS). Null falls back to central Bangladesh. */
  divisionId: string | null
  /** Forecast summary; null when offline or unavailable (season-only advice is shown). */
  summary: WeatherSummary | null
  /** Injected for tests; defaults to today. */
  now?: Date
}

/** ফসল চক্র পরামর্শ: season + region + live weather based rotation crops after rice. Works offline. */
export function CropRotationCard({ divisionId, summary, now }: CropRotationCardProps) {
  const { lang } = useT()
  const [today] = useState(() => now ?? new Date())
  const isBn = lang === 'bn'
  const advice = recommendRotation(today.getMonth() + 1, divisionId, summary)
  const div = divisionId ? getDivisionById(divisionId) : undefined
  const place = div ? (isBn ? div.nameBn : div.nameEn) : isBn ? 'বাংলাদেশ (সাধারণ)' : 'Bangladesh (general)'

  return (
    <section
      aria-labelledby="crop-rotation-title"
      className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm space-y-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
          <Sprout className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 id="crop-rotation-title" className="text-base font-bold text-slate-900">
            {isBn ? 'ফসল চক্র পরামর্শ' : 'Smart Crop Rotation'}
          </h2>
          <p className="text-xs text-slate-600">
            {place} • {isBn ? advice.seasonName.bn : advice.seasonName.en}
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-700">
        {isBn
          ? 'ধানের পর অন্য ফসল চাষ করলে রোগ ও পোকার চক্র ভাঙে এবং মাটির উর্বরতা ফেরে। এই মৌসুম ও আবহাওয়ায় উপযোগী ফসল:'
          : 'Growing a different crop after rice breaks pest and disease cycles and restores the soil. Crops that suit this season and weather:'}
      </p>

      {advice.weatherNotes.length > 0 && (
        <ul className="space-y-1.5">
          {advice.weatherNotes.map((n) => (
            <li key={n.en} className="flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-900">
              <CloudRain className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{isBn ? n.bn : n.en}</span>
            </li>
          ))}
        </ul>
      )}

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label={isBn ? 'প্রস্তাবিত ফসল' : 'Recommended crops'}>
        {advice.crops.map((c) => (
          <li key={c.id} data-rotation-crop={c.id} className="rounded-2xl border border-emerald-900/10 bg-emerald-50/50 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-extrabold text-emerald-950">{isBn ? c.name.bn : c.name.en}</span>
              {c.legume && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                  {isBn ? 'নাইট্রোজেন যোগ করে' : 'Adds nitrogen'}
                </span>
              )}
            </div>
            <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-700">
              <Leaf className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
              <span>
                <strong className="font-semibold">{isBn ? 'কেন উপযোগী: ' : 'Why it fits: '}</strong>
                {isBn ? c.whyFits.bn : c.whyFits.en}
              </span>
            </p>
            <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-700">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
              <span>
                <strong className="font-semibold">{isBn ? 'রোগচক্র ভাঙে: ' : 'Disease break: '}</strong>
                {isBn ? c.diseaseBreak.bn : c.diseaseBreak.en}
              </span>
            </p>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-slate-500">
        {advice.usedWeather
          ? isBn
            ? 'মৌসুম, এলাকা ও আগামী ৩ দিনের পূর্বাভাস দেখে সাধারণ পরামর্শ।'
            : 'General advice from the season, region and the next 3-day forecast.'
          : isBn
            ? 'আবহাওয়ার তথ্য ছাড়া শুধু মৌসুম ও এলাকা দেখে সাধারণ পরামর্শ (অফলাইনেও কাজ করে)।'
            : 'General advice from season and region only, without weather data (works offline).'}{' '}
        {isBn
          ? 'বপনের আগে স্থানীয় উপসহকারী কৃষি কর্মকর্তা বা কৃষি কল সেন্টার ১৬১২৩-এর সাথে মিলিয়ে নিন।'
          : 'Confirm with your local agriculture officer or Krishi Call Centre 16123 before sowing.'}
      </p>
    </section>
  )
}
