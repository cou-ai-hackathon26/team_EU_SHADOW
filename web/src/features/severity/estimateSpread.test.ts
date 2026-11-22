import { describe, it, expect } from 'vitest'
import {
  estimateSpread,
  HOT_CELL_THRESHOLD,
  SEVERITY_BAND_LABELS_BN,
} from './estimateSpread'

describe('F18 estimateSpread', () => {
  it('HOT_CELL_THRESHOLD is 0.5', () => {
    expect(HOT_CELL_THRESHOLD).toBe(0.5)
  })

  it('SEVERITY_BAND_LABELS_BN maps bands to Bengali labels', () => {
    expect(SEVERITY_BAND_LABELS_BN.small).toBe('অল্প অংশে')
    expect(SEVERITY_BAND_LABELS_BN.medium).toBe('মাঝারি অংশে')
    expect(SEVERITY_BAND_LABELS_BN.large).toBe('বড় অংশে')
  })

  it('49-cell map: 3 hot cells -> small (share < 0.15)', () => {
    const map = new Float32Array(49)
    map[0] = 0.8
    map[1] = 0.6
    map[2] = 0.5 // values exactly 0.5 count as hot
    const result = estimateSpread(map, 7)
    expect(result).not.toBeNull()
    expect(result!.share).toBeCloseTo(3 / 49, 4)
    expect(result!.band).toBe('small')
  })

  it('49-cell map: 12 hot cells -> medium (0.15 <= share <= 0.40)', () => {
    const map = new Float32Array(49)
    for (let i = 0; i < 12; i++) {
      map[i] = 0.7
    }
    const result = estimateSpread(map, 7)
    expect(result).not.toBeNull()
    expect(result!.share).toBeCloseTo(12 / 49, 4)
    expect(result!.band).toBe('medium')
  })

  it('49-cell map: 25 hot cells -> large (share > 0.40)', () => {
    const map = new Float32Array(49)
    for (let i = 0; i < 25; i++) {
      map[i] = 0.9
    }
    const result = estimateSpread(map, 7)
    expect(result).not.toBeNull()
    expect(result!.share).toBeCloseTo(25 / 49, 4)
    expect(result!.band).toBe('large')
  })

  it('handles boundary exactly at 0.15 and 0.40 as medium', () => {
    const map15 = new Float32Array(100)
    for (let i = 0; i < 15; i++) map15[i] = 0.5
    expect(estimateSpread(map15, 10)?.band).toBe('medium')

    const map40 = new Float32Array(100)
    for (let i = 0; i < 40; i++) map40[i] = 0.5
    expect(estimateSpread(map40, 10)?.band).toBe('medium')

    const map14 = new Float32Array(100)
    for (let i = 0; i < 14; i++) map14[i] = 0.5
    expect(estimateSpread(map14, 10)?.band).toBe('small')

    const map41 = new Float32Array(100)
    for (let i = 0; i < 41; i++) map41[i] = 0.5
    expect(estimateSpread(map41, 10)?.band).toBe('large')
  })

  it('returns null when all cells are zero (flat map)', () => {
    const map = new Float32Array(49)
    expect(estimateSpread(map, 7)).toBeNull()
  })

  it('returns null when map length does not match size^2', () => {
    const map = new Float32Array(48)
    for (let i = 0; i < 20; i++) map[i] = 0.8
    expect(estimateSpread(map, 7)).toBeNull()
  })

  it('values exactly 0.5 count as hot', () => {
    const map = new Float32Array(4)
    map[0] = 0.5
    map[1] = 0.499
    map[2] = 0.0
    map[3] = 0.0
    const res = estimateSpread(map, 2)
    expect(res).not.toBeNull()
    expect(res!.share).toBe(0.25)
    expect(res!.band).toBe('medium')
  })
})
