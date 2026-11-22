import type { HourlyData } from './openMeteo'
import type { RiskAssessment } from './risk'

export const WEATHER_CACHE_KEY = 'agroleaf-weather-v1'
export const DIVISION_STORAGE_KEY = 'agroleaf-weather-division'
export const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000 // 24 hours

export interface CachedWeather {
  divisionId: string
  hourly: HourlyData
  assessment: RiskAssessment
  fetchedAt: number
}

export interface CachedWeatherResult {
  cached: CachedWeather
  isStale: boolean
}

export function saveWeatherCache(entry: CachedWeather): void {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(entry))
  } catch {
    // localStorage full or disabled, silently fail
  }
}

export function loadWeatherCache(now = Date.now()): CachedWeatherResult | null {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedWeather
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.divisionId !== 'string' ||
      typeof parsed.fetchedAt !== 'number' ||
      !parsed.assessment
    ) {
      return null
    }

    const isStale = (now - parsed.fetchedAt) >= STALE_THRESHOLD_MS
    return {
      cached: parsed,
      isStale,
    }
  } catch {
    return null
  }
}

export function clearWeatherCache(): void {
  try {
    localStorage.removeItem(WEATHER_CACHE_KEY)
  } catch {
    // ignore
  }
}

export function getStoredDivision(): string | null {
  try {
    return localStorage.getItem(DIVISION_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setStoredDivision(divisionId: string): void {
  try {
    localStorage.setItem(DIVISION_STORAGE_KEY, divisionId)
  } catch {
    // ignore
  }
}
