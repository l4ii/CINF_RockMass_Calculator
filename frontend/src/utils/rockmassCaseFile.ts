/**
 * 案例文件（.rmcal）读写。v2 使用严格的、按算法区分的数据契约；
 * 无包装文件和 v1 包装仅保留给旧 RMR 案例迁移。
 */

import {
  A1_POINT_LOAD,
  A1_UCS,
  A2_RQD,
  A3_SPACING,
  A4_APERTURE,
  A4_INFILL,
  A4_PERSISTENCE,
  A4_ROUGHNESS,
  A4_SIMPLE,
  A4_WEATHERING,
  A5_BY_CRITERION,
  A5_CRITERIA,
  DIP_BANDS,
  FAVORABILITY_OPTIONS,
  PROJECT_TYPES,
  RMR89_STANDARD,
  STRIKE_RELATIONS,
  type ScoreOption,
} from '../config/rmrTables'
import { bqAdapter } from '../methods/adapters/bqAdapter'
import { mrmrAdapter } from '../methods/adapters/mrmrAdapter'
import { qAdapter } from '../methods/adapters/qAdapter'
import { rqdAdapter } from '../methods/adapters/rqdAdapter'
import type { AnyClassificationAdapter } from '../methods/types'
import type { ClassificationMethodId } from '../types'
import {
  ROCKMASS_CASE_FILE_EXT,
  ROCKMASS_CASE_FILE_TYPE,
  ROCKMASS_CASE_FILE_VERSION,
  type RockMassCaseFilePayload,
  type RockMassCaseRecord,
  type RockMassPointRecord,
} from '../types/rockmassCase'
import { createCaseId, createPointId } from './rockmassCaseStore'
import { initialRmrFormState, type RmrFormState } from './rmrCalc'
import { saveFile, type SaveFileResult } from './saveFile'

export { ROCKMASS_CASE_FILE_EXT }

const RMR_STANDARD_ID = RMR89_STANDARD.storageId
const LEGACY_MISSPELLED_RMR_STANDARD_ID = 'bienawski-rmr89'

const GENERIC_ADAPTERS = {
  rqd: rqdAdapter,
  bq: bqAdapter,
  q: qAdapter,
  mrmr: mrmrAdapter,
} satisfies Partial<Record<ClassificationMethodId, AnyClassificationAdapter>>

type GenericMethodId = keyof typeof GENERIC_ADAPTERS

interface MethodFileContract {
  standardId: string
  standardAliases?: readonly string[]
  inputVersion: number
  adapter?: AnyClassificationAdapter
}

const METHOD_FILE_CONTRACTS: Record<ClassificationMethodId, MethodFileContract> = {
  rqd: { standardId: rqdAdapter.standard.id, inputVersion: rqdAdapter.inputVersion, adapter: rqdAdapter },
  bq: { standardId: bqAdapter.standard.id, inputVersion: bqAdapter.inputVersion, adapter: bqAdapter },
  q: { standardId: qAdapter.standard.id, inputVersion: qAdapter.inputVersion, adapter: qAdapter },
  rmr: {
    standardId: RMR_STANDARD_ID,
    standardAliases: [LEGACY_MISSPELLED_RMR_STANDARD_ID],
    inputVersion: 1,
  },
  mrmr: { standardId: mrmrAdapter.standard.id, inputVersion: mrmrAdapter.inputVersion, adapter: mrmrAdapter },
}

type ImportInspection =
  | { ok: true; candidate: Record<string, unknown>; methodId: ClassificationMethodId; legacyVersion: 1 | null }
  | { ok: false; error: string }

export function sanitizeFileNamePart(value: string, fallback = '岩体分级案例') {
  const cleaned = value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
  return cleaned || fallback
}

export function buildCaseFileName(record: RockMassCaseRecord) {
  return `${sanitizeFileNamePart(record.name)}${ROCKMASS_CASE_FILE_EXT}`
}

export function isCaseFileName(fileName: string) {
  return fileName.trim().toLowerCase().endsWith(ROCKMASS_CASE_FILE_EXT)
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function isMethodId(value: unknown): value is ClassificationMethodId {
  return value === 'rqd' || value === 'bq' || value === 'q' || value === 'rmr' || value === 'mrmr'
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string'
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value)
  return actual.length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
}

function isCanonicalAdapterInput(value: unknown, adapter: AnyClassificationAdapter) {
  if (!isPlainRecord(value)) return false
  try {
    // BQ v2 files created before the optional correction workflow was added
    // do not contain correctionStep. Treat that one field as an omitted
    // default while continuing to reject every other unknown or malformed key.
    const canonicalCandidate = adapter.id === 'bq' && !Object.prototype.hasOwnProperty.call(value, 'correctionStep')
      ? { ...value, correctionStep: 0 }
      : value
    const normalized = adapter.normalize(canonicalCandidate)
    const keys = Object.keys(normalized)
    return (
      hasExactKeys(canonicalCandidate, keys) &&
      keys.every((key) => {
        const actual = canonicalCandidate[key]
        const expected = normalized[key]
        return (actual == null || typeof actual !== 'object') && Object.is(actual, expected)
      })
    )
  } catch {
    return false
  }
}

function isKnownOptionId(value: unknown, options: readonly ScoreOption[]) {
  return value === null || (typeof value === 'string' && options.some((option) => option.id === value))
}

function isKnownNullableId(value: unknown, options: readonly { id: string }[]) {
  return value === null || (typeof value === 'string' && options.some((option) => option.id === value))
}

function isRmrInputState(value: unknown): value is RmrFormState {
  if (!isPlainRecord(value)) return false
  const keys = Object.keys(initialRmrFormState())
  // 新增的数值输入字段对旧文件是可选的；未知字段仍拒绝，避免静默接受损坏数据。
  if (Object.keys(value).some((key) => !keys.includes(key))) return false
  const initial = initialRmrFormState() as unknown as Record<string, unknown>
  const normalized = { ...initial, ...value }
  if (normalized.a1Mode !== null && normalized.a1Mode !== 'point_load' && normalized.a1Mode !== 'ucs') return false
  if (!isKnownOptionId(normalized.a1OptionId, [...A1_POINT_LOAD, ...A1_UCS])) return false
  if (!isKnownOptionId(normalized.a2OptionId, A2_RQD) || !isKnownOptionId(normalized.a3OptionId, A3_SPACING)) return false
  if (typeof normalized.a4Detailed !== 'boolean' || !isKnownOptionId(normalized.a4SimpleId, A4_SIMPLE)) return false
  if (!isKnownOptionId(normalized.a4PersistenceId, A4_PERSISTENCE)) return false
  if (!isKnownOptionId(normalized.a4ApertureId, A4_APERTURE)) return false
  if (!isKnownOptionId(normalized.a4RoughnessId, A4_ROUGHNESS)) return false
  if (!isKnownOptionId(normalized.a4InfillId, A4_INFILL)) return false
  if (!isKnownOptionId(normalized.a4WeatheringId, A4_WEATHERING)) return false
  if (!A5_CRITERIA.some((criterion) => criterion.id === normalized.a5Criterion)) return false
  if (!isKnownOptionId(normalized.a5OptionId, A5_BY_CRITERION[normalized.a5Criterion as keyof typeof A5_BY_CRITERION])) return false
  if (!isKnownNullableId(normalized.a6Project, PROJECT_TYPES)) return false
  if (!isKnownNullableId(normalized.a6Favorability, FAVORABILITY_OPTIONS)) return false
  if (!isKnownNullableId(normalized.a6Strike, STRIKE_RELATIONS)) return false
  return isKnownNullableId(normalized.a6Dip, DIP_BANDS)
}

function isLegacyRmrInput(value: unknown) {
  if (!isPlainRecord(value)) return false
  const initial = initialRmrFormState() as unknown as Record<string, unknown>
  if (Object.keys(value).some((key) => !Object.prototype.hasOwnProperty.call(initial, key))) return false
  return isRmrInputState({ ...initial, ...value })
}

function isPendingLegacyMigration(value: unknown) {
  return (
    isPlainRecord(value) &&
    hasExactKeys(value, ['fromVersion', 'needsReview']) &&
    value.fromVersion === 1 &&
    value.needsReview === true
  )
}

function acceptsStandardId(methodId: ClassificationMethodId, value: unknown) {
  const contract = METHOD_FILE_CONTRACTS[methodId]
  return value === contract.standardId || contract.standardAliases?.includes(value as string) === true
}

function canonicalStandardId(methodId: ClassificationMethodId) {
  return METHOD_FILE_CONTRACTS[methodId].standardId
}

function validateV2Point(value: unknown, methodId: ClassificationMethodId, index: number): string | null {
  if (!isPlainRecord(value)) return `第 ${index + 1} 个点位不是有效对象。`
  if (isMethodId(value.methodId) && value.methodId !== methodId) {
    return '案例内包含其他算法的点位，已拒绝导入。'
  }
  if (value.methodId !== methodId) return `第 ${index + 1} 个点位缺少有效的算法标识。`
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.name)) {
    return `第 ${index + 1} 个点位缺少编号或名称。`
  }
  if (!isNonEmptyString(value.createdAt) || !isNonEmptyString(value.updatedAt) || !isOptionalString(value.note)) {
    return `第 ${index + 1} 个点位的基础信息结构无效。`
  }

  const contract = METHOD_FILE_CONTRACTS[methodId]
  if (methodId === 'mrmr' && value.inputVersion !== contract.inputVersion) {
    return '该案例属于旧版 MRMR 计算口径，请重新建立 MRMR 案例。'
  }
  if (!Number.isInteger(value.inputVersion) || value.inputVersion !== contract.inputVersion) {
    return `第 ${index + 1} 个点位的输入版本不受支持（应为 v${contract.inputVersion}）。`
  }

  const pendingLegacy = methodId === 'rmr' && isPendingLegacyMigration(value.migration)
  if (!pendingLegacy && !acceptsStandardId(methodId, value.standardId)) {
    return `第 ${index + 1} 个点位的标准版本与当前算法不兼容。`
  }

  if (pendingLegacy) {
    if (value.standardId !== undefined && !acceptsStandardId('rmr', value.standardId)) {
      return `第 ${index + 1} 个待复核 RMR 点位的标准版本无效。`
    }
    if (value.input !== undefined || (value.rmr !== undefined && !isLegacyRmrInput(value.rmr))) {
      return `第 ${index + 1} 个旧 RMR 点位的数据结构无效。`
    }
    return null
  }

  if (value.migration !== undefined) return `第 ${index + 1} 个点位包含无效的迁移标记。`
  if (methodId === 'rmr') {
    if (value.input !== undefined || !isRmrInputState(value.rmr)) {
      return `第 ${index + 1} 个 RMR 点位的输入结构无效。`
    }
    return null
  }

  const adapter = GENERIC_ADAPTERS[methodId as GenericMethodId]
  if (!adapter || value.rmr !== undefined || !isCanonicalAdapterInput(value.input, adapter)) {
    return `第 ${index + 1} 个 ${methodId.toUpperCase()} 点位的输入结构无效。`
  }
  return null
}

function validateV2Case(candidate: unknown, methodId: ClassificationMethodId): string | null {
  if (!isPlainRecord(candidate)) return '案例文件缺少有效的案例对象。'
  if (isMethodId(candidate.methodId) && candidate.methodId !== methodId) {
    return `该文件属于 ${candidate.methodId.toUpperCase()}，不能导入当前算法。`
  }
  if (candidate.methodId !== methodId) return '案例缺少有效的算法标识。'
  if (candidate.schemaVersion !== ROCKMASS_CASE_FILE_VERSION) return '案例数据版本无效，应为 v2。'
  if (methodId === 'mrmr' && candidate.standardId !== METHOD_FILE_CONTRACTS.mrmr.standardId) {
    return '该案例属于旧版 MRMR 计算口径，请重新建立 MRMR 案例。'
  }
  if (!acceptsStandardId(methodId, candidate.standardId)) return '案例采用的标准版本与当前算法不兼容。'
  if (!isNonEmptyString(candidate.id) || !isNonEmptyString(candidate.name)) return '案例缺少编号或名称。'
  if (!isNonEmptyString(candidate.createdAt) || !isNonEmptyString(candidate.updatedAt)) {
    return '案例的创建或更新时间无效。'
  }
  if (
    !isOptionalString(candidate.engineering) ||
    !isOptionalString(candidate.location) ||
    !isOptionalString(candidate.remark)
  ) {
    return '案例工程信息结构无效。'
  }
  if (!Array.isArray(candidate.points)) return '案例点位列表无效。'
  for (let index = 0; index < candidate.points.length; index += 1) {
    const error = validateV2Point(candidate.points[index], methodId, index)
    if (error) return error
  }
  return null
}

function validateLegacyRmrCase(candidate: unknown, methodId: ClassificationMethodId): string | null {
  if (methodId !== 'rmr') return 'v1 案例仅支持迁移旧 RMR 数据。'
  if (!isPlainRecord(candidate)) return '旧 RMR 案例缺少有效的案例对象。'
  if (isMethodId(candidate.methodId) && candidate.methodId !== methodId) {
    return `该文件属于 ${candidate.methodId.toUpperCase()}，不能导入当前算法。`
  }
  if (candidate.methodId !== 'rmr' || !isNonEmptyString(candidate.name) || !Array.isArray(candidate.points)) {
    return '旧 RMR 案例内容无法识别。'
  }
  for (let index = 0; index < candidate.points.length; index += 1) {
    const point = candidate.points[index]
    if (!isPlainRecord(point) || !isNonEmptyString(point.name)) return `第 ${index + 1} 个旧 RMR 点位无效。`
    if (point.methodId !== undefined && point.methodId !== 'rmr') return '案例内包含其他算法的点位，已拒绝导入。'
    if (point.rmr !== undefined && !isLegacyRmrInput(point.rmr)) {
      return `第 ${index + 1} 个旧 RMR 点位的数据结构无效。`
    }
  }
  return null
}

function inspectImportPayload(payload: unknown, methodId: ClassificationMethodId): ImportInspection {
  if (!isPlainRecord(payload)) return { ok: false, error: '案例文件内容无法识别，可能已损坏。' }

  const looksWrapped = 'type' in payload || 'version' in payload || 'case' in payload
  if (!looksWrapped) {
    const error = validateLegacyRmrCase(payload, methodId)
    return error ? { ok: false, error } : { ok: true, candidate: payload, methodId, legacyVersion: 1 }
  }

  if (payload.type !== ROCKMASS_CASE_FILE_TYPE) return { ok: false, error: '案例文件类型标识无效。' }
  if (!Number.isInteger(payload.version) || (payload.version as number) < 1) {
    return { ok: false, error: '案例文件版本无效。' }
  }
  if ((payload.version as number) > ROCKMASS_CASE_FILE_VERSION) {
    return {
      ok: false,
      error: `该案例由更高版本软件创建（v${payload.version}），当前版本无法读取。`,
    }
  }

  if (payload.version === 1) {
    const error = validateLegacyRmrCase(payload.case, methodId)
    return error
      ? { ok: false, error }
      : { ok: true, candidate: payload.case as Record<string, unknown>, methodId, legacyVersion: 1 }
  }

  if (payload.version !== ROCKMASS_CASE_FILE_VERSION) return { ok: false, error: '案例文件版本无效。' }
  if (!isNonEmptyString(payload.exportedAt)) return { ok: false, error: '案例文件缺少有效的导出时间。' }
  const error = validateV2Case(payload.case, methodId)
  return error
    ? { ok: false, error }
    : { ok: true, candidate: payload.case as Record<string, unknown>, methodId, legacyVersion: null }
}

function normalizeInspectedCase(inspection: Extract<ImportInspection, { ok: true }>): RockMassCaseRecord {
  const { candidate, methodId, legacyVersion } = inspection
  const nowIso = new Date().toISOString()
  const sourcePoints = candidate.points as Record<string, unknown>[]
  const points: RockMassPointRecord[] = sourcePoints.map((point) => {
    const pendingMigration = legacyVersion === 1 || isPendingLegacyMigration(point.migration)
    const normalized: RockMassPointRecord = {
      id: createPointId(),
      name: point.name as string,
      note: typeof point.note === 'string' ? point.note : undefined,
      oreType: typeof point.oreType === 'string' ? point.oreType : undefined,
      methodId,
      standardId: pendingMigration ? undefined : canonicalStandardId(methodId),
      inputVersion: METHOD_FILE_CONTRACTS[methodId].inputVersion,
      createdAt: typeof point.createdAt === 'string' ? point.createdAt : nowIso,
      updatedAt: nowIso,
      ...(pendingMigration ? { migration: { fromVersion: 1, needsReview: true } } : {}),
    }
    if (methodId === 'rmr') {
      if (isPlainRecord(point.rmr)) {
        normalized.rmr = (pendingMigration ? { ...point.rmr } : { ...initialRmrFormState(), ...point.rmr }) as unknown as RmrFormState
      }
    } else if (isPlainRecord(point.input)) {
      normalized.input = { ...point.input }
    }
    return normalized
  })

  return {
    id: createCaseId(),
    name: candidate.name as string,
    methodId,
    schemaVersion: 2,
    standardId: canonicalStandardId(methodId),
    engineering: typeof candidate.engineering === 'string' ? candidate.engineering : undefined,
    location: typeof candidate.location === 'string' ? candidate.location : undefined,
    remark: typeof candidate.remark === 'string' ? candidate.remark : undefined,
    createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : nowIso,
    updatedAt: nowIso,
    points,
  }
}

export function buildCaseFilePayload(record: RockMassCaseRecord): RockMassCaseFilePayload {
  const error = validateV2Case(record, record.methodId)
  if (error) throw new Error(`案例不符合 .rmcal v2 数据契约：${error}`)
  return {
    type: ROCKMASS_CASE_FILE_TYPE,
    version: ROCKMASS_CASE_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    case: record,
  }
}

export async function exportCaseFile(record: RockMassCaseRecord): Promise<SaveFileResult> {
  const content = JSON.stringify(buildCaseFilePayload(record), null, 2)
  return saveFile(buildCaseFileName(record), content, {
    title: '导出案例',
    filters: [
      { name: '岩体分级案例', extensions: ['rmcal'] },
      { name: '所有文件', extensions: ['*'] },
    ],
    mimeType: 'application/json;charset=utf-8',
  })
}

/**
 * 解析导入的案例。id 一律重新生成，避免覆盖工作区里已有的同源案例。
 */
export function normalizeImportedCase(payload: unknown, methodId: ClassificationMethodId): RockMassCaseRecord | null {
  const inspection = inspectImportPayload(payload, methodId)
  return inspection.ok ? normalizeInspectedCase(inspection) : null
}

export async function readCaseFromFile(
  file: File,
  methodId: ClassificationMethodId
): Promise<{ record: RockMassCaseRecord } | { error: string }> {
  if (!isCaseFileName(file.name)) return { error: `仅支持 ${ROCKMASS_CASE_FILE_EXT} 案例文件。` }
  try {
    const payload = JSON.parse(await file.text()) as unknown
    const inspection = inspectImportPayload(payload, methodId)
    if (!inspection.ok) return { error: inspection.error }
    return { record: normalizeInspectedCase(inspection) }
  } catch (error) {
    return { error: `读取失败：${error instanceof Error ? error.message : String(error)}` }
  }
}
