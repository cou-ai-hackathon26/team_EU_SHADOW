import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveWeatherCache,
  loadWeatherCache,
  WEATHER_CACHE_KEY_V2,
  type CachedWeatherV2,
} from './weatherCache'

describe('F16: Weather Cache V2 (weatherCache.ts)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('save/load round trip stores only rounded coordinates and recomputes assessment', () => {
    const sample: CachedWeatherV2 = {
      mode: 'gps',
      lat: 23.81234, // Should be saved rounded to 23.81
      lon: 90.41499, // Should be saved rounded to 90.41
      label: 'আপনার অবস্থান',
      hourly: {
        temperature_2m: Array(72).fill(25),
        relative_humidity_2m: Array(72).fill(92),
        precipitation: Array(72).fill(0),
      },
      fetchedAt: Date.now(),
    }

    saveWeatherCache(sample)

    // Check stored json directly to ensure coordinates are rounded
    const raw = localStorage.getItem(WEATHER_CACHE_KEY_V2)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.lat).toBe(23.81)
    expect(parsed.lon).toBe(90.41)

    const loaded = loadWeatherCache()
    expect(loaded).not.toBeNull()
    expect(loaded?.cached.mode).toBe('gps')
    expect(loaded?.cached.label).toBe('আপনার অবস্থান')
    expect(loaded?.isStale).toBe(false)
    expect(loaded?.assessment.diseases.length).toBeGreaterThan(0)
  })

  it('entries >= 24 h are reported stale', () => {
    const now = 1_700_000_000_000
    const olderThan24h = now - 25 * 60 * 60 * 1000

    const sample: CachedWeatherV2 = {
      mode: 'division',
      lat: 22.36,
      lon: 91.8,
      label: 'চট্টগ্রাম',
      hourly: {
        temperature_2m: Array(72).fill(25),
        relative_humidity_2m: Array(72).fill(70),
        precipitation: Array(72).fill(0),
      },
      fetchedAt: olderThan24h,
    }

    saveWeatherCache(sample)
    const loaded = loadWeatherCache(now)
    expect(loaded).not.toBeNull()
    expect(loaded?.isStale).toBe(true)
  })

  it('removes and ignores legacy agroleaf-weather-v1 cache', () => {
    localStorage.setItem('agroleaf-weather-v1', JSON.stringify({ old: true }))
    const loaded = loadWeatherCache()
    expect(loaded).toBeNull()
    expect(localStorage.getItem('agroleaf-weather-v1')).toBeNull()
  })

  it('corrupt JSON in v2 key returns null', () => {
    localStorage.setItem(WEATHER_CACHE_KEY_V2, '{corrupt JSON...')
    expect(loadWeatherCache()).toBeNull()
  })
})
