import { useState } from 'react'
import type { Prediction, QualityReport } from '../../ai/types'
import { loadModel, analyze } from '../../ai/engine'
import { useT } from '../../i18n/useT'
import PhotoPicker from '../capture/PhotoPicker'
import SampleGallery from '../capture/SampleGallery'
import ResultView from './ResultView'
import { saveScanFromPrediction } from '../history/historyStore'

export default function ScanFlow() {
  const { lang } = useT()
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [analysisError, setAnalysisError] = useState<Error | null>(null)

  const handleImageReady = (image: HTMLImageElement, file: File, _report?: QualityReport) => {
    setSelectedImage(image)
    setSelectedFile(file)
    setPrediction(null)
    setAnalysisError(null)
  }

  const handleClear = () => {
    setSelectedImage(null)
    setSelectedFile(null)
    setPrediction(null)
    setAnalysisError(null)
    setIsAnalyzing(false)
  }

  const handleAnalyze = async () => {
    if (!selectedImage || isAnalyzing) {
      return
    }

    setIsAnalyzing(true)
    setAnalysisError(null)

    try {
      await loadModel()
      const result = await analyze(selectedImage)
      setPrediction(result)
      // F9: keep a small thumbnail on this device only; a failed save must not block the result
      saveScanFromPrediction(result, selectedImage).catch(() => {})
    } catch (err) {
      setAnalysisError(err instanceof Error ? err : new Error('মডেল চালাতে সমস্যা হয়েছে'))
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {prediction || analysisError ? (
        <ResultView
          prediction={prediction}
          error={analysisError}
          onReset={handleClear}
          image={selectedImage}
          imageFile={selectedFile}
          lang={lang}
        />
      ) : (
        <>
          <PhotoPicker
            onImageReady={handleImageReady}
            onClear={handleClear}
            onAnalyze={selectedImage ? handleAnalyze : undefined}
            isAnalyzing={isAnalyzing}
            selectedFile={selectedFile}
          />
          {!selectedImage && (
            <SampleGallery onImageReady={handleImageReady} />
          )}
        </>
      )}
    </div>
  )
}
