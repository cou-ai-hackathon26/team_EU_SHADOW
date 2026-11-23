import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from '../App'
import { STORAGE_KEY, resetGlobalLang } from '../i18n/useT'

vi.mock('../ai/engine', () => ({ loadModel: vi.fn(), analyze: vi.fn() }))

const logo = () => screen.getAllByRole('link', { name: /AgroLeaf AI — প্রথম পাতায় ফিরুন/ })[0]
const crop = (id: string) => document.querySelector(`[data-crop="${id}"]`)

describe('top-left AgroLeaf AI logo = Home / reset', () => {
  beforeEach(() => {
    window.location.hash = ''
    localStorage.removeItem(STORAGE_KEY)
    localStorage.setItem('agroleaf_viewport_mode', 'desktop')
    act(() => resetGlobalLang())
  })

  it('from the rice scanner, the logo returns to the crop selector', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(crop('rice') as HTMLElement)
    expect(crop('rice')).toBeNull()
    expect(screen.getByRole('button', { name: /ফসল নির্বাচন/ })).toBeInTheDocument()

    await user.click(logo())
    expect(crop('rice')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ফসল নির্বাচন/ })).not.toBeInTheDocument()
  })

  it('after picking a photo, the logo clears it and returns Home', async () => {
    const user = userEvent.setup()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const { container } = render(<App />)
    await user.click(crop('rice') as HTMLElement)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, new File(['x'], 'leaf.jpg', { type: 'image/jpeg' }))
    await waitFor(() => expect(screen.getAllByRole('img', { name: 'নির্বাচিত ধানপাতার ছবি' }).length).toBeGreaterThan(0))

    await user.click(logo())
    expect(crop('rice')).toBeInTheDocument()
    expect(screen.queryAllByRole('img', { name: 'নির্বাচিত ধানপাতার ছবি' })).toHaveLength(0)
  })

  it('from a sub-page (History), the logo navigates to Home', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/history'
    render(<App />)
    expect(crop('rice')).toBeNull()
    await user.click(logo())
    await waitFor(() => expect(crop('rice')).toBeInTheDocument())
    expect(window.location.hash === '#/' || window.location.hash === '').toBe(true)
  })
})
