import { Search, Loader2 } from 'lucide-react'
import { useT } from '../../i18n/useT'

export interface AnalyzeButtonProps {
  onAnalyze: () => void | Promise<void>
  disabled?: boolean
  loading?: boolean
  className?: string
}

export default function AnalyzeButton({
  onAnalyze,
  disabled = false,
  loading = false,
  className = '',
}: AnalyzeButtonProps) {
  const { t } = useT()
  const isDisabled = disabled || loading

  return (
    <button
      type="button"
      onClick={onAnalyze}
      disabled={isDisabled}
      className={`flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#0B5D3B] via-[#0E7446] to-[#15803D] px-6 py-3.5 text-[17px] font-bold text-white shadow-[0_10px_25px_-5px_rgba(11,93,59,0.35)] transition-all duration-200 hover:shadow-[0_14px_30px_-5px_rgba(11,93,59,0.45)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none select-none ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin text-white" strokeWidth={2.4} />
          <span>{t('analyzingText')}</span>
        </>
      ) : (
        <>
          <Search className="h-5 w-5 text-white" strokeWidth={2.4} />
          <span>{t('analyzeBtn')}</span>
        </>
      )}
    </button>
  )
}
