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

/* ── Language-aware helpers (বাং ↔ EN) ─────────────────────────────────── */
export type UiLang = 'bn' | 'en'

export function num(n: number | string, lang: UiLang): string {
  return lang === 'bn' ? toBanglaDigits(n) : String(n)
}

export function pct(value: number, lang: UiLang, decimals: number = 1): string {
  const percent = (value * 100).toFixed(decimals)
  return `${num(percent, lang)}%`
}

export const classLabelEn: Record<ClassId, string> = {
  healthy: 'Healthy',
  blast: 'Blast',
  brown_spot: 'Brown spot',
  leaf_smut: 'Leaf smut',
  tungro: 'Tungro',
  sheath_blight: 'Sheath blight',
  not_rice: 'Not a rice leaf',
}

export function classLabel(classId: string, lang: UiLang): string {
  return (lang === 'bn' ? classLabelBn : classLabelEn)[classId as ClassId] ?? classId
}

export const tierLabelEn: Record<ConfidenceTier, string> = {
  high: 'Confident',
  medium: 'Two possibilities',
  low: "I'm not sure",
  not_rice: 'Not a rice leaf',
}

export function tierLabel(tier: ConfidenceTier, lang: UiLang): string {
  return (lang === 'bn' ? tierLabelBn : tierLabelEn)[tier] ?? tier
}
