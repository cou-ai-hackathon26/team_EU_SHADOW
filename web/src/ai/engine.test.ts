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

  it('loadModel() throws an Error with a Bangla message when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response),
    )

    await expect(loadModel()).rejects.toThrow(/মডেল লোড করা যায়নি/)
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

    // Logits for 7 classes
    const fakeLogits = new Float32Array([1.0, 5.0, 2.0, 0.5, 0.2, 0.1, -1.0])
    const sessionMock = (ort as any)._sessionMock
    sessionMock.outputNames = ['logits']
    sessionMock.run.mockResolvedValue({
      logits: { data: fakeLogits },
    })

    // Create a dummy image
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

    // Top-1 must be 'blast' (index 1 had highest logit 5.0)
    expect(prediction.top[0].classId).toBe('blast')
    expect(prediction.tier).toBe('high')

    // Since camOutput is false, heatmap must be absent
    expect(prediction.heatmap).toBeUndefined()
    expect(prediction.heatmapSize).toBeUndefined()
  })

  it('analyze() returns heatmap and heatmapSize when meta.camOutput is true', async () => {
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

    const fakeLogits = new Float32Array([1.0, 5.0, 2.0, 0.5, 0.2, 0.1, -1.0])
    const fakeCam = new Float32Array(7 * 7).fill(0.75)

    const sessionMock = (ort as any)._sessionMock
    sessionMock.outputNames = ['logits', 'cam']
    sessionMock.run.mockResolvedValue({
      logits: { data: fakeLogits },
      cam: { data: fakeCam, dims: [1, 7, 7] },
    })

    const data = new Uint8ClampedArray(224 * 224 * 4)
    const dummyImage = { data, width: 224, height: 224 } as any

    const prediction = await analyze(dummyImage)

    expect(prediction.heatmap).toBeDefined()
    expect(prediction.heatmap).toBeInstanceOf(Float32Array)
    expect(prediction.heatmapSize).toBe(7)
  })
})
