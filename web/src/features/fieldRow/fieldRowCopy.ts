import type { AbstentionReason, FieldSummary, LeafStatus } from '../../ai/fieldRow.types'
import { toBanglaDigits } from '../about/format'

type Lang = 'bn' | 'en'
type Pair = { bn: string; en: string }

export const FIELD_ROW_COPY = {
  title: { bn: 'মাঠের সারি স্ক্যান', en: 'Field-row screening' },
  hint: {
    bn: 'ধানক্ষেতের সামনের সারির পাতার স্পষ্ট ছবি তুলুন — সামনের পাতাগুলো আলাদাভাবে পরীক্ষা করা হবে এবং আকাশ ও পেছনের অংশ বাদ দেওয়া হবে।',
    en: 'Photograph leaves in the front row — foreground leaves are screened separately; sky and background are skipped.',
  },
  summaryTitle: { bn: 'মাঠের সারাংশ', en: 'Field summary' },
  detecting: { bn: 'ছবিতে পাতা খোঁজা হচ্ছে…', en: 'Searching for leaves in photo…' },
  cancel: { bn: 'বাতিল', en: 'Cancel' },
  retry: { bn: 'আবার চেষ্টা করুন', en: 'Try again' },
  totalLeaves: { bn: 'মোট পাতা', en: 'Total leaves' },
  screened: { bn: 'পরীক্ষিত পাতা', en: 'Screened leaves' },
  healthyCount: { bn: 'সুস্থ পাতা', en: 'Healthy leaves' },
  diseasedCount: { bn: 'রোগাক্রান্ত পাতা', en: 'Diseased leaves' },
  uncertainCount: { bn: 'অনিশ্চিত', en: 'Uncertain' },
  skippedCount: { bn: 'বাদ দেওয়া হয়েছে', en: 'Skipped' },
  highestRisk: { bn: 'সর্বোচ্চ ঝুঁকিপূর্ণ রোগ', en: 'Highest-risk disease' },
  maxConfidence: { bn: 'সর্বোচ্চ আস্থা', en: 'Maximum confidence' },
  noLeafFound: {
    bn: 'ছবিতে কোনো পাতা শনাক্ত করা যায়নি',
    en: 'No recognizable leaves found in the photo',
  },
  gridFallbackNote: {
    bn: 'পাতা আলাদা করা যায়নি, ছবিটি ভাগ করে পরীক্ষা করা হয়েছে',
    en: 'Individual leaves could not be isolated; the photo was screened in grid sections.',
  },
  fieldDisclaimer: {
    bn: 'এটি মাঠপর্যায়ের প্রাথমিক পর্যবেক্ষণ, কোনো চিকিৎসাপত্র নয়। জরুরি তথ্যের জন্য ১৬১২৩ নম্বরে যোগাযোগ করুন।',
    en: 'This is a preliminary field observation, not a prescription. For guidance call 16123.',
  },
  'canvas.showOthers': {
    bn: 'অন্য অংশ দেখান ({n})',
    en: 'Show other areas ({n})',
  },
  'canvas.hideOthers': {
    bn: 'অন্য অংশ লুকান',
    en: 'Hide other areas',
  },
} satisfies Record<string, Pair>

export const CANVAS_COPY = {
  showOthers: FIELD_ROW_COPY['canvas.showOthers'],
  hideOthers: FIELD_ROW_COPY['canvas.hideOthers'],
}

export const STATUS_COPY: Record<LeafStatus, Pair> = {
  healthy: { bn: 'সুস্থ', en: 'Healthy' },
  diseased: { bn: 'রোগাক্রান্ত', en: 'Diseased' },
  uncertain: { bn: 'অনিশ্চিত', en: 'Uncertain' },
  abstained: { bn: 'বাদ দেওয়া হয়েছে', en: 'Skipped' },
}

export const ABSTAIN_COPY: Record<
  AbstentionReason,
  { title: Pair; desc: Pair; tip: Pair }
> = {
  not_rice: {
    title: { bn: 'এটি ধানপাতা মনে হচ্ছে না', en: 'This does not look like a rice leaf' },
    desc: {
      bn: 'অনুগ্রহ করে শুধু ধানক্ষেতের পাতার স্পষ্ট ছবি দিন।',
      en: 'Please upload a clear photo of rice leaves only.',
    },
    tip: {
      bn: 'ক্যামেরাটি ধানগাছের কাছাকাছি ধরুন এবং শুধুমাত্র ধানপাতার স্পষ্ট ছবি তুলুন।',
      en: 'Hold the camera closer and frame only rice leaves clearly.',
    },
  },
  dead_leaf: {
    title: { bn: 'পাতাটি শুকনো বা মৃত মনে হচ্ছে', en: 'This leaf looks dry or dead' },
    desc: {
      bn: 'শুকনো পাতায় রোগ নির্ণয় নির্ভরযোগ্য নয়। সবুজ, জীবিত পাতার ছবি দিন।',
      en: 'Screening a dry leaf is not reliable. Please photograph a green, living leaf.',
    },
    tip: {
      bn: 'শুকনো বাদামি পাতার বদলে ধানগাছের সবুজ, তাজা পাতার ছবি তুলুন।',
      en: 'Photograph green, living foliage rather than dry straw or dead leaves.',
    },
  },
  unrelated_crop: {
    title: { bn: 'এটি অন্য ফসল মনে হচ্ছে', en: 'This looks like a different crop' },
    desc: {
      bn: 'AgroLeaf AI এখন শুধু ধানপাতা পরীক্ষা করে। ধানপাতার ছবি দিন।',
      en: 'AgroLeaf AI currently screens rice leaves only.',
    },
    tip: {
      bn: 'অন্যান্য ফসল বা ঘাস এড়িয়ে শুধুমাত্র ধানগাছের পাতা ক্যামেরায় রাখুন।',
      en: 'Avoid surrounding weeds or other crops and frame only rice leaves.',
    },
  },
}

/** "পাতা ৩/৮ বিশ্লেষণ হচ্ছে…" */
export function progressText(done: number, total: number, lang: Lang): string {
  return lang === 'bn'
    ? `পাতা ${toBanglaDigits(done)}/${toBanglaDigits(total)} বিশ্লেষণ হচ্ছে…`
    : `Analyzing leaf ${done}/${total}…`
}

/**
 * Returns a human-readable one-line summary.
 * e.g., "৮টি পাতার মধ্যে ৫টি সুস্থ, ২টি রোগাক্রান্ত, ১টি বাদ"
 */
export function summaryLine(summary: FieldSummary, lang: Lang): string {
  if (summary.fieldAbstain) {
    const reasonText = ABSTAIN_COPY[summary.fieldAbstain]
    return lang === 'bn'
      ? `${reasonText.title.bn} — কোনো ধানপাতার রোগ নির্ণয় করা হয়নি`
      : `${reasonText.title.en} — no rice disease diagnosed`
  }

  if (lang === 'bn') {
    const parts: string[] = []
    if (summary.healthy > 0) {
      parts.push(`${toBanglaDigits(summary.healthy)}টি সুস্থ`)
    }
    if (summary.diseased > 0) {
      parts.push(`${toBanglaDigits(summary.diseased)}টি রোগাক্রান্ত`)
    }
    if (summary.uncertain > 0) {
      parts.push(`${toBanglaDigits(summary.uncertain)}টি অনিশ্চিত`)
    }
    if (summary.abstained > 0) {
      parts.push(`${toBanglaDigits(summary.abstained)}টি বাদ`)
    }

    if (summary.totalRegions === 0) {
      return 'কোনো পাতা পাওয়া যায়নি'
    }

    const detail = parts.length > 0 ? parts.join(', ') : 'কোনো তথ্য নেই'
    return `${toBanglaDigits(summary.totalRegions)}টি পাতার মধ্যে ${detail}`
  }

  const parts: string[] = []
  if (summary.healthy > 0) parts.push(`${summary.healthy} healthy`)
  if (summary.diseased > 0) parts.push(`${summary.diseased} diseased`)
  if (summary.uncertain > 0) parts.push(`${summary.uncertain} uncertain`)
  if (summary.abstained > 0) parts.push(`${summary.abstained} skipped`)

  if (summary.totalRegions === 0) {
    return 'No leaves found'
  }

  const detail = parts.length > 0 ? parts.join(', ') : 'no data'
  return `${summary.totalRegions} leaves: ${detail}`
}
