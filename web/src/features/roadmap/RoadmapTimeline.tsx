import type { Prediction } from '../../ai/types'
import type { DiseaseCard } from '../../content/types'
import type { RoadmapStep } from './buildRoadmap'

export interface RoadmapTimelineProps {
  prediction?: Prediction | null
  card?: DiseaseCard | null
  steps?: RoadmapStep[] | null
  lang?: 'bn' | 'en'
  onReset?: () => void
  className?: string
}

export function RoadmapTimeline(_props: RoadmapTimelineProps) {
  return null
}
