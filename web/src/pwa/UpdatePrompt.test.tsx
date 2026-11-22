import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UpdatePrompt } from './UpdatePrompt'
import * as pwaRegister from 'virtual:pwa-register/react'

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(),
}))

describe('F14 UpdatePrompt Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders nothing when needRefresh is false', () => {
    vi.mocked(pwaRegister.useRegisterSW).mockReturnValue({
      needRefresh: [false, vi.fn()],
      offlineReady: [false, vi.fn()],
      updateServiceWorker: vi.fn(),
    })

    render(<UpdatePrompt />)
    expect(
      screen.queryByText(/নতুন সংস্করণ এসেছে — Reload/),
    ).not.toBeInTheDocument()
  })

  it('shows "নতুন সংস্করণ এসেছে — Reload" when needRefresh is true and calls updateServiceWorker(true) on click', async () => {
    const updateMock = vi.fn().mockResolvedValue(undefined)
    vi.mocked(pwaRegister.useRegisterSW).mockReturnValue({
      needRefresh: [true, vi.fn()],
      offlineReady: [false, vi.fn()],
      updateServiceWorker: updateMock,
    })

    render(<UpdatePrompt />)

    const reloadButton = screen.getByRole('button', {
      name: /নতুন সংস্করণ এসেছে — Reload/i,
    })
    expect(reloadButton).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(reloadButton)

    expect(updateMock).toHaveBeenCalledWith(true)
  })
})
