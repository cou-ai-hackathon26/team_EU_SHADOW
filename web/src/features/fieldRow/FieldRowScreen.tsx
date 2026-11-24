import { useState, useRef, useCallback } from 'react'
import type { FieldRowProgress, FieldRowResult, ScreenFieldRow } from '../../ai/fieldRow.types'
import { FIELD_ROW_COPY } from './fieldRowCopy'
import PhotoPicker from '../capture/PhotoPicker'
import { ScanProgress } from './ScanProgress'
import { FieldRowCanvas } from './FieldRowCanvas'
import { FieldSummaryCard } from './FieldSummaryCard'
import { HelpCall } from '../../components/HelpCall'
import { Disclaimer } from '../../components/Disclaimer'
import { AlertOctagon, RotateCcw, Sprout } from 'lucide-react'

export interface FieldRowScreenProps {
  screen?: ScreenFieldRow
  lang?: 'bn' | 'en'
}

export function FieldRowScreen({ screen, lang = 'bn' }: FieldRowScreenProps) {
  const isBn = lang === 'bn'
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'scanning' | 'result' | 'error'>('idle')
  const [progress, setProgress] = useState<FieldRowProgress | null>(null)
  const [result, setResult] = useState<FieldRowResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  const handleImageReady = useCallback((img: HTMLImageElement, file: File) => {
    setSelectedImage(img)
    setSelectedFile(file)
    setStatus('idle')
    setErrorMessage(null)
    setResult(null)
  }, [])

  const handleClear = useCallback(() => {
    setSelectedImage(null)
    setSelectedFile(null)
    setStatus('idle')
    setResult(null)
    setErrorMessage(null)
    setProgress(null)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setStatus('idle')
    setProgress(null)
  }, [])

  const handleAnalyze = async () => {
    if (!selectedImage || !screen) return

    const controller = new AbortController()
    abortControllerRef.current = controller

    setStatus('scanning')
    setProgress({ stage: 'detecting', done: 0, total: 0 })
    setErrorMessage(null)

    try {
      const res = await screen(selectedImage, {
        onProgress: (p) => setProgress(p),
        signal: controller.signal,
      })
      setResult(res)
      setStatus('result')
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        setStatus('idle')
        setProgress(null)
        return
      }
      setErrorMessage(
        err?.message ||
          (isBn
            ? 'ছবিটি প্রক্রিয়াকরণ করার সময় সমস্যা হয়েছে।'
            : 'Error analyzing field row image.')
      )
      setStatus('error')
    } finally {
      abortControllerRef.current = null
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-4xl mx-auto py-2">
      {/* Header section with Bangla hint */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[#0B5D3B]">
          <Sprout className="h-6 w-6" strokeWidth={2.4} />
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0E1F16]">
            {FIELD_ROW_COPY.title[lang]}
          </h2>
        </div>
        <p className="text-[15px] sm:text-base text-[#4A5F52] leading-relaxed">
          {FIELD_ROW_COPY.hint[lang]}
        </p>
      </div>

      {/* State: Idle / Photo Uploading */}
      {status === 'idle' && (
        <div className="flex flex-col gap-5">
          <PhotoPicker
            onImageReady={handleImageReady}
            onClear={handleClear}
            onAnalyze={screen ? handleAnalyze : undefined}
            isAnalyzing={false}
            selectedFile={selectedFile}
          />
          <HelpCall lang={lang} />
          <Disclaimer lang={lang} />
        </div>
      )}

      {/* State: Scanning Progress */}
      {status === 'scanning' && (
        <div className="flex flex-col gap-5">
          <ScanProgress
            stage={progress?.stage ?? 'detecting'}
            done={progress?.done ?? 0}
            total={progress?.total ?? 0}
            lang={lang}
            onCancel={handleCancel}
          />
          <HelpCall lang={lang} />
          <Disclaimer lang={lang} />
        </div>
      )}

      {/* State: Result Screen */}
      {status === 'result' && result && selectedImage && (
        <div className="flex flex-col gap-6">
          <FieldRowCanvas
            image={selectedImage}
            result={result}
            lang={lang}
          />
          <FieldSummaryCard
            summary={result.summary}
            lang={lang}
            onRetry={handleClear}
          />
        </div>
      )}

      {/* State: Error State */}
      {status === 'error' && (
        <div className="flex flex-col gap-5">
          <div className="rounded-3xl border border-rose-200 bg-rose-50/95 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <AlertOctagon className="h-7 w-7 text-rose-600 shrink-0 mt-0.5" strokeWidth={2.4} />
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold text-rose-950">
                  {isBn ? 'বিশ্লেষণে সমস্যা হয়েছে' : 'Analysis Error'}
                </h3>
                <p className="text-[15px] text-rose-900 leading-relaxed">
                  {errorMessage}
                </p>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0B5D3B] px-5 py-2 text-sm font-bold text-white shadow-xs transition hover:bg-[#0F5132] active:scale-95"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>{isBn ? 'আবার চেষ্টা করুন' : 'Try Again'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <HelpCall lang={lang} />
          <Disclaimer lang={lang} />
        </div>
      )}
    </div>
  )
}
export default FieldRowScreen
