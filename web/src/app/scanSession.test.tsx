import { render, screen, act, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from '../App'
import type { Prediction } from '../ai/types'
import { scanSession, SCAN_HASH, RESULT_HASH } from './scanSession'
import { STORAGE_KEY, resetGlobalLang } from '../i18n/useT'

vi.mock('../ai/engine', () => ({ loadModel: vi.fn(), analyze: vi.fn() }))

const high: Prediction = {
  tier: 'high',
  top: [
    { classId: 'blast', prob: 0.92 },
    { classId: 'brown_spot', prob: 0.05 },
  ],
  modelVersion: 'v1.0.0',
  trainedFromScratch: true,
  latencyMs: 120,
}

function giveResult(prediction: Prediction = high) {
  act(() => {
    scanSession.openCrop('rice')
    scanSession.setImage(new Image(), new File(['x'], 'leaf.jpg', { type: 'image/jpeg' }))
    scanSession.setResult(prediction, null)
  })
}

const disclaimers = (root: HTMLElement | Document = document) =>
  [...root.querySelectorAll('[role="note"]')].filter((n) => (n.getAttribute('aria-label') ?? '').includes('সতর্কবার্তা'))

describe('shared scan session', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.setItem('agroleaf_viewport_mode', 'desktop')
    act(() => resetGlobalLang())
  })

  it('opening rice puts the workspace in the URL (#/scan/rice)', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(document.querySelector('[data-crop="rice"]') as HTMLElement)
    expect(window.location.hash).toBe(SCAN_HASH)
    expect(screen.getAllByRole('button', { name: /ক্যামেরা/ }).length).toBeGreaterThan(0)
  })

  it('a result keeps showing when switching Web → Mobile → Web', async () => {
    const user = userEvent.setup()
    render(<App />)
    giveResult()
    expect(window.location.hash).toBe(RESULT_HASH)
    expect(screen.getAllByText('ব্লাস্ট রোগ').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /Mobile/ }))
    const frame = screen.getByTestId('mobile-preview-frame')
    expect(within(frame).getAllByText('ব্লাস্ট রোগ').length).toBeGreaterThan(0)
    expect(frame.querySelector('[data-crop]')).toBeNull()

    await user.click(screen.getByRole('button', { name: /ওয়েব ভিউতে ফিরুন/ }))
    expect(screen.getAllByText('ব্লাস্ট রোগ').length).toBeGreaterThan(0)
    expect(document.querySelector('[data-crop]')).toBeNull()
  })

  it('the scanner workspace (not the crop selector) survives switching to Mobile', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(document.querySelector('[data-crop="rice"]') as HTMLElement)
    await user.click(screen.getByRole('button', { name: /Mobile/ }))
    const frame = screen.getByTestId('mobile-preview-frame')
    expect(within(frame).getAllByRole('button', { name: /ক্যামেরা/ }).length).toBeGreaterThan(0)
    expect(frame.querySelector('[data-crop]')).toBeNull()
  })

  it('the result screen shows exactly one disclaimer (no duplicate at the page bottom)', () => {
    render(<App />)
    giveResult()
    expect(disclaimers()).toHaveLength(1)
    expect(screen.getAllByRole('link', { name: /১৬১২৩/ }).length).toBeGreaterThan(0)
  })

  it('the page-level disclaimer is still shown on the scanner and landing', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(disclaimers()).toHaveLength(1)
    await user.click(document.querySelector('[data-crop="rice"]') as HTMLElement)
    expect(disclaimers()).toHaveLength(1)
  })

  it('reloading on #/scan/rice opens the rice workspace, not the crop selector', () => {
    window.location.hash = SCAN_HASH
    scanSession._resetForTests(SCAN_HASH)
    render(<App />)
    expect(screen.getAllByRole('button', { name: /ক্যামেরা/ }).length).toBeGreaterThan(0)
    expect(document.querySelector('[data-crop]')).toBeNull()
  })

  it('reloading on the result URL also lands in the workspace (photos are never stored)', () => {
    window.location.hash = RESULT_HASH
    scanSession._resetForTests(RESULT_HASH)
    render(<App />)
    expect(screen.getAllByRole('button', { name: /ক্যামেরা/ }).length).toBeGreaterThan(0)
    expect(document.querySelector('[data-crop]')).toBeNull()
  })

  it('browser Back from a result returns to the workspace, not Home', async () => {
    render(<App />)
    giveResult()
    act(() => {
      window.location.hash = SCAN_HASH
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    await waitFor(() => expect(screen.queryAllByText('ব্লাস্ট রোগ')).toHaveLength(0))
    expect(screen.getAllByRole('button', { name: /ক্যামেরা/ }).length).toBeGreaterThan(0)
    expect(document.querySelector('[data-crop]')).toBeNull()
  })

  it('only the logo or "← ফসল নির্বাচন" goes back to the crop selector', async () => {
    const user = userEvent.setup()
    render(<App />)
    giveResult()
    await user.click(screen.getAllByRole('link', { name: /প্রথম পাতায় ফিরুন/ })[0])
    expect(document.querySelector('[data-crop="rice"]')).toBeInTheDocument()

    await user.click(document.querySelector('[data-crop="rice"]') as HTMLElement)
    await user.click(screen.getByRole('button', { name: /ফসল নির্বাচন/ }))
    expect(document.querySelector('[data-crop="rice"]')).toBeInTheDocument()
  })
})

describe('menu → করণীয় রোডম্যাপ (F17)', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.setItem('agroleaf_viewport_mode', 'desktop')
    act(() => resetGlobalLang())
  })

  it('is in the ☰ মেনু dropdown, not in the top bar', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.queryByTestId('menu-roadmap')).toBeNull()
    await user.click(screen.getAllByRole('button', { name: 'মেনু' })[0])
    expect(screen.getByTestId('menu-roadmap')).toHaveTextContent('করণীয় রোডম্যাপ')
  })

  it('without a result, it opens the rice scanner with a hint to scan first', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getAllByRole('button', { name: 'মেনু' })[0])
    await user.click(screen.getByTestId('menu-roadmap'))
    expect(window.location.hash).toBe(SCAN_HASH)
    expect(screen.getByRole('status')).toHaveTextContent('আগে একটি ধানপাতার ছবি স্ক্যান করুন')
  })

  it('with a result, it shows that result and its roadmap', async () => {
    const user = userEvent.setup()
    render(<App />)
    giveResult()
    act(() => {
      window.location.hash = '#/history'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    await user.click(screen.getAllByRole('button', { name: 'মেনু' })[0])
    await user.click(screen.getByTestId('menu-roadmap'))
    await waitFor(() => expect(window.location.hash).toBe(RESULT_HASH))
    await waitFor(() => expect(document.getElementById('action-roadmap')).toBeInTheDocument())
  })
})

describe('two-level Back on the result screen', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.setItem('agroleaf_viewport_mode', 'desktop')
    act(() => resetGlobalLang())
  })

  it('"← ক্যামেরা ও গ্যালারি" clears the result and returns to the rice camera & gallery workspace', async () => {
    const user = userEvent.setup()
    render(<App />)
    giveResult()
    expect(screen.getAllByText('ব্লাস্ট রোগ').length).toBeGreaterThan(0)

    await user.click(screen.getByTestId('back-to-scanner'))
    expect(window.location.hash).toBe(SCAN_HASH)
    expect(screen.queryAllByText('ব্লাস্ট রোগ')).toHaveLength(0)
    expect(screen.getAllByRole('button', { name: /ক্যামেরা দিয়ে/ }).length).toBeGreaterThan(0)
    expect(document.querySelector('[data-crop]')).toBeNull()
    expect(scanSession.get().crop).toBe('rice')
  })

  it('"ফসল নির্বাচন করুন" goes all the way back to the hero and crop selector', async () => {
    const user = userEvent.setup()
    render(<App />)
    giveResult()
    await user.click(screen.getByTestId('change-crop'))
    expect(document.querySelector('[data-crop="rice"]')).toBeInTheDocument()
    expect(scanSession.get().crop).toBeNull()
  })

  it('with only a photo (before analysing), Back also returns to the camera & gallery', async () => {
    const user = userEvent.setup()
    render(<App />)
    act(() => {
      scanSession.openCrop('rice')
      scanSession.setImage(new Image(), new File(['x'], 'leaf.jpg', { type: 'image/jpeg' }))
    })
    await user.click(screen.getByTestId('back-to-scanner'))
    expect(scanSession.get().image).toBeNull()
    expect(scanSession.get().crop).toBe('rice')
    expect(screen.queryByTestId('back-to-scanner')).toBeNull()
  })
})
