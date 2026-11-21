import { createElement, type ComponentType } from 'react'
import PhotoPicker from '../features/capture/PhotoPicker'

export interface RouteDef {
  id: string
  hash: string
  label: string
  title: string
  component: ComponentType
}

// Placeholder screens for F1 shell. Teammates plug their screens here (e.g. Mehedi for F9, Masum for F12).
export function HomeScreen() {
  return createElement(
    'section',
    { className: 'flex flex-col gap-4' },
    createElement(
      'div',
      { className: 'rounded-2xl border border-leaf-800/10 bg-white p-6 shadow-xs' },
      createElement(
        'h1',
        { className: 'text-2xl font-bold text-leaf-800' },
        'AgroLeaf AI — ধানপাতার রোগ নির্ণয়'
      ),
      createElement(
        'p',
        { className: 'mt-2 text-slate-700' },
        'ধানগাছের আক্রান্ত পাতার স্পষ্ট ছবি তুলুন বা গ্যালারি থেকে নির্বাচন করুন। এআই মডেল তাৎক্ষণিক রোগ শনাক্ত করতে সাহায্য করবে।'
      )
    ),
    createElement(PhotoPicker, null)
  )
}

export function HistoryScreen() {
  return createElement(
    'section',
    { className: 'flex flex-col gap-4' },
    createElement(
      'div',
      { className: 'rounded-2xl border border-leaf-800/10 bg-white p-6 shadow-xs' },
      createElement(
        'h1',
        { className: 'text-2xl font-bold text-leaf-800' },
        'স্ক্যান ইতিহাস'
      ),
      createElement(
        'p',
        { className: 'mt-2 text-slate-600' },
        'আপনার ডিভাইসে সংরক্ষিত পূর্ববর্তী পরীক্ষার ফলাফল এখানে দেখা যাবে।'
      )
    )
  )
}

export function HowItWorksScreen() {
  return createElement(
    'section',
    { className: 'flex flex-col gap-4' },
    createElement(
      'div',
      { className: 'rounded-2xl border border-leaf-800/10 bg-white p-6 shadow-xs' },
      createElement(
        'h1',
        { className: 'text-2xl font-bold text-leaf-800' },
        'কীভাবে কাজ করে'
      ),
      createElement(
        'p',
        { className: 'mt-2 text-slate-600' },
        'ব্রাউজারে সরাসরি অন-ডিভাইস এআই মডেল ব্যবহার করে পাতার ছবি বিশ্লেষণ করা হয়। কোনো ছবি ইন্টারনেটে আপলোড হয় না।'
      )
    )
  )
}

export function AboutScreen() {
  return createElement(
    'section',
    { className: 'flex flex-col gap-4' },
    createElement(
      'div',
      { className: 'rounded-2xl border border-leaf-800/10 bg-white p-6 shadow-xs' },
      createElement(
        'h1',
        { className: 'text-2xl font-bold text-leaf-800' },
        'সম্পর্কে'
      ),
      createElement(
        'p',
        { className: 'mt-2 text-slate-600' },
        'AgroLeaf AI — টিম EU_SHADOW কর্তৃক CoU AI হ্যাকাথন ২০২৬-এর জন্য তৈরি।'
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
    label: 'কীভাবে কাজ করে',
    title: 'কীভাবে কাজ করে',
    component: HowItWorksScreen,
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
  const matched = routes.find((r) => r.hash === normalized)
  return matched ?? routes[0]
}
