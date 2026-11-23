import { roundCoord } from './location'
import type { HourlyData } from './diseaseRisk'

export type { HourlyData }

export const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast'
export const TIMEOUT_MS = 6000

export async function fetchForecast(
  lat: number,
  lon: number,
  externalSignal?: AbortSignal,
): Promise<HourlyData> {
  const roundedLat = roundCoord(lat)
  const roundedLon = roundCoord(lon)
  const url = `${OPEN_METEO_BASE_URL}?latitude=${roundedLat}&longitude=${roundedLon}&hourly=temperature_2m,relative_humidity_2m,precipitation&forecast_hours=72&timezone=Asia%2FDhaka`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException('The user aborted a request.', 'AbortError'))
  }, TIMEOUT_MS)

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason)
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(externalSignal.reason))
    }
  }

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP error: ${res.status}`)
    }
    const data = await res.json()
    if (
      !data ||
      typeof data !== 'object' ||
      !data.hourly ||
      !Array.isArray(data.hourly.temperature_2m) ||
      !Array.isArray(data.hourly.relative_humidity_2m) ||
      !Array.isArray(data.hourly.precipitation)
    ) {
      throw new Error('Malformed Open-Meteo response body')
    }

    return {
      time: Array.isArray(data.hourly.time) ? data.hourly.time : undefined,
      temperature_2m: data.hourly.temperature_2m,
      relative_humidity_2m: data.hourly.relative_humidity_2m,
      precipitation: data.hourly.precipitation,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}
