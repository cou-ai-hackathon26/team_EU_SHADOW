import { useEffect, useState } from 'react'
import type { DiseaseClassId } from '../../ai/classes'
import { getCard } from '../../content/getCard'
import { loadImage } from './loadImage'

/** One entry of public/samples/samples.json. Every image comes from the internal TEST split (never train). */
export interface SampleEntry {
  id: string
  classId: DiseaseClassId
  file: string
  split: 'test'
  credit: string
  source: { name: string; doi: string; url: string; licence: string }
  originalFile: string
  changes: string
}

export interface SampleGalleryProps {
  /** Same signature as F2's PhotoPicker, so a sample follows the exact same preview/analyse path. */
  onImageReady: (image: HTMLImageElement, file: File) => void
  samplesUrl?: string
}

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')

export default function SampleGallery({
  onImageReady,
  samplesUrl = `${BASE}/samples/samples.json`,
}: SampleGalleryProps) {
  const [samples, setSamples] = useState<SampleEntry[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(samplesUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<SampleEntry[]>
      })
      .then((list) => {
        if (!cancelled) setSamples(list)
      })
      .catch(() => {
        if (!cancelled) setError('নমুনা ছবি লোড করা যায়নি।')
      })
    return () => {
      cancelled = true
    }
  }, [samplesUrl])

  const pick = async (s: SampleEntry) => {
    setLoadingId(s.id)
    setError(null)
    try {
      const res = await fetch(`${BASE}/samples/${s.file}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      // arrayBuffer (not blob) keeps File construction portable across browsers and test runtimes
      const bytes = await res.arrayBuffer()
      const type = res.headers.get('content-type') || 'image/jpeg'
      const file = new File([bytes], s.file, { type })
      const img = await loadImage(file)
      onImageReady(img, file)
    } catch {
      setError('নমুনা ছবি লোড করা যায়নি।')
    } finally {
      setLoadingId(null)
    }
  }

  if (samples.length === 0 && !error) return null

  return (
    <section aria-labelledby="sample-gallery-title" className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1">
        <h2 id="sample-gallery-title" className="text-lg font-bold text-emerald-950">
          নমুনা ছবি দিয়ে চেষ্টা করুন
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
          পরীক্ষা করার জন্য নিচের নমুনা ছবিতে ট্যাপ করুন — তাৎক্ষণিক ডেমো রোগ নির্ণয় দেখুন।
        </p>
      </div>

      <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
        {samples.map((s) => {
          const name = getCard(s.classId).name.bn
          return (
            <li key={s.id}>
              <button
                type="button"
                aria-label={`নমুনা ছবি: ${name}`}
                disabled={loadingId !== null}
                onClick={() => void pick(s)}
                className="group flex w-full flex-col overflow-hidden rounded-2xl border border-emerald-900/15 bg-white text-left shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-600 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/40 active:scale-95 disabled:opacity-60"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                  <img
                    src={`${BASE}/samples/${s.file}`}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute bottom-1 right-1 rounded-md bg-black/60 px-1 py-0.5 text-[9px] font-semibold text-white backdrop-blur-xs">
                    ট্যাপ করুন
                  </span>
                </div>
                <span className="truncate px-2 py-1.5 text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                  {loadingId === s.id ? 'লোড হচ্ছে…' : name}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {error && (
        <p role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
          {error}
        </p>
      )}

      <details className="text-xs text-slate-500 rounded-xl border border-emerald-900/10 bg-emerald-50/40 p-2.5">
        <summary className="cursor-pointer font-medium text-slate-700 hover:text-emerald-800">ছবির সূত্র ও লাইসেন্স (গবেষণা ডেটাসেট)</summary>
        <p className="mt-1 text-[11px] text-slate-500">ছবিগুলো আমাদের টেস্ট স্প্লিট থেকে নেওয়া; মডেল ট্রেনিংয়ে আলাদা রাখা হয়েছে।</p>
        <ul className="mt-2 flex flex-col gap-1 text-[11px]">
          {samples.map((s) => (
            <li key={s.id}>
              {getCard(s.classId).name.bn}: {s.credit} ·{' '}
              <a href={s.source.url} target="_blank" rel="noreferrer" className="underline hover:text-emerald-800">
                {s.source.name}
              </a>{' '}
              · {s.source.licence} · {s.changes}
            </li>
          ))}
        </ul>
      </details>
    </section>
  )
}
