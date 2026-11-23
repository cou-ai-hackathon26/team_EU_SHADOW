import { createElement, type ComponentType } from 'react'
import { History, Info, ShieldCheck, Sprout } from 'lucide-react'
import ScanFlow from '../features/result/ScanFlow'
import AccuracyScreen from '../features/about/AccuracyScreen'
import { LocalWeatherRiskModule } from '../features/weather/LocalWeatherRiskModule'
import { useT } from '../i18n/useT'
import { useScanState } from './scanStateContext'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'

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

  return createElement(
    'div',
    { className: 'flex flex-col gap-3 sm:gap-4 w-full' },
    createElement('h1', { className: 'sr-only' }, 'AgroLeaf AI'),
    !isScanActive
      ? createElement(
          'section',
          {
            'aria-label': 'ব্যবহারের নির্দেশনা',
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

export function WeatherScreen() {
  return createElement(
    'section',
    { className: 'flex flex-col gap-5 w-full' },
    createElement(LocalWeatherRiskModule, null)
  )
}

export function HistoryScreen() {
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
        createElement(History, { className: 'h-6 w-6', strokeWidth: 2.2 })
      ),
      createElement(
        'h1',
        { className: 'text-2xl sm:text-3xl font-extrabold text-[#0E1F16] tracking-tight' },
        t('historyTitle')
      )
    ),
    createElement(EmptyState, {
      icon: createElement(History, { className: 'h-8 w-8', strokeWidth: 2.2 }),
      title: 'এখনো কোনো স্ক্যান সংরক্ষণ করা হয়নি',
      description: 'ধানের পাতার ছবি স্ক্যান করলে ফলাফল স্বয়ংক্রিয়ভাবে আপনার ডিভাইসে সংরক্ষিত থাকবে।',
      action: createElement(
        'a',
        {
          href: '#/',
          className:
            'inline-flex min-h-[52px] items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0B5D3B] to-[#15803D] px-6 py-3 text-[16px] font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-95',
        },
        createElement(Sprout, { className: 'h-5 w-5', strokeWidth: 2.2 }),
        'প্রথম পাতা স্ক্যান করুন'
      ),
    })
  )
}

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
          'কৃষকদের জন্য নির্ভরযোগ্য ডিজিটাল সহযোগী'
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
            '১০০% অফলাইন ও ব্যক্তিগত'
          ),
          createElement(
            'p',
            { className: 'text-[15px] text-[#4A5F52] leading-relaxed' },
            'আপনার তোলা ছবি ডিভাইসের বাইরে সার্ভারে যায় না। ইন্টারনেট সংযোগ ছাড়াও নিশ্চিন্তে রোগ পরীক্ষা করা যায়।'
          )
        ),
        createElement(
          'div',
          { className: 'rounded-2xl border border-[#E3E8DC] bg-[#F8F9F5] p-4' },
          createElement(
            'div',
            { className: 'flex items-center gap-2 font-bold text-[#0E1F16] text-[16px] mb-1' },
            createElement(Sprout, { className: 'h-5 w-5 text-[#B45309]' }),
            'সরাসরি কৃষি পরামর্শ'
          ),
          createElement(
            'p',
            { className: 'text-[15px] text-[#4A5F52] leading-relaxed' },
            'রোগ শনাক্তের পর পরই করণীয় ৩-৪টি বাস্তবসম্মত পদক্ষেপ এবং ১৬১২৩ কৃষি হেল্পলাইনে এক ট্যাপে কল করার সুবিধা।'
          )
        )
      ),
      createElement(
        'div',
        { className: 'mt-3 rounded-2xl border border-emerald-900/10 bg-emerald-50/50 p-4' },
        createElement(
          'h3',
          { className: 'font-bold text-[#0B5D3B] text-[15px] mb-1' },
          'গবেষণা ডেটাসেট ও ছবির লাইসেন্স (Attribution)'
        ),
        createElement(
          'p',
          { className: 'text-[14px] text-[#4A5F52] leading-relaxed' },
          'AgroLeaf AI-এর ডেমো ও টেস্টিং ছবিগুলো আন্তর্জাতিক উন্মুক্ত কৃষি গবেষণা ডেটাসেট (CC BY 4.0 ও CC0 1.0 লাইসেন্সপ্রাপ্ত) থেকে সংগৃহীত। মডেল ট্রেনিং থেকে এই টেস্ট স্প্লিটের ছবি সম্পূর্ণ আলাদা রাখা হয়েছে।'
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
    id: 'history',
    hash: '#/history',
    label: 'ইতিহাস',
    title: 'স্ক্যান ইতিহাস',
    component: HistoryScreen,
  },
  {
    id: 'weather',
    hash: '#/weather',
    label: 'আবহাওয়া ও ৩ডি ম্যাপ',
    title: 'স্থানীয় আবহাওয়া ও ৩ডি ম্যাপ',
    component: WeatherScreen,
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
