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
  const isDisabled = disabled || loading

  return (
    <button
      type="button"
      onClick={onAnalyze}
      disabled={isDisabled}
      className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-leaf-800 px-5 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-leaf-700 active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
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
          <span>বিশ্লেষণ চলছে...</span>
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
          <span>রোগ শনাক্ত করুন (Analyze)</span>
        </>
      )}
    </button>
  )
}
