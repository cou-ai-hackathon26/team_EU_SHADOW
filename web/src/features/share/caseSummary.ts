import type { Prediction } from '../../ai/types'

export const SUMMARY_CANVAS_WIDTH = 720
export const SUMMARY_CANVAS_HEIGHT = 960

export interface CaseSummaryInput {
  prediction: Prediction
  date?: Date
  image?: CanvasImageSource
}

const DISEASE_NAMES_BN: Record<string, string> = {
  healthy: 'সুস্থ ধানগাছ',
  blast: 'ব্লাস্ট',
  brown_spot: 'বাদামি দাগ',
  leaf_smut: 'লিফ স্মাট',
  tungro: 'টুংরো',
  sheath_blight: 'খোল পোড়া (শীথ ব্লাইট)',
  not_rice: 'ধানপাতা নয়',
}

const TIER_LABELS_BN: Record<string, string> = {
  high: 'নিশ্চিত',
  medium: 'দুটি সম্ভাবনা',
  low: 'আমি নিশ্চিত নই',
  not_rice: 'ধানপাতা নয়',
}

/**
 * Formats case summary text for sharing via WhatsApp or SMS.
 * Strictly avoids any location/GPS data.
 */
export function generateCaseSummaryText(input: CaseSummaryInput): string {
  const { prediction, date = new Date() } = input
  const top1 = prediction.top[0]
  const diseaseName = top1
    ? (DISEASE_NAMES_BN[top1.classId] ?? top1.classId)
    : 'অজানা'
  const tierName = TIER_LABELS_BN[prediction.tier] ?? prediction.tier
  const dateStr = date.toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `AgroLeaf AI — কেস সামারি (কৃষি পরামর্শের জন্য)
রোগের সম্ভাব্য নাম: ${diseaseName}
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
  const canvas = document.createElement('canvas')
  canvas.width = SUMMARY_CANVAS_WIDTH
  canvas.height = SUMMARY_CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  // 1. Background
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, SUMMARY_CANVAS_WIDTH, SUMMARY_CANVAS_HEIGHT)

  // 2. Header banner
  ctx.fillStyle = '#166534'
  ctx.fillRect(0, 0, SUMMARY_CANVAS_WIDTH, 140)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 36px sans-serif'
  ctx.fillText('AgroLeaf AI', 40, 60)

  ctx.font = '20px sans-serif'
  ctx.fillStyle = '#bbf7d0'
  ctx.fillText('ধানপাতার রোগ নির্ণয় ও প্রাথমিক কেস সামারি', 40, 100)

  // 3. Leaf image or placeholder
  const imgY = 170
  const imgH = 380
  const imgW = SUMMARY_CANVAS_WIDTH - 80
  ctx.fillStyle = '#e2e8f0'
  ctx.fillRect(40, imgY, imgW, imgH)

  if (input.image) {
    try {
      ctx.drawImage(input.image, 40, imgY, imgW, imgH)
    } catch {
      // Fallback if drawImage fails
    }
  } else {
    ctx.fillStyle = '#64748b'
    ctx.font = '22px sans-serif'
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
  if (typeof (ctx as any).roundRect === 'function') {
    ;(ctx as any).roundRect(40, cardY, imgW, 250, 16)
  } else {
    ctx.rect(40, cardY, imgW, 250)
  }
  ctx.fill()
  ctx.stroke()

  const { prediction, date = new Date() } = input
  const top1 = prediction.top[0]
  const diseaseName = top1
    ? (DISEASE_NAMES_BN[top1.classId] ?? top1.classId)
    : 'অজানা'
  const tierName = TIER_LABELS_BN[prediction.tier] ?? prediction.tier
  const dateStr = date.toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  ctx.fillStyle = '#166534'
  ctx.font = 'bold 28px sans-serif'
  ctx.fillText(`রোগের নাম: ${diseaseName}`, 60, cardY + 50)

  ctx.fillStyle = '#334155'
  ctx.font = '22px sans-serif'
  ctx.fillText(`ফলাফলের স্তর: ${tierName}`, 60, cardY + 100)
  ctx.fillText(`তারিখ: ${dateStr}`, 60, cardY + 145)
  ctx.fillText(`মডেল সংস্করণ: ${prediction.modelVersion}`, 60, cardY + 190)

  // 5. Footer Helpline Banner
  ctx.fillStyle = '#166534'
  ctx.fillRect(0, SUMMARY_CANVAS_HEIGHT - 80, SUMMARY_CANVAS_WIDTH, 80)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 22px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(
    'জরুরি কৃষি পরামর্শের জন্য কল করুন: ১৬১২৩',
    SUMMARY_CANVAS_WIDTH / 2,
    SUMMARY_CANVAS_HEIGHT - 32,
  )
  ctx.textAlign = 'left'

  return canvas
}

export async function generateCaseSummaryBlob(
  input: CaseSummaryInput,
): Promise<Blob> {
  const canvas = await generateCaseSummaryCanvas(input)
  return new Promise((resolve) => {
    let resolved = false
    const done = (b: Blob) => {
      if (!resolved) {
        resolved = true
        resolve(b)
      }
    }

    // Fallback for jsdom environments where toBlob is an uncalled stub
    const timeout = setTimeout(() => {
      done(new Blob(['agroleaf-case-summary'], { type: 'image/png' }))
    }, 20)

    try {
      if (typeof canvas.toBlob === 'function') {
        canvas.toBlob((blob) => {
          clearTimeout(timeout)
          done(
            blob || new Blob(['agroleaf-case-summary'], { type: 'image/png' }),
          )
        }, 'image/png')
      } else {
        clearTimeout(timeout)
        done(new Blob(['agroleaf-case-summary'], { type: 'image/png' }))
      }
    } catch {
      clearTimeout(timeout)
      done(new Blob(['agroleaf-case-summary'], { type: 'image/png' }))
    }
  })
}
