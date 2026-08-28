import type { AnyClassificationAdapter, ParameterDescription } from '../types'
import {
  Q_JA_OPTIONS,
  Q_JN_OPTIONS,
  Q_JR_OPTIONS,
  Q_JW_OPTIONS,
  Q_SRF_OPTIONS,
  Q_STANDARD,
  calculateQ,
  createInitialQState,
  describeQ,
  normalizeQState,
  validateQState,
} from '../q'

function formatQ(value: number) {
  if (value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) return value.toExponential(3)
  return Number(value.toPrecision(5)).toString()
}

function incompleteDescriptions(form: Record<string, unknown>): ParameterDescription[] {
  const state = normalizeQState(form)
  const lookup = (id: string, options: readonly { id: string; label: { zh: string; en: string } }[]) =>
    options.find((item) => item.id === id)?.label
  return [
    { key: 'RQD', label: '岩石质量指标 RQD', labelEn: 'RQD', value: state.rqd == null ? '未填写' : `${state.rqd}%`, valueEn: state.rqd == null ? 'Not entered' : `${state.rqd}%` },
    { key: 'Jn', label: '节理组数 Jn', labelEn: 'Joint set Jn', value: lookup(state.jnId, Q_JN_OPTIONS)?.zh ?? '未选择', valueEn: lookup(state.jnId, Q_JN_OPTIONS)?.en ?? 'Not selected' },
    { key: 'Jr', label: '节理粗糙度 Jr', labelEn: 'Joint roughness Jr', value: lookup(state.jrId, Q_JR_OPTIONS)?.zh ?? '未选择', valueEn: lookup(state.jrId, Q_JR_OPTIONS)?.en ?? 'Not selected' },
    { key: 'Ja', label: '节理蚀变 Ja', labelEn: 'Joint alteration Ja', value: lookup(state.jaId, Q_JA_OPTIONS)?.zh ?? '未选择', valueEn: lookup(state.jaId, Q_JA_OPTIONS)?.en ?? 'Not selected' },
    { key: 'Jw', label: '节理水 Jw', labelEn: 'Joint water Jw', value: lookup(state.jwId, Q_JW_OPTIONS)?.zh ?? '未选择', valueEn: lookup(state.jwId, Q_JW_OPTIONS)?.en ?? 'Not selected' },
    { key: 'SRF', label: '应力折减 SRF', labelEn: 'SRF', value: lookup(state.srfId, Q_SRF_OPTIONS)?.zh ?? '未选择', valueEn: lookup(state.srfId, Q_SRF_OPTIONS)?.en ?? 'Not selected' },
  ]
}

export const qAdapter: AnyClassificationAdapter = {
  id: 'q',
  name: 'Q-System岩体分级',
  nameEn: 'Q-System Rock Mass Classification',
  standard: {
    id: 'ngi-q-2025',
    title: Q_STANDARD.title.zh,
    titleEn: Q_STANDARD.title.en,
    edition: 'NGI Q-system Handbook 2025',
    source: Q_STANDARD.references.join('；'),
    sourceEn: Q_STANDARD.references.join('; '),
  },
  inputVersion: 1,
  createInitialForm: () => createInitialQState() as unknown as Record<string, unknown>,
  normalize: (raw) => normalizeQState(raw) as unknown as Record<string, unknown>,
  validate: (form) =>
    validateQState(form)
      .filter((issue) => issue.severity === 'error')
      .map((issue) => ({ field: String(issue.field), message: issue.message.zh, messageEn: issue.message.en })),
  calculate: (form) => {
    const result = calculateQ(form)
    return {
      value: result.q,
      displayValue: `Q = ${formatQ(result.q)}`,
      grade: result.grade.label.zh,
      gradeEn: result.grade.label.en,
      summary: `${result.formula.zh}；初步支护 ${result.support.category} 区：${result.support.label.zh}`,
      summaryEn: `${result.formula.en}; preliminary support category ${result.support.category}: ${result.support.label.en}`,
      metrics: [
        { key: 'block', label: 'RQD / Jn', labelEn: 'RQD / Jn', value: formatQ(result.breakdown.blockSize) },
        { key: 'shear', label: 'Jr / Ja', labelEn: 'Jr / Ja', value: formatQ(result.breakdown.jointShearStrength) },
        { key: 'stress', label: 'Jw / SRF', labelEn: 'Jw / SRF', value: formatQ(result.breakdown.activeStress) },
        { key: 'de', label: '等效尺寸 De', labelEn: 'Equivalent dimension De', value: `${result.equivalentDimension} m` },
        { key: 'support', label: '初步支护', labelEn: 'Preliminary support', value: `${result.support.category} 区`, valueEn: `Category ${result.support.category}` },
      ],
      warnings: [
        ...result.warnings.map((warning) => warning.message.zh),
        result.support.sourceNote.zh,
        result.support.recommendation.zh,
      ],
      warningsEn: [
        ...result.warnings.map((warning) => warning.message.en),
        result.support.sourceNote.en,
        result.support.recommendation.en,
      ],
    }
  },
  describe: (form) => {
    if (validateQState(form).some((issue) => issue.severity === 'error')) return incompleteDescriptions(form)
    const calculated = calculateQ(form)
    return describeQ(form, calculated).map((row) => ({
      key: row.key,
      label: row.label.zh,
      labelEn: row.label.en,
      value: row.value,
      valueEn:
        row.key === 'grade'
          ? calculated.grade.label.en
          : row.key === 'support'
            ? `Category ${calculated.support.category}: ${calculated.support.label.en}`
            : row.value
                .replace('（保守取值）', ' (conservative)')
                .replace('（保守取区间下限）', ' (conservative lower bound)'),
      score: row.basis.zh,
      scoreEn: row.basis.en,
    }))
  },
}
