import { useState, useRef, useEffect, type ChangeEvent } from 'react'
import { validateFile } from './validateFile'
import { loadImage } from './loadImage'

export interface PhotoPickerProps {
  onImageReady?: (image: HTMLImageElement, file: File) => void
  onClear?: () => void
}

export default function PhotoPicker({ onImageReady, onClear }: PhotoPickerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const currentUrlRef = useRef<string | null>(null)

  // Clean up object URL when component unmounts to prevent memory leaks
  useEffect(() => {
    return () => {
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current)
      }
    }
  }, [])

  const handleFile = async (file: File) => {
    setErrorMessage(null)

    const validation = validateFile(file)
    if (!validation.valid) {
      setErrorMessage(validation.error ?? 'অকার্যকর ফাইল ফরম্যাট')
      return
    }

    // Revoke previous object URL to avoid memory leak
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
      onImageReady?.(img, file)
    } catch {
      setErrorMessage('ছবিটি প্রসেস করা সম্ভব হয়নি। অনুগ্রহ করে অন্য ছবি নির্বাচন করুন।')
    }
  }

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
    // Reset input value so same file can be re-selected if desired
    e.target.value = ''
  }

  const handleReset = () => {
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current)
      currentUrlRef.current = null
    }
    setPreviewUrl(null)
    setErrorMessage(null)
    setFileName(null)
    onClear?.()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden file inputs with required accessible labels */}
      <input
        ref={cameraInputRef}
        type="file"
        id="camera-input"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-label="ক্যামেরা"
        onChange={onInputChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        id="gallery-input"
        accept="image/*"
        className="sr-only"
        aria-label="গ্যালারি"
        onChange={onInputChange}
      />

      {/* Error Alert Box */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-900"
        >
          <div className="flex items-start gap-2.5">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-rose-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="font-semibold">ছবি গ্রহণ করা যায়নি</p>
              <p className="mt-0.5 text-xs text-rose-800">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* When no image is selected: Choice Buttons */}
      {!previewUrl ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex min-h-[120px] flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-leaf-600/30 bg-white p-4 text-center transition-all hover:border-leaf-600 hover:bg-leaf-50 active:scale-98"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-leaf-100 text-leaf-800">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <span className="font-bold text-slate-800">ক্যামেরা দিয়ে তুলুন</span>
            <span className="text-xs text-slate-600">সরাসরি ধানপাতা স্ক্যান করুন</span>
          </button>

          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex min-h-[120px] flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-leaf-600/30 bg-white p-4 text-center transition-all hover:border-leaf-600 hover:bg-leaf-50 active:scale-98"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-leaf-100 text-leaf-800">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <span className="font-bold text-slate-800">গ্যালারি থেকে নিন</span>
            <span className="text-xs text-slate-600">সংরক্ষিত ছবি নির্বাচন করুন</span>
          </button>
        </div>
      ) : (
        /* Image Preview and Controls */
        <div className="flex flex-col gap-3 rounded-2xl border border-leaf-800/10 bg-white p-4 shadow-xs">
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-slate-100">
            <img
              src={previewUrl}
              alt="নির্বাচিত ধানপাতার ছবির প্রিভিউ"
              className="h-full w-full object-contain"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="truncate text-xs text-slate-500" title={fileName ?? undefined}>
              {fileName ?? 'ধানপাতার ছবি'}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 active:scale-98"
            >
              <svg
                className="h-3.5 w-3.5 text-slate-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              <span>অন্য ছবি</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
