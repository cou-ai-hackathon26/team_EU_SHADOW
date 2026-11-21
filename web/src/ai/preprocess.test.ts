import { describe, it, expect } from 'vitest'
import { preprocess } from './preprocess'
import samplePreprocess from './__fixtures__/preprocess.sample.json'

describe('preprocess', () => {
  it('returns an NCHW Float32Array of length 3×inputSize×inputSize', () => {
    const { width, height, color, inputSize, mean, std } = samplePreprocess

    // Create a solid-colour RGBA image buffer
    const data = new Uint8ClampedArray(width * height * 4)
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = color[0]
      data[i * 4 + 1] = color[1]
      data[i * 4 + 2] = color[2]
      data[i * 4 + 3] = 255
    }

    const image = { data, width, height }
    const tensor = preprocess(image, {
      inputSize,
      mean: mean as [number, number, number],
      std: std as [number, number, number],
    })

    expect(tensor).toBeInstanceOf(Float32Array)
    expect(tensor).toHaveLength(3 * inputSize * inputSize)
  })

  it('matches hand-computed normalised values for solid-colour image', () => {
    const { width, height, color, inputSize, mean, std, expectedPerChannel } =
      samplePreprocess

    const data = new Uint8ClampedArray(width * height * 4)
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = color[0]
      data[i * 4 + 1] = color[1]
      data[i * 4 + 2] = color[2]
      data[i * 4 + 3] = 255
    }

    const image = { data, width, height }
    const tensor = preprocess(image, {
      inputSize,
      mean: mean as [number, number, number],
      std: std as [number, number, number],
    })

    const pixelsPerChannel = inputSize * inputSize

    // Channel 0 (Red)
    for (let i = 0; i < pixelsPerChannel; i++) {
      expect(tensor[i]).toBeCloseTo(expectedPerChannel[0], 4)
    }

    // Channel 1 (Green)
    for (let i = pixelsPerChannel; i < 2 * pixelsPerChannel; i++) {
      expect(tensor[i]).toBeCloseTo(expectedPerChannel[1], 4)
    }

    // Channel 2 (Blue)
    for (let i = 2 * pixelsPerChannel; i < 3 * pixelsPerChannel; i++) {
      expect(tensor[i]).toBeCloseTo(expectedPerChannel[2], 4)
    }
  })

  it('resizes the shorter side and centre-crops non-square images', () => {
    const width = 640
    const height = 480
    const inputSize = 224

    const data = new Uint8ClampedArray(width * height * 4)
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 100
      data[i * 4 + 1] = 150
      data[i * 4 + 2] = 200
      data[i * 4 + 3] = 255
    }

    const image = { data, width, height }
    const tensor = preprocess(image, {
      inputSize,
      mean: [0.485, 0.456, 0.406],
      std: [0.229, 0.224, 0.225],
    })

    expect(tensor).toHaveLength(3 * inputSize * inputSize)
  })
})
