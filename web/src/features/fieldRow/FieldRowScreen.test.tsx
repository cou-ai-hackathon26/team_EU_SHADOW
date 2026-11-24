import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FieldRowScreen } from './FieldRowScreen'
import type { FieldRowResult, ScreenFieldRow } from '../../ai/fieldRow.types'
import { loadImage } from '../capture/loadImage'

vi.mock('../capture/loadImage', () => ({
  loadImage: vi.fn(),
}))

const mockLoadImage = vi.mocked(loadImage)

const sampleResult: FieldRowResult = {
  imageWidth: 640,
  imageHeight: 480,
  mode: 'leaf_regions',
  modelVersion: 'v5',
  latencyMs: 120,
  summary: {
    totalRegions: 2,
    screened: 2,
    healthy: 1,
    diseased: 1,
    uncertain: 0,
    abstained: 0,
    byDisease: { blast: 1 },
    abstainedByReason: { not_rice: 0, dead_leaf: 0, unrelated_crop: 0 },
    highestRisk: { classId: 'blast', count: 1, maxConfidence: 0.95 },
    diseasedShare: 0.5,
    fieldAbstain: null,
  },
  leaves: [
    {
      id: 1,
      box: { x: 10, y: 10, w: 50, h: 50 },
      source: 'leaf_region',
      status: 'healthy',
      label: 'healthy',
      confidence: 0.98,
      tier: 'high',
      abstain: null,
      margin: 0.9,
      entropy: 0.1,
      pNotRice: 0.01,
      color: { greenRatio: 0.85, brownRatio: 0.05, greyRatio: 0.1, meanSaturation: 0.6 },
    },
    {
      id: 2,
      box: { x: 80, y: 10, w: 50, h: 50 },
      source: 'leaf_region',
      status: 'diseased',
      label: 'blast',
      confidence: 0.95,
      tier: 'high',
      abstain: null,
      margin: 0.85,
      entropy: 0.15,
      pNotRice: 0.02,
      color: { greenRatio: 0.7, brownRatio: 0.15, greyRatio: 0.15, meanSaturation: 0.5 },
    },
  ],
}

describe('FieldRowScreen', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:test-image')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    mockLoadImage.mockImplementation(async () => {
      const img = new Image(640, 480)
      return img
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('renders idle state with PhotoPicker, 16123 helpline, and disclaimer', () => {
    render(<FieldRowScreen lang="bn" />)

    // Heading or title
    expect(screen.getByText(/মাঠের সারি স্ক্যান/)).toBeInTheDocument()
    // 16123 helpline and disclaimer always present
    expect(screen.getAllByText(/১৬১২৩/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('note', { name: /সতর্কবার্তা/i })).toBeInTheDocument()
  })

  it('omits inner disclaimer when showDisclaimer is false (rendered by outer app shell)', () => {
    render(<FieldRowScreen lang="bn" showDisclaimer={false} />)
    expect(screen.queryByRole('note', { name: /সতর্কবার্তা/i })).not.toBeInTheDocument()
    // 16123 helpline is still rendered
    expect(screen.getAllByText(/১৬১২৩/).length).toBeGreaterThanOrEqual(1)
  })

  it('runs analysis and displays progress then result', async () => {
    const mockScreen: ScreenFieldRow = vi.fn().mockImplementation((_, opts) => {
      opts?.onProgress?.({ stage: 'detecting', done: 0, total: 0 })
      return new Promise((resolve) => {
        setTimeout(() => {
          opts?.onProgress?.({ stage: 'classifying', done: 1, total: 2 })
          resolve(sampleResult)
        }, 50)
      })
    })

    const { container } = render(<FieldRowScreen screen={mockScreen} lang="bn" />)

    // Simulate selecting a file through hidden file input
    const file = new File(['fake'], 'field.jpg', { type: 'image/jpeg' })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
    }

    // Trigger analyze button
    const analyzeBtn = await screen.findByRole('button', { name: /বিশ্লেষণ করুন|Analyze/i })
    fireEvent.click(analyzeBtn)

    // Displays ScanProgress
    await waitFor(() => {
      expect(mockScreen).toHaveBeenCalled()
    })

    // Once finished, results are rendered
    await waitFor(() => {
      expect(screen.getByTestId('leaf-list')).toBeInTheDocument()
      expect(screen.getAllByText(/ব্লাস্ট/).length).toBeGreaterThanOrEqual(1)
    })

    // 16123 helpline and disclaimer still present in result state
    expect(screen.getAllByText(/১৬১২৩/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('note', { name: /সতর্কবার্তা/i })).toBeInTheDocument()
  })

  it('handles cancel/abort gracefully', async () => {
    let capturedSignal: AbortSignal | undefined
    const mockScreen: ScreenFieldRow = vi.fn().mockImplementation((_, opts) => {
      capturedSignal = opts?.signal
      return new Promise((_, reject) => {
        opts?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
    })

    const { container } = render(<FieldRowScreen screen={mockScreen} lang="bn" />)

    const file = new File(['fake'], 'field.jpg', { type: 'image/jpeg' })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
    }

    const analyzeBtn = await screen.findByRole('button', { name: /বিশ্লেষণ করুন|Analyze/i })
    fireEvent.click(analyzeBtn)

    const cancelBtn = await screen.findByRole('button', { name: /বাতিল/i })
    fireEvent.click(cancelBtn)

    expect(capturedSignal?.aborted).toBe(true)
  })

  it('renders error state with 16123 helpline and disclaimer', async () => {
    const mockScreen: ScreenFieldRow = vi.fn().mockRejectedValue(new Error('Network failure'))

    const { container } = render(<FieldRowScreen screen={mockScreen} lang="bn" />)

    const file = new File(['fake'], 'field.jpg', { type: 'image/jpeg' })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
    }

    const analyzeBtn = await screen.findByRole('button', { name: /বিশ্লেষণ করুন|Analyze/i })
    fireEvent.click(analyzeBtn)

    await waitFor(() => {
      expect(screen.getAllByText(/Network failure|সমস্যা হয়েছে/).length).toBeGreaterThanOrEqual(1)
    })

    // Helpline and disclaimer in error state
    expect(screen.getAllByText(/১৬১২৩/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('note', { name: /সতর্কবার্তা/i })).toBeInTheDocument()
  })
})
