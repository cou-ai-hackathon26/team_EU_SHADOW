import { render, screen, fireEvent } from '@testing-library/react'
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

  it('1. Prediction.heatmap না থাকলে বাটন বা লেজেন্ড দেখায় না', () => {
    const { container } = render(
      <HeatmapOverlay prediction={dummyPredictionWithoutHeatmap} />,
    )
    expect(
      screen.queryByRole('button', { name: /কেন এই উত্তর/i }),
    ).not.toBeInTheDocument()
    expect(container.querySelector('canvas')).not.toBeInTheDocument()
    expect(
      screen.queryByText(/লাল = যেখানে মডেল বেশি গুরুত্ব দিয়েছে/),
    ).not.toBeInTheDocument()
  })

  it('2. Default-এ লুকানো; toggle করলে canvas দেখায় এবং লেজেন্ড উপস্থিত থাকে', async () => {
    const user = userEvent.setup()
    render(<HeatmapOverlay prediction={dummyPredictionWithHeatmap} />)

    // Toggle button should be present
    const toggleBtn = screen.getByRole('button', { name: /কেন এই উত্তর/i })
    expect(toggleBtn).toBeInTheDocument()

    // Legend line under the toggle
    expect(
      screen.getByText('লাল = যেখানে মডেল বেশি গুরুত্ব দিয়েছে (আনুমানিক)'),
    ).toBeInTheDocument()

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

  it('3. aligns heatmap canvas with model centre crop when image loads', async () => {
    const user = userEvent.setup()
    render(
      <HeatmapOverlay
        prediction={dummyPredictionWithHeatmap}
        imageSrc="blob:sample-leaf"
      />,
    )

    const img = screen.getByRole('img', { name: /ধানপাতার ছবি/i })
    // Simulate image natural dimensions (400x300)
    Object.defineProperty(img, 'naturalWidth', { value: 400, configurable: true })
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true })
    fireEvent.load(img)

    // Toggle heatmap on
    const toggleBtn = screen.getByRole('button', { name: /কেন এই উত্তর/i })
    await user.click(toggleBtn)

    const canvas = screen.getByLabelText(/হিটম্যাপ/i)
    expect(canvas).toBeInTheDocument()
    expect(canvas.style.left).toBe('17.1875%')
    expect(canvas.style.top).toBe('6.25%')
    expect(canvas.style.width).toBe('65.625%')
    expect(canvas.style.height).toBe('87.5%')
  })
})
