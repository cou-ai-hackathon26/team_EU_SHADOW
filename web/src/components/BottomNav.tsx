import { motion } from 'framer-motion'
import { Home, History, HelpCircle, Info, CloudSun } from 'lucide-react'
import { routes, matchRoute, type RouteDef } from '../app/router'
import { useT } from '../i18n/useT'
import type { I18nKeys } from '../i18n/bn'

const navKeyMap: Record<string, I18nKeys> = {
  home: 'navHome',
  weather: 'navWeather',
  history: 'navHistory',
  'how-it-works': 'navHowItWorks',
  about: 'navAbout',
}

interface BottomNavProps {
  currentHash: string
  isInsideMobileFrame?: boolean
}

function NavIcon({ id, active }: { id: string; active: boolean }) {
  const iconProps = {
    className: `h-4 w-4 transition-transform duration-200 ${
      active ? 'text-[#0B5D3B] scale-110' : 'text-[#4A5F52]'
    }`,
    strokeWidth: active ? 2.4 : 2,
  }

  switch (id) {
    case 'home':
      return <Home {...iconProps} />
    case 'weather':
      return <CloudSun {...iconProps} />
    case 'history':
      return <History {...iconProps} />
    case 'how-it-works':
      return <HelpCircle {...iconProps} />
    case 'about':
      return <Info {...iconProps} />
    default:
      return null
  }
}

export default function BottomNav({ currentHash, isInsideMobileFrame = false }: BottomNavProps) {
  const activeId = matchRoute(currentHash).id
  const { t } = useT()

  return (
    <nav
      aria-label="মূল নেভিগেশন"
      className={
        isInsideMobileFrame
          ? 'w-full bg-white/95 py-1 backdrop-blur-md'
          : 'fixed bottom-0 left-0 right-0 z-30 border-t border-[#E3E8DC] bg-white/95 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] backdrop-blur-md lg:hidden'
      }
    >
      <div className="mx-auto flex max-w-xl items-center justify-around px-1.5">
        {routes
          .filter((route: RouteDef) => route.id in navKeyMap)
          .map((route: RouteDef) => {
            const isActive = route.id === activeId
            const href = route.hash ? route.hash : '#/'
            const labelKey = navKeyMap[route.id]
            const label = labelKey ? t(labelKey) : route.label

            return (
              <a
                key={route.id}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex min-h-[38px] sm:min-h-[42px] flex-1 flex-col items-center justify-center gap-0.5 px-0.5 sm:px-1 py-0.5 text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/50 rounded-xl ${
                  isActive ? 'text-[#0B5D3B] font-bold' : 'text-[#4A5F52] font-semibold hover:text-[#0B5D3B]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId={isInsideMobileFrame ? 'active-nav-pill-mobile' : 'active-nav-pill'}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-[#E6F4ED] -z-10"
                  />
                )}
                <NavIcon id={route.id} active={isActive} />
                <span className="text-[10px] sm:text-[11.5px] leading-tight select-none truncate max-w-[64px] sm:max-w-none">
                  {label}
                </span>
              </a>
            )
          })}
      </div>
    </nav>
  )
}
