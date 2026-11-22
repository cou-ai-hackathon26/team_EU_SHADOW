import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveWeatherCache,
  loadWeatherCache,
  WEATHER_CACHE_KEY,
  type CachedWeather,
} from './weatherCache'

describe('F16: Weather Cache (weatherCache.ts)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('save/load round trip', () => {
    const sample: CachedWeather = {
      divisionId: 'dhaka',
      hourly: {
        relative_humidity_2m: [80, 90],
        temperature_2m: [25, 26],
        precipitation: [0, 0.5],
      },
      assessment: {
        level: 'medium',
        humidHours: 10,
        rainyHours: 2,
      },
      fetchedAt: Date.now(),
    }

    saveWeatherCache(sample)
    const loaded = loadWeatherCache()
    expect(loaded).not.toBeNull()
    expect(loaded?.cached.divisionId).toBe('dhaka')
    expect(loaded?.cached.assessment.level).toBe('medium')
    expect(loaded?.isStale).toBe(false)
  })

  it('entries >= 24 h are reported stale', () => {
    const now = 1_700_000_000_000
    const olderThan24h = now - 25 * 60 * 60 * 1000

    const sample: CachedWeather = {
      divisionId: 'chattogram',
      hourly: {
        relative_humidity_2m: [70],
        temperature_2m: [28],
        precipitation: [0],
      },
      assessment: {
        level: 'low',
        humidHours: 0,
        rainyHours: 0,
      },
      fetchedAt: olderThan24h,
    }

    saveWeatherCache(sample)
    const loaded = loadWeatherCache(now)
    expect(loaded).not.toBeNull()
    expect(loaded?.isStale).toBe(true)
  })

  it('corrupt JSON returns null', () => {
    localStorage.setItem(WEATHER_CACHE_KEY, '{invalid json corrupted...')
    expect(loadWeatherCache()).toBeNull()
  })
})
