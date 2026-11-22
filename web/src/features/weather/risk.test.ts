import { describe, it, expect } from 'vitest'
import { assessRisk, ADVICE_LINES, type HourlyData } from './risk'
import { BANNED_PATTERNS } from '../../content/content.test'

function makeHourly(opts: {
  count?: number
  rh?: number | number[]
  temp?: number | number[]
  precip?: number | number[]
}): HourlyData {
  const count = opts.count ?? 72
  const getVal = (v: number | number[] | undefined, def: number, idx: number) => {
    if (v === undefined) return def
    if (Array.isArray(v)) return v[idx] ?? def
    return v
  }
  return {
    relative_humidity_2m: Array.from({ length: count }, (_, i) => getVal(opts.rh, 50, i)),
    temperature_2m: Array.from({ length: count }, (_, i) => getVal(opts.temp, 25, i)),
    precipitation: Array.from({ length: count }, (_, i) => getVal(opts.precip, 0, i)),
  }
}

describe('F16: Weather disease risk assessment (risk.ts)', () => {
  it('72 dry hours -> low', () => {
    const data = makeHourly({ count: 72, rh: 60, temp: 25, precip: 0 })
    const result = assessRisk(data)
    expect(result.level).toBe('low')
    expect(result.humidHours).toBe(0)
    expect(result.rainyHours).toBe(0)
  })

  it('10 humid hours -> medium', () => {
    const rh = Array.from({ length: 72 }, (_, i) => (i < 10 ? 95 : 60))
    const data = makeHourly({ count: 72, rh, temp: 26, precip: 0 })
    const result = assessRisk(data)
    expect(result.level).toBe('medium')
    expect(result.humidHours).toBe(10)
    expect(result.rainyHours).toBe(0)
  })

  it('24 humid hours -> high', () => {
    const rh = Array.from({ length: 72 }, (_, i) => (i < 24 ? 92 : 60))
    const data = makeHourly({ count: 72, rh, temp: 27, precip: 0 })
    const result = assessRisk(data)
    expect(result.level).toBe('high')
    expect(result.humidHours).toBe(24)
    expect(result.rainyHours).toBe(0)
  })

  it('12 humid + 6 rainy -> high', () => {
    const rh = Array.from({ length: 72 }, (_, i) => (i < 12 ? 95 : 60))
    const precip = Array.from({ length: 72 }, (_, i) => (i < 6 ? 1.5 : 0))
    const data = makeHourly({ count: 72, rh, temp: 25, precip })
    const result = assessRisk(data)
    expect(result.level).toBe('high')
    expect(result.humidHours).toBe(12)
    expect(result.rainyHours).toBe(6)
  })

  it('humid hours at 35 °C do not count', () => {
    const rh = Array.from({ length: 72 }, (_, i) => (i < 30 ? 95 : 60))
    const data = makeHourly({ count: 72, rh, temp: 35, precip: 0 })
    const result = assessRisk(data)
    expect(result.humidHours).toBe(0)
    expect(result.level).toBe('low')
  })

  it('empty or mismatched arrays -> low with zero counts', () => {
    const emptyResult = assessRisk({
      relative_humidity_2m: [],
      temperature_2m: [],
      precipitation: [],
    })
    expect(emptyResult).toEqual({ level: 'low', humidHours: 0, rainyHours: 0 })

    const mismatchedResult = assessRisk({
      relative_humidity_2m: [95, 95],
      temperature_2m: [25],
      precipitation: [0, 0],
    })
    expect(mismatchedResult).toEqual({ level: 'low', humidHours: 0, rainyHours: 0 })
  })

  it('adheres to no-chemical anti-pesticide rules for all advice strings', () => {
    for (const [, line] of Object.entries(ADVICE_LINES)) {
      expect(line.length).toBeGreaterThan(0)
      for (const pattern of BANNED_PATTERNS) {
        expect(line).not.toMatch(pattern)
      }
    }
  })
})
