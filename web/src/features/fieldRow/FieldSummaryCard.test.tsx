import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { FieldSummaryCard } from './FieldSummaryCard'
import type { FieldSummary } from '../../ai/fieldRow.types'

const normalSummary: FieldSummary = {
  totalRegions: 8,
  screened: 6,
  healthy: 4,
  diseased: 2,
  uncertain: 0,
  abstained: 2,
  byDisease: { blast: 2 },
  abstainedByReason: { not_rice: 1, dead_leaf: 1, unrelated_crop: 0 },
  highestRisk: { classId: 'blast', count: 2, maxConfidence: 0.94 },
  diseasedShare: 0.33,
  fieldAbstain: null,
}

const abstainSummary: FieldSummary = {
  totalRegions: 5,
  screened: 0,
  healthy: 0,
  diseased: 0,
  uncertain: 0,
  abstained: 5,
  byDisease: {},
  abstainedByReason: { not_rice: 0, dead_leaf: 0, unrelated_crop: 5 },
  highestRisk: null,
  diseasedShare: 0,
  fieldAbstain: 'unrelated_crop',
}

describe('FieldSummaryCard component', () => {
  it('renders normal summary with counts, highest risk disease, 16123 helpline, and disclaimer', () => {
    render(<FieldSummaryCard summary={normalSummary} lang="bn" />)

    // Total leaves and screened count
    expect(screen.getByText(/৮/)).toBeInTheDocument()
    expect(screen.getAllByText(/৬/).length).toBeGreaterThanOrEqual(1)

    // Counts for healthy and diseased
    expect(screen.getAllByText(/৪/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/২/).length).toBeGreaterThanOrEqual(1)

    // Highest risk disease: ব্লাস্ট and confidence 94%
    expect(screen.getByText(/ব্লাস্ট/)).toBeInTheDocument()
    expect(screen.getByText(/সর্বোচ্চ আস্থা ৯৪%/)).toBeInTheDocument()

    // Skipped-by-reason lines
    expect(screen.getByText(/পাতাটি শুকনো বা মৃত মনে হচ্ছে/)).toBeInTheDocument()

    // Helpline 16123 and Disclaimer present
    expect(screen.getAllByText(/১৬১২৩/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('note', { name: /সতর্কবার্তা/i })).toBeInTheDocument()
  })

  it('renders fieldAbstain state: shows abstain copy, retry button, NO disease name, with 16123 and disclaimer', () => {
    const onRetry = vi.fn()
    render(<FieldSummaryCard summary={abstainSummary} lang="bn" onRetry={onRetry} />)

    // Unrelated crop abstain title and desc
    expect(screen.getByText(/এটি অন্য ফসল মনে হচ্ছে/)).toBeInTheDocument()
    expect(screen.getByText(/AgroLeaf AI এখন শুধু ধানপাতা পরীক্ষা করে। ধানপাতার ছবি দিন।/)).toBeInTheDocument()

    // Must NOT mention any disease
    expect(screen.queryByText(/ব্লাস্ট/)).not.toBeInTheDocument()
    expect(screen.queryByText(/বাদামি দাগ/)).not.toBeInTheDocument()

    // Retry button triggers onRetry
    const retryBtn = screen.getByRole('button', { name: /আবার চেষ্টা করুন/i })
    expect(retryBtn).toBeInTheDocument()
    fireEvent.click(retryBtn)
    expect(onRetry).toHaveBeenCalledTimes(1)

    // Helpline 16123 and Disclaimer present even in abstain state
    expect(screen.getAllByText(/১৬১২৩/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('note', { name: /সতর্কবার্তা/i })).toBeInTheDocument()
  })

  it('omits disclaimer when showDisclaimer is false', () => {
    render(<FieldSummaryCard summary={normalSummary} lang="bn" showDisclaimer={false} />)
    expect(screen.queryByRole('note', { name: /সতর্কবার্তা/i })).not.toBeInTheDocument()
    expect(screen.getAllByText(/১৬১২৩/).length).toBeGreaterThanOrEqual(1)
  })
})
