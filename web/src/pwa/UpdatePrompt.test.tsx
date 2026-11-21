import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UpdatePrompt } from './UpdatePrompt'

describe('F14 UpdatePrompt Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders nothing when no new version / update is waiting', () => {
    render(<UpdatePrompt registration={null} />)
    expect(screen.queryByText(/নতুন সংস্করণ — Reload/)).not.toBeInTheDocument()
  })

  it('shows "নতুন সংস্করণ — Reload" prompt when a new version is available', async () => {
    const postMessageMock = vi.fn()
    const waitingWorker = {
      postMessage: postMessageMock,
    } as unknown as ServiceWorker

    const registration = {
      waiting: waitingWorker,
      addEventListener: vi.fn(),
    } as unknown as ServiceWorkerRegistration

    render(<UpdatePrompt registration={registration} />)

    // Must show the prompt text containing "নতুন সংস্করণ — Reload"
    const reloadButton = screen.getByRole('button', {
      name: /নতুন সংস্করণ — Reload/i,
    })
    expect(reloadButton).toBeInTheDocument()

    // Clicking reload posts SKIP_WAITING to waiting service worker
    const user = userEvent.setup()
    await user.click(reloadButton)

    expect(postMessageMock).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
  })
})
