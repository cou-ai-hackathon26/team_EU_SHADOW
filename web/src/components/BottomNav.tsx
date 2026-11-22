import { routes, matchRoute, type RouteDef } from '../app/router'
import { useT } from '../i18n/useT'
import type { I18nKeys } from '../i18n/bn'

const navKeyMap: Record<string, I18nKeys> = {
  home: 'navHome',
  history: 'navHistory',
  'how-it-works': 'navHowItWorks',
  about: 'navAbout',
}

interface BottomNavProps {
  currentHash: string
}

function NavIcon({ id, active }: { id: string; active: boolean }) {
  const strokeClass = active ? 'stroke-leaf-800' : 'stroke-slate-500'

  switch (id) {
    case 'home':
      return (
        <svg
          className={`h-6 w-6 transition-colors ${strokeClass}`}
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    case 'history':
      return (
        <svg
          className={`h-6 w-6 transition-colors ${strokeClass}`}
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    case 'how-it-works':
      return (
        <svg
          className={`h-6 w-6 transition-colors ${strokeClass}`}
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      )
    case 'about':
      return (
        <svg
          className={`h-6 w-6 transition-colors ${strokeClass}`}
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    default:
      return null
  }
}

export default function BottomNav({ currentHash }: BottomNavProps) {
  const activeId = matchRoute(currentHash).id
  const { t } = useT()

  return (
    <nav
      aria-label="মূল নেভিগেশন"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-emerald-900/10 bg-white/95 pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-lg backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-xl items-center justify-around px-2 py-1.5">
        {routes.map((route: RouteDef) => {
          const isActive = route.id === activeId
          const href = route.hash ? route.hash : '#/'
          const key = navKeyMap[route.id]
          const label = key ? t(key) : route.label

          return (
            <a
              key={route.id}
              href={href}
              className={`flex min-h-[54px] min-w-[68px] flex-1 flex-col items-center justify-center rounded-xl px-1.5 py-1 text-center transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-emerald-100/70 font-bold text-emerald-900 shadow-2xs'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <NavIcon id={route.id} active={isActive} />
              <span className={`mt-1 text-[11px] leading-none tracking-tight ${isActive ? 'font-bold text-emerald-950' : 'font-medium'}`}>
                {label}
              </span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
