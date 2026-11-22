import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ShareButton } from './ShareButton'
import type { CaseSummaryInput } from './caseSummary'

describe('F15 ShareButton Component', () => {
  const sampleInput: CaseSummaryInput = {
    prediction: {
      tier: 'high',
      top: [{ classId: 'blast', prob: 0.91 }],
      modelVersion: 'v1-mnv3s-scratch',
      trainedFromScratch: true,
      latencyMs: 120,
    },
    date: new Date('2026-11-22T10:00:00Z'),
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    HTMLCanvasElement.prototype.toBlob = vi.fn(function (
      this: HTMLCanvasElement,
      callback: (blob: Blob | null) => void,
      type?: string,
    ) {
      callback(new Blob(['mock-blob'], { type: type || 'image/png' }))
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('3a. Uses navigator.share when available', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      share: shareMock,
      canShare: vi.fn().mockReturnValue(true),
    })

    render(<ShareButton input={sampleInput} />)
    const btn = screen.getByRole('button', { name: /শেয়ার/i })
    expect(btn).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(btn)

    await waitFor(() => {
      expect(shareMock).toHaveBeenCalled()
    })
  })

  it('3b. Triggers direct download when navigator.share is absent', async () => {
    vi.stubGlobal('navigator', {}) // no share method
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
      revokeObjectURL: vi.fn(),
    })

    const createElementSpy = vi.spyOn(document, 'createElement')

    render(<ShareButton input={sampleInput} />)
    const btn = screen.getByRole('button', { name: /শেয়ার/i })

    const user = userEvent.setup()
    await user.click(btn)

    await waitFor(() => {
      const anchorCalls = createElementSpy.mock.results.filter(
        (r) => r.value instanceof HTMLAnchorElement,
      )
      expect(anchorCalls.length).toBeGreaterThan(0)
      const anchor = anchorCalls[0].value as HTMLAnchorElement
      expect(anchor.download).toMatch(/agroleaf|case-summary|\.png/)
    })
  })
})
