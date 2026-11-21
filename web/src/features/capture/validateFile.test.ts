import { describe, it, expect } from 'vitest'
import { validateFile } from './validateFile'

describe('validateFile (F2)', () => {
  it('accepts JPG, PNG, and WebP files under 10 MB', () => {
    const jpgFile = new File(['dummy content'], 'leaf.jpg', { type: 'image/jpeg' })
    const pngFile = new File(['dummy content'], 'leaf.png', { type: 'image/png' })
    const webpFile = new File(['dummy content'], 'leaf.webp', { type: 'image/webp' })

    expect(validateFile(jpgFile).valid).toBe(true)
    expect(validateFile(pngFile).valid).toBe(true)
    expect(validateFile(webpFile).valid).toBe(true)
  })

  it('rejects PDF and GIF with a Bangla error message', () => {
    const pdfFile = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' })
    const gifFile = new File(['dummy content'], 'animation.gif', { type: 'image/gif' })

    const pdfResult = validateFile(pdfFile)
    expect(pdfResult.valid).toBe(false)
    expect(pdfResult.error).toMatch(/JPG|PNG|WebP/i)

    const gifResult = validateFile(gifFile)
    expect(gifResult.valid).toBe(false)
    expect(gifResult.error).toMatch(/JPG|PNG|WebP/i)
  })

  it('rejects files larger than 10 MB with a Bangla error message', () => {
    // 10 MB + 1 byte
    const largeSize = 10 * 1024 * 1024 + 1
    const largeFile = new File([new Uint8Array(100)], 'huge.jpg', { type: 'image/jpeg' })
    Object.defineProperty(largeFile, 'size', { value: largeSize })

    const result = validateFile(largeFile)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/১০|10/)
  })
})
