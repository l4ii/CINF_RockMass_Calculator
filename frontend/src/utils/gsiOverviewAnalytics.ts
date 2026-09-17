import {
  GSI_GRADES,
  GSI_STRUCTURE_OPTIONS,
  chartIsoline,
  chartPlotPercent,
  type GsiEntryMode,
  type GsiStructureId,
} from '../methods/gsi'
import type { GsiPointSummary } from './gsiCaseSummary'

export type GsiOverviewParameterKey = 'scaleA' | 'scaleB' | 'rqd' | 'jcond89'
export type GsiOverviewSortKey = 'ordinal' | 'name' | 'oreType' | 'gsi' | 'grade' | 'entryMode' | GsiOverviewParameterKey
export type SortDirection = 'asc' | 'desc'

export interface GsiOverviewFilters {
  query: string
  gsiMin: number | null
  gsiMax: number | null
  gradeId: string | null
  entryMode: Exclude<GsiEntryMode, ''> | null
  parameterKey: GsiOverviewParameterKey | null
  parameterMin: number | null
  parameterMax: number | null
  includeIncomplete: boolean
}

export const DEFAULT_GSI_OVERVIEW_FILTERS: GsiOverviewFilters = {
  query: '',
  gsiMin: null,
  gsiMax: null,
  gradeId: null,
  entryMode: null,
  parameterKey: null,
  parameterMin: null,
  parameterMax: null,
  includeIncomplete: false,
}

export const GSI_OVERVIEW_PARAMETER_KEYS: readonly { key: GsiOverviewParameterKey; label: string; labelEn: string }[] = [
  { key: 'scaleA', label: '刻度 A', labelEn: 'Scale A' },
  { key: 'scaleB', label: '刻度 B', labelEn: 'Scale B' },
  { key: 'rqd', label: 'RQD', labelEn: 'RQD' },
  { key: 'jcond89', label: 'JCond₈₉', labelEn: 'JCond₈₉' },
]

export interface GsiHistogramBin {
  min: number
  max: number
  label: string
  count: number
}

export interface GsiOverviewCloudPoint {
  pointId: string
  pointName: string
  entryMode: GsiEntryMode
  scaleA: number
  scaleB: number
  gsi: number | null
}

export interface GsiOverviewStats {
  total: number
  eligible: number
  average: number | null
  median: number | null
  min: number | null
  max: number | null
  gradeDistribution: Array<{ id: string; label: string; labelEn: string; count: number; percentage: number }>
  gsiHistogram: GsiHistogramBin[]
  structureDistribution: Array<{ id: GsiStructureId; label: string; labelEn: string; count: number }>
  cloud: GsiOverviewCloudPoint[]
}

function normalize(value: string | undefined) {
  return (value ?? '').trim().toLocaleLowerCase()
}

export function hasNumber(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value)
}

export function formatGsiNumber(value: number | null | undefined): string {
  if (!hasNumber(value)) return '—'
  return String(Number(value.toFixed(1)))
}

function numericValue(row: GsiPointSummary, key: GsiOverviewParameterKey | 'gsi'): number | null {
  if (key === 'gsi') return row.gsi
  if (key === 'scaleA') return row.scaleA
  if (key === 'scaleB') return row.scaleB
  if (key === 'rqd') return row.rqd
  return row.jcond89
}

export function applyGsiOverviewFilters(rows: GsiPointSummary[], filters: GsiOverviewFilters): GsiPointSummary[] {
  const query = normalize(filters.query)
  return rows.filter((row) => {
    const haystack = normalize(`${row.point.name} ${row.point.note ?? ''} ${row.point.oreType ?? ''}`)
    if (query && !haystack.includes(query)) return false
    if (filters.entryMode && row.entryMode !== filters.entryMode) return false
    if (filters.gradeId && row.gradeId !== filters.gradeId) return false
    if (filters.gsiMin != null && (!hasNumber(row.gsi) || row.gsi < filters.gsiMin)) return false
    if (filters.gsiMax != null && (!hasNumber(row.gsi) || row.gsi > filters.gsiMax)) return false
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
  const result = typeof left === 'number' && typeof right === 'number'
    ? left - right
    : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' })
  return direction === 'asc' ? result : -result
}

function gradeRank(gradeId: string | null) {
  if (!gradeId) return null
  const index = GSI_GRADES.findIndex((item) => item.id === gradeId)
  return index < 0 ? null : index
}

export function sortGsiOverviewRows(rows: GsiPointSummary[], key: GsiOverviewSortKey, direction: SortDirection): GsiPointSummary[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const get = (item: GsiPointSummary): string | number | null => {
        if (key === 'ordinal') return item.ordinal
        if (key === 'name') return item.point.name
        if (key === 'oreType') return item.point.oreType?.trim() || null
        if (key === 'grade') return gradeRank(item.gradeId)
        if (key === 'entryMode') return item.entryMode || null
        return numericValue(item, key === 'gsi' ? 'gsi' : key)
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

function eligibleRows(rows: GsiPointSummary[], includeIncomplete: boolean) {
  return rows.filter((row) => (includeIncomplete || !row.needsInput) && hasNumber(row.gsi))
}

export function getGsiOverviewStats(rows: GsiPointSummary[], includeIncomplete: boolean): GsiOverviewStats {
  const eligible = eligibleRows(rows, includeIncomplete)
  const gsis = eligible.map((row) => row.gsi).filter(hasNumber)
  const gradeDistribution = GSI_GRADES.map((info) => {
    const count = eligible.filter((row) => row.gradeId === info.id).length
    return {
      id: info.id,
      label: info.label,
      labelEn: info.labelEn,
      count,
      percentage: eligible.length ? round((count / eligible.length) * 100) : 0,
    }
  })
  const gsiHistogram = Array.from({ length: 10 }, (_, index) => {
    const min = index * 10
    const max = index === 9 ? 100 : min + 10
    return {
      min,
      max,
      label: `${min}–${max}`,
      count: gsis.filter((value) => (index === 9 ? value >= min && value <= max : value >= min && value < max)).length,
    }
  })
  const structureDistribution = GSI_STRUCTURE_OPTIONS.map((item) => ({
    id: item.id as GsiStructureId,
    label: item.label,
    labelEn: item.labelEn,
    count: eligible.filter((row) => row.structureId === item.id).length,
  }))
  const cloud = eligible.flatMap((row) => {
    if (!hasNumber(row.scaleA) || !hasNumber(row.scaleB)) return []
    return [{
      pointId: row.point.id,
      pointName: row.point.name,
      entryMode: row.entryMode,
      scaleA: row.scaleA,
      scaleB: row.scaleB,
      gsi: row.gsi,
    }]
  })
  return {
    total: rows.length,
    eligible: gsis.length,
    average: gsis.length ? round(gsis.reduce((sum, value) => sum + value, 0) / gsis.length) : null,
    median: median(gsis),
    min: gsis.length ? round(Math.min(...gsis)) : null,
    max: gsis.length ? round(Math.max(...gsis)) : null,
    gradeDistribution,
    gsiHistogram,
    structureDistribution,
    cloud,
  }
}

/** Chart-space percent: Scale A 45 at left; Scale B 50 at top, 0 on the laminated row. */
export function gsiChartPoint(scaleA: number, scaleB: number) {
  const point = chartPlotPercent(scaleA, scaleB)
  return { x: point.left, y: point.top }
}

export function gsiChartIsoline(gsi: number) {
  return chartIsoline(gsi)
}
