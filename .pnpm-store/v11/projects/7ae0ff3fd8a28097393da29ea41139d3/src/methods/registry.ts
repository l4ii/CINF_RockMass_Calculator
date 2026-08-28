import BqMethodForm from '../components/classification/forms/BqMethodForm'
import QMethodForm from '../components/classification/forms/QMethodForm'
import RqdMethodForm from '../components/classification/forms/RqdMethodForm'
import { bqAdapter } from './adapters/bqAdapter'
import { qAdapter } from './adapters/qAdapter'
import { rqdAdapter } from './adapters/rqdAdapter'
import type { ClassificationMethodId } from '../types'

export const CLASSIFICATION_MODULE_REGISTRY = {
  rqd: { adapter: rqdAdapter, FormComponent: RqdMethodForm },
  bq: { adapter: bqAdapter, FormComponent: BqMethodForm },
  q: { adapter: qAdapter, FormComponent: QMethodForm },
} satisfies Partial<Record<ClassificationMethodId, { adapter: typeof bqAdapter; FormComponent: typeof BqMethodForm }>>

export type GenericClassificationMethodId = keyof typeof CLASSIFICATION_MODULE_REGISTRY

export function isGenericClassificationMethod(id: ClassificationMethodId): id is GenericClassificationMethodId {
  return id in CLASSIFICATION_MODULE_REGISTRY
}
