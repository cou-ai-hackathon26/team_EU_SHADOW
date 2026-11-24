import type { LeafBox } from './fieldRow.types'

export type PixelClass = 'green' | 'brown' | 'other'

/**
 * Classifies an RGB pixel (0..255) into 'green', 'brown', or 'other'
 * using HSV color space thresholds, and returns its value (v in 0..1),
 * saturation (s in 0..1), hue (h in 0..360), and luminance (lum in 0..1).
 */
export function classifyPixel(
  r255: number,
  g255: number,
  b255: number,
): { type: PixelClass; v: number; s: number; h: number; lum: number } {
  const r = r255 / 255
  const g = g255 / 255
  const b = b255 / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  const v = max
  const s = max === 0 ? 0 : delta / max

  let h = 0
  if (delta !== 0) {
    if (max === r) {
      h = 60 * (((g - b) / delta) % 6)
    } else if (max === g) {
      h = 60 * ((b - r) / delta + 2)
    } else {
      h = 60 * ((r - g) / delta + 4)
    }
    if (h < 0) {
      h += 360
    }
  }

  const lum = 0.299 * r + 0.587 * g + 0.114 * b

  // 1. Green: hue 60-170 deg, s >= 0.20, v >= 0.15
  if (h >= 60 && h <= 170 && s >= 0.20 && v >= 0.15) {
    return { type: 'green', v, s, h, lum }
  }
  // 2. Brown/yellow lesion or straw:
  // Brown/yellow: hue 15-55 deg, s >= 0.20
  // Straw: low saturation s < 0.25 and 0.25 < v < 0.75 with r > g > b
  const isStraw = s < 0.25 && v > 0.25 && v < 0.75 && r > g && g > b
  if ((h >= 15 && h <= 55 && s >= 0.20) || isStraw) {
    return { type: 'brown', v, s, h, lum }
  }

  return { type: 'other', v, s, h, lum }
}

export interface RegionDebugStats {
  soilMode: boolean
  brownShare: number
  greenShare: number
  medianBrownV: number
}

/**
 * Computes debug stats and soil mode detection for a given image.
 * Downscales to max dimension 320 px before computing pixel share statistics.
 */
export function regionDebugStats(
  img: { data: ArrayLike<number>; width: number; height: number },
): RegionDebugStats {
  const { data, width, height } = img
  if (width <= 0 || height <= 0 || !data || data.length === 0) {
    return { soilMode: false, brownShare: 0, greenShare: 0, medianBrownV: 0 }
  }

  const maxDim = Math.max(width, height)
  const scale = maxDim > 320 ? 320 / maxDim : 1.0
  const dw = Math.max(1, Math.round(width * scale))
  const dh = Math.max(1, Math.round(height * scale))
  const total = dw * dh

  let greenCount = 0
  let brownCount = 0
  const hist = new Uint32Array(32)

  for (let dy = 0; dy < dh; dy++) {
    const sy = Math.min(height - 1, Math.floor(dy / scale))
    for (let dx = 0; dx < dw; dx++) {
      const sx = Math.min(width - 1, Math.floor(dx / scale))
      const idx = (sy * width + sx) * 4
      const { type, v } = classifyPixel(data[idx], data[idx + 1], data[idx + 2])
      if (type === 'green') {
        greenCount++
      } else if (type === 'brown') {
        brownCount++
        const bin = Math.min(31, Math.max(0, Math.floor(v * 32)))
        hist[bin]++
      }
    }
  }

  const brownShare = total > 0 ? brownCount / total : 0
  const greenShare = total > 0 ? greenCount / total : 0
  const soilMode = brownShare >= 0.35

  let medianBrownV = 0
  if (brownCount > 0) {
    let cumulative = 0
    const target = brownCount / 2
    for (let b = 0; b < 32; b++) {
      cumulative += hist[b]
      if (cumulative >= target) {
        medianBrownV = (b + 0.5) / 32
        break
      }
    }
  }

  return { soilMode, brownShare, greenShare, medianBrownV }
}

/**
 * Computes Intersection over Union (IoU) between two bounding boxes.
 */
function boxIoU(a: LeafBox, b: LeafBox): number {
  const x1 = Math.max(a.x, b.x)
  const y1 = Math.max(a.y, b.y)
  const x2 = Math.min(a.x + a.w, b.x + b.w)
  const y2 = Math.min(a.y + a.h, b.y + b.h)

  const interW = Math.max(0, x2 - x1)
  const interH = Math.max(0, y2 - y1)
  const interArea = interW * interH
  if (interArea <= 0) return 0

  const areaA = a.w * a.h
  const areaB = b.w * b.h
  const unionArea = areaA + areaB - interArea
  return unionArea > 0 ? interArea / unionArea : 0
}

/**
 * Generates overlapping grid tiles (standard 3x2 landscape / 2x3 portrait with 15% overlap,
 * or tighter 4x3 landscape / 3x4 portrait with 12% overlap when tight: true).
 */
export function gridTiles(
  width: number,
  height: number,
  opts?: { tight?: boolean; cols?: number; rows?: number; overlap?: number },
): LeafBox[] {
  const isLandscape = width >= height
  const tight = opts?.tight ?? false
  const cols = opts?.cols ?? (tight ? (isLandscape ? 4 : 3) : (isLandscape ? 3 : 2))
  const rows = opts?.rows ?? (tight ? (isLandscape ? 3 : 4) : (isLandscape ? 2 : 3))
  const overlap = opts?.overlap ?? (tight ? 0.12 : 0.15)

  // Tile dimensions accounting for overlap step: width = Tw * (1 + (cols - 1) * (1 - overlap))
  const tw = Math.round(width / (1 + (cols - 1) * (1 - overlap)))
  const th = Math.round(height / (1 + (rows - 1) * (1 - overlap)))
  const stepX = cols > 1 ? (width - tw) / (cols - 1) : 0
  const stepY = rows > 1 ? (height - th) / (rows - 1) : 0

  const tiles: LeafBox[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = Math.max(0, Math.min(width - 1, Math.round(c * stepX)))
      const y = Math.max(0, Math.min(height - 1, Math.round(r * stepY)))
      const w = Math.min(width - x, tw)
      const h = Math.min(height - y, th)
      tiles.push({ x, y, w, h })
    }
  }

  return tiles
}

/**
 * Soil-aware and dense-canopy region proposal heuristics:
 * - 0.35 (soilMode threshold): When brown pixels comprise >= 35% of the frame, the scene is
 *   dominated by soil/ground rather than dense foliage or neutral studio background.
 * - 0.55 & medianBrownV + 0.15: Dry straw/dead leaf tissue typically has high reflectance,
 *   suppressing ambient dark soil while preserving true lesion/straw tissue.
 * - 0.45 (dense canopy threshold): When raw vegetation exceeds 45%, dense-canopy splitting activates.
 *   Overlapping rice blades are cleaved by 3x3 Sobel gradient edges and shadow gaps (v < 0.28).
 * - Secondary symptomatic hotspot pass: Visibly symptomatic brown/yellow lesion patches get dedicated
 *   tight bounding boxes so localized infections are never obscured by surrounding green canopy.
 * - 2x2 subdivision: Large blobs > 25% of the frame are subdivided into 2x2 sub-boxes instead of
 *   triggering global grid fallback.
 */
export function proposeLeafRegions(
  img: { data: ArrayLike<number>; width: number; height: number },
  opts?: { maxRegions?: number; tightGrid?: boolean },
): { boxes: LeafBox[]; mode: 'leaf_regions' | 'grid_fallback' } {
  const { data, width, height } = img
  const maxRegions = opts?.maxRegions ?? 18

  if (width <= 0 || height <= 0 || !data || data.length === 0) {
    return { boxes: [], mode: 'grid_fallback' }
  }

  // 1. Downscale to <= 320 px long side
  const maxDim = Math.max(width, height)
  const scale = maxDim > 320 ? 320 / maxDim : 1.0
  const dw = Math.max(1, Math.round(width * scale))
  const dh = Math.max(1, Math.round(height * scale))
  const totalArea = dw * dh

  // 2. Image statistics for soil-awareness (Pass 1)
  const stats = regionDebugStats(img)
  const brownThreshold = Math.max(0.55, stats.medianBrownV + 0.15)

  // 3. Build vegetation mask, symptom mask, and undilated pixel classes (Pass 2)
  const lum = new Float32Array(totalArea)
  const vArr = new Float32Array(totalArea)
  const rawVegMask = new Uint8Array(totalArea)
  const symptomMask = new Uint8Array(totalArea)
  const pixelClasses = new Uint8Array(totalArea) // 1 = green, 2 = brown

  let rawVegCount = 0
  for (let dy = 0; dy < dh; dy++) {
    const sy = Math.min(height - 1, Math.floor(dy / scale))
    for (let dx = 0; dx < dw; dx++) {
      const sx = Math.min(width - 1, Math.floor(dx / scale))
      const idx = (sy * width + sx) * 4
      const pIdx = dy * dw + dx
      const { type, v, lum: pLum } = classifyPixel(data[idx], data[idx + 1], data[idx + 2])
      lum[pIdx] = pLum
      vArr[pIdx] = v

      if (type === 'green') {
        pixelClasses[pIdx] = 1
        rawVegMask[pIdx] = 1
        rawVegCount++
      } else if (type === 'brown') {
        pixelClasses[pIdx] = 2
        if (!stats.soilMode || v >= brownThreshold) {
          rawVegMask[pIdx] = 1
          symptomMask[pIdx] = 1
          rawVegCount++
        }
      }
    }
  }

  const rawVegRatio = totalArea > 0 ? rawVegCount / totalArea : 0
  const isDense = rawVegRatio > 0.45

  // 4. Dense-canopy edge & shadow splitting
  let workingVegMask: Uint8Array
  if (isDense) {
    // In dense mode: do NOT dilate into one giant blob.
    // Compute 3x3 Sobel gradient magnitude on luminance
    const gradMag = new Float32Array(totalArea)
    for (let y = 1; y < dh - 1; y++) {
      const rowAbove = (y - 1) * dw
      const rowCurr = y * dw
      const rowBelow = (y + 1) * dw
      for (let x = 1; x < dw - 1; x++) {
        const p00 = lum[rowAbove + x - 1]
        const p02 = lum[rowAbove + x + 1]
        const p10 = lum[rowCurr + x - 1]
        const p12 = lum[rowCurr + x + 1]
        const p20 = lum[rowBelow + x - 1]
        const p22 = lum[rowBelow + x + 1]

        const gx = p02 - p00 + 2 * (p12 - p10) + (p22 - p20)

        const p01 = lum[rowAbove + x]
        const p21 = lum[rowBelow + x]
        const gy = p20 - p00 + 2 * (p21 - p01) + (p22 - p02)

        gradMag[rowCurr + x] = Math.abs(gx) + Math.abs(gy)
      }
    }

    // Measure gradient distribution in vegetation
    let maxGrad = 0
    let vegGradCount = 0
    const gradHist = new Uint32Array(64)
    for (let i = 0; i < totalArea; i++) {
      if (rawVegMask[i] === 1) {
        const g = gradMag[i]
        if (g > maxGrad) maxGrad = g
        vegGradCount++
        const bin = Math.min(63, Math.floor((g / 2.0) * 64))
        gradHist[bin]++
      }
    }

    // Determine strong edge threshold (top ~25% gradient magnitude)
    let edgeThreshold = Infinity
    if (maxGrad >= 0.12 && vegGradCount > 0) {
      let cumulative = 0
      const target = vegGradCount * 0.75
      let p75 = 0.20
      for (let b = 0; b < 64; b++) {
        cumulative += gradHist[b]
        if (cumulative >= target) {
          p75 = ((b + 0.5) / 64) * 2.0
          break
        }
      }
      edgeThreshold = Math.max(0.15, p75)
    }

    // Subtract strong edges and dark shadow gaps (v < 0.28)
    workingVegMask = new Uint8Array(totalArea)
    for (let i = 0; i < totalArea; i++) {
      if (rawVegMask[i] === 1) {
        const isShadow = vArr[i] < 0.28
        const isEdge = gradMag[i] >= edgeThreshold
        if (!isShadow && !isEdge) {
          workingVegMask[i] = 1
        }
      }
    }
  } else {
    // Normal mode: 1-pass 3x3 dilation
    workingVegMask = new Uint8Array(totalArea)
    for (let y = 0; y < dh; y++) {
      for (let x = 0; x < dw; x++) {
        if (rawVegMask[y * dw + x] === 1) {
          for (let ny = Math.max(0, y - 1); ny <= Math.min(dh - 1, y + 1); ny++) {
            for (let nx = Math.max(0, x - 1); nx <= Math.min(dw - 1, x + 1); nx++) {
              workingVegMask[ny * dw + nx] = 1
            }
          }
        }
      }
    }
  }

  // 5. 4-neighbour connected components extraction
  function findComponents(
    mask: Uint8Array,
    checkBorders: boolean,
  ): LeafBox[] {
    const visited = new Uint8Array(totalArea)
    const minPixels = Math.max(1, Math.round(totalArea * 0.0035)) // 0.35% threshold
    const boxes: LeafBox[] = []

    for (let y = 0; y < dh; y++) {
      for (let x = 0; x < dw; x++) {
        const startIdx = y * dw + x
        if (mask[startIdx] === 0 || visited[startIdx] === 1) {
          continue
        }

        visited[startIdx] = 1
        let minX = x
        let maxX = x
        let minY = y
        let maxY = y
        let count = 0
        let greenPixels = 0

        const queueX = [x]
        const queueY = [y]

        while (queueX.length > 0) {
          const cx = queueX.pop()!
          const cy = queueY.pop()!
          count++
          if (pixelClasses[cy * dw + cx] === 1) {
            greenPixels++
          }

          if (cx < minX) minX = cx
          if (cx > maxX) maxX = cx
          if (cy < minY) minY = cy
          if (cy > maxY) maxY = cy

          const neighbors = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1],
          ]

          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < dw && ny >= 0 && ny < dh) {
              const nIdx = ny * dw + nx
              if (mask[nIdx] === 1 && visited[nIdx] === 0) {
                visited[nIdx] = 1
                queueX.push(nx)
                queueY.push(ny)
              }
            }
          }
        }

        // Noise drop (< 0.35%)
        if (count < minPixels) {
          continue
        }

        // Soil mode border check
        if (checkBorders && stats.soilMode) {
          const touchesLeft = minX <= 0
          const touchesRight = maxX >= dw - 1
          const touchesTop = minY <= 0
          const touchesBottom = maxY >= dh - 1
          const bordersTouched =
            (touchesLeft ? 1 : 0) +
            (touchesRight ? 1 : 0) +
            (touchesTop ? 1 : 0) +
            (touchesBottom ? 1 : 0)
          const greenShare = count > 0 ? greenPixels / count : 0
          if (bordersTouched >= 3 && greenShare < 0.5) {
            continue
          }
        }

        const bw = maxX - minX + 1
        const bh = maxY - minY + 1
        const compFraction = count / totalArea

        // Giant blob check: if > 25% and <= 70%, subdivide into 2x2 sub-boxes
        if (compFraction > 0.25 && compFraction <= 0.70) {
          const halfW = Math.ceil(bw / 2)
          const halfH = Math.ceil(bh / 2)
          boxes.push(
            { x: minX, y: minY, w: halfW, h: halfH },
            { x: minX + Math.floor(bw / 2), y: minY, w: halfW, h: halfH },
            { x: minX, y: minY + Math.floor(bh / 2), w: halfW, h: halfH },
            { x: minX + Math.floor(bw / 2), y: minY + Math.floor(bh / 2), w: halfW, h: halfH },
          )
        } else if (compFraction <= 0.35) {
          boxes.push({ x: minX, y: minY, w: bw, h: bh })
        }
        // Giant monolithic blobs > 70% of frame are dropped so background canopy
        // does not swallow discrete leaf boxes or cause false full-frame regions
      }
    }

    return boxes
  }

  // Symptomatic hotspot pass + Canopy pass
  const symptomBoxes = findComponents(symptomMask, true)
  const canopyBoxes = findComponents(workingVegMask, true)
  const candidateBoxes = [...symptomBoxes, ...canopyBoxes]

  // 6. Merge/NMS overlapping boxes with IoU > 0.35
  let mergedBoxes = [...candidateBoxes]
  let changed = true
  while (changed) {
    changed = false
    for (let i = 0; i < mergedBoxes.length; i++) {
      for (let j = i + 1; j < mergedBoxes.length; j++) {
        if (boxIoU(mergedBoxes[i], mergedBoxes[j]) > 0.35) {
          const b1 = mergedBoxes[i]
          const b2 = mergedBoxes[j]
          const nx = Math.min(b1.x, b2.x)
          const ny = Math.min(b1.y, b2.y)
          const nw = Math.max(b1.x + b1.w, b2.x + b2.w) - nx
          const nh = Math.max(b1.y + b1.h, b2.y + b2.h) - ny
          mergedBoxes[i] = { x: nx, y: ny, w: nw, h: nh }
          mergedBoxes.splice(j, 1)
          changed = true
          break
        }
      }
      if (changed) break
    }
  }

  // 7. Pad each box lightly (5%), elongated rice-leaf aspect ratio (minSide >= 0.35 * maxSide), scale back
  const processedBoxes: LeafBox[] = mergedBoxes.map((b) => {
    // 5% padding
    const padX = Math.round(b.w * 0.05)
    const padY = Math.round(b.h * 0.05)
    let px = Math.max(0, b.x - padX)
    let py = Math.max(0, b.y - padY)
    let pw = Math.min(dw - px, b.w + padX * 2)
    let ph = Math.min(dh - py, b.h + padY * 2)

    // Elongated rice-leaf aspect ratio (minSide >= 0.35 * maxSide)
    if (pw < 0.35 * ph) {
      const targetW = 0.35 * ph
      const diff = targetW - pw
      px = Math.max(0, Math.round(px - diff / 2))
      pw = Math.min(dw - px, Math.round(targetW))
    } else if (ph < 0.35 * pw) {
      const targetH = 0.35 * pw
      const diff = targetH - ph
      py = Math.max(0, Math.round(py - diff / 2))
      ph = Math.min(dh - py, Math.round(targetH))
    }

    // Scale back to original coordinates
    const ox = Math.max(0, Math.min(width - 1, Math.round(px / scale)))
    const oy = Math.max(0, Math.min(height - 1, Math.round(py / scale)))
    const ow = Math.min(width - ox, Math.max(1, Math.round(pw / scale)))
    const oh = Math.min(height - oy, Math.max(1, Math.round(ph / scale)))

    return { x: ox, y: oy, w: ow, h: oh }
  })

  // 8. Smarter grid_fallback (only if < 2 boxes or monolithic canopy > 70%)
  const origArea = width * height
  const hasDenseCanopy = processedBoxes.some((b) => b.w * b.h > 0.70 * origArea)

  if (processedBoxes.length < 2 || hasDenseCanopy) {
    const tiles = gridTiles(width, height, { tight: opts?.tightGrid ?? false })
    // Drop tiles whose vegetation ratio (green + brown) is < 0.15
    const filteredTiles = tiles.filter((t) => {
      const tx1 = Math.max(0, Math.floor(t.x * scale))
      const ty1 = Math.max(0, Math.floor(t.y * scale))
      const tx2 = Math.min(dw, Math.ceil((t.x + t.w) * scale))
      const ty2 = Math.min(dh, Math.ceil((t.y + t.h) * scale))
      const tArea = Math.max(1, (tx2 - tx1) * (ty2 - ty1))
      let vegCount = 0
      for (let ty = ty1; ty < ty2; ty++) {
        for (let tx = tx1; tx < tx2; tx++) {
          if (rawVegMask[ty * dw + tx] === 1) {
            vegCount++
          }
        }
      }
      return vegCount / tArea >= 0.15
    })

    return {
      boxes: filteredTiles.length > 0 ? filteredTiles : tiles,
      mode: 'grid_fallback',
    }
  }

  // 9. Keep largest maxRegions
  processedBoxes.sort((a, b) => b.w * b.h - a.w * a.h)
  const kept = processedBoxes.slice(0, maxRegions)

  // 10. Sort in reading order (top to bottom, left to right)
  const rowBand = height * 0.10
  kept.sort((a, b) => {
    if (Math.abs(a.y - b.y) > rowBand) {
      return a.y - b.y
    }
    return a.x - b.x
  })

  return {
    boxes: kept,
    mode: 'leaf_regions',
  }
}
