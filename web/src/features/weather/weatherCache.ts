import { roundCoord } from './location'
import { assessDiseases, type AssessmentOutput, type HourlyData } from './diseaseRisk'

export const WEATHER_CACHE_KEY_V2 = 'agroleaf-weather-v2'
export const LEGACY_WEATHER_CACHE_KEY = 'agroleaf-weather-v1'
export const WEATHER_MODE_KEY = 'agroleaf-weather-mode'
export const WEATHER_DIVISION_KEY = 'agroleaf-weather-division'
export const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000 // 24 hours

export interface CachedWeatherV2 {
  mode: 'gps' | 'division'
  lat: number
  lon: number
  label: string
  hourly: HourlyData
  fetchedAt: number
}

export interface CachedWeatherV2Result {
  cached: CachedWeatherV2
  assessment: AssessmentOutput
  isStale: boolean
}

export function saveWeatherCache(entry: CachedWeatherV2): void {
  try {
    const sanitized: CachedWeatherV2 = {
      ...entry,
      lat: roundCoord(entry.lat),
      lon: roundCoord(entry.lon),
    }
    localStorage.setItem(WEATHER_CACHE_KEY_V2, JSON.stringify(sanitized))
  } catch {
    // localStorage full or disabled
  }
}

export function loadWeatherCache(now = Date.now()): CachedWeatherV2Result | null {
  try {
    // Ignore and remove legacy cache if present
    if (localStorage.getItem(LEGACY_WEATHER_CACHE_KEY)) {
      localStorage.removeItem(LEGACY_WEATHER_CACHE_KEY)
    }

    const raw = localStorage.getItem(WEATHER_CACHE_KEY_V2)
    if (!raw) return null

    const parsed = JSON.parse(raw) as CachedWeatherV2
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.lat !== 'number' ||
      typeof parsed.lon !== 'number' ||
      typeof parsed.fetchedAt !== 'number' ||
      !parsed.hourly
    ) {
      return null
    }

    const isStale = now - parsed.fetchedAt >= STALE_THRESHOLD_MS
    const assessment = assessDiseases(parsed.hourly)

    return {
      cached: parsed,
      assessment,
      isStale,
    }
  } catch {
    return null
  }
}

export function clearWeatherCache(): void {
  try {
    localStorage.removeItem(WEATHER_CACHE_KEY_V2)
    localStorage.removeItem(LEGACY_WEATHER_CACHE_KEY)
  } catch {
    // ignore
  }
}
