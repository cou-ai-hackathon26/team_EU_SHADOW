import type { Prediction } from '../../ai/types'
import type { DiseaseCard, Localized } from '../../content/types'
import { bn } from '../../i18n/bn'
import { en } from '../../i18n/en'

export interface RoadmapStep {
  id: string
  title: Localized
  intro?: Localized
  items?: Localized[]
  hasReScanButton?: boolean
  hasHistoryLink?: boolean
  hasCallButton?: boolean
}

export function buildRoadmap(
  prediction?: Prediction | null,
  card?: DiseaseCard | null
): RoadmapStep[] | null {
  if (!prediction) return null
  const { tier, top } = prediction
  const top1Class = top[0]?.classId

  // low, not_rice: Return null, render nothing
  if (tier === 'low' || tier === 'not_rice' || top1Class === 'not_rice') {
    return null
  }

  // medium:
  // One step first: “আগে ভালো আলোতে আরও স্পষ্ট ছবি তুলুন” with the re-scan button, then the 16123 step.
  // No disease-specific steps, because we are not sure which disease it is.
  if (tier === 'medium') {
    const step1: RoadmapStep = {
      id: 'rescan',
      title: {
        bn: bn.roadmapStepToday,
        en: en.roadmapStepToday,
      },
      intro: {
        bn: bn.roadmapMediumClearPhoto,
        en: en.roadmapMediumClearPhoto,
      },
      hasReScanButton: true,
    }

    const step2: RoadmapStep = {
      id: 'call_expert',
      title: {
        bn: bn.roadmapStepCallExpert,
        en: en.roadmapStepCallExpert,
      },
      intro: {
        bn: bn.roadmapMediumCallExpert,
        en: en.roadmapMediumCallExpert,
      },
      hasCallButton: true,
    }

    return [step1, step2]
  }

  // high tier
  if (tier === 'high' && card) {
    const isHealthy = card.id === 'healthy' || top1Class === 'healthy'

    // high, healthy:
    // Two steps only: “নিয়মিত (সপ্তাহে ১–২ বার) জমি দেখুন” + card.prevention (max 2), then the 16123 step.
    if (isHealthy) {
      const steps: RoadmapStep[] = []
      const preventionItems = card.prevention || []

      // Step 1: আজই with intro + first prevention item
      steps.push({
        id: 'today',
        title: {
          bn: bn.roadmapStepToday,
          en: en.roadmapStepToday,
        },
        intro: {
          bn: bn.roadmapTodayHealthyIntro,
          en: en.roadmapTodayHealthyIntro,
        },
        items: preventionItems.slice(0, 1),
      })

      // Step 2: এই সপ্তাহে with remaining prevention item (max 2 total for healthy)
      if (preventionItems.length > 1) {
        steps.push({
          id: 'this_week',
          title: {
            bn: bn.roadmapStepThisWeek,
            en: en.roadmapStepThisWeek,
          },
          items: preventionItems.slice(1, 2),
        })
      }

      // Step 3: then the 16123 step
      steps.push({
        id: 'call_expert',
        title: {
          bn: bn.roadmapStepCallExpert,
          en: en.roadmapStepCallExpert,
        },
        intro: card.whenToCallExpert,
        hasCallButton: true,
      })

      return steps
    }

    // high, disease:
    // If a card's prevention array is empty, skip steps 1–2 instead of showing empty boxes.
    const steps: RoadmapStep[] = []
    const preventionItems = card.prevention || []

    if (preventionItems.length > 0) {
      // ১. আজই: “আক্রান্ত পাতা ও আশেপাশের গাছ ভালো করে দেখুন” + card.prevention[0]
      steps.push({
        id: 'today',
        title: {
          bn: bn.roadmapStepToday,
          en: en.roadmapStepToday,
        },
        intro: {
          bn: bn.roadmapTodayDiseaseIntro,
          en: en.roadmapTodayDiseaseIntro,
        },
        items: preventionItems.slice(0, 1),
      })

      // ২. এই সপ্তাহে: the remaining card.prevention[1..] items (max 3)
      if (preventionItems.length > 1) {
        steps.push({
          id: 'this_week',
          title: {
            bn: bn.roadmapStepThisWeek,
            en: en.roadmapStepThisWeek,
          },
          items: preventionItems.slice(1, 4),
        })
      }
    }

    // ৩. ৭ দিন পর: “একই জমির পাতার আবার ছবি তুলে পরীক্ষা করুন, দাগ বাড়ছে কি না দেখুন”
    steps.push({
      id: 'seven_days',
      title: {
        bn: bn.roadmapStep7Days,
        en: en.roadmapStep7Days,
      },
      intro: {
        bn: bn.roadmap7DaysIntro,
        en: en.roadmap7DaysIntro,
      },
      hasReScanButton: true,
      hasHistoryLink: true,
    })

    // ৪. কখন কল করবেন: card.whenToCallExpert + tel:16123 link
    steps.push({
      id: 'call_expert',
      title: {
        bn: bn.roadmapStepCallExpert,
        en: en.roadmapStepCallExpert,
      },
      intro: card.whenToCallExpert,
      hasCallButton: true,
    })

    return steps
  }

  return null
}
