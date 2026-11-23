import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import WeatherScreen from './WeatherScreen'
import { formatPlace, reverseGeocode } from './reverseGeocode'
import { WEATHER_CACHE_KEY_V2 } from './weatherCache'

const hourly = {
  hourly: {
    time: Array(72).fill('2026-11-23T00:00'),
    temperature_2m: Array(72).fill(25),
    relative_humidity_2m: Array(72).fill(92),
    precipitation: Array(72).fill(0),
  },
}

function stubGps(lat = 23.80689, lon = 90.36872) {
  const geo = {
    getCurrentPosition: vi.fn((ok: PositionCallback) =>
      ok({ coords: { latitude: lat, longitude: lon, accuracy: 30 }, timestamp: Date.now() } as unknown as GeolocationPosition),
    ),
  }
  vi.stubGlobal('navigator', { ...navigator, geolocation: geo, onLine: true })
}

function stubFetch(place: object | 'fail') {
  const spy = vi.fn(async (url: string) => {
    if (url.includes('nominatim')) {
      if (place === 'fail') throw new Error('offline')
      return { ok: true, json: async () => place } as Response
    }
    return { ok: true, json: async () => hourly } as Response
  })
  vi.stubGlobal('fetch', spy)
  return spy
}

describe('formatPlace / reverseGeocode', () => {
  it('builds "area, sub-district, district" and drops suffixes and duplicates', () => {
    // Real Nominatim answers (23.81, 90.37) and (23.87, 90.32)
    expect(formatPlace({ suburb: 'মিরপুর', quarter: 'মিরপুর ১০', city: 'ঢাকা', county: 'ঢাকা মহানগর', state_district: 'ঢাকা জেলা', state: 'ঢাকা বিভাগ' })).toBe('মিরপুর, ঢাকা')
    expect(formatPlace({ suburb: 'Mirpur', city: 'Dhaka', county: 'Dhaka Metropolitan', state_district: 'Dhaka District' })).toBe('Mirpur, Dhaka')
    expect(formatPlace({ village: 'Dattapara', county: 'Savar Subdistrict', state_district: 'Dhaka District', state: 'Dhaka Division' })).toBe('Dattapara, Savar, Dhaka')
    expect(formatPlace({ village: 'আশুলিয়া', county: 'সাভার উপজেলা', state_district: 'ঢাকা জেলা' })).toBe('আশুলিয়া, সাভার, ঢাকা')
    expect(formatPlace({})).toBeNull()
    expect(formatPlace(undefined)).toBeNull()
  })

  it('sends only rounded coordinates (2 decimals) and the UI language', async () => {
    const f = vi.fn(async () => ({ ok: true, json: async () => ({ address: { suburb: 'Mirpur', city: 'Dhaka' } }) }) as Response)
    expect(await reverseGeocode(23.80689, 90.36872, 'en', f as unknown as typeof fetch)).toBe('Mirpur, Dhaka')
    const url = (f.mock.calls[0] as unknown as [string])[0]
    expect(url).toContain('lat=23.81')
    expect(url).toContain('lon=90.37')
    expect(url).toContain('accept-language=en')
    expect(url).not.toContain('23.8068')
  })

  it('returns null when offline or the service fails', async () => {
    const f = vi.fn(async () => {
      throw new Error('offline')
    })
    expect(await reverseGeocode(23.8, 90.4, 'bn', f as unknown as typeof fetch)).toBeNull()
    const bad = vi.fn(async () => ({ ok: false, json: async () => ({}) }) as Response)
    expect(await reverseGeocode(23.8, 90.4, 'bn', bad as unknown as typeof fetch)).toBeNull()
  })
})

describe('Weather tab auto-location', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('shows "বর্তমান অবস্থান: মিরপুর, ঢাকা" and uses it for weather and crop rotation', async () => {
    stubGps()
    const spy = stubFetch({ address: { suburb: 'মিরপুর', city: 'ঢাকা', county: 'ঢাকা মহানগর', state: 'ঢাকা বিভাগ' } })
    render(<WeatherScreen />)

    const place = await screen.findByTestId('current-place')
    await waitFor(() => expect(place).toHaveTextContent('বর্তমান অবস্থান: মিরপুর, ঢাকা'))

    // Forecast and geocoding both got the rounded GPS point.
    const urls = spy.mock.calls.map((c) => String(c[0]))
    expect(urls.some((u) => u.includes('open-meteo') && u.includes('latitude=23.81') && u.includes('longitude=90.37'))).toBe(true)
    expect(urls.some((u) => u.includes('nominatim') && u.includes('lat=23.81') && u.includes('accept-language=bn'))).toBe(true)

    // Weather tiles rendered for that point, and the crop rotation card names the exact area.
    expect(await screen.findByText(/সর্বোচ্চ আর্দ্রতা/)).toBeInTheDocument()
    const rotation = screen.getByRole('heading', { name: 'ফসল চক্র পরামর্শ' }).closest('section') as HTMLElement
    expect(within(rotation).getByText(/মিরপুর, ঢাকা •/)).toBeInTheDocument()

    // The cached label is the area name (coordinates stay rounded).
    await waitFor(() => expect(JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY_V2) || '{}').label).toBe('মিরপুর, ঢাকা'))
    expect(JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY_V2) || '{}').lat).toBe(23.81)
  })

  it('falls back gracefully when the area name cannot be found (offline geocoder)', async () => {
    stubGps(24.37, 88.6)
    stubFetch('fail')
    render(<WeatherScreen />)
    expect(await screen.findByText('আপনার অবস্থান')).toBeInTheDocument()
    const rotation = (await screen.findByRole('heading', { name: 'ফসল চক্র পরামর্শ' })).closest('section') as HTMLElement
    // Nearest division is used for crop rotation instead.
    await waitFor(() => expect(within(rotation).getByText(/রাজশাহী •/)).toBeInTheDocument())
  })

  it('the button is labelled "অটো লোকেশন"', async () => {
    stubGps()
    stubFetch({ address: { suburb: 'মিরপুর', city: 'ঢাকা' } })
    render(<WeatherScreen />)
    expect(screen.getByRole('button', { name: /অটো লোকেশন/ })).toBeInTheDocument()
  })
})
