import type { ReactNode } from 'react'
import BottomNav from './BottomNav'
import { LanguageToggle, useT } from '../i18n/useT'
import { Disclaimer } from './Disclaimer'

interface LayoutProps {
  children?: ReactNode
  currentHash: string
}

export default function Layout({ children, currentHash }: LayoutProps) {
  const { lang, t } = useT()
  return (
    <div className="flex min-h-screen w-full flex-col bg-leaf-50 text-slate-900 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-leaf-800/10 bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-leaf-800 text-white shadow-xs">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
            <div>
              <span className="block text-lg font-bold leading-tight text-leaf-800">
                AgroLeaf AI
              </span>
              <span className="block text-xs text-slate-600">
                {t('appSubtitle')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <a
              href="tel:16123"
              aria-label={t('krishiCallCenter')}
              className="flex items-center gap-1.5 rounded-full border border-leaf-800/20 bg-leaf-50 px-3 py-1 text-xs font-semibold text-leaf-800 transition-colors hover:bg-leaf-100"
            >
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
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>{t('callCenterShort')}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-4 pb-28">
        {children}

        {/* Screening Safety Disclaimer (F7) */}
        <Disclaimer lang={lang} className="mt-8" />
      </main>

      {/* Bottom Navigation */}
      <BottomNav currentHash={currentHash} />
    </div>
  )
}
