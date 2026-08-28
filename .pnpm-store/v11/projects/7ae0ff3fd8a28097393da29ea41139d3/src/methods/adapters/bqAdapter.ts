import type { AnyClassificationAdapter, ParameterDescription } from '../types'
import {
  BQ_FOUNDATION_F0_GRADES,
  BQ_SLOPE_LAMBDA_OPTIONS,
  BQ_SLOPE_WATER_OPTIONS,
  BQ_STANDARD,
  BQ_UNDERGROUND_ORIENTATION_OPTIONS,
  BQ_UNDERGROUND_STRESS_OPTIONS,
  BQ_UNDERGROUND_WATER_OPTIONS,
  calculateBq,
  createInitialBqState,
  describeBq,
  normalizeBqState,
  validateBqState,
} from '../bq'

function incompleteDescriptions(form: Record<string, unknown>): ParameterDescription[] {
  const state = normalizeBqState(form)
  const lookup = (id: string, options: readonly { id: string; label: { zh: string; en: string } }[]) =>
    options.find((item) => item.id === id)?.label
  const rows: ParameterDescription[] = [
    {
      key: 'mode',
      label: '计算模式',
      labelEn: 'Calculation mode',
      value: state.mode === 'basic' ? '基本 BQ' : state.mode === 'underground' ? '地下工程' : state.mode === 'foundation' ? '地基工程' : '边坡工程',
      valueEn: state.mode === 'basic' ? 'Basic BQ' : state.mode === 'underground' ? 'Underground engineering' : state.mode === 'foundation' ? 'Foundation engineering' : 'Slope engineering',
    },
    {
      key: 'rc',
      label: '岩石饱和单轴抗压强度 Rc',
      labelEn: 'Saturated UCS Rc',
      value: state.rc == null ? '未填写' : `${state.rc} MPa`,
      valueEn: state.rc == null ? 'Not entered' : `${state.rc} MPa`,
    },
    {
      key: 'kv',
      label: '岩体完整性指数 Kv',
      labelEn: 'Rock-mass integrity index Kv',
      value: state.kv == null ? '未填写' : String(state.kv),
      valueEn: state.kv == null ? 'Not entered' : String(state.kv),
    },
  ]

  if (state.mode === 'underground') {
    rows.push(
      {
        key: 'K1',
        label: '地下水修正 K1',
        labelEn: 'Groundwater correction K1',
        value: lookup(state.undergroundWaterId, BQ_UNDERGROUND_WATER_OPTIONS)?.zh ?? '未选择',
        valueEn: lookup(state.undergroundWaterId, BQ_UNDERGROUND_WATER_OPTIONS)?.en ?? 'Not selected',
      },
      {
        key: 'K2',
        label: '主要结构面修正 K2',
        labelEn: 'Discontinuity correction K2',
        value: lookup(state.undergroundOrientationId, BQ_UNDERGROUND_ORIENTATION_OPTIONS)?.zh ?? '未选择',
        valueEn: lookup(state.undergroundOrientationId, BQ_UNDERGROUND_ORIENTATION_OPTIONS)?.en ?? 'Not selected',
      },
      {
        key: 'K3',
        label: '初始应力修正 K3',
        labelEn: 'Initial stress correction K3',
        value: lookup(state.undergroundStressId, BQ_UNDERGROUND_STRESS_OPTIONS)?.zh ?? '未选择',
        valueEn: lookup(state.undergroundStressId, BQ_UNDERGROUND_STRESS_OPTIONS)?.en ?? 'Not selected',
      }
    )
  }

  if (state.mode === 'foundation') {
    rows.push({
      key: 'foundationGradeId',
      label: '地基工程岩体级别',
      labelEn: 'Foundation rock-mass class',
      value: lookup(state.foundationGradeId ?? '', BQ_FOUNDATION_F0_GRADES)?.zh ?? '未选择',
      valueEn: lookup(state.foundationGradeId ?? '', BQ_FOUNDATION_F0_GRADES)?.en ?? 'Not selected',
    })
  }

  if (state.mode === 'slope') {
    rows.push(
      {
        key: 'lambda',
        label: '主要结构面类型及其延伸性 λ',
        labelEn: 'Main discontinuity type and persistence λ',
        value: lookup(state.slopeStructureTypeId, BQ_SLOPE_LAMBDA_OPTIONS)?.zh ?? '未选择',
        valueEn: lookup(state.slopeStructureTypeId, BQ_SLOPE_LAMBDA_OPTIONS)?.en ?? 'Not selected',
      },
      {
        key: 'K4',
        label: '边坡地下水修正 K4',
        labelEn: 'Slope groundwater correction K4',
        value: lookup(state.slopeWaterId, BQ_SLOPE_WATER_OPTIONS)?.zh ?? '未选择',
        valueEn: lookup(state.slopeWaterId, BQ_SLOPE_WATER_OPTIONS)?.en ?? 'Not selected',
      },
      {
        key: 'K5',
        label: '主要结构面产状修正 K5',
        labelEn: 'Main discontinuity orientation correction K5',
        value: state.slopeStructureTypeId === 'none' ? '0' : (state.slopeF1Id && state.slopeF2Id && state.slopeF3Id ? '待计算' : '未点选 F1、F2、F3'),
        valueEn: state.slopeStructureTypeId === 'none' ? '0' : (state.slopeF1Id && state.slopeF2Id && state.slopeF3Id ? 'To be computed' : 'F1, F2, F3 not selected'),
      }
    )
  }

  return rows
}

export const bqAdapter: AnyClassificationAdapter = {
  id: 'bq',
  name: 'BQ工程岩体分级',
  nameEn: 'BQ Engineering Rock Mass Classification',
  standard: {
    id: BQ_STANDARD.id,
    title: BQ_STANDARD.title.zh,
    titleEn: BQ_STANDARD.title.en,
    edition: `GB/T 50218-${BQ_STANDARD.edition}`,
    source: `${BQ_STANDARD.title.zh}，第 ${BQ_STANDARD.clauses.join('、')} 条`,
    sourceEn: `${BQ_STANDARD.title.en}, Clauses ${BQ_STANDARD.clauses.join(', ')}`,
  },
  inputVersion: 1,
  createInitialForm: () => createInitialBqState() as unknown as Record<string, unknown>,
  normalize: (raw) => normalizeBqState(raw) as unknown as Record<string, unknown>,
  validate: (form) =>
    validateBqState(form)
      .filter((issue) => issue.severity === 'error')
      .map((issue) => ({ field: String(issue.field), message: issue.message.zh, messageEn: issue.message.en })),
  calculate: (form) => {
    const result = calculateBq(form)
    const state = normalizeBqState(form)
    const isFoundation = result.mode === 'foundation'
    const symbol = result.mode === 'basic' ? 'BQ' : '[BQ]'
    const coefficientValue = (coefficient: NonNullable<typeof result.corrections.k1>) =>
      `${Number(coefficient.value.toFixed(3))}${coefficient.usedConservativeDefault ? '（采用区间上限）' : ''}`
    const coefficientValueEn = (coefficient: NonNullable<typeof result.corrections.k1>) =>
      `${Number(coefficient.value.toFixed(3))}${coefficient.usedConservativeDefault ? ' (upper bound)' : ''}`
    return {
      value: result.engineeringBq,
      displayValue: isFoundation
        ? (result.foundationGrade
          ? `${result.foundationGrade.label.zh} · ${result.foundationGrade.displayRange} MPa`
          : '请选择定性特征等级')
        : `${symbol} = ${Number(result.engineeringBq.toFixed(1))}`,
      grade: isFoundation ? (result.foundationGrade?.label.zh ?? '—') : `${result.grade.label.zh} · ${result.grade.quality.zh}`,
      gradeEn: isFoundation ? (result.foundationGrade?.label.en ?? '—') : `${result.grade.label.en} · ${result.grade.quality.en}`,
      summary: isFoundation ? '地基工程岩体按表 4.1.1 定性特征定级，并给出表 5.4.2 的基岩承载力基本值 f₀ 区间。' : result.formula.zh,
      summaryEn: isFoundation ? 'Foundation rock-mass class is selected from Table 4.1.1 qualitative characteristics, with the Table 5.4.2 f₀ range.' : result.formula.en,
      metrics: [
        { key: 'rc', label: 'Rc', labelEn: 'Rc', value: `${Number(result.original.rc.toFixed(2))} MPa`, valueEn: `${Number(result.original.rc.toFixed(2))} MPa` },
        { key: 'kv', label: 'Kv', labelEn: 'Kv', value: Number(result.original.kv.toFixed(4)).toString(), valueEn: Number(result.original.kv.toFixed(4)).toString() },
        { key: 'effective-rc', label: '有效 Rc', labelEn: 'Effective Rc', value: `${Number(result.effective.rc.toFixed(2))} MPa` },
        { key: 'effective-kv', label: '有效 Kv', labelEn: 'Effective Kv', value: Number(result.effective.kv.toFixed(3)).toString() },
        {
          key: 'limitation',
          label: '规范限定',
          labelEn: 'Code limitations',
          value:
            result.limitation.rule === 'none'
              ? '未触发'
              : result.limitation.rule === 'rc_limit'
                ? '已按 Rc = 90Kv + 30 限定'
                : '已按 Kv = 0.04Rc + 0.4 限定',
          valueEn:
            result.limitation.rule === 'none'
              ? 'Not triggered'
              : result.limitation.rule === 'rc_limit'
                ? 'Rc limited to 90Kv + 30'
                : 'Kv limited to 0.04Rc + 0.4',
        },
        { key: 'basic-bq', label: '基本 BQ', labelEn: 'Basic BQ', value: Number(result.basicBq.toFixed(1)).toString() },
        { key: 'foundation-f0', label: '基岩承载力基本值 f₀', labelEn: 'Basic bedrock bearing capacity f₀', value: result.foundationGrade ? `${result.foundationGrade.displayRange} MPa` : '—' },
        { key: 'k1', label: 'K1', labelEn: 'K1', value: result.corrections.k1 ? coefficientValue(result.corrections.k1) : '—', valueEn: result.corrections.k1 ? coefficientValueEn(result.corrections.k1) : '—' },
        { key: 'k2', label: 'K2', labelEn: 'K2', value: result.corrections.k2 ? coefficientValue(result.corrections.k2) : '—', valueEn: result.corrections.k2 ? coefficientValueEn(result.corrections.k2) : '—' },
        { key: 'k3', label: 'K3', labelEn: 'K3', value: result.corrections.k3 ? coefficientValue(result.corrections.k3) : '—', valueEn: result.corrections.k3 ? coefficientValueEn(result.corrections.k3) : '—' },
        { key: 'lambda', label: 'λ', labelEn: 'λ', value: result.corrections.lambda ? coefficientValue(result.corrections.lambda) : '—', valueEn: result.corrections.lambda ? coefficientValueEn(result.corrections.lambda) : '—' },
        { key: 'k4', label: 'K4', labelEn: 'K4', value: result.corrections.k4 ? coefficientValue(result.corrections.k4) : '—', valueEn: result.corrections.k4 ? coefficientValueEn(result.corrections.k4) : '—' },
        { key: 'k5', label: 'K5', labelEn: 'K5', value: result.corrections.slopeFactors ? Number(result.corrections.slopeFactors.k5.toFixed(3)).toString() : '—', valueEn: result.corrections.slopeFactors ? Number(result.corrections.slopeFactors.k5.toFixed(3)).toString() : '—' },
        { key: 'deduction', label: '工程修正量', labelEn: 'Engineering deduction', value: Number(result.corrections.deduction.toFixed(1)).toString() },
        { key: 'correction-step', label: '修正进度', labelEn: 'Correction progress', value: state.mode === 'underground' ? `${Math.min(state.correctionStep ?? 0, 4)}/4` : '—' },
      ],
      warnings: result.warnings.map((warning) => warning.message.zh),
      warningsEn: result.warnings.map((warning) => warning.message.en),
    }
  },
  describe: (form, result) => {
    if (!result) return incompleteDescriptions(form)
    const issues = validateBqState(form).filter((issue) => issue.severity === 'error')
    if (issues.length > 0) return incompleteDescriptions(form)
    const calculated = calculateBq(form)
    return describeBq(form, calculated).map((row) => ({
      key: row.key,
      label: row.label.zh,
      labelEn: row.label.en,
      value: row.value,
      valueEn:
        row.key === 'mode'
          ? calculated.mode === 'basic'
            ? 'Basic BQ'
            : calculated.mode === 'underground'
              ? 'Underground engineering'
              : calculated.mode === 'foundation'
                ? 'Foundation engineering'
                : 'Slope engineering'
          : row.key === 'limitation'
            ? calculated.limitation.rule === 'none'
              ? 'Not triggered'
              : calculated.limitation.rule === 'rc_limit'
                ? 'Rc limited to 90Kv + 30'
                : 'Kv limited to 0.04Rc + 0.4'
          : row.key === 'effectiveRc'
            ? `${calculated.effective.rc} MPa`
          : row.key === 'effectiveKv'
            ? String(calculated.effective.kv)
          : row.key === 'grade'
            ? calculated.mode === 'foundation'
              ? calculated.foundationGrade?.label.en ?? row.value
              : calculated.grade.label.en
            : row.value.replace('（采用区间上限）', ' (upper end of range)'),
      score: row.basis.zh,
      scoreEn: row.basis.en,
    }))
  },
}
