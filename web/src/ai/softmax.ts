/**
 * Softmax with temperature scaling:
 * p_i = exp((logits[i] / T) - max) / sum(exp((logits[j] / T) - max))
 */
export function softmax(
  logits: number[] | Float32Array,
  temperature: number = 1.0,
): Float32Array {
  if (temperature <= 0) {
    throw new Error('Temperature must be strictly positive')
  }

  const n = logits.length
  const scaled = new Float32Array(n)
  let max = -Infinity

  for (let i = 0; i < n; i++) {
    const val = logits[i] / temperature
    scaled[i] = val
    if (val > max) {
      max = val
    }
  }

  let sum = 0
  const probs = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const exp = Math.exp(scaled[i] - max)
    probs[i] = exp
    sum += exp
  }

  const invSum = sum > 0 ? 1.0 / sum : 0
  for (let i = 0; i < n; i++) {
    probs[i] *= invSum
  }

  return probs
}
