import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render } from '@testing-library/react'
import { ScanStateProvider, useScanState } from './scanStateContext'

vi.mock('../ai/engine', () => ({ loadModel: vi.fn(), analyze: vi.fn() }))

const root = resolve(__dirname, '../..')

describe('dark emerald first paint (no white flash)', () => {
  it('index.html paints html, body and #root dark emerald inline, before any CSS or JS', () => {
    const html = readFileSync(resolve(root, 'index.html'), 'utf-8')
    const head = html.slice(0, html.indexOf('</head>'))
    expect(head).toMatch(/<style>[^<]*html,\s*body,\s*#root\s*\{[^}]*background-color:\s*#072A19/i)
    expect(html).toMatch(/name="theme-color" content="#072A19"/)
  })

  it('base CSS keeps html, body and #root dark emerald', () => {
    const css = readFileSync(resolve(root, 'src/index.css'), 'utf-8')
    expect(css).toMatch(/html, body, #root \{[^}]*background-color: #072a19/i)
    expect(css).toMatch(/body \{[^}]*background: #072a19/i)
  })

  it('opening the app on Home starts in the dark landing state on the very first render', () => {
    window.location.hash = ''
    const seen: boolean[] = []
    function Probe() {
      seen.push(useScanState().isLandingView)
      return null
    }
    render(<ScanStateProvider><Probe /></ScanStateProvider>)
    expect(seen[0]).toBe(true)
  })

  it('other routes do not start in the landing state', () => {
    window.location.hash = '#/history'
    const seen: boolean[] = []
    function Probe() {
      seen.push(useScanState().isLandingView)
      return null
    }
    render(<ScanStateProvider><Probe /></ScanStateProvider>)
    expect(seen[0]).toBe(false)
    window.location.hash = ''
  })
})
