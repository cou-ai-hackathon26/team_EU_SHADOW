import { describe, it, expect } from 'vitest'
import {
  assessDiseases,
  TUNGRO_INFO_LINE,
  type HourlyData,
} from './diseaseRisk'
import { BANNED_PATTERNS } from '../../content/content.test'

function make72h(opts: {
  temp: number | ((i: number) => number)
  rh: number | ((i: number) => number)
  precip?: number | ((i: number) => number)
}): HourlyData {
  const getVal = (v: number | ((i: number) => number), i: number) =>
    typeof v === 'function' ? v(i) : v

  return {
    temperature_2m: Array.from({ length: 72 }, (_, i) => getVal(opts.temp, i)),
    relative_humidity_2m: Array.from({ length: 72 }, (_, i) => getVal(opts.rh, i)),
    precipitation: Array.from({ length: 72 }, (_, i) =>
      opts.precip ? getVal(opts.precip, i) : 0,
    ),
  }
}

describe('F16: Per-Disease Weather Risk Assessment (diseaseRisk.ts)', () => {
  it('blast: RH >= 90, 20-28 C; high >= 18h, medium >= 8h, else low', () => {
    // 20 hours in band -> high
    const highData = make72h({
      temp: (i) => (i < 20 ? 25 : 35),
      rh: (i) => (i < 20 ? 92 : 60),
    })
    const resHigh = assessDiseases(highData)
    const blastHigh = resHigh.diseases.find((d) => d.classId === 'blast')
    expect(blastHigh?.level).toBe('high')
    expect(blastHigh?.humidHours).toBe(20)

    // 10 hours in band -> medium
    const medData = make72h({
      temp: (i) => (i < 10 ? 25 : 35),
      rh: (i) => (i < 10 ? 92 : 60),
    })
    const resMed = assessDiseases(medData)
    const blastMed = resMed.diseases.find((d) => d.classId === 'blast')
    expect(blastMed?.level).toBe('medium')
    expect(blastMed?.humidHours).toBe(10)

    // 5 hours in band -> low
    const lowData = make72h({
      temp: (i) => (i < 5 ? 25 : 35),
      rh: (i) => (i < 5 ? 92 : 60),
    })
    const resLow = assessDiseases(lowData)
    const blastLow = resLow.diseases.find((d) => d.classId === 'blast')
    expect(blastLow?.level).toBe('low')
    expect(blastLow?.humidHours).toBe(5)
  })

  it('brown_spot: RH >= 86, 25-32 C; high >= 24h, medium >= 10h, else low', () => {
    // 25 hours in band -> high
    const highData = make72h({
      temp: (i) => (i < 25 ? 28 : 20),
      rh: (i) => (i < 25 ? 88 : 70),
    })
    const resHigh = assessDiseases(highData)
    const bsHigh = resHigh.diseases.find((d) => d.classId === 'brown_spot')
    expect(bsHigh?.level).toBe('high')
    expect(bsHigh?.humidHours).toBe(25)

    // 12 hours in band -> medium
    const medData = make72h({
      temp: (i) => (i < 12 ? 28 : 20),
      rh: (i) => (i < 12 ? 88 : 70),
    })
    const resMed = assessDiseases(medData)
    const bsMed = resMed.diseases.find((d) => d.classId === 'brown_spot')
    expect(bsMed?.level).toBe('medium')
    expect(bsMed?.humidHours).toBe(12)
  })

  it('sheath_blight: RH >= 90, 28-34 C; high >= 18h, medium >= 8h', () => {
    // 19 hours at 30 C and 95% RH -> high
    const highData = make72h({
      temp: (i) => (i < 19 ? 30 : 22),
      rh: (i) => (i < 19 ? 95 : 60),
    })
    const resHigh = assessDiseases(highData)
    const sbHigh = resHigh.diseases.find((d) => d.classId === 'sheath_blight')
    expect(sbHigh?.level).toBe('high')
    expect(sbHigh?.humidHours).toBe(19)

    // 9 hours in band -> medium
    const medData = make72h({
      temp: (i) => (i < 9 ? 30 : 22),
      rh: (i) => (i < 9 ? 95 : 60),
    })
    const resMed = assessDiseases(medData)
    const sbMed = resMed.diseases.find((d) => d.classId === 'sheath_blight')
    expect(sbMed?.level).toBe('medium')
    expect(sbMed?.humidHours).toBe(9)
  })

  it('leaf_smut: RH >= 90, 25-30 C; high >= 24h, medium >= 12h', () => {
    const medData = make72h({
      temp: (i) => (i < 14 ? 27 : 20),
      rh: (i) => (i < 14 ? 93 : 60),
    })
    const resMed = assessDiseases(medData)
    const lsMed = resMed.diseases.find((d) => d.classId === 'leaf_smut')
    expect(lsMed?.level).toBe('medium')
    expect(lsMed?.humidHours).toBe(14)
  })

  it('raises blast and sheath_blight by one level when rainyHours >= 6', () => {
    // 5 hours humid -> baseline low, but 6 rainy hours (>= 0.5 mm) -> raised to medium
    const data = make72h({
      temp: 25,
      rh: (i) => (i < 5 ? 92 : 60),
      precip: (i) => (i < 6 ? 1.0 : 0),
    })
    const res = assessDiseases(data)
    const blast = res.diseases.find((d) => d.classId === 'blast')
    expect(blast?.level).toBe('medium') // raised low -> medium

    // 10 hours humid for sheath_blight (temp 30 C) -> baseline medium, with 7 rainy hours -> raised to high
    const dataSb = make72h({
      temp: 30,
      rh: (i) => (i < 10 ? 92 : 60),
      precip: (i) => (i < 7 ? 2.0 : 0),
    })
    const resSb = assessDiseases(dataSb)
    const sb = resSb.diseases.find((d) => d.classId === 'sheath_blight')
    expect(sb?.level).toBe('high') // raised medium -> high
  })

  it('tungro is always not_assessed', () => {
    const highHumidData = make72h({ temp: 28, rh: 99, precip: 10 })
    const res = assessDiseases(highHumidData)
    const tungro = res.diseases.find((d) => d.classId === 'tungro')
    expect(tungro?.level).toBe('not_assessed')
  })

  it('handles empty or mismatched arrays with low for diseases and not_assessed for tungro', () => {
    const emptyRes = assessDiseases({
      temperature_2m: [],
      relative_humidity_2m: [],
      precipitation: [],
    })
    expect(emptyRes.diseases.find((d) => d.classId === 'tungro')?.level).toBe('not_assessed')
    expect(emptyRes.diseases.filter((d) => d.classId !== 'tungro').every((d) => d.level === 'low')).toBe(true)

    const mismatchedRes = assessDiseases({
      temperature_2m: [25, 26],
      relative_humidity_2m: [90],
      precipitation: [0, 0],
    })
    expect(mismatchedRes.diseases.find((d) => d.classId === 'tungro')?.level).toBe('not_assessed')
    expect(mismatchedRes.diseases.filter((d) => d.classId !== 'tungro').every((d) => d.level === 'low')).toBe(true)
  })

  it('contains summary metrics minTemp, maxTemp, maxRh, totalRainMm, rainyHours', () => {
    const data = make72h({
      temp: (i) => 20 + (i % 10), // 20 to 29
      rh: (i) => 70 + (i % 25), // 70 to 94
      precip: (i) => (i < 10 ? 1.5 : 0), // 10 * 1.5 = 15mm
    })
    const res = assessDiseases(data)
    expect(res.summary.minTemp).toBe(20)
    expect(res.summary.maxTemp).toBe(29)
    expect(res.summary.maxRh).toBe(94)
    expect(res.summary.totalRainMm).toBe(15)
    expect(res.summary.rainyHours).toBe(10)
  })

  it('banned-words patterns are absent from tungro info string and constants', () => {
    for (const pattern of BANNED_PATTERNS) {
      expect(TUNGRO_INFO_LINE).not.toMatch(pattern)
    }
  })
})
