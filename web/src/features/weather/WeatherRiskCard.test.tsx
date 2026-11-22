import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import WeatherRiskCard from './WeatherRiskCard'
import { WEATHER_CACHE_KEY, saveWeatherCache } from './weatherCache'
import { BANNED_PATTERNS } from '../../content/content.test'

describe('F16: WeatherRiskCard Component', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('no division -> no fetch and shows "আপনার বিভাগ বেছে নিন"', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    render(<WeatherRiskCard />)

    expect(screen.getByText(/আপনার বিভাগ বেছে নিন/)).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('picking a division stores it and fetches once', async () => {
    const mockHourly = {
      hourly: {
        time: Array(72).fill('2026-11-23T00:00'),
        relative_humidity_2m: Array(72).fill(95),
        temperature_2m: Array(72).fill(25),
        precipitation: Array(72).fill(1.0),
      },
    }
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHourly,
    } as Response)
    vi.stubGlobal('fetch', fetchSpy)

    render(<WeatherRiskCard />)

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'dhaka' } })

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })
    expect(localStorage.getItem('agroleaf-weather-division')).toBe('dhaka')
    expect(localStorage.getItem(WEATHER_CACHE_KEY)).not.toBeNull()
  })

  it('offline with fresh cache (< 24h) shows "শেষ আপডেট" and cached risk', async () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: false })
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    localStorage.setItem('agroleaf-weather-division', 'dhaka')
    saveWeatherCache({
      divisionId: 'dhaka',
      hourly: {
        relative_humidity_2m: Array(72).fill(95),
        temperature_2m: Array(72).fill(25),
        precipitation: Array(72).fill(0),
      },
      assessment: {
        level: 'high',
        humidHours: 24,
        rainyHours: 0,
      },
      fetchedAt: Date.now() - 2 * 60 * 60 * 1000,
    })

    render(<WeatherRiskCard />)

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(await screen.findByText(/শেষ আপডেট/)).toBeInTheDocument()
    expect(screen.getByText(/ইন্টারনেট নেই/)).toBeInTheDocument()
    expect(screen.getByText(/বেশি/)).toBeInTheDocument()
  })

  it('offline with no cache shows the unavailable line "এখন আবহাওয়ার তথ্য পাওয়া যাচ্ছে না।" without risk badge', async () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: false })
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    localStorage.setItem('agroleaf-weather-division', 'dhaka')

    render(<WeatherRiskCard />)

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(
      await screen.findByText('এখন আবহাওয়ার তথ্য পাওয়া যাচ্ছে না।'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/কম ঝুঁকি|মাঝারি ঝুঁকি|বেশি ঝুঁকি/)).not.toBeInTheDocument()
  })

  it('the card never calls navigator.geolocation (spy on it)', () => {
    const geoSpy = vi.fn()
    vi.stubGlobal('navigator', {
      ...navigator,
      geolocation: {
        getCurrentPosition: geoSpy,
        watchPosition: geoSpy,
      },
    })

    render(<WeatherRiskCard />)

    expect(geoSpy).not.toHaveBeenCalled()
  })

  it('text contains "আনুমানিক" and the Open-Meteo credit link', () => {
    render(<WeatherRiskCard />)

    expect(screen.getByText(/আনুমানিক/)).toBeInTheDocument()
    const credit = screen.getByRole('link', { name: /Open-Meteo\.com/i })
    expect(credit).toHaveAttribute('href', 'https://open-meteo.com')
  })

  it('renders no banned chemical or pesticide patterns across card content', async () => {
    const mockHourly = {
      hourly: {
        time: Array(72).fill('2026-11-23T00:00'),
        relative_humidity_2m: Array(72).fill(95),
        temperature_2m: Array(72).fill(25),
        precipitation: Array(72).fill(1.0),
      },
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockHourly,
      } as Response),
    )
    localStorage.setItem('agroleaf-weather-division', 'dhaka')

    const { container } = render(<WeatherRiskCard />)
    await screen.findByText(/ছত্রাকজনিত রোগের ঝুঁকি বেশি/)

    const text = container.textContent ?? ''
    for (const pattern of BANNED_PATTERNS) {
      expect(text).not.toMatch(pattern)
    }
  })
})
