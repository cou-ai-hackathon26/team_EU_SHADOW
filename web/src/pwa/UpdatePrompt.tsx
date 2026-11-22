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
      className="sticky top-14 z-40 mx-auto w-full max-w-xl px-4 py-2"
    >
      <div className="flex items-center justify-between gap-3 rounded-xl border border-leaf-800/20 bg-leaf-50 p-3 text-leaf-800 shadow-md">
        <div className="flex items-center gap-2 text-sm font-medium">
          <svg
            className="h-5 w-5 shrink-0 text-leaf-800"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
          <span>অ্যাপ্লিকেশনের নতুন সংস্করণ উপলব্ধ আছে।</span>
        </div>
        <button
          type="button"
          onClick={handleReload}
          className="shrink-0 rounded-lg bg-leaf-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-leaf-700 focus:outline-none focus:ring-2 focus:ring-leaf-800/40"
        >
          নতুন সংস্করণ এসেছে — Reload
        </button>
      </div>
    </aside>
  )
}
