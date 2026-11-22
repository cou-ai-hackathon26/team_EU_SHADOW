import { useState } from 'react'
import {
  generateCaseSummaryCanvas,
  generateCaseSummaryBlob,
  generateCaseSummaryText,
  type CaseSummaryInput,
} from './caseSummary'

interface ShareButtonProps {
  input: CaseSummaryInput
  className?: string
}

export function ShareButton({ input, className = '' }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleShareOrDownload = async () => {
    setIsSharing(true)
    setError(null)
    try {
      const text = generateCaseSummaryText(input)
      const blob = await generateCaseSummaryBlob(input)
      const fileName = `agroleaf-case-summary-${Date.now()}.png`

      // Try navigator.share if available
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function'
      ) {
        try {
          const files = typeof File !== 'undefined' ? [new File([blob], fileName, { type: 'image/png' })] : []
          if (!navigator.canShare || files.length === 0 || navigator.canShare({ files })) {
            await navigator.share({
              title: 'AgroLeaf AI কেস সামারি',
              text,
              ...(files.length > 0 ? { files } : {}),
            })
            return
          }
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') {
            return
          }
        }
      }

      // Fallback: direct download
      const canvas = await generateCaseSummaryCanvas(input)
      const dataUrl =
        typeof canvas.toDataURL === 'function'
          ? canvas.toDataURL('image/png')
          : URL.createObjectURL(blob)

      const anchor = document.createElement('a')
      anchor.href = dataUrl
      anchor.download = fileName
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
    } catch {
      setError('শেয়ার করা যায়নি — আবার চেষ্টা করুন')
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <>
    <button
      type="button"
      onClick={handleShareOrDownload}
      disabled={isSharing}
      aria-label="কেস সামারি শেয়ার করুন"
      className={`flex items-center justify-center gap-2 rounded-xl bg-leaf-800 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-leaf-700 focus:outline-none focus:ring-2 focus:ring-leaf-800/40 disabled:opacity-50 ${className}`}
    >
      <svg
        className="h-4 w-4 shrink-0 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      <span>{isSharing ? 'প্রস্তুত হচ্ছে…' : 'শেয়ার করুন'}</span>
    </button>
    {error && (
      <p role="alert" className="mt-2 text-sm text-red-700">
        {error}
      </p>
    )}
    </>
  )
}
