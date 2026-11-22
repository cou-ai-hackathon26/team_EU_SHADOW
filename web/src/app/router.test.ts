import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createElement } from 'react'
import { routes, matchRoute, type RouteDef, HomeScreen, HistoryScreen } from './router'
import AccuracyScreen from '../features/about/AccuracyScreen'
import WeatherScreen from '../features/weather/WeatherScreen'

describe('router registry (F1 & F16)', () => {
  it('defines 5 primary routes with #/weather as the second route', () => {
    expect(routes).toBeDefined()
    expect(Array.isArray(routes)).toBe(true)
    expect(routes.length).toBe(5)

    expect(routes[0].id).toBe('home')
    expect(routes[1].id).toBe('weather')
    expect(routes[1].hash).toBe('#/weather')
    expect(routes[1].component).toBe(WeatherScreen)

    const hashes = routes.map((r: RouteDef) => r.hash)
    expect(hashes).toEqual(['', '#/weather', '#/history', '#/how-it-works', '#/about'])
  })

  it('matches routes correctly from location hash', () => {
    expect(matchRoute('').hash).toBe('')
    expect(matchRoute('#/').hash).toBe('')
    expect(matchRoute('#/weather').hash).toBe('#/weather')
    expect(matchRoute('#/weather').component).toBe(WeatherScreen)
    expect(matchRoute('#/history').hash).toBe('#/history')
    expect(matchRoute('#/how-it-works').hash).toBe('#/how-it-works')
    expect(matchRoute('#/about').hash).toBe('#/about')
    // fallback to home on unknown hash
    expect(matchRoute('#/unknown-route').hash).toBe('')
    expect(matchRoute('#/history').component).toBe(HistoryScreen)
  })

  it('matches alias #/accuracy to how-it-works route and uses AccuracyScreen component', () => {
    const routeByAlias = matchRoute('#/accuracy')
    expect(routeByAlias.id).toBe('how-it-works')

    const howItWorksRoute = routes.find((r) => r.id === 'how-it-works')
    expect(howItWorksRoute).toBeDefined()
    expect(howItWorksRoute?.component).toBe(AccuracyScreen)
  })

  it('HomeScreen render does not call getCurrentPosition and shows no weather risk card', () => {
    const geoSpy = vi.fn()
    vi.stubGlobal('navigator', {
      ...navigator,
      geolocation: { getCurrentPosition: geoSpy },
    })

    render(createElement(HomeScreen))

    expect(geoSpy).not.toHaveBeenCalled()
    expect(screen.queryByText(/আবহাওয়া ও রোগ-ঝুঁকি/)).not.toBeInTheDocument()
  })
})
