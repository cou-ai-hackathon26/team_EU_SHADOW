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
      const blob = await res.blob()
      const file = new File([blob], s.file, { type: blob.type || 'image/jpeg' })
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
    <section aria-labelledby="sample-gallery-title" className="flex flex-col gap-3">
      <h2 id="sample-gallery-title" className="text-lg font-bold text-leaf-800">
        নমুনা ছবি দিয়ে চেষ্টা করুন
      </h2>
      <p className="text-sm text-slate-600">
        ছবিগুলো আমাদের test split থেকে নেওয়া; মডেলের training-এ ব্যবহার হয়নি।
      </p>

      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {samples.map((s) => {
          const name = getCard(s.classId).name.bn
          return (
            <li key={s.id}>
              <button
                type="button"
                aria-label={`নমুনা ছবি: ${name}`}
                disabled={loadingId !== null}
                onClick={() => void pick(s)}
                className="flex w-full flex-col overflow-hidden rounded-xl border border-leaf-800/15 bg-white text-left shadow-xs transition hover:border-leaf-800/40 focus:outline-none focus:ring-2 focus:ring-leaf-800/40 disabled:opacity-60"
              >
                <img
                  src={`${BASE}/samples/${s.file}`}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
                <span className="px-2 py-1 text-xs font-medium text-slate-800">
                  {loadingId === s.id ? 'লোড হচ্ছে…' : name}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <details className="text-xs text-slate-600">
        <summary className="cursor-pointer">ছবির সূত্র ও লাইসেন্স</summary>
        <ul className="mt-2 flex flex-col gap-1">
          {samples.map((s) => (
            <li key={s.id}>
              {getCard(s.classId).name.bn}: {s.credit} ·{' '}
              <a href={s.source.url} target="_blank" rel="noreferrer" className="underline">
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
