import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as ort from 'onnxruntime-web'
import { loadModel, analyze, resetEngineState } from './engine'
import type { ModelMeta } from './types'

const sampleMeta: ModelMeta = {
  version: 'v1-mnv3s-scratch',
  architecture: 'MobileNetV3-Small (random init)',
  trainedFromScratch: true,
  classes: [
    'healthy',
    'blast',
    'brown_spot',
    'leaf_smut',
    'tungro',
    'sheath_blight',
    'not_rice',
  ],
  inputSize: 224,
  mean: [0.485, 0.456, 0.406],
  std: [0.229, 0.224, 0.225],
  temperature: 1.25,
  thresholds: {
    high: 0.85,
    medium: 0.55,
    healthyHigh: 0.9,
    notRice: 0.5,
  },
  camOutput: false,
}

// Mock onnxruntime-web
vi.mock('onnxruntime-web', () => {
  const runMock = vi.fn()
  const sessionMock = {
    inputNames: ['input'],
    outputNames: ['logits'],
    run: runMock,
  }
  return {
    InferenceSession: {
      create: vi.fn().mockResolvedValue(sessionMock),
    },
    Tensor: class Tensor {
      type: string
      data: any
      dims: number[]
      constructor(type: string, data: any, dims: number[]) {
        this.type = type
        this.data = data
        this.dims = dims
      }
    },
    env: { wasm: {} },
    _sessionMock: sessionMock,
    _runMock: runMock,
  }
})

describe('engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetEngineState?.()
    ;(ort as any).env.wasm = {}
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loadModel() fetches meta, initializes onnx session and returns ModelMeta', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => sampleMeta,
    } as Response)
    vi.stubGlobal('fetch', fetchMock)

    const meta = await loadModel()

    expect(meta.version).toBe('v1-mnv3s-scratch')
    expect(meta.classes).toHaveLength(7)
    expect(ort.InferenceSession.create).toHaveBeenCalled()
  })

  it('sets ort.env.wasm.wasmPaths before InferenceSession.create is called', async () => {
    let wasmPathsWhenCreating: any = undefined
    vi.mocked(ort.InferenceSession.create).mockImplementationOnce(async () => {
      wasmPathsWhenCreating = (ort as any).env.wasm.wasmPaths
      return (ort as any)._sessionMock
    })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => sampleMeta,
      } as Response),
    )

    await loadModel()
    expect(wasmPathsWhenCreating).toBeDefined()
  })

  it('concurrent loadModel() calls create exactly one session (Promise caching)', async () => {
    let resolveSession: any
    const sessionPromise = new Promise((resolve) => {
      resolveSession = resolve
    })

    vi.mocked(ort.InferenceSession.create).mockImplementationOnce(
      () => sessionPromise as any,
    )

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => sampleMeta,
      } as Response),
    )

    // Call loadModel concurrently twice
    const call1 = loadModel()
    const call2 = loadModel()

    resolveSession((ort as any)._sessionMock)
    const [meta1, meta2] = await Promise.all([call1, call2])

    expect(meta1).toBe(meta2)
    expect(ort.InferenceSession.create).toHaveBeenCalledTimes(1)
  })

  it('clears cache if loading fails so next call retries', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: false, status: 500 } as Response),
    )

    await expect(loadModel()).rejects.toThrow(/মডেল লোড করা যায়নি/)

    // Next call succeeds when fetch succeeds
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => sampleMeta,
      } as Response),
    )

    const meta = await loadModel()
    expect(meta.version).toBe(sampleMeta.version)
  })

  it('loadModel() throws an Error with a Bangla message when session creation fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => sampleMeta,
      } as Response),
    )

    vi.mocked(ort.InferenceSession.create).mockRejectedValueOnce(
      new Error('WASM initialization error'),
    )

    await expect(loadModel()).rejects.toThrow(/মডেল লোড করা যায়নি/)
  })

  it('analyze() returns a Prediction with top sorted descending, correct length, latencyMs, and meta info', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => sampleMeta,
      } as Response),
    )

    // Logits for 7 classes with dominant class 1 ('blast')
    const fakeLogits = new Float32Array([1.0, 8.0, 2.0, 0.5, 0.2, 0.1, -1.0])
    const sessionMock = (ort as any)._sessionMock
    sessionMock.outputNames = ['logits']
    sessionMock.run.mockResolvedValue({
      logits: { data: fakeLogits },
    })

    const data = new Uint8ClampedArray(224 * 224 * 4)
    const dummyImage = { data, width: 224, height: 224 } as any

    const prediction = await analyze(dummyImage)

    expect(prediction.modelVersion).toBe(sampleMeta.version)
    expect(prediction.trainedFromScratch).toBe(sampleMeta.trainedFromScratch)
    expect(prediction.latencyMs).toBeGreaterThanOrEqual(0)
    expect(prediction.top).toHaveLength(sampleMeta.classes.length)

    // Top must be sorted descending by prob
    for (let i = 0; i < prediction.top.length - 1; i++) {
      expect(prediction.top[i].prob).toBeGreaterThanOrEqual(
        prediction.top[i + 1].prob,
      )
    }

    // Top-1 must be 'blast' (index 1 had highest logit 8.0)
    expect(prediction.top[0].classId).toBe('blast')
    expect(prediction.tier).toBe('high')

    // Since camOutput is false, heatmap must be absent
    expect(prediction.heatmap).toBeUndefined()
    expect(prediction.heatmapSize).toBeUndefined()
  })

  it('analyze() returns top-1 class normalized heatmap (shape [1, C, h, w]) when meta.camOutput is true', async () => {
    const metaWithCam: ModelMeta = {
      ...sampleMeta,
      camOutput: true,
    }

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => metaWithCam,
      } as Response),
    )

    // Top-1 is class at index 1 ('blast')
    const fakeLogits = new Float32Array([1.0, 8.0, 2.0, 0.5, 0.2, 0.1, -1.0])

    // CAM output has shape [1, 7, 7, 7] = 7 classes, each 7x7 = 49 values
    // Create distinct values for class index 1 (10 to 58)
    const camData = new Float32Array(7 * 7 * 7)
    const class1Offset = 1 * 49
    for (let i = 0; i < 49; i++) {
      camData[class1Offset + i] = 10 + i
    }

    const sessionMock = (ort as any)._sessionMock
    sessionMock.outputNames = ['logits', 'cam']
    sessionMock.run.mockResolvedValue({
      logits: { data: fakeLogits },
      cam: { data: camData, dims: [1, 7, 7, 7] },
    })

    const data = new Uint8ClampedArray(224 * 224 * 4)
    const dummyImage = { data, width: 224, height: 224 } as any

    const prediction = await analyze(dummyImage)

    expect(prediction.heatmap).toBeDefined()
    expect(prediction.heatmap).toHaveLength(49)
    expect(prediction.heatmapSize).toBe(7)

    // Check min-max normalisation: min was 10 -> 0, max was 58 -> 1
    expect(prediction.heatmap![0]).toBeCloseTo(0.0, 4)
    expect(prediction.heatmap![48]).toBeCloseTo(1.0, 4)
  })

  it('analyze() sets all-equal heatmap values to zeros', async () => {
    const metaWithCam: ModelMeta = {
      ...sampleMeta,
      camOutput: true,
    }

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => metaWithCam,
      } as Response),
    )

    const fakeLogits = new Float32Array([1.0, 8.0, 2.0, 0.5, 0.2, 0.1, -1.0])
    const camData = new Float32Array(7 * 7 * 7).fill(5.0) // all equal

    const sessionMock = (ort as any)._sessionMock
    sessionMock.outputNames = ['logits', 'cam']
    sessionMock.run.mockResolvedValue({
      logits: { data: fakeLogits },
      cam: { data: camData, dims: [1, 7, 7, 7] },
    })

    const data = new Uint8ClampedArray(224 * 224 * 4)
    const dummyImage = { data, width: 224, height: 224 } as any

    const prediction = await analyze(dummyImage)

    expect(prediction.heatmap).toBeDefined()
    for (const val of prediction.heatmap!) {
      expect(val).toBe(0)
    }
  })
})
