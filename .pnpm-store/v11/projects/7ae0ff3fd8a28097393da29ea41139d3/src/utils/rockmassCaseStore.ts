/**
 * 岩体分级案例的本地存储层。
 *
 * 所有分级方法共用一个 localStorage 键，列表按 methodId 过滤，
 * 便于后续 BQ / Q / MRMR 直接复用同一套案例与点位管理。
 */

import type { ClassificationMethodId } from '../types'
import type { RockMassCaseRecord, RockMassPointRecord } from '../types/rockmassCase'
import { initialRmrFormState } from './rmrCalc'

export const ROCKMASS_CASES_STORAGE_KEY = 'rockmass.cases.v2'
export const LEGACY_ROCKMASS_CASES_STORAGE_KEY = 'rockmass.cases.v1'

const METHOD_LABELS: Record<ClassificationMethodId, string> = {
  rqd: 'RQD',
  bq: 'BQ',
  q: 'Q',
  rmr: 'RMR',
  mrmr: 'MRMR',
}

function padDatePart(value: number) {
  return String(value).padStart(2, '0')
}

export function formatTimestamp(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())} ${padDatePart(
    date.getHours()
  )}:${padDatePart(date.getMinutes())}`
}

export function formatDateTimeDisplay(iso: string) {
  const parsed = Date.parse(iso)
  if (Number.isNaN(parsed)) return '—'
  return formatTimestamp(new Date(parsed))
}

export function createCaseId(date = new Date()) {
  return `rm-case-${date.getFullYear()}${padDatePart(date.getMonth() + 1)}${padDatePart(date.getDate())}-${padDatePart(
    date.getHours()
  )}${padDatePart(date.getMinutes())}${padDatePart(date.getSeconds())}-${date.getMilliseconds()}-${Math.floor(Math.random() * 1000000)}`
}

export function createPointId(date = new Date()) {
  return `rm-point-${date.getTime()}-${Math.floor(Math.random() * 1000)}`
}

export function suggestCaseName(methodId: ClassificationMethodId, date = new Date()) {
  return `${METHOD_LABELS[methodId]}分级计算 ${formatTimestamp(date)}`
}

/** 在已有点位名基础上给出「点位N」的下一个可用序号 */
export function suggestPointName(existing: RockMassPointRecord[]) {
  let index = existing.length + 1
  const taken = new Set(existing.map((point) => point.name.trim()))
  while (taken.has(`点位${index}`)) index += 1
  return `点位${index}`
}

export function normalizeRockMassGroup(value: string | null | undefined) {
  const normalized = (value ?? '').trim().replace(/\s+/g, ' ')
  return normalized || undefined
}

export function rockMassGroups(points: RockMassPointRecord[]) {
  const groups = new Map<string, string>()
  points.forEach((point) => {
    const value = normalizeRockMassGroup(point.groupId ?? point.oreType)
    if (!value) return
    const key = value.toLocaleLowerCase()
    if (!groups.has(key)) groups.set(key, value)
  })
  return [...groups.values()].sort((a, b) => a.localeCompare(b, 'zh-CN'))
}

function isPointRecord(value: unknown): value is RockMassPointRecord {
  const point = value as Partial<RockMassPointRecord> | null
  return !!point && typeof point.id === 'string' && typeof point.name === 'string'
}

function isMethodId(value: unknown): value is ClassificationMethodId {
  return value === 'rqd' || value === 'bq' || value === 'q' || value === 'rmr' || value === 'mrmr'
}

function normalizeCaseRecord(value: unknown, fromLegacyStorage: boolean): RockMassCaseRecord | null {
  const record = value as Partial<RockMassCaseRecord> | null
  if (!record || typeof record.id !== 'string' || typeof record.name !== 'string') return null
  if ((value as { methodId?: unknown } | null)?.methodId === 'rdp') return null
  const now = new Date().toISOString()
  const methodId = isMethodId(record.methodId) ? record.methodId : 'rmr'
  return {
    id: record.id,
    name: record.name,
    methodId,
    schemaVersion: 2,
    standardId: typeof record.standardId === 'string' ? record.standardId : undefined,
    engineering: typeof record.engineering === 'string' ? record.engineering : undefined,
    location: typeof record.location === 'string' ? record.location : undefined,
    remark: typeof record.remark === 'string' ? record.remark : undefined,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : now,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : now,
    points: Array.isArray(record.points)
      ? record.points.filter(isPointRecord).map((point) => ({
          ...point,
          oreType: typeof point.oreType === 'string' ? point.oreType : undefined,
          groupId: normalizeRockMassGroup(typeof point.groupId === 'string' ? point.groupId : point.oreType),
          methodId: point.methodId ?? methodId,
          standardId: typeof point.standardId === 'string' ? point.standardId : undefined,
          inputVersion: typeof point.inputVersion === 'number' ? point.inputVersion : 1,
          input: point.input && typeof point.input === 'object' ? { ...point.input } : undefined,
          migration:
            point.migration && typeof point.migration === 'object'
              ? point.migration
              : fromLegacyStorage && point.rmr
                ? { fromVersion: 1, needsReview: true }
                : undefined,
          createdAt: point.createdAt ?? now,
          updatedAt: point.updatedAt ?? now,
        }))
      : [],
  }
}

export function readCaseRecords(): RockMassCaseRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const currentRaw = window.localStorage.getItem(ROCKMASS_CASES_STORAGE_KEY)
    const fromLegacyStorage = currentRaw == null
    const raw = currentRaw ?? window.localStorage.getItem(LEGACY_ROCKMASS_CASES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((record) => normalizeCaseRecord(record, fromLegacyStorage))
      .filter((record): record is RockMassCaseRecord => record != null)
  } catch {
    return []
  }
}

export function writeCaseRecords(records: RockMassCaseRecord[]): { ok: true } | { ok: false; error: string } {
  if (typeof window === 'undefined') return { ok: true }
  try {
    window.localStorage.setItem(ROCKMASS_CASES_STORAGE_KEY, JSON.stringify(records))
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export function sortCaseRecords(records: RockMassCaseRecord[]) {
  return [...records].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
}

export function buildBlankCase(methodId: ClassificationMethodId, name: string, standardId?: string): RockMassCaseRecord {
  const now = new Date()
  const iso = now.toISOString()
  return {
    id: createCaseId(now),
    name: name.trim() || suggestCaseName(methodId, now),
    methodId,
    schemaVersion: 2,
    standardId,
    createdAt: iso,
    updatedAt: iso,
    points: [],
  }
}

export function buildBlankPoint(
  methodId: ClassificationMethodId,
  name: string,
  input?: Record<string, unknown>,
  standardId?: string,
  inputVersion = 1
): RockMassPointRecord {
  const now = new Date()
  const iso = now.toISOString()
  return {
    id: createPointId(now),
    name: name.trim() || '未命名点位',
    methodId,
    standardId,
    inputVersion,
    ...(input ? { input } : {}),
    createdAt: iso,
    updatedAt: iso,
    ...(methodId === 'rmr' ? { rmr: initialRmrFormState() } : {}),
  }
}

export function duplicatePoint(point: RockMassPointRecord, name: string): RockMassPointRecord {
  const now = new Date()
  const iso = now.toISOString()
  return {
    ...point,
    id: createPointId(now),
    name: name.trim() || `${point.name} 副本`,
    createdAt: iso,
    updatedAt: iso,
    ...(point.rmr ? { rmr: { ...point.rmr } } : {}),
    ...(point.input ? { input: JSON.parse(JSON.stringify(point.input)) as Record<string, unknown> } : {}),
  }
}

/** 把一个案例写回列表（不存在则插入），并刷新 updatedAt */
export function upsertCase(records: RockMassCaseRecord[], next: RockMassCaseRecord): RockMassCaseRecord[] {
  const stamped: RockMassCaseRecord = { ...next, updatedAt: new Date().toISOString() }
  const exists = records.some((record) => record.id === stamped.id)
  return exists ? records.map((record) => (record.id === stamped.id ? stamped : record)) : [stamped, ...records]
}

export function removeCase(records: RockMassCaseRecord[], caseId: string) {
  return records.filter((record) => record.id !== caseId)
}

/** 用于导航守卫的脏检测：忽略 updatedAt 这类与内容无关的字段 */
function buildComparableCase(record: RockMassCaseRecord) {
  return JSON.stringify({
    name: record.name,
    engineering: record.engineering ?? '',
    location: record.location ?? '',
    remark: record.remark ?? '',
    points: record.points.map((point) => ({
      id: point.id,
      name: point.name,
      note: point.note ?? '',
      oreType: point.oreType ?? '',
      groupId: point.groupId ?? point.oreType ?? '',
      standardId: point.standardId ?? '',
      inputVersion: point.inputVersion ?? 1,
      input: point.input ?? null,
      migration: point.migration ?? null,
      rmr: point.rmr ?? null,
    })),
  })
}

export function isCaseDirty(draft: RockMassCaseRecord, saved: RockMassCaseRecord | null | undefined) {
  if (!saved) return true
  return buildComparableCase(draft) !== buildComparableCase(saved)
}
