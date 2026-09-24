import {
  BQ_FOUNDATION_F0_GRADES,
  BQ_SLOPE_F1_OPTIONS,
  BQ_SLOPE_F2_OPTIONS,
  BQ_SLOPE_F3_OPTIONS,
  BQ_SLOPE_LAMBDA_OPTIONS,
  BQ_SLOPE_WATER_OPTIONS,
  BQ_UNDERGROUND_ORIENTATION_OPTIONS,
  BQ_UNDERGROUND_STRESS_OPTIONS,
  BQ_UNDERGROUND_WATER_OPTIONS,
  calculateBq,
  foundationGradeFromF0,
  normalizeBqState,
  validateBqState,
  type BqFactorOption,
  type BqFormState,
  type BqResult,
} from '../../methods/bq'
import type { RockMassCaseRecord } from '../../types/rockmassCase'
import type { CalculationInputRow, CalculationPointBlock } from '../reportDocxTemplate'

export const BQ_REPORT_USAGE = [
  '岩体基本质量指标 BQ = 100 + 3Rc + 250Kv。Rc 为岩石饱和单轴抗压强度（MPa），Kv 为岩体完整性指数。当 Rc > 90Kv + 30 或 Kv > 0.04Rc + 0.4 时，先按规范取限定值，再计算 BQ。',
  '地下工程与边坡工程在基本质量上计入地下水、结构面和地应力影响，得到工程岩体质量指标 [BQ]。地基工程按岩体基本质量的定性特征定级，并给出基岩承载力基本值供参考。',
  '参数表只记录当前工程类型下已经填写、并进入本次计算的输入。另一类工程的修正系数、向导进度不写入计算书。有效强度、基本质量指标、工程岩体指标和级别写在评价中。',
]

const MODE_LABEL: Record<BqFormState['mode'], string> = {
  basic: '基本 BQ',
  underground: '地下工程岩体',
  foundation: '地基工程岩体',
  slope: '边坡工程岩体',
}

function lookup(id: string, options: readonly { id: string; label: { zh: string } }[]) {
  return options.find((item) => item.id === id)?.label.zh ?? ''
}

function factorLookup(id: string | null, options: readonly BqFactorOption[]) {
  return options.find((item) => item.id === id)
}

function coefficientText(value: number, conservative: boolean) {
  return `${Number(value.toFixed(3))}${conservative ? '（采用区间上限）' : ''}`
}

function pushMeasured(rows: CalculationInputRow[], parameter: string, value: number | null, unit: string) {
  if (value == null) return
  const shown = unit ? `${value} ${unit}` : String(value)
  rows.push({ parameter, entered: shown, adopted: shown })
}

function inputRows(state: BqFormState, result: BqResult | null): CalculationInputRow[] {
  const rows: CalculationInputRow[] = [{ parameter: '计算模式', entered: MODE_LABEL[state.mode], adopted: MODE_LABEL[state.mode] }]
  if (state.rc != null) rows.push({ parameter: '岩石饱和单轴抗压强度 Rc', entered: `${state.rc} MPa`, adopted: `${state.rc} MPa` })
  if (state.kv != null) rows.push({ parameter: '岩体完整性指数 Kv', entered: String(state.kv), adopted: String(state.kv) })

  if (state.mode === 'underground') {
    pushMeasured(rows, '地下水压力', state.groundwaterPressureP, 'MPa')
    pushMeasured(rows, '单位涌水量', state.groundwaterInflowQ, 'L/min·10 m')
    const water = lookup(state.undergroundWaterId, BQ_UNDERGROUND_WATER_OPTIONS)
    if (water || result?.corrections.k1) {
      rows.push({
        parameter: '地下水修正 K1',
        entered: water || '已填写',
        adopted: result?.corrections.k1 ? coefficientText(result.corrections.k1.value, result.corrections.k1.usedConservativeDefault) : (state.k1Value == null ? '—' : String(state.k1Value)),
      })
    }
    const orientation = lookup(state.undergroundOrientationId, BQ_UNDERGROUND_ORIENTATION_OPTIONS)
    if (orientation || result?.corrections.k2) {
      rows.push({
        parameter: '主要结构面修正 K2',
        entered: orientation || '已填写',
        adopted: result?.corrections.k2 ? coefficientText(result.corrections.k2.value, result.corrections.k2.usedConservativeDefault) : (state.k2Value == null ? '—' : String(state.k2Value)),
      })
    }
    pushMeasured(rows, '强度应力比 Rc/σmax', state.undergroundStressRatio, '')
    const stress = lookup(state.undergroundStressId, BQ_UNDERGROUND_STRESS_OPTIONS)
    if (stress || result?.corrections.k3) {
      rows.push({
        parameter: '初始应力修正 K3',
        entered: stress || '已填写',
        adopted: result?.corrections.k3 ? coefficientText(result.corrections.k3.value, result.corrections.k3.usedConservativeDefault) : (state.k3Value == null ? '—' : String(state.k3Value)),
      })
    }
  }

  if (state.mode === 'foundation') {
    const grade = lookup(state.foundationGradeId ?? '', BQ_FOUNDATION_F0_GRADES) || (state.foundationF0 != null ? foundationGradeFromF0(state.foundationF0).label.zh : '')
    if (grade) rows.push({ parameter: '地基工程岩体级别', entered: grade, adopted: grade })
    if (state.foundationF0 != null) rows.push({ parameter: '基岩承载力基本值 f₀', entered: `${state.foundationF0} MPa`, adopted: `${state.foundationF0} MPa` })
  }

  if (state.mode === 'slope') {
    const lambda = lookup(state.slopeStructureTypeId, BQ_SLOPE_LAMBDA_OPTIONS)
    if (lambda || result?.corrections.lambda) {
      rows.push({
        parameter: '主要结构面类型及其延伸性 λ',
        entered: state.slopeStructureTypeId === 'none' ? '无控制性主要结构面' : (lambda || '已填写'),
        adopted: result?.corrections.lambda ? coefficientText(result.corrections.lambda.value, result.corrections.lambda.usedConservativeDefault) : (state.slopeStructureTypeId === 'none' ? '0' : (state.lambdaValue == null ? '—' : String(state.lambdaValue))),
      })
    }
    pushMeasured(rows, '边坡地下水水头 pw', state.slopeWaterHeadPw, 'm')
    pushMeasured(rows, '边坡高度 H', state.slopeHeightH, 'm')
    const water = lookup(state.slopeWaterId, BQ_SLOPE_WATER_OPTIONS)
    if (water || result?.corrections.k4) {
      rows.push({
        parameter: '边坡地下水修正 K4',
        entered: water || '已填写',
        adopted: result?.corrections.k4 ? coefficientText(result.corrections.k4.value, result.corrections.k4.usedConservativeDefault) : (state.k4Value == null ? '—' : String(state.k4Value)),
      })
    }
    const factors: { id: string | null; name: string; options: readonly BqFactorOption[] }[] = [
      { id: state.slopeF1Id, name: 'F1', options: BQ_SLOPE_F1_OPTIONS },
      { id: state.slopeF2Id, name: 'F2', options: BQ_SLOPE_F2_OPTIONS },
      { id: state.slopeF3Id, name: 'F3', options: BQ_SLOPE_F3_OPTIONS },
    ]
    if (state.slopeStructureTypeId !== 'none') {
      for (const factor of factors) {
        const option = factorLookup(factor.id, factor.options)
        if (!option && !factor.id) continue
        rows.push({
          parameter: factor.name,
          entered: option?.label.zh ?? '已点选',
          adopted: option ? String(option.value) : '—',
        })
      }
    }
  }
  return rows
}

function evaluationOf(result: BqResult): string[] {
  const limit = result.limitation.rule === 'none'
    ? '规范限定：未触发。'
    : result.limitation.rule === 'rc_limit'
      ? '规范限定：已按 Rc = 90Kv + 30 限定。'
      : '规范限定：已按 Kv = 0.04Rc + 0.4 限定。'
  const lines = [
    `${limit}有效 Rc = ${result.effective.rc} MPa，有效 Kv = ${result.effective.kv}。`,
    `基本质量 BQ = 100 + 3Rc + 250Kv = ${result.basicBq}。`,
  ]
  if (result.mode === 'foundation' && result.foundationGrade) {
    lines.push(`地基工程岩体级别：${result.foundationGrade.label.zh}。基岩承载力基本值 f₀ 参考 ${result.foundationGrade.displayRange} MPa。`)
    return lines
  }
  if (result.mode === 'basic') {
    lines.push(`岩体级别：${result.grade.label.zh} · ${result.grade.quality.zh}，${result.grade.range}。`)
    return lines
  }
  lines.push(`${result.formula.zh} = ${result.engineeringBq}。`)
  lines.push(`岩体级别：${result.grade.label.zh} · ${result.grade.quality.zh}，${result.grade.range}。`)
  return lines
}

export function buildBqReportPoints(record: RockMassCaseRecord): CalculationPointBlock[] {
  return record.points.map((point) => {
    const state = normalizeBqState(point.input)
    const errors = validateBqState(state).filter((issue) => issue.severity === 'error')
    const base = {
      name: point.name,
      note: point.note,
      oreType: point.oreType,
      inputs: inputRows(state, null),
    }
    if (errors.length > 0) {
      return {
        ...base,
        resultText: '—',
        gradeText: '—',
        status: `待补充 ${errors.length} 项`,
        evaluation: [`该点位尚有 ${errors.length} 项输入需要补充，未形成工程结论。${errors.map((issue) => issue.message.zh).join('')}`],
      }
    }
    const result = calculateBq(state)
    const foundation = result.mode === 'foundation'
    return {
      ...base,
      inputs: inputRows(state, result),
      resultText: foundation
        ? (result.foundationGrade ? result.foundationGrade.label.zh : '—')
        : `${result.mode === 'basic' ? 'BQ' : '[BQ]'} = ${Number(result.engineeringBq.toFixed(1))}`,
      gradeText: foundation ? (result.foundationGrade?.label.zh ?? '—') : `${result.grade.label.zh} · ${result.grade.quality.zh}`,
      status: '有效',
      evaluation: evaluationOf(result),
    }
  })
}
