/**
 * Helper utilities to generate deterministic ImageData and mock File objects
 * for the 35 edge-case scenarios without relying on heavy external assets.
 */

export function createMockImageData(
  width: number,
  height: number,
  generator: (x: number, y: number) => [number, number, number, number]
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const [r, g, b, a] = generator(x, y)
      data[idx] = r
      data[idx + 1] = g
      data[idx + 2] = b
      data[idx + 3] = a
    }
  }
  return {
    data,
    width,
    height,
    colorSpace: 'srgb',
  } as ImageData
}

/**
 * Creates dark ImageData with mean luma < 40
 */
export function createDarkImageData(width = 64, height = 64, luma = 25): ImageData {
  return createMockImageData(width, height, () => [luma, luma, luma, 255])
}

/**
 * Creates overexposed ImageData with mean luma > 220
 */
export function createBrightImageData(width = 64, height = 64, luma = 235): ImageData {
  return createMockImageData(width, height, () => [luma, luma, luma, 255])
}

/**
 * Creates blurry ImageData with very low Laplacian variance (< 15)
 */
export function createBlurryImageData(width = 64, height = 64): ImageData {
  // Smooth gradual linear gradient has virtually zero edge variance
  return createMockImageData(width, height, (x) => {
    const val = Math.floor(100 + (x / width) * 20)
    return [val, val, val, 255]
  })
}

/**
 * Creates sharp leaf-like ImageData with high Laplacian variance (> 50)
 */
export function createSharpImageData(width = 64, height = 64): ImageData {
  // Checkerboard / high frequency pattern has very high Laplacian edge variance
  return createMockImageData(width, height, (x, y) => {
    const isEdge = (x % 4 < 2 && y % 4 < 2) || (x % 4 >= 2 && y % 4 >= 2)
    const val = isEdge ? 40 : 200
    return [val, val + 20, val, 255]
  })
}

/**
 * Creates an oversized Mock File (> 10 MB)
 */
export function createOversizedFile(sizeMb = 10.5): File {
  const bytes = Math.ceil(sizeMb * 1024 * 1024)
  const buffer = new Uint8Array(bytes)
  return new File([buffer], 'oversized_leaf.jpg', { type: 'image/jpeg' })
}

/**
 * Creates an invalid extension / mime File
 */
export function createInvalidExtensionFile(): File {
  return new File(['invalid text document content'], 'soil_test_report.txt', {
    type: 'text/plain',
  })
}
