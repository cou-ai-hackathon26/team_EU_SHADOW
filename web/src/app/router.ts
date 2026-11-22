import { createElement, type ComponentType } from 'react'
import ScanFlow from '../features/result/ScanFlow'
import AccuracyScreen from '../features/about/AccuracyScreen'
import { useT } from '../i18n/useT'

export interface RouteDef {
  id: string
  hash: string
  label: string
  title: string
  component: ComponentType
  aliases?: string[]
}

// Placeholder screens for F1 shell. Teammates plug their screens here (e.g. Mehedi for F9, Masum for F12).
export function HomeScreen() {
  const { t } = useT()
  return createElement(
    'section',
    { className: 'flex flex-col gap-5' },
    createElement(
      'div',
      { className: 'relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-gradient-to-b from-white to-emerald-50/40 p-5 sm:p-6 shadow-sm' },
      createElement(
        'div',
        { className: 'mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-700/20 bg-emerald-100/60 px-3 py-1 text-xs font-bold text-emerald-900' },
        createElement('span', { className: 'h-2 w-2 rounded-full bg-emerald-600 animate-pulse' }),
        'কৃষকদের জন্য নির্ভরযোগ্য ডিজিটাল সহযোগী'
      ),
      createElement(
        'h1',
        { className: 'text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-950 leading-snug' },
        t('homeHeroTitle')
      ),
      createElement(
        'p',
        { className: 'mt-2 text-sm sm:text-base leading-relaxed text-slate-700' },
        t('homeHeroDesc')
      ),
      createElement(
        'div',
        { className: 'mt-4 flex flex-wrap gap-2 pt-2 border-t border-emerald-900/10 text-xs font-semibold text-emerald-900' },
        createElement('span', { className: 'inline-flex items-center gap-1 rounded-lg bg-white/80 px-2.5 py-1 shadow-2xs border border-emerald-900/10' }, '⚡ তাৎক্ষণিক ফলাফল'),
        createElement('span', { className: 'inline-flex items-center gap-1 rounded-lg bg-white/80 px-2.5 py-1 shadow-2xs border border-emerald-900/10' }, '🔒 ছবি ডিভাইসেই প্রসেস হয়'),
        createElement('span', { className: 'inline-flex items-center gap-1 rounded-lg bg-white/80 px-2.5 py-1 shadow-2xs border border-emerald-900/10' }, '🔊 বাংলায় ভয়েস পরামর্শ')
      )
    ),
    createElement(ScanFlow, null)
  )
}

export function HistoryScreen() {
  const { t } = useT()
  return createElement(
    'section',
    { className: 'flex flex-col gap-5' },
    createElement(
      'div',
      { className: 'rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm' },
      createElement(
        'div',
        { className: 'flex items-center gap-3 mb-2' },
        createElement(
          'div',
          { className: 'flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800' },
          createElement(
            'svg',
            { className: 'h-5 w-5', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2.2', strokeLinecap: 'round', strokeLinejoin: 'round' },
            createElement('circle', { cx: '12', cy: '12', r: '10' }),
            createElement('polyline', { points: '12 6 12 12 16 14' })
          )
        ),
        createElement(
          'h1',
          { className: 'text-2xl font-bold text-emerald-950' },
          t('historyTitle')
        )
      ),
      createElement(
        'p',
        { className: 'mt-2 text-sm leading-relaxed text-slate-600' },
        t('historyDesc')
      )
    )
  )
}

export function AboutScreen() {
  const { t } = useT()
  return createElement(
    'section',
    { className: 'flex flex-col gap-5' },
    createElement(
      'div',
      { className: 'rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm' },
      createElement(
        'div',
        { className: 'flex items-center gap-3 mb-2' },
        createElement(
          'div',
          { className: 'flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800' },
          createElement(
            'svg',
            { className: 'h-5 w-5', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2.2', strokeLinecap: 'round', strokeLinejoin: 'round' },
            createElement('path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }),
            createElement('circle', { cx: '9', cy: '7', r: '4' }),
            createElement('path', { d: 'M22 21v-2a4 4 0 0 0-3-3.87' }),
            createElement('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })
          )
        ),
        createElement(
          'h1',
          { className: 'text-2xl font-bold text-emerald-950' },
          t('aboutTitle')
        )
      ),
      createElement(
        'p',
        { className: 'mt-2 text-sm leading-relaxed text-slate-600' },
        t('aboutDesc')
      )
    )
  )
}

/**
 * Route registry: single place where routes and screens are listed.
 * Other members can register their screens here.
 */
export const routes: RouteDef[] = [
  {
    id: 'home',
    hash: '',
    label: 'হোম',
    title: 'AgroLeaf AI — ধানপাতার রোগ নির্ণয়',
    component: HomeScreen,
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
  const matched = routes.find(
    (r) =>
      r.hash === normalized ||
      r.aliases?.some((alias) => normalizeHash(alias) === normalized),
  )
  return matched ?? routes[0]
}
