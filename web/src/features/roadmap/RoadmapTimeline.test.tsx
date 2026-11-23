import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { RoadmapTimeline } from './RoadmapTimeline'
import { getCard } from '../../content/getCard'
import type { Prediction } from '../../ai/types'

describe('F17: RoadmapTimeline Component', () => {
  const blastCard = getCard('blast')
  const highPred: Prediction = {
    tier: 'high',
    top: [
      { classId: 'blast', prob: 0.94 },
      { classId: 'brown_spot', prob: 0.04 },
    ],
    modelVersion: 'v1.0.0',
    trainedFromScratch: true,
    latencyMs: 100,
  }

  it('renders an ol with one li per step for screen readers (4 steps for high disease)', () => {
    const { container } = render(
      <RoadmapTimeline prediction={highPred} card={blastCard} lang="bn" />
    )

    const list = container.querySelector('ol')
    expect(list).toBeInTheDocument()

    const listItems = container.querySelectorAll('ol > li')
    expect(listItems.length).toBe(4)
  })

  it('step dots use Bangla numerals (১ ২ ৩ ৪) in Bengali mode', () => {
    render(<RoadmapTimeline prediction={highPred} card={blastCard} lang="bn" />)

    expect(screen.getByText('১')).toBeInTheDocument()
    expect(screen.getByText('২')).toBeInTheDocument()
    expect(screen.getByText('৩')).toBeInTheDocument()
    expect(screen.getByText('৪')).toBeInTheDocument()
  })

  it('the 16123 step has href="tel:16123"', () => {
    render(<RoadmapTimeline prediction={highPred} card={blastCard} lang="bn" />)

    const callLink = screen.getByRole('link', { name: /১৬১২৩/i })
    expect(callLink).toBeInTheDocument()
    expect(callLink).toHaveAttribute('href', 'tel:16123')
  })

  it('re-scan button calls onReset when clicked', () => {
    const handleReset = vi.fn()
    render(
      <RoadmapTimeline
        prediction={highPred}
        card={blastCard}
        lang="bn"
        onReset={handleReset}
      />
    )

    const rescanBtn = screen.getByRole('button', { name: /আবার স্ক্যান করুন/i })
    expect(rescanBtn).toBeInTheDocument()

    fireEvent.click(rescanBtn)
    expect(handleReset).toHaveBeenCalledTimes(1)
  })

  it('English text appears when lang="en"', () => {
    render(<RoadmapTimeline prediction={highPred} card={blastCard} lang="en" />)

    expect(screen.getByText(/Next 7 Days Action Roadmap/i)).toBeInTheDocument()
    expect(screen.getByText(/Today/i)).toBeInTheDocument()
    expect(screen.getByText(/This Week/i)).toBeInTheDocument()
    expect(screen.getByText(/After 7 Days/i)).toBeInTheDocument()
    expect(screen.getByText(/When to Call/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Scan Again/i })).toBeInTheDocument()
  })

  it('renders muted line under the timeline', () => {
    render(<RoadmapTimeline prediction={highPred} card={blastCard} lang="bn" />)

    expect(
      screen.getByText(/এটি সাধারণ পরামর্শ। নিশ্চিত হতে কৃষি কর্মকর্তার সঙ্গে কথা বলুন/i)
    ).toBeInTheDocument()
  })

  it('points to history in 7-day step for comparison', () => {
    render(<RoadmapTimeline prediction={highPred} card={blastCard} lang="bn" />)

    const historyLink = screen.getByRole('link', { name: /ইতিহাস/i })
    expect(historyLink).toBeInTheDocument()
    expect(historyLink).toHaveAttribute('href', '#/history')
  })
})
