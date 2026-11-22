import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadReport } from './loadReport'
import sampleReport from './__fixtures__/report.sample.json'
import sampleMeta from './__fixtures__/model_meta.sample.json'

describe('loadReport', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches /model/report.json and /model/model_meta.json and returns both parsed', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/model/report.json')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => sampleReport,
        } as Response)
      }
      if (url.includes('/model/model_meta.json')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => sampleMeta,
        } as Response)
      }
      return Promise.resolve({ ok: false, status: 404 } as Response)
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await loadReport()

    expect(result.status).toBe('loaded')
    if (result.status === 'loaded') {
      expect(result.report.modelVersion).toBe('SAMPLE-FOR-TESTS')
      expect(result.meta.version).toBe('SAMPLE-FOR-TESTS')
    }
  })

  it('returns { status: "missing" } when report.json is 404 without crashing', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/model/report.json')) {
        return Promise.resolve({ ok: false, status: 404 } as Response)
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => sampleMeta,
      } as Response)
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await loadReport()
    expect(result.status).toBe('missing')
  })

  it('returns { status: "missing" } when model_meta.json is 404 without crashing', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/model/model_meta.json')) {
        return Promise.resolve({ ok: false, status: 404 } as Response)
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => sampleReport,
      } as Response)
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await loadReport()
    expect(result.status).toBe('missing')
  })

  it('returns { status: "missing" } when fetch throws network error without crashing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network failure or offline')),
    )

    const result = await loadReport()
    expect(result.status).toBe('missing')
  })
})
