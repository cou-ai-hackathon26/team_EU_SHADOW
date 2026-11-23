import type { Prediction } from '../../ai/types'
import type { DiseaseCard, Localized } from '../../content/types'

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
  _prediction?: Prediction | null,
  _card?: DiseaseCard | null
): RoadmapStep[] | null {
  return null
}
