import { createElement, useState, useEffect, useCallback } from 'react'
import { bn, type I18nKeys } from './bn'
import { en } from './en'

export type Lang = 'bn' | 'en'
export const STORAGE_KEY = 'agroleaf_lang'

const translations: Record<Lang, Record<I18nKeys, string>> = {
  bn,
  en,
}

export function getStoredLang(): Lang {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === 'en' || stored === 'bn') {
        return stored
      }
    }
  } catch {
    // localStorage not accessible (e.g. incognito/disabled)
  }
  return 'bn'
}

export function setStoredLang(lang: Lang): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, lang)
    }
  } catch {
    // ignore storage write errors
  }
}

// Global listener set to synchronize state across multiple useT instances in the same tree
type Listener = (lang: Lang) => void
const listeners = new Set<Listener>()
let currentGlobalLang: Lang = getStoredLang()

function updateGlobalLang(newLang: Lang) {
  currentGlobalLang = newLang
  setStoredLang(newLang)
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = newLang
  }
  listeners.forEach((listener) => listener(newLang))
}

export function resetGlobalLang(): void {
  currentGlobalLang = getStoredLang()
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = currentGlobalLang
  }
  listeners.forEach((listener) => listener(currentGlobalLang))
}

export interface UseTReturn {
  lang: Lang
  setLang: (lang: Lang) => void
  toggleLang: () => void
  t: (key: I18nKeys) => string
}

export function useT(): UseTReturn {
  const [lang, setLangState] = useState<Lang>(() => currentGlobalLang)

  useEffect(() => {
    const handleLangChange: Listener = (newLang) => {
      setLangState(newLang)
    }
    listeners.add(handleLangChange)
    return () => {
      listeners.delete(handleLangChange)
    }
  }, [])

  const setLang = useCallback((nextLang: Lang) => {
    updateGlobalLang(nextLang)
  }, [])

  const toggleLang = useCallback(() => {
    const nextLang: Lang = currentGlobalLang === 'bn' ? 'en' : 'bn'
    updateGlobalLang(nextLang)
  }, [])

  const t = useCallback(
    (key: I18nKeys): string => {
      return translations[lang]?.[key] ?? bn[key] ?? key
    },
    [lang]
  )

  return {
    lang,
    setLang,
    toggleLang,
    t,
  }
}

/**
 * LanguageToggle component: renders a sleek, accessible toggle button.
 * Unslop-compliant: clean border, 4px grid, quiet neutrals, clear contrast.
 */
export function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, toggleLang, t } = useT()

  return createElement(
    'button',
    {
      type: 'button',
      onClick: toggleLang,
      'aria-label': t('langToggleAria'),
      className: `inline-flex h-8 items-center gap-0.5 rounded-full border border-white/25 bg-white/10 p-0.5 text-xs font-bold text-white shadow-2xs backdrop-blur-xs transition-all hover:bg-white/20 hover:border-white/40 active:scale-95 cursor-pointer ${className}`,
    },
    createElement(
      'span',
      {
        className: `rounded-full px-2 py-0.5 transition-all text-xs ${
          lang === 'bn'
            ? 'bg-white text-[#0F5132] font-black shadow-xs'
            : 'text-emerald-100/90 font-semibold hover:text-white'
        }`,
      },
      'বাং'
    ),
    createElement(
      'span',
      {
        className: `rounded-full px-2 py-0.5 transition-all text-xs ${
          lang === 'en'
            ? 'bg-white text-[#0F5132] font-black shadow-xs'
            : 'text-emerald-100/90 font-semibold hover:text-white'
        }`,
      },
      'EN'
    )
  )
}
