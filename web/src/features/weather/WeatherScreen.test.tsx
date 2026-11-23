import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import WeatherScreen from './WeatherScreen'
import { saveWeatherCache, WEATHER_CACHE_KEY_V2 } from './weatherCache'
import { BANNED_PATTERNS } from '../../content/content.test'
import { LanguageToggle, STORAGE_KEY, resetGlobalLang } from '../../i18n/useT'

const hourly = (rh = 92, rain = 0) => ({
  time: Array(72).fill('2026-11-23T00:00'),
  temperature_2m: Array(72).fill(25),
  relative_humidity_2m: Array(72).fill(rh),
  precipitation: Array(72).fill(rain),
})

function okGeo(lat = 23.81234, lon = 90.41499) {
  return {
    getCurrentPosition: vi.fn((ok: PositionCallback) =>
      ok({ coords: { latitude: lat, longitude: lon, accuracy: 50 }, timestamp: Date.now() } as unknown as GeolocationPosition),
    ),
  }
}
const deniedGeo = () => ({
  getCurrentPosition: vi.fn((_ok: PositionCallback, err?: PositionErrorCallback) =>
    err?.({ code: 1, message: 'denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError),
  ),
})

/** Open-Meteo → forecast; Nominatim → area name in the requested language. */
function stubFetch(names: { bn?: string; en?: string } | 'fail' = { bn: 'মতিঝিল, ঢাকা', en: 'Motijheel, Dhaka' }) {
  const spy = vi.fn(async (url: string) => {
    if (String(url).includes('nominatim')) {
      if (names === 'fail') throw new Error('offline')
      const en = String(url).includes('accept-language=en')
      const n = en ? names.en : names.bn
      const [area, district] = (n ?? '').split(', ')
      return { ok: true, json: async () => ({ address: { suburb: area, city: district } }) } as Response
    }
    return { ok: true, json: async () => ({ hourly: hourly() }) } as Response
  })
  vi.stubGlobal('fetch', spy)
  return spy
}

function cacheFresh() {
  saveWeatherCache({ mode: 'gps', lat: 23.81, lon: 90.41, label: 'gps', hourly: hourly(), fetchedAt: Date.now() - 3600 * 1000 })
}

describe('F16: WeatherScreen', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    act(() => resetGlobalLang())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('GPS success: rounded coords, disease list, and the area name next to the Auto Location button', async () => {
    vi.stubGlobal('navigator', { ...navigator, geolocation: okGeo(), onLine: true })
    const spy = stubFetch()
    render(<WeatherScreen />)

    const pill = await screen.findByTestId('current-place')
    await waitFor(() => expect(pill).toHaveTextContent('বর্তমান অবস্থান: মতিঝিল, ঢাকা'))
    // The pill sits right beside the Auto Location button.
    expect(screen.getByRole('button', { name: /অটো লোকেশন/ }).parentElement).toContainElement(pill)

    const meteo = spy.mock.calls.map((c) => String(c[0])).find((u) => u.includes('open-meteo')) as string
    expect(meteo).toContain('latitude=23.81')
    expect(meteo).toContain('longitude=90.41')
    expect(screen.getAllByText(/ঝুঁকি: বেশি|ঝুঁকি: মাঝারি|ঝুঁকি: কম/).length).toBeGreaterThan(0)
    expect(screen.getByText('আবহাওয়া দিয়ে বলা যায় না')).toBeInTheDocument()

    const stored = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY_V2) || '{}')
    expect(stored.lat).toBe(23.81)
    expect(stored.lon).toBe(90.41)
  })

  it('the manual division dropdown is gone; only the old title line is not used for the place', async () => {
    vi.stubGlobal('navigator', { ...navigator, geolocation: okGeo(), onLine: true })
    stubFetch()
    render(<WeatherScreen />)
    await screen.findByTestId('current-place')
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.queryByText(/বিভাগ বেছে নিন/)).toBeNull()
    // The place is shown once, in the pill (not as small text under the title).
    await waitFor(() => expect(screen.getAllByText(/মতিঝিল, ঢাকা/)).toHaveLength(2)) // pill + crop rotation card
    const heading = screen.getByRole('heading', { name: 'আবহাওয়া ও রোগ-ঝুঁকি' })
    expect(heading.parentElement?.textContent).not.toMatch(/মতিঝিল/)
  })

  it('GPS denied: falls back to "ঢাকা, বাংলাদেশ" and fetches Dhaka weather', async () => {
    vi.stubGlobal('navigator', { ...navigator, geolocation: deniedGeo(), onLine: true })
    const spy = stubFetch()
    render(<WeatherScreen />)
    expect(await screen.findByText(/অবস্থান পাওয়া যায়নি — ঢাকার আবহাওয়া দেখানো হচ্ছে/)).toBeInTheDocument()
    expect(screen.getByTestId('current-place')).toHaveTextContent('বর্তমান অবস্থান: ঢাকা, বাংলাদেশ')
    await waitFor(() => expect(spy.mock.calls.some((c) => String(c[0]).includes('open-meteo') && String(c[0]).includes('latitude=23.81'))).toBe(true))
    expect(spy.mock.calls.some((c) => String(c[0]).includes('nominatim'))).toBe(false)
  })

  it('while detecting, the pill already shows the Dhaka fallback', () => {
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: vi.fn() }, onLine: true })
    stubFetch()
    render(<WeatherScreen />)
    expect(screen.getByTestId('current-place')).toHaveTextContent('বর্তমান অবস্থান: ঢাকা, বাংলাদেশ')
  })

  it('offline + fresh cache: cached list with "ইন্টারনেট নেই — শেষ আপডেট:"', async () => {
    vi.stubGlobal('navigator', { ...navigator, geolocation: deniedGeo(), onLine: false })
    const spy = stubFetch()
    cacheFresh()
    render(<WeatherScreen />)
    expect(await screen.findByText(/ইন্টারনেট নেই — শেষ আপডেট:/)).toBeInTheDocument()
    expect(screen.getAllByText(/ঝুঁকি:/).length).toBeGreaterThan(0)
    expect(spy.mock.calls.some((c) => String(c[0]).includes('open-meteo'))).toBe(false)
  })

  it('offline + no cache: "এখন আবহাওয়ার তথ্য পাওয়া যাচ্ছে না।" and no risk badges', async () => {
    vi.stubGlobal('navigator', { ...navigator, geolocation: deniedGeo(), onLine: false })
    stubFetch()
    render(<WeatherScreen />)
    expect(await screen.findByText('এখন আবহাওয়ার তথ্য পাওয়া যাচ্ছে না।')).toBeInTheDocument()
    expect(screen.queryByText(/ঝুঁকি: বেশি|ঝুঁকি: মাঝারি|ঝুঁকি: কম/)).not.toBeInTheDocument()
  })

  it('fresh cache + GPS never answers: cached list is visible on the first render', () => {
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: vi.fn() }, onLine: true })
    stubFetch()
    cacheFresh()
    render(<WeatherScreen />)
    expect(screen.getByText('ব্লাস্ট রোগ')).toBeInTheDocument()
    expect(screen.getByText('ধানের প্রধান রোগসমূহের পূর্বাভাসভিত্তিক ঝুঁকি')).toBeInTheDocument()
  })

  it('footer: disclaimer, Open-Meteo and OpenStreetMap credits', () => {
    vi.stubGlobal('navigator', { ...navigator, geolocation: deniedGeo(), onLine: false })
    stubFetch()
    render(<WeatherScreen />)
    expect(screen.getByText('* এটি আনুমানিক সতর্কতা, নিশ্চিত রোগ নির্ণয় নয়।')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Open-Meteo\.com/i })).toHaveAttribute('href', 'https://open-meteo.com')
    expect(screen.getByRole('link', { name: /OpenStreetMap/ })).toHaveAttribute('href', 'https://www.openstreetmap.org/copyright')
  })

  it('zero pesticide or chemical names on the screen', () => {
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: vi.fn() }, onLine: true })
    stubFetch()
    cacheFresh()
    const { container } = render(<WeatherScreen />)
    for (const pattern of BANNED_PATTERNS) expect(container.textContent || '').not.toMatch(pattern)
  })

  it('localStorage throws: still renders the title and the Auto Location button', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: vi.fn() }, onLine: true })
    stubFetch()
    render(<WeatherScreen />)
    expect(screen.getByRole('heading', { name: /রোগ-ঝুঁকি/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /অটো লোকেশন/ })).toBeInTheDocument()
  })
})

describe('F16: WeatherScreen in English (বাং ↔ EN)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    act(() => resetGlobalLang())
  })
  afterEach(() => vi.unstubAllGlobals())

  const BANGLA = /[ঀ-৿]/

  it('toggling to EN translates the whole Weather screen, including the area name and crop rotation', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('navigator', { ...navigator, geolocation: okGeo(), onLine: true })
    stubFetch({ bn: 'মতিঝিল, ঢাকা', en: 'Motijheel, Dhaka' })
    const { container } = render(
      <>
        <LanguageToggle />
        <WeatherScreen />
      </>,
    )
    await waitFor(() => expect(screen.getByTestId('current-place')).toHaveTextContent('মতিঝিল, ঢাকা'))
    await screen.findByText('ব্লাস্ট রোগ')

    await user.click(screen.getByRole('button', { name: /ভাষা পরিবর্তন/ }))

    await waitFor(() => expect(screen.getByTestId('current-place')).toHaveTextContent('Current Location: Motijheel, Dhaka'))
    expect(screen.getByRole('heading', { name: 'Weather & Disease Risk' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Auto Location/ })).toBeInTheDocument()
    expect(screen.getByText('Temperature')).toBeInTheDocument()
    expect(screen.getByText('Max humidity')).toBeInTheDocument()
    expect(screen.getByText('Total rain')).toBeInTheDocument()
    expect(screen.getByText('Rainy hours')).toBeInTheDocument()
    expect(screen.getByText('Forecast-based risk for the main rice diseases')).toBeInTheDocument()
    expect(screen.getByText('Rice Blast')).toBeInTheDocument()
    expect(screen.getAllByText(/Risk: (high|medium|low)/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Last update:/)).toBeInTheDocument()
    const rotation = screen.getByRole('heading', { name: 'Smart Crop Rotation' }).closest('section') as HTMLElement
    expect(within(rotation).getByText(/Motijheel, Dhaka •/)).toBeInTheDocument()

    // Nothing in Bangla is left on the screen except the "বাং" toggle label itself.
    const leftover = [...container.querySelectorAll('*')]
      .filter((el) => el.children.length === 0 && BANGLA.test(el.textContent ?? ''))
      .map((el) => el.textContent?.trim())
      .filter((t) => t !== 'বাং')
    expect(leftover).toEqual([])
  })

  it('EN fallback when location is denied: "Current Location: Dhaka, Bangladesh"', async () => {
    localStorage.setItem(STORAGE_KEY, 'en')
    act(() => resetGlobalLang())
    vi.stubGlobal('navigator', { ...navigator, geolocation: deniedGeo(), onLine: true })
    stubFetch()
    render(<WeatherScreen />)
    expect(await screen.findByText(/Location not available — showing the weather for Dhaka/)).toBeInTheDocument()
    expect(screen.getByTestId('current-place')).toHaveTextContent('Current Location: Dhaka, Bangladesh')
  })
})
