import 'fake-indexeddb/auto'
import { afterEach, describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Prediction } from '../../ai/types'
import {
  addScan,
  getScans,
  deleteScan,
  clearAllScans,
  compressThumbnail,
  saveScanFromPrediction,
} from './historyStore'
import { HistoryScreen } from './HistoryScreen'

describe('F9: Scan History Store (historyStore.ts)', () => {
  beforeEach(async () => {
    await clearAllScans()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('1. যোগ করলে নতুনটা আগে দেখায় (newest scan appears first)', async () => {
    const first = await addScan({
      diseaseId: 'blast',
      diseaseName: { bn: 'ব্লাস্ট রোগ', en: 'Blast' },
      tier: 'high',
      confidence: 0.88,
      thumbnail: 'data:image/jpeg;base64,sample1',
      timestamp: 1000,
    })

    const second = await addScan({
      diseaseId: 'brown_spot',
      diseaseName: { bn: 'বাদামি দাগ', en: 'Brown Spot' },
      tier: 'medium',
      confidence: 0.65,
      thumbnail: 'data:image/jpeg;base64,sample2',
      timestamp: 2000,
    })

    const third = await addScan({
      diseaseId: 'healthy',
      diseaseName: { bn: 'সুস্থ পাতা', en: 'Healthy Leaf' },
      tier: 'high',
      confidence: 0.95,
      thumbnail: 'data:image/jpeg;base64,sample3',
      timestamp: 3000,
    })

    const scans = await getScans()
    expect(scans).toHaveLength(3)
    // Newest timestamp must be first
    expect(scans[0].id).toBe(third.id)
    expect(scans[0].diseaseId).toBe('healthy')
    expect(scans[1].id).toBe(second.id)
    expect(scans[2].id).toBe(first.id)
  })

  it('2. একটি মুছুন / সব মুছুন কাজ করে (delete single and clear all work)', async () => {
    const item1 = await addScan({
      diseaseId: 'blast',
      diseaseName: { bn: 'ব্লাস্ট রোগ', en: 'Blast' },
      tier: 'high',
      confidence: 0.89,
      thumbnail: 'data:image/jpeg;base64,sample1',
    })

    const item2 = await addScan({
      diseaseId: 'sheath_blight',
      diseaseName: { bn: 'খোলপোড়া রোগ', en: 'Sheath Blight' },
      tier: 'high',
      confidence: 0.91,
      thumbnail: 'data:image/jpeg;base64,sample2',
    })

    let scans = await getScans()
    expect(scans).toHaveLength(2)

    // Delete single item
    await deleteScan(item1.id)
    scans = await getScans()
    expect(scans).toHaveLength(1)
    expect(scans[0].id).toBe(item2.id)

    // Clear all scans
    await clearAllScans()
    scans = await getScans()
    expect(scans).toHaveLength(0)
  })

  it('3. canvas দিয়ে বৈধ JPEG thumbnail ২০০ KB-এর মধ্যে রাখে', async () => {
    const source = document.createElement('img')
    Object.defineProperties(source, {
      naturalWidth: { value: 1024 },
      naturalHeight: { value: 512 },
    })
    const context = { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
    const oversizedJpeg = `data:image/jpeg;base64,${'A'.repeat(300 * 1024)}`
    const smallJpeg = 'data:image/jpeg;base64,small-thumbnail'
    const toDataURL = vi
      .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
      .mockImplementation((_type, quality) => (quality === 0.4 ? smallJpeg : oversizedJpeg))

    const thumbnail = await compressThumbnail(source, 200 * 1024)

    expect(thumbnail.startsWith('data:image/jpeg;base64,')).toBe(true)
    expect(Math.ceil((thumbnail.split(',')[1].length * 3) / 4)).toBeLessThanOrEqual(200 * 1024)
    expect(toDataURL.mock.calls).toEqual([
      ['image/jpeg', 0.8],
      ['image/jpeg', 0.6],
      ['image/jpeg', 0.4],
    ])
    expect(context.drawImage).toHaveBeenCalledWith(source, 0, 0, 256, 128)
  })

  it('4. prediction সংরক্ষণ করে getScans-এ প্রথমে দেখায়', async () => {
    await addScan({
      diseaseId: 'healthy',
      diseaseName: { bn: 'সুস্থ ধানগাছ', en: 'Healthy Rice Leaf' },
      tier: 'high',
      confidence: 0.95,
      thumbnail: 'data:image/jpeg;base64,older-scan',
      timestamp: 1,
    })
    const prediction: Prediction = {
      tier: 'medium',
      top: [
        { classId: 'blast', prob: 0.72 },
        { classId: 'healthy', prob: 0.18 },
      ],
      modelVersion: 'test',
      trainedFromScratch: true,
      latencyMs: 1,
    }

    await saveScanFromPrediction(prediction, 'data:image/jpeg;base64,small-image')

    const scans = await getScans()
    expect(scans[0]).toMatchObject({
      diseaseId: 'blast',
      diseaseName: { bn: 'ব্লাস্ট রোগ', en: 'Rice Blast' },
      tier: 'medium',
      confidence: 0.72,
    })
  })

})

describe('F9: HistoryScreen UI component (HistoryScreen.tsx)', () => {
  beforeEach(async () => {
    await clearAllScans()
  })

  it('4. খালি থাকলে empty state দেখায় (shows empty state when empty)', async () => {
    render(<HistoryScreen />)

    // Expect empty state message in Bangla
    expect(await screen.findByText(/কোনো স্ক্যান ইতিহাস নেই|কোনো সংরক্ষিত ফলাফল নেই/i)).toBeDefined()
    // Should provide a button or link to home/scan
    expect(screen.getByRole('link', { name: /নতুন পাতা স্ক্যান করুন|স্ক্যান করুন/i })).toBeDefined()
  })

  it('5. স্ক্যান তালিকা ও ডিলিট বাটন যথাযথভাবে কাজ করে', async () => {
    await addScan({
      diseaseId: 'tungro',
      diseaseName: { bn: 'টুংরো রোগ', en: 'Tungro' },
      tier: 'high',
      confidence: 0.88,
      thumbnail: 'data:image/jpeg;base64,tungro_thumb',
    })

    render(<HistoryScreen />)

    // Wait for the item to appear
    expect(await screen.findByText(/টুংরো রোগ/i)).toBeDefined()
    expect(screen.getByText(/৮৮%|88%/)).toBeDefined()

    // Test delete single button
    const deleteBtn = screen.getByRole('button', { name: /^মুছুন$/ })
    fireEvent.click(deleteBtn)

    // After deletion, should revert to empty state
    await waitFor(async () => {
      const scans = await getScans()
      expect(scans).toHaveLength(0)
    })
  })

  it('6. সব মুছুন বাটন এবং নিশ্চিতকরণ কাজ করে', async () => {
    await addScan({
      diseaseId: 'blast',
      diseaseName: { bn: 'ব্লাস্ট রোগ', en: 'Blast' },
      tier: 'high',
      confidence: 0.85,
      thumbnail: 'data:image/jpeg;base64,blast_thumb',
    })

    render(<HistoryScreen />)
    expect(await screen.findByText(/ব্লাস্ট রোগ/i)).toBeDefined()

    // Click "সব মুছুন"
    const clearAllBtn = screen.getByRole('button', { name: /সব মুছুন/i })
    fireEvent.click(clearAllBtn)

    // Confirmation appears
    expect(screen.getByText(/সব মুছবেন\?/i)).toBeDefined()
    const confirmBtn = screen.getByRole('button', { name: /হ্যাঁ, মুছুন/i })
    fireEvent.click(confirmBtn)

    // Should clear and show empty state
    expect(await screen.findByText(/কোনো স্ক্যান ইতিহাস নেই/i)).toBeDefined()
  })
})
