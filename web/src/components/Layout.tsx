import { useState, type ReactNode } from 'react'
import BottomNav from './BottomNav'
import { LanguageToggle, useT } from '../i18n/useT'
import { Disclaimer } from './Disclaimer'
import { useScanState } from '../app/scanStateContext'
import { PhoneFrameProvider } from '../app/viewportFrame'
import {
  Sprout,
  PhoneCall,
  Monitor,
  Smartphone,
  Menu,
  X,
  Home,
  History,
  CloudSun,
  HelpCircle,
  Info,
} from 'lucide-react'

export type ViewportMode = 'desktop' | 'mobile'

interface LayoutProps {
  children?: ReactNode
  currentHash: string
}

export default function Layout({ children, currentHash }: LayoutProps) {
  const { lang, t } = useT()
  const isBn = lang === 'bn'
  const { isScanActive, isLandingView } = useScanState()

  const [viewportMode, setViewportMode] = useState<ViewportMode>(() => {
    try {
      const saved = localStorage.getItem('agroleaf_viewport_mode')
      if (saved === 'mobile' || saved === 'desktop') return saved
    } catch {
      // ignore
    }
    return 'desktop'
  })

  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSetViewport = (mode: ViewportMode) => {
    setViewportMode(mode)
    setIsMenuOpen(false)
    try {
      localStorage.setItem('agroleaf_viewport_mode', mode)
    } catch {
      // ignore
    }
  }

  const isMobilePreview = viewportMode === 'mobile'
  const isHome = !currentHash || currentHash === '#' || currentHash === '#/'
  // Compact single-screen fit applies ONLY on initial idle Home with NO photo/result active
  const isCompactHome = isHome && !isScanActive && !isMobilePreview
  // Desktop home landing: one continuous dark emerald canvas from navbar to disclaimer.
  const isDarkLanding = isHome && isLandingView && !isMobilePreview
  const canvas = isDarkLanding
    ? 'lg:from-[#072A19] lg:via-[#0B3B24] lg:to-[#0F4C2E] lg:text-white'
    : ''

  return (
    <div className={`flex min-h-screen w-full flex-col bg-gradient-to-br from-[#A7F3D0] via-[#BBF7D0] to-[#86EFAC] text-[#0E1F16] antialiased font-sans ${canvas}`}>
      {/* 1. Desktop Top Navbar: Sleek h-12 (48px) Ultra-Modern Emerald Bar */}
      <header
        className={`sticky top-0 z-40 h-12 shrink-0 border-b border-[#0B5D3B]/40 bg-[#0F5132]/95 px-4 lg:px-6 shadow-[0_4px_20px_-4px_rgba(15,81,50,0.3)] backdrop-blur-md ${
          isMobilePreview ? 'lg:hidden' : ''
        }`}
      >
        <div className="mx-auto flex h-full w-full max-w-xl items-center justify-between lg:max-w-none lg:px-2">
          {/* Left: Brand Logo & Title with Subtitle */}
          <a href="#/" className="flex items-center gap-2 select-none">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-emerald-300 border border-white/20 shadow-xs">
              <Sprout className="h-3.5 w-3.5" strokeWidth={2.4} />
            </div>
            <div>
              <span className="block text-sm sm:text-base font-black tracking-tight text-white leading-none">
                AgroLeaf AI
              </span>
              <span className="block text-[10.5px] sm:text-[11px] font-medium text-emerald-200/90 leading-tight">
                {t('appSubtitle')}
              </span>
            </div>
          </a>

          {/* Right Side: Exact Sequence (1. Lang Toggle -> 2. View Switcher -> 3. Menu Button at Far-Right) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* 1. Language Toggle (বাং / EN) — Sleek compact h-7 micro-pill */}
            <LanguageToggle />

            {/* 2. Compact Viewport Switcher (💻 Web / 📱 Mobile) — Sleek compact h-7 micro-pill */}
            <div
              className="hidden lg:flex items-center gap-0.5 rounded-full border border-white/25 bg-white/10 p-0.5 text-[11px] h-7 shadow-2xs backdrop-blur-xs"
              role="group"
              aria-label={isBn ? 'ভিউ মোড পরিবর্তন' : 'Viewport Switcher'}
            >
              <button
                type="button"
                onClick={() => handleSetViewport('desktop')}
                aria-pressed={!isMobilePreview}
                className={`flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-bold transition-all ${
                  !isMobilePreview
                    ? 'bg-white text-[#0F5132] font-black shadow-xs'
                    : 'text-emerald-100/90 hover:text-white'
                }`}
                title={t('viewModeWeb')}
              >
                <Monitor className="h-3 w-3" />
                <span>Web</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetViewport('mobile')}
                aria-pressed={isMobilePreview}
                className={`flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-bold transition-all ${
                  isMobilePreview
                    ? 'bg-white text-[#0F5132] font-black shadow-xs'
                    : 'text-emerald-100/90 hover:text-white'
                }`}
                title={t('viewModeMobile')}
              >
                <Smartphone className="h-3 w-3" />
                <span>Mobile</span>
              </button>
            </div>

            {/* 3. Feature Menu Button — Sleek compact h-7 micro-pill at far-right corner */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded={isMenuOpen}
                aria-label={t('menuBtn')}
                className="inline-flex h-7 items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 text-[11px] font-bold text-white shadow-2xs backdrop-blur-xs hover:bg-white/20 hover:border-white/30 transition active:scale-95 cursor-pointer"
              >
                {isMenuOpen ? <X className="h-3 w-3 text-emerald-300" /> : <Menu className="h-3 w-3 text-emerald-300" />}
                <span>{t('menuBtn')}</span>
              </button>

              {/* Feature Menu Dropdown */}
              {isMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 rounded-2xl border border-emerald-900/15 bg-white p-2.5 shadow-2xl ring-1 ring-black/5 z-50 text-slate-900 animate-in fade-in slide-in-from-top-2"
                >
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      {t('menuTitle')}
                    </span>
                  </div>

                  <a
                    href="#/"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                  >
                    <Home className="h-4 w-4 text-emerald-700" />
                    <span>{t('menuHomeScan')}</span>
                  </a>

                  <a
                    href="#/history"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                  >
                    <History className="h-4 w-4 text-emerald-700" />
                    <span>{t('menuHistory')}</span>
                  </a>

                  <a
                    href="#/weather"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                  >
                    <CloudSun className="h-4 w-4 text-emerald-700" />
                    <span>{t('menuWeather')}</span>
                  </a>

                  <a
                    href="#/how-it-works"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                  >
                    <HelpCircle className="h-4 w-4 text-emerald-700" />
                    <span>{t('menuHowItWorks')}</span>
                  </a>

                  <a
                    href="#/about"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                  >
                    <Info className="h-4 w-4 text-emerald-700" />
                    <span>{t('menuAbout')}</span>
                  </a>

                  <div className="border-t border-slate-100 my-1 pt-1">
                    <a
                      href="tel:16123"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-950 hover:bg-amber-100 transition-colors"
                    >
                      <PhoneCall className="h-4 w-4 text-amber-700" />
                      <span>{t('menuHelpline')}</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Mobile Preview Mode Frame on Laptop */}
      {isMobilePreview ? (
        <div className="hidden lg:flex flex-col items-center justify-center min-h-[calc(100vh-48px)] py-4 relative">
          {/* Floating Exit Button outside phone */}
          <button
            type="button"
            onClick={() => handleSetViewport('desktop')}
            className="fixed top-3 right-6 z-50 flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-bold shadow-2xl border border-white/20 hover:bg-black transition active:scale-95 cursor-pointer"
          >
            <Monitor className="h-3.5 w-3.5 text-emerald-400" />
            <span>{t('backToWebView')}</span>
          </button>

          {/* Centered Mobile Phone Frame */}
          <div className="mobile-preview-frame h-[680px] w-[375px] my-auto flex flex-col overflow-hidden rounded-[36px] border-[6px] border-slate-900 shadow-2xl bg-[#F8FAF8] relative">
            {/* Phone Notch */}
            <div className="shrink-0 bg-[#F8FAF8] pt-2 pb-1 text-center">
              <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto flex items-center justify-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-700" />
                <div className="w-8 h-1 rounded-full bg-slate-800" />
              </div>
            </div>

            {/* Slim Mobile Top Bar inside Frame — Sleek h-12 */}
            <div className="shrink-0 border-b border-[#0B5D3B]/40 bg-[#0F5132]/95 px-3 py-1.5 flex items-center justify-between shadow-2xs backdrop-blur-md h-12">
              <a href="#/" className="flex items-center gap-2 select-none whitespace-nowrap">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/15 text-emerald-300 border border-white/20 shadow-xs">
                  <Sprout className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-black text-white whitespace-nowrap">
                  AgroLeaf AI
                </span>
              </a>

              <div className="flex items-center gap-1.5 shrink-0">
                <LanguageToggle />
                <a
                  href="tel:16123"
                  aria-label={t('krishiCallCenter')}
                  className="inline-flex h-7 items-center gap-1 rounded-full bg-amber-400 text-amber-950 px-2 text-[11px] font-bold border border-amber-300 shadow-2xs hover:bg-amber-300 transition active:scale-95"
                >
                  <PhoneCall className="h-3 w-3 text-amber-900" />
                  <span>{t('callCenterShort')}</span>
                </a>
              </div>
            </div>

            {/* Phone Frame Content Body (Scrollable inside phone always) */}
            <div className="flex-1 overflow-y-auto p-3 pb-6 w-full scrollbar-thin">
              <main className="mx-auto flex w-full max-w-xl flex-1 flex-col">
                <PhoneFrameProvider value={true}>{children}</PhoneFrameProvider>
                <Disclaimer lang={lang} compact={true} className="mt-3" />
              </main>
            </div>

            {/* Mobile Bottom Navigation pinned at bottom of Phone Frame */}
            <div className="shrink-0 bg-white/95 border-t border-[#0B5D3B]/15 py-0.5 shadow-md">
              <BottomNav currentHash={currentHash} isInsideMobileFrame={true} />
            </div>
          </div>
        </div>
      ) : null}

      {/* 3. Standard View: Full Desktop View or Native Mobile View (< 1024px) */}
      <div className={isMobilePreview ? 'lg:hidden flex-1 flex flex-col' : 'flex-1 flex flex-col'}>
        <main
          className={`mx-auto flex w-full max-w-xl lg:max-w-6xl flex-1 flex-col ${
            isCompactHome
              ? 'justify-start py-4'
              : 'justify-start py-4 sm:py-6'
          } px-4 pb-20 lg:pb-6`}
        >
          {children}
          <Disclaimer
            lang={lang}
            compact={isCompactHome}
            darkOnDesktop={isDarkLanding}
            className={isCompactHome ? 'mt-2 lg:mt-6' : 'mt-6'}
          />
        </main>

        {/* Global BottomNav (Fixed at bottom on standard views) */}
        <BottomNav currentHash={currentHash} isInsideMobileFrame={false} />
      </div>
    </div>
  )
}
