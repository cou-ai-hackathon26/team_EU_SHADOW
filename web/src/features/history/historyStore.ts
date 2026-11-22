import { openDB, type IDBPDatabase } from 'idb'
import type { ConfidenceTier, Prediction } from '../../ai/types'
import { getCard } from '../../content/getCard'

export interface ScanRecord {
  id: string
  timestamp: number
  diseaseId: string
  diseaseName: {
    bn: string
    en: string
  }
  tier: ConfidenceTier
  confidence: number
  thumbnail: string
  notes?: string
}

const DB_NAME = 'agroleaf-history-db'
const STORE_NAME = 'scans'
const MAX_THUMBNAIL_DIMENSION = 256
const THUMBNAIL_QUALITIES = [0.8, 0.6, 0.4] as const

export function isIndexedDBSupported(): boolean {
  return typeof indexedDB !== 'undefined'
}

let dbPromise: Promise<IDBPDatabase> | null = null

export function getDb(): Promise<IDBPDatabase | null> {
  if (!isIndexedDBSupported()) {
    return Promise.resolve(null)
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('by-timestamp', 'timestamp')
        }
      },
    })
  }
  return dbPromise
}

/**
 * Calculates approximate size in bytes of a base64 Data URL or string.
 */
export function getApproxBytes(str: string): number {
  const base64 = str.includes(',') ? str.split(',')[1] : str
  return Math.ceil((base64.length * 3) / 4)
}

/**
 * Ensures the thumbnail image is under the specified max byte size (default 200 KB).
 */
export async function compressThumbnail(
  source: HTMLImageElement | ImageBitmap | string,
  maxBytes = 200 * 1024
): Promise<string> {
  if (typeof source === 'string' && getApproxBytes(source) <= maxBytes) {
    return source
  }

  const image = typeof source === 'string' ? await loadThumbnailImage(source) : source
  const width = 'naturalWidth' in image ? image.naturalWidth : image.width
  const height = 'naturalHeight' in image ? image.naturalHeight : image.height
  if (!width || !height) {
    throw new Error('Cannot compress a thumbnail with empty image dimensions')
  }

  const scale = Math.min(1, MAX_THUMBNAIL_DIMENSION / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Cannot create a canvas context for thumbnail compression')
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  for (const quality of THUMBNAIL_QUALITIES) {
    const thumbnail = canvas.toDataURL('image/jpeg', quality)
    if (getApproxBytes(thumbnail) <= maxBytes) {
      return thumbnail
    }
  }

  throw new Error(`Unable to compress thumbnail below ${maxBytes} bytes`)
}

function loadThumbnailImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to load image for thumbnail compression'))
    image.src = dataUrl
  })
}

/**
 * Adds a new scan result to IndexedDB.
 */
export async function addScan(
  record: Omit<ScanRecord, 'id' | 'timestamp'> & { id?: string; timestamp?: number }
): Promise<ScanRecord> {
  const id =
    record.id ??
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)
  const timestamp = record.timestamp ?? Date.now()
  const thumbnail = await compressThumbnail(record.thumbnail)

  const fullRecord: ScanRecord = {
    ...record,
    id,
    timestamp,
    thumbnail,
  }

  const db = await getDb()
  if (db) {
    await db.put(STORE_NAME, fullRecord)
  }
  return fullRecord
}

/**
 * Saves a prediction and its image as a local scan history record.
 */
export async function saveScanFromPrediction(
  prediction: Prediction,
  image: HTMLImageElement | ImageBitmap | string
): Promise<ScanRecord> {
  const topPrediction = prediction.top[0]
  if (!topPrediction) {
    throw new Error('Cannot save a prediction without a top class')
  }

  const thumbnail = await compressThumbnail(image)
  return addScan({
    diseaseId: topPrediction.classId,
    diseaseName: getCard(topPrediction.classId).name,
    tier: prediction.tier,
    confidence: topPrediction.prob,
    thumbnail,
  })
}

/**
 * Retrieves all stored scans sorted newest first.
 */
export async function getScans(): Promise<ScanRecord[]> {
  const db = await getDb()
  if (!db) return []

  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const index = store.index('by-timestamp')

  const scans: ScanRecord[] = []
  let cursor = await index.openCursor(null, 'prev')
  while (cursor) {
    scans.push(cursor.value)
    cursor = await cursor.continue()
  }
  return scans
}

/**
 * Deletes a single scan by its unique ID.
 */
export async function deleteScan(id: string): Promise<void> {
  const db = await getDb()
  if (db) {
    await db.delete(STORE_NAME, id)
  }
}

/**
 * Clears all scan records from the local store.
 */
export async function clearAllScans(): Promise<void> {
  const db = await getDb()
  if (db) {
    await db.clear(STORE_NAME)
  }
}
