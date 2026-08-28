import type { AnyClassificationAdapter, ParameterDescription } from '../types'
import { RQD_STANDARD, calculateRqd, createInitialRqdState, normalizeRqdState, validateRqdState } from '../rqd'

function format(value: number) {
  return Number(value.toFixed(2)).toString()
}

function descriptions(form: Record<string, unknown>): ParameterDescription[] {
  const state = normalizeRqdState(form)
  return [
    { key: 'core-run', label: '钻孔总长', labelEn: 'Total drill-hole length', value: state.coreRunLength == null ? '未填写' : `${state.coreRunLength} m`, valueEn: state.coreRunLength == null ? 'Not entered' : `${state.coreRunLength} m` },
    { key: 'sound-core', label: '长度≥10 cm 的岩芯累计长度', labelEn: 'Cumulative core length at least 10 cm', value: state.soundCoreLength == null ? '未填写' : `${state.soundCoreLength} m`, valueEn: state.soundCoreLength == null ? 'Not entered' : `${state.soundCoreLength} m` },
  ]
}

export const rqdAdapter: AnyClassificationAdapter = {
  id: 'rqd',
  name: 'RQD分级',
  nameEn: 'RQD Classification',
  standard: {
    id: RQD_STANDARD.id,
    title: RQD_STANDARD.title,
    titleEn: RQD_STANDARD.titleEn,
    edition: RQD_STANDARD.edition,
    source: RQD_STANDARD.source,
    sourceEn: RQD_STANDARD.sourceEn,
  },
  inputVersion: 1,
  createInitialForm: () => createInitialRqdState() as unknown as Record<string, unknown>,
  normalize: (raw) => normalizeRqdState(raw) as unknown as Record<string, unknown>,
  validate: (form) => validateRqdState(form),
  calculate: (form) => {
    const result = calculateRqd(form)
    return {
      value: result.rqd,
      displayValue: `RQD = ${format(result.rqd)}%`,
      grade: result.grade.quality,
      gradeEn: result.grade.qualityEn,
      summary: result.formula,
      summaryEn: result.formulaEn,
      metrics: [
        { key: 'rqd', label: 'RQD 值', labelEn: 'RQD', value: `${format(result.rqd)}%` },
        { key: 'range', label: '分级区间', labelEn: 'Class interval', value: result.grade.id === 'excellent' ? '90%～100%' : result.grade.id === 'good' ? '75%～<90%' : result.grade.id === 'fair' ? '50%～<75%' : result.grade.id === 'poor' ? '25%～<50%' : '0%～<25%' },
      ],
      warnings: [],
      warningsEn: [],
    }
  },
  describe: (form, result) => {
    const rows = descriptions(form)
    if (!result) return rows
    const calculated = calculateRqd(form)
    return [...rows, {
      key: 'rqd', label: 'RQD 分级结果', labelEn: 'RQD classification',
      value: `${format(calculated.rqd)}% · ${calculated.grade.quality}`,
      valueEn: `${format(calculated.rqd)}% · ${calculated.grade.qualityEn}`,
      score: 'Deere et al. (1964)', scoreEn: 'Deere et al. (1964)',
    }]
  },
}
