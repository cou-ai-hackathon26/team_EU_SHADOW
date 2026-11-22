import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('S1: README and Documentation Rule 10 Compliance (s1.test.ts)', () => {
  const rootDir = path.resolve(__dirname, '../../../')
  const readmePath = path.join(rootDir, 'README.md')
  const creditsPath = path.join(rootDir, 'docs/CREDITS.md')

  it('1. README.md exists and contains NO unresolved "_TBD_" placeholders', () => {
    expect(fs.existsSync(readmePath)).toBe(true)
    const content = fs.readFileSync(readmePath, 'utf8')
    expect(content).not.toMatch(/_TBD/i)
  })

  it('2. README.md contains all mandatory Rule 10 sections and details', () => {
    const content = fs.readFileSync(readmePath, 'utf8')

    // Team members & Student / Leader designations
    expect(content).toMatch(/Md\.?\s*Masum Akondha/i)
    expect(content).toMatch(/Tanjil Shaiket/i)
    expect(content).toMatch(/Md\.?\s*Mehedi Hasan/i)

    // Problem and solution
    expect(content).toMatch(/##\s*(?:Problem and Solution|সমস্যা ও সমাধান)/i)
    expect(content).toMatch(/16123|১৬১২৩/)

    // Features
    expect(content).toMatch(/##\s*(?:Features|ফিচারসমূহ)/i)

    // How the AI works (Browser ONNX, Privacy, No server)
    expect(content).toMatch(/##\s*(?:How the AI works|এআই কীভাবে কাজ করে)/i)
    expect(content).toMatch(/ONNX|MobileNet/i)
    expect(content).toMatch(/browser|অন-ডিভাইস/i)

    // Tech Stack
    expect(content).toMatch(/##\s*(?:Tech stack|প্রযুক্তি)/i)
    expect(content).toMatch(/React/i)
    expect(content).toMatch(/Tailwind/i)
    expect(content).toMatch(/PyTorch|ONNX/i)

    // Datasets
    expect(content).toMatch(/##\s*(?:Datasets|উপাত্ত)/i)
    expect(content).toMatch(/RiceLeafDiseaseBD|Mendeley/i)

    // AI tools disclosure (Rule 10 & 12)
    expect(content).toMatch(/Claude Code/i)
    expect(content).toMatch(/Gemini Antigravity/i)

    // Local execution / demo
    expect(content).toMatch(/npm run demo/i)

    // Safety: no pesticide brand names & doses
    expect(content).not.toMatch(/\b(?:Furadan|Diazinon|Malathion|Carbofuran|Dithane|Tilt)\b/i)
  })

  it('3. docs/CREDITS.md exists and properly credits libraries, datasets, and national bodies', () => {
    expect(fs.existsSync(creditsPath)).toBe(true)
    const content = fs.readFileSync(creditsPath, 'utf8')

    // Dataset citation
    expect(content).toMatch(/RiceLeafDiseaseBD|Mendeley/i)

    // Research & Agriculture agencies
    expect(content).toMatch(/BRRI|DAE|কৃষি সম্প্রসারণ অধিদপ্তর/i)

    // Key open source packages
    expect(content).toMatch(/React/i)
    expect(content).toMatch(/onnxruntime-web/i)
    expect(content).toMatch(/Tailwind/i)
    expect(content).toMatch(/PyTorch/i)
  })

  it('4. Relative documentation links in README.md point to real existing files', () => {
    const content = fs.readFileSync(readmePath, 'utf8')
    const linkMatches = [...content.matchAll(/\[.*?\]\(((?!https?:\/\/|#)[^)]+)\)/g)]

    expect(linkMatches.length).toBeGreaterThan(0)
    for (const match of linkMatches) {
      const relativePath = match[1].split('#')[0]
      if (relativePath) {
        const fullPath = path.resolve(rootDir, relativePath)
        expect(
          fs.existsSync(fullPath),
          `Referenced file "${relativePath}" must exist on disk`,
        ).toBe(true)
      }
    }
  })
})
