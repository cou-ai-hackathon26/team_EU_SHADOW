import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { HeatmapOverlay } from './HeatmapOverlay'
import type { Prediction } from '../../ai/types'

describe('F11 HeatmapOverlay Component', () => {
  const dummyPredictionWithoutHeatmap: Prediction = {
    tier: 'high',
    top: [{ classId: 'blast', prob: 0.95 }],
    modelVersion: 'v1-mnv3s-scratch',
    trainedFromScratch: true,
    latencyMs: 120,
  }

  const dummyPredictionWithHeatmap: Prediction = {
    ...dummyPredictionWithoutHeatmap,
    heatmap: new Float32Array(49).fill(0.5),
    heatmapSize: 7,
  }

  it('2. Prediction.heatmap না থাকলে বাটনই দেখায় না', () => {
    const { container } = render(
      <HeatmapOverlay prediction={dummyPredictionWithoutHeatmap} />,
    )
    expect(
      screen.queryByRole('button', { name: /কেন এই উত্তর/i }),
    ).not.toBeInTheDocument()
    expect(container.querySelector('canvas')).not.toBeInTheDocument()
  })

  it('1. Default-এ লুকানো; toggle করলে canvas (aria-label সহ) দেখায়', async () => {
    const user = userEvent.setup()
    render(<HeatmapOverlay prediction={dummyPredictionWithHeatmap} />)

    // Toggle button should be present
    const toggleBtn = screen.getByRole('button', { name: /কেন এই উত্তর/i })
    expect(toggleBtn).toBeInTheDocument()

    // Canvas should NOT be visible by default (hidden)
    expect(screen.queryByLabelText(/হিটম্যাপ/i)).not.toBeInTheDocument()

    // Click toggle button to show heatmap
    await user.click(toggleBtn)

    const canvas = screen.getByLabelText(/হিটম্যাপ/i)
    expect(canvas).toBeInTheDocument()
    expect(canvas.tagName.toLowerCase()).toBe('canvas')

    // Click again to hide
    await user.click(toggleBtn)
    expect(screen.queryByLabelText(/হিটম্যাপ/i)).not.toBeInTheDocument()
  })
})
