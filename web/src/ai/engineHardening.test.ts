import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { decideAbstention } from './abstain'
import type { DiseaseClassId } from './classes'
import { resetEngineState } from './engine'
import { screenFieldRow, toWorkingBuffer } from './fieldRow'
import { computeColorStats } from './leafColor'
import { proposeLeafRegions } from './leafRegions'
import type { ClassProb, ModelMeta } from './types'

// Onsite hardening regression tests (C1 + C2). Synthetic pixels only; the ONNX
// session is mocked here because this is a *.test.ts file (Rule 9 allows that).

const meta: Pick<ModelMeta, 'thresholds'> = {
  thresholds: { high: 0.85, medium: 0.6, healthyHigh: 0.85, notRice: 0.9471 },
}

type RGB = [number, number, number]
const GREEN: RGB = [60, 140, 40]
const LESION: RGB = [140, 85, 40] // brown spot / blast lesion
const SOIL: RGB = [95, 75, 55]
const STRAW: RGB = [185, 155, 100]
const TUNGRO_YELLOW: RGB = [220, 195, 60]

/** Builds a w x h RGBA buffer filled row by row with the given colour shares. */
function stripes(w: number, h: number, parts: [RGB, number][]): ImageData {
  const data = new Uint8ClampedArray(w * h * 4)
  const total = w * h
  let i = 0
  for (const [rgb, share] of parts) {
    const end = Math.min(total, i + Math.round(share * total))
    for (; i < end; i++) {
      data.set([rgb[0], rgb[1], rgb[2], 255], i * 4)
    }
  }
  const last = parts[parts.length - 1][0]
  for (; i < total; i++) data.set([last[0], last[1], last[2], 255], i * 4)
  return { data, width: w, height: h, colorSpace: 'srgb' } as ImageData
}

function confident(classId: DiseaseClassId, p = 0.9): ClassProb[] {
  const rest = (1 - p) / 6
  const ids: (DiseaseClassId | 'not_rice')[] = [
    'healthy', 'blast', 'brown_spot', 'leaf_smut', 'tungro', 'sheath_blight', 'not_rice',
  ]
  return ids.map((id) => ({ classId: id, prob: id === classId ? p : rest }))
}

function stats(img: ImageData) {
  return computeColorStats(img.data, img.width, img.height)
}

describe('C2 hardening: no false abstention on diseased rice leaves', () => {
  const diseases: DiseaseClassId[] = ['blast', 'brown_spot', 'leaf_smut', 'tungro', 'sheath_blight']
  for (const share of [0.25, 0.3, 0.35]) {
    for (const d of diseases) {
      it(`${d} leaf with ${share * 100}% brown lesions is screened, not abstained`, () => {
        const img = stripes(100, 100, [[LESION, share], [SOIL, 0.05], [GREEN, 1 - share - 0.05]])
        const color = stats(img)
        expect(color.brownRatio).toBeGreaterThanOrEqual(share - 0.02)
        expect(decideAbstention({ probs: confident(d), color, meta })).toBeNull()
      })
    }
  }

  it('a heavily yellowed tungro leaf with some living green is screened, not called dead', () => {
    // Tungro turns most of the blade yellow-orange; that hue falls in the "brown" band.
    const img = stripes(100, 100, [[TUNGRO_YELLOW, 0.8], [GREEN, 0.15], [SOIL, 0.05]])
    const color = stats(img)
    expect(color.brownRatio).toBeGreaterThan(0.45)
    expect(color.greenRatio).toBeLessThanOrEqual(0.2)
    expect(decideAbstention({ probs: confident('tungro'), color, meta })).toBeNull()
  })
})

describe('C2 hardening: real dead leaves still abstain', () => {
  it('a dry leaf with >50% brown and <15% green returns dead_leaf', () => {
    const img = stripes(100, 100, [[STRAW, 0.55], [LESION, 0.2], [GREEN, 0.1], [SOIL, 0.15]])
    const color = stats(img)
    expect(color.brownRatio).toBeGreaterThan(0.5)
    expect(color.greenRatio).toBeLessThan(0.15)
    expect(decideAbstention({ probs: confident('blast', 0.92), color, meta })).toBe('dead_leaf')
  })

  it('a dry leaf the model calls tungro but with almost no green is still dead_leaf', () => {
    const img = stripes(100, 100, [[STRAW, 0.85], [GREEN, 0.05], [SOIL, 0.1]])
    const color = stats(img)
    expect(decideAbstention({ probs: confident('tungro', 0.95), color, meta })).toBe('dead_leaf')
  })
})

describe('C1 hardening: region proposals', () => {
  it('dense canopy (>70% green) falls back to the 6-tile grid inside the image', () => {
    const img = stripes(600, 400, [[GREEN, 0.9], [SOIL, 0.1]])
    const { boxes, mode } = proposeLeafRegions(img)
    expect(mode).toBe('grid_fallback')
    expect(boxes).toHaveLength(6)
    for (const b of boxes) {
      expect(b.x).toBeGreaterThanOrEqual(0)
      expect(b.y).toBeGreaterThanOrEqual(0)
      expect(b.x + b.w).toBeLessThanOrEqual(600)
      expect(b.y + b.h).toBeLessThanOrEqual(400)
    }
  })

  it('caps proposals at maxRegions (24) when many separate leaves are visible', () => {
    const w = 800
    const h = 600
    const data = new Uint8ClampedArray(w * h * 4)
    for (let i = 0; i < w * h; i++) data.set([SOIL[0], SOIL[1], SOIL[2], 255], i * 4)
    // 8 x 5 = 40 separated green patches
    for (let gy = 0; gy < 5; gy++) {
      for (let gx = 0; gx < 8; gx++) {
        for (let y = gy * 120 + 30; y < gy * 120 + 90; y++) {
          for (let x = gx * 100 + 25; x < gx * 100 + 75; x++) {
            data.set([GREEN[0], GREEN[1], GREEN[2], 255], (y * w + x) * 4)
          }
        }
      }
    }
    const { boxes } = proposeLeafRegions({ data, width: w, height: h })
    expect(boxes.length).toBeLessThanOrEqual(24)
    expect(boxes.length).toBeGreaterThan(1)
  })
})

describe('C1 hardening: large photos are downscaled before work', () => {
  it('a 4000x3000 photo becomes a working buffer of at most 1600 px on the long side', () => {
    const img = stripes(4000, 3000, [[GREEN, 0.5], [SOIL, 0.5]])
    const work = toWorkingBuffer(img)
    expect(Math.max(work.width, work.height)).toBeLessThanOrEqual(1600)
    expect(work.data.length).toBe(work.width * work.height * 4)
    expect(work.scale).toBeCloseTo(1600 / 4000, 5)
  })

  it('small photos are left untouched', () => {
    const img = stripes(800, 600, [[GREEN, 1]])
    const work = toWorkingBuffer(img)
    expect(work.width).toBe(800)
    expect(work.scale).toBe(1)
    expect(work.data).toBe(img.data)
  })
})

const testMeta: ModelMeta = {
  version: 'v-hardening-test',
  architecture: 'test',
  trainedFromScratch: true,
  classes: ['healthy', 'blast', 'brown_spot', 'leaf_smut', 'tungro', 'sheath_blight', 'not_rice'],
  inputSize: 224,
  mean: [0.485, 0.456, 0.406],
  std: [0.229, 0.224, 0.225],
  temperature: 1.0,
  thresholds: { high: 0.85, medium: 0.55, healthyHigh: 0.9, notRice: 0.9471 },
  camOutput: false,
}

vi.mock('onnxruntime-web/wasm', () => {
  const sessionMock = {
    inputNames: ['input'],
    outputNames: ['logits'],
    run: vi.fn().mockImplementation(async (feeds: { input?: { dims?: number[] } }) => {
      const batch = feeds.input?.dims?.[0] ?? 1
      const logits = new Float32Array(batch * 7)
      for (let b = 0; b < batch; b++) logits[b * 7] = 5.0
      return { logits: { data: logits, dims: [batch, 7] } }
    }),
  }
  return {
    InferenceSession: { create: vi.fn().mockResolvedValue(sessionMock) },
    Tensor: class Tensor {
      type: string
      data: unknown
      dims: number[]
      constructor(type: string, data: unknown, dims: number[]) {
        this.type = type
        this.data = data
        this.dims = dims
      }
    },
    env: { wasm: {} },
  }
})

describe('C1 hardening: screenFieldRow end to end (mocked session)', () => {
  beforeEach(() => {
    resetEngineState()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => testMeta }),
    )
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function threeLeaves(w: number, h: number): ImageData {
    const data = new Uint8ClampedArray(w * h * 4)
    for (let i = 0; i < w * h; i++) data.set([SOIL[0], SOIL[1], SOIL[2], 255], i * 4)
    const cols = [0.1, 0.4, 0.7]
    for (const c of cols) {
      for (let y = Math.round(h * 0.2); y < Math.round(h * 0.8); y++) {
        for (let x = Math.round(w * c); x < Math.round(w * (c + 0.18)); x++) {
          data.set([GREEN[0], GREEN[1], GREEN[2], 255], (y * w + x) * 4)
        }
      }
    }
    return { data, width: w, height: h, colorSpace: 'srgb' } as ImageData
  }

  it('aborting mid-scan rejects with AbortError and leaves no unhandled rejection', async () => {
    const unhandled = vi.fn()
    process.on('unhandledRejection', unhandled)
    const controller = new AbortController()
    const img = threeLeaves(600, 400)
    const run = screenFieldRow(img, {
      signal: controller.signal,
      onProgress: (p) => {
        if (p.stage === 'classifying' && p.done === 1) controller.abort()
      },
    })
    await expect(run).rejects.toMatchObject({ name: 'AbortError' })
    await new Promise((r) => setTimeout(r, 10))
    process.off('unhandledRejection', unhandled)
    expect(unhandled).not.toHaveBeenCalled()
  })

  it('an already-aborted signal rejects before any work', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(
      screenFieldRow(threeLeaves(300, 200), { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('a 4000x3000 photo returns boxes in original coordinates, inside the image', async () => {
    const img = threeLeaves(4000, 3000)
    const res = await screenFieldRow(img)
    expect(res.imageWidth).toBe(4000)
    expect(res.imageHeight).toBe(3000)
    expect(res.leaves.length).toBeGreaterThanOrEqual(3)
    expect(res.leaves.length).toBeLessThanOrEqual(24)
    for (const leaf of res.leaves) {
      expect(leaf.box.x).toBeGreaterThanOrEqual(0)
      expect(leaf.box.y).toBeGreaterThanOrEqual(0)
      expect(leaf.box.x + leaf.box.w).toBeLessThanOrEqual(4000)
      expect(leaf.box.y + leaf.box.h).toBeLessThanOrEqual(3000)
    }
    // Leaves span the full-size frame, not the 1600 px working copy.
    expect(Math.max(...res.leaves.map((l) => l.box.x + l.box.w))).toBeGreaterThan(2000)
  }, 30_000)
})
