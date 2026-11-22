import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import {
  clipKeyFor,
  buildVoiceManifest,
  MEDIUM_PAIR_TEXT,
  RICE_CLASS_IDS,
  type VoiceManifestEntry,
} from './voiceClips'
import { getCard } from '../../content/getCard'
import { buildSpokenText } from './speak'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('F8 voiceClips pure logic & manifest verification', () => {
  it('1. clipKeyFor covers all 5 branches correctly', () => {
    const blastCard = getCard('blast')
    const brownSpotCard = getCard('brown_spot')
    const notRiceCard = getCard('not_rice')

    // Branch 1: not_rice tier
    expect(clipKeyFor(notRiceCard, 'not_rice')).toBe('not_rice')

    // Branch 2: low tier
    expect(clipKeyFor(blastCard, 'low')).toBe('low')

    // Branch 3: medium tier with secondCard
    expect(clipKeyFor(blastCard, 'medium', brownSpotCard)).toBe('medium-pair')

    // Branch 4: medium tier single card
    expect(clipKeyFor(blastCard, 'medium')).toBe('medium-blast')

    // Branch 5: high tier
    expect(clipKeyFor(blastCard, 'high')).toBe('high-blast')
  })

  it('2. buildVoiceManifest has 15 unique keys, and every text equals buildSpokenText for that key (no drift)', () => {
    const manifest = buildVoiceManifest()
    expect(manifest).toHaveLength(15)

    const keys = manifest.map((m) => m.key)
    const uniqueKeys = new Set(keys)
    expect(uniqueKeys.size).toBe(15)

    // Check individual text fidelity
    for (const id of RICE_CLASS_IDS) {
      const highEntry = manifest.find((m) => m.key === `high-${id}`)
      expect(highEntry).toBeDefined()
      expect(highEntry?.file).toBe(`high-${id}.mp3`)
      expect(highEntry?.text).toBe(buildSpokenText(getCard(id), 'high'))

      const mediumEntry = manifest.find((m) => m.key === `medium-${id}`)
      expect(mediumEntry).toBeDefined()
      expect(mediumEntry?.file).toBe(`medium-${id}.mp3`)
      expect(mediumEntry?.text).toBe(buildSpokenText(getCard(id), 'medium'))
    }

    const pairEntry = manifest.find((m) => m.key === 'medium-pair')
    expect(pairEntry?.text).toBe(MEDIUM_PAIR_TEXT)

    const lowEntry = manifest.find((m) => m.key === 'low')
    expect(lowEntry?.text).toBe(buildSpokenText(getCard('not_sure'), 'low'))

    const notRiceEntry = manifest.find((m) => m.key === 'not_rice')
    expect(notRiceEntry?.text).toBe(buildSpokenText(getCard('not_rice'), 'not_rice'))
  })

  it('3. Drift guard: voice-manifest.json deep-equals buildVoiceManifest()', () => {
    const manifestPath = path.resolve(__dirname, 'voice-manifest.json')
    const manifest = buildVoiceManifest()

    if (process.env.UPDATE_VOICE_MANIFEST === '1') {
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
    }

    expect(fs.existsSync(manifestPath)).toBe(true)
    const savedManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as VoiceManifestEntry[]
    expect(savedManifest).toEqual(manifest)
  })

  it('4. voice-generated.json has a sha256 for every manifest file and each one equals sha256(text)', () => {
    const generatedPath = path.resolve(__dirname, 'voice-generated.json')
    expect(fs.existsSync(generatedPath)).toBe(true)

    const generated = JSON.parse(fs.readFileSync(generatedPath, 'utf8')) as Record<string, string>
    const manifest = buildVoiceManifest()

    for (const entry of manifest) {
      expect(generated[entry.file]).toBeDefined()
      const expectedHash = crypto.createHash('sha256').update(entry.text, 'utf8').digest('hex')
      expect(generated[entry.file]).toBe(expectedHash)
    }
  })

  it('5. Every web/public/audio/<file> exists, each is > 2 KB, and total is <= 1.2 MB', () => {
    const audioDir = path.resolve(__dirname, '../../../public/audio')
    expect(fs.existsSync(audioDir)).toBe(true)

    const manifest = buildVoiceManifest()
    let totalBytes = 0

    for (const entry of manifest) {
      const filePath = path.join(audioDir, entry.file)
      expect(fs.existsSync(filePath), `Audio file ${entry.file} should exist`).toBe(true)
      const size = fs.statSync(filePath).size
      expect(size).toBeGreaterThan(2048)
      totalBytes += size
    }

    expect(totalBytes).toBeLessThanOrEqual(1.2 * 1024 * 1024)
  })
})
