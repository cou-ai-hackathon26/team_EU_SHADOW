import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { pwaOptions } from '../../vite.config'

interface ManifestIcon {
  src: string
  sizes?: string
  type?: string
  purpose?: string
}

describe('F14 PWA Service Worker & Manifest Configuration', () => {
  const publicDir = path.resolve(__dirname, '../../public')
  const iconsDir = path.join(publicDir, 'icons')

  it('1. Manifest contains Bangla name, short_name, theme_color, and icons with right sizes and purposes', () => {
    expect(pwaOptions.manifest).toBeDefined()
    if (!pwaOptions.manifest) {
      throw new Error('Manifest is not configured')
    }
    const manifest = pwaOptions.manifest
    expect(manifest.name).toContain('ধানপাতার রোগ নির্ণয়')
    expect(manifest.short_name).toBe('AgroLeaf AI')
    expect(manifest.theme_color).toBe('#166534')
    expect(manifest.background_color).toBe('#ffffff')
    expect(manifest.display).toBe('standalone')

    expect(Array.isArray(manifest.icons)).toBe(true)
    const icons = (manifest.icons ?? []) as unknown as ManifestIcon[]
    expect(icons).toHaveLength(3)

    const icon192 = icons.find((i) => i.sizes === '192x192')
    expect(icon192).toBeDefined()
    expect(icon192?.src).toBe('/icons/icon-192.png')
    expect(icon192?.type).toBe('image/png')
    expect(icon192?.purpose).toBe('any')

    const icon512 = icons.find((i) => i.sizes === '512x512' && i.purpose === 'any')
    expect(icon512).toBeDefined()
    expect(icon512?.src).toBe('/icons/icon-512.png')
    expect(icon512?.type).toBe('image/png')

    const iconMaskable = icons.find(
      (i) => i.sizes === '512x512' && i.purpose === 'maskable',
    )
    expect(iconMaskable).toBeDefined()
    expect(iconMaskable?.src).toBe('/icons/icon-maskable-512.png')
    expect(iconMaskable?.type).toBe('image/png')
  })

  it('2. Icon files exist on disk with valid file size', () => {
    const icon192Path = path.join(iconsDir, 'icon-192.png')
    const icon512Path = path.join(iconsDir, 'icon-512.png')
    const iconMaskablePath = path.join(iconsDir, 'icon-maskable-512.png')

    expect(fs.existsSync(icon192Path)).toBe(true)
    expect(fs.statSync(icon192Path).size).toBeGreaterThan(0)

    expect(fs.existsSync(icon512Path)).toBe(true)
    expect(fs.statSync(icon512Path).size).toBeGreaterThan(0)

    expect(fs.existsSync(iconMaskablePath)).toBe(true)
    expect(fs.statSync(iconMaskablePath).size).toBeGreaterThan(0)
  })

  it('3. Workbox precache config includes wasm in globPatterns and has 20 MB limit', () => {
    expect(pwaOptions.registerType).toBe('prompt')
    expect(pwaOptions.workbox).toBeDefined()
    const workbox = pwaOptions.workbox!

    expect(workbox.globPatterns).toBeDefined()
    expect(workbox.globPatterns).toContain(
      '**/*.{js,css,html,svg,png,webmanifest,wasm}',
    )
    expect(workbox.maximumFileSizeToCacheInBytes).toBe(20 * 1024 * 1024)
  })

  it('4. Workbox runtimeCaching configures /model/ with NetworkFirst, agroleaf-model cache, and 5s timeout', () => {
    const workbox = pwaOptions.workbox!
    expect(Array.isArray(workbox.runtimeCaching)).toBe(true)

    const modelRule = workbox.runtimeCaching!.find(
      (rule) =>
        rule.options?.cacheName === 'agroleaf-model' &&
        rule.handler === 'NetworkFirst',
    )
    expect(modelRule).toBeDefined()
    expect(modelRule!.options?.networkTimeoutSeconds).toBe(5)

    // Verify pattern matching
    const pattern = modelRule!.urlPattern
    if (typeof pattern === 'function') {
      const match = pattern({
        url: new URL('https://agroleaf.local/model/agroleaf.onnx'),
      } as unknown as Parameters<Extract<typeof pattern, (...args: unknown[]) => boolean>>[0])
      expect(match).toBe(true)

      const nonMatch = pattern({
        url: new URL('https://agroleaf.local/assets/index.js'),
      } as unknown as Parameters<Extract<typeof pattern, (...args: unknown[]) => boolean>>[0])
      expect(nonMatch).toBe(false)
    } else if (pattern instanceof RegExp) {
      expect(pattern.test('/model/agroleaf.onnx')).toBe(true)
      expect(pattern.test('/assets/index.js')).toBe(false)
    }
  })

  it('5. Legacy hand-written sw.js and manifest.webmanifest are deleted from public folder', () => {
    expect(fs.existsSync(path.join(publicDir, 'sw.js'))).toBe(false)
    expect(fs.existsSync(path.join(publicDir, 'manifest.webmanifest'))).toBe(false)
  })
})
