import type { AnyClassificationAdapter, ParameterDescription } from '../types'
import {
  GSI_INPUT_VERSION,
  GSI_STANDARD,
  GSI_STRUCTURE_OPTIONS,
  GSI_SURFACE_OPTIONS,
  calculateGsi,
  createInitialGsiState,
  describeGsi,
  normalizeGsiState,
  validateGsiState,
} from '../gsi'

export const gsiAdapter: AnyClassificationAdapter = {
  id: 'gsi',
  name: 'GSI岩体分级',
  nameEn: 'GSI Classification',
  standard: GSI_STANDARD,
  inputVersion: GSI_INPUT_VERSION,
  createInitialForm: () => createInitialGsiState() as unknown as Record<string, unknown>,
  normalize: (raw) => normalizeGsiState(raw) as unknown as Record<string, unknown>,
  validate: (form) => validateGsiState(form),
  calculate: (form) => {
    const result = calculateGsi(form)
    const structure = GSI_STRUCTURE_OPTIONS.find((item) => item.id === result.chartCell?.structureId)
    const surface = GSI_SURFACE_OPTIONS.find((item) => item.id === result.chartCell?.surfaceQualityId)
    const chartMetrics =
      result.entryMode === 'chart'
        ? [
            { key: 'structure', label: '岩体构造', labelEn: 'Structure', value: structure?.label ?? '', valueEn: structure?.labelEn ?? '' },
            { key: 'surface', label: '表面条件', labelEn: 'Surface condition', value: surface?.label ?? '', valueEn: surface?.labelEn ?? '' },
          ]
        : [
            { key: 'rqd', label: 'RQD', labelEn: 'RQD', value: `${result.rqd}%` },
            { key: 'jcond89', label: 'JCond₈₉（或等价）', labelEn: 'JCond₈₉ (or equivalent)', value: String(result.jcond89Equivalent) },
          ]
    return {
      value: result.gsi,
      displayValue: `GSI = ${result.gsi}`,
      grade: result.grade.label,
      gradeEn: result.grade.labelEn,
      summary: result.formula,
      summaryEn: result.formulaEn,
      metrics: [
        { key: 'entry', label: '计算入口', labelEn: 'Entry path', value: result.entryMode === 'chart' ? '图表法' : '定量法', valueEn: result.entryMode === 'chart' ? 'Chart method' : 'Quantitative method' },
        ...chartMetrics,
        { key: 'scaleA', label: '刻度 A', labelEn: 'Scale A', value: String(result.scaleA) },
        { key: 'scaleB', label: '刻度 B', labelEn: 'Scale B', value: String(result.scaleB) },
      ],
      warnings: result.warnings,
      warningsEn: result.warningsEn,
    }
  },
  describe: (form): ParameterDescription[] => describeGsi(form),
}
