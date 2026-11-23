/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA, type VitePWAOptions } from 'vite-plugin-pwa'

export const pwaOptions: Partial<VitePWAOptions> = {
  // New deploys take over immediately, so no one is stuck on an old cached shell.
  registerType: 'autoUpdate',
  manifest: {
    name: 'AgroLeaf AI — ধানপাতার রোগ নির্ণয়',
    short_name: 'AgroLeaf AI',
    description: 'ধানপাতার রোগের প্রাথমিক স্ক্রিনিং ও শনাক্তকরণ',
    start_url: '/',
    display: 'standalone',
    background_color: '#072A19',
    theme_color: '#072A19',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
  workbox: {
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,wasm}', 'samples/*.{jpg,json}', 'crops/*.webp'],
    maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
    runtimeCaching: [
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/model/'),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'agroleaf-model',
          networkTimeoutSeconds: 5,
        },
      },
      // Must match AUDIO_CACHE_NAME in web/src/pwa/warmModelCache.ts
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/audio/'),
        handler: 'CacheFirst',
        options: {
          cacheName: 'agroleaf-audio',
          rangeRequests: true,
          cacheableResponse: {
            statuses: [200],
          },
          expiration: {
            maxEntries: 40,
          },
        },
      },
    ],
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA(pwaOptions)],
  // onnxruntime-web ships its own WASM files; keep it out of dependency pre-bundling.
  optimizeDeps: { exclude: ['onnxruntime-web', 'onnxruntime-web/wasm'] },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        engine: './src/ai/engine.ts',
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'e2e/**/*.test.{ts,tsx}'],
  },
})
