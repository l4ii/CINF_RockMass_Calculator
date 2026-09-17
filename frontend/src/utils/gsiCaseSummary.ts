/**
 * GSI 案例汇总：把各点位输入与重算结果整理成台账行。
 * 图表法与定量法都落到刻度 A / 刻度 B / GSI，便于同一张表对比。
 */

import {
  GSI_STRUCTURE_OPTIONS,
  GSI_SURFACE_OPTIONS,
  describeGsi,
  normalizeGsiState,
  tryCalculateGsi,
  validateGsiState,
  type GsiEntryMode,
  type GsiFormState,
  type GsiResult,
  type GsiStructureId,
  type GsiSurfaceQualityId,
} from '../methods/gsi'
import type { ParameterDescription } from '../methods/types'
import type { RockMassCaseRecord, RockMassPointRecord } from '../types/rockmassCase'

export interface GsiPointSummary {
  point: RockMassPointRecord
  ordinal: number
  form: GsiFormState
  result: GsiResult | null
  descriptions: ParameterDescription[]
  issueCount: number
  needsInput: boolean
  entryMode: GsiEntryMode
  structureId: GsiStructureId
  surfaceQualityId: GsiSurfaceQualityId
  scaleA: number | null
  scaleB: number | null
  gsi: number | null
  rqd: number | null
  jcond89: number | null
  gradeId: string | null
}

export interface GsiCaseSummary {
  rows: GsiPointSummary[]
  total: number
  completed: number
}

function structureScaleB(id: GsiStructureId): number | null {
  return GSI_STRUCTURE_OPTIONS.find((item) => item.id === id)?.scaleB ?? null
}

function surfaceScaleA(id: GsiSurfaceQualityId): number | null {
  return GSI_SURFACE_OPTIONS.find((item) => item.id === id)?.scaleA ?? null
}

function resolvedCell(form: GsiFormState, result: GsiResult | null) {
  if (result?.chartCell?.structureId && result.chartCell.surfaceQualityId) {
    return {
      structureId: result.chartCell.structureId,
      surfaceQualityId: result.chartCell.surfaceQualityId,
    }
  }
  return {
    structureId: form.structureId,
    surfaceQualityId: form.surfaceQualityId,
  }
}

function partialScales(form: GsiFormState, result: GsiResult | null) {
  if (result) {
    return {
      scaleA: result.scaleA,
      scaleB: result.scaleB,
      gsi: result.gsi,
      rqd: result.rqd,
      jcond89: result.jcond89Equivalent,
      gradeId: result.grade.id,
    }
  }
  if (form.entryMode === 'chart') {
    return {
      scaleA: form.chartScaleA ?? surfaceScaleA(form.surfaceQualityId),
      scaleB: form.chartScaleB ?? structureScaleB(form.structureId),
      gsi: null,
      rqd: null,
      jcond89: null,
      gradeId: null,
    }
  }
  const rqd = form.rqd
  const jcond89 = form.jcond89Value
  return {
    scaleA: jcond89 != null ? 1.5 * jcond89 : null,
    scaleB: rqd != null ? rqd / 2 : null,
    gsi: null,
    rqd,
    jcond89,
    gradeId: null,
  }
}

export function buildGsiCaseSummary(record: RockMassCaseRecord): GsiCaseSummary {
  const rows: GsiPointSummary[] = record.points.map((point, index) => {
    const form = normalizeGsiState(point.input)
    const issues = validateGsiState(form)
    const result = tryCalculateGsi(form)
    const cell = resolvedCell(form, result)
    const scales = partialScales(form, result)
    return {
      point,
      ordinal: index + 1,
      form,
      result,
      descriptions: describeGsi(form),
      issueCount: issues.length,
      needsInput: result == null,
      entryMode: form.entryMode,
      structureId: cell.structureId,
      surfaceQualityId: cell.surfaceQualityId,
      ...scales,
    }
  })
  return {
    rows,
    total: rows.length,
    completed: rows.filter((row) => row.result != null).length,
  }
}

export function gsiOverviewDetailDescriptions(row: GsiPointSummary, language: 'zh' | 'en'): ParameterDescription[] {
  const empty = language === 'en' ? 'Not selected' : '未选择'
  const keys = row.entryMode === 'quantitative'
    ? new Set(['entryMode', 'rqd', 'surfaceMethod'])
    : new Set(['entryMode', 'structureId', 'surfaceQualityId'])
  return row.descriptions.filter((item) => {
    if (!keys.has(item.key)) return false
    const value = language === 'en' ? item.valueEn ?? item.value : item.value
    return value !== empty
  })
}
