import type { QualityReport } from '../../ai/types'
import { loadModel, analyze } from '../../ai/engine'
import { useT } from '../../i18n/useT'
import { scanSession, useScanSession } from '../../app/scanSession'
import PhotoPicker from '../capture/PhotoPicker'
import SampleGallery from '../capture/SampleGallery'
import ResultView from './ResultView'
import { saveScanFromPrediction } from '../history/historyStore'

/**
 * Scanner workspace → result. All state lives in the shared scan session, so the Web view and the
 * Mobile preview show the same step, and switching between them never loses the photo or result.
 */
export default function ScanFlow() {
  const { lang } = useT()
  const { image, file, prediction, error, isAnalyzing, notice } = useScanSession()

  const handleImageReady = (img: HTMLImageElement, f: File, _report?: QualityReport) => {
    scanSession.setImage(img, f)
  }

  const handleClear = () => scanSession.clearPhoto()

  const handleAnalyze = async () => {
    const current = scanSession.get()
    if (!current.image || current.isAnalyzing) return
    const img = current.image

    scanSession.setAnalyzing(true)
    try {
      await loadModel()
      const result = await analyze(img)
      scanSession.setResult(result, null)
      // F9: keep a small thumbnail on this device only; a failed save must not block the result
      saveScanFromPrediction(result, img).catch(() => {})
    } catch (err) {
      scanSession.setResult(null, err instanceof Error ? err : new Error('মডেল চালাতে সমস্যা হয়েছে'))
    }
  }

  return (
    <div className="w-full">
      {prediction || error ? (
        <ResultView
          prediction={prediction}
          error={error}
          onReset={handleClear}
          image={image}
          imageFile={file}
          lang={lang}
        />
      ) : (
        <div className="flex flex-col gap-3 sm:gap-4 lg:gap-4.5 w-full">
          {notice && (
            <p
              role="status"
              className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
            >
              {notice}
            </p>
          )}
          {/* Top Hero Scan Zone: Primary Camera & Gallery Upload */}
          <div className="w-full">
            <PhotoPicker
              onImageReady={handleImageReady}
              onClear={handleClear}
              onAnalyze={image ? handleAnalyze : undefined}
              isAnalyzing={isAnalyzing}
              selectedFile={file}
            />
          </div>

          {/* Sample Leaf Gallery: Full width below hero */}
          {!image && (
            <div className="w-full">
              <SampleGallery onImageReady={handleImageReady} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
