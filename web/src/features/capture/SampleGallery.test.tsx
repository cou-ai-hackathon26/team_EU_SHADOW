/// <reference types="node" />
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import SampleGallery, { type SampleEntry } from './SampleGallery'
import { loadImage } from './loadImage'
import { DISEASE_CLASS_IDS } from '../../ai/classes'
import { getCard } from '../../content/getCard'

vi.mock('./loadImage', () => ({
  loadImage: vi.fn(),
}))

const mockLoadImage = vi.mocked(loadImage)

const samplesDir = resolve(__dirname, '../../../public/samples')
const samplesPath = join(samplesDir, 'samples.json')

function readSamples(): SampleEntry[] {
  return JSON.parse(readFileSync(samplesPath, 'utf8')) as SampleEntry[]
}

describe('SampleGallery (F13)', () => {
  let samples: SampleEntry[] = []

  beforeEach(() => {
    samples = existsSync(samplesPath) ? readSamples() : []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('samples.json')) {
          return new Response(JSON.stringify(samples), {
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response(new Blob(['jpeg-bytes'], { type: 'image/jpeg' }))
      }),
    )
    mockLoadImage.mockImplementation(async () => new Image())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('1. shows one tile for every image in samples.json, named in Bangla', async () => {
    expect(samples.length).toBeGreaterThan(0)
    render(<SampleGallery onImageReady={vi.fn()} />)

    const tiles = await screen.findAllByRole('button', { name: /নমুনা ছবি:/ })
    expect(tiles).toHaveLength(samples.length)
    for (const s of samples) {
      expect(
        screen.getByRole('button', { name: `নমুনা ছবি: ${getCard(s.classId).name.bn}` }),
      ).toBeInTheDocument()
    }
  })

  it('2. clicking a tile loads that image into the F2 handler (onImageReady)', async () => {
    const user = userEvent.setup()
    const onImageReady = vi.fn()
    render(<SampleGallery onImageReady={onImageReady} />)

    const first = samples[0]
    const tile = await screen.findByRole('button', {
      name: `নমুনা ছবি: ${getCard(first.classId).name.bn}`,
    })
    await user.click(tile)

    await waitFor(() => expect(onImageReady).toHaveBeenCalledTimes(1))
    expect(fetch).toHaveBeenCalledWith(`/samples/${first.file}`)
    const [img, file] = onImageReady.mock.calls[0]
    expect(img).toBeInstanceOf(HTMLImageElement)
    expect(file).toBeInstanceOf(File)
    expect((file as File).name).toBe(first.file)
    expect(mockLoadImage).toHaveBeenCalledWith(file)
  })

  it('3. every image has a credit and licence, comes from the test split, and exists on disk', () => {
    expect(existsSync(samplesPath)).toBe(true)
    const list = readSamples()
    const allowedLicences = ['CC BY 4.0', 'CC0 1.0']

    for (const s of list) {
      expect(existsSync(join(samplesDir, s.file)), s.file).toBe(true)
      expect(s.split).toBe('test')
      expect(s.credit.trim().length).toBeGreaterThan(10)
      expect(allowedLicences).toContain(s.source.licence)
      expect(s.source.name.trim().length).toBeGreaterThan(0)
      expect(s.source.doi).toMatch(/^10\.\d+\//)
      expect(s.source.url).toMatch(/^https:\/\//)
      expect(s.originalFile.trim().length).toBeGreaterThan(0)
      expect(s.changes.trim().length).toBeGreaterThan(0)
    }

    // exactly one sample per disease class
    const classes = list.map((s) => s.classId).sort()
    expect(classes).toEqual([...DISEASE_CLASS_IDS].sort())
  })

  it('4. shows the image credits on screen (CC BY attribution)', async () => {
    render(<SampleGallery onImageReady={vi.fn()} />)
    await screen.findAllByRole('button', { name: /নমুনা ছবি:/ })
    for (const s of samples) {
      expect(screen.getAllByText(new RegExp(s.source.licence.replace('.', '\\.'))).length).toBeGreaterThan(0)
    }
  })
})
