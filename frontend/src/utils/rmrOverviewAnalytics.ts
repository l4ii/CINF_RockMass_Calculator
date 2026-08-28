import { RMR_CLASSES, type RmrClassId } from '../config/rmrTables'
import type { RmrNumericInputKey, RmrParamKey } from './rmrCalc'
import type { RmrPointSummary } from './rmrCaseSummary'

export type RmrOverviewParameterKey = RmrParamKey | RmrNumericInputKey
export type RmrOverviewSortKey = 'ordinal' | 'name' | 'oreType' | 'rmr' | 'grade' | RmrOverviewParameterKey
export type SortDirection = 'asc' | 'desc'

export interface RmrOverviewFilters {
  oreTypeQuery: string
  oreTypeMissingOnly: boolean
  rmrMin: number | null
  rmrMax: number | null
  parameterKey: RmrOverviewParameterKey | null
  parameterMin: number | null
  parameterMax: number | null
  gradeId: RmrClassId | null
  rmrBinMin: number | null
  rmrBinMax: number | null
  includeNeedsReview: boolean
}

export const DEFAULT_RMR_OVERVIEW_FILTERS: RmrOverviewFilters = {
  oreTypeQuery: '',
  oreTypeMissingOnly: false,
  rmrMin: null,
  rmrMax: null,
  parameterKey: null,
  parameterMin: null,
  parameterMax: null,
  gradeId: null,
  rmrBinMin: null,
  rmrBinMax: null,
  includeNeedsReview: false,
}

export interface RmrHistogramBin {
  min: number
  max: number
  label: string
  count: number
}

export interface RmrOverviewStats {
  total: number
  eligible: number
  average: number | null
  median: number | null
  min: number | null
  max: number | null
  gradeDistribution: Array<{ id: RmrClassId; label: string; count: number; percentage: number }>
  rmrHistogram: RmrHistogramBin[]
  scoreAverages: Array<{ key: RmrParamKey; average: number | null; count: number }>
  scatter: Array<{ pointId: string; pointName: string; x: number; y: number }>
}

function normalize(value: string | undefined) {
  return (value ?? '').trim().toLocaleLowerCase()
}

function numericValue(row: RmrPointSummary, key: RmrOverviewParameterKey | 'rmr'): number | null {
  if (key === 'rmr') return row.scores.rmr
  if (key in row.scoreByParam) return row.scoreByParam[key as RmrParamKey]
  return row.numericInputs[key as RmrNumericInputKey] ?? null
}

function hasNumber(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value)
}

export function applyRmrOverviewFilters(rows: RmrPointSummary[], filters: RmrOverviewFilters): RmrPointSummary[] {
  const query = normalize(filters.oreTypeQuery)
  return rows.filter((row) => {
    const oreType = normalize(row.oreType ?? row.point.oreType)
    if (filters.oreTypeMissingOnly && oreType) return false
    if (!filters.oreTypeMissingOnly && query && !oreType.includes(query)) return false
    const rmr = row.scores.rmr
    if (filters.rmrMin != null && (!hasNumber(rmr) || rmr < filters.rmrMin)) return false
    if (filters.rmrMax != null && (!hasNumber(rmr) || rmr > filters.rmrMax)) return false
    if (filters.gradeId && row.gradeId !== filters.gradeId) return false
    if (filters.rmrBinMin != null && (!hasNumber(rmr) || rmr < filters.rmrBinMin || rmr > (filters.rmrBinMax ?? filters.rmrBinMin + 9))) return false
    if (filters.parameterKey && (filters.parameterMin != null || filters.parameterMax != null)) {
      const value = numericValue(row, filters.parameterKey)
      if (!hasNumber(value)) return false
      if (filters.parameterMin != null && value < filters.parameterMin) return false
      if (filters.parameterMax != null && value > filters.parameterMax) return false
    }
    return true
  })
}

function compareValues(left: string | number | null, right: string | number | null, direction: SortDirection) {
  if (left == null && right == null) return 0
  if (left == null) return 1
  if (right == null) return -1
  const result = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' })
  return direction === 'asc' ? result : -result
}

export function sortRmrOverviewRows(rows: RmrPointSummary[], key: RmrOverviewSortKey, direction: SortDirection): RmrPointSummary[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const get = (item: RmrPointSummary): string | number | null => {
        if (key === 'ordinal') return item.ordinal
        if (key === 'name') return item.point.name
        if (key === 'oreType') return item.oreType?.trim() || item.point.oreType?.trim() || null
        if (key === 'grade') return item.gradeId ? RMR_CLASSES.findIndex((info) => info.id === item.gradeId) : null
        return numericValue(item, key === 'rmr' ? 'rmr' : key)
      }
      return compareValues(get(left.row), get(right.row), direction) || left.index - right.index
    })
    .map(({ row }) => row)
}

function round(value: number, decimals = 1) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function median(values: number[]) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return round(sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2)
}

function eligibleRows(rows: RmrPointSummary[], includeNeedsReview: boolean) {
  return rows.filter((row) => (includeNeedsReview || !row.needsReview) && hasNumber(row.scores.rmr))
}

export function getRmrOverviewStats(rows: RmrPointSummary[], includeNeedsReview: boolean, scatterKey: RmrNumericInputKey | null = 'a1Ucs'): RmrOverviewStats {
  const eligible = eligibleRows(rows, includeNeedsReview)
  const rmrs = eligible.map((row) => row.scores.rmr).filter(hasNumber)
  const gradeDistribution = RMR_CLASSES.map((info) => {
    const count = eligible.filter((row) => row.gradeId === info.id).length
    return { id: info.id, label: info.label, count, percentage: eligible.length ? round((count / eligible.length) * 100) : 0 }
  })
  const rmrHistogram = Array.from({ length: 10 }, (_, index) => {
    const min = index * 10
    const max = index === 9 ? 100 : min + 9
    return { min, max, label: `${min}-${max}`, count: rmrs.filter((value) => value >= min && value <= max).length }
  })
  const scoreAverages = (['A1', 'A2', 'A3', 'A4', 'A5', 'A6'] as RmrParamKey[]).map((key) => {
    const values = eligible.map((row) => row.scoreByParam[key]).filter(hasNumber)
    return { key, average: values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length) : null, count: values.length }
  })
  const scatter = scatterKey
    ? eligible.flatMap((row) => {
        const x = row.numericInputs[scatterKey]
        const y = row.scores.rmr
        return hasNumber(x) && hasNumber(y) ? [{ pointId: row.point.id, pointName: row.point.name, x, y }] : []
      })
    : []
  return {
    total: rows.length,
    eligible: rmrs.length,
    average: rmrs.length ? round(rmrs.reduce((sum, value) => sum + value, 0) / rmrs.length) : null,
    median: median(rmrs),
    min: rmrs.length ? Math.min(...rmrs) : null,
    max: rmrs.length ? Math.max(...rmrs) : null,
    gradeDistribution,
    rmrHistogram,
    scoreAverages,
    scatter,
  }
}
