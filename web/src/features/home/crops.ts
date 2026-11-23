import type { I18nKeys } from '../../i18n/bn'

export interface CropDef {
  id: 'rice' | 'potato' | 'brinjal' | 'tomato' | 'chili'
  labelKey: I18nKeys
  scientific: string
  emoji: string
  active: boolean
}

export const CROPS: CropDef[] = [
  { id: 'rice', labelKey: 'cropRice', scientific: 'Oryza sativa', emoji: '🌾', active: true },
  { id: 'potato', labelKey: 'cropPotato', scientific: 'Solanum tuberosum', emoji: '🥔', active: false },
  { id: 'brinjal', labelKey: 'cropBrinjal', scientific: 'Solanum melongena', emoji: '🍆', active: false },
  { id: 'tomato', labelKey: 'cropTomato', scientific: 'Solanum lycopersicum', emoji: '🍅', active: false },
  { id: 'chili', labelKey: 'cropChili', scientific: 'Capsicum annuum', emoji: '🌶️', active: false },
]
