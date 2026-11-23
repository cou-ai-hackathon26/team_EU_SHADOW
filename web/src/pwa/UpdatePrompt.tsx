import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw } from 'lucide-react'

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
      className="fixed top-18 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-auto"
    >
      <div className="flex items-center justify-between gap-3 rounded-full border border-[#0B5D3B]/20 bg-white/95 px-4 py-2 text-[#0E1F16] shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-[15px] font-bold text-[#0B5D3B]">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E6F4ED] text-[#0B5D3B]">
            <RefreshCw className="h-4 w-4" strokeWidth={2.4} />
          </span>
          <span className="truncate">নতুন সংস্করণ প্রস্তুত</span>
        </div>
        <button
          type="button"
          onClick={handleReload}
          className="shrink-0 rounded-full bg-[#0B5D3B] px-4 py-1.5 text-[15px] font-bold text-white shadow-xs transition-colors hover:bg-[#094d31] focus:outline-none focus:ring-2 focus:ring-emerald-700/40"
        >
          নতুন সংস্করণ এসেছে — Reload
        </button>
      </div>
    </aside>
  )
}
