import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
  addScan,
  getScans,
  deleteScan,
  clearAllScans,
  compressThumbnail,
  type ScanRecord,
} from './historyStore'
import { HistoryScreen } from './HistoryScreen'

describe('F9: Scan History Store (historyStore.ts)', () => {
  beforeEach(async () => {
    await clearAllScans()
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

  it('3. পূর্ণ ছবি নয়, ছোট thumbnail (≤ 200 KB) রাখে', async () => {
    // Generate a large data URL (> 250 KB)
    const largeData = 'data:image/jpeg;base64,' + 'A'.repeat(300 * 1024)
    expect(largeData.length).toBeGreaterThan(200 * 1024)

    const thumbnail = await compressThumbnail(largeData, 200 * 1024)

    // Calculate approximate byte size of base64 data URL
    const base64Data = thumbnail.split(',')[1] || thumbnail
    const approxBytes = Math.ceil((base64Data.length * 3) / 4)
    expect(approxBytes).toBeLessThanOrEqual(200 * 1024)

    // When saving through addScan with an oversized thumbnail, it is automatically kept <= 200 KB
    const saved = await addScan({
      diseaseId: 'leaf_smut',
      diseaseName: { bn: 'লিফ স্মাট', en: 'Leaf Smut' },
      tier: 'low',
      confidence: 0.42,
      thumbnail: largeData,
    })

    const savedBytes = Math.ceil((saved.thumbnail.length * 3) / 4)
    expect(savedBytes).toBeLessThanOrEqual(200 * 1024)
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
    const deleteBtn = screen.getByRole('button', { name: /মুছুন/i })
    fireEvent.click(deleteBtn)

    // After deletion, should revert to empty state
    await waitFor(async () => {
      const scans = await getScans()
      expect(scans).toHaveLength(0)
    })
  })
})
