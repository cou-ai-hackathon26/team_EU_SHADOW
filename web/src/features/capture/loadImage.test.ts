import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadImage } from './loadImage'

describe('loadImage (F2 review fixes)', () => {
  let revokeObjectURLSpy: any

  beforeEach(() => {
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('resolves with HTMLImageElement and calls URL.revokeObjectURL on success', async () => {
    class FakeSuccessImage {
      onload: ((ev: any) => void) | null = null
      onerror: ((ev: any) => void) | null = null
      private _src = ''

      get src() {
        return this._src
      }
      set src(value: string) {
        this._src = value
        setTimeout(() => {
          if (this.onload) {
            this.onload(new Event('load'))
          }
        }, 0)
      }
    }

    vi.stubGlobal('Image', FakeSuccessImage)

    const file = new File(['valid'], 'leaf.jpg', { type: 'image/jpeg' })
    const img = await loadImage(file)

    expect(img).toBeDefined()
    expect(img.src).toBe('blob:test-url')
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test-url')
  })

  it('rejects with error and calls URL.revokeObjectURL on failure', async () => {
    class FakeFailureImage {
      onload: ((ev: any) => void) | null = null
      onerror: ((ev: any) => void) | null = null
      private _src = ''

      get src() {
        return this._src
      }
      set src(value: string) {
        this._src = value
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Event('error'))
          }
        }, 0)
      }
    }

    vi.stubGlobal('Image', FakeFailureImage)

    const file = new File(['corrupt'], 'corrupt.jpg', { type: 'image/jpeg' })
    await expect(loadImage(file)).rejects.toThrow(/ছবি লোড করতে ব্যর্থ/i)
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test-url')
  })
})
