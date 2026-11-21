import type { ClassId } from '../ai/classes'

/**
 * CONTRACT for Bangla disease cards. Owner: Mehedi (H1).
 * File: src/content/diseases.json  — one card per class id, plus "not_sure".
 * Safety rule (tested): no pesticide / chemical product names and no doses anywhere.
 */
export interface Source {
  title: string
  url: string
  publisher: 'BRRI' | 'DAE' | 'IRRI' | 'BARI' | 'other'
}

export interface Localized {
  bn: string
  en: string
}

export interface DiseaseCard {
  id: ClassId | 'not_sure'
  name: Localized
  summary: Localized              // one-line plain-language explanation
  symptoms: Localized[]           // what the farmer sees
  causes: Localized[]             // conditions that favour it
  prevention: Localized[]         // cultural / general practices only
  whenToCallExpert: Localized     // when to call 16123 / agriculture officer
  severity: 'none' | 'watch' | 'act'  // colour of the card; "healthy" => none
  sources: Source[]               // at least one
}
