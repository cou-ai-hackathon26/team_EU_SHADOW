/// <reference types="node" />
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

// M8: deployment guards. Runs from web/ (vitest root).
const webRoot = resolve(__dirname, '../..')
// Limit raised to 30 MB on 22 Nov (blend of from-scratch models, FP16). Counts all .onnx files together.
const MAX_MODEL_BYTES = 30 * 1024 * 1024

interface VercelHeader { key: string; value: string }
interface VercelConfig {
  framework?: string
  buildCommand?: string
  outputDirectory?: string
  headers?: { source: string; headers: VercelHeader[] }[]
}

function loadVercel(): VercelConfig {
  return JSON.parse(readFileSync(join(webRoot, 'vercel.json'), 'utf8')) as VercelConfig
}

function headersFor(cfg: VercelConfig, source: string): Record<string, string> {
  const rule = cfg.headers?.find((h) => h.source === source)
  expect(rule, `vercel.json has a header rule for ${source}`).toBeDefined()
  return Object.fromEntries(rule!.headers.map((h) => [h.key.toLowerCase(), h.value]))
}

describe('M8 deploy guards', () => {
  it('all .onnx models in public/model together are at most 30 MB', () => {
    const dir = join(webRoot, 'public', 'model')
    const models = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.onnx')) : []
    const total = models.reduce((sum, f) => sum + statSync(join(dir, f)).size, 0)
    expect(total, `models total ${(total / 1048576).toFixed(1)} MB (${models.join(', ')})`).toBeLessThanOrEqual(MAX_MODEL_BYTES)
  })

  it('vercel.json builds the Vite app from web/ into dist', () => {
    const cfg = loadVercel()
    expect(cfg.framework).toBe('vite')
    expect(cfg.buildCommand).toBe('npm run build')
    expect(cfg.outputDirectory).toBe('dist')
  })

  it('.wasm is served as application/wasm', () => {
    expect(headersFor(loadVercel(), '/(.*).wasm')['content-type']).toBe('application/wasm')
  })

  it('.onnx is served as application/octet-stream and revalidated (file name is not hashed)', () => {
    const h = headersFor(loadVercel(), '/model/(.*)')
    expect(headersFor(loadVercel(), '/(.*).onnx')['content-type']).toBe('application/octet-stream')
    expect(h['cache-control']).toContain('must-revalidate')
  })

  it('hashed build assets are cached as immutable', () => {
    expect(headersFor(loadVercel(), '/assets/(.*)')['cache-control']).toContain('immutable')
  })

  it('sw.js is served with must-revalidate so updates are detected immediately', () => {
    const h = headersFor(loadVercel(), '/sw.js')
    expect(h['cache-control']).toBe('public, max-age=0, must-revalidate')
  })
})
