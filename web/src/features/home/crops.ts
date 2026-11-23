import type { I18nKeys } from '../../i18n/bn'

export interface PhotoCredit {
  author: string
  licence: string
  url: string
}

export interface CropDef {
  id: 'rice' | 'potato' | 'brinjal' | 'tomato' | 'chili'
  labelKey: I18nKeys
  scientific: string
  /** Local photo under public/ (bundled, works offline). */
  photo: string
  credit: PhotoCredit
  active: boolean
}

/** Real photographs from Wikimedia Commons, resized to 300px WebP. Full list: public/crops/CREDITS.md */
export const CROPS: CropDef[] = [
  {
    id: 'rice', labelKey: 'cropRice', scientific: 'Oryza sativa', photo: 'crops/rice.webp', active: true,
    credit: { author: 'IRRI Images', licence: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Rice_Plants_(IRRI).jpg' },
  },
  {
    id: 'potato', labelKey: 'cropPotato', scientific: 'Solanum tuberosum', photo: 'crops/potato.webp', active: false,
    credit: { author: 'DenesFeri', licence: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Solanales_-_Solanum_tuberosum_-_3.jpg' },
  },
  {
    id: 'brinjal', labelKey: 'cropBrinjal', scientific: 'Solanum melongena', photo: 'crops/brinjal.webp', active: false,
    credit: { author: 'Fumikas Sagisavas', licence: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Round_eggplant_(1).jpg' },
  },
  {
    id: 'tomato', labelKey: 'cropTomato', scientific: 'Solanum lycopersicum', photo: 'crops/tomato.webp', active: false,
    credit: { author: 'Steffen Bauer (SaatPilot)', licence: 'CC BY 4.0', url: "https://commons.wikimedia.org/wiki/File:Solanum_lycopersicum_'Moneymaker'_(tomato),_fruit_(SaatPilot).jpg" },
  },
  {
    id: 'chili', labelKey: 'cropChili', scientific: 'Capsicum annuum', photo: 'crops/chili.webp', active: false,
    credit: { author: 'Sreeni.kaki', licence: 'Public domain', url: 'https://commons.wikimedia.org/wiki/File:Red_Chili_ppahad.JPG' },
  },
]

export const HERO_PHOTO = 'crops/rice-hero.webp'
