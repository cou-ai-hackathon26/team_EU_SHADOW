import type { ModelMeta, Prediction } from './types'

/**
 * Browser inference engine. Owner: Masum (M7).
 * Implementation plan (tests first, see src/ai/*.test.ts):
 *   loadModel()  -> fetch /model/model_meta.json, create onnxruntime-web InferenceSession for /model/agroleaf.onnx
 *   preprocess() -> resize shorter side, centre-crop inputSize, normalise with meta.mean/std, NCHW Float32
 *   analyze()    -> run session, logits / T, softmax, decideTier(), optional CAM upsample
 * The UI must call only loadModel() and analyze().
 */
export async function loadModel(): Promise<ModelMeta> {
  throw new Error('engine.loadModel: not implemented yet (M7, Masum)')
}

export async function analyze(_image: ImageBitmap | HTMLImageElement | HTMLCanvasElement): Promise<Prediction> {
  throw new Error('engine.analyze: not implemented yet (M7, Masum)')
}
