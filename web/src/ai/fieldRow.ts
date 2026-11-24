import { decideAbstention, entropyAndMargin } from './abstain'
import type { DiseaseClassId } from './classes'
import { decideTier } from './decideTier'
import { loadModel, runLogits } from './engine'
import type {
  AbstentionReason,
  FieldRowOptions,
  FieldRowResult,
  FieldSummary,
  LeafBox,
  LeafScreening,
  LeafStatus,
  ScreenFieldRow,
} from './fieldRow.types'
import { computeColorStats, extractPixelData } from './leafColor'
import { proposeLeafRegions } from './leafRegions'
import { preprocess, type PreprocessImageInput } from './preprocess'
import { softmax } from './softmax'
import type { ClassProb } from './types'

/**
 * Crops a subregion from RGBA pixel buffer into an ImageData-like object.
 */
function cropBox(
  srcData: ArrayLike<number>,
  srcW: number,
  box: LeafBox,
): { data: Uint8ClampedArray; width: number; height: number } {
  const cropData = new Uint8ClampedArray(box.w * box.h * 4)
  for (let cy = 0; cy < box.h; cy++) {
    for (let cx = 0; cx < box.w; cx++) {
      const srcIdx = ((box.y + cy) * srcW + (box.x + cx)) * 4
      const dstIdx = (cy * box.w + cx) * 4
      cropData[dstIdx] = srcData[srcIdx]
      cropData[dstIdx + 1] = srcData[srcIdx + 1]
      cropData[dstIdx + 2] = srcData[srcIdx + 2]
      cropData[dstIdx + 3] = srcData[srcIdx + 3]
    }
  }
  return { data: cropData, width: box.w, height: box.h }
}

/** Long-side cap for the working pixel buffer. The model sees 224 px crops, so
 * 1600 px keeps plenty of detail while a 12 MP phone photo drops from ~48 MB of
 * RGBA to ~7.7 MB, and every per-leaf crop shrinks with it. */
export const MAX_WORK_SIDE = 1600

/** Nearest-neighbour downscale of an RGBA buffer to at most MAX_WORK_SIDE on the long side.
 * Returns the input untouched when it is already small enough. */
export function toWorkingBuffer(
  src: { data: ArrayLike<number>; width: number; height: number },
  maxSide = MAX_WORK_SIDE,
): { data: ArrayLike<number>; width: number; height: number; scale: number } {
  const longSide = Math.max(src.width, src.height)
  if (longSide <= maxSide) return { ...src, scale: 1 }
  const scale = maxSide / longSide
  const w = Math.max(1, Math.round(src.width * scale))
  const h = Math.max(1, Math.round(src.height * scale))
  const out = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    const sy = Math.min(src.height - 1, Math.floor(y / scale))
    for (let x = 0; x < w; x++) {
      const sx = Math.min(src.width - 1, Math.floor(x / scale))
      const si = (sy * src.width + sx) * 4
      const di = (y * w + x) * 4
      out[di] = src.data[si]
      out[di + 1] = src.data[si + 1]
      out[di + 2] = src.data[si + 2]
      out[di + 3] = src.data[si + 3]
    }
  }
  return { data: out, width: w, height: h, scale }
}

/** Maps a box from working-buffer coordinates back to the original photo, clipped. */
function toOriginalBox(box: LeafBox, scale: number, width: number, height: number): LeafBox {
  if (scale === 1) return box
  const x = Math.max(0, Math.min(width - 1, Math.floor(box.x / scale)))
  const y = Math.max(0, Math.min(height - 1, Math.floor(box.y / scale)))
  const w = Math.max(1, Math.min(width - x, Math.round(box.w / scale)))
  const h = Math.max(1, Math.min(height - y, Math.round(box.h / scale)))
  return { x, y, w, h }
}

const yieldToUi = () => new Promise<void>((r) => setTimeout(r, 0))

/**
 * Summarizes the screened leaves across a whole field row.
 * Pure function; calculates counts, proportions, highest risk disease, and abstention reasons.
 */
export function summarizeField(leaves: LeafScreening[]): FieldSummary {
  const totalRegions = leaves.length
  let healthy = 0
  let diseased = 0
  let uncertain = 0
  let abstained = 0

  const byDisease: Partial<Record<DiseaseClassId, number>> = {}
  const diseaseMaxConf: Partial<Record<DiseaseClassId, number>> = {}
  const abstainedByReason: Record<AbstentionReason, number> = {
    not_rice: 0,
    dead_leaf: 0,
    unrelated_crop: 0,
  }

  for (const leaf of leaves) {
    if (leaf.status === 'healthy') {
      healthy++
    } else if (leaf.status === 'diseased') {
      diseased++
      if (leaf.label && leaf.label !== 'healthy') {
        byDisease[leaf.label] = (byDisease[leaf.label] ?? 0) + 1
        diseaseMaxConf[leaf.label] = Math.max(
          diseaseMaxConf[leaf.label] ?? 0,
          leaf.confidence,
        )
      }
    } else if (leaf.status === 'uncertain') {
      uncertain++
    } else if (leaf.status === 'abstained') {
      abstained++
      if (leaf.abstain) {
        abstainedByReason[leaf.abstain] = (abstainedByReason[leaf.abstain] ?? 0) + 1
      }
    }
  }

  const screened = healthy + diseased + uncertain

  // Highest risk disease: most diseased leaves; tie-break by higher maxConfidence
  let highestRisk: {
    classId: DiseaseClassId
    count: number
    maxConfidence: number
  } | null = null

  const diseaseEntries = Object.entries(byDisease) as [DiseaseClassId, number][]
  if (diseaseEntries.length > 0) {
    diseaseEntries.sort(([classA, countA], [classB, countB]) => {
      if (countB !== countA) {
        return countB - countA
      }
      return (diseaseMaxConf[classB] ?? 0) - (diseaseMaxConf[classA] ?? 0)
    })

    const [topClass, topCount] = diseaseEntries[0]
    highestRisk = {
      classId: topClass,
      count: topCount,
      maxConfidence: diseaseMaxConf[topClass] ?? 0,
    }
  }

  const diseasedShare = healthy + diseased > 0 ? diseased / (healthy + diseased) : 0

  // Field abstention: when NO leaf was screenable, pick the dominant abstain reason
  let fieldAbstain: AbstentionReason | null = null
  if (screened === 0 && totalRegions > 0) {
    const reasons = Object.entries(abstainedByReason) as [AbstentionReason, number][]
    reasons.sort((a, b) => b[1] - a[1])
    if (reasons[0][1] > 0) {
      fieldAbstain = reasons[0][0]
    }
  }

  return {
    totalRegions,
    screened,
    healthy,
    diseased,
    uncertain,
    abstained,
    byDisease,
    abstainedByReason,
    highestRisk,
    diseasedShare,
    fieldAbstain,
  }
}

/**
 * Screen a full field-row image by proposing leaf regions and screening each with ONNX runtime.
 */
export const screenFieldRow: ScreenFieldRow = async (
  image: PreprocessImageInput,
  opts?: FieldRowOptions,
): Promise<FieldRowResult> => {
  if (opts?.signal?.aborted) {
    throw new DOMException('The operation was aborted', 'AbortError')
  }

  const startTime = performance.now()
  const meta = await loadModel()

  // 1. Extract image pixel buffer, then work on a downscaled copy of large photos
  const full = extractPixelData(image)
  const width = full.width
  const height = full.height
  const work = toWorkingBuffer(full)
  const { data } = work

  if (opts?.signal?.aborted) {
    throw new DOMException('The operation was aborted', 'AbortError')
  }

  // 2. Propose leaf regions
  opts?.onProgress?.({ stage: 'detecting', done: 0, total: 0 })
  const { boxes, mode } = proposeLeafRegions(
    { data, width: work.width, height: work.height },
    { maxRegions: opts?.maxRegions },
  )

  const n = boxes.length
  if (n === 0) {
    const emptySummary = summarizeField([])
    return {
      imageWidth: width,
      imageHeight: height,
      mode,
      leaves: [],
      summary: emptySummary,
      modelVersion: meta.version,
      latencyMs: Math.max(0, Math.round(performance.now() - startTime)),
    }
  }

  // 3. Preprocess and prepare batch tensor data
  const sampleSize = 3 * meta.inputSize * meta.inputSize
  const batchedTensorData = new Float32Array(n * sampleSize)
  const cropsColorStats = []

  for (let i = 0; i < n; i++) {
    const box = boxes[i]
    const crop = cropBox(data, work.width, box)
    const tensor = preprocess(crop, meta)
    batchedTensorData.set(tensor, i * sampleSize)
    cropsColorStats.push(computeColorStats(data, work.width, work.height, box))
    // Keep the page responsive while crops are prepared
    if (i % 4 === 3) {
      await yieldToUi()
      if (opts?.signal?.aborted) {
        throw new DOMException('The operation was aborted', 'AbortError')
      }
    }
  }

  if (opts?.signal?.aborted) {
    throw new DOMException('The operation was aborted', 'AbortError')
  }

  // 4. Run real inference through runLogits
  const allLogits = await runLogits(batchedTensorData, n)

  // 5. Evaluate each leaf screening
  const leaves: LeafScreening[] = []

  for (let i = 0; i < n; i++) {
    if (opts?.signal?.aborted) {
      throw new DOMException('The operation was aborted', 'AbortError')
    }

    const box = toOriginalBox(boxes[i], work.scale, width, height)
    const color = cropsColorStats[i]
    const logits = allLogits[i]
    const probs = softmax(logits, meta.temperature)

    const diseases: { classId: DiseaseClassId; prob: number }[] = []
    let notRiceEntry: ClassProb | null = null

    for (let c = 0; c < meta.classes.length; c++) {
      const classId = meta.classes[c]
      const prob = probs[c] ?? 0
      if (classId === 'not_rice') {
        notRiceEntry = { classId, prob }
      } else {
        diseases.push({ classId: classId as DiseaseClassId, prob })
      }
    }

    diseases.sort((a, b) => b.prob - a.prob)
    const top: ClassProb[] = notRiceEntry ? [...diseases, notRiceEntry] : diseases
    const top1Disease = diseases[0] as { classId: DiseaseClassId; prob: number } | undefined

    const tier = decideTier(top, meta)
    const abstain = decideAbstention({ probs: top, color, meta })
    const { entropy, margin } = entropyAndMargin(top)
    const pNotRice = notRiceEntry?.prob ?? 0

    // Determine status per contract
    let status: LeafStatus
    let label: DiseaseClassId | null = null

    if (abstain !== null) {
      status = 'abstained'
      label = null
    } else if (tier === 'low') {
      status = 'uncertain'
      label = top1Disease?.classId ?? null
    } else if (top1Disease?.classId === 'healthy') {
      status = 'healthy'
      label = 'healthy'
    } else {
      status = 'diseased'
      label = top1Disease?.classId ?? null
    }

    const confidence = top1Disease?.prob ?? 0

    leaves.push({
      id: i + 1,
      box,
      source: mode === 'leaf_regions' ? 'leaf_region' : 'grid_tile',
      status,
      label,
      confidence,
      tier,
      abstain,
      margin,
      entropy,
      pNotRice,
      color,
    })

    opts?.onProgress?.({ stage: 'classifying', done: i + 1, total: n })

    // Yield control to UI thread
    await yieldToUi()
  }

  // 6. Summarize results
  opts?.onProgress?.({ stage: 'summarizing', done: n, total: n })
  const summary = summarizeField(leaves)
  const latencyMs = Math.max(0, Math.round(performance.now() - startTime))

  return {
    imageWidth: width,
    imageHeight: height,
    mode,
    leaves,
    summary,
    modelVersion: meta.version,
    latencyMs,
  }
}
