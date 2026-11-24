import { describe, expect, it } from 'vitest'
import { proposeLeafRegions, gridTiles, regionDebugStats } from './leafRegions'

function drawRect(
  data: Uint8ClampedArray,
  imgW: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  r: number,
  g: number,
  b: number,
) {
  for (let y = ry; y < ry + rh; y++) {
    for (let x = rx; x < rx + rw; x++) {
      const idx = (y * imgW + x) * 4
      data[idx] = r
      data[idx + 1] = g
      data[idx + 2] = b
      data[idx + 3] = 255
    }
  }
}

describe('leafRegions - proposeLeafRegions & gridTiles', () => {
  it('proposes 3 separated leaves in reading order on dark soil/grey background', () => {
    const width = 400
    const height = 300
    const data = new Uint8ClampedArray(width * height * 4)

    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 60
      data[i * 4 + 1] = 60
      data[i * 4 + 2] = 60
      data[i * 4 + 3] = 255
    }

    // 3 green leaves:
    // Leaf 1: top-left (x=50, y=40, w=50, h=40)
    // Leaf 2: top-right (x=250, y=40, w=50, h=40)
    // Leaf 3: bottom-center (x=150, y=180, w=60, h=40)
    drawRect(data, width, 50, 40, 50, 40, 34, 139, 34)
    drawRect(data, width, 250, 40, 50, 40, 50, 160, 50)
    drawRect(data, width, 150, 180, 60, 40, 40, 150, 40)

    const res = proposeLeafRegions({ data, width, height })
    expect(res.mode).toBe('leaf_regions')
    expect(res.boxes.length).toBe(3)

    // Verify reading order: top-left first, top-right second, bottom-center third
    expect(res.boxes[0].y).toBeLessThan(res.boxes[2].y)
    expect(res.boxes[0].x).toBeLessThan(res.boxes[1].x)

    // All boxes strictly inside image bounds
    for (const box of res.boxes) {
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.y).toBeGreaterThanOrEqual(0)
      expect(box.x + box.w).toBeLessThanOrEqual(width)
      expect(box.y + box.h).toBeLessThanOrEqual(height)
    }
  })

  it('pure uniform flat green texture (zero edges/shadows) cleanly falls back to grid_fallback', () => {
    const width = 300
    const height = 200
    const data = new Uint8ClampedArray(width * height * 4)
    // Entire canvas green with zero edges or shadows
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 34
      data[i * 4 + 1] = 139
      data[i * 4 + 2] = 34
      data[i * 4 + 3] = 255
    }

    const res = proposeLeafRegions({ data, width, height })
    expect(res.mode).toBe('grid_fallback')
    expect(res.boxes.length).toBe(6) // standard 3x2 grid

    const resTight = proposeLeafRegions({ data, width, height }, { tightGrid: true })
    expect(resTight.mode).toBe('grid_fallback')
    expect(resTight.boxes.length).toBe(12) // tight 4x3 grid

    for (const box of res.boxes) {
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.y).toBeGreaterThanOrEqual(0)
      expect(box.x + box.w).toBeLessThanOrEqual(width)
      expect(box.y + box.h).toBeLessThanOrEqual(height)
    }
  })

  it('gridTiles creates overlapping square tiles inside bounds (6 standard or 12 tight)', () => {
    const landscapeTiles = gridTiles(600, 400)
    expect(landscapeTiles.length).toBe(6) // 3x2 standard
    for (const t of landscapeTiles) {
      expect(t.x).toBeGreaterThanOrEqual(0)
      expect(t.y).toBeGreaterThanOrEqual(0)
      expect(t.x + t.w).toBeLessThanOrEqual(600)
      expect(t.y + t.h).toBeLessThanOrEqual(400)
    }

    const tightLandscapeTiles = gridTiles(600, 400, { tight: true })
    expect(tightLandscapeTiles.length).toBe(12) // 4x3 tight

    const portraitTiles = gridTiles(400, 600)
    expect(portraitTiles.length).toBe(6) // 2x3 standard

    const tightPortraitTiles = gridTiles(400, 600, { tight: true })
    expect(tightPortraitTiles.length).toBe(12) // 3x4 tight
    for (const t of tightPortraitTiles) {
      expect(t.x).toBeGreaterThanOrEqual(0)
      expect(t.y).toBeGreaterThanOrEqual(0)
      expect(t.x + t.w).toBeLessThanOrEqual(400)
      expect(t.y + t.h).toBeLessThanOrEqual(600)
    }
  })

  it('synthetic dense canopy with dark shadow gaps separating 6+ vertical leaf blades returns mode leaf_regions with multiple tight boxes', () => {
    const width = 400
    const height = 300
    const data = new Uint8ClampedArray(width * height * 4)

    // Fill background with dark shadow (v < 0.28)
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 15
      data[i * 4 + 1] = 45
      data[i * 4 + 2] = 15
      data[i * 4 + 3] = 255
    }

    // Draw 6 distinct vertical green leaf blades with shadow gaps between them
    // Blade 1: x=10..55
    drawRect(data, width, 10, 20, 45, 260, 40, 160, 40)
    // Blade 2: x=75..120
    drawRect(data, width, 75, 20, 45, 260, 50, 170, 50)
    // Blade 3: x=140..185
    drawRect(data, width, 140, 20, 45, 260, 35, 150, 35)
    // Blade 4: x=205..250
    drawRect(data, width, 205, 20, 45, 260, 45, 165, 45)
    // Blade 5: x=270..315
    drawRect(data, width, 270, 20, 45, 260, 40, 155, 40)
    // Blade 6: x=335..380
    drawRect(data, width, 335, 20, 45, 260, 48, 168, 48)

    const res = proposeLeafRegions({ data, width, height })
    expect(res.mode).toBe('leaf_regions')
    expect(res.boxes.length).toBeGreaterThanOrEqual(6)

    // All boxes strictly inside image bounds and sorted in reading order
    for (let i = 0; i < res.boxes.length; i++) {
      const b = res.boxes[i]
      expect(b.x).toBeGreaterThanOrEqual(0)
      expect(b.y).toBeGreaterThanOrEqual(0)
      expect(b.x + b.w).toBeLessThanOrEqual(width)
      expect(b.y + b.h).toBeLessThanOrEqual(height)
      if (i > 0 && Math.abs(res.boxes[i - 1].y - b.y) <= height * 0.10) {
        expect(res.boxes[i - 1].x).toBeLessThanOrEqual(b.x)
      }
    }
  })

  it('synthetic green canopy with 2 brown/yellow symptomatic leaf patches detects both symptomatic patches as distinct boxes', () => {
    const width = 400
    const height = 300
    const data = new Uint8ClampedArray(width * height * 4)

    // Fill dense green background
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 35
      data[i * 4 + 1] = 145
      data[i * 4 + 2] = 35
      data[i * 4 + 3] = 255
    }

    // Symptom patch 1: yellow-brown blast lesion at (70, 60, 40, 35)
    drawRect(data, width, 70, 60, 40, 35, 200, 160, 40)
    // Symptom patch 2: brown spot lesion at (250, 170, 45, 40)
    drawRect(data, width, 250, 170, 45, 40, 175, 120, 45)

    const res = proposeLeafRegions({ data, width, height })
    expect(res.mode).toBe('leaf_regions')

    // Find boxes covering the two symptom patches
    const patch1Box = res.boxes.find(
      (b) => b.x <= 75 && b.x + b.w >= 105 && b.y <= 65 && b.y + b.h >= 90,
    )
    const patch2Box = res.boxes.find(
      (b) => b.x <= 255 && b.x + b.w >= 290 && b.y <= 175 && b.y + b.h >= 205,
    )

    expect(patch1Box).toBeDefined()
    expect(patch2Box).toBeDefined()
  })

  it('synthetic sky (top 35% grey) + rice field (bottom 65% green with leaf edges) places NO boxes purely in the sky region', () => {
    const width = 400
    const height = 300
    const data = new Uint8ClampedArray(width * height * 4)
    const skyHeight = 105 // 35% of 300

    // Top 35%: Overcast sky (low saturation grey rgb(180, 190, 200))
    for (let y = 0; y < skyHeight; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        data[idx] = 180
        data[idx + 1] = 190
        data[idx + 2] = 200
        data[idx + 3] = 255
      }
    }

    // Bottom 65%: Rice field with leaves
    for (let y = skyHeight; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        data[idx] = 20
        data[idx + 1] = 50
        data[idx + 2] = 20
        data[idx + 3] = 255
      }
    }

    // Draw 3 green rice blades in the bottom section
    drawRect(data, width, 50, 120, 50, 150, 40, 160, 40)
    drawRect(data, width, 160, 120, 50, 150, 45, 165, 45)
    drawRect(data, width, 280, 120, 50, 150, 50, 170, 50)

    const res = proposeLeafRegions({ data, width, height })
    expect(res.mode).toBe('leaf_regions')
    expect(res.boxes.length).toBeGreaterThanOrEqual(3)

    // Assert that NO box is purely in the sky region (i.e. ending before skyHeight)
    for (const box of res.boxes) {
      expect(box.y + box.h).toBeGreaterThan(skyHeight)
    }
  })

  it('proposes 3 green leaves on brown soil rgb(120,85,55) without falling back to grid', () => {
    const width = 400
    const height = 300
    const data = new Uint8ClampedArray(width * height * 4)

    // Soil background rgb(120, 85, 55)
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 120
      data[i * 4 + 1] = 85
      data[i * 4 + 2] = 55
      data[i * 4 + 3] = 255
    }

    // 3 green leaves (same rects)
    drawRect(data, width, 50, 40, 50, 40, 34, 139, 34)
    drawRect(data, width, 250, 40, 50, 40, 50, 160, 50)
    drawRect(data, width, 150, 180, 60, 40, 40, 150, 40)

    const res = proposeLeafRegions({ data, width, height })
    expect(res.mode).toBe('leaf_regions')
    expect(res.boxes.length).toBe(3)
  })

  it('proposes 2 green leaves and 1 elongated dry straw leaf rgb(200,170,110) on brown soil', () => {
    const width = 400
    const height = 300
    const data = new Uint8ClampedArray(width * height * 4)

    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 120
      data[i * 4 + 1] = 85
      data[i * 4 + 2] = 55
      data[i * 4 + 3] = 255
    }

    // 2 green leaves
    drawRect(data, width, 50, 40, 50, 40, 34, 139, 34)
    drawRect(data, width, 250, 40, 50, 40, 50, 160, 50)

    // 1 elongated dry straw leaf: rgb(200,170,110), size 120x20
    drawRect(data, width, 140, 180, 120, 20, 200, 170, 110)

    const res = proposeLeafRegions({ data, width, height })
    expect(res.mode).toBe('leaf_regions')
    expect(res.boxes.length).toBe(3)
  })

  it('proposes 4 green leaves on muddy dark soil rgb(90,65,45)', () => {
    const width = 400
    const height = 300
    const data = new Uint8ClampedArray(width * height * 4)

    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 90
      data[i * 4 + 1] = 65
      data[i * 4 + 2] = 45
      data[i * 4 + 3] = 255
    }

    // 4 green leaves
    drawRect(data, width, 40, 30, 40, 40, 34, 139, 34)
    drawRect(data, width, 280, 30, 40, 40, 50, 160, 50)
    drawRect(data, width, 50, 200, 40, 40, 40, 150, 40)
    drawRect(data, width, 270, 200, 40, 40, 45, 155, 45)

    const res = proposeLeafRegions({ data, width, height })
    expect(res.mode).toBe('leaf_regions')
    expect(res.boxes.length).toBe(4)
  })

  it('falls back to grid_fallback without crashing when only soil is present', () => {
    const width = 300
    const height = 200
    const data = new Uint8ClampedArray(width * height * 4)

    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 120
      data[i * 4 + 1] = 85
      data[i * 4 + 2] = 55
      data[i * 4 + 3] = 255
    }

    const res = proposeLeafRegions({ data, width, height })
    expect(res.mode).toBe('grid_fallback')
  })

  it('regionDebugStats computes soilMode and shares correctly', () => {
    const width = 100
    const height = 100
    const data = new Uint8ClampedArray(width * height * 4)
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 120
      data[i * 4 + 1] = 85
      data[i * 4 + 2] = 55
      data[i * 4 + 3] = 255
    }
    const stats = regionDebugStats({ data, width, height })
    expect(stats.soilMode).toBe(true)
    expect(stats.brownShare).toBeGreaterThan(0.9)
    expect(stats.greenShare).toBe(0)
  })

  it('green row spanning full width (touching 3 borders) survives soil mode', () => {
    const width = 400
    const height = 300
    const data = new Uint8ClampedArray(width * height * 4)

    // Soil background rgb(120, 85, 55)
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 120
      data[i * 4 + 1] = 85
      data[i * 4 + 2] = 55
      data[i * 4 + 3] = 255
    }

    // Green row spanning full width at bottom: x=0, y=230, w=400, h=70, rgb(40, 150, 40)
    drawRect(data, width, 0, 230, 400, 70, 40, 150, 40)

    // Two green 50x40 leaves at (60,40) and (250,40)
    drawRect(data, width, 60, 40, 50, 40, 40, 150, 40)
    drawRect(data, width, 250, 40, 50, 40, 40, 150, 40)

    const res = proposeLeafRegions({ data, width, height })
    expect(res.mode).toBe('leaf_regions')
    expect(res.boxes.length).toBe(3)
    const rowBox = res.boxes.find((b) => b.y >= 150 && b.w >= 300)
    expect(rowBox).toBeDefined()
  })

  it('bright straw band spanning full width at bottom (touches 3 borders, brown) stays dropped', () => {
    const width = 400
    const height = 300
    const data = new Uint8ClampedArray(width * height * 4)

    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 120
      data[i * 4 + 1] = 85
      data[i * 4 + 2] = 55
      data[i * 4 + 3] = 255
    }

    // Bright straw band spanning full width at bottom: rgb(200, 170, 110)
    drawRect(data, width, 0, 230, 400, 70, 200, 170, 110)

    // Two green 50x40 leaves at (60,40) and (250,40)
    drawRect(data, width, 60, 40, 50, 40, 40, 150, 40)
    drawRect(data, width, 250, 40, 50, 40, 40, 150, 40)

    const res = proposeLeafRegions({ data, width, height })
    expect(res.mode).toBe('leaf_regions')
    expect(res.boxes.length).toBe(2)
    const strawBox = res.boxes.find((b) => b.y >= 150 && b.w >= 300)
    expect(strawBox).toBeUndefined()
  })
})
