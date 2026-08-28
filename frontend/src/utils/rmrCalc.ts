import {
  A1_POINT_LOAD,
  A1_UCS,
  A2_RQD,
  A3_SPACING,
  A4_APERTURE,
  A4_DETAIL_ROWS,
  A4_INFILL,
  A4_PERSISTENCE,
  A4_ROUGHNESS,
  A4_SIMPLE,
  A4_WEATHERING,
  A5_BY_CRITERION,
  A6_ADJUSTMENT,
  classFromRmr,
  favorabilityFromOrientation,
  labelForA5Criterion,
  labelForDip,
  labelForFavorability,
  labelForProjectType,
  labelForStrike,
  type A5Criterion,
  type DipBand,
  type Favorability,
  type ProjectType,
  type RmrClassInfo,
  type ScoreOption,
  type StrikeRelation,
} from '../config/rmrTables'

export type A1StrengthMode = 'point_load' | 'ucs'

export interface RmrFormState {
  a1Mode: A1StrengthMode | null
  a1OptionId: string | null
  a1PointLoadValue: number | null
  a1UcsValue: number | null
  a2OptionId: string | null
  a2RqdValue: number | null
  a3OptionId: string | null
  a3SpacingValue: number | null
  /** false = 综合五档；true = 表 C 分项 */
  a4Detailed: boolean
  a4SimpleId: string | null
  a4PersistenceId: string | null
  a4ApertureId: string | null
  a4RoughnessId: string | null
  a4InfillId: string | null
  a4WeatheringId: string | null
  a5Criterion: A5Criterion
  a5OptionId: string | null
  a5InflowValue: number | null
  a5PressureValue: number | null
  a6Project: ProjectType | null
  a6Favorability: Favorability | null
  a6Strike: StrikeRelation | null
  a6Dip: DipBand | null
}

export const initialRmrFormState = (): RmrFormState => ({
  a1Mode: null,
  a1OptionId: null,
  a1PointLoadValue: null,
  a1UcsValue: null,
  a2OptionId: null,
  a2RqdValue: null,
  a3OptionId: null,
  a3SpacingValue: null,
  a4Detailed: false,
  a4SimpleId: null,
  a4PersistenceId: null,
  a4ApertureId: null,
  a4RoughnessId: null,
  a4InfillId: null,
  a4WeatheringId: null,
  a5Criterion: 'condition',
  a5OptionId: null,
  a5InflowValue: null,
  a5PressureValue: null,
  a6Project: 'tunnel',
  a6Favorability: null,
  a6Strike: null,
  a6Dip: null,
})

function findScore(options: ScoreOption[], id: string | null): number | null {
  if (!id) return null
  const hit = options.find((o) => o.id === id)
  return hit ? hit.score : null
}

export function a1PointLoadOptionForValue(value: number | null): string | null {
  if (value == null || !Number.isFinite(value) || value < 1) return null
  if (value > 10) return 'pl_gt8'
  if (value >= 4) return 'pl_4_8'
  if (value >= 2) return 'pl_2_4'
  return 'pl_1_2'
}

export function a1UcsOptionForValue(value: number | null): string | null {
  if (value == null || !Number.isFinite(value) || value < 0) return null
  if (value > 250) return 'ucs_gt250'
  if (value >= 100) return 'ucs_100_250'
  if (value >= 50) return 'ucs_50_100'
  if (value >= 25) return 'ucs_25_50'
  if (value >= 5) return 'ucs_5_25'
  if (value >= 1) return 'ucs_1_5'
  return 'ucs_lt1'
}

export function a2RqdOptionForValue(value: number | null): string | null {
  if (value == null || !Number.isFinite(value) || value < 0 || value > 100) return null
  if (value >= 90) return 'rqd_90_100'
  if (value >= 75) return 'rqd_75_90'
  if (value >= 50) return 'rqd_50_75'
  if (value >= 25) return 'rqd_25_50'
  return 'rqd_lt25'
}

export function a3SpacingOptionForValue(value: number | null): string | null {
  if (value == null || !Number.isFinite(value) || value < 0) return null
  if (value > 200) return 'sp_gt2'
  if (value >= 60) return 'sp_0_6_2'
  if (value >= 20) return 'sp_0_2_0_6'
  if (value >= 6) return 'sp_0_06_0_2'
  return 'sp_lt0_06'
}

export function a5InflowOptionForValue(value: number | null): string | null {
  if (value == null || !Number.isFinite(value) || value < 0) return null
  if (value === 0) return 'inf_none'
  if (value < 10) return 'inf_lt10'
  if (value <= 25) return 'inf_10_25'
  if (value <= 125) return 'inf_25_125'
  return 'inf_gt125'
}

export function a5PressureOptionForValue(value: number | null): string | null {
  if (value == null || !Number.isFinite(value) || value < 0) return null
  if (value === 0) return 'pr_0'
  if (value < 0.1) return 'pr_lt0_1'
  if (value <= 0.2) return 'pr_0_1_0_2'
  if (value <= 0.5) return 'pr_0_2_0_5'
  return 'pr_gt0_5'
}

export function scoreA1(state: RmrFormState): number | null {
  if (!state.a1Mode || !state.a1OptionId) return null
  const opts = state.a1Mode === 'point_load' ? A1_POINT_LOAD : A1_UCS
  return findScore(opts, state.a1OptionId)
}

export function scoreA2(state: RmrFormState): number | null {
  return findScore(A2_RQD, state.a2OptionId)
}

export function scoreA3(state: RmrFormState): number | null {
  return findScore(A3_SPACING, state.a3OptionId)
}

export function scoreA4(state: RmrFormState): number | null {
  if (state.a4Detailed) {
    const parts = [
      findScore(A4_PERSISTENCE, state.a4PersistenceId),
      findScore(A4_APERTURE, state.a4ApertureId),
      findScore(A4_ROUGHNESS, state.a4RoughnessId),
      findScore(A4_INFILL, state.a4InfillId),
      findScore(A4_WEATHERING, state.a4WeatheringId),
    ]
    if (parts.some((p) => p == null)) return null
    return parts.reduce((a, b) => (a ?? 0) + (b ?? 0), 0)
  }
  return findScore(A4_SIMPLE, state.a4SimpleId)
}

export function scoreA5(state: RmrFormState): number | null {
  return findScore(A5_BY_CRITERION[state.a5Criterion], state.a5OptionId)
}

/** 隧道有完整走向/倾角信息时按方向表判定；旧的地基/边坡记录继续使用已保存的利弊等级。 */
export function effectiveA6Favorability(state: RmrFormState): Favorability | null {
  if (state.a6Project === 'tunnel' && state.a6Strike) {
    const derived = resolveFavorabilityFromTableB(state.a6Strike, state.a6Dip)
    if (derived) return derived
  }
  return state.a6Favorability
}

export function scoreA6(state: RmrFormState): number | null {
  const favorability = effectiveA6Favorability(state)
  if (!state.a6Project || !favorability) return null
  return A6_ADJUSTMENT[state.a6Project][favorability]
}

export type RmrParamKey = 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6'

export interface RmrScoreBreakdown {
  A1: number | null
  A2: number | null
  A3: number | null
  A4: number | null
  A5: number | null
  A6: number | null
  /** 仅已完成项之和 */
  partialSum: number
  completedCount: number
  allComplete: boolean
  /** 六项齐时的总分 */
  rmr: number | null
  classInfo: RmrClassInfo | null
}

export type RmrNumericInputKey = 'a1PointLoad' | 'a1Ucs' | 'a2Rqd' | 'a3Spacing' | 'a5Inflow' | 'a5Pressure'

export interface RmrNumericInputMeta {
  key: RmrNumericInputKey
  label: string
  labelEn: string
  unit: string
}

export const RMR_NUMERIC_INPUTS: RmrNumericInputMeta[] = [
  { key: 'a1PointLoad', label: 'A1 点荷载强度', labelEn: 'A1 point-load strength', unit: 'MPa' },
  { key: 'a1Ucs', label: 'A1 单轴抗压强度', labelEn: 'A1 UCS', unit: 'MPa' },
  { key: 'a2Rqd', label: 'A2 RQD', labelEn: 'A2 RQD', unit: '%' },
  { key: 'a3Spacing', label: 'A3 结构面间距', labelEn: 'A3 discontinuity spacing', unit: 'cm' },
  { key: 'a5Inflow', label: 'A5 涌水量', labelEn: 'A5 inflow', unit: 'L/min' },
  { key: 'a5Pressure', label: 'A5 水压力比', labelEn: 'A5 water pressure ratio', unit: 'MPa' },
]

export function extractRmrNumericInputs(state: RmrFormState): Partial<Record<RmrNumericInputKey, number>> {
  const result: Partial<Record<RmrNumericInputKey, number>> = {}
  const add = (key: RmrNumericInputKey, value: number | null) => {
    if (value != null && Number.isFinite(value)) result[key] = value
  }
  add(state.a1Mode === 'point_load' ? 'a1PointLoad' : 'a1Ucs', state.a1Mode === 'point_load' ? state.a1PointLoadValue : state.a1UcsValue)
  add('a2Rqd', state.a2RqdValue)
  add('a3Spacing', state.a3SpacingValue)
  add(state.a5Criterion === 'inflow' ? 'a5Inflow' : 'a5Pressure', state.a5Criterion === 'inflow' ? state.a5InflowValue : state.a5PressureValue)
  return result
}

export function computeRmrScores(state: RmrFormState): RmrScoreBreakdown {
  const A1 = scoreA1(state)
  const A2 = scoreA2(state)
  const A3 = scoreA3(state)
  const A4 = scoreA4(state)
  const A5 = scoreA5(state)
  const A6 = scoreA6(state)
  const scores = [A1, A2, A3, A4, A5, A6]
  const completed = scores.filter((s) => s != null) as number[]
  const partialSum = completed.reduce((a, b) => a + b, 0)
  const allComplete = completed.length === 6
  const rmr = allComplete ? partialSum : null
  return {
    A1,
    A2,
    A3,
    A4,
    A5,
    A6,
    partialSum,
    completedCount: completed.length,
    allComplete,
    rmr,
    classInfo: rmr != null ? classFromRmr(rmr) : null,
  }
}

export const RMR_PARAM_TITLES: Record<
  RmrParamKey,
  { title: string; titleEn: string; short: string; shortEn: string }
> = {
  A1: {
    title: 'A1 · 完整岩石材料的强度',
    titleEn: 'A1 · Strength of intact rock material',
    short: '岩块强度',
    shortEn: 'Intact strength',
  },
  A2: { title: 'A2 · 岩石质量指标 RQD', titleEn: 'A2 · Rock Quality Designation (RQD)', short: 'RQD', shortEn: 'RQD' },
  A3: {
    title: 'A3 · 结构面间距',
    titleEn: 'A3 · Spacing of discontinuities',
    short: '结构面间距',
    shortEn: 'Discontinuity spacing',
  },
  A4: {
    title: 'A4 · 结构面条件',
    titleEn: 'A4 · Condition of discontinuities',
    short: '结构面条件',
    shortEn: 'Discontinuity condition',
  },
  A5: { title: 'A5 · 地下水', titleEn: 'A5 · Groundwater', short: '地下水', shortEn: 'Groundwater' },
  A6: {
    title: 'A6 · 结构面方向修正',
    titleEn: 'A6 · Discontinuity orientation adjustment',
    short: '方向修正',
    shortEn: 'Orientation adjustment',
  },
}

export interface RmrParamDescription {
  key: RmrParamKey
  title: string
  short: string
  /** 采用的指标口径，如「单轴抗压强度 / MPa」「一般状况」 */
  basis: string
  /** 选中的档位描述 */
  choice: string
  /** 用户实际输入值；纯表格选择项没有独立数值时为空 */
  inputValue?: string
  inputMetricKey?: RmrNumericInputKey
  inputNumeric?: number
  inputUnit?: string
  score: number | null
}

const NOT_SELECTED = '未选择'
const NOT_SELECTED_EN = 'Not selected'
type RmrLanguage = 'zh' | 'en'

function labelOf(options: ScoreOption[], id: string | null, language: RmrLanguage) {
  const fallback = language === 'en' ? NOT_SELECTED_EN : NOT_SELECTED
  if (!id) return fallback
  const option = options.find((item) => item.id === id)
  return option ? (language === 'en' ? option.labelEn : option.label) : fallback
}

function describeA4Detail(state: RmrFormState, language: RmrLanguage) {
  const fallback = language === 'en' ? NOT_SELECTED_EN : NOT_SELECTED
  const parts = A4_DETAIL_ROWS.map((row) => {
    const id = state[row.key as keyof RmrFormState] as string | null
    const hit = row.options.find((option) => option.id === id)
    const rowLabel = language === 'en' ? row.labelEn : row.label
    const optionLabel = hit ? (language === 'en' ? hit.labelEn : hit.label) : fallback
    return hit ? `${rowLabel}: ${optionLabel} (${hit.score})` : `${rowLabel}: ${fallback}`
  })
  return parts.join(language === 'en' ? '; ' : '；')
}

/** 逐项还原用户的选择，供汇总表格与 Word 报告共用 */
export function describeRmrForm(state: RmrFormState, language: RmrLanguage = 'zh'): RmrParamDescription[] {
  const scores = computeRmrScores(state)
  const fallback = language === 'en' ? NOT_SELECTED_EN : NOT_SELECTED

  const a1Basis =
    state.a1Mode === 'point_load'
      ? language === 'en' ? 'Point-load strength index / MPa' : '点荷载强度指标 / MPa'
      : state.a1Mode === 'ucs'
        ? language === 'en' ? 'Uniaxial compressive strength / MPa' : '单轴抗压强度 / MPa'
        : fallback
  const a1Options = state.a1Mode === 'point_load' ? A1_POINT_LOAD : state.a1Mode === 'ucs' ? A1_UCS : []
  const a1InputValue =
    state.a1Mode === 'point_load' && state.a1PointLoadValue != null
      ? `${state.a1PointLoadValue} MPa`
      : state.a1Mode === 'ucs' && state.a1UcsValue != null
        ? `${state.a1UcsValue} MPa`
        : undefined
  const a1InputNumeric = state.a1Mode === 'point_load' ? state.a1PointLoadValue : state.a1Mode === 'ucs' ? state.a1UcsValue : undefined
  const a2InputValue = state.a2RqdValue != null ? `${state.a2RqdValue}%` : undefined
  const a3InputValue = state.a3SpacingValue != null ? `${state.a3SpacingValue} cm` : undefined
  const a5InputValue =
    state.a5Criterion === 'inflow' && state.a5InflowValue != null
      ? `${state.a5InflowValue} L/min`
      : state.a5Criterion === 'pressure' && state.a5PressureValue != null
        ? `${state.a5PressureValue} MPa`
        : undefined

  const effectiveFavorability = effectiveA6Favorability(state)
  const a6Basis = state.a6Project ? labelForProjectType(state.a6Project, language) : fallback
  const a6Choice = effectiveFavorability ? labelForFavorability(effectiveFavorability, language) : fallback
  const a6Orientation =
    state.a6Project === 'tunnel' && state.a6Strike && state.a6Dip
      ? language === 'en'
        ? ` (Table 7: ${labelForStrike(state.a6Strike, language)}; ${labelForDip(state.a6Dip, language)})`
        : `（表7：${labelForStrike(state.a6Strike, language)}，${labelForDip(state.a6Dip, language)}）`
      : ''

  const titleFor = (key: RmrParamKey) => {
    const source = RMR_PARAM_TITLES[key]
    return {
      title: language === 'en' ? source.titleEn : source.title,
      short: language === 'en' ? source.shortEn : source.short,
    }
  }

  return [
    {
      key: 'A1',
      ...titleFor('A1'),
      basis: a1Basis,
      choice: labelOf(a1Options, state.a1OptionId, language),
      inputValue: a1InputValue,
      inputMetricKey: state.a1Mode === 'point_load' ? 'a1PointLoad' : state.a1Mode === 'ucs' ? 'a1Ucs' : undefined,
      inputNumeric: a1InputNumeric ?? undefined,
      inputUnit: a1InputNumeric == null ? undefined : 'MPa',
      score: scores.A1,
    },
    {
      key: 'A2',
      ...titleFor('A2'),
      basis: 'RQD / %',
      choice: labelOf(A2_RQD, state.a2OptionId, language),
      inputValue: a2InputValue,
      inputMetricKey: 'a2Rqd',
      inputNumeric: state.a2RqdValue ?? undefined,
      inputUnit: state.a2RqdValue == null ? undefined : '%',
      score: scores.A2,
    },
    {
      key: 'A3',
      ...titleFor('A3'),
      basis: language === 'en' ? 'Discontinuity spacing / cm' : '结构面间距 / cm',
      choice: labelOf(A3_SPACING, state.a3OptionId, language),
      inputValue: a3InputValue,
      inputMetricKey: 'a3Spacing',
      inputNumeric: state.a3SpacingValue ?? undefined,
      inputUnit: state.a3SpacingValue == null ? undefined : 'cm',
      score: scores.A3,
    },
    {
      key: 'A4',
      ...titleFor('A4'),
      basis: state.a4Detailed
        ? language === 'en' ? 'Detailed ratings (Table 4)' : '分项详评（表4）'
        : language === 'en' ? 'Summary description (Table 4)' : '综合描述（表4）',
      choice: state.a4Detailed
        ? describeA4Detail(state, language)
        : labelOf(A4_SIMPLE, state.a4SimpleId, language),
      score: scores.A4,
    },
    {
      key: 'A5',
      ...titleFor('A5'),
      basis: labelForA5Criterion(state.a5Criterion, language),
      choice: labelOf(A5_BY_CRITERION[state.a5Criterion], state.a5OptionId, language),
      inputValue: a5InputValue,
      inputMetricKey: state.a5Criterion === 'inflow' ? 'a5Inflow' : state.a5Criterion === 'pressure' ? 'a5Pressure' : undefined,
      inputNumeric: state.a5Criterion === 'inflow' ? state.a5InflowValue ?? undefined : state.a5Criterion === 'pressure' ? state.a5PressureValue ?? undefined : undefined,
      inputUnit: state.a5Criterion === 'inflow' ? 'L/min' : state.a5Criterion === 'pressure' ? 'MPa' : undefined,
      score: scores.A5,
    },
    {
      key: 'A6',
      ...titleFor('A6'),
      basis: a6Basis,
      choice: a6Choice === fallback ? fallback : `${a6Choice}${a6Orientation}`,
      score: scores.A6,
    },
  ]
}

/** 由 RMR89 表 F 更新隧道结构面方向利弊等级 */
export function resolveFavorabilityFromTableB(
  strike: StrikeRelation | null,
  dip: DipBand | null
): Favorability | null {
  if (!strike || !dip) return null
  return favorabilityFromOrientation(strike, dip)
}
