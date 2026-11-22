import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) {
    return null
  }

  const handleReload = () => {
    void updateServiceWorker(true)
  }

  return (
    <aside
      aria-label="অ্যাপ আপডেট সূচনা"
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-auto"
    >
      <div className="flex items-center justify-between gap-3 rounded-full border border-emerald-900/15 bg-white/95 px-4 py-2 text-slate-800 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
          </span>
          <span className="truncate">নতুন সংস্করণ প্রস্তুত</span>
        </div>
        <button
          type="button"
          onClick={handleReload}
          className="shrink-0 rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/40"
        >
          নতুন সংস্করণ এসেছে — Reload
        </button>
      </div>
    </aside>
  )
}
