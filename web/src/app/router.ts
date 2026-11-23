import { createElement, type ComponentType } from 'react'
import { scanSession, useScanSession } from './scanSession'
import { HomeLanding } from '../features/home/HomeLanding'
import { Info, ShieldCheck, Sprout } from 'lucide-react'
import ScanFlow from '../features/result/ScanFlow'
import AccuracyScreen from '../features/about/AccuracyScreen'
import HistoryScreen from '../features/history/HistoryScreen'
import WeatherScreen from '../features/weather/WeatherScreen'
import { useT } from '../i18n/useT'
import { useScanState } from './scanStateContext'
import { Card } from '../ui/Card'

export interface RouteDef {
  id: string
  hash: string
  label: string
  title: string
  component: ComponentType
  aliases?: string[]
}

export function HomeScreen() {
  const { t } = useT()
  const { isScanActive } = useScanState()
  // Shared across Web view and Mobile preview, and mirrored in the URL (#/scan/rice).
  const { crop } = useScanSession()
  const showScanner = crop !== null

  if (!showScanner) {
    return createElement(
      'div',
      { className: 'flex flex-col gap-3 sm:gap-4 w-full' },
      createElement('h1', { className: 'sr-only' }, 'AgroLeaf AI'),
      createElement(HomeLanding, { onStartRice: () => scanSession.openCrop('rice') })
    )
  }

  return createElement(
    'div',
    { className: 'flex flex-col gap-3 sm:gap-4 w-full' },
    createElement('h1', { className: 'sr-only' }, 'AgroLeaf AI'),
    // Two-level back: with a photo or result on screen, the main Back clears it and stays in this
    // crop's camera & gallery workspace; "ফসল নির্বাচন করুন" (or the logo) goes all the way Home.
    isScanActive
      ? createElement(
          'div',
          { className: 'flex flex-wrap items-center gap-2' },
          createElement(
            'button',
            {
              type: 'button',
              onClick: () => scanSession.clearPhoto(),
              'data-testid': 'back-to-scanner',
              className:
                'inline-flex w-fit items-center gap-1.5 rounded-full bg-[#0B5D3B] px-4 py-1.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0F5132] active:scale-95',
            },
            t('backToScanner')
          ),
          createElement(
            'button',
            {
              type: 'button',
              onClick: () => scanSession.reset(),
              'data-testid': 'change-crop',
              className: 'inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-700/25 bg-white/90 px-4 py-1.5 text-sm font-semibold text-[#0B5D3B] shadow-sm transition hover:bg-emerald-50 active:scale-95',
            },
            t('changeCrop')
          )
        )
      : createElement(
          'button',
          {
            type: 'button',
            onClick: () => scanSession.reset(),
            className: 'inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-700/25 bg-white/90 px-4 py-1.5 text-sm font-semibold text-[#0B5D3B] shadow-sm transition hover:bg-emerald-50 active:scale-95',
          },
          t('backToCrops')
        ),
    !isScanActive
      ? createElement(
          'section',
          {
            'aria-label': t('scanGuideAria'),
            className:
              'flex items-center justify-center rounded-2xl border border-emerald-300/80 bg-white/92 backdrop-blur-sm py-2.5 px-4 sm:px-6 shadow-md text-center transition-all',
          },
          createElement(
            'p',
            {
              className:
                'text-xs sm:text-[13.5px] font-bold text-[#064E3B] leading-relaxed',
            },
            t('homeHeroDesc')
          )
        )
      : null,
    createElement(ScanFlow, null)
  )
}

// History (F9) and Weather (F16) are the real screens from main.
export { HistoryScreen } from '../features/history/HistoryScreen'

export function AboutScreen() {
  const { t } = useT()

  return createElement(
    'section',
    { className: 'flex flex-col gap-5' },
    createElement(
      'div',
      { className: 'flex items-center gap-3' },
      createElement(
        'div',
        { className: 'flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6F4ED] text-[#0B5D3B]' },
        createElement(Info, { className: 'h-6 w-6', strokeWidth: 2.2 })
      ),
      createElement(
        'h1',
        { className: 'text-2xl sm:text-3xl font-extrabold text-[#0E1F16] tracking-tight' },
        t('aboutTitle')
      )
    ),
    createElement(
      Card,
      { className: 'flex flex-col gap-5 p-6' },
      createElement(
        'div',
        null,
        createElement(
          'span',
          { className: 'inline-flex items-center gap-1.5 rounded-full bg-[#E6F4ED] px-3.5 py-1 text-[14px] font-extrabold text-[#0B5D3B] mb-2' },
          createElement(Sprout, { className: 'h-4 w-4' }),
          t('aboutBadge')
        ),
        createElement(
          'p',
          { className: 'text-[16px] leading-relaxed text-[#4A5F52]' },
          t('aboutDesc')
        )
      ),
      createElement(
        'div',
        { className: 'grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2' },
        createElement(
          'div',
          { className: 'rounded-2xl border border-[#E3E8DC] bg-[#F8F9F5] p-4' },
          createElement(
            'div',
            { className: 'flex items-center gap-2 font-bold text-[#0E1F16] text-[16px] mb-1' },
            createElement(ShieldCheck, { className: 'h-5 w-5 text-[#0B5D3B]' }),
            t('aboutPrivateTitle')
          ),
          createElement(
            'p',
            { className: 'text-[15px] text-[#4A5F52] leading-relaxed' },
            t('aboutPrivateText')
          )
        ),
        createElement(
          'div',
          { className: 'rounded-2xl border border-[#E3E8DC] bg-[#F8F9F5] p-4' },
          createElement(
            'div',
            { className: 'flex items-center gap-2 font-bold text-[#0E1F16] text-[16px] mb-1' },
            createElement(Sprout, { className: 'h-5 w-5 text-[#B45309]' }),
            t('aboutAdviceTitle')
          ),
          createElement(
            'p',
            { className: 'text-[15px] text-[#4A5F52] leading-relaxed' },
            t('aboutAdviceText')
          )
        )
      ),
      createElement(
        'div',
        { className: 'mt-3 rounded-2xl border border-emerald-900/10 bg-emerald-50/50 p-4' },
        createElement(
          'h3',
          { className: 'font-bold text-[#0B5D3B] text-[15px] mb-1' },
          t('aboutDataTitle')
        ),
        createElement(
          'p',
          { className: 'text-[14px] text-[#4A5F52] leading-relaxed' },
          t('aboutDataText')
        )
      )
    )
  )
}

export const routes: RouteDef[] = [
  {
    id: 'home',
    hash: '',
    label: 'হোম',
    title: 'AgroLeaf AI — ধানপাতার রোগ নির্ণয়',
    component: HomeScreen,
  },
  {
    id: 'weather',
    hash: '#/weather',
    label: 'আবহাওয়া',
    title: 'আবহাওয়া ও রোগ-ঝুঁকি',
    component: WeatherScreen,
  },
  {
    id: 'history',
    hash: '#/history',
    label: 'ইতিহাস',
    title: 'স্ক্যান ইতিহাস',
    component: HistoryScreen,
  },
  {
    id: 'how-it-works',
    hash: '#/how-it-works',
    aliases: ['#/accuracy'],
    label: 'কীভাবে কাজ করে',
    title: 'কীভাবে কাজ করে',
    component: AccuracyScreen,
  },
  {
    id: 'about',
    hash: '#/about',
    label: 'সম্পর্কে',
    title: 'সম্পর্কে',
    component: AboutScreen,
  },
]

export function normalizeHash(hash: string): string {
  if (!hash || hash === '#' || hash === '#/') {
    return ''
  }
  const clean = hash.split('?')[0].replace(/\/+$/, '')
  return clean
}

export function matchRoute(hash: string): RouteDef {
  const normalized = normalizeHash(hash)
  // The rice scanner workspace and its result live on the Home route (#/scan/rice, #/scan/rice/result).
  if (normalized.startsWith('#/scan')) return routes[0]
  const matched = routes.find(
    (r) =>
      r.hash === normalized ||
      r.aliases?.some((alias) => normalizeHash(alias) === normalized),
  )
  return matched ?? routes[0]
}
