import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SeverityBadge } from './SeverityBadge'
import type { Prediction } from '../../ai/types'

describe('F18 SeverityBadge', () => {
  const makePred = (
    tier: Prediction['tier'],
    classId: string,
    hotCount: number,
  ): Prediction => {
    const heatmap = new Float32Array(49)
    for (let i = 0; i < hotCount; i++) heatmap[i] = 0.8
    return {
      tier,
      top: [{ classId: classId as any, prob: 0.95 }],
      modelVersion: 'v1.0.0',
      trainedFromScratch: true,
      latencyMs: 100,
      heatmap,
      heatmapSize: 7,
    }
  }

  it('renders the band and the honesty line for high tier diseased leaf', () => {
    const pred = makePred('high', 'blast', 25)
    render(<SeverityBadge prediction={pred} />)

    expect(screen.getByText(/বড় অংশে/)).toBeInTheDocument()
    expect(
      screen.getByText(/আনুমানিক \(হিটম্যাপ থেকে\), মাপা ক্ষতের পরিমাণ নয়/),
    ).toBeInTheDocument()
  })

  it('never renders a % character anywhere', () => {
    const pred = makePred('high', 'blast', 12)
    const { container } = render(<SeverityBadge prediction={pred} />)
    expect(container.textContent).not.toContain('%')
  })

  it('renders nothing for healthy prediction', () => {
    const pred = makePred('high', 'healthy', 25)
    const { container } = render(<SeverityBadge prediction={pred} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing for medium, low, or not_rice tiers', () => {
    const mediumPred = makePred('medium', 'blast', 25)
    const lowPred = makePred('low', 'blast', 25)
    const notRicePred = makePred('not_rice', 'not_rice', 25)

    const r1 = render(<SeverityBadge prediction={mediumPred} />)
    expect(r1.container.firstChild).toBeNull()
    r1.unmount()

    const r2 = render(<SeverityBadge prediction={lowPred} />)
    expect(r2.container.firstChild).toBeNull()
    r2.unmount()

    const r3 = render(<SeverityBadge prediction={notRicePred} />)
    expect(r3.container.firstChild).toBeNull()
    r3.unmount()
  })
})
