import type { Prediction } from '../../ai/types'
import { getCard } from '../../content/getCard'

export const SUMMARY_CANVAS_WIDTH = 720
export const SUMMARY_CANVAS_HEIGHT = 960

export interface CaseSummaryInput {
  prediction: Prediction
  date?: Date
  image?: CanvasImageSource
}

export const TIER_LABELS_BN: Record<string, string> = {
  high: 'নিশ্চিত',
  medium: 'দুটি সম্ভাবনা',
  low: 'আমি নিশ্চিত নই',
  not_rice: 'ধানপাতা নয়',
}

/**
 * Returns disease/tier line respecting the confidence tier:
 * - high: single disease name from content
 * - medium: "সম্ভাব্য: <top1> অথবা <top2>"
 * - low: "আমি নিশ্চিত নই — কৃষি কর্মকর্তাকে দেখান" (no disease name)
 * - not_rice: "ছবিটি ধানপাতা মনে হচ্ছে না"
 */
export function formatTierSummary(prediction: Prediction): string {
  switch (prediction.tier) {
    case 'high': {
      const top1 = prediction.top[0]
      return top1 ? getCard(top1.classId).name.bn : 'অজানা রোগ'
    }
    case 'medium': {
      const top1 = prediction.top[0]
        ? getCard(prediction.top[0].classId).name.bn
        : 'অজানা'
      const top2 = prediction.top[1]
        ? getCard(prediction.top[1].classId).name.bn
        : 'অজানা'
      return `সম্ভাব্য: ${top1} অথবা ${top2}`
    }
    case 'low': {
      return 'আমি নিশ্চিত নই — কৃষি কর্মকর্তাকে দেখান'
    }
    case 'not_rice': {
      return 'ছবিটি ধানপাতা মনে হচ্ছে না'
    }
    default: {
      return 'অজানা'
    }
  }
}

/**
 * Formats case summary text for sharing via WhatsApp or SMS.
 * Strictly avoids any location/GPS data.
 */
export function generateCaseSummaryText(input: CaseSummaryInput): string {
  const { prediction, date = new Date() } = input
  const summaryLine = formatTierSummary(prediction)
  const tierName = TIER_LABELS_BN[prediction.tier] ?? prediction.tier
  const dateStr = date.toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `AgroLeaf AI — কেস সামারি (কৃষি পরামর্শের জন্য)
রোগের বিবরণ: ${summaryLine}
ফলাফলের স্তর: ${tierName}
তারিখ: ${dateStr}
মডেল সংস্করণ: ${prediction.modelVersion}
জরুরি কৃষি পরামর্শ ও সহায়তার জন্য কল করুন: কৃষি কল সেন্টার ১৬১২৩
সতর্কতা: এটি প্রাথমিক স্ক্রিনিং রিপোর্ট। নিশ্চিত সিদ্ধান্তের জন্য নিকটস্থ কৃষি কর্মকর্তা বা উপ-সহকারী কৃষি কর্মকর্তার পরামর্শ নিন।`
}

/**
 * Renders an accessible 720x960 summary card on canvas.
 */
export async function generateCaseSummaryCanvas(
  input: CaseSummaryInput,
): Promise<HTMLCanvasElement> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      // Ignore font loading errors in environments without font loader
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = SUMMARY_CANVAS_WIDTH
  canvas.height = SUMMARY_CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const fontFam = '"Hind Siliguri", sans-serif'

  // 1. Background
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, SUMMARY_CANVAS_WIDTH, SUMMARY_CANVAS_HEIGHT)

  // 2. Header banner
  ctx.fillStyle = '#166534'
  ctx.fillRect(0, 0, SUMMARY_CANVAS_WIDTH, 140)

  ctx.fillStyle = '#ffffff'
  ctx.font = `bold 36px ${fontFam}`
  ctx.fillText('AgroLeaf AI', 40, 60)

  ctx.font = `20px ${fontFam}`
  ctx.fillStyle = '#bbf7d0'
  ctx.fillText('ধানপাতার রোগ নির্ণয় ও প্রাথমিক কেস সামারি', 40, 100)

  // 3. Leaf image or placeholder (drawn with "contain" aspect ratio)
  const imgY = 170
  const imgH = 380
  const imgW = SUMMARY_CANVAS_WIDTH - 80
  ctx.fillStyle = '#e2e8f0'
  ctx.fillRect(40, imgY, imgW, imgH)

  if (input.image) {
    try {
      const anyImg = input.image as unknown as {
        width?: number
        height?: number
        naturalWidth?: number
        naturalHeight?: number
        videoWidth?: number
        videoHeight?: number
      }
      const sourceW = anyImg.naturalWidth || anyImg.videoWidth || anyImg.width || imgW
      const sourceH = anyImg.naturalHeight || anyImg.videoHeight || anyImg.height || imgH
      const scale = Math.min(imgW / sourceW, imgH / sourceH)
      const drawW = sourceW * scale
      const drawH = sourceH * scale
      const drawX = 40 + (imgW - drawW) / 2
      const drawY = imgY + (imgH - drawH) / 2

      ctx.drawImage(input.image, drawX, drawY, drawW, drawH)
    } catch {
      // Fallback if drawImage fails
    }
  } else {
    ctx.fillStyle = '#64748b'
    ctx.font = `22px ${fontFam}`
    ctx.textAlign = 'center'
    ctx.fillText('নমুনা পাতার ছবি', SUMMARY_CANVAS_WIDTH / 2, imgY + imgH / 2)
    ctx.textAlign = 'left'
  }

  // 4. Diagnostic Card
  const cardY = 580
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 2
  ctx.beginPath()
  const ctxAny = ctx as unknown as { roundRect?: (...args: number[]) => void }
  if (typeof ctxAny.roundRect === 'function') {
    ctxAny.roundRect(40, cardY, imgW, 230, 16)
  } else {
    ctx.rect(40, cardY, imgW, 230)
  }
  ctx.fill()
  ctx.stroke()

  const { prediction, date = new Date() } = input
  const summaryLine = formatTierSummary(prediction)
  const tierName = TIER_LABELS_BN[prediction.tier] ?? prediction.tier
  const dateStr = date.toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  ctx.fillStyle = '#166534'
  ctx.font = `bold 26px ${fontFam}`
  ctx.fillText(summaryLine, 60, cardY + 50)

  ctx.fillStyle = '#334155'
  ctx.font = `20px ${fontFam}`
  ctx.fillText(`ফলাফলের স্তর: ${tierName}`, 60, cardY + 95)
  ctx.fillText(`তারিখ: ${dateStr}`, 60, cardY + 135)
  ctx.fillText(`মডেল সংস্করণ: ${prediction.modelVersion}`, 60, cardY + 175)

  // 5. Disclaimer line above the 16123 footer
  ctx.fillStyle = '#64748b'
  ctx.font = `18px ${fontFam}`
  ctx.textAlign = 'center'
  ctx.fillText(
    'এটি প্রাথমিক স্ক্রিনিং, চূড়ান্ত রোগ নির্ণয় নয়',
    SUMMARY_CANVAS_WIDTH / 2,
    SUMMARY_CANVAS_HEIGHT - 95,
  )

  // 6. Footer Helpline Banner
  ctx.fillStyle = '#166534'
  ctx.fillRect(0, SUMMARY_CANVAS_HEIGHT - 80, SUMMARY_CANVAS_WIDTH, 80)

  ctx.fillStyle = '#ffffff'
  ctx.font = `bold 22px ${fontFam}`
  ctx.textAlign = 'center'
  ctx.fillText(
    'জরুরি কৃষি পরামর্শের জন্য কল করুন: ১৬১২৩',
    SUMMARY_CANVAS_WIDTH / 2,
    SUMMARY_CANVAS_HEIGHT - 32,
  )
  ctx.textAlign = 'left'

  return canvas
}

/**
 * Resolves only with canvas.toBlob's real Blob and rejects if null.
 * No fake fallbacks or timeouts.
 */
export async function generateCaseSummaryBlob(
  input: CaseSummaryInput,
): Promise<Blob> {
  const canvas = await generateCaseSummaryCanvas(input)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('ক্যানভাস থেকে ছবি তৈরি করা যায়নি'))
      }
    }, 'image/png')
  })
}
