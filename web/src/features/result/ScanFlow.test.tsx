import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ScanFlow from './ScanFlow'
import * as engine from '../../ai/engine'
import type { Prediction } from '../../ai/types'

// Mock the AI engine module
vi.mock('../../ai/engine', () => ({
  loadModel: vi.fn(),
  analyze: vi.fn(),
}))

// Mock loadImage and assessQuality so we can trigger handleImageReady cleanly
vi.mock('../capture/loadImage', () => ({
  loadImage: vi.fn().mockImplementation(() => {
    const fakeImg = document.createElement('img')
    fakeImg.width = 100
    fakeImg.height = 100
    return Promise.resolve(fakeImg)
  }),
}))

vi.mock('../quality/quality', () => ({
  assessQuality: vi.fn().mockReturnValue({
    brightness: 120,
    sharpness: 30,
    tooDark: false,
    tooBright: false,
    tooBlurry: false,
  }),
}))

describe('ScanFlow integration (F4)', () => {
  const mockPrediction: Prediction = {
    tier: 'high',
    top: [
      { classId: 'blast', prob: 0.95 },
      { classId: 'brown_spot', prob: 0.03 },
    ],
    modelVersion: 'v1.0.0',
    trainedFromScratch: true,
    latencyMs: 85,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(engine.loadModel).mockResolvedValue({
      version: 'v1.0.0',
      trainedFromScratch: true,
      inputSize: 224,
      classes: ['blast', 'brown_spot'],
      thresholds: { high: 0.85, medium: 0.5 },
    } as any)
    vi.mocked(engine.analyze).mockResolvedValue(mockPrediction)
  })

  it('renders initial PhotoPicker state with upload triggers', () => {
    render(<ScanFlow />)
    expect(screen.getByRole('button', { name: /ক্যামেরা/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /গ্যালারি/i })).toBeInTheDocument()
  })

  it('runs analysis when image is selected and Analyze button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<ScanFlow />)

    // Simulate selecting a file
    const file = new File(['fake image bytes'], 'leaf.jpg', { type: 'image/jpeg' })
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, file)

    // Wait for image preview and Analyze button to appear
    const analyzeBtn = await screen.findByRole('button', { name: /Analyze|শনাক্ত/i })
    expect(analyzeBtn).toBeInTheDocument()
    expect(analyzeBtn).not.toBeDisabled()

    // Click Analyze
    await user.click(analyzeBtn)

    // Verify engine was called
    expect(engine.loadModel).toHaveBeenCalledTimes(1)
    expect(engine.analyze).toHaveBeenCalledTimes(1)

    // Verify ResultView is shown with blast result
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: /ব্লাস্ট/i })).toBeInTheDocument()
    })
    expect(screen.getAllByText(/১৬১২৩/).length).toBeGreaterThanOrEqual(1)

    // Click reset to return to picker
    const resetBtn = screen.getByRole('button', { name: /অন্য পাতা পরীক্ষা করুন/i })
    await user.click(resetBtn)

    // Should return to picker
    expect(screen.getByRole('button', { name: /ক্যামেরা/i })).toBeInTheDocument()
  })

  it('handles engine errors gracefully by rendering Bengali error view without crashing', async () => {
    const user = userEvent.setup()
    vi.mocked(engine.analyze).mockRejectedValueOnce(new Error('Inference failure'))

    const { container } = render(<ScanFlow />)

    const file = new File(['fake image bytes'], 'leaf.jpg', { type: 'image/jpeg' })
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, file)

    const analyzeBtn = await screen.findByRole('button', { name: /Analyze|শনাক্ত/i })
    await user.click(analyzeBtn)

    // Error state appears
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /মডেল চালাতে সমস্যা হয়েছে/i })).toBeInTheDocument()
    })
    expect(screen.getAllByText(/১৬১২৩/).length).toBeGreaterThanOrEqual(1)

    // Click try again
    const retryBtn = screen.getByRole('button', { name: /পুনরায় চেষ্টা করুন/i })
    await user.click(retryBtn)

    expect(screen.getByRole('button', { name: /ক্যামেরা/i })).toBeInTheDocument()
  })
})
