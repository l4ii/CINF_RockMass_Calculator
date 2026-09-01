/** 岩体质量与分级方法 ID */
export type ClassificationMethodId = 'rqd' | 'bq' | 'q' | 'rmr' | 'mrmr' | 'gsi'

/** 侧栏选中的分级方法 */
export interface SelectedMethod {
  id: ClassificationMethodId
  name: string
  nameEn: string
  category: 'classification' | 'risk'
}

export const CLASSIFICATION_METHODS: SelectedMethod[] = [
  { id: 'rqd', name: 'RQD分级', nameEn: 'RQD Classification', category: 'classification' },
  { id: 'bq', name: 'BQ分级', nameEn: 'BQ Classification', category: 'classification' },
  { id: 'q', name: 'Q分级', nameEn: 'Q Classification', category: 'classification' },
  { id: 'rmr', name: 'RMR分级', nameEn: 'RMR Classification', category: 'classification' },
  { id: 'mrmr', name: 'MRMR分级', nameEn: 'MRMR Classification', category: 'classification' },
  { id: 'gsi', name: 'GSI分级', nameEn: 'GSI Classification', category: 'classification' },
]

export function getClassificationMethod(id: ClassificationMethodId): SelectedMethod {
  const found = CLASSIFICATION_METHODS.find((m) => m.id === id)
  if (!found) throw new Error(`Unknown classification method: ${id}`)
  return found
}
