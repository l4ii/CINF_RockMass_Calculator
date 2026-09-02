/**
 * 岩体分级「案例 — 点位」数据模型。
 *
 * 一个案例代表一项工程；案例内可包含任意多个计算点位（钻孔、断面、桩号等）。
 * 点位只持久化输入参数，分级结果在读取时用当前评分表重算，
 * 避免评分表修订后历史案例出现输入与结论自相矛盾。
 */

import type { ClassificationMethodId } from '../types'
import type { BqFormState } from '../methods/bq'
import type { GsiFormState } from '../methods/gsi'
import type { MrmrFormState } from '../methods/mrmr'
import type { QFormState } from '../methods/q'
import type { RqdFormState } from '../methods/rqd'
import type { RmrFormState } from '../utils/rmrCalc'

/**
 * Compile-time input mapping for callers that know the method id.  The
 * persisted record remains tolerant of legacy drafts, while v2 file imports
 * are checked against these method-specific shapes at runtime.
 */
export interface RockMassInputByMethod {
  rqd: RqdFormState
  bq: BqFormState
  q: QFormState
  rmr: RmrFormState
  mrmr: MrmrFormState
  gsi: GsiFormState
}

export interface RockMassPointRecord<Method extends ClassificationMethodId = ClassificationMethodId> {
  id: string
  /** 点位名称，如「K12+350 拱顶」 */
  name: string
  /** 桩号、钻孔号等补充说明 */
  note?: string
  /** 岩矿类型组，计算页标签为「岩矿类型」，项目内可复用 */
  oreType?: string
  groupId?: string
  createdAt: string
  updatedAt: string
  methodId: Method
  /** 固定计算口径，避免评分表升级后历史案例被静默重算。 */
  standardId?: string
  inputVersion?: number
  /** 新版算法统一输入。旧 RMR 案例仍通过 rmr 字段兼容读取。 */
  input?: Record<string, unknown>
  migration?: {
    fromVersion: number
    needsReview: boolean
  }
  /** v1 RMR 六项输入，迁移完成前保留。 */
  rmr?: RmrFormState
}

/** Method-discriminated view for adapters and future storage migrations. */
export type RockMassPointRecordByMethod = {
  [Method in ClassificationMethodId]: Omit<RockMassPointRecord<Method>, 'input'> & {
    input?: RockMassInputByMethod[Method]
  }
}[ClassificationMethodId]

export interface RockMassCaseRecord {
  id: string
  /** 项目名称（工作区名称） */
  name: string
  methodId: ClassificationMethodId
  schemaVersion?: 2
  standardId?: string
  /** 工程名称 */
  engineering?: string
  /** 工程部位 */
  location?: string
  remark?: string
  createdAt: string
  updatedAt: string
  points: RockMassPointRecord[]
}

/** 案例文件（.rmcal）的包装格式 */
export const ROCKMASS_CASE_FILE_TYPE = 'cinf-rockmass-case'
export const ROCKMASS_CASE_FILE_VERSION = 2
export const ROCKMASS_CASE_FILE_EXT = '.rmcal'

export interface RockMassCaseFilePayload {
  type: typeof ROCKMASS_CASE_FILE_TYPE
  version: typeof ROCKMASS_CASE_FILE_VERSION
  exportedAt: string
  case: RockMassCaseRecord
}
