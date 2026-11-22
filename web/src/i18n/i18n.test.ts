import { renderHook, act, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { bn } from './bn'
import { en } from './en'
import { useT, getStoredLang, setStoredLang, resetGlobalLang, STORAGE_KEY, LanguageToggle } from './useT'
import Layout from '../components/Layout'

describe('F5 i18n — Language Toggle and Translations', () => {
  beforeEach(() => {
    try {
      localStorage.clear()
    } catch {
      // ignore
    }
    resetGlobalLang()
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

  it('6. key parity in reverse: every key in en exists in bn', () => {
    const bnKeys = Object.keys(bn)
    const enKeys = Object.keys(en)
    expect(enKeys.sort()).toEqual(bnKeys.sort())
  })

  it('7. LanguageToggle in Layout switches header and bottom nav between Bengali and English', async () => {
    const user = userEvent.setup()
    render(
      createElement(
        Layout,
        { currentHash: '#/' },
        createElement('div', null, 'Screen Body')
      )
    )

    // Initial state is Bengali
    expect(screen.getByText('ধানপাতার রোগের প্রাথমিক স্ক্রিনিং')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /হোম/ })).toBeInTheDocument()

    // Find and click language toggle button
    const toggleBtn = screen.getByRole('button', { name: /ভাষা পরিবর্তন করুন|Switch Language/i })
    await user.click(toggleBtn)

    // Switched to English
    expect(screen.getByText('Rice Leaf Disease Early Screening')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Home/ })).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en')
    expect(document.documentElement.lang).toBe('en')

    // Click again to toggle back to Bengali
    await user.click(toggleBtn)
    expect(screen.getByText('ধানপাতার রোগের প্রাথমিক স্ক্রিনিং')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /হোম/ })).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('bn')
    expect(document.documentElement.lang).toBe('bn')
  })

  it('8. works in-memory when localStorage throws (bn -> en -> bn and second component sync)', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('localStorage blocked')
    })

    resetGlobalLang()

    function TestComp() {
      const { lang, t } = useT()
      return createElement(
        'div',
        null,
        createElement('span', { 'data-testid': 'lang-display' }, lang),
        createElement('span', { 'data-testid': 'text-display' }, t('navHome')),
        createElement(LanguageToggle)
      )
    }

    function SecondComp() {
      const { lang } = useT()
      return createElement('span', { 'data-testid': 'second-comp-lang' }, lang)
    }

    const user = userEvent.setup()
    const { unmount } = render(createElement(TestComp))

    // Initial state: bn
    expect(screen.getByTestId('lang-display').textContent).toBe('bn')
    expect(screen.getByTestId('text-display').textContent).toBe('হোম')

    const toggleBtn = screen.getByRole('button', { name: /ভাষা পরিবর্তন করুন|Switch Language/i })

    // Click toggle 1: bn -> en
    await user.click(toggleBtn)
    expect(screen.getByTestId('lang-display').textContent).toBe('en')
    expect(screen.getByTestId('text-display').textContent).toBe('Home')

    // Second component mounted after the first toggle shows English
    const { unmount: unmountSecond } = render(createElement(SecondComp))
    expect(screen.getByTestId('second-comp-lang').textContent).toBe('en')
    unmountSecond()

    // Click toggle 2: en -> bn
    await user.click(toggleBtn)
    expect(screen.getByTestId('lang-display').textContent).toBe('bn')
    expect(screen.getByTestId('text-display').textContent).toBe('হোম')

    unmount()
  })
})
