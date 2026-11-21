import type { ClassId } from './classes'

/**
 * CONTRACT between the AI engine (Masum, src/ai/) and the UI (Tanjil) and content (Mehedi).
 * Do not change field names without a PR reviewed by all three members.
 */

/** Contents of public/model/model_meta.json (written by ml/export.py). */
export interface ModelMeta {
  version: string                 // e.g. "v1-mnv3s-scratch"
  architecture: string            // e.g. "MobileNetV3-Small (random init)"
  trainedFromScratch: boolean     // false => UI must show "Temporary Prototype — Pretrained Model"
  classes: ClassId[]              // order = model output order
  inputSize: number               // 224
  mean: [number, number, number]  // normalisation used in training
  std: [number, number, number]
  temperature: number             // temperature scaling T (logits / T)
  thresholds: {
    high: number                  // top-1 calibrated prob >= high  => tier "high"
    medium: number                // top-1 >= medium               => tier "medium"; else "low"
    healthyHigh: number           // stricter bar before saying "healthy"
    notRice: number               // p(not_rice) >= this => tier "not_rice"
  }
  camOutput: boolean              // true if the ONNX graph has a second output with class activation maps
}

export type ConfidenceTier = 'high' | 'medium' | 'low' | 'not_rice'

export interface ClassProb {
  classId: ClassId
  prob: number                    // calibrated probability, 0..1
}

/** Image quality check (T3, Tanjil). Pure function of pixels; warnings never block analysis. */
export interface QualityReport {
  brightness: number              // mean luma 0..255
  sharpness: number               // variance of Laplacian
  tooDark: boolean
  tooBright: boolean
  tooBlurry: boolean
}

/** What analyze() returns. The UI renders ONLY from this object. */
export interface Prediction {
  tier: ConfidenceTier
  top: ClassProb[]                // sorted desc, length = number of classes
  /** Heat map for top-1 class, values 0..1, row-major, size heatmapSize x heatmapSize. Absent if camOutput=false. */
  heatmap?: Float32Array
  heatmapSize?: number
  modelVersion: string
  trainedFromScratch: boolean
  latencyMs: number
}
