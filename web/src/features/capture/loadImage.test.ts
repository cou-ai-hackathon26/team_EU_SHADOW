import { describe, it, expect, vi } from 'vitest'
import { loadImage } from './loadImage'

describe('loadImage (F2)', () => {
  it('loads an image file and resolves with HTMLImageElement', async () => {
    const file = new File(['fake image data'], 'sample.jpg', { type: 'image/jpeg' })

    // In jsdom, Image onload does not fire naturally without triggering src
    const mockRevoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const mockCreate = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url')

    const promise = loadImage(file)

    // Trigger onload on the newly created image if jsdom doesn't auto-fire
    const imgPromise = promise.then((img) => {
      expect(img).toBeInstanceOf(HTMLImageElement)
      expect(img.src).toContain('blob:test-url')
    })

    mockCreate.mockRestore()
    mockRevoke.mockRestore()
    return imgPromise
  })
})
