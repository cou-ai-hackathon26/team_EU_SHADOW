import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import QualityHint from './QualityHint'
import type { QualityReport } from '../../ai/types'

describe('QualityHint (F3)', () => {
  it('displays warnings for dark images without disabling analyze button', () => {
    const darkReport: QualityReport = {
      brightness: 20,
      sharpness: 30,
      tooDark: true,
      tooBright: false,
      tooBlurry: false,
    }

    render(<QualityHint report={darkReport} />)

    // Warning message in Bangla
    expect(screen.getByText(/আলো/i)).toBeInTheDocument()

    // Analyze button is present and NOT disabled
    const analyzeBtn = screen.getByRole('button', { name: /Analyze|শনাক্ত|বিশ্লেষণ/i })
    expect(analyzeBtn).toBeInTheDocument()
    expect(analyzeBtn).not.toBeDisabled()
  })

  it('displays warning when image is tooBlurry without blocking analyze button', () => {
    const blurryReport: QualityReport = {
      brightness: 120,
      sharpness: 2,
      tooDark: false,
      tooBright: false,
      tooBlurry: true,
    }

    render(<QualityHint report={blurryReport} />)

    expect(screen.getByText(/ঝাপসা/i)).toBeInTheDocument()
    const analyzeBtn = screen.getByRole('button', { name: /Analyze|শনাক্ত|বিশ্লেষণ/i })
    expect(analyzeBtn).not.toBeDisabled()
  })

  it('displays a positive hint or clean state when quality is good', () => {
    const goodReport: QualityReport = {
      brightness: 130,
      sharpness: 50,
      tooDark: false,
      tooBright: false,
      tooBlurry: false,
    }

    render(<QualityHint report={goodReport} />)
    expect(screen.queryByText(/ঝাপসা/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/খুব অন্ধকার/i)).not.toBeInTheDocument()
  })
})
