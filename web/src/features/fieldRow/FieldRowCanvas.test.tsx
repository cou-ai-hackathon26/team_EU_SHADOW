import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FieldRowCanvas } from './FieldRowCanvas'
import type { FieldRowResult } from '../../ai/fieldRow.types'

const mockResult: FieldRowResult = {
  imageWidth: 800,
  imageHeight: 600,
  mode: 'leaf_regions',
  modelVersion: 'agroleaf-m3-v5',
  latencyMs: 145,
  summary: {
    totalRegions: 4,
    screened: 3,
    healthy: 1,
    diseased: 1,
    uncertain: 1,
    abstained: 1,
    byDisease: { blast: 1 },
    abstainedByReason: { not_rice: 1, dead_leaf: 0, unrelated_crop: 0 },
    highestRisk: { classId: 'blast', count: 1, maxConfidence: 0.92 },
    diseasedShare: 0.5,
    fieldAbstain: null,
  },
  leaves: [
    {
      id: 1,
      box: { x: 10, y: 10, w: 100, h: 100 },
      source: 'leaf_region',
      status: 'healthy',
      label: 'healthy',
      confidence: 0.95,
      tier: 'high',
      abstain: null,
      margin: 0.8,
      entropy: 0.2,
      pNotRice: 0.01,
      color: { greenRatio: 0.8, brownRatio: 0.05, greyRatio: 0.1, meanSaturation: 0.6 },
    },
    {
      id: 2,
      box: { x: 120, y: 10, w: 100, h: 100 },
      source: 'leaf_region',
      status: 'diseased',
      label: 'blast',
      confidence: 0.92,
      tier: 'high',
      abstain: null,
      margin: 0.75,
      entropy: 0.25,
      pNotRice: 0.02,
      color: { greenRatio: 0.7, brownRatio: 0.15, greyRatio: 0.1, meanSaturation: 0.55 },
    },
    {
      id: 3,
      box: { x: 230, y: 10, w: 100, h: 100 },
      source: 'leaf_region',
      status: 'uncertain',
      label: 'brown_spot',
      confidence: 0.52,
      tier: 'low',
      abstain: null,
      margin: 0.1,
      entropy: 0.8,
      pNotRice: 0.05,
      color: { greenRatio: 0.6, brownRatio: 0.2, greyRatio: 0.15, meanSaturation: 0.5 },
    },
    {
      id: 4,
      box: { x: 340, y: 10, w: 100, h: 100 },
      source: 'leaf_region',
      status: 'abstained',
      label: null,
      confidence: 0,
      tier: 'not_rice',
      abstain: 'not_rice',
      margin: 0,
      entropy: 1,
      pNotRice: 0.98,
      color: { greenRatio: 0.02, brownRatio: 0.1, greyRatio: 0.85, meanSaturation: 0.1 },
    },
  ],
}

describe('FieldRowCanvas component', () => {
  const dummyImage = new Image(800, 600)

  it('renders canvas element and accessible leaf-list with 4 leaves', () => {
    render(<FieldRowCanvas image={dummyImage} result={mockResult} lang="bn" />)

    const list = screen.getByTestId('leaf-list')
    expect(list).toBeInTheDocument()
    const items = list.querySelectorAll('li')
    expect(items.length).toBe(4)

    // Check status labels in Bangla
    expect(screen.getAllByText(/সুস্থ/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/রোগাক্রান্ত/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/অনিশ্চিত/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/বাদ দেওয়া হয়েছে/).length).toBeGreaterThanOrEqual(1)
  })

  it('displays leaf details when a diseased leaf is selected', () => {
    render(<FieldRowCanvas image={dummyImage} result={mockResult} lang="bn" />)

    const diseasedBtn = screen.getByTestId('leaf-item-2')
    fireEvent.click(diseasedBtn)

    // Blast disease card name in Bangla and high confidence
    const detail = screen.getByTestId('selected-leaf-detail')
    expect(within(detail).getByText(/ব্লাস্ট/)).toBeInTheDocument()
    expect(within(detail).getByText(/৯২%/)).toBeInTheDocument()
  })

  it('displays abstain notice when an abstained leaf is selected', () => {
    render(<FieldRowCanvas image={dummyImage} result={mockResult} lang="bn" />)

    const abstainedBtn = screen.getByTestId('leaf-item-4')
    fireEvent.click(abstainedBtn)

    // Abstain title from ABSTAIN_COPY.not_rice
    const detail = screen.getByTestId('selected-leaf-detail')
    expect(within(detail).getByText(/এটি ধানপাতা মনে হচ্ছে না/)).toBeInTheDocument()
  })
})
