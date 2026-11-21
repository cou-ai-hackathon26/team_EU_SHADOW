import type { ClassId } from '../../ai/classes'
import type { ConfidenceTier } from '../../ai/types'

const BANGLA_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
}

export function toBanglaDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (digit) => BANGLA_DIGITS[digit] ?? digit)
}

export function toBanglaPercent(value: number, decimals: number = 1): string {
  const percent = (value * 100).toFixed(decimals)
  return `${toBanglaDigits(percent)}%`
}

export const classLabelBn: Record<ClassId, string> = {
  healthy: 'সুস্থ',
  blast: 'ব্লাস্ট',
  brown_spot: 'বাদামি দাগ',
  leaf_smut: 'লিফ স্মাট',
  tungro: 'টুংরো',
  sheath_blight: 'খোল পোড়া (শীথ ব্লাইট)',
  not_rice: 'ধানপাতা নয়',
}

export function getClassLabelBn(classId: string): string {
  return classLabelBn[classId as ClassId] ?? classId
}

export const tierLabelBn: Record<ConfidenceTier, string> = {
  high: 'নিশ্চিত',
  medium: 'দুটি সম্ভাবনা',
  low: 'আমি নিশ্চিত নই',
  not_rice: 'ধানপাতা নয়',
}

export function getTierLabelBn(tier: ConfidenceTier): string {
  return tierLabelBn[tier] ?? tier
}
