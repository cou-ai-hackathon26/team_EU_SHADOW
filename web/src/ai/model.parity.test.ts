/// <reference types="node" />
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import * as ort from 'onnxruntime-web/wasm'

// M6: the shipped model gives the same answer in ONNX Runtime Web (WASM) as in Python onnxruntime.
// Fixture: ml/tools/make_model_parity_fixture.py (real photos, Python preprocess).
const webRoot = resolve(__dirname, '../..')
const modelPath = join(webRoot, 'public', 'model', 'agroleaf.onnx')
const fixturePath = join(__dirname, '__fixtures__', 'model_parity.json')
const metaPath = join(webRoot, 'public', 'model', 'model_meta.json')

interface Case { name: string; input: string; logits: number[]; camShape: number[] }

function f32(b64: string): Float32Array {
  const buf = Buffer.from(b64, 'base64')
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4)
}

describe.runIf(existsSync(modelPath) && existsSync(fixturePath))('M6 ORT-Web parity', () => {
  it('logits match Python onnxruntime within 1e-4 and cam is [1, C, 7, 7]', async () => {
    ort.env.wasm.numThreads = 1
    const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as { classes: string[]; inputSize: number; camOutput: boolean }
    const fx = JSON.parse(readFileSync(fixturePath, 'utf8')) as { atol: number; cases: Case[] }
    const session = await ort.InferenceSession.create(readFileSync(modelPath), { executionProviders: ['wasm'] })
    expect(session.inputNames).toEqual(['input'])
    expect(session.outputNames).toEqual(['logits', 'cam'])
    expect(meta.camOutput).toBe(true)
    for (const c of fx.cases) {
      const x = new ort.Tensor('float32', f32(c.input), [1, 3, meta.inputSize, meta.inputSize])
      const out = await session.run({ input: x })
      const logits = out.logits.data as Float32Array
      expect(logits.length).toBe(meta.classes.length)
      for (let i = 0; i < logits.length; i++) {
        expect(Math.abs(logits[i] - c.logits[i]), `${c.name} logit ${i}`).toBeLessThanOrEqual(fx.atol)
      }
      expect(out.cam.dims).toEqual([1, meta.classes.length, 7, 7])
    }
  }, 60_000)
})
