import type { DiseaseCard } from './types'
import diseasesData from './diseases.json'

const cards: DiseaseCard[] = diseasesData as DiseaseCard[]

const cardMap = new Map<string, DiseaseCard>(cards.map((c) => [c.id, c]))

const notSureCard = cardMap.get('not_sure')!

/**
 * Returns the DiseaseCard matching the given class ID.
 * If the class ID is unknown or undefined, defaults to the 'not_sure' card.
 */
export function getCard(id: string): DiseaseCard {
  return cardMap.get(id) ?? notSureCard
}

export function getAllCards(): DiseaseCard[] {
  return cards
}
