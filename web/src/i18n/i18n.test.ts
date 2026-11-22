import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { bn } from './bn'
import { en } from './en'
import { useT, getStoredLang, setStoredLang, STORAGE_KEY } from './useT'

describe('F5 i18n — Language Toggle and Translations', () => {
  beforeEach(() => {
    try {
      localStorage.clear()
    } catch {
      // ignore
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('1. defaults to Bengali (bn) when no preference is stored', () => {
    const { result } = renderHook(() => useT())
    expect(result.current.lang).toBe('bn')
    expect(result.current.t('appTitle')).toBe(bn.appTitle)
    expect(result.current.t('navHome')).toBe('হোম')
  })

  it('2. toggles language between bn and en, and updates translations', () => {
    const { result } = renderHook(() => useT())
    expect(result.current.lang).toBe('bn')

    act(() => {
      result.current.toggleLang()
    })

    expect(result.current.lang).toBe('en')
    expect(result.current.t('navHome')).toBe('Home')
    expect(result.current.t('appTitle')).toBe(en.appTitle)

    act(() => {
      result.current.toggleLang()
    })

    expect(result.current.lang).toBe('bn')
    expect(result.current.t('navHome')).toBe('হোম')
  })

  it('3. persists language preference to localStorage and restores on next load', () => {
    const { result: firstRun } = renderHook(() => useT())

    act(() => {
      firstRun.current.setLang('en')
    })
    expect(firstRun.current.lang).toBe('en')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en')

    // Simulate new session / re-mount
    const { result: secondRun } = renderHook(() => useT())
    expect(secondRun.current.lang).toBe('en')
    expect(secondRun.current.t('navHome')).toBe('Home')
  })

  it('4. key parity: every key in bn exists in en and vice versa', () => {
    const bnKeys = Object.keys(bn).sort()
    const enKeys = Object.keys(en).sort()

    expect(bnKeys).toEqual(enKeys)
    expect(bnKeys.length).toBeGreaterThan(10)

    for (const key of bnKeys) {
      expect(bn[key as keyof typeof bn]).toBeDefined()
      expect(en[key as keyof typeof en]).toBeDefined()
      expect(typeof bn[key as keyof typeof bn]).toBe('string')
      expect(typeof en[key as keyof typeof en]).toBe('string')
      expect((bn[key as keyof typeof bn] as string).trim().length).toBeGreaterThan(0)
      expect((en[key as keyof typeof en] as string).trim().length).toBeGreaterThan(0)
    }
  })

  it('5. handles localStorage exceptions gracefully without crashing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage disabled')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('localStorage disabled')
    })

    expect(getStoredLang()).toBe('bn')
    expect(() => setStoredLang('en')).not.toThrow()

    const { result } = renderHook(() => useT())
    expect(result.current.lang).toBe('bn')

    act(() => {
      result.current.setLang('en')
    })
    expect(result.current.lang).toBe('en')
    expect(result.current.t('navHome')).toBe('Home')
  })
})
