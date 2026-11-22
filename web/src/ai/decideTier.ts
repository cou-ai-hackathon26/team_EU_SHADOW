import type { ClassProb, ConfidenceTier, ModelMeta } from './types'

/**
 * Determine prediction confidence tier based on calibrated probabilities and thresholds.
 * Rules:
 *  1. not_rice when p(not_rice) >= thresholds.notRice
 *  2. top-1 == 'healthy' needs thresholds.healthyHigh for 'high', else drops to 'medium' (if >= medium)
 *  3. top-1 >= thresholds.high => 'high'
 *  4. top-1 >= thresholds.medium => 'medium'
 *  5. otherwise => 'low'
 */
export function decideTier(
  probs: ClassProb[],
  meta: Pick<ModelMeta, 'thresholds'>,
): ConfidenceTier {
  const { thresholds } = meta

  // 1. not_rice threshold check
  const notRiceProb = probs.find((p) => p.classId === 'not_rice')?.prob ?? 0
  if (notRiceProb >= thresholds.notRice) {
    return 'not_rice'
  }

  // 2. Find top-1
  let top1: ClassProb | undefined
  for (const p of probs) {
    if (!top1 || p.prob > top1.prob) {
      top1 = p
    }
  }

  if (!top1) {
    return 'low'
  }

  // 3. Stricter bar for 'healthy'
  if (top1.classId === 'healthy') {
    if (top1.prob >= thresholds.healthyHigh) {
      return 'high'
    }
    if (top1.prob >= thresholds.medium) {
      return 'medium'
    }
    return 'low'
  }

  // 4. Other disease classes
  if (top1.prob >= thresholds.high) {
    return 'high'
  }
  if (top1.prob >= thresholds.medium) {
    return 'medium'
  }
  return 'low'
}
