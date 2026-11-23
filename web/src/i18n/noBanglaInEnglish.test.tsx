import { render, act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import App from '../App'
import { STORAGE_KEY, resetGlobalLang } from './useT'
import { scanSession } from '../app/scanSession'
import type { Prediction } from '../ai/types'

vi.mock('../ai/engine', () => ({ loadModel: vi.fn(), analyze: vi.fn() }))

const BANGLA = /[\u0980-\u09FF]/
/** The only Bangla allowed in EN mode is the "বাং" label of the language switch itself. */
const ALLOWED = new Set(['বাং'])

function banglaLeft(root: HTMLElement): string[] {
  const out = new Set<string>()
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let n: Node | null
  while ((n = walker.nextNode())) {
    const t = n.textContent?.trim()
    if (t && BANGLA.test(t) && !ALLOWED.has(t)) out.add(t.slice(0, 80))
  }
  root.querySelectorAll('[aria-label],[alt],[title],[placeholder]').forEach((el) => {
    for (const a of ['aria-label', 'alt', 'title', 'placeholder']) {
      const v = el.getAttribute(a)
      if (v && BANGLA.test(v)) out.add(`@${a}: ${v.slice(0, 60)}`)
    }
  })
  return [...out]
}

const pred = (tier: Prediction['tier'], top: [string, number][]): Prediction => ({
  tier,
  top: top.map(([classId, prob]) => ({ classId, prob })) as Prediction['top'],
  modelVersion: 'v1',
  trainedFromScratch: true,
  latencyMs: 1,
})

function stubFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (u: string) => {
      const url = String(u)
      for (const f of ['samples/samples.json', 'model/report.json', 'model/model_meta.json']) {
        if (url.includes(f)) {
          const txt = readFileSync(resolve(__dirname, '../../public', f), 'utf-8')
          return { ok: true, json: async () => JSON.parse(txt), text: async () => txt }
        }
      }
      if (url.includes('nominatim')) return { ok: true, json: async () => ({ address: { suburb: 'Mirpur', city: 'Dhaka' } }) }
      return {
        ok: true,
        json: async () => ({
          hourly: {
            time: Array(72).fill('2026-11-23T00:00'),
            temperature_2m: Array(72).fill(25),
            relative_humidity_2m: Array(72).fill(95),
            precipitation: Array(72).fill(1),
          },
        }),
      }
    }),
  )
  vi.stubGlobal('navigator', {
    ...navigator,
    onLine: true,
    geolocation: {
      getCurrentPosition: (ok: PositionCallback) =>
        ok({ coords: { latitude: 23.81, longitude: 90.37, accuracy: 10 }, timestamp: 0 } as unknown as GeolocationPosition),
    },
  })
}

async function renderAt(hash: string, setup: () => void = () => {}, mode: 'desktop' | 'mobile' = 'desktop') {
  localStorage.setItem('agroleaf_viewport_mode', mode)
  window.history.replaceState(null, '', window.location.pathname + hash)
  scanSession._resetForTests(hash)
  act(() => setup())
  const r = render(<App />)
  await act(async () => {
    await new Promise((res) => setTimeout(res, 250))
  })
  return r
}

const withResult = (p: Prediction | null, err: Error | null = null) => () => {
  scanSession.openCrop('rice')
  scanSession.setImage(new Image(), new File(['x'], 'a.jpg', { type: 'image/jpeg' }))
  scanSession.setResult(p, err)
}

describe('EN mode: no Bangla text left on any screen', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(STORAGE_KEY, 'en')
    act(() => resetGlobalLang())
    stubFetch()
  })
  afterEach(() => vi.unstubAllGlobals())

  const cases: [string, string, (() => void) | undefined][] = [
    ['home (hero + crop selector)', '', undefined],
    ['rice scanner workspace', '', () => scanSession.openCrop('rice')],
    ['result: high (blast)', '', withResult(pred('high', [['blast', 0.95], ['brown_spot', 0.03]]))],
    ['result: medium', '', withResult(pred('medium', [['blast', 0.55], ['brown_spot', 0.4]]))],
    ['result: low', '', withResult(pred('low', [['blast', 0.35], ['brown_spot', 0.33]]))],
    ['result: not rice', '', withResult(pred('not_rice', [['not_rice', 0.9], ['blast', 0.05]]))],
    ['result: engine error', '', withResult(null, new Error('boom'))],
    ['weather + crop rotation', '#/weather', undefined],
    ['history', '#/history', undefined],
    ['how it works / accuracy', '#/how-it-works', undefined],
    ['about', '#/about', undefined],
  ]

  for (const [name, hash, setup] of cases) {
    it(name, async () => {
      const { container } = await renderAt(hash, setup)
      expect(banglaLeft(container)).toEqual([])
    })
  }

  it('the ☰ Menu dropdown', async () => {
    const user = userEvent.setup()
    const { container } = await renderAt('')
    await user.click(screen.getAllByRole('button', { name: 'Menu' })[0])
    expect(banglaLeft(container)).toEqual([])
  })

  it('the laptop Mobile preview', async () => {
    const { container } = await renderAt('', undefined, 'mobile')
    expect(banglaLeft(container)).toEqual([])
  })
})
