import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchForecast } from './openMeteo'

describe('F16: Open-Meteo API Client (openMeteo.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('builds the exact URL with rounded coords and forecast_hours=72', async () => {
    const lat = 23.8123
    const lon = 90.4149
    const expectedUrl =
      'https://api.open-meteo.com/v1/forecast?latitude=23.81&longitude=90.41&hourly=temperature_2m,relative_humidity_2m,precipitation&forecast_hours=72&timezone=Asia%2FDhaka'

    const mockResponse = {
      ok: true,
      json: async () => ({
        hourly: {
          time: Array(72).fill('2026-11-23T00:00'),
          temperature_2m: Array(72).fill(25),
          relative_humidity_2m: Array(72).fill(80),
          precipitation: Array(72).fill(0),
        },
      }),
    }

    const fetchSpy = vi.fn().mockResolvedValue(mockResponse as Response)
    vi.stubGlobal('fetch', fetchSpy)

    const result = await fetchForecast(lat, lon)

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const calledUrl = fetchSpy.mock.calls[0][0]
    expect(calledUrl).toBe(expectedUrl)
    expect(result).not.toBeNull()
    expect(result?.relative_humidity_2m.length).toBe(72)
  })

  it('aborts after the timeout', async () => {
    vi.useFakeTimers()
    const abortSpy = vi.fn()

    const fetchSpy = vi.fn().mockImplementation((_url: string, opts?: { signal?: AbortSignal }) => {
      opts?.signal?.addEventListener('abort', abortSpy)
      return new Promise((_resolve, reject) => {
        opts?.signal?.addEventListener('abort', () => {
          reject(new DOMException('The user aborted a request.', 'AbortError'))
        })
      })
    })
    vi.stubGlobal('fetch', fetchSpy)

    const promise = fetchForecast(23.81, 90.41)
    const rejectionExpectation = expect(promise).rejects.toThrow()

    // Advance beyond 6000ms timeout
    vi.advanceTimersByTime(6001)

    await rejectionExpectation
    expect(abortSpy).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('rejects a malformed body', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        hourly: {
          relative_humidity_2m: [80, 85],
        },
      }),
    } as Response)
    vi.stubGlobal('fetch', fetchSpy)

    await expect(fetchForecast(23.81, 90.41)).rejects.toThrow(/malformed/i)
  })
})
