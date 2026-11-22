export interface WarmModelCacheOptions {
  fetchFn?: typeof fetch
  online?: boolean
  saveData?: boolean
  baseUrl?: string
}

export interface WarmModelCacheResult {
  warmed: string[]
  skipped?: 'offline' | 'save-data'
}

let warmedPromise: Promise<WarmModelCacheResult> | null = null

export function resetWarmModelCache(): void {
  warmedPromise = null
}

/**
 * Warms the runtime service worker cache for the model files:
 * model_meta.json, agroleaf.onnx, and report.json.
 */
export function warmModelCache(
  opts?: WarmModelCacheOptions,
): Promise<WarmModelCacheResult> {
  if (warmedPromise) {
    return warmedPromise
  }

  warmedPromise = (async (): Promise<WarmModelCacheResult> => {
    const isOnline =
      opts?.online !== undefined
        ? opts.online
        : typeof navigator !== 'undefined'
          ? navigator.onLine
          : true

    if (!isOnline) {
      return { warmed: [], skipped: 'offline' }
    }

    const isSaveData =
      opts?.saveData !== undefined
        ? opts.saveData
        : typeof navigator !== 'undefined'
          ? (navigator as unknown as { connection?: { saveData?: boolean } })
              .connection?.saveData === true
          : false

    if (isSaveData) {
      return { warmed: [], skipped: 'save-data' }
    }

    const fetchFn = opts?.fetchFn ?? globalThis.fetch
    const rawBase =
      opts?.baseUrl ??
      (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
        ? import.meta.env.BASE_URL
        : '')
    const base = rawBase.replace(/\/$/, '')

    const targetPaths = [
      `${base}/model/model_meta.json`,
      `${base}/model/agroleaf.onnx`,
      `${base}/model/report.json`,
    ]

    const warmed: string[] = []

    for (const path of targetPaths) {
      try {
        const res = await fetchFn(path)
        if (res.ok) {
          // Read response body fully so SW stores it in runtime cache
          await res.arrayBuffer()
          warmed.push(path)
        }
      } catch {
        // Silently catch network or parsing errors and continue to next file
      }
    }

    if (warmed.length > 0) {
      console.info(`[AgroLeaf AI] Warmed model cache: ${warmed.length} files.`)
    }

    return { warmed }
  })()

  return warmedPromise
}

/**
 * Schedules model cache warmup after service worker is ready and during idle time
 * so it never impacts first paint or user responsiveness.
 */
export async function scheduleModelWarmup(): Promise<void> {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    await navigator.serviceWorker.ready

    const runWarmup = () => {
      void warmModelCache()
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(runWarmup, { timeout: 10000 })
    } else {
      setTimeout(runWarmup, 3000)
    }
  } catch {
    // Fail silently
  }
}
