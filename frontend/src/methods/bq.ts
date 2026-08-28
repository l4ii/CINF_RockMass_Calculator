/**
 * GB/T 50218-2014 rock-mass basic quality (BQ) calculation.
 *
 * The standard gives several correction coefficients as ranges. This module
 * keeps the selected table cell and the engineer-selected value separately.
 * When a value is omitted, calculation uses the upper end of the range as a
 * conservative default and records that decision in the result.
 */

export type BqMode = 'basic' | 'underground' | 'foundation' | 'slope'
export type BqGradeId = 'I' | 'II' | 'III' | 'IV' | 'V'
export type BqIssueSeverity = 'error' | 'warning'

export interface LocalizedText {
  zh: string
  en: string
}

export interface BqSourceMetadata {
  id: string
  title: LocalizedText
  edition: string
  clauses: string[]
  sourceNote: LocalizedText
}

export interface BqCoefficientRange {
  min: number
  max: number
}

export interface BqCoefficientOption {
  id: string
  label: LocalizedText
  range: BqCoefficientRange
  sourceRef: string
  note?: LocalizedText
}

export interface BqBandCoefficient {
  grade: BqGradeId
  range: BqCoefficientRange
}

export interface BqBandCoefficientOption {
  id: string
  label: LocalizedText
  values: readonly BqBandCoefficient[]
  sourceRef: string
  note?: LocalizedText
}

export interface BqFactorOption {
  id: string
  label: LocalizedText
  influence: LocalizedText
  condition: LocalizedText
  value: number
  sourceRef: string
}

export interface BqFormState {
  mode: BqMode
  /** Saturated uniaxial compressive strength, MPa. */
  rc: number | null
  /** Rock-mass integrity index. */
  kv: number | null
  /** UI workflow progress for the optional underground correction stage. */
  correctionStep?: number

  undergroundWaterId: string
  /** Underground engineering surrounding-rock fissure water pressure, MPa. */
  groundwaterPressureP: number | null
  /** Water inflow per 10 m tunnel length, L/min·10m. */
  groundwaterInflowQ: number | null
  /** Recorded surrounding-rock strength to maximum stress ratio Rc/σmax. */
  undergroundStressRatio: number | null
  /** Legacy numeric f₀ from older case files; no longer used as the primary foundation input. */
  foundationF0: number | null
  /** Foundation class selected from qualitative characteristics (Table 4.1.1). */
  foundationGradeId: BqGradeId | null
  k1Value: number | null
  undergroundOrientationId: string
  k2Value: number | null
  undergroundStressId: string
  k3Value: number | null

  slopeWaterId: string
  /** Slope phreatic or confined water head pw, m. */
  slopeWaterHeadPw: number | null
  /** Slope height H, m. */
  slopeHeightH: number | null
  k4Value: number | null
  slopeStructureTypeId: string
  lambdaValue: number | null
  slopeF1Id: string | null
  slopeF2Id: string | null
  slopeF3Id: string | null
}

export interface BqValidationIssue {
  field: keyof BqFormState | 'form'
  code: string
  severity: BqIssueSeverity
  message: LocalizedText
}

export interface BqLimitationApplication {
  rule: 'none' | 'rc_limit' | 'kv_limit'
  applied: boolean
  before: { rc: number; kv: number }
  after: { rc: number; kv: number }
  formula: LocalizedText
}

export interface BqResolvedCoefficient {
  symbol: 'K1' | 'K2' | 'K3' | 'K4' | 'lambda'
  optionId: string
  label: LocalizedText
  range: BqCoefficientRange
  value: number
  usedConservativeDefault: boolean
  sourceRef: string
}

export interface BqSlopeFactors {
  f1: BqFactorOption
  f2: BqFactorOption
  f3: BqFactorOption
  k5: number
}

export interface BqGradeInfo {
  id: BqGradeId
  label: LocalizedText
  quality: LocalizedText
  qualitative: LocalizedText
  range: string
}

export interface BqResult {
  standard: BqSourceMetadata
  mode: BqMode
  original: { rc: number; kv: number }
  effective: { rc: number; kv: number }
  limitation: BqLimitationApplication
  basicBq: number
  corrections: {
    k1: BqResolvedCoefficient | null
    k2: BqResolvedCoefficient | null
    k3: BqResolvedCoefficient | null
    k4: BqResolvedCoefficient | null
    lambda: BqResolvedCoefficient | null
    slopeFactors: BqSlopeFactors | null
    deduction: number
  }
  engineeringBq: number
  grade: BqGradeInfo
  foundationGrade: BqFoundationGrade | null
  warnings: BqValidationIssue[]
  formula: LocalizedText
  sourceNote: LocalizedText
}

export interface BqDescriptionRow {
  key: string
  label: LocalizedText
  value: string
  basis: LocalizedText
}

export interface BqPointListEntry {
  label: string
  value: string
  grade: string
}

export class BqValidationError extends Error {
  readonly issues: BqValidationIssue[]

  constructor(issues: BqValidationIssue[]) {
    super(issues.map((issue) => issue.message.zh).join('；'))
    this.name = 'BqValidationError'
    this.issues = issues
  }
}

const text = (zh: string, en: string): LocalizedText => ({ zh, en })
const range = (min: number, max = min): BqCoefficientRange => ({ min, max })

/** Estimate saturated UCS from the point-load index corrected to a 50 mm diameter. */
export function estimateRcFromIs50(is50: number): number | null {
  if (!Number.isFinite(is50) || is50 < 0) return null
  return 22.82 * is50 ** 0.75
}

/** Estimate the rock-mass integrity index from longitudinal-wave velocities (km/s). */
export function estimateKvFromVelocities(vpm: number, vpr: number): number | null {
  if (!Number.isFinite(vpm) || !Number.isFinite(vpr) || vpm < 0 || vpr <= 0) return null
  return (vpm / vpr) ** 2
}

/** Resolve the standard Jv to Kv interval relationship and its midpoint. */
export function estimateKvFromJv(jv: number): (BqCoefficientRange & { value: number; label: string }) | null {
  if (!Number.isFinite(jv) || jv < 0) return null
  if (jv < 3) return { min: 0.75, max: 1, value: 0.875, label: '> 0.75' }
  if (jv < 10) return { min: 0.55, max: 0.75, value: 0.65, label: '0.55–0.75' }
  if (jv < 20) return { min: 0.35, max: 0.55, value: 0.45, label: '0.35–0.55' }
  if (jv < 35) return { min: 0.15, max: 0.35, value: 0.25, label: '0.15–0.35' }
  return { min: 0, max: 0.15, value: 0.075, label: '≤ 0.15' }
}

/** Interpolate a typed Jv value between the Kv boundaries in the standard table. */
export function interpolateKvFromJv(jv: number): (BqCoefficientRange & { value: number; label: string }) | null {
  if (!Number.isFinite(jv) || jv < 0) return null
  const anchors = [[0, 1], [3, 0.75], [10, 0.55], [20, 0.35], [35, 0.15]] as const
  if (jv >= 35) return { min: 0, max: 0.15, value: 0.15, label: '≤ 0.15（插值）' }
  let index = 0
  while (index < anchors.length - 2 && jv > anchors[index + 1][0]) index += 1
  const [x1, y1] = anchors[index]
  const [x2, y2] = anchors[index + 1]
  const value = y1 + ((jv - x1) / (x2 - x1)) * (y2 - y1)
  return { min: Math.min(y1, y2), max: Math.max(y1, y2), value, label: `${value.toFixed(3)}（线性插值）` }
}

export const BQ_STANDARD: BqSourceMetadata = {
  id: 'gbt-50218-2014',
  title: text('GB/T 50218-2014《工程岩体分级标准》', 'GB/T 50218-2014 Standard for engineering classification of rock mass'),
  edition: '2014',
  clauses: ['4.2.2', '5.2.2', '5.3.2'],
  sourceNote: text(
    '基本公式、两条限定及修正公式按 GB/T 50218-2014。表中区间保留为区间；缺少工程师指定值时采用区间上限作为保守计算值，并在结果中标记。',
    'The base formula, two limiting rules and correction equations follow GB/T 50218-2014. Tabulated ranges remain ranges; when an engineer-selected value is absent, the upper bound is used conservatively and flagged in the result.'
  ),
}

export const BQ_GRADES: readonly BqGradeInfo[] = [
  { id: 'I', label: text('I 级', 'Class I'), quality: text('岩体质量好', 'Good rock mass'), qualitative: text('坚硬岩，岩体完整', 'Hard rock, intact rock mass'), range: '>550' },
  { id: 'II', label: text('II 级', 'Class II'), quality: text('岩体质量较好', 'Fairly good rock mass'), qualitative: text('坚硬岩，岩体较完整；较坚硬岩，岩体完整', 'Hard rock, fairly intact rock mass; moderately hard rock, intact rock mass'), range: '450＜BQ≤550' },
  { id: 'III', label: text('III 级', 'Class III'), quality: text('岩体质量中等', 'Fair rock mass'), qualitative: text('坚硬岩，岩体较破碎；较坚硬岩，岩体较完整；较软岩，岩体完整', 'Hard rock, fairly broken rock mass; moderately hard rock, fairly intact rock mass; moderately soft rock, intact rock mass'), range: '350＜BQ≤450' },
  { id: 'IV', label: text('IV 级', 'Class IV'), quality: text('岩体质量较差', 'Poor rock mass'), qualitative: text('坚硬岩，岩体破碎；较坚硬岩，岩体较破碎～破碎；较软岩，岩体较完整～较破碎；软岩，岩体完整～较完整', 'Hard rock, broken rock mass; moderately hard rock, fairly broken to broken rock mass; moderately soft rock, fairly intact to fairly broken rock mass; soft rock, intact to fairly intact rock mass'), range: '250＜BQ≤350' },
  { id: 'V', label: text('V 级', 'Class V'), quality: text('岩体质量差', 'Very poor rock mass'), qualitative: text('较软岩，岩体破碎；软岩，岩体较破碎～破碎；全部极软岩及全部极破碎岩', 'Moderately soft rock, broken rock mass; soft rock, fairly broken to broken rock mass; all extremely soft rock and all extremely broken rock'), range: '≤250' },
]

export interface BqFoundationGrade {
  id: BqGradeId
  label: LocalizedText
  range: BqCoefficientRange
  displayRange: string
  mathRange: string
}

export const BQ_FOUNDATION_F0_GRADES: readonly BqFoundationGrade[] = [
  { id: 'I', label: text('I 级', 'Class I'), range: range(7, Number.POSITIVE_INFINITY), displayRange: 'f₀＞7.0', mathRange: 'f_0>7.0' },
  { id: 'II', label: text('II 级', 'Class II'), range: range(4, 7), displayRange: '4.0＜f₀≤7.0', mathRange: '4.0<f_0\\le 7.0' },
  { id: 'III', label: text('III 级', 'Class III'), range: range(2, 4), displayRange: '2.0＜f₀≤4.0', mathRange: '2.0<f_0\\le 4.0' },
  { id: 'IV', label: text('IV 级', 'Class IV'), range: range(0.5, 2), displayRange: '0.5＜f₀≤2.0', mathRange: '0.5<f_0\\le 2.0' },
  { id: 'V', label: text('V 级', 'Class V'), range: range(0, 0.5), displayRange: 'f₀≤0.5', mathRange: 'f_0\\le 0.5' },
]

export function foundationGradeFromF0(value: number): BqFoundationGrade {
  if (value > 7) return BQ_FOUNDATION_F0_GRADES[0]
  if (value > 4) return BQ_FOUNDATION_F0_GRADES[1]
  if (value > 2) return BQ_FOUNDATION_F0_GRADES[2]
  if (value > 0.5) return BQ_FOUNDATION_F0_GRADES[3]
  return BQ_FOUNDATION_F0_GRADES[4]
}

export function resolveFoundationGrade(state: Pick<BqFormState, 'foundationGradeId' | 'foundationF0'>): BqFoundationGrade | null {
  return BQ_FOUNDATION_F0_GRADES.find((item) => item.id === state.foundationGradeId)
    ?? (state.foundationF0 != null ? foundationGradeFromF0(state.foundationF0) : null)
}

const zeroBandValues: readonly BqBandCoefficient[] = BQ_GRADES.map(({ id: grade }) => ({ grade, range: range(0) }))

export const BQ_UNDERGROUND_WATER_OPTIONS: readonly BqBandCoefficientOption[] = [
  {
    id: 'none',
    label: text('无地下水修正', 'No groundwater correction'),
    values: zeroBandValues,
    sourceRef: 'GB/T 50218-2014 5.2.1（不触发地下水修正）',
  },
  {
    id: 'damp_or_drip',
    label: text('潮湿或点滴状出水，p≤0.1 或 Q≤25', 'Damp or dripping, p≤0.1 MPa or Q≤25'),
    values: [
      { grade: 'I', range: range(0) },
      { grade: 'II', range: range(0) },
      { grade: 'III', range: range(0, 0.1) },
      { grade: 'IV', range: range(0.2, 0.3) },
      { grade: 'V', range: range(0.4, 0.6) },
    ],
    sourceRef: 'GB/T 50218-2014 · 地下水影响修正系数',
  },
  {
    id: 'rain_or_linear_flow',
    label: text('淋雨状或线流状出水，0.1<p≤0.5 或 25<Q≤125', 'Rain-like or linear flow, 0.1<p≤0.5 MPa or 25<Q≤125'),
    values: [
      { grade: 'I', range: range(0, 0.1) },
      { grade: 'II', range: range(0.1, 0.2) },
      { grade: 'III', range: range(0.2, 0.3) },
      { grade: 'IV', range: range(0.4, 0.6) },
      { grade: 'V', range: range(0.7, 0.9) },
    ],
    sourceRef: 'GB/T 50218-2014 · 地下水影响修正系数',
  },
  {
    id: 'surging',
    label: text('涌流状出水，p>0.5 或 Q>125', 'Surging inflow, p>0.5 MPa or Q>125'),
    values: [
      { grade: 'I', range: range(0.1, 0.2) },
      { grade: 'II', range: range(0.2, 0.3) },
      { grade: 'III', range: range(0.4, 0.6) },
      { grade: 'IV', range: range(0.7, 0.9) },
      { grade: 'V', range: range(1) },
    ],
    sourceRef: 'GB/T 50218-2014 · 地下水影响修正系数',
  },
]

export interface BqGroundwaterAssessment {
  optionId: 'damp_or_drip' | 'rain_or_linear_flow' | 'surging'
  value: number
  severity: number
  source: 'input'
}

/**
 * Classify p/Q using the K1 table boundaries. When both values are supplied, the more
 * severe condition controls, matching the table's "or" wording.
 */
export function assessGroundwaterK1(
  pressureP: number | null,
  inflowQ: number | null,
  grade: BqGradeId
): BqGroundwaterAssessment | null {
  const finite = (value: number | null) => value != null && Number.isFinite(value) && value >= 0
  if (!finite(pressureP) && !finite(inflowQ)) return null
  const severityFor = (value: number | null, first: number, second: number) => {
    if (!finite(value)) return 0
    if ((value as number) <= first) return 0
    if ((value as number) <= second) return ((value as number) - first) / (second - first)
    return 2
  }
  const severity = Math.max(severityFor(pressureP, 0.1, 0.5), severityFor(inflowQ, 25, 125))
  const damp = BQ_UNDERGROUND_WATER_OPTIONS[1]
  const rain = BQ_UNDERGROUND_WATER_OPTIONS[2]
  const surge = BQ_UNDERGROUND_WATER_OPTIONS[3]
  const upperBound = (option: BqBandCoefficientOption) => {
    const selected = bandRange(option, grade)
    return selected.max
  }
  const value = severity === 0 ? upperBound(damp) : severity <= 1 ? upperBound(rain) : upperBound(surge)
  const optionId = severity <= 1 ? 'rain_or_linear_flow' : 'surging'
  return {
    optionId: severity === 0 ? 'damp_or_drip' : optionId,
    value,
    severity,
    source: 'input',
  }
}

export const BQ_UNDERGROUND_ORIENTATION_OPTIONS: readonly BqCoefficientOption[] = [
  {
    id: 'none',
    label: text('无一组起控制作用的主要结构面', 'No single controlling major discontinuity'),
    range: range(0),
    sourceRef: 'GB/T 50218-2014 5.2.1（不触发主要结构面修正）',
  },
  {
    id: 'axis_angle_lt30_dip_30_75',
    label: text('结构面走向与洞轴线夹角 α≤30°，倾角 β=30°～75°', 'Strike-to-axis angle α≤30°, dip β=30°–75°'),
    range: range(0.4, 0.6),
    sourceRef: 'GB/T 50218-2014 表 5.2.2-2',
  },
  {
    id: 'axis_angle_gt60_dip_gt75',
    label: text('结构面走向与洞轴线夹角 α＞60°，倾角 β＞75°', 'Strike-to-axis angle α>60°, dip β>75°'),
    range: range(0, 0.2),
    sourceRef: 'GB/T 50218-2014 表 5.2.2-2',
  },
  {
    id: 'other_combination',
    label: text('其他组合', 'Other orientation combinations'),
    range: range(0.2, 0.4),
    sourceRef: 'GB/T 50218-2014 表 5.2.2-2',
    note: text(
      '包括倾角 <30°（夹角任意）、倾角 >30°且夹角 30°–60°、倾角 30°–75°且夹角 >60°、倾角 >75°且夹角 <30°。',
      'Includes dip <30° at any axis angle, dip >30° with angle 30°–60°, dip 30°–75° with angle >60°, and dip >75° with angle <30°.'
    ),
  },
]

export const BQ_UNDERGROUND_STRESS_OPTIONS: readonly BqBandCoefficientOption[] = [
  {
    id: 'none_or_ratio_gt7',
    label: text('无初始应力修正或强度应力比 >7', 'No stress correction or strength-stress ratio >7'),
    values: zeroBandValues,
    sourceRef: 'GB/T 50218-2014 5.2.1、表 5.2.2-3 适用范围',
  },
  {
    id: 'ratio_lt4',
    label: text('围岩强度应力比 Rc/σmax <4', 'Rock strength-stress ratio Rc/σmax <4'),
    values: [
      { grade: 'I', range: range(1) },
      { grade: 'II', range: range(1) },
      { grade: 'III', range: range(1, 1.5) },
      { grade: 'IV', range: range(1, 1.5) },
      { grade: 'V', range: range(1) },
    ],
    sourceRef: 'GB/T 50218-2014 表 5.2.2-3',
  },
  {
    id: 'ratio_4_7',
    label: text('围岩强度应力比 4–7', 'Rock strength-stress ratio 4–7'),
    values: [
      { grade: 'I', range: range(0.5) },
      { grade: 'II', range: range(0.5) },
      { grade: 'III', range: range(0.5) },
      { grade: 'IV', range: range(0.5, 1) },
      { grade: 'V', range: range(0.5, 1) },
    ],
    sourceRef: 'GB/T 50218-2014 表 5.2.2-3',
  },
]

export const BQ_SLOPE_WATER_OPTIONS: readonly BqBandCoefficientOption[] = [
  {
    id: 'none',
    label: text('无边坡地下水修正', 'No slope groundwater correction'),
    values: zeroBandValues,
    sourceRef: 'GB/T 50218-2014 5.3.1（不触发地下水修正）',
  },
  {
    id: 'damp_or_drip',
    label: text('潮湿或点滴状出水（pw≤0.2H）', 'Damp or dripping (pw≤0.2H)'),
    values: [
      { grade: 'I', range: range(0) },
      { grade: 'II', range: range(0) },
      { grade: 'III', range: range(0, 0.1) },
      { grade: 'IV', range: range(0.2, 0.3) },
      { grade: 'V', range: range(0.4, 0.6) },
    ],
    sourceRef: 'GB/T 50218-2014 表 5.3.2-2',
  },
  {
    id: 'linear_flow',
    label: text('线流状出水（0.2H＜pw≤0.5H）', 'Linear flow (0.2H<pw≤0.5H)'),
    values: [
      { grade: 'I', range: range(0, 0.1) },
      { grade: 'II', range: range(0.1, 0.2) },
      { grade: 'III', range: range(0.2, 0.3) },
      { grade: 'IV', range: range(0.4, 0.6) },
      { grade: 'V', range: range(0.7, 0.9) },
    ],
    sourceRef: 'GB/T 50218-2014 表 5.3.2-2',
  },
  {
    id: 'surging',
    label: text('涌流状出水（pw＞0.5H）', 'Surging inflow (pw>0.5H)'),
    values: [
      { grade: 'I', range: range(0.1, 0.2) },
      { grade: 'II', range: range(0.2, 0.3) },
      { grade: 'III', range: range(0.4, 0.6) },
      { grade: 'IV', range: range(0.7, 0.9) },
      { grade: 'V', range: range(1) },
    ],
    sourceRef: 'GB/T 50218-2014 表 5.3.2-2',
  },
]

export interface BqSlopeWaterAssessment {
  optionId: 'damp_or_drip' | 'linear_flow' | 'surging'
  value: number
  ratio: number
  source: 'input'
}

export function assessSlopeK4(waterHeadPw: number | null, slopeHeightH: number | null, grade: BqGradeId): BqSlopeWaterAssessment | null {
  if (waterHeadPw == null || slopeHeightH == null || !Number.isFinite(waterHeadPw) || !Number.isFinite(slopeHeightH) || waterHeadPw < 0 || slopeHeightH <= 0) return null
  const ratio = waterHeadPw / slopeHeightH
  const optionId = ratio <= 0.2 ? 'damp_or_drip' : ratio <= 0.5 ? 'linear_flow' : 'surging'
  const option = BQ_SLOPE_WATER_OPTIONS.find((item) => item.id === optionId) as BqBandCoefficientOption
  return { optionId, value: bandRange(option, grade).max, ratio, source: 'input' }
}

export const BQ_SLOPE_LAMBDA_OPTIONS: readonly BqCoefficientOption[] = [
  {
    id: 'none',
    label: text('无控制性结构面修正', 'No controlling discontinuity correction'),
    range: range(0),
    sourceRef: 'GB/T 50218-2014 5.3.1（不触发结构面修正）',
  },
  {
    id: 'fault_or_interlayer_mud',
    label: text('断层、泥夹层', 'Fault or mud-filled interlayer'),
    range: range(1),
    sourceRef: 'GB/T 50218-2014 表 5.3.2-1',
  },
  {
    id: 'bedding_or_persistent_joint',
    label: text('层面、贯通性较好的节理和裂隙', 'Bedding planes or well-persistent joints and fissures'),
    range: range(0.8, 0.9),
    sourceRef: 'GB/T 50218-2014 表 5.3.2-1',
  },
  {
    id: 'joint_set_or_fissure',
    label: text('断续节理和裂隙', 'Non-persistent joints and fissures'),
    range: range(0.6, 0.7),
    sourceRef: 'GB/T 50218-2014 表 5.3.2-1',
  },
]

export const BQ_SLOPE_F1_OPTIONS: readonly BqFactorOption[] = [
  { id: 'gt30', label: text('结构面倾向与边坡坡面倾向夹角＞30°', 'Dip-direction angle >30°'), influence: text('轻微', 'Slight'), condition: text('＞30', '>30'), value: 0.15, sourceRef: 'GB/T 50218-2014 表 5.3.2-3' },
  { id: '20_30', label: text('结构面倾向与边坡坡面倾向夹角 30°～20°', 'Dip-direction angle 30°–20°'), influence: text('较小', 'Small'), condition: text('30～20', '30–20'), value: 0.4, sourceRef: 'GB/T 50218-2014 表 5.3.2-3' },
  { id: '10_20', label: text('结构面倾向与边坡坡面倾向夹角 20°～10°', 'Dip-direction angle 20°–10°'), influence: text('中等', 'Medium'), condition: text('20～10', '20–10'), value: 0.7, sourceRef: 'GB/T 50218-2014 表 5.3.2-3' },
  { id: '5_10', label: text('结构面倾向与边坡坡面倾向夹角 10°～5°', 'Dip-direction angle 10°–5°'), influence: text('显著', 'Significant'), condition: text('10～5', '10–5'), value: 0.85, sourceRef: 'GB/T 50218-2014 表 5.3.2-3' },
  { id: 'le5', label: text('结构面倾向与边坡坡面倾向夹角≤5°', 'Dip-direction angle ≤5°'), influence: text('很显著', 'Very significant'), condition: text('≤5', '≤5'), value: 1, sourceRef: 'GB/T 50218-2014 表 5.3.2-3' },
]

export const BQ_SLOPE_F2_OPTIONS: readonly BqFactorOption[] = [
  { id: 'lt20', label: text('结构面倾角＜20°', 'Discontinuity dip <20°'), influence: text('轻微', 'Slight'), condition: text('＜20', '<20'), value: 0.15, sourceRef: 'GB/T 50218-2014 表 5.3.2-3' },
  { id: '20_30', label: text('结构面倾角 20°～30°', 'Discontinuity dip 20°–30°'), influence: text('较小', 'Small'), condition: text('20～30', '20–30'), value: 0.4, sourceRef: 'GB/T 50218-2014 表 5.3.2-3' },
  { id: '30_35', label: text('结构面倾角 30°～35°', 'Discontinuity dip 30°–35°'), influence: text('中等', 'Medium'), condition: text('30～35', '30–35'), value: 0.7, sourceRef: 'GB/T 50218-2014 表 5.3.2-3' },
  { id: '35_45', label: text('结构面倾角 35°～45°', 'Discontinuity dip 35°–45°'), influence: text('显著', 'Significant'), condition: text('35～45', '35–45'), value: 0.85, sourceRef: 'GB/T 50218-2014 表 5.3.2-3' },
  { id: 'ge45', label: text('结构面倾角≥45°', 'Discontinuity dip ≥45°'), influence: text('很显著', 'Very significant'), condition: text('≥45', '≥45'), value: 1, sourceRef: 'GB/T 50218-2014 表 5.3.2-3' },
]

export const BQ_SLOPE_F3_OPTIONS: readonly BqFactorOption[] = [
  { id: 'gt10', label: text('结构面倾角与边坡坡角之差＞10°', 'Discontinuity dip minus slope dip >10°'), influence: text('轻微', 'Slight'), condition: text('＞10', '>10'), value: 0, sourceRef: 'GB/T 50218-2014 表 5.3.2-3' },
  { id: '0_10', label: text('结构面倾角与边坡坡角之差 10°～0°', 'Discontinuity dip minus slope dip 10°–0°'), influence: text('较小', 'Small'), condition: text('10～0', '10–0'), value: 0.2, sourceRef: 'GB/T 50218-2014 表 5.3.2-3' },
  { id: 'zero', label: text('结构面倾角与边坡坡角之差＝0°', 'Discontinuity dip minus slope dip =0°'), influence: text('中等', 'Medium'), condition: text('0', '0'), value: 0.8, sourceRef: 'GB/T 50218-2014 表 5.3.2-3' },
  { id: 'minus10_0', label: text('结构面倾角与边坡坡角之差 0°～−10°', 'Discontinuity dip minus slope dip 0° to −10°'), influence: text('显著', 'Significant'), condition: text('0～−10', '0 to −10'), value: 2, sourceRef: 'GB/T 50218-2014 表 5.3.2-3' },
  { id: 'le_minus10', label: text('结构面倾角与边坡坡角之差≤−10°', 'Discontinuity dip minus slope dip ≤−10°'), influence: text('很显著', 'Very significant'), condition: text('≤−10', '≤−10'), value: 2.5, sourceRef: 'GB/T 50218-2014 表 5.3.2-3' },
]

export const createInitialBqState = (): BqFormState => ({
  mode: 'basic',
  rc: null,
  kv: null,
  correctionStep: 0,
  undergroundWaterId: 'none',
  groundwaterPressureP: null,
  groundwaterInflowQ: null,
  undergroundStressRatio: null,
  foundationF0: null,
  foundationGradeId: null,
  k1Value: null,
  undergroundOrientationId: 'none',
  k2Value: null,
  undergroundStressId: 'none_or_ratio_gt7',
  k3Value: null,
  slopeWaterId: 'none',
  slopeWaterHeadPw: null,
  slopeHeightH: null,
  k4Value: null,
  slopeStructureTypeId: 'none',
  lambdaValue: null,
  slopeF1Id: null,
  slopeF2Id: null,
  slopeF3Id: null,
})

export const initialBqFormState = createInitialBqState

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function finiteNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isFinite(parsed) ? parsed : null
}

function knownId<T extends { id: string }>(value: unknown, options: readonly T[], fallback: string): string {
  return typeof value === 'string' && options.some((option) => option.id === value) ? value : fallback
}

function nullableKnownId<T extends { id: string }>(value: unknown, options: readonly T[]): string | null {
  return typeof value === 'string' && options.some((option) => option.id === value) ? value : null
}

export function normalizeBqState(value: unknown): BqFormState {
  const raw = asRecord(value)
  const initial = createInitialBqState()
  return {
    mode: raw.mode === 'underground' || raw.mode === 'foundation' || raw.mode === 'slope' || raw.mode === 'basic' ? raw.mode : initial.mode,
    rc: finiteNumber(raw.rc ?? raw.Rc),
    kv: finiteNumber(raw.kv ?? raw.Kv),
    correctionStep: Math.min(4, Math.max(0, Math.trunc(finiteNumber(raw.correctionStep) ?? initial.correctionStep ?? 0))),
    undergroundWaterId: knownId(raw.undergroundWaterId, BQ_UNDERGROUND_WATER_OPTIONS, initial.undergroundWaterId),
    groundwaterPressureP: finiteNumber(raw.groundwaterPressureP ?? raw.p),
    groundwaterInflowQ: finiteNumber(raw.groundwaterInflowQ ?? raw.Q),
    undergroundStressRatio: finiteNumber(raw.undergroundStressRatio ?? raw.stressRatio),
    foundationF0: finiteNumber(raw.foundationF0 ?? raw.f0),
    foundationGradeId: nullableKnownId(raw.foundationGradeId, BQ_FOUNDATION_F0_GRADES) as BqGradeId | null,
    k1Value: finiteNumber(raw.k1Value),
    undergroundOrientationId: knownId(
      raw.undergroundOrientationId,
      BQ_UNDERGROUND_ORIENTATION_OPTIONS,
      initial.undergroundOrientationId
    ),
    k2Value: finiteNumber(raw.k2Value),
    undergroundStressId: knownId(raw.undergroundStressId, BQ_UNDERGROUND_STRESS_OPTIONS, initial.undergroundStressId),
    k3Value: finiteNumber(raw.k3Value),
    slopeWaterId: knownId(raw.slopeWaterId, BQ_SLOPE_WATER_OPTIONS, initial.slopeWaterId),
    slopeWaterHeadPw: finiteNumber(raw.slopeWaterHeadPw ?? raw.pw),
    slopeHeightH: finiteNumber(raw.slopeHeightH ?? raw.H),
    k4Value: finiteNumber(raw.k4Value),
    slopeStructureTypeId: knownId(raw.slopeStructureTypeId, BQ_SLOPE_LAMBDA_OPTIONS, initial.slopeStructureTypeId),
    lambdaValue: finiteNumber(raw.lambdaValue),
    slopeF1Id: nullableKnownId(raw.slopeF1Id, BQ_SLOPE_F1_OPTIONS),
    slopeF2Id: nullableKnownId(raw.slopeF2Id, BQ_SLOPE_F2_OPTIONS),
    slopeF3Id: nullableKnownId(raw.slopeF3Id, BQ_SLOPE_F3_OPTIONS),
  }
}

function gradeFromBq(value: number): BqGradeInfo {
  if (value > 550) return BQ_GRADES[0]
  if (value > 450) return BQ_GRADES[1]
  if (value > 350) return BQ_GRADES[2]
  if (value > 250) return BQ_GRADES[3]
  return BQ_GRADES[4]
}

function bandRange(option: BqBandCoefficientOption, grade: BqGradeId): BqCoefficientRange {
  return option.values.find((item) => item.grade === grade)?.range ?? range(0)
}

function issue(
  field: BqValidationIssue['field'],
  code: string,
  severity: BqIssueSeverity,
  zh: string,
  en: string
): BqValidationIssue {
  return { field, code, severity, message: text(zh, en) }
}

function validateCoefficient(
  issues: BqValidationIssue[],
  field: keyof BqFormState,
  value: number | null,
  expected: BqCoefficientRange,
  symbol: string,
  allowEmpty = false
) {
  if (value == null) {
    if (allowEmpty) return
    if (expected.max !== 0) {
      issues.push(
        issue(
          field,
          'conservative_default',
          'warning',
          `${symbol} 未指定区间内采用值，计算将保守采用上限 ${expected.max}。`,
          `${symbol} has no engineer-selected value; the upper bound ${expected.max} will be used conservatively.`
        )
      )
    }
    return
  }
  if (value < expected.min || value > expected.max) {
    issues.push(
      issue(
        field,
        'outside_table_range',
        'error',
        `${symbol} 应位于所选表项区间 ${expected.min}–${expected.max}。`,
        `${symbol} must be within the selected table-cell range ${expected.min}–${expected.max}.`
      )
    )
  }
}

export function validateBqState(input: BqFormState | unknown): BqValidationIssue[] {
  const state = normalizeBqState(input)
  const issues: BqValidationIssue[] = []
  if (state.rc == null) issues.push(issue('rc', 'required', 'error', '请输入岩石饱和单轴抗压强度 Rc。', 'Enter saturated UCS Rc.'))
  else if (state.rc < 0) issues.push(issue('rc', 'out_of_range', 'error', 'Rc 不得小于 0 MPa。', 'Rc must not be below 0 MPa.'))
  if (state.kv == null) issues.push(issue('kv', 'required', 'error', '请输入岩体完整性指数 Kv。', 'Enter rock-mass integrity index Kv.'))
  else if (state.kv < 0 || state.kv > 1) issues.push(issue('kv', 'out_of_range', 'error', 'Kv 必须位于 0–1。', 'Kv must be between 0 and 1.'))
  if (state.groundwaterPressureP != null && state.groundwaterPressureP < 0) issues.push(issue('groundwaterPressureP', 'out_of_range', 'error', '地下水裂隙水压 p 不得小于 0 MPa。', 'Groundwater pressure p must not be below 0 MPa.'))
  if (state.groundwaterInflowQ != null && state.groundwaterInflowQ < 0) issues.push(issue('groundwaterInflowQ', 'out_of_range', 'error', '每 10 m 洞长出水量 Q 不得小于 0。', 'Groundwater inflow Q must not be below 0.'))
  if (state.foundationF0 != null && state.foundationF0 < 0) issues.push(issue('foundationF0', 'out_of_range', 'error', '岩体基岩承载力基本值 f₀ 不得小于 0 MPa。', 'Foundation bedrock basic bearing capacity f₀ must not be below 0 MPa.'))
  if (state.slopeWaterHeadPw != null && state.slopeWaterHeadPw < 0) issues.push(issue('slopeWaterHeadPw', 'out_of_range', 'error', '边坡地下水水头 pw 不得小于 0 m。', 'Slope water head pw must not be below 0 m.'))
  if (state.slopeHeightH != null && state.slopeHeightH <= 0) issues.push(issue('slopeHeightH', 'out_of_range', 'error', '边坡高度 H 必须大于 0 m。', 'Slope height H must be greater than 0 m.'))
  if (issues.some((item) => item.severity === 'error')) return issues

  const limited = applyBqLimitations(state.rc as number, state.kv as number)
  const basicGrade = gradeFromBq(100 + 3 * limited.after.rc + 250 * limited.after.kv).id

  if (state.mode === 'underground') {
    const water = BQ_UNDERGROUND_WATER_OPTIONS.find((item) => item.id === state.undergroundWaterId) as BqBandCoefficientOption
    const orientation = BQ_UNDERGROUND_ORIENTATION_OPTIONS.find(
      (item) => item.id === state.undergroundOrientationId
    ) as BqCoefficientOption
    const stress = BQ_UNDERGROUND_STRESS_OPTIONS.find((item) => item.id === state.undergroundStressId) as BqBandCoefficientOption
    if (state.groundwaterPressureP != null || state.groundwaterInflowQ != null) {
      if (state.k1Value != null && (state.k1Value < 0 || state.k1Value > 1)) {
        issues.push(issue('k1Value', 'out_of_range', 'error', '按 p/Q 插值得到的 K1 必须位于 0–1。', 'The p/Q-interpolated K1 must be between 0 and 1.'))
      }
    } else {
      validateCoefficient(issues, 'k1Value', state.k1Value, bandRange(water, basicGrade), 'K1', true)
    }
    validateCoefficient(issues, 'k2Value', state.k2Value, orientation.range, 'K2', true)
    validateCoefficient(issues, 'k3Value', state.k3Value, bandRange(stress, basicGrade), 'K3', true)
  }

  if (state.mode === 'foundation' && state.foundationGradeId == null && state.foundationF0 == null) {
    issues.push(issue('foundationGradeId', 'required', 'error', '请根据岩体基本质量的定性特征选择等级。', 'Select a class from the qualitative characteristics of rock-mass basic quality.'))
  }

  if (state.mode === 'slope') {
    const water = BQ_SLOPE_WATER_OPTIONS.find((item) => item.id === state.slopeWaterId) as BqBandCoefficientOption
    const structure = BQ_SLOPE_LAMBDA_OPTIONS.find((item) => item.id === state.slopeStructureTypeId) as BqCoefficientOption
    if (state.slopeWaterHeadPw != null && state.slopeHeightH != null) {
      if (state.k4Value != null && (state.k4Value < 0 || state.k4Value > 1)) {
        issues.push(issue('k4Value', 'out_of_range', 'error', '按 pw/H 判定得到的 K4 必须位于 0–1。', 'The pw/H-assessed K4 must be between 0 and 1.'))
      }
    } else {
      validateCoefficient(issues, 'k4Value', state.k4Value, bandRange(water, basicGrade), 'K4', true)
    }
    validateCoefficient(issues, 'lambdaValue', state.lambdaValue, structure.range, 'λ', true)
    if (structure.id !== 'none') {
      if (!state.slopeF1Id) issues.push(issue('slopeF1Id', 'required', 'warning', '请点选结构面倾向与边坡坡面倾向夹角 F1。', 'Select F1 for the dip-direction relationship.'))
      if (!state.slopeF2Id) issues.push(issue('slopeF2Id', 'required', 'warning', '请点选结构面倾角 F2。', 'Select F2 for discontinuity dip.'))
      if (!state.slopeF3Id) issues.push(issue('slopeF3Id', 'required', 'warning', '请点选结构面倾角与边坡坡角之差 F3。', 'Select F3 for the dip-to-slope-angle difference.'))
    }
  }
  return issues
}

function round(value: number, digits = 3) {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export function applyBqLimitations(rc: number, kv: number): BqLimitationApplication {
  if (rc > 90 * kv + 30) {
    const limitedRc = 90 * kv + 30
    return {
      rule: 'rc_limit',
      applied: true,
      before: { rc, kv },
      after: { rc: limitedRc, kv },
      formula: text('Rc > 90Kv + 30，按 Rc = 90Kv + 30 代入。', 'Rc > 90Kv + 30; substitute Rc = 90Kv + 30.'),
    }
  }
  if (kv > 0.04 * rc + 0.4) {
    const limitedKv = 0.04 * rc + 0.4
    return {
      rule: 'kv_limit',
      applied: true,
      before: { rc, kv },
      after: { rc, kv: limitedKv },
      formula: text('Kv > 0.04Rc + 0.4，按 Kv = 0.04Rc + 0.4 代入。', 'Kv > 0.04Rc + 0.4; substitute Kv = 0.04Rc + 0.4.'),
    }
  }
  return {
    rule: 'none',
    applied: false,
    before: { rc, kv },
    after: { rc, kv },
    formula: text('Rc、Kv 不触发限定条件，采用实测值。', 'Rc and Kv do not trigger a limiting rule; measured values are used.'),
  }
}

function resolveCoefficient(
  symbol: BqResolvedCoefficient['symbol'],
  option: BqCoefficientOption,
  selected: number | null
): BqResolvedCoefficient {
  return {
    symbol,
    optionId: option.id,
    label: option.label,
    range: option.range,
    value: selected ?? option.range.max,
    usedConservativeDefault: selected == null && option.range.max !== 0,
    sourceRef: option.sourceRef,
  }
}

function resolveBandCoefficient(
  symbol: BqResolvedCoefficient['symbol'],
  option: BqBandCoefficientOption,
  grade: BqGradeId,
  selected: number | null
): BqResolvedCoefficient {
  const selectedRange = bandRange(option, grade)
  return {
    symbol,
    optionId: option.id,
    label: option.label,
    range: selectedRange,
    value: selected ?? selectedRange.max,
    usedConservativeDefault: selected == null && selectedRange.max !== 0,
    sourceRef: option.sourceRef,
  }
}

function requiredFactor(id: string | null, options: readonly BqFactorOption[]): BqFactorOption {
  return options.find((option) => option.id === id) as BqFactorOption
}

export function calculateBq(input: BqFormState | unknown): BqResult {
  const state = normalizeBqState(input)
  const issues = validateBqState(state)
  const errors = issues.filter((item) => item.severity === 'error')
  if (errors.length > 0) throw new BqValidationError(errors)

  const limitation = applyBqLimitations(state.rc as number, state.kv as number)
  const basicBq = 100 + 3 * limitation.after.rc + 250 * limitation.after.kv
  const baseGrade = gradeFromBq(basicBq)
  let engineeringBq = basicBq
  let deduction = 0
  let k1: BqResolvedCoefficient | null = null
  let k2: BqResolvedCoefficient | null = null
  let k3: BqResolvedCoefficient | null = null
  let k4: BqResolvedCoefficient | null = null
  let lambda: BqResolvedCoefficient | null = null
  let slopeFactors: BqSlopeFactors | null = null
  let formula = text('BQ = 100 + 3Rc + 250Kv', 'BQ = 100 + 3Rc + 250Kv')

  if (state.mode === 'underground') {
    const water = BQ_UNDERGROUND_WATER_OPTIONS.find((item) => item.id === state.undergroundWaterId) as BqBandCoefficientOption
    const orientation = BQ_UNDERGROUND_ORIENTATION_OPTIONS.find(
      (item) => item.id === state.undergroundOrientationId
    ) as BqCoefficientOption
    const stress = BQ_UNDERGROUND_STRESS_OPTIONS.find((item) => item.id === state.undergroundStressId) as BqBandCoefficientOption
    k1 = resolveBandCoefficient('K1', water, baseGrade.id, state.k1Value ?? bandRange(water, baseGrade.id).max)
    k2 = resolveCoefficient('K2', orientation, state.k2Value ?? orientation.range.max)
    const k3Default = bandRange(stress, baseGrade.id).min
    k3 = resolveBandCoefficient('K3', stress, baseGrade.id, state.k3Value ?? k3Default)
    deduction = 100 * (k1.value + k2.value + k3.value)
    engineeringBq = basicBq - deduction
    formula = text('[BQ] = BQ - 100(K1 + K2 + K3)', '[BQ] = BQ - 100(K1 + K2 + K3)')
  }

  if (state.mode === 'slope') {
    const water = BQ_SLOPE_WATER_OPTIONS.find((item) => item.id === state.slopeWaterId) as BqBandCoefficientOption
    const structure = BQ_SLOPE_LAMBDA_OPTIONS.find((item) => item.id === state.slopeStructureTypeId) as BqCoefficientOption
    k4 = resolveBandCoefficient('K4', water, baseGrade.id, state.k4Value)
    lambda = resolveCoefficient('lambda', structure, state.lambdaValue)
    const k5 = structure.id !== 'none' && state.slopeF1Id && state.slopeF2Id && state.slopeF3Id
      ? (() => {
          const f1 = requiredFactor(state.slopeF1Id, BQ_SLOPE_F1_OPTIONS)
          const f2 = requiredFactor(state.slopeF2Id, BQ_SLOPE_F2_OPTIONS)
          const f3 = requiredFactor(state.slopeF3Id, BQ_SLOPE_F3_OPTIONS)
          const value = f1.value * f2.value * f3.value
          slopeFactors = { f1, f2, f3, k5: value }
          return value
        })()
      : (() => {
          const neutral: BqFactorOption = {
            id: 'not_applicable',
            label: text('不适用', 'Not applicable'),
            influence: text('—', '—'),
            condition: text('—', '—'),
            value: 0,
            sourceRef: 'GB/T 50218-2014 5.3.1',
          }
          slopeFactors = { f1: neutral, f2: neutral, f3: neutral, k5: 0 }
          return 0
        })()
    deduction = 100 * (k4.value + lambda.value * k5)
    engineeringBq = basicBq - deduction
    formula = text('[BQ] = BQ - 100(K4 + λK5)，K5 = F1 × F2 × F3', '[BQ] = BQ - 100(K4 + λK5), K5 = F1 × F2 × F3')
  }

  const foundationGrade = state.mode === 'foundation' ? resolveFoundationGrade(state) : null
  const evaluationGrade = foundationGrade
    ? BQ_GRADES.find((item) => item.id === foundationGrade.id) as BqGradeInfo
    : gradeFromBq(engineeringBq)

  return {
    standard: BQ_STANDARD,
    mode: state.mode,
    original: { rc: state.rc as number, kv: state.kv as number },
    effective: { rc: round(limitation.after.rc), kv: round(limitation.after.kv) },
    limitation,
    basicBq: round(basicBq),
    corrections: { k1, k2, k3, k4, lambda, slopeFactors, deduction: round(deduction) },
    engineeringBq: round(engineeringBq),
    grade: evaluationGrade,
    foundationGrade,
    warnings: issues.filter((item) => item.severity === 'warning'),
    formula,
    sourceNote: BQ_STANDARD.sourceNote,
  }
}

function coefficientValue(coefficient: BqResolvedCoefficient | null): string {
  if (!coefficient) return '—'
  const suffix = coefficient.usedConservativeDefault ? '（采用区间上限）' : ''
  return `${coefficient.value}${suffix}`
}

export function describeBq(input: BqFormState | unknown, suppliedResult?: BqResult): BqDescriptionRow[] {
  const state = normalizeBqState(input)
  const result = suppliedResult ?? calculateBq(input)
  const rows: BqDescriptionRow[] = [
    {
      key: 'mode',
      label: text('计算模式', 'Calculation mode'),
      value: result.mode === 'basic' ? '基本 BQ' : result.mode === 'underground' ? '地下工程' : result.mode === 'foundation' ? '地基工程' : '边坡工程',
      basis: text('按工程场景选择适用修正公式', 'Applicable correction formula selected by engineering scenario'),
    },
    {
      key: 'rc',
      label: text('岩石饱和单轴抗压强度 Rc', 'Saturated UCS Rc'),
      value: `${result.original.rc} MPa`,
      basis: result.limitation.rule === 'rc_limit' ? result.limitation.formula : text('实测输入', 'Measured input'),
    },
    {
      key: 'kv',
      label: text('岩体完整性指数 Kv', 'Rock-mass integrity index Kv'),
      value: String(result.original.kv),
      basis: result.limitation.rule === 'kv_limit' ? result.limitation.formula : text('实测输入', 'Measured input'),
    },
    {
      key: 'limitation',
      label: text('规范限定', 'Code limitation'),
      value:
        result.limitation.rule === 'none'
          ? '未触发'
          : result.limitation.rule === 'rc_limit'
            ? 'Rc 已按 90Kv + 30 限定'
            : 'Kv 已按 0.04Rc + 0.4 限定',
      basis: result.limitation.formula,
    },
    {
      key: 'effectiveRc',
      label: text('有效 Rc', 'Effective Rc'),
      value: `${result.effective.rc} MPa`,
      basis: text('用于 BQ 计算的 Rc', 'Rc used for BQ calculation'),
    },
    {
      key: 'effectiveKv',
      label: text('有效 Kv', 'Effective Kv'),
      value: String(result.effective.kv),
      basis: text('用于 BQ 计算的 Kv', 'Kv used for BQ calculation'),
    },
    {
      key: 'basicBq',
      label: text('岩体基本质量指标 BQ', 'Basic quality index BQ'),
      value: String(result.basicBq),
      basis: text('BQ = 100 + 3Rc + 250Kv（采用限定后的有效 Rc、Kv）', 'BQ = 100 + 3Rc + 250Kv using limited effective Rc and Kv'),
    },
  ]
  if (result.mode === 'foundation' && result.foundationGrade) {
    rows.push(
      {
        key: 'grade',
        label: text('修正 BQ（地基工程岩体级别）', 'Corrected BQ (foundation rock-mass class)'),
        value: result.foundationGrade.label.zh,
        basis: text('按表 4.1.1 岩体基本质量的定性特征选定', 'Selected from Table 4.1.1 qualitative characteristics'),
      },
      {
        key: 'foundationF0',
        label: text('基岩承载力基本值 f₀', 'Basic bedrock bearing capacity f₀'),
        value: `${result.foundationGrade.displayRange} MPa`,
        basis: text('GB/T 50218-2014 表 5.4.2', 'GB/T 50218-2014 Table 5.4.2'),
      }
    )
    return rows
  }
  for (const coefficient of [result.corrections.k1, result.corrections.k2, result.corrections.k3, result.corrections.k4, result.corrections.lambda]) {
    if (!coefficient) continue
    rows.push({
      key: coefficient.symbol,
      label: text(`修正系数 ${coefficient.symbol}`, `Correction coefficient ${coefficient.symbol}`),
      value: coefficientValue(coefficient),
      basis: coefficient.label,
    })
  }
  if (result.corrections.slopeFactors) {
    const factors = result.corrections.slopeFactors
    rows.push({
      key: 'K5',
      label: text('边坡结构面产状修正系数 K5', 'Slope discontinuity-orientation coefficient K5'),
      value: String(round(factors.k5)),
      basis: text(
        `F1 ${factors.f1.value} × F2 ${factors.f2.value} × F3 ${factors.f3.value}`,
        `F1 ${factors.f1.value} × F2 ${factors.f2.value} × F3 ${factors.f3.value}`
      ),
    })
  }
  rows.push({
    key: 'engineeringBq',
    label: text('工程岩体质量指标 [BQ]', 'Engineering rock-mass quality index [BQ]'),
    value: String(result.engineeringBq),
    basis: result.formula,
  })
  rows.push({
    key: 'grade',
    label: text('岩体级别', 'Rock-mass class'),
    value: result.grade.label.zh,
    basis: text(`GB/T 50218-2014 表 4.1.1，${result.grade.range}`, `GB/T 50218-2014 Table 4.1.1, ${result.grade.range}`),
  })
  return rows
}

function formatBqNumber(value: number): string {
  return String(Number(value.toFixed(1)))
}

export function formatBqPointList(input: BqFormState | unknown, language: 'zh' | 'en' = 'zh'): BqPointListEntry[] {
  const state = normalizeBqState(input)
  const basic = calculateBq({ ...state, mode: 'basic' })
  const gradeLabel = (grade: { label: LocalizedText }) => grade.label[language]
  const entries: BqPointListEntry[] = [
    { label: 'BQ', value: formatBqNumber(basic.basicBq), grade: gradeLabel(basic.grade) },
  ]
  const undergroundReady = state.mode === 'underground' && (state.correctionStep ?? 0) >= 4
  if (undergroundReady || state.mode === 'slope') {
    const full = calculateBq(state)
    entries.push({ label: '[BQ]', value: formatBqNumber(full.engineeringBq), grade: gradeLabel(full.grade) })
  }
  if (state.mode === 'foundation') {
    const foundation = resolveFoundationGrade(state)
    if (foundation) {
      entries.push({
        label: language === 'en' ? 'Corrected BQ' : '修正 BQ',
        value: '',
        grade: foundation.label[language],
      })
    }
  }
  return entries
}

export const createInitial = createInitialBqState
export const normalize = normalizeBqState
export const validate = validateBqState
export const calculate = calculateBq
export const describe = describeBq
