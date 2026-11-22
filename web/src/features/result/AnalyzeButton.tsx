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
      className={`flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 px-6 py-3.5 text-base font-extrabold text-white shadow-md transition-all duration-200 hover:from-emerald-700 hover:to-emerald-500 hover:shadow-lg active:scale-[0.98] ring-2 ring-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none ${className}`}
    >
      {loading ? (
        <>
          <svg
            className="h-5 w-5 animate-spin text-white"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span>{t('analyzingText')}</span>
        </>
      ) : (
        <>
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>{t('analyzeBtn')}</span>
        </>
      )}
    </button>
  )
}
