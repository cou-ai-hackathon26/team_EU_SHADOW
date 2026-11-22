import { describe, it, expect, vi, beforeEach } from 'vitest'
import { warmModelCache, resetWarmModelCache } from './warmModelCache'

describe('F14 warmModelCache', () => {
  beforeEach(() => {
    resetWarmModelCache()
    vi.restoreAllMocks()
  })

  it('a. Online: fetches model_meta.json, agroleaf.onnx, and report.json once each and reads their bodies', async () => {
    const fetchedUrls: string[] = []
    const arrayBufferCalls: string[] = []

    const mockFetch = vi.fn().mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString()
      fetchedUrls.push(urlStr)
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => {
          arrayBufferCalls.push(urlStr)
          return new ArrayBuffer(8)
        },
      } as unknown as Response
    })

    const result = await warmModelCache({
      fetchFn: mockFetch as unknown as typeof fetch,
      online: true,
      saveData: false,
      baseUrl: '/custom-base/',
    })

    const expectedUrls = [
      '/custom-base/model/model_meta.json',
      '/custom-base/model/agroleaf.onnx',
      '/custom-base/model/report.json',
    ]

    expect(result.warmed).toEqual(expectedUrls)
    expect(result.skipped).toBeUndefined()
    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(fetchedUrls).toEqual(expectedUrls)
    expect(arrayBufferCalls).toEqual(expectedUrls)
  })

  it('b. online=false: makes no fetch and returns skipped "offline"', async () => {
    const mockFetch = vi.fn()

    const result = await warmModelCache({
      fetchFn: mockFetch,
      online: false,
      saveData: false,
    })

    expect(result.skipped).toBe('offline')
    expect(result.warmed).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('c. saveData=true: makes no fetch and returns skipped "save-data"', async () => {
    const mockFetch = vi.fn()

    const result = await warmModelCache({
      fetchFn: mockFetch,
      online: true,
      saveData: true,
    })

    expect(result.skipped).toBe('save-data')
    expect(result.warmed).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('d. One fetch rejects or returns ok:false: does not throw, still tries other files, lists only successful ones', async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString()
      if (urlStr.endsWith('agroleaf.onnx')) {
        return {
          ok: false,
          status: 404,
          arrayBuffer: async () => new ArrayBuffer(0),
        } as unknown as Response
      }
      if (urlStr.endsWith('report.json')) {
        throw new Error('Network error on report.json')
      }
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => new ArrayBuffer(8),
      } as unknown as Response
    })

    const result = await warmModelCache({
      fetchFn: mockFetch as unknown as typeof fetch,
      online: true,
      saveData: false,
      baseUrl: '',
    })

    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(result.warmed).toEqual(['/model/model_meta.json'])
    expect(result.skipped).toBeUndefined()
  })

  it('e. Calling it twice only warms once per page load (module-level guard)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(8),
    } as unknown as Response)

    const res1 = await warmModelCache({
      fetchFn: mockFetch,
      online: true,
      saveData: false,
    })

    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(res1.warmed).toHaveLength(3)

    const res2 = await warmModelCache({
      fetchFn: mockFetch,
      online: true,
      saveData: false,
    })

    expect(mockFetch).toHaveBeenCalledTimes(3) // no additional fetch calls
    expect(res2.warmed).toEqual(res1.warmed)
  })
})
