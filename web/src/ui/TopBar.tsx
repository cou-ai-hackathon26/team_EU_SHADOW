import { Sprout, PhoneCall } from 'lucide-react'
import { routes, matchRoute, type RouteDef } from '../app/router'
import { LanguageToggle, useT } from '../i18n/useT'
import type { I18nKeys } from '../i18n/bn'

const navKeyMap: Record<string, I18nKeys> = {
  home: 'navHome',
  history: 'navHistory',
  'how-it-works': 'navHowItWorks',
  about: 'navAbout',
}

export interface TopBarProps {
  currentHash: string
}

export function TopBar({ currentHash }: TopBarProps) {
  const { t } = useT()
  const activeId = matchRoute(currentHash).id

  return (
    <header className="sticky top-0 z-30 border-b border-[#E3E8DC] bg-white/95 px-4 py-3 shadow-[0_2px_12px_-4px_rgba(11,93,59,0.06)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-xl lg:max-w-6xl items-center justify-between gap-3">
        {/* Brand identity */}
        <a href="#/" className="group flex items-center gap-3 select-none">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B5D3B] to-[#15803D] text-white shadow-md transition-transform duration-200 group-hover:scale-105">
            <Sprout className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <div>
            <span className="block text-xl font-extrabold tracking-tight text-[#0B5D3B] leading-none">
              AgroLeaf AI
            </span>
            <span className="block text-[15px] font-medium text-[#4A5F52]">
              {t('appSubtitle')}
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links (hidden on mobile, visible on desktop >= 1024px) */}
        <nav aria-label="ডেস্কটপ নেভিগেশন" className="hidden lg:flex items-center gap-1.5 bg-[#F0F8F4] p-1 rounded-2xl border border-[#0B5D3B]/10">
          {routes.map((route: RouteDef) => {
            const isActive = route.id === activeId
            const href = route.hash ? route.hash : '#/'
            const labelKey = navKeyMap[route.id]
            const label = labelKey ? t(labelKey) : route.label

            return (
              <a
                key={route.id}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`rounded-xl px-4 py-2 text-[15px] font-bold transition-all ${
                  isActive
                    ? 'bg-[#0B5D3B] text-white shadow-sm'
                    : 'text-[#4A5F52] hover:text-[#0B5D3B] hover:bg-white/80'
                }`}
              >
                {label}
              </a>
            )
          })}
        </nav>

        {/* Right tools: Language Toggle & Helpline */}
        <div className="flex items-center gap-2.5">
          <LanguageToggle />

          <a
            href="tel:16123"
            aria-label={t('krishiCallCenter')}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border-2 border-[#F59E0B]/40 bg-[#FEF3C7] px-3.5 py-2 text-[15px] font-extrabold text-[#B45309] shadow-2xs transition-all hover:bg-[#FDE68A] hover:border-[#F59E0B]/70 active:scale-95"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#F59E0B] text-white shadow-2xs">
              <PhoneCall className="h-4 w-4" strokeWidth={2.4} />
            </span>
            <span className="font-bold">{t('callCenterShort')}</span>
          </a>
        </div>
      </div>
    </header>
  )
}
