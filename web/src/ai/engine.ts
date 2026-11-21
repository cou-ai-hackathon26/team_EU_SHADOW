import * as ort from 'onnxruntime-web'
import { decideTier } from './decideTier'
import { preprocess, type PreprocessImageInput } from './preprocess'
import { softmax } from './softmax'
import type { ClassProb, ModelMeta, Prediction } from './types'

let loadingPromise: Promise<ModelMeta> | null = null
let cachedMeta: ModelMeta | null = null
let cachedSession: ort.InferenceSession | null = null

/** Reset internal cache for test environments. */
export function resetEngineState(): void {
  loadingPromise = null
  cachedMeta = null
  cachedSession = null
}

/**
 * Loads the model metadata and initializes the ONNX InferenceSession.
 * Cached via loadingPromise so concurrent calls create exactly one session.
 */
export function loadModel(): Promise<ModelMeta> {
  if (cachedMeta && cachedSession) {
    return Promise.resolve(cachedMeta)
  }
  if (loadingPromise) {
    return loadingPromise
  }

  loadingPromise = (async () => {
    try {
      const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
      const metaUrl = `${baseUrl}/model/model_meta.json`
      const modelUrl = `${baseUrl}/model/agroleaf.onnx`

      let meta: ModelMeta
      try {
        const res = await fetch(metaUrl)
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        meta = (await res.json()) as ModelMeta
      } catch (err) {
        throw new Error(
          `মডেল লোড করা যায়নি: মেটাডাটা পাওয়া যায়নি (${err instanceof Error ? err.message : String(err)})`,
        )
      }

      try {
        const wasmUrl = `${baseUrl}/ort/ort-wasm-simd-threaded.wasm`
        ort.env.wasm.numThreads = 1
        ort.env.wasm.wasmPaths = {
          wasm: wasmUrl,
          'ort-wasm-simd-threaded.wasm': wasmUrl,
        } as any
        const session = await ort.InferenceSession.create(modelUrl, {
          executionProviders: ['wasm'],
        })
        cachedSession = session
        cachedMeta = meta
        return meta
      } catch (err) {
        throw new Error(
          `মডেল লোড করা যায়নি: অনিক্স সেশন প্রস্তুত ব্যর্থ (${err instanceof Error ? err.message : String(err)})`,
        )
      }
    } catch (err) {
      // Clear cache on failure so next call retries
      loadingPromise = null
      cachedMeta = null
      cachedSession = null
      throw err
    }
  })()

  return loadingPromise
}

/**
 * Runs browser inference on the provided image and returns a calibrated Prediction.
 */
export async function analyze(
  image: PreprocessImageInput,
): Promise<Prediction> {
  const meta = await loadModel()
  const session = cachedSession!

  const startTime = performance.now()

  // 1. Preprocess image into Float32 NCHW tensor
  const tensorData = preprocess(image, meta)
  const inputTensor = new ort.Tensor('float32', tensorData, [
    1,
    3,
    meta.inputSize,
    meta.inputSize,
  ])

  // 2. Run session
  const inputName = session.inputNames[0] ?? 'input'
  const feeds = { [inputName]: inputTensor }
  const outputs = await session.run(feeds)

  // 3. Extract logits & scale with temperature
  const logitsName = session.outputNames[0] ?? 'logits'
  const logitsTensor = outputs[logitsName]
  const logits = logitsTensor.data as Float32Array
  const probs = softmax(logits, meta.temperature)

  // 4. Map to classes and sort descending
  const top: ClassProb[] = meta.classes.map((classId, idx) => ({
    classId,
    prob: probs[idx] ?? 0,
  }))
  top.sort((a, b) => b.prob - a.prob)

  // 5. Determine tier
  const tier = decideTier(top, meta)

  // 6. Handle optional Class Activation Map (CAM) heatmap
  let heatmap: Float32Array | undefined
  let heatmapSize: number | undefined

  if (meta.camOutput && session.outputNames.length > 1) {
    const camName = session.outputNames[1]
    const camTensor = outputs[camName]
    if (camTensor && camTensor.data) {
      const camData = camTensor.data as Float32Array
      // Take channel of top-1 class in meta.classes order
      const top1ClassId = top[0]?.classId
      const top1Idx =
        top1ClassId !== undefined ? meta.classes.indexOf(top1ClassId) : 0

      const dims = camTensor.dims
      const w = dims ? dims[dims.length - 1] : 7
      const h = dims ? dims[dims.length - 2] : w
      const channelArea = h * w

      const start = (top1Idx >= 0 ? top1Idx : 0) * channelArea
      const end = start + channelArea
      const channelSlice = camData.subarray(start, end)

      let min = Infinity
      let max = -Infinity
      for (let i = 0; i < channelSlice.length; i++) {
        const val = channelSlice[i]
        if (val < min) min = val
        if (val > max) max = val
      }

      heatmap = new Float32Array(channelSlice.length)
      if (max > min) {
        const range = max - min
        for (let i = 0; i < channelSlice.length; i++) {
          heatmap[i] = (channelSlice[i] - min) / range
        }
      } else {
        // all-equal map -> zeros
        heatmap.fill(0)
      }
      heatmapSize = w
    }
  }

  const latencyMs = Math.max(0, Math.round(performance.now() - startTime))

  return {
    tier,
    top,
    modelVersion: meta.version,
    trainedFromScratch: meta.trainedFromScratch,
    latencyMs,
    ...(meta.camOutput && heatmap ? { heatmap, heatmapSize } : {}),
  }
}
