import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from '../App'
import { STORAGE_KEY, resetGlobalLang } from '../i18n/useT'

vi.mock('../ai/engine', () => ({ loadModel: vi.fn(), analyze: vi.fn() }))

const DARK = 'lg:from-[#072A19]'
const rootClass = (c: HTMLElement) => (c.firstElementChild as HTMLElement).className

describe('Home stays dark emerald (regression for the mint background bug)', () => {
  beforeEach(() => {
    window.location.hash = ''
    localStorage.removeItem(STORAGE_KEY)
    act(() => resetGlobalLang())
  })

  it('is dark on first mount and stays dark when the menu opens', async () => {
    localStorage.setItem('agroleaf_viewport_mode', 'desktop')
    const user = userEvent.setup()
    const { container } = render(<App />)
    expect(rootClass(container)).toContain(DARK)
    await user.click(screen.getAllByRole('button', { name: 'মেনু' })[0])
    expect(screen.getAllByText('ফিচার মেনু').length).toBeGreaterThan(0)
    expect(rootClass(container)).toContain(DARK)
  })

  it('stays dark after switching from Mobile Preview back to Web (two Home screens were mounted)', async () => {
    localStorage.setItem('agroleaf_viewport_mode', 'mobile')
    const user = userEvent.setup()
    const { container } = render(<App />)
    await user.click(screen.getByRole('button', { name: /ওয়েব ভিউতে ফিরুন/ }))
    expect(rootClass(container)).toContain(DARK)
    await user.click(screen.getAllByRole('button', { name: 'মেনু' })[0])
    expect(rootClass(container)).toContain(DARK)
  })

  it('stays dark after toggling the language', async () => {
    localStorage.setItem('agroleaf_viewport_mode', 'desktop')
    const user = userEvent.setup()
    const { container } = render(<App />)
    await user.click(screen.getAllByRole('button', { name: /ভাষা পরিবর্তন/ })[0])
    expect(rootClass(container)).toContain(DARK)
  })

  it('goes light only while the rice scanner is open, and dark again after Back', async () => {
    localStorage.setItem('agroleaf_viewport_mode', 'desktop')
    const user = userEvent.setup()
    const { container } = render(<App />)
    await user.click(document.querySelector('[data-crop="rice"]') as HTMLElement)
    expect(rootClass(container)).not.toContain(DARK)
    await user.click(screen.getByRole('button', { name: /ফসল নির্বাচন/ }))
    expect(rootClass(container)).toContain(DARK)
  })
})

describe('Mobile Preview fits the laptop screen', () => {
  it('locks the stage to the viewport and scrolls only inside the phone screen', () => {
    window.location.hash = ''
    localStorage.setItem('agroleaf_viewport_mode', 'mobile')
    render(<App />)
    const stage = screen.getByTestId('mobile-preview-stage')
    expect(stage.className).toMatch(/\bh-screen\b/)
    expect(stage.className).toMatch(/\boverflow-hidden\b/)
    const frame = screen.getByTestId('mobile-preview-frame')
    expect(frame.className).toContain('h-[calc(100vh-32px)]')
    expect(frame.className).toContain('max-h-[700px]')
    expect(frame.className).toMatch(/\boverflow-hidden\b/)
    expect(frame.className).not.toContain('h-[680px]')
    const inner = screen.getByTestId('mobile-preview-screen')
    expect(inner.className).toMatch(/\bflex-1\b/)
    expect(inner.className).toMatch(/\boverflow-y-auto\b/)
    expect(inner.className).toMatch(/\bmin-h-0\b/)
    expect(frame.contains(inner)).toBe(true)
  })
})
