import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import WeatherScreen from './WeatherScreen'
import { saveWeatherCache, WEATHER_CACHE_KEY_V2 } from './weatherCache'
import { BANNED_PATTERNS } from '../../content/content.test'

function makeMockHourly() {
  return {
    hourly: {
      time: Array(72).fill('2026-11-23T00:00'),
      temperature_2m: Array(72).fill(25),
      relative_humidity_2m: Array(72).fill(92),
      precipitation: Array(72).fill(0),
    },
  }
}

describe('F16: WeatherScreen Component', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('GPS success: fetches with rounded coords, renders label "আপনার অবস্থান" and disease cards', async () => {
    const fakeGeo = {
      getCurrentPosition: vi.fn((success: PositionCallback) => {
        success({
          coords: {
            latitude: 23.81234,
            longitude: 90.41499,
            accuracy: 50,
          },
          timestamp: Date.now(),
        } as unknown as GeolocationPosition)
      }),
    }
    vi.stubGlobal('navigator', { ...navigator, geolocation: fakeGeo, onLine: true })

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeMockHourly(),
    } as Response)
    vi.stubGlobal('fetch', fetchSpy)

    render(<WeatherScreen />)

    expect(
      await screen.findByText('আপনার অবস্থান'),
    ).toBeInTheDocument()

    // Ensure fetch URL uses rounded coords (2 decimals)
    expect(fetchSpy).toHaveBeenCalled()
    const callUrl = fetchSpy.mock.calls[0][0] as string
    expect(callUrl).toContain('latitude=23.81')
    expect(callUrl).toContain('longitude=90.41')

    // Disease list shows badges
    expect(screen.getAllByText(/ঝুঁকি: বেশি|ঝুঁকি: মাঝারি|ঝুঁকি: কম/).length).toBeGreaterThan(0)
    // Tungro shows special status
    expect(screen.getByText('আবহাওয়া দিয়ে বলা যায় না')).toBeInTheDocument()

    // Coordinates in localStorage must never have more than 2 decimal places
    const stored = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY_V2) || '{}')
    expect(stored.lat).toBe(23.81)
    expect(stored.lon).toBe(90.41)
  })

  it('GPS denied: shows "অবস্থান পাওয়া যায়নি — নিচে বিভাগ বেছে নিন" and division dropdown', async () => {
    const fakeGeo = {
      getCurrentPosition: vi.fn((_success: PositionCallback, error?: PositionErrorCallback) => {
        error?.({
          code: 1,
          message: 'User denied geolocation',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError)
      }),
    }
    vi.stubGlobal('navigator', { ...navigator, geolocation: fakeGeo, onLine: true })

    render(<WeatherScreen />)

    expect(
      await screen.findByText(/অবস্থান পাওয়া যায়নি — নিচে বিভাগ বেছে নিন/),
    ).toBeInTheDocument()

    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
  })

  it('choosing a division sets mode to "division" and does not call GPS on next mount', async () => {
    const geoSpy = vi.fn()
    vi.stubGlobal('navigator', {
      ...navigator,
      geolocation: { getCurrentPosition: geoSpy },
      onLine: true,
    })

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeMockHourly(),
    } as Response)
    vi.stubGlobal('fetch', fetchSpy)

    // Pre-select mode = division
    localStorage.setItem('agroleaf-weather-mode', 'division')
    localStorage.setItem('agroleaf-weather-division', 'dhaka')

    render(<WeatherScreen />)

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled()
    })

    // GPS must not be called when mode is division
    expect(geoSpy).not.toHaveBeenCalled()
    expect(screen.getByText('ঢাকা', { selector: 'p' })).toBeInTheDocument()
  })

  it('offline + fresh cache: shows cached list with "ইন্টারনেট নেই — শেষ আপডেট:"', async () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: false })
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    saveWeatherCache({
      mode: 'gps',
      lat: 23.81,
      lon: 90.41,
      label: 'আপনার অবস্থান',
      hourly: {
        temperature_2m: Array(72).fill(25),
        relative_humidity_2m: Array(72).fill(92),
        precipitation: Array(72).fill(0),
      },
      fetchedAt: Date.now() - 60 * 60 * 1000, // 1 hour ago (fresh)
    })

    render(<WeatherScreen />)

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(await screen.findByText(/ইন্টারনেট নেই — শেষ আপডেট:/)).toBeInTheDocument()
    expect(screen.getByText('আপনার অবস্থান')).toBeInTheDocument()
    expect(screen.getAllByText(/ঝুঁকি:/).length).toBeGreaterThan(0)
  })

  it('offline + no cache: shows "এখন আবহাওয়ার তথ্য পাওয়া যাচ্ছে না।" without risk badges', async () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: false })
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    render(<WeatherScreen />)

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(
      await screen.findByText('এখন আবহাওয়ার তথ্য পাওয়া যাচ্ছে না।'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/ঝুঁকি: বেশি|ঝুঁকি: মাঝারি|ঝুঁকি: কম/)).not.toBeInTheDocument()
  })

  it('renders footer disclaimer "* এটি আনুমানিক সতর্কতা, নিশ্চিত রোগ নির্ণয় নয়।" and Open-Meteo credit link', async () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: false })

    render(<WeatherScreen />)

    expect(
      screen.getByText('* এটি আনুমানিক সতর্কতা, নিশ্চিত রোগ নির্ণয় নয়।'),
    ).toBeInTheDocument()

    const credit = screen.getByRole('link', { name: /Open-Meteo\.com/i })
    expect(credit).toHaveAttribute('href', 'https://open-meteo.com')
    expect(credit).toHaveAttribute('target', '_blank')
    expect(credit.getAttribute('rel')).toContain('noreferrer')
  })

  it('zero pesticide or chemical names appear across rendered screen', async () => {
    saveWeatherCache({
      mode: 'gps',
      lat: 23.81,
      lon: 90.41,
      label: 'আপনার অবস্থান',
      hourly: {
        temperature_2m: Array(72).fill(25),
        relative_humidity_2m: Array(72).fill(92),
        precipitation: Array(72).fill(2.0),
      },
      fetchedAt: Date.now(),
    })

    const { container } = render(<WeatherScreen />)
    const text = container.textContent || ''

    for (const pattern of BANNED_PATTERNS) {
      expect(text).not.toMatch(pattern)
    }
  })

  it('fresh cache + GPS error: shows cached disease list, "শেষ আপডেট", "অবস্থান পাওয়া যায়নি" note, and division dropdown', async () => {
    saveWeatherCache({
      mode: 'gps',
      lat: 23.81,
      lon: 90.41,
      label: 'আপনার অবস্থান',
      hourly: {
        temperature_2m: Array(72).fill(25),
        relative_humidity_2m: Array(72).fill(92),
        precipitation: Array(72).fill(0),
      },
      fetchedAt: Date.now() - 3600 * 1000,
    })

    const fakeGeo = {
      getCurrentPosition: vi.fn((_success: PositionCallback, error?: PositionErrorCallback) => {
        if (error) {
          error({
            code: 1,
            message: 'User denied Geolocation',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError)
        }
      }),
    }
    vi.stubGlobal('navigator', { ...navigator, geolocation: fakeGeo, onLine: true })

    render(<WeatherScreen />)

    expect(await screen.findByText('ব্লাস্ট রোগ')).toBeInTheDocument()
    expect(screen.getByText('ধানের প্রধান রোগসমূহের পূর্বাভাসভিত্তিক ঝুঁকি')).toBeInTheDocument()
    expect(screen.getByText(/শেষ আপডেট:/)).toBeInTheDocument()
    expect(screen.getByText('অবস্থান পাওয়া যায়নি — নিচে বিভাগ বেছে নিন')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('fresh cache + GPS mode + getCurrentPosition never answers: cached list is visible immediately on first render', () => {
    saveWeatherCache({
      mode: 'gps',
      lat: 23.81,
      lon: 90.41,
      label: 'আপনার অবস্থান',
      hourly: {
        temperature_2m: Array(72).fill(25),
        relative_humidity_2m: Array(72).fill(92),
        precipitation: Array(72).fill(0),
      },
      fetchedAt: Date.now() - 3600 * 1000,
    })

    const fakeGeo = {
      getCurrentPosition: vi.fn(() => {
        // never answers
      }),
    }
    vi.stubGlobal('navigator', { ...navigator, geolocation: fakeGeo, onLine: true })

    render(<WeatherScreen />)

    expect(screen.getByText('ব্লাস্ট রোগ')).toBeInTheDocument()
    expect(screen.getByText('ধানের প্রধান রোগসমূহের পূর্বাভাসভিত্তিক ঝুঁকি')).toBeInTheDocument()
    expect(screen.getByText('আপনার অবস্থান')).toBeInTheDocument()
  })

  it('fresh cache + GPS error + offline: cached list shown with "ইন্টারনেট নেই — শেষ আপডেট"', async () => {
    saveWeatherCache({
      mode: 'gps',
      lat: 23.81,
      lon: 90.41,
      label: 'আপনার অবস্থান',
      hourly: {
        temperature_2m: Array(72).fill(25),
        relative_humidity_2m: Array(72).fill(92),
        precipitation: Array(72).fill(0),
      },
      fetchedAt: Date.now() - 3600 * 1000,
    })

    const fakeGeo = {
      getCurrentPosition: vi.fn((_success: PositionCallback, error?: PositionErrorCallback) => {
        if (error) {
          error({
            code: 1,
            message: 'User denied Geolocation',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError)
        }
      }),
    }
    vi.stubGlobal('navigator', { ...navigator, geolocation: fakeGeo, onLine: false })

    render(<WeatherScreen />)

    expect(await screen.findByText('ব্লাস্ট রোগ')).toBeInTheDocument()
    expect(screen.getByText(/ইন্টারনেট নেই — শেষ আপডেট/)).toBeInTheDocument()
    expect(screen.getByText('অবস্থান পাওয়া যায়নি — নিচে বিভাগ বেছে নিন')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('localStorage throws on getItem/setItem: renders title and division dropdown without crashing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage is blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('localStorage is blocked')
    })

    render(<WeatherScreen />)

    expect(screen.getByRole('heading', { name: /রোগ-ঝুঁকি/ })).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
})
