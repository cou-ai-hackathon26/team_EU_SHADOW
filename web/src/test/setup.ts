import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { vi } from 'vitest'

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.toBlob = function (
    callback: (blob: Blob | null) => void,
    type: string = 'image/png',
  ) {
    callback(new Blob(['mock-canvas-blob'], { type }))
  }
}

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(() => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  })),
}))

// The scan session (crop / photo / result) is a module-level store shared by every screen.
// Start each test on Home with an empty session, like a fresh page load.
import { beforeEach } from 'vitest'
import { scanSession } from '../app/scanSession'

beforeEach(() => {
  if (typeof window !== 'undefined') window.history.replaceState(null, '', window.location.pathname)
  scanSession._resetForTests('')
})
