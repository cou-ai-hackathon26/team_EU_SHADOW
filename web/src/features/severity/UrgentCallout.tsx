import type { ConfidenceTier } from '../../ai/types'
import type { DiseaseCard } from '../../content/types'
import type { SeverityEstimate } from './estimateSpread'

export interface UrgentCalloutProps {
  tier?: ConfidenceTier
  card?: DiseaseCard | null
  severity?: SeverityEstimate | null
  className?: string
}

export function UrgentCallout(_props: UrgentCalloutProps) {
  return null
}
