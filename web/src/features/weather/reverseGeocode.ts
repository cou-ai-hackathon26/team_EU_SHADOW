import { roundCoord } from './location'

/**
 * Coordinates → local place name ("মিরপুর, ঢাকা", "দত্তপাড়া, সাভার, ঢাকা") for the Weather tab only.
 *
 * Uses OpenStreetMap Nominatim's free reverse endpoint with a plain fetch (no npm package, no key).
 * Coordinates are rounded to 2 decimals (~1 km) first, like the Open-Meteo request, and we store
 * nothing on any server. Called once per "অটো লোকেশন" tap (well within Nominatim's 1 req/s policy).
 * Place names © OpenStreetMap contributors (ODbL), credited in the Weather footer.
 * Returns null on any failure (offline, timeout, odd response); the caller then falls back to the
 * nearest division.
 */
export const REVERSE_GEOCODE_URL = 'https://nominatim.openstreetmap.org/reverse'
export const REVERSE_GEOCODE_TIMEOUT_MS = 5000

export interface NominatimAddress {
  suburb?: string
  neighbourhood?: string
  quarter?: string
  village?: string
  hamlet?: string
  town?: string
  city_district?: string
  city?: string
  county?: string
  state_district?: string
  state?: string
}

const SUFFIX = /\s*(Division|District|Subdistrict|Upazila|Metropolitan|City Corporation|বিভাগ|জেলা|উপজেলা|মহানগর|সিটি কর্পোরেশন)$/u

function clean(s: string | undefined): string {
  return (s ?? '').replace(SUFFIX, '').trim()
}

/** "area, sub-district, district" with duplicates removed (max 3 parts). Exported for tests. */
export function formatPlace(a: NominatimAddress | undefined | null): string | null {
  if (!a) return null
  const area = a.suburb || a.village || a.town || a.hamlet || a.neighbourhood || a.quarter || a.city_district
  const subDistrict = a.county
  const district = a.city || a.state_district || a.state
  const parts: string[] = []
  for (const p of [area, subDistrict, district].map(clean)) {
    if (p && !parts.some((q) => q.toLowerCase() === p.toLowerCase())) parts.push(p)
  }
  return parts.length ? parts.slice(0, 3).join(', ') : null
}

export async function reverseGeocode(
  lat: number,
  lon: number,
  lang: 'bn' | 'en',
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = setTimeout(() => ctrl?.abort(), REVERSE_GEOCODE_TIMEOUT_MS)
  try {
    const url =
      `${REVERSE_GEOCODE_URL}?format=jsonv2&zoom=14&addressdetails=1` +
      `&lat=${roundCoord(lat)}&lon=${roundCoord(lon)}&accept-language=${lang}`
    const res = await fetchImpl(url, ctrl ? { signal: ctrl.signal } : undefined)
    if (!res.ok) return null
    const data = (await res.json()) as { address?: NominatimAddress }
    return formatPlace(data.address)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
