import { describe, it, expect, vi } from 'vitest'
import {
  BANGLADESH_DISTRICTS,
  findNearestDistrict,
  getDistrictById,
} from './districts'
import {
  evaluateDiseaseRisks,
  getSeasonalAdvice,
  fetchDistrictWeather,
  type WeatherData,
} from './weatherService'

describe('Bangladesh Districts & Geolocation', () => {
  it('contains all 64 districts with coordinates and divisions', () => {
    expect(BANGLADESH_DISTRICTS.length).toBe(64)
    for (const d of BANGLADESH_DISTRICTS) {
      expect(d.id.length).toBeGreaterThan(0)
      expect(d.nameBn.length).toBeGreaterThan(0)
      expect(d.nameEn.length).toBeGreaterThan(0)
      expect(d.divisionBn.length).toBeGreaterThan(0)
      expect(d.lat).toBeGreaterThan(20)
      expect(d.lat).toBeLessThan(27)
      expect(d.lon).toBeGreaterThan(88)
      expect(d.lon).toBeLessThan(93)
    }
  })

  it('finds nearest district accurately using coordinates', () => {
    // Near Dhaka center
    const dhaka = findNearestDistrict(23.8103, 90.4125)
    expect(dhaka.id).toBe('dhaka')

    // Near Chattogram
    const ctg = findNearestDistrict(22.3569, 91.7832)
    expect(ctg.id).toBe('chattogram')

    // Near Sylhet
    const sylhet = findNearestDistrict(24.8949, 91.8687)
    expect(sylhet.id).toBe('sylhet')
  })

  it('getDistrictById returns correct district or defaults to dhaka', () => {
    const bogura = getDistrictById('bogura')
    expect(bogura.nameBn).toBe('বগুড়া')

    const unknown = getDistrictById('non_existent')
    expect(unknown.id).toBe('dhaka')
  })
})

describe('Weather-Based Agronomic & Disease Epidemiology Rules', () => {
  it('triggers high risk for Rice Blast under high humidity and moderate temps', () => {
    const weather: WeatherData = {
      temp: 24,
      humidity: 90,
      precipitation: 0.5,
      precipProb: 40,
      weatherCode: 2,
      windSpeed: 6,
      conditionBn: 'আংশিক মেঘলা',
      conditionEn: 'Partly cloudy',
      isDay: true,
    }

    const risks = evaluateDiseaseRisks(weather)
    const blastRisk = risks.find((r) => r.diseaseId === 'blast')
    expect(blastRisk).toBeDefined()
    expect(blastRisk?.riskLevel).toBe('high')
    expect(blastRisk?.levelBn).toBe('উচ্চ ঝুঁকি')
  })

  it('triggers high risk for Sheath Blight in warm, damp and rainy weather', () => {
    const weather: WeatherData = {
      temp: 31,
      humidity: 88,
      precipitation: 5.0,
      precipProb: 80,
      weatherCode: 63,
      windSpeed: 12,
      conditionBn: 'বৃষ্টিপাত',
      conditionEn: 'Rain',
      isDay: true,
    }

    const risks = evaluateDiseaseRisks(weather)
    const sheathRisk = risks.find((r) => r.diseaseId === 'sheath_blight')
    expect(sheathRisk).toBeDefined()
    expect(sheathRisk?.riskLevel).toBe('high')
  })

  it('adheres to banned-words safety policy (no chemical names, brand names or doses)', () => {
    const weather: WeatherData = {
      temp: 28,
      humidity: 85,
      precipitation: 2,
      precipProb: 60,
      weatherCode: 2,
      windSpeed: 8,
      conditionBn: 'আংশিক মেঘলা',
      conditionEn: 'Partly cloudy',
      isDay: true,
    }

    const risks = evaluateDiseaseRisks(weather)
    const jsonStr = JSON.stringify(risks)

    const bannedKeywords = [
      /ম্যানকোজেব/i,
      /কার্বেন্ডাজিম/i,
      /থিওভিট/i,
      /গ্রাম\/লিটার/i,
      /মিলি\/লিটার/i,
      /কেজি\/বিঘা/i,
      /পেস্টিসাইড/i,
      /কীটনাশক ব্র্যান্ড/i,
    ]

    for (const pattern of bannedKeywords) {
      expect(jsonStr.match(pattern)).toBeNull()
    }
  })

  it('returns seasonal advice for boro, aus, and aman with crop rotation tips', () => {
    // January -> Boro
    const boro = getSeasonalAdvice(1)
    expect(boro.seasonBn).toBe('বোরো মৌসুম')
    expect(boro.careTipsBn.length).toBeGreaterThan(0)
    expect(boro.rotationAdviceBn).toContain('মুগডাল')

    // June -> Aus
    const aus = getSeasonalAdvice(6)
    expect(aus.seasonBn).toBe('আউশ মৌসুম')

    // September -> Aman
    const aman = getSeasonalAdvice(9)
    expect(aman.seasonBn).toBe('আমন মৌসুম')
    expect(aman.rotationAdviceBn).toContain('সরিষা')
  })

  it('fetchDistrictWeather handles network failure gracefully with fallback data', async () => {
    const district = getDistrictById('rajshahi')
    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network offline'))

    try {
      const report = await fetchDistrictWeather(district)
      expect(report.district.id).toBe('rajshahi')
      expect(report.weather.temp).toBeGreaterThan(0)
      expect(report.risks.length).toBeGreaterThan(0)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
