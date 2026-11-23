import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ResultView from './ResultView'
import type { Prediction } from '../../ai/types'

const file = new File(['x'], 'leaf.jpg', { type: 'image/jpeg' })

const pred = (tier: Prediction['tier'], top: [string, number][]): Prediction => ({
  tier,
  top: top.map(([classId, prob]) => ({ classId, prob })) as Prediction['top'],
  modelVersion: 'v1',
  trainedFromScratch: true,
  latencyMs: 1,
})

describe('class badge on the result photo', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:leaf')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  it('"আমি নিশ্চিত নই" with healthy as top-1: no "সুস্থ ধানগাছ" badge on the photo (the bug in the screenshot)', () => {
    render(<ResultView prediction={pred('low', [['healthy', 0.4], ['blast', 0.3]])} imageFile={file} lang="bn" />)
    expect(screen.getByRole('img', { name: 'পরীক্ষিত পাতার ছবি' })).toBeInTheDocument()
    expect(screen.queryByTestId('photo-class-badge')).toBeNull()
    expect(screen.getByText('আমি নিশ্চিত নই')).toBeInTheDocument()
    expect(screen.queryByText('সুস্থ ধানগাছ')).toBeNull()
  })

  it('low tier with a disease as top-1: no disease badge on the photo', () => {
    render(<ResultView prediction={pred('low', [['blast', 0.36], ['brown_spot', 0.33]])} imageFile={file} lang="bn" />)
    expect(screen.queryByTestId('photo-class-badge')).toBeNull()
  })

  it('not-rice: no class badge on the photo', () => {
    render(<ResultView prediction={pred('not_rice', [['not_rice', 0.9], ['healthy', 0.05]])} imageFile={file} lang="bn" />)
    expect(screen.queryByTestId('photo-class-badge')).toBeNull()
    expect(screen.getByText('এটি ধানপাতা মনে হচ্ছে না')).toBeInTheDocument()
  })

  it('high and medium results still show the badge', () => {
    const { unmount } = render(<ResultView prediction={pred('high', [['healthy', 0.97], ['blast', 0.02]])} imageFile={file} lang="bn" />)
    expect(screen.getByTestId('photo-class-badge')).toBeInTheDocument()
    unmount()
    render(<ResultView prediction={pred('medium', [['blast', 0.55], ['brown_spot', 0.4]])} imageFile={file} lang="bn" />)
    expect(screen.getByTestId('photo-class-badge')).toBeInTheDocument()
  })
})
