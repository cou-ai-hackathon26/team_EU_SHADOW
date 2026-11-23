import { describe, it, expect } from 'vitest'
import { recommendRotation, seasonForMonth, nearestDivisionId, regionForDivision } from './cropRotation'
import type { WeatherSummary } from './diseaseRisk'

const dry: WeatherSummary = { minTemp: 14, maxTemp: 26, maxRh: 70, totalRainMm: 0, rainyHours: 0 }
const wet: WeatherSummary = { minTemp: 22, maxTemp: 29, maxRh: 98, totalRainMm: 45, rainyHours: 20 }
const hotDry: WeatherSummary = { minTemp: 27, maxTemp: 36, maxRh: 75, totalRainMm: 2, rainyHours: 1 }

describe('crop rotation advice', () => {
  it('maps months to Bangladesh seasons', () => {
    expect([11, 12, 1, 2].map(seasonForMonth)).toEqual(['rabi', 'rabi', 'rabi', 'rabi'])
    expect([3, 4, 5, 6].map(seasonForMonth)).toEqual(['kharif1', 'kharif1', 'kharif1', 'kharif1'])
    expect([7, 8, 9, 10].map(seasonForMonth)).toEqual(['kharif2', 'kharif2', 'kharif2', 'kharif2'])
  })

  it('finds the nearest division from GPS and groups regions', () => {
    expect(nearestDivisionId(24.4, 88.7)).toBe('rajshahi')
    expect(nearestDivisionId(22.8, 89.5)).toBe('khulna')
    expect(regionForDivision('rangpur')).toBe('north')
    expect(regionForDivision('barishal')).toBe('coastal')
    expect(regionForDivision(null)).toBe('central')
  })

  it('Rabi in the north suggests wheat, potato, maize or lentil', () => {
    const a = recommendRotation(12, 'rajshahi', dry)
    expect(a.season).toBe('rabi')
    expect(a.crops.map((c) => c.id)).toEqual(['wheat', 'potato', 'maize', 'lentil'])
    expect(a.seasonName.bn).toContain('রবি')
    expect(a.usedWeather).toBe(true)
  })

  it('Rabi on the coast suggests sunflower and mung bean', () => {
    const ids = recommendRotation(1, 'khulna', dry).crops.map((c) => c.id)
    expect(ids).toContain('sunflower')
    expect(ids).toContain('mung')
  })

  it('heavy rain moves potato and lentil down and adds a drainage note', () => {
    const a = recommendRotation(12, 'dhaka', wet)
    const ids = a.crops.map((c) => c.id)
    expect(ids.indexOf('potato')).toBeGreaterThan(ids.indexOf('mustard'))
    expect(a.weatherNotes.some((n) => n.bn.includes('বৃষ্টি') && n.en.includes('Rain'))).toBe(true)
  })

  it('hot, dry Kharif-1 weather adds a note for mung bean and sesame', () => {
    const a = recommendRotation(4, 'rajshahi', hotDry)
    expect(a.season).toBe('kharif1')
    expect(a.weatherNotes.some((n) => n.en.includes('mung bean'))).toBe(true)
  })

  it('works offline: no weather gives season and region advice only', () => {
    const a = recommendRotation(8, null, null)
    expect(a.season).toBe('kharif2')
    expect(a.usedWeather).toBe(false)
    expect(a.crops.length).toBeGreaterThan(0)
  })

  it('every crop has Bangla and English text, and legumes are flagged', () => {
    for (const m of [1, 4, 8]) {
      for (const div of ['rajshahi', 'dhaka', 'khulna', 'sylhet']) {
        for (const c of recommendRotation(m, div, null).crops) {
          for (const t of [c.name, c.whyFits, c.diseaseBreak]) {
            expect(t.bn.length).toBeGreaterThan(0)
            expect(t.en.length).toBeGreaterThan(0)
          }
        }
      }
    }
    expect(recommendRotation(12, 'dhaka', null).crops.find((c) => c.id === 'lentil')?.legume).toBe(true)
  })

  it('never names a pesticide, chemical or dose', () => {
    const text = JSON.stringify([1, 4, 8].flatMap((m) => ['rajshahi', 'dhaka', 'khulna', 'sylhet'].map((d) => recommendRotation(m, d, wet))))
    expect(text).not.toMatch(/কীটনাশক|ছত্রাকনাশক|pesticide|fungicide|insecticide|\d+\s*(ml|মিলি|গ্রাম|g)\s*\/?\s*(লিটার|L|litre)/i)
  })
})
