/**
 * Shared class list. SINGLE SOURCE OF TRUTH for class ids on the web side.
 * Must match `classes` in public/model/model_meta.json produced by ml/ (Masum).
 * Changing this list is a contract change: open a PR and tag all three members.
 */
export const DISEASE_CLASS_IDS = [
  'healthy',
  'blast',
  'brown_spot',
  'leaf_smut',
  'tungro',
  'sheath_blight',
] as const

/** Optional 7th class (M3). Present only if model_meta.json lists it. */
export const NOT_RICE_CLASS_ID = 'not_rice' as const

export type DiseaseClassId = (typeof DISEASE_CLASS_IDS)[number]
export type ClassId = DiseaseClassId | typeof NOT_RICE_CLASS_ID
