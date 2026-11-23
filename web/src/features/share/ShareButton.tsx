import { useState } from 'react'
import { Share2, Loader2 } from 'lucide-react'
import { useT } from '../../i18n/useT'
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
  const { lang } = useT()
  const isBn = lang === 'bn'
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
              title: isBn ? 'AgroLeaf AI কেস সামারি' : 'AgroLeaf AI case summary',
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
      setError(isBn ? 'শেয়ার করা যায়নি — আবার চেষ্টা করুন' : 'Could not share — please try again')
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
        aria-label={isBn ? 'কেস সামারি শেয়ার করুন' : 'Share the case summary'}
        className={`flex min-h-[56px] items-center justify-center gap-2.5 rounded-2xl border-2 border-[#0B5D3B]/20 bg-white px-6 py-3.5 text-[16px] font-bold text-[#0E1F16] shadow-sm transition-all hover:bg-[#E6F4ED]/50 hover:border-[#0B5D3B]/40 active:scale-95 focus:outline-none focus-visible:ring-3 focus-visible:ring-emerald-700/50 disabled:opacity-50 select-none ${className}`}
      >
        {isSharing ? (
          <Loader2 className="h-5 w-5 animate-spin text-[#0B5D3B]" />
        ) : (
          <Share2 className="h-5 w-5 text-[#0B5D3B]" strokeWidth={2.2} />
        )}
        <span>{isSharing ? (isBn ? 'প্রস্তুত হচ্ছে…' : 'Preparing…') : isBn ? 'শেয়ার করুন' : 'Share'}</span>
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-700">
          {error}
        </p>
      )}
    </>
  )
}
