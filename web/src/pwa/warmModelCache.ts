import voiceManifest from '../features/voice/voice-manifest.json'

export interface WarmModelCacheOptions {
  fetchFn?: typeof fetch
  online?: boolean
  saveData?: boolean
  baseUrl?: string
  cacheStorage?: Pick<CacheStorage, 'open'> | null
}

export interface WarmModelCacheResult {
  warmed: string[]
  skipped?: 'offline' | 'save-data'
}

/**
 * Name of the runtime cache for ML model assets.
 * Must match the cacheName 'agroleaf-model' configured in vite.config.ts runtimeCaching.
 */
export const MODEL_CACHE_NAME = 'agroleaf-model'

/**
 * Name of the runtime cache for voice audio clips.
 * Must match the cacheName 'agroleaf-audio' configured in vite.config.ts runtimeCaching.
 */
export const AUDIO_CACHE_NAME = 'agroleaf-audio'

let warmedPromise: Promise<WarmModelCacheResult> | null = null
let warmedAudioPromise: Promise<WarmModelCacheResult> | null = null

export function resetWarmModelCache(): void {
  warmedPromise = null
}

export function resetWarmAudioCache(): void {
  warmedAudioPromise = null
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

    const cacheStorage =
      opts?.cacheStorage !== undefined
        ? opts.cacheStorage
        : typeof globalThis !== 'undefined' && 'caches' in globalThis
          ? globalThis.caches
          : null

    let cache: Cache | null = null
    if (cacheStorage) {
      try {
        cache = await cacheStorage.open(MODEL_CACHE_NAME)
      } catch {
        cache = null
      }
    }

    const warmed: string[] = []

    for (const path of targetPaths) {
      try {
        const res = await fetchFn(path)
        if (res.ok) {
          if (cache) {
            try {
              await cache.put(path, res.clone())
            } catch {
              // Ignore cache write errors
            }
          }
          // Read response body fully so SW (if controlling) stores it in runtime cache
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
 * Warms the runtime service worker cache for the Bangla voice MP3 clips.
 * Fetches every entry from voice-manifest.json in sequence and puts into 'agroleaf-audio'.
 */
export function warmAudioCache(
  opts?: WarmModelCacheOptions,
): Promise<WarmModelCacheResult> {
  if (warmedAudioPromise) {
    return warmedAudioPromise
  }

  warmedAudioPromise = (async (): Promise<WarmModelCacheResult> => {
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

    const targetPaths = voiceManifest.map((entry) => `${base}/audio/${entry.file}`)

    const cacheStorage =
      opts?.cacheStorage !== undefined
        ? opts.cacheStorage
        : typeof globalThis !== 'undefined' && 'caches' in globalThis
          ? globalThis.caches
          : null

    let cache: Cache | null = null
    if (cacheStorage) {
      try {
        cache = await cacheStorage.open(AUDIO_CACHE_NAME)
      } catch {
        cache = null
      }
    }

    const warmed: string[] = []

    for (const path of targetPaths) {
      try {
        if (cache) {
          try {
            const existing = await cache.match(path)
            if (existing) {
              warmed.push(path)
              continue
            }
          } catch {
            // Ignore cache.match errors and fall through to fetch
          }
        }

        const res = await fetchFn(path)
        if (res.ok) {
          if (cache) {
            try {
              await cache.put(path, res.clone())
            } catch {
              // Ignore cache write errors
            }
          }
          // Read response body fully so SW (if controlling) stores it in runtime cache
          await res.arrayBuffer()
          warmed.push(path)
        }
      } catch {
        // Silently catch network or parsing errors and continue to next file
      }
    }

    if (warmed.length > 0) {
      console.info(`[AgroLeaf AI] Warmed audio cache: ${warmed.length} files.`)
    }

    return { warmed }
  })()

  return warmedAudioPromise
}

/**
 * Schedules model and audio cache warmup after service worker is ready and during idle time
 * so it never impacts first paint or user responsiveness.
 */
export async function scheduleModelWarmup(): Promise<void> {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    await navigator.serviceWorker.ready

    const runWarmup = async () => {
      await warmModelCache()
      await warmAudioCache()
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
