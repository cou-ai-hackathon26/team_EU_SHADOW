import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('S3 Pitch and Final Submission Documentation', () => {
  const rootDir = path.resolve(__dirname, '../../../')
  const pitchPath = path.join(rootDir, 'docs/PITCH.md')
  const submissionPath = path.join(rootDir, 'docs/SUBMISSION.md')

  it('1. Submission বিবরণ exists, has required sections and word count <= 150 words', () => {
    expect(fs.existsSync(submissionPath)).toBe(true)
    const content = fs.readFileSync(submissionPath, 'utf8')

    // Must declare repo, live link, and AI disclosure (Rule 12)
    expect(content).toMatch(/github\.com\/masumcit44\/AgroLeaf_AI-/)
    expect(content).toMatch(/vercel\.app|live link/i)
    expect(content).toMatch(/AI disclosure|কৃত্রিম বুদ্ধিমত্তা/i)

    // Extract description section and check word count <= 150 words
    const descMatch = content.match(
      /## (?:বিবরণ|Description|Project Summary)([\s\S]*?)(?=##|$)/i,
    )
    expect(descMatch).toBeTruthy()
    const descText = descMatch ? descMatch[1].trim() : ''
    const words = descText
      .split(/\s+/)
      .filter((w) => w.length > 0 && !w.startsWith('#'))
    expect(words.length).toBeGreaterThan(10)
    expect(words.length).toBeLessThanOrEqual(150)
  })

  it('2. Pitch document clearly specifies who says which part (কে কোন অংশ বলবেন)', () => {
    expect(fs.existsSync(pitchPath)).toBe(true)
    const content = fs.readFileSync(pitchPath, 'utf8')

    // Must clearly designate team members and their speaking parts
    expect(content).toMatch(/Md\.?\s*Masum Akondha|মাসুম/i)
    expect(content).toMatch(/Tanjil Shaiket|তানজিল/i)
    expect(content).toMatch(/Md\.?\s*Mehedi Hasan|মেহেদী/i)

    // Must have speaking sections/cues for each member
    expect(content).toMatch(/কে কোন অংশ বলবেন|Speaker Breakdown|Speaking Order/i)
  })

  it('3. Pitch document contains exactly 10 anticipated judge questions and answers', () => {
    expect(fs.existsSync(pitchPath)).toBe(true)
    const content = fs.readFileSync(pitchPath, 'utf8')

    // Check for 10 Q&A pairs (supporting both Bangla and English digits)
    const qMatches = content.match(/(?:প্রশ্ন|Q)\s*[০-৯0-9]+[\s.:]/gi) || []
    expect(qMatches.length).toBeGreaterThanOrEqual(10)

    // Verify key topics: scratch training, dataset limitations, safety/pesticides
    expect(content).toMatch(/scratch|শূন্য থেকে|random init/i)
    expect(content).toMatch(/১৬১২৩|16123/i)
  })

  it('4. SUBMISSION.md contains Eastern University and live deployment URL', () => {
    expect(fs.existsSync(submissionPath)).toBe(true)
    const content = fs.readFileSync(submissionPath, 'utf8')

    expect(content).toContain('Eastern University')
    expect(content).toContain('https://agroleaf-ai-olive.vercel.app')
  })
})
