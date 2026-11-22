export interface HourlyData {
  time?: string[]
  temperature_2m: number[]
  relative_humidity_2m: number[]
  precipitation: number[]
}

export type RiskLevel = 'high' | 'medium' | 'low' | 'not_assessed'

export interface DiseaseRiskResult {
  classId: string
  level: RiskLevel
  humidHours: number
}

export interface WeatherSummary {
  minTemp: number
  maxTemp: number
  maxRh: number
  totalRainMm: number
  rainyHours: number
}

export interface AssessmentOutput {
  diseases: DiseaseRiskResult[]
  summary: WeatherSummary
}

// heuristic bands from qualitative IRRI Rice Knowledge Bank / BRRI conditions; not validated on BD data
export const DISEASE_WEATHER_BANDS = {
  blast: { minRh: 90, minTemp: 20, maxTemp: 28, highHours: 18, mediumHours: 8 },
  brown_spot: { minRh: 86, minTemp: 25, maxTemp: 32, highHours: 24, mediumHours: 10 },
  sheath_blight: { minRh: 90, minTemp: 28, maxTemp: 34, highHours: 18, mediumHours: 8 },
  leaf_smut: { minRh: 90, minTemp: 25, maxTemp: 30, highHours: 24, mediumHours: 12 },
} as const

export const TUNGRO_INFO_LINE =
  'ভাইরাসজনিত রোগ, সবুজ পাতাফড়িং দিয়ে ছড়ায় — জমিতে পাতাফড়িং দেখলে ১৬১২৩-এ যোগাযোগ করুন।'

const LEVEL_PRIORITY: Record<RiskLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
  not_assessed: 0,
}

export function assessDiseases(hourly: HourlyData): AssessmentOutput {
  const tempList = hourly.temperature_2m ?? []
  const rhList = hourly.relative_humidity_2m ?? []
  const rainList = hourly.precipitation ?? []

  const len = Math.min(tempList.length, 72)
  const isInvalid =
    len === 0 ||
    tempList.length !== rhList.length ||
    tempList.length !== rainList.length

  if (isInvalid) {
    const fallbackDiseases: DiseaseRiskResult[] = [
      { classId: 'blast', level: 'low', humidHours: 0 },
      { classId: 'brown_spot', level: 'low', humidHours: 0 },
      { classId: 'sheath_blight', level: 'low', humidHours: 0 },
      { classId: 'leaf_smut', level: 'low', humidHours: 0 },
      { classId: 'tungro', level: 'not_assessed', humidHours: 0 },
    ]
    return {
      diseases: fallbackDiseases,
      summary: {
        minTemp: 0,
        maxTemp: 0,
        maxRh: 0,
        totalRainMm: 0,
        rainyHours: 0,
      },
    }
  }

  let minTemp = Infinity
  let maxTemp = -Infinity
  let maxRh = -Infinity
  let totalRain = 0
  let rainyHours = 0

  const humidCounts: Record<keyof typeof DISEASE_WEATHER_BANDS, number> = {
    blast: 0,
    brown_spot: 0,
    sheath_blight: 0,
    leaf_smut: 0,
  }

  for (let i = 0; i < len; i++) {
    const temp = tempList[i]
    const rh = rhList[i]
    const rain = rainList[i]

    if (temp < minTemp) minTemp = temp
    if (temp > maxTemp) maxTemp = temp
    if (rh > maxRh) maxRh = rh

    totalRain += rain
    if (rain >= 0.5) {
      rainyHours++
    }

    // Check humid hours for each fungal disease
    for (const [key, band] of Object.entries(DISEASE_WEATHER_BANDS)) {
      const diseaseKey = key as keyof typeof DISEASE_WEATHER_BANDS
      if (rh >= band.minRh && temp >= band.minTemp && temp <= band.maxTemp) {
        humidCounts[diseaseKey]++
      }
    }
  }

  const hasHighRain = rainyHours >= 6

  const diseases: DiseaseRiskResult[] = (
    Object.keys(DISEASE_WEATHER_BANDS) as Array<keyof typeof DISEASE_WEATHER_BANDS>
  ).map((classId) => {
    const band = DISEASE_WEATHER_BANDS[classId]
    const count = humidCounts[classId]

    let level: RiskLevel = 'low'
    if (count >= band.highHours) {
      level = 'high'
    } else if (count >= band.mediumHours) {
      level = 'medium'
    }

    // If rainyHours >= 6, raise blast and sheath_blight by one level
    if (hasHighRain && (classId === 'blast' || classId === 'sheath_blight')) {
      if (level === 'low') {
        level = 'medium'
      } else if (level === 'medium') {
        level = 'high'
      }
    }

    return {
      classId,
      level,
      humidHours: count,
    }
  })

  // Tungro is always not_assessed
  diseases.push({
    classId: 'tungro',
    level: 'not_assessed',
    humidHours: 0,
  })

  // Sort high -> medium -> low -> not_assessed
  diseases.sort((a, b) => LEVEL_PRIORITY[b.level] - LEVEL_PRIORITY[a.level])

  return {
    diseases,
    summary: {
      minTemp: Math.round(minTemp * 10) / 10,
      maxTemp: Math.round(maxTemp * 10) / 10,
      maxRh: Math.round(maxRh),
      totalRainMm: Math.round(totalRain * 10) / 10,
      rainyHours,
    },
  }
}
