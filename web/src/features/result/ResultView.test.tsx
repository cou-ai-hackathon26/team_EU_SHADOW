import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ResultView from './ResultView'
import type { Prediction, ConfidenceTier } from '../../ai/types'

const basePrediction: Prediction = {
  tier: 'high',
  top: [
    { classId: 'blast', prob: 0.92 },
    { classId: 'brown_spot', prob: 0.05 },
    { classId: 'healthy', prob: 0.03 },
  ],
  modelVersion: 'v1.0.0',
  trainedFromScratch: true,
  latencyMs: 120,
}

describe('ResultView (F4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders high tier with disease name, Mehedi card (F6), and Disclaimer (F7)', () => {
    const highPred: Prediction = {
      ...basePrediction,
      tier: 'high',
      top: [
        { classId: 'blast', prob: 0.94 },
        { classId: 'brown_spot', prob: 0.04 },
      ],
    }

    render(<ResultView prediction={highPred} />)

    // Disease card details rendered by DiseaseCardView
    expect(screen.getByRole('heading', { level: 3, name: /ব্লাস্ট/i })).toBeInTheDocument()
    // Screening disclaimer with 16123
    expect(screen.getAllByText(/১৬১২৩/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('note', { name: /সতর্কবার্তা/i })).toBeInTheDocument()
  })

  it('renders medium tier with 2 options, clearer photo request, and Disclaimer', () => {
    const mediumPred: Prediction = {
      ...basePrediction,
      tier: 'medium',
      top: [
        { classId: 'blast', prob: 0.55 },
        { classId: 'brown_spot', prob: 0.40 },
        { classId: 'healthy', prob: 0.05 },
      ],
    }

    render(<ResultView prediction={mediumPred} />)

    // Shows 2 options
    expect(screen.getAllByText(/ব্লাস্ট/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/বাদামি দাগ|ব্রাউন স্পট/i).length).toBeGreaterThanOrEqual(1)

    // Clearer photo request in Bangla
    expect(screen.getByText(/পরিষ্কার ছবির অনুরোধ/i)).toBeInTheDocument()
    // Disclaimer is present
    expect(screen.getAllByText(/১৬১২৩/).length).toBeGreaterThanOrEqual(1)
  })

  it('renders medium tier with only one top entry: disease name and clearer photo banner still show', () => {
    const singleMediumPred: Prediction = {
      ...basePrediction,
      tier: 'medium',
      top: [
        { classId: 'blast', prob: 0.65 },
      ],
    }

    render(<ResultView prediction={singleMediumPred} />)

    expect(screen.getAllByText(/ব্লাস্ট/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/পরিষ্কার ছবির অনুরোধ/i)).toBeInTheDocument()
  })

  it('renders low tier with "আমি নিশ্চিত নই" and Disclaimer', () => {
    const lowPred: Prediction = {
      ...basePrediction,
      tier: 'low',
      top: [
        { classId: 'blast', prob: 0.35 },
        { classId: 'brown_spot', prob: 0.33 },
      ],
    }

    render(<ResultView prediction={lowPred} />)

    expect(screen.getByText(/আমি নিশ্চিত নই/i)).toBeInTheDocument()
    expect(screen.getAllByText(/১৬১২৩/).length).toBeGreaterThanOrEqual(1)
  })

  it('renders not_rice tier with "এটি ধানপাতা মনে হচ্ছে না" and Disclaimer', () => {
    const notRicePred: Prediction = {
      ...basePrediction,
      tier: 'not_rice',
      top: [
        { classId: 'not_rice', prob: 0.88 },
        { classId: 'blast', prob: 0.08 },
      ],
    }

    render(<ResultView prediction={notRicePred} />)

    expect(screen.getByText(/এটি ধানপাতা মনে হচ্ছে না/i)).toBeInTheDocument()
    expect(screen.getAllByText(/১৬১২৩/).length).toBeGreaterThanOrEqual(1)
  })

  it('shows "Temporary Prototype — Pretrained Model" when trainedFromScratch is false', () => {
    const pretrainedPred: Prediction = {
      ...basePrediction,
      trainedFromScratch: false,
    }

    render(<ResultView prediction={pretrainedPred} />)
    expect(screen.getByText(/Temporary Prototype — Pretrained Model/i)).toBeInTheDocument()
  })

  it('does NOT show "Temporary Prototype — Pretrained Model" when trainedFromScratch is true', () => {
    const scratchPred: Prediction = {
      ...basePrediction,
      trainedFromScratch: true,
    }

    render(<ResultView prediction={scratchPred} />)
    expect(screen.queryByText(/Temporary Prototype — Pretrained Model/i)).not.toBeInTheDocument()
  })

  it('renders a friendly Bengali error state on engine error without crashing', () => {
    render(<ResultView error={new Error('Engine failed to infer')} />)

    expect(screen.getByRole('heading', { level: 2, name: /মডেল চালাতে সমস্যা হয়েছে/i })).toBeInTheDocument()
    expect(screen.getAllByText(/১৬১২৩/).length).toBeGreaterThanOrEqual(1)
  })

  // === NEW TESTS FOR WIRING F11, F15, F7 ===

  describe('F11 HeatmapOverlay wiring', () => {
    it('shows heatmap toggle when prediction.heatmap exists and hides it when absent', () => {
      const predWithHeatmap: Prediction = {
        ...basePrediction,
        heatmap: new Float32Array(49).fill(0.5),
        heatmapSize: 7,
      }

      const { unmount } = render(
        <ResultView
          prediction={predWithHeatmap}
          imageFile={new File(['test-bytes'], 'leaf.jpg', { type: 'image/jpeg' })}
        />,
      )

      expect(
        screen.getByRole('button', { name: /কেন এই উত্তর|হিটম্যাপ/i }),
      ).toBeInTheDocument()

      unmount()

      // When heatmap is not in prediction
      render(<ResultView prediction={basePrediction} />)
      expect(
        screen.queryByRole('button', { name: /কেন এই উত্তর|হিটম্যাপ/i }),
      ).not.toBeInTheDocument()
    })

    it('does not render HeatmapOverlay when prediction.tier is "not_rice"', () => {
      const notRiceWithHeatmap: Prediction = {
        ...basePrediction,
        tier: 'not_rice',
        heatmap: new Float32Array(49).fill(0.5),
        heatmapSize: 7,
      }

      render(
        <ResultView
          prediction={notRiceWithHeatmap}
          imageFile={new File(['test-bytes'], 'leaf.jpg', { type: 'image/jpeg' })}
        />,
      )

      expect(
        screen.queryByRole('button', { name: /কেন এই উত্তর|হিটম্যাপ/i }),
      ).not.toBeInTheDocument()
    })

    it('creates object URL on mount and revokes it on unmount', () => {
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-leaf-url')
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

      const testFile = new File(['test-bytes'], 'leaf.jpg', { type: 'image/jpeg' })
      const { unmount } = render(
        <ResultView prediction={basePrediction} imageFile={testFile} />,
      )

      expect(createObjectURLSpy).toHaveBeenCalledWith(testFile)

      unmount()
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-leaf-url')
    })
  })

  describe('F15 ShareButton wiring', () => {
    const tiers: Prediction['tier'][] = ['high', 'medium', 'low', 'not_rice']

    it.each(tiers)('renders ShareButton for tier "%s"', (tier) => {
      const pred: Prediction = {
        ...basePrediction,
        tier,
      }

      render(<ResultView prediction={pred} />)
      expect(screen.getByRole('button', { name: /শেয়ার/i })).toBeInTheDocument()
    })
  })

  describe('F7 HelpCall wiring', () => {
    const tiers: Prediction['tier'][] = ['high', 'medium', 'low', 'not_rice']

    it.each(tiers)('renders HelpCall 16123 tel link next to disclaimer for tier "%s"', (tier) => {
      const pred: Prediction = {
        ...basePrediction,
        tier,
      }

      render(<ResultView prediction={pred} />)
      const links = screen.getAllByRole('link', { name: /১৬১২৩/ })
      const telLink = links.find((l) => l.getAttribute('href') === 'tel:16123')
      expect(telLink).toBeDefined()
      expect(telLink).toHaveAttribute('href', 'tel:16123')
      expect(screen.getByRole('note', { name: /সতর্কবার্তা/i })).toBeInTheDocument()
    })

    it('renders HelpCall 16123 tel link in error state', () => {
      render(<ResultView error={new Error('Engine crash')} />)
      const links = screen.getAllByRole('link', { name: /১৬১২৩/ })
      const telLink = links.find((l) => l.getAttribute('href') === 'tel:16123')
      expect(telLink).toBeDefined()
      expect(telLink).toHaveAttribute('href', 'tel:16123')
      expect(screen.getByRole('note', { name: /সতর্কবার্তা/i })).toBeInTheDocument()
    })
  })

  const tiers: ConfidenceTier[] = ['high', 'medium', 'low', 'not_rice']

  it.each(tiers)('renders HelpCall (tel:16123) and Disclaimer for %s tier', (tier) => {
    const pred: Prediction = {
      ...basePrediction,
      tier,
      top: tier === 'not_rice'
        ? [{ classId: 'not_rice', prob: 0.9 }]
        : [{ classId: 'blast', prob: 0.8 }, { classId: 'brown_spot', prob: 0.15 }],
    }

    render(<ResultView prediction={pred} />)

    const callLink = screen.getByRole('link', { name: /১৬১২৩/ })
    expect(callLink).toHaveAttribute('href', 'tel:16123')
    expect(screen.getByRole('note', { name: /সতর্কবার্তা/ })).toBeInTheDocument()
  })

  it('renders HelpCall (tel:16123) and Disclaimer for error state', () => {
    render(<ResultView error={new Error('Engine error')} />)

    const callLink = screen.getByRole('link', { name: /১৬১২৩/ })
    expect(callLink).toHaveAttribute('href', 'tel:16123')
    expect(screen.getByRole('note', { name: /সতর্কবার্তা/ })).toBeInTheDocument()
  })
})
