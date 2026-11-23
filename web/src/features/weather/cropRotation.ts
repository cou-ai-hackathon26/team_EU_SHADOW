import { DIVISIONS } from './divisions'
import type { WeatherSummary } from './diseaseRisk'

/**
 * Season- and weather-aware crop rotation advice after rice.
 * General guidance distilled from the Bangladesh crop calendar (Rabi / Kharif-1 / Kharif-2)
 * as published by DAE/BARI. It is NOT validated per field: the UI always tells the farmer
 * to confirm with the local Sub-Assistant Agriculture Officer or 16123.
 * No pesticide or fertiliser product names or doses appear here (AGENTS.md rule 5).
 */

export type Season = 'rabi' | 'kharif1' | 'kharif2'
export type RegionGroup = 'north' | 'central' | 'coastal' | 'haor_hill'
type Bi = { bn: string; en: string }

export interface RotationCrop {
  id: string
  name: Bi
  whyFits: Bi
  diseaseBreak: Bi
  /** Legumes add nitrogen back to the soil. */
  legume: boolean
}

export interface RotationAdvice {
  season: Season
  seasonName: Bi
  region: RegionGroup
  crops: RotationCrop[]
  /** Short notes driven by the live forecast (empty when there is no weather data). */
  weatherNotes: Bi[]
  usedWeather: boolean
}

export const SEASON_NAMES: Record<Season, Bi> = {
  rabi: { bn: 'রবি মৌসুম (কার্তিক–ফাল্গুন)', en: 'Rabi season (Nov–Feb)' },
  kharif1: { bn: 'খরিফ-১ মৌসুম (চৈত্র–জ্যৈষ্ঠ)', en: 'Kharif-1 season (Mar–Jun)' },
  kharif2: { bn: 'খরিফ-২ মৌসুম (আষাঢ়–আশ্বিন)', en: 'Kharif-2 season (Jul–Oct)' },
}

/** month: 1–12 (local calendar). */
export function seasonForMonth(month: number): Season {
  if (month >= 11 || month <= 2) return 'rabi'
  if (month >= 3 && month <= 6) return 'kharif1'
  return 'kharif2'
}

const REGION_OF_DIVISION: Record<string, RegionGroup> = {
  rajshahi: 'north',
  rangpur: 'north',
  dhaka: 'central',
  mymensingh: 'central',
  khulna: 'coastal',
  barishal: 'coastal',
  chattogram: 'coastal',
  sylhet: 'haor_hill',
}

export function regionForDivision(divisionId: string | null | undefined): RegionGroup {
  return (divisionId && REGION_OF_DIVISION[divisionId]) || 'central'
}

/** Nearest division headquarters to a GPS point (simple planar distance is enough inside Bangladesh). */
export function nearestDivisionId(lat: number, lon: number): string {
  let best = DIVISIONS[0]
  let bestD = Infinity
  for (const d of DIVISIONS) {
    const dist = (d.lat - lat) ** 2 + (d.lon - lon) ** 2
    if (dist < bestD) {
      bestD = dist
      best = d
    }
  }
  return best.id
}

const C: Record<string, RotationCrop> = {
  potato: {
    id: 'potato', legume: false,
    name: { bn: 'আলু', en: 'Potato' },
    whyFits: { bn: 'ঠান্ডা ও শুকনো রবি আবহাওয়ায় ভালো হয়; আমন কাটার পর জমি খালি থাকে।', en: 'Grows well in cool, dry Rabi weather on land left free after Aman harvest.' },
    diseaseBreak: { bn: 'ধান ছাড়া অন্য ফসল হওয়ায় ধানের রোগ ও পোকার জীবনচক্রে বিরতি দেয়।', en: 'A non-rice crop that gives rice diseases and pests a break.' },
  },
  mustard: {
    id: 'mustard', legume: false,
    name: { bn: 'সরিষা', en: 'Mustard' },
    whyFits: { bn: 'স্বল্প সেচে ও অল্প সময়ে (৮০–৯০ দিন) ফলে; আমন ও বোরোর মাঝের ফাঁকে উপযোগী।', en: 'Short crop (80–90 days) with little irrigation; fits the gap between Aman and Boro.' },
    diseaseBreak: { bn: 'ভিন্ন পরিবারের ফসল; ধানের রোগজীবাণু ও পোকা টানা খাবার পায় না।', en: 'A different plant family, so rice pathogens and pests lose their continuous food.' },
  },
  lentil: {
    id: 'lentil', legume: true,
    name: { bn: 'মসুর ডাল', en: 'Lentil' },
    whyFits: { bn: 'শীত ও কম আর্দ্রতা পছন্দ করে; অবশিষ্ট মাটির রসেই হয়।', en: 'Likes cool, low-humidity weather and grows on residual soil moisture.' },
    diseaseBreak: { bn: 'ডালজাতীয় ফসল মাটিতে নাইট্রোজেন যোগ করে ও ধানের রোগচক্র ভাঙে।', en: 'A legume: adds nitrogen to the soil and breaks the rice disease cycle.' },
  },
  wheat: {
    id: 'wheat', legume: false,
    name: { bn: 'গম', en: 'Wheat' },
    whyFits: { bn: 'উত্তরাঞ্চলের লম্বা ও ঠান্ডা শীতে ভালো ফলন দেয়।', en: 'Yields well in the longer, colder winter of the north.' },
    diseaseBreak: { bn: 'পানি জমে না থাকায় ধানক্ষেতের রোগজীবাণু টিকে থাকার সুযোগ কম পায়।', en: 'No standing water, so rice-field pathogens have less chance to survive.' },
  },
  maize: {
    id: 'maize', legume: false,
    name: { bn: 'ভুট্টা', en: 'Maize' },
    whyFits: { bn: 'উঁচু, পানি না জমা জমিতে রবি ও খরিফ-১ দুই মৌসুমেই হয়।', en: 'Grows in Rabi and Kharif-1 on higher land that does not flood.' },
    diseaseBreak: { bn: 'শুকনো জমির ফসল; পানি জমা ধানক্ষেতের রোগজীবাণুর চক্রে বিরতি দেয়।', en: 'A dry-land crop that interrupts the cycle of flooded-rice pathogens.' },
  },
  mung: {
    id: 'mung', legume: true,
    name: { bn: 'মুগ ডাল', en: 'Mung bean' },
    whyFits: { bn: 'গরম আবহাওয়ায় ৬০–৬৫ দিনে ফলে; বোরো কাটার পর আমনের আগে লাগানো যায়।', en: 'Matures in 60–65 days in warm weather; fits after Boro and before Aman.' },
    diseaseBreak: { bn: 'মাটিতে নাইট্রোজেন বাড়ায় ও ধানের রোগচক্রে বিরতি দেয়।', en: 'Adds soil nitrogen and gives the rice disease cycle a break.' },
  },
  sesame: {
    id: 'sesame', legume: false,
    name: { bn: 'তিল', en: 'Sesame' },
    whyFits: { bn: 'গরম ও কম বৃষ্টিতে টিকে থাকে; বেলে-দোআঁশ মাটিতে ভালো।', en: 'Tolerates heat and low rain; suits sandy-loam soil.' },
    diseaseBreak: { bn: 'ধানের রোগের কোনো আশ্রয় নয়, তাই পরের ধানে রোগ কম আসে।', en: 'Hosts no rice disease, so the next rice crop starts cleaner.' },
  },
  jute: {
    id: 'jute', legume: false,
    name: { bn: 'পাট', en: 'Jute' },
    whyFits: { bn: 'খরিফ-১ এর গরম ও আর্দ্র আবহাওয়ায় ভালো জন্মে।', en: 'Thrives in warm, humid Kharif-1 weather.' },
    diseaseBreak: { bn: 'পাতা ঝরে মাটিতে জৈব পদার্থ বাড়ায়; ধানের রোগচক্র ভাঙে।', en: 'Leaf drop adds organic matter; breaks the rice disease cycle.' },
  },
  vegetables: {
    id: 'vegetables', legume: false,
    name: { bn: 'শাকসবজি (লালশাক, লাউ, ঢেঁড়স)', en: 'Vegetables (red amaranth, gourd, okra)' },
    whyFits: { bn: 'অল্প জায়গায় ও অল্প সময়ে আয়; উঁচু বেডে বর্ষাতেও করা যায়।', en: 'Quick income from small plots; raised beds work even in the rains.' },
    diseaseBreak: { bn: 'ভিন্ন পরিবারের ফসল হওয়ায় ধানের রোগ ও পোকা বাড়তে পারে না।', en: 'A different plant family, so rice pests and diseases cannot build up.' },
  },
  bean: {
    id: 'bean', legume: true,
    name: { bn: 'শিম', en: 'Hyacinth bean' },
    whyFits: { bn: 'আশ্বিন–কার্তিকে মাচায় লাগালে শীতে ফলন দেয়।', en: 'Planted on trellises in Sep–Oct, it yields through winter.' },
    diseaseBreak: { bn: 'ডালজাতীয় ফসল, মাটিতে নাইট্রোজেন যোগ করে।', en: 'A legume that adds nitrogen to the soil.' },
  },
  sunflower: {
    id: 'sunflower', legume: false,
    name: { bn: 'সূর্যমুখী', en: 'Sunflower' },
    whyFits: { bn: 'উপকূলের হালকা লবণাক্ত মাটিতেও রবি মৌসুমে হয়।', en: 'Grows in Rabi even on mildly saline coastal soil.' },
    diseaseBreak: { bn: 'গভীর শিকড় মাটির গঠন ভালো করে; ধানের রোগের আশ্রয় নয়।', en: 'Deep roots improve soil structure; hosts no rice disease.' },
  },
}

const BY_SEASON_REGION: Record<Season, Record<RegionGroup, string[]>> = {
  rabi: {
    north: ['wheat', 'potato', 'maize', 'lentil'],
    central: ['potato', 'mustard', 'lentil', 'vegetables'],
    coastal: ['sunflower', 'mung', 'mustard', 'vegetables'],
    haor_hill: ['mustard', 'potato', 'vegetables'],
  },
  kharif1: {
    north: ['maize', 'mung', 'sesame', 'jute'],
    central: ['jute', 'mung', 'sesame', 'vegetables'],
    coastal: ['mung', 'sesame', 'vegetables'],
    haor_hill: ['vegetables', 'mung', 'maize'],
  },
  kharif2: {
    north: ['vegetables', 'bean', 'mustard'],
    central: ['vegetables', 'bean', 'mustard'],
    coastal: ['vegetables', 'bean', 'mung'],
    haor_hill: ['vegetables', 'bean'],
  },
}

const POST_KHARIF2_NOTE: Bi = {
  bn: 'এখন জমিতে আমন ধান থাকে; উঁচু বেডে সবজি করুন এবং আমন কাটার পর রবিতে ডাল বা সরিষার পরিকল্পনা করুন।',
  en: 'Aman rice usually occupies the field now; grow vegetables on raised beds and plan pulses or mustard for Rabi after harvest.',
}

/**
 * @param month 1–12
 * @param divisionId one of DIVISIONS ids (null → central fallback)
 * @param summary next-3-day forecast summary, or null when offline / unavailable
 */
export function recommendRotation(
  month: number,
  divisionId: string | null | undefined,
  summary: WeatherSummary | null,
): RotationAdvice {
  const season = seasonForMonth(month)
  const region = regionForDivision(divisionId)
  let ids = [...BY_SEASON_REGION[season][region]]
  const notes: Bi[] = []

  if (season === 'kharif2') notes.push(POST_KHARIF2_NOTE)

  if (summary) {
    const wet = summary.totalRainMm >= 20 || summary.rainyHours >= 12
    const hot = summary.maxTemp >= 32
    const mildWinter = season === 'rabi' && summary.maxTemp >= 30

    if (wet) {
      // Waterlogging hurts potato, sesame and lentil; favour crops on raised beds or that tolerate wet soil.
      ids = [...ids.filter((id) => !['potato', 'sesame', 'lentil'].includes(id)), ...ids.filter((id) => ['potato', 'sesame', 'lentil'].includes(id))]
      notes.push({
        bn: 'আগামী কয়েক দিন বৃষ্টি বেশি — জমি থেকে পানি সরে গেলে ও মাটিতে "জো" এলে বপন করুন; উঁচু বেড ব্যবহার করুন।',
        en: 'Rain is heavy in the next few days — sow once the field drains and the soil is workable; use raised beds.',
      })
    }
    if (mildWinter) {
      ids = [...ids.filter((id) => id !== 'potato' && id !== 'wheat'), ...ids.filter((id) => id === 'potato' || id === 'wheat')]
      notes.push({
        bn: 'এখন দিনের তাপমাত্রা বেশি; আলু বা গম একটু পরে, ঠান্ডা পড়লে লাগানো ভালো।',
        en: 'Days are still warm; potato or wheat do better when it gets cooler.',
      })
    }
    if (hot && season !== 'rabi' && !wet) {
      notes.push({
        bn: 'গরম ও শুকনো আবহাওয়া — মুগ ডাল ও তিল কম পানিতে ভালো হয়।',
        en: 'Hot and dry — mung bean and sesame need little water.',
      })
    }
  }

  return {
    season,
    seasonName: SEASON_NAMES[season],
    region,
    crops: ids.map((id) => C[id]).slice(0, 4),
    weatherNotes: notes,
    usedWeather: Boolean(summary),
  }
}
