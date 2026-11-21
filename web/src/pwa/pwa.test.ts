import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('F14 PWA Service Worker & Manifest', () => {
  const publicDir = path.resolve(__dirname, '../../public')
  const manifestPath = path.join(publicDir, 'manifest.webmanifest')
  const swPath = path.join(publicDir, 'sw.js')

  it('1. Manifest contains Bangla name, theme colour, and icons', () => {
    expect(fs.existsSync(manifestPath)).toBe(true)
    const content = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    expect(content.name).toMatch(/ধানপাতার রোগ নির্ণয়/)
    expect(content.theme_color).toBeDefined()
    expect(content.theme_color).toMatch(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    expect(Array.isArray(content.icons)).toBe(true)
    expect(content.icons.length).toBeGreaterThan(0)
    expect(content.icons[0].src).toBeDefined()
  })

  it('2. Service worker sw.js exists in public (and emitted on build)', () => {
    expect(fs.existsSync(swPath)).toBe(true)
    const swContent = fs.readFileSync(swPath, 'utf8')
    expect(swContent).toMatch(/self\.addEventListener\(['"]install['"]/)
    expect(swContent).toMatch(/self\.addEventListener\(['"]fetch['"]/)
  })

  it('3. Model and WASM runtime are cached by the service worker', () => {
    expect(fs.existsSync(swPath)).toBe(true)
    const swContent = fs.readFileSync(swPath, 'utf8')
    // Model files must be cached
    expect(swContent).toMatch(/\/model\/model_meta\.json/)
    expect(swContent).toMatch(/\/model\/agroleaf\.onnx/)
    // WASM runtime must be cached
    expect(swContent).toMatch(/\.wasm/)
  })
})
