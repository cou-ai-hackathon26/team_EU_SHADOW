import { describe, it, expect } from 'vitest'
import { softmax } from './softmax'

describe('softmax', () => {
  it('outputs sum to 1', () => {
    const logits = [2.5, 1.2, -0.5, 0.8, 3.1, -1.0]
    const probs = softmax(logits, 1.0)

    expect(probs).toHaveLength(logits.length)
    const sum = Array.from(probs).reduce((acc, p) => acc + p, 0)
    expect(sum).toBeCloseTo(1.0, 5)

    for (const p of probs) {
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(1)
    }
  })

  it('higher T gives a flatter distribution (lower max prob)', () => {
    const logits = [5.0, 2.0, 1.0, 0.0, -1.0]
    const probsT1 = softmax(logits, 1.0)
    const probsT2 = softmax(logits, 2.5)

    const maxT1 = Math.max(...probsT1)
    const maxT2 = Math.max(...probsT2)

    expect(maxT2).toBeLessThan(maxT1)

    // High temperature approaches uniform distribution
    const probsHighT = softmax(logits, 1000.0)
    const expectedUniform = 1 / logits.length
    for (const p of probsHighT) {
      expect(p).toBeCloseTo(expectedUniform, 2)
    }
  })

  it('temperature 1.0 with log-prob logits: softmax returns the original probabilities (sum 1, within 1e-6)', () => {
    const origProbs = [0.05, 0.35, 0.10, 0.01, 0.01, 0.01, 0.47]
    const logits = origProbs.map((p) => Math.log(p))
    const probs = softmax(logits, 1.0)

    const sum = Array.from(probs).reduce((acc, p) => acc + p, 0)
    expect(sum).toBeCloseTo(1.0, 6)

    for (let i = 0; i < origProbs.length; i++) {
      expect(probs[i]).toBeCloseTo(origProbs[i]!, 6)
    }
  })
})
