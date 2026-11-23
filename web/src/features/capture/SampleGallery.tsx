import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import type { DiseaseClassId } from '../../ai/classes'
import { getCard } from '../../content/getCard'
import { loadImage } from './loadImage'
import { useT } from '../../i18n/useT'

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
  onImageReady: (image: HTMLImageElement, file: File) => void
  samplesUrl?: string
}

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')

export default function SampleGallery({
  onImageReady,
  samplesUrl = `${BASE}/samples/samples.json`,
}: SampleGalleryProps) {
  const { lang, t } = useT()
  const isBn = lang === 'bn'
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
        if (!cancelled) {
          setError(isBn ? 'নমুনা ছবি লোড করা যায়নি।' : 'Failed to load sample images.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [samplesUrl, isBn])

  const pick = async (s: SampleEntry) => {
    setLoadingId(s.id)
    setError(null)
    try {
      const res = await fetch(`${BASE}/samples/${s.file}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const bytes = await res.arrayBuffer()
      const type = res.headers.get('content-type') || 'image/jpeg'
      const file = new File([bytes], s.file, { type })
      const img = await loadImage(file)
      onImageReady(img, file)
    } catch {
      setError(isBn ? 'নমুনা ছবি লোড করা যায়নি।' : 'Failed to load sample image.')
    } finally {
      setLoadingId(null)
    }
  }

  if (samples.length === 0 && !error) return null

  return (
    <section aria-labelledby="sample-gallery-title" className="flex flex-col gap-2 sm:gap-2.5 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="sample-gallery-title" className="text-sm sm:text-base font-extrabold text-[#0E1F16] tracking-tight">
            {t('sampleHeading')}
          </h2>
          <p className="text-xs sm:text-[13px] text-[#4A5F52] mt-0.5">
            {t('sampleSubtitle')}
          </p>
        </div>
      </div>

      {/* 2 columns on mobile, 3 columns on tablet, 6 horizontal columns on desktop */}
      <ul className="sample-gallery-grid grid grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {samples.map((s) => {
          const card = getCard(s.classId)
          const name = card.name[lang] || card.name.bn
          const isLoading = loadingId === s.id

          return (
            <li key={s.id}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                aria-label={isBn ? `নমুনা ছবি: ${name}` : `Sample Leaf: ${name}`}
                disabled={loadingId !== null}
                onClick={() => void pick(s)}
                className="group relative flex w-full flex-col overflow-hidden rounded-xl sm:rounded-2xl border-2 border-emerald-300/80 bg-white/92 text-left shadow-md backdrop-blur-sm transition-all hover:border-emerald-500 hover:shadow-lg hover:ring-2 hover:ring-emerald-400/40 focus:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600 disabled:opacity-60 cursor-pointer"
              >
                <div className="relative aspect-[16/11] w-full overflow-hidden bg-slate-100">
                  <img
                    src={`${BASE}/samples/${s.file}`}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-1 right-1 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9.5px] sm:text-[10px] font-bold text-white backdrop-blur-xs shadow-xs">
                    <Sparkles className="h-2.5 w-2.5 text-emerald-400" />
                    <span>{t('sampleTapToTest')}</span>
                  </div>
                </div>

                <div className="flex flex-col p-1.5 sm:p-2">
                  <span
                    title={name}
                    className="line-clamp-1 text-xs sm:text-[13px] font-bold text-[#0E1F16] leading-tight group-hover:text-[#064E3B]"
                  >
                    {isLoading ? (isBn ? 'লোড হচ্ছে…' : 'Loading…') : name}
                  </span>
                </div>
              </motion.button>
            </li>
          )
        })}
      </ul>

      {error && (
        <p role="alert" className="text-xs sm:text-[13px] font-bold text-rose-800 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
          {error}
        </p>
      )}

      {/* Attribution & dataset disclaimer — sleek minimal pill to ensure full desktop 100vh fit */}
      <details className="text-[11px] text-[#4A5F52] rounded-xl border border-emerald-300/80 bg-white/85 px-2.5 py-1 shadow-xs backdrop-blur-sm transition-all">
        <summary className="cursor-pointer text-[11px] font-semibold text-[#0E1F16] hover:text-[#064E3B] flex items-center justify-between">
          <span>{isBn ? 'ছবির সূত্র ও লাইসেন্স (গবেষণা ডেটাসেট)' : 'Image Source & License (Research Dataset)'}</span>
          <a
            href="#/about"
            onClick={(e) => e.stopPropagation()}
            className="text-[10.5px] font-bold text-[#064E3B] underline hover:text-[#043327] ml-2"
          >
            {isBn ? 'সম্পর্কে পৃষ্ঠায় বিস্তারিত →' : 'Details in About →'}
          </a>
        </summary>
        <p className="mt-1 text-[11px] text-[#4A5F52]">
          {isBn
            ? 'ছবিগুলো আমাদের টেস্ট স্প্লিট থেকে নেওয়া (মডেল ট্রেনিংয়ে ব্যবহার হয়নি) এবং প্রতিটি রোগ দেখাতে বাছাই করা। আসল নির্ভুলতা দেখুন Accuracy পেজে ও docs/MODEL_REPORT.md-এ।'
            : 'Images come from our test split (never used in training) and were picked to show each disease. See the real accuracy on the Accuracy page and in docs/MODEL_REPORT.md.'}
        </p>
        <ul className="mt-1 flex flex-col gap-0.5 text-[11px]">
          {samples.map((s) => {
            const cardName = getCard(s.classId).name[lang] || getCard(s.classId).name.bn
            return (
              <li key={s.id}>
                {cardName}: {s.credit} ·{' '}
                <a href={s.source.url} target="_blank" rel="noreferrer" className="underline hover:text-[#0B5D3B]">
                  {s.source.name}
                </a>{' '}
                · {s.source.licence} · {s.changes}
              </li>
            )
          })}
        </ul>
      </details>
    </section>
  )
}
