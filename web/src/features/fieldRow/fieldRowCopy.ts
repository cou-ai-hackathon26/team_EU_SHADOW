import type { AbstentionReason, LeafStatus } from '../../ai/fieldRow.types'
import { toBanglaDigits } from '../about/format'

type Lang = 'bn' | 'en'
type Pair = { bn: string; en: string }

export const FIELD_ROW_COPY = {
  title: { bn: 'মাঠের সারি স্ক্যান', en: 'Field-row screening' },
  hint: { bn: 'ধানক্ষেতের একটি সারির পুরো ছবি তুলুন — ছবির প্রতিটি পাতা আলাদাভাবে পরীক্ষা করা হবে।', en: 'Take one photo of a whole field row. Every leaf in it is screened separately.' },
  summaryTitle: { bn: 'মাঠের সারাংশ', en: 'Field summary' },
} satisfies Record<string, Pair>

export const STATUS_COPY: Record<LeafStatus, Pair> = {
  healthy: { bn: 'সুস্থ', en: 'Healthy' },
  diseased: { bn: 'রোগাক্রান্ত', en: 'Diseased' },
  uncertain: { bn: 'অনিশ্চিত', en: 'Uncertain' },
  abstained: { bn: 'বাদ দেওয়া হয়েছে', en: 'Skipped' },
}

export const ABSTAIN_COPY: Record<AbstentionReason, { title: Pair; desc: Pair }> = {
  not_rice: {
    title: { bn: 'এটি ধানপাতা মনে হচ্ছে না', en: 'This does not look like a rice leaf' },
    desc: { bn: 'অনুগ্রহ করে শুধু ধানক্ষেতের পাতার স্পষ্ট ছবি দিন।', en: 'Please upload a clear photo of rice leaves only.' },
  },
  dead_leaf: {
    title: { bn: 'পাতাটি শুকনো বা মৃত মনে হচ্ছে', en: 'This leaf looks dry or dead' },
    desc: { bn: 'শুকনো পাতায় রোগ নির্ণয় নির্ভরযোগ্য নয়। সবুজ, জীবিত পাতার ছবি দিন।', en: 'Screening a dry leaf is not reliable. Please photograph a green, living leaf.' },
  },
  unrelated_crop: {
    title: { bn: 'এটি অন্য ফসল মনে হচ্ছে', en: 'This looks like a different crop' },
    desc: { bn: 'AgroLeaf AI এখন শুধু ধানপাতা পরীক্ষা করে। ধানপাতার ছবি দিন।', en: 'AgroLeaf AI currently screens rice leaves only.' },
  },
}

/** "পাতা ৩/৮ বিশ্লেষণ হচ্ছে…" */
export function progressText(done: number, total: number, lang: Lang): string {
  return lang === 'bn'
    ? `পাতা ${toBanglaDigits(done)}/${toBanglaDigits(total)} বিশ্লেষণ হচ্ছে…`
    : `Analyzing leaf ${done}/${total}…`
}
