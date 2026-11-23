import { useState, useRef, useEffect, useCallback, type ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { Camera, ImagePlus, Focus, Sun, Volume2, RotateCcw, AlertCircle, Sparkles } from 'lucide-react'
import { validateFile } from './validateFile'
import { loadImage } from './loadImage'
import { assessQuality } from '../quality/quality'
import QualityHint from '../quality/QualityHint'
import AnalyzeButton from '../result/AnalyzeButton'
import type { QualityReport } from '../../ai/types'
import { useT } from '../../i18n/useT'

export interface PhotoPickerProps {
  onImageReady?: (image: HTMLImageElement, file: File, report?: QualityReport) => void
  onClear?: () => void
  onAnalyze?: () => void
  isAnalyzing?: boolean
  selectedFile?: File | null
}

const ROTATING_TIPS = ['analyzeTip1', 'analyzeTip2', 'analyzeTip3'] as const

export default function PhotoPicker({
  onImageReady,
  onClear,
  onAnalyze,
  isAnalyzing = false,
  selectedFile,
}: PhotoPickerProps) {
  const { t } = useT()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null)
  const [tipIndex, setTipIndex] = useState(0)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const currentUrlRef = useRef<string | null>(null)
  const currentFileRef = useRef<File | null>(null)
  const requestIdRef = useRef(0)

  // Rotate tips during analysis
  useEffect(() => {
    if (!isAnalyzing) return
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % ROTATING_TIPS.length)
    }, 2200)
    return () => clearInterval(timer)
  }, [isAnalyzing])

  // Clean up object URL when unmounting
  useEffect(() => {
    return () => {
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current)
      }
    }
  }, [])

  const handleFile = useCallback(async (file: File) => {
    currentFileRef.current = file
    const id = ++requestIdRef.current
    setErrorMessage(null)

    const validation = validateFile(file)
    if (!validation.valid) {
      setErrorMessage(validation.error ?? t('errInvalidFormat'))
      return
    }

    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current)
      currentUrlRef.current = null
    }

    const objectUrl = URL.createObjectURL(file)
    currentUrlRef.current = objectUrl
    setPreviewUrl(objectUrl)
    setFileName(file.name)

    try {
      const img = await loadImage(file)
      if (id !== requestIdRef.current) {
        return
      }
      const report = assessQuality(img)
      setQualityReport(report)
      if (report) {
        onImageReady?.(img, file, report)
      } else {
        onImageReady?.(img, file)
      }
    } catch {
      if (id !== requestIdRef.current) {
        return
      }
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current)
        currentUrlRef.current = null
      }
      setPreviewUrl(null)
      setFileName(null)
      setQualityReport(null)
      setErrorMessage(t('errLoadFailed'))
    }
  }, [onImageReady, t])

  useEffect(() => {
    if (selectedFile && selectedFile !== currentFileRef.current) {
      void handleFile(selectedFile)
    } else if (!selectedFile && currentFileRef.current) {
      currentFileRef.current = null
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current)
        currentUrlRef.current = null
      }
      setPreviewUrl(null)
      setErrorMessage(null)
      setFileName(null)
      setQualityReport(null)
    }
  }, [selectedFile, handleFile])

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
    e.target.value = ''
  }

  const handleReset = () => {
    currentFileRef.current = null
    requestIdRef.current++
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current)
      currentUrlRef.current = null
    }
    setPreviewUrl(null)
    setErrorMessage(null)
    setFileName(null)
    setQualityReport(null)
    onClear?.()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden file inputs with accessible labels */}
      <input
        ref={cameraInputRef}
        type="file"
        id="camera-input"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-label={t('cameraInputAria')}
        onChange={onInputChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        id="gallery-input"
        accept="image/*"
        className="sr-only"
        aria-label={t('galleryInputAria')}
        onChange={onInputChange}
      />

      {/* Error Alert Box */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/95 p-4 text-[15px] text-rose-950 shadow-xs"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" strokeWidth={2.4} />
          <div>
            <p className="font-bold text-rose-950">{t('photoRejectedTitle')}</p>
            <p className="mt-0.5 text-[15px] text-rose-800">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 1. When NO image is selected: Symmetrical Side-by-Side Action Cards + Compact Guide */}
      {!previewUrl ? (
        <div className="flex flex-col gap-2 sm:gap-2.5 w-full max-w-3xl mx-auto">
          {/* Centered, Symmetrical 2-Column Grid (Compact py-3.5/py-4 Sleek Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full">
            {/* Left Card: Rich Deep Emerald Gradient Primary Scan Card */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => cameraInputRef.current?.click()}
              className="group relative flex flex-col items-center justify-center text-center py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0F5132] via-[#0E7446] to-[#15803D] text-white border-2 border-emerald-400/40 shadow-[0_10px_24px_-4px_rgba(15,81,50,0.4)] transition-all hover:border-emerald-300 hover:shadow-[0_14px_28px_-4px_rgba(15,81,50,0.5)] hover:scale-[1.01] focus:outline-none focus-visible:ring-3 focus-visible:ring-emerald-700/60 cursor-pointer min-h-[105px] sm:min-h-[112px]"
            >
              <div className="relative mb-1.5 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner backdrop-blur-xs transition-transform duration-200 group-hover:scale-110">
                <Camera className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.2} />
              </div>
              <span className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                {t('cameraBtn')}
              </span>
              <span className="text-[11.5px] sm:text-xs font-medium text-emerald-100/95 mt-0.5">
                {t('cameraBtnDesc')}
              </span>
            </motion.button>

            {/* Right Card: Frosted Mint/White Card with Emerald Border */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => galleryInputRef.current?.click()}
              className="group relative flex flex-col items-center justify-center text-center py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl sm:rounded-3xl border-2 border-emerald-300/80 bg-white/92 backdrop-blur-sm text-slate-900 shadow-md transition-all hover:border-emerald-500 hover:shadow-lg hover:scale-[1.01] focus:outline-none focus-visible:ring-3 focus-visible:ring-emerald-700/50 cursor-pointer min-h-[105px] sm:min-h-[112px]"
            >
              <div className="relative mb-1.5 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-emerald-100/90 text-[#0F5132] border border-emerald-300/50 shadow-inner transition-transform duration-200 group-hover:scale-110">
                <ImagePlus className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.2} />
              </div>
              <span className="text-base sm:text-lg font-black tracking-tight text-[#064E3B] leading-tight">
                {t('galleryBtn')}
              </span>
              <span className="text-[11.5px] sm:text-xs font-medium text-[#15803D] mt-0.5">
                {t('galleryBtnDesc')}
              </span>
            </motion.button>
          </div>

          {/* Slim 3-Step Inline Micro-Guide */}
          <div className="flex items-center justify-between gap-2 rounded-xl sm:rounded-2xl border border-emerald-300/80 bg-white/92 px-3.5 py-1.5 shadow-md backdrop-blur-sm">
            <div className="flex flex-1 items-center justify-center gap-1.5 text-center text-[#0E1F16]">
              <Focus className="h-3.5 w-3.5 text-[#0B5D3B] shrink-0" strokeWidth={2.4} />
              <span className="text-xs sm:text-[13px] font-bold">{t('guideStep1')}</span>
            </div>
            <div className="h-3.5 w-px bg-[#E3E8DC]" />
            <div className="flex flex-1 items-center justify-center gap-1.5 text-center text-[#0E1F16]">
              <Sun className="h-3.5 w-3.5 text-[#B45309] shrink-0" strokeWidth={2.4} />
              <span className="text-xs sm:text-[13px] font-bold">{t('guideStep2')}</span>
            </div>
            <div className="h-3.5 w-px bg-[#E3E8DC]" />
            <div className="flex flex-1 items-center justify-center gap-1.5 text-center text-[#0E1F16]">
              <Volume2 className="h-3.5 w-3.5 text-[#0B5D3B] shrink-0" strokeWidth={2.4} />
              <span className="text-xs sm:text-[13px] font-bold">{t('guideStep3')}</span>
            </div>
          </div>
        </div>
      ) : (
        /* 2. When Image is Selected: Preview Card with Rounded Framing Guide & Scanning Mode */
        <div className="flex flex-col gap-4 rounded-3xl border border-[#E3E8DC] bg-white p-4 sm:p-5 shadow-[0_8px_24px_-6px_rgba(14,31,22,0.06)] w-full max-w-2xl mx-auto">
          {/* Framing Guide Overlay on Image */}
          <div className="relative aspect-4/3 max-h-[320px] sm:max-h-[380px] w-full overflow-hidden rounded-2xl bg-slate-900 border border-[#E3E8DC]">
            <img
              src={previewUrl}
              alt={t('previewAlt')}
              className="h-full w-full object-contain"
            />

            {/* Corner Brackets Framing Guide Overlay */}
            <div className="pointer-events-none absolute inset-4 border-2 border-white/40 rounded-2xl">
              <span className="absolute -top-1 -left-1 h-5 w-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <span className="absolute -top-1 -right-1 h-5 w-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <span className="absolute -bottom-1 -left-1 h-5 w-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <span className="absolute -bottom-1 -right-1 h-5 w-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
            </div>

            {/* Scanning Laser Line Effect (Active only during analysis) */}
            {isAnalyzing && (
              <motion.div
                initial={{ top: '5%' }}
                animate={{ top: ['5%', '92%', '5%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute left-2 right-2 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_3px_rgba(34,197,94,0.8)]"
              />
            )}
          </div>

          {/* Analysis in Progress Card (Rotating Bangla tips) */}
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#F0F8F4] border border-[#0B5D3B]/20 text-center">
              <div className="flex items-center gap-2 text-[#0B5D3B] font-bold text-[16px] mb-1">
                <Sparkles className="h-5 w-5 animate-spin" />
                <span>{t('aiAnalyzing')}</span>
              </div>
              <motion.p
                key={tipIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[15px] font-medium text-[#4A5F52]"
              >
                {t(ROTATING_TIPS[tipIndex])}
              </motion.p>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-1">
              <span className="truncate text-[15px] font-medium text-[#4A5F52]" title={fileName ?? undefined}>
                {fileName ?? t('fallbackLeafPhoto')}
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-[15px] font-bold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 active:scale-95"
              >
                <RotateCcw className="h-4 w-4 text-[#4A5F52]" strokeWidth={2.2} />
                <span>{t('chooseAnotherPhoto')}</span>
              </button>
            </div>
          )}

          {/* Quality Hint and Analyze CTA */}
          <QualityHint
            report={qualityReport}
            onAnalyze={onAnalyze}
            isAnalyzing={isAnalyzing}
          />
          {!qualityReport && onAnalyze && (
            <AnalyzeButton
              onAnalyze={onAnalyze}
              loading={isAnalyzing}
            />
          )}
        </div>
      )}
    </div>
  )
}
