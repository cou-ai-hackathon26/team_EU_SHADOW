import { describe, it, expect } from 'vitest'
import { routes, matchRoute, type RouteDef } from './router'
import AccuracyScreen from '../features/about/AccuracyScreen'

describe('router registry (F1)', () => {
  it('defines the route list in one single place with 4 primary routes', () => {
    expect(routes).toBeDefined()
    expect(Array.isArray(routes)).toBe(true)
    expect(routes.length).toBeGreaterThanOrEqual(4)

    const hashes = routes.map((r: RouteDef) => r.hash)
    expect(hashes).toContain('')
    expect(hashes).toContain('#/history')
    expect(hashes).toContain('#/how-it-works')
    expect(hashes).toContain('#/about')
  })

  it('matches routes correctly from location hash', () => {
    expect(matchRoute('').hash).toBe('')
    expect(matchRoute('#/').hash).toBe('')
    expect(matchRoute('#/history').hash).toBe('#/history')
    expect(matchRoute('#/how-it-works').hash).toBe('#/how-it-works')
    expect(matchRoute('#/about').hash).toBe('#/about')
    // fallback to home on unknown hash
    expect(matchRoute('#/unknown-route').hash).toBe('')
  })

  it('matches alias #/accuracy to how-it-works route and uses AccuracyScreen component', () => {
    const routeByAlias = matchRoute('#/accuracy')
    expect(routeByAlias.id).toBe('how-it-works')

    const howItWorksRoute = routes.find((r) => r.id === 'how-it-works')
    expect(howItWorksRoute).toBeDefined()
    expect(howItWorksRoute?.component).toBe(AccuracyScreen)
  })
})
