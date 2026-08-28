/**
 * 案例汇总数据：把案例内各点位的输入与重算结果整理成表格行，
 * 供汇总页面与 Word 报告共用。
 */

import type { RmrClassId } from '../config/rmrTables'
import { RMR_CLASSES } from '../config/rmrTables'
import type { RockMassCaseRecord, RockMassPointRecord } from '../types/rockmassCase'
import {
  computeRmrScores,
  describeRmrForm,
  extractRmrNumericInputs,
  initialRmrFormState,
  type RmrNumericInputKey,
  type RmrParamKey,
  type RmrParamDescription,
  type RmrScoreBreakdown,
} from './rmrCalc'

export interface RmrPointSummary {
  point: RockMassPointRecord
  ordinal: number
  oreType?: string
  descriptions: RmrParamDescription[]
  scores: RmrScoreBreakdown
  scoreByParam: Record<RmrParamKey, number | null>
  numericInputs: Partial<Record<RmrNumericInputKey, number>>
  gradeId: RmrClassId | null
  needsReview: boolean
}

export interface RmrCaseSummary {
  rows: RmrPointSummary[]
  total: number
  completed: number
  /** 已完成点位的 RMR 平均值，保留一位小数；无已完成点位时为 null */
  averageRmr: number | null
  minRmr: number | null
  maxRmr: number | null
  /** 各等级的点位数量，按 I–V 排列 */
  distribution: { id: RmrClassId; label: string; count: number }[]
}

export function buildCaseSummary(record: RockMassCaseRecord, language: 'zh' | 'en' = 'zh'): RmrCaseSummary {
  const rows: RmrPointSummary[] = record.points.map((point, index) => {
    const form = point.rmr ?? initialRmrFormState()
    const scores = computeRmrScores(form)
    return {
      point,
      ordinal: index + 1,
      oreType: point.oreType,
      descriptions: describeRmrForm(form, language),
      scores,
      scoreByParam: { A1: scores.A1, A2: scores.A2, A3: scores.A3, A4: scores.A4, A5: scores.A5, A6: scores.A6 },
      numericInputs: extractRmrNumericInputs(form),
      gradeId: scores.classInfo?.id ?? null,
      needsReview: point.migration?.needsReview === true,
    }
  })

  const completedScores = rows
    .map((row) => (row.needsReview ? null : row.scores.rmr))
    .filter((rmr): rmr is number => rmr != null)

  const distribution = RMR_CLASSES.map((info) => ({
    id: info.id,
    label: language === 'en' ? info.labelEn : info.label,
    count: rows.filter((row) => !row.needsReview && row.scores.classInfo?.id === info.id).length,
  }))

  return {
    rows,
    total: rows.length,
    completed: completedScores.length,
    averageRmr:
      completedScores.length > 0
        ? Math.round((completedScores.reduce((sum, value) => sum + value, 0) / completedScores.length) * 10) / 10
        : null,
    minRmr: completedScores.length > 0 ? Math.min(...completedScores) : null,
    maxRmr: completedScores.length > 0 ? Math.max(...completedScores) : null,
    distribution,
  }
}
