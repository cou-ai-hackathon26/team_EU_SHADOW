import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ResultView from './ResultView'
import type { Prediction } from '../../ai/types'

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
    expect(screen.getByText(/১৬১২৩/)).toBeInTheDocument()
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
    expect(screen.getByText(/ব্লাস্ট/i)).toBeInTheDocument()
    expect(screen.getByText(/বাদামি দাগ|ব্রাউন স্পট/i)).toBeInTheDocument()

    // Clearer photo request in Bangla
    expect(screen.getByText(/পরিষ্কার ছবির অনুরোধ|আরও স্পষ্ট/i)).toBeInTheDocument()
    // Disclaimer is present
    expect(screen.getByText(/১৬১২৩/)).toBeInTheDocument()
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
    expect(screen.getByText(/১৬১২৩/)).toBeInTheDocument()
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
    expect(screen.getByText(/১৬১২৩/)).toBeInTheDocument()
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

    expect(screen.getByText(/মডেল চালাতে সমস্যা হয়েছে|ত্রুটি/i)).toBeInTheDocument()
    expect(screen.getByText(/১৬১২৩/)).toBeInTheDocument()
  })
})
