import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import AccuracyScreen from './AccuracyScreen'
import sampleReport from './__fixtures__/report.sample.json'
import sampleNotRiceReport from './__fixtures__/report.notrice.sample.json'
import sampleMeta from './__fixtures__/model_meta.sample.json'

function mockSuccessfulFetch(metaOverride = {}, reportOverride = {}) {
  const meta = { ...sampleMeta, ...metaOverride }
  const report = { ...sampleReport, ...reportOverride }
  const fetchMock = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/model/report.json')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => report,
      } as Response)
    }
    if (url.includes('/model/model_meta.json')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => meta,
      } as Response)
    }
    return Promise.resolve({ ok: false, status: 404 } as Response)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function mockNotRiceFetch(metaOverride = {}) {
  const meta = { ...sampleMeta, ...metaOverride }
  const fetchMock = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/model/report.json')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => sampleNotRiceReport,
      } as Response)
    }
    if (url.includes('/model/model_meta.json')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => meta,
      } as Response)
    }
    return Promise.resolve({ ok: false, status: 404 } as Response)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('AccuracyScreen & HowItWorks', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows "লোড হচ্ছে…" while loading', () => {
    // Hang fetch promise so it remains in loading state
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    render(<AccuracyScreen />)
    expect(screen.getByText(/লোড হচ্ছে…/)).toBeInTheDocument()
  })

  it('shows "মডেলের ফলাফল শীঘ্রই আসছে" and How-it-works when report files are missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response),
    )
    render(<AccuracyScreen />)

    expect(
      await screen.findByText(/মডেলের ফলাফল শীঘ্রই আসছে/),
    ).toBeInTheDocument()

    // How-it-works explanation must still be present with an h2
    const h2 = screen.getByRole('heading', { level: 2, name: /কীভাবে কাজ করে/i })
    expect(h2).toBeInTheDocument()
    expect(screen.getAllByText(/২২৪×২২৪/).length).toBeGreaterThan(0)
    expect(screen.getByText(/ফোন থেকে বাইরে যায় না/)).toBeInTheDocument()
  })

  it('shows accuracy and macro-F1 as Bangla-digit percentages with one decimal, and test count n', async () => {
    mockSuccessfulFetch()
    render(<AccuracyScreen />)

    // 0.8423 -> "৮৪.২%"
    expect(await screen.findByText(/৮৪\.২%/)).toBeInTheDocument()
    // 0.8351 -> "৮৩.৫%"
    expect(screen.getByText(/৮৩\.৫%/)).toBeInTheDocument()
    // n = 600 -> "৬০০" in stat cards
    expect(screen.getAllByText('৬০০').length).toBeGreaterThan(0)
  })

  it('shows "শূন্য থেকে প্রশিক্ষিত মডেল" when trainedFromScratch is true', async () => {
    mockSuccessfulFetch({ trainedFromScratch: true })
    render(<AccuracyScreen />)

    expect(
      await screen.findByText('শূন্য থেকে প্রশিক্ষিত মডেল'),
    ).toBeInTheDocument()
  })

  it('shows exactly "Temporary Prototype — Pretrained Model" in a warning style when trainedFromScratch is false', async () => {
    mockSuccessfulFetch({ trainedFromScratch: false })
    render(<AccuracyScreen />)

    const warningBadge = await screen.findByText(
      'Temporary Prototype — Pretrained Model',
    )
    expect(warningBadge).toBeInTheDocument()
  })

  it('renders confusion matrix as an accessible table with Bangla class names as row and column headers and highlighted diagonal', async () => {
    mockSuccessfulFetch()
    const { container } = render(<AccuracyScreen />)

    // Tables present
    const tables = await screen.findAllByRole('table')
    expect(tables.length).toBeGreaterThanOrEqual(1)

    // Row & Column guidance
    expect(screen.getAllByText(/আসল রোগ/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/মডেলের উত্তর/).length).toBeGreaterThan(0)

    // Bangla class headers in matrix
    expect(screen.getAllByText('সুস্থ').length).toBeGreaterThan(0)
    expect(screen.getAllByText('ব্লাস্ট').length).toBeGreaterThan(0)
    expect(screen.getAllByText('বাদামি দাগ').length).toBeGreaterThan(0)
    expect(screen.getAllByText('লিফ স্মাট').length).toBeGreaterThan(0)
    expect(screen.getAllByText('টুংরো').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText('খোল পোড়া (শীথ ব্লাইট)').length,
    ).toBeGreaterThan(0)

    // Diagonal elements highlighted
    const diagonalCells = container.querySelectorAll('td[data-diagonal="true"]')
    expect(diagonalCells.length).toBe(6)
    expect(diagonalCells[0]).toHaveTextContent('৯০')
  })

  it('renders per-class table with precision, recall, F1, support', async () => {
    mockSuccessfulFetch()
    render(<AccuracyScreen />)

    expect(await screen.findByText(/শ্রেণীভিত্তিক ফলাফল/)).toBeInTheDocument()
    expect(screen.getByText('প্রিসিশন')).toBeInTheDocument()
    expect(screen.getByText('রিকল')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'এফ১' })).toBeInTheDocument()
    expect(screen.getByText('নমুনার সংখ্যা')).toBeInTheDocument()
  })

  it('renders tier table with coverage and accuracy for high / medium / low / not_rice with Bangla labels', async () => {
    mockSuccessfulFetch()
    render(<AccuracyScreen />)

    expect(await screen.findByText('নিশ্চিত')).toBeInTheDocument()
    expect(screen.getByText('দুটি সম্ভাবনা')).toBeInTheDocument()
    expect(screen.getByText('আমি নিশ্চিত নই')).toBeInTheDocument()
    expect(screen.getByText('ধানপাতা নয়')).toBeInTheDocument()
  })

  it('renders limitations list in Bangla and dataset credit with name, license, and link', async () => {
    mockSuccessfulFetch()
    render(<AccuracyScreen />)

    // Limitation text
    expect(
      await screen.findByText(
        /অতিরিক্ত আলো বা গভীর ছায়ায় তোলা ছবিতে ফলাফলের নির্ভুলতা কমতে পারে।/,
      ),
    ).toBeInTheDocument()

    // Dataset credit
    expect(screen.getByText(/RiceLeafDiseaseBD v3/)).toBeInTheDocument()
    expect(screen.getByText(/CC BY 4.0/)).toBeInTheDocument()

    const link = screen.getByRole('link', { name: /RiceLeafDiseaseBD v3/i })
    expect(link).toHaveAttribute(
      'href',
      'https://doi.org/10.17632/86s4jzj2m4.3',
    )
  })

  it('renders HowItWorks component explaining pipeline with h2 and client-side privacy', async () => {
    mockSuccessfulFetch()
    render(<AccuracyScreen />)

    const heading = await screen.findByRole('heading', {
      level: 2,
      name: /কীভাবে কাজ করে/i,
    })
    expect(heading).toBeInTheDocument()

    // Explains photo -> preprocessing (224x224) -> browser -> calibrated confidence -> 4 tiers -> photo never leaves phone
    expect(screen.getByText(/ছবি তোলা/)).toBeInTheDocument()
    expect(screen.getAllByText(/২২৪×২২৪/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/ব্রাউজারে/).length).toBeGreaterThan(0)
    expect(screen.getByText(/ক্যালিব্রেটেড/)).toBeInTheDocument()
    expect(screen.getAllByText(/৪টি/).length).toBeGreaterThan(0)
    expect(screen.getByText(/ফোন থেকে বাইরে যায় না/)).toBeInTheDocument()
  })

  describe('F12 not-rice section (M3 integration)', () => {
    it('when report.notRice exists: renders section with heading "ধানপাতা নয় যাচাই", test rejection %, false reject %, and macro-F1 with/without gate', async () => {
      mockNotRiceFetch()
      render(<AccuracyScreen />)

      const heading = await screen.findByRole('heading', {
        level: 2,
        name: /ধানপাতা নয় যাচাই/i,
      })
      expect(heading).toBeInTheDocument()

      // notRiceTestRejected: 0.952 -> ৯৫.২%
      expect(screen.getByText(/৯৫\.২%/)).toBeInTheDocument()
      // riceTestFalseReject: 0.024 -> ২.৪%
      expect(screen.getByText(/২\.৪%/)).toBeInTheDocument()
      // macroF1SixClassBase: 0.884 -> ৮৮.৪%
      expect(screen.getByText(/৮৮\.৪%/)).toBeInTheDocument()
      // macroF1SixClassWithGate: 0.892 -> ৮৯.২%
      expect(screen.getByText(/৮৯\.২%/)).toBeInTheDocument()
    })

    it('lists every source with its licence and a link with target="_blank" and rel="noreferrer"', async () => {
      mockNotRiceFetch()
      render(<AccuracyScreen />)

      await screen.findByRole('heading', {
        level: 2,
        name: /ধানপাতা নয় যাচাই/i,
      })

      // Source 1
      const link1 = screen.getByRole('link', {
        name: /Kaggle Rice Weed & Non-rice Leaves/i,
      })
      expect(link1).toHaveAttribute('href', 'https://example.com/non-rice-source-1')
      expect(link1).toHaveAttribute('target', '_blank')
      expect(link1.getAttribute('rel')).toContain('noreferrer')
      expect(screen.getByText(/CC BY-SA 4.0/)).toBeInTheDocument()

      // Source 2
      const link2 = screen.getByRole('link', {
        name: /PlantVillage Non-Rice Subset/i,
      })
      expect(link2).toHaveAttribute('href', 'https://example.com/non-rice-source-2')
      expect(link2).toHaveAttribute('target', '_blank')
      expect(link2.getAttribute('rel')).toContain('noreferrer')
      expect(screen.getByText(/CC0 1.0/)).toBeInTheDocument()
    })

    it('shows bd5GateOnly note as a small honest disclosure line when present', async () => {
      mockNotRiceFetch()
      render(<AccuracyScreen />)

      expect(
        await screen.findByText(
          /বি\.দ্র\. BD5 এক্সটার্নাল টেস্ট সেটে গেট ব্যবহারে সামান্য মিথ্যা বাতিল হতে পারে।/,
        ),
      ).toBeInTheDocument()
    })

    it('does NOT render the "ধানপাতা নয় যাচাই" section when report.notRice is absent', async () => {
      mockSuccessfulFetch() // standard report without notRice
      render(<AccuracyScreen />)

      // Wait for page to load
      await screen.findByText(/সার্বিক নির্ভুলতা/)
      expect(
        screen.queryByRole('heading', {
          level: 2,
          name: /ধানপাতা নয় যাচাই/i,
        }),
      ).not.toBeInTheDocument()
    })

    it('renders 7-class confusion matrix (including not_rice) with Bangla name "ধানপাতা নয়" for row and column headers', async () => {
      mockNotRiceFetch()
      render(<AccuracyScreen />)

      await screen.findByRole('heading', {
        level: 2,
        name: /ধানপাতা নয় যাচাই/i,
      })

      // Both rowheader and columnheader with "ধানপাতা নয়" must exist in the confusion matrix table
      const colHeader = screen.getByRole('columnheader', {
        name: 'ধানপাতা নয়',
      })
      expect(colHeader).toBeInTheDocument()

      const rowHeader = screen.getByRole('rowheader', {
        name: 'ধানপাতা নয়',
      })
      expect(rowHeader).toBeInTheDocument()
    })
  })
})
