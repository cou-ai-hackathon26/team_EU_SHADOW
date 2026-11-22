import type { HourlyData } from './openMeteo'

export type { HourlyData }

export type RiskLevel = 'low' | 'medium' | 'high'

export interface RiskAssessment {
  level: RiskLevel
  humidHours: number
  rainyHours: number
}

// Heuristic thresholds for fungal leaf disease risk (BRRI/IRRI qualitative guidance)
export const HUMID_RH_THRESHOLD = 90 // relative humidity >= 90%
export const TEMP_MIN_THRESHOLD = 20 // temperature >= 20 °C
export const TEMP_MAX_THRESHOLD = 32 // temperature <= 32 °C
export const RAIN_THRESHOLD = 0.5 // precipitation >= 0.5 mm

export const HIGH_RISK_HUMID_HOURS = 24
export const HIGH_RISK_HUMID_HOURS_WITH_RAIN = 12
export const HIGH_RISK_RAINY_HOURS = 6
export const MEDIUM_RISK_HUMID_HOURS = 8

export const ADVICE_LINES: Record<RiskLevel, string> = {
  high: 'ছত্রাকজনিত রোগের ঝুঁকি বেশি। প্রতিদিন পাতা দেখুন, দাগ দেখলে ছবি তুলে পরীক্ষা করুন বা ১৬১২৩ নম্বরে কল করুন।',
  medium: 'আর্দ্রতা মাঝারি। ২–৩ দিন পর পর পাতা খেয়াল রাখুন।',
  low: 'আবহাওয়া রোগের জন্য তেমন অনুকূল নয়। নিয়মিত জমি দেখুন।',
}

export function assessRisk(hourly: HourlyData): RiskAssessment {
  const rhList = hourly.relative_humidity_2m ?? []
  const tempList = hourly.temperature_2m ?? []
  const rainList = hourly.precipitation ?? []

  const len = Math.min(rhList.length, 72)
  if (
    len === 0 ||
    rhList.length !== tempList.length ||
    rhList.length !== rainList.length
  ) {
    return { level: 'low', humidHours: 0, rainyHours: 0 }
  }

  let humidHours = 0
  let rainyHours = 0

  for (let i = 0; i < len; i++) {
    const rh = rhList[i]
    const temp = tempList[i]
    const rain = rainList[i]

    if (typeof rh === 'number' && typeof temp === 'number' && typeof rain === 'number') {
      if (rh >= HUMID_RH_THRESHOLD && temp >= TEMP_MIN_THRESHOLD && temp <= TEMP_MAX_THRESHOLD) {
        humidHours++
      }
      if (rain >= RAIN_THRESHOLD) {
        rainyHours++
      }
    }
  }

  let level: RiskLevel = 'low'
  if (
    humidHours >= HIGH_RISK_HUMID_HOURS ||
    (humidHours >= HIGH_RISK_HUMID_HOURS_WITH_RAIN && rainyHours >= HIGH_RISK_RAINY_HOURS)
  ) {
    level = 'high'
  } else if (humidHours >= MEDIUM_RISK_HUMID_HOURS) {
    level = 'medium'
  }

  return { level, humidHours, rainyHours }
}
