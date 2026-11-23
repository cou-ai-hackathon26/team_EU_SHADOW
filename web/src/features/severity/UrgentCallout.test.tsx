import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { UrgentCallout } from './UrgentCallout'
import type { DiseaseCard } from '../../content/types'
import type { SeverityEstimate } from './estimateSpread'

describe('F18 UrgentCallout', () => {
  const actCard: DiseaseCard = {
    id: 'blast',
    name: { bn: 'ব্লাস্ট রোগ', en: 'Blast' },
    summary: { bn: 'সারসংক্ষেপ', en: 'Summary' },
    symptoms: [{ bn: 'লক্ষণ', en: 'Symptom' }],
    causes: [{ bn: 'কারণ', en: 'Cause' }],
    prevention: [{ bn: 'প্রতিরোধ', en: 'Prevention' }],
    whenToCallExpert: { bn: 'পরামর্শ', en: 'Advice' },
    severity: 'act',
    sources: [{ title: 'BRRI', url: 'https://brri.portal.gov.bd/sample', publisher: 'BRRI' }],
  }

  const watchCard: DiseaseCard = {
    ...actCard,
    id: 'brown_spot',
    severity: 'watch',
  }

  it('visible for large band even if card severity is watch', () => {
    const severity: SeverityEstimate = { share: 0.5, band: 'large' }
    render(<UrgentCallout tier="high" card={watchCard} severity={severity} />)

    expect(screen.getByText(/আজই ১৬১২৩ নম্বরে কল করুন/)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /১৬১২৩/ })
    expect(link).toHaveAttribute('href', 'tel:16123')
  })

  it('visible for a high-tier act card even with small band', () => {
    const severity: SeverityEstimate = { share: 0.1, band: 'small' }
    render(<UrgentCallout tier="high" card={actCard} severity={severity} />)

    expect(screen.getByText(/আজই ১৬১২৩ নম্বরে কল করুন/)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /১৬১২৩/ })
    expect(link).toHaveAttribute('href', 'tel:16123')
  })

  it('hidden when tier is not high, or when band is small/medium and card is watch/none', () => {
    const severity: SeverityEstimate = { share: 0.2, band: 'medium' }
    const { container: c1 } = render(
      <UrgentCallout tier="high" card={watchCard} severity={severity} />,
    )
    expect(c1.firstChild).toBeNull()

    const { container: c2 } = render(
      <UrgentCallout tier="medium" card={actCard} severity={severity} />,
    )
    expect(c2.firstChild).toBeNull()
  })
})
