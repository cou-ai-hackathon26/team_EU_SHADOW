import { useEffect, useRef, useState } from 'react'
import type { Prediction } from '../../ai/types'
import { heatmapToRGBA } from './heatmapColor'

export interface HeatmapOverlayProps {
  prediction?: Prediction | null
  imageSrc?: string
  alt?: string
  className?: string
}

export function HeatmapOverlay({
  prediction,
  imageSrc,
  alt = 'ধানপাতার ছবি',
  className = '',
}: HeatmapOverlayProps) {
  const [showHeatmap, setShowHeatmap] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const hasHeatmap = Boolean(
    prediction?.heatmap && prediction.heatmap.length > 0,
  )

  useEffect(() => {
    if (!showHeatmap || !hasHeatmap || !prediction?.heatmap || !canvasRef.current) {
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size =
      prediction.heatmapSize || Math.round(Math.sqrt(prediction.heatmap.length))
    canvas.width = size
    canvas.height = size

    const rgba = heatmapToRGBA(prediction.heatmap)
    try {
      if (typeof ctx.createImageData === 'function') {
        const imgData = ctx.createImageData(size, size)
        imgData.data.set(rgba)
        ctx.putImageData(imgData, 0, 0)
      }
    } catch {
      // In non-DOM/test environments, fallback gracefully
    }
  }, [showHeatmap, hasHeatmap, prediction])

  if (!hasHeatmap) {
    return null
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* Image container with relative canvas overlay */}
      <div className="relative inline-block overflow-hidden rounded-2xl border border-leaf-800/10 bg-slate-100 shadow-sm">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={alt}
            className="block h-auto max-w-full object-contain"
          />
        ) : (
          <div className="flex h-56 w-72 items-center justify-center bg-slate-200 text-sm text-slate-500">
            {alt}
          </div>
        )}

        {showHeatmap && (
          <canvas
            ref={canvasRef}
            aria-label="মডেলের সিদ্ধান্ত অঞ্চলের হিটম্যাপ"
            className="absolute inset-0 h-full w-full object-fill opacity-75 mix-blend-multiply transition-opacity duration-300"
          />
        )}
      </div>

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setShowHeatmap((prev) => !prev)}
        aria-pressed={showHeatmap}
        className="flex items-center gap-2 rounded-xl border border-leaf-800/20 bg-white px-4 py-2 text-sm font-medium text-leaf-800 shadow-2xs transition-colors hover:bg-leaf-50 focus:outline-none focus:ring-2 focus:ring-leaf-800/40"
      >
        <svg
          className="h-4 w-4 text-leaf-800"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <span>
          {showHeatmap ? 'হিটম্যাপ লুকান' : 'কেন এই উত্তর? (হিটম্যাপ দেখুন)'}
        </span>
      </button>
    </div>
  )
}
