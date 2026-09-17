import type { AnyClassificationAdapter, ParameterDescription, ResultMetric } from '../types'
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
  displayedFactorValue,
  formatQValue,
  getQAnalysis,
  normalizeQState,
  validateQState,
  type QFactorOption,
} from '../q'

function factorText(id: string, value: number | null, options: readonly QFactorOption[]) {
  const resolved = displayedFactorValue(id, value, options)
  if (resolved != null) return { zh: String(resolved), en: String(resolved) }
  return { zh: '未选择', en: 'Not selected' }
}

function incompleteDescriptions(form: Record<string, unknown>): ParameterDescription[] {
  const state = normalizeQState(form)
  const factor = (id: string, value: number | null, options: readonly QFactorOption[]) => {
    const text = factorText(id, value, options)
    return { value: text.zh, valueEn: text.en }
  }
  return [
    { key: 'RQD', label: '岩石质量指标 RQD', labelEn: 'RQD', value: state.rqd == null ? '未填写' : `${state.rqd}%`, valueEn: state.rqd == null ? 'Not entered' : `${state.rqd}%` },
    { key: 'Jn', label: '节理组数 Jn', labelEn: 'Joint set Jn', ...factor(state.jnId, state.jnValue, Q_JN_OPTIONS) },
    { key: 'Jr', label: '节理粗糙度 Jr', labelEn: 'Joint roughness Jr', ...factor(state.jrId, state.jrValue, Q_JR_OPTIONS) },
    { key: 'Ja', label: '节理蚀变 Ja', labelEn: 'Joint alteration Ja', ...factor(state.jaId, state.jaValue, Q_JA_OPTIONS) },
    { key: 'Jw', label: '节理水 Jw', labelEn: 'Joint water Jw', ...factor(state.jwId, state.jwValue, Q_JW_OPTIONS) },
    { key: 'SRF', label: '应力折减 SRF', labelEn: 'SRF', ...factor(state.srfId, state.srfValue, Q_SRF_OPTIONS) },
  ]
}

export const qAdapter: AnyClassificationAdapter = {
  id: 'q',
  name: 'Q分级',
  nameEn: 'Q classification',
  standard: {
    id: Q_STANDARD.id,
    title: Q_STANDARD.title.zh,
    titleEn: Q_STANDARD.title.en,
    edition: Q_STANDARD.edition,
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
    const analysis = getQAnalysis(result)
    const metrics: ResultMetric[] = [
      ...analysis.map((item) => ({ key: item.key, label: item.title.zh, labelEn: item.title.en, value: item.value })),
      { key: 'block', label: 'RQD / Jn', labelEn: 'RQD / Jn', value: analysis[0].value },
      { key: 'shear', label: 'Jr / Ja', labelEn: 'Jr / Ja', value: analysis[1].value },
      { key: 'stress', label: 'Jw / SRF', labelEn: 'Jw / SRF', value: analysis[2].value },
    ]
    if (result.equivalentDimension != null && result.support) {
      metrics.push(
        { key: 'de', label: '等效尺寸 De', labelEn: 'Equivalent dimension De', value: `${result.equivalentDimension} m` },
        { key: 'support', label: '支护需求判定', labelEn: 'Support requirement assessment', value: result.support.label.zh, valueEn: result.support.label.en },
      )
    }
    return {
      value: result.q,
      displayValue: `Q = ${formatQValue(result.q)}`,
      grade: result.grade.label.zh,
      gradeEn: result.grade.label.en,
      summary: result.formula.zh,
      summaryEn: result.formula.en,
      metrics,
      warnings: [
        ...result.warnings.map((warning) => warning.message.zh),
        ...(result.support ? [result.support.sourceNote.zh, result.support.recommendation.zh] : []),
      ],
      warningsEn: [
        ...result.warnings.map((warning) => warning.message.en),
        ...(result.support ? [result.support.sourceNote.en, result.support.recommendation.en] : []),
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
          : row.key === 'support' && calculated.support
            ? calculated.support.label.en
            : row.value
                .replace('（保守取值）', ' (conservative)')
                .replace('（保守取区间下限）', ' (conservative lower bound)'),
      score: row.basis.zh,
      scoreEn: row.basis.en,
    }))
  },
}
