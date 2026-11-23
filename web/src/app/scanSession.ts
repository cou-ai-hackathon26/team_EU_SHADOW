import { useSyncExternalStore } from 'react'
import type { Prediction } from '../ai/types'

/**
 * One scan session shared by every mounted screen.
 *
 * In the laptop "Mobile" preview the app renders twice (phone frame + hidden standard view), and
 * switching Web ↔ Mobile remounts screens. Keeping the crop, photo and result here instead of in
 * component state means every view shows the same step, and nothing resets when the mode changes.
 *
 * The open workspace is also mirrored in the URL hash so a reload or Back keeps the user there:
 *   #/scan/rice          → scanner workspace (camera + gallery)
 *   #/scan/rice/result   → result for the current photo (Back returns to the workspace)
 * Photos stay in memory only (never stored), so after a reload the user is back in the workspace.
 */

export type CropId = 'rice'

export interface ScanSession {
  crop: CropId | null
  image: HTMLImageElement | null
  file: File | null
  prediction: Prediction | null
  error: Error | null
  isAnalyzing: boolean
  /** One-off hint shown in the workspace (e.g. "scan a leaf first to see the roadmap"). */
  notice: string | null
}

const EMPTY: ScanSession = {
  crop: null,
  image: null,
  file: null,
  prediction: null,
  error: null,
  isAnalyzing: false,
  notice: null,
}

export const SCAN_HASH = '#/scan/rice'
export const RESULT_HASH = '#/scan/rice/result'

function cropFromHash(hash: string): CropId | null {
  return hash.startsWith('#/scan/rice') ? 'rice' : null
}

function currentHash(): string {
  return typeof window === 'undefined' ? '' : window.location.hash
}

let state: ScanSession = { ...EMPTY, crop: cropFromHash(currentHash()) }
const listeners = new Set<() => void>()

function set(patch: Partial<ScanSession>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

function setHash(hash: string) {
  if (typeof window === 'undefined') return
  if (window.location.hash !== hash) window.location.hash = hash
}

export const scanSession = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  /** Open a crop's scanner workspace (from the crop card or the hero button). */
  openCrop(crop: CropId = 'rice', notice: string | null = null) {
    set({ crop, notice })
    if (!currentHash().startsWith(SCAN_HASH)) setHash(SCAN_HASH)
  },

  /** "← ফসল নির্বাচন" and the logo: back to the hero + crop selector with nothing kept. */
  reset() {
    set({ ...EMPTY })
    if (currentHash() !== '' && currentHash() !== '#/') setHash('#/')
  },

  setImage(image: HTMLImageElement, file: File) {
    set({ image, file, prediction: null, error: null, notice: null })
  },

  /** Clear photo and result but stay in the workspace ("অন্য ছবি" / "অন্য পাতা পরীক্ষা করুন"). */
  clearPhoto() {
    set({ image: null, file: null, prediction: null, error: null, isAnalyzing: false })
    if (currentHash() === RESULT_HASH) setHash(SCAN_HASH)
  },

  setAnalyzing(isAnalyzing: boolean) {
    set({ isAnalyzing, ...(isAnalyzing ? { error: null } : {}) })
  },

  setResult(prediction: Prediction | null, error: Error | null) {
    set({ prediction, error, isAnalyzing: false })
    if (prediction || error) setHash(RESULT_HASH)
  },

  clearNotice() {
    if (state.notice) set({ notice: null })
  },

  /** Keep the session in step with the URL (reload, browser Back/Forward, nav links). */
  syncFromHash(hash: string) {
    const crop = cropFromHash(hash)
    if (!crop) {
      // Left the workspace via a nav link or Back to Home: Home always starts at the crop selector.
      if (state.crop && (hash === '' || hash === '#' || hash === '#/')) set({ ...EMPTY })
      return
    }
    if (state.crop !== crop) set({ crop })
    // Back from the result to the workspace: drop the result, keep the workspace.
    if (hash === SCAN_HASH && (state.prediction || state.error)) {
      set({ image: null, file: null, prediction: null, error: null })
    }
  },

  /** Tests only. */
  _resetForTests(hash = '') {
    state = { ...EMPTY, crop: cropFromHash(hash) }
    listeners.forEach((l) => l())
  },
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => scanSession.syncFromHash(window.location.hash))
}

export function useScanSession(): ScanSession {
  return useSyncExternalStore(scanSession.subscribe, scanSession.get, scanSession.get)
}

export function isScanActiveIn(s: ScanSession): boolean {
  return Boolean(s.image || s.prediction || s.error)
}
