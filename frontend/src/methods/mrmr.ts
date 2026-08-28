import type { RmrFormState } from '../utils/rmrCalc'

export interface MrmrOption {
  id: string
  label: string
  labelEn: string
  value: number
  sourceRef: string
}

export interface MrmrWaterOption {
  id: string
  label: string
  labelEn: string
  minPercent: number
  maxPercent: number
  sourceRef: string
}

export type MrmrFractureVeinMode = 'none' | 'measured'
export type MrmrJointSetCount = '1' | '2' | '3_plus'
export type MrmrWeatheringExposure = '6m' | '1y' | '2y' | '3y' | '4y_plus'
export type MrmrScenarioId = 'underground_roadway' | 'underground_stope' | 'other'

export interface MrmrApplicability {
  scenarioId: MrmrScenarioId | null
  jointedRockMass: boolean | null
  irsBasisConfirmed: boolean
  jointSpacingBasisConfirmed: boolean
  jointConditionBasisConfirmed: boolean
  groundwaterBasisConfirmed: boolean
  miningEnvironmentBasisConfirmed: boolean
}

export interface MrmrFormState {
  irsMpa?: number | null
  sizeAdjustmentPercent?: number | null
  fractureVeinMode: MrmrFractureVeinMode
  mohsHardness: number | null
  fractureVeinFrequencyPerM: number | null
  jointSpacingM: number | null
  jointSetCount: MrmrJointSetCount | null
  jointConditionId: string | null
  weatheringConditionId: string | null
  weatheringExposureId: MrmrWeatheringExposure | null
  miningMethodId?: string | null
  stressId: string | null
  blastingId: string | null
  waterId: string | null
  waterFactorPercent: number | null
  applicability?: MrmrApplicability
  source?: MrmrSourceMetadata
  /** Deprecated in-memory aliases; never written by the v3 file contract. */
  correctedIrsMpa?: number | null
  orientationId?: string | null
}

export interface MrmrSourceMetadata {
  methodId: 'rmr'
  caseName: string
  pointName: string
  oreType?: string
  note?: string
  inferredFields: string[]
  waterReference?: {
    criterion: 'inflow' | 'pressure' | 'condition'
    value?: number | null
    optionId?: string | null
  }
}

export interface MrmrHandoff {
  form: MrmrFormState
  source: MrmrSourceMetadata
}

/** Backwards-compatible name for callers compiled against the first handoff implementation. */
export type MrmrPrefill = MrmrHandoff

export interface MrmrResult {
  irsMpa: number
  sizeAdjustmentPercent: number
  sizeAdjustedIrsMpa: number
  fractureVeinIndex: number
  fractureVeinFactor: number
  rbsMpa: number
  rbsRating: number
  jointSpacingRating: number
  jointConditionRating: number
  irmr: number
  weatheringFactor: number
  miningMethodFactor: number
  stressFactor: number
  blastingFactor: number
  waterFactor: number
  adjustmentCandidates: { id: string; label: string; labelEn: string; factor: number }[]
  controllingAdjustment: { id: string; label: string; labelEn: string; factor: number }
  mrmr: number
  grade: { id: string; label: string; labelEn: string }
  formula: string
  /** Deprecated aliases retained for report compatibility. */
  correctedIrsMpa: number
  orientationFactor: number
  governingAdjustment: { id: string; label: string; labelEn: string; factor: number }
}

const option = (id: string, label: string, labelEn: string, value: number, sourceRef: string): MrmrOption => ({
  id,
  label,
  labelEn,
  value,
  sourceRef,
})

export const MRMR_STANDARD = {
  id: 'laubscher-jakubec-2001-mrmr-v2',
  title: 'Laubscher/Jakubec IRMR-MRMR',
  titleEn: 'Laubscher/Jakubec IRMR-MRMR',
  edition: '2001 · Chapter 57',
  source: 'Laubscher, D.H. & Jakubec, J. (2001), The MRMR Rock Mass Classification for Jointed Rock Masses, pp. 475-481',
  sourceEn: 'Laubscher, D.H. & Jakubec, J. (2001), The MRMR Rock Mass Classification for Jointed Rock Masses, pp. 475-481',
}

export const MRMR_MINING_METHOD_OPTIONS: readonly MrmrOption[] = [
  option('none', '常规地下采矿方式，无额外采矿方式修正', 'Conventional underground mining; no extra method adjustment', 1, 'Engineering control case'),
  option('room_and_pillar', '房柱法', 'Room and pillar', 0.9, 'Engineering control case'),
  option('longhole_stoping', '深孔 / 分段采矿', 'Longhole / sublevel stoping', 0.8, 'Engineering control case'),
  option('caving', '崩落法 / 采矿方式不利影响', 'Caving / adverse mining-method effect', 0.7, 'Engineering control range 70%-100%'),
]

export const MRMR_JOINT_SET_OPTIONS = [
  { id: '1', label: '1 组开放节理', labelEn: 'One open-joint set' },
  { id: '2', label: '2 组开放节理', labelEn: 'Two open-joint sets' },
  { id: '3_plus', label: '3 组及以上开放节理', labelEn: 'Three or more open-joint sets' },
] as const

// Table 57.1 gives each observation as a percentage of the 40-point JC maximum.
export const MRMR_JOINT_OPTIONS: readonly MrmrOption[] = [
  option('large_wavy_multi', '大尺度波状、多向起伏', 'Large-scale wavy, multidirectional', 40, 'Table 57.1 A, p. 477 · 100% of 40'),
  option('large_wavy_single', '大尺度波状、单向起伏', 'Large-scale wavy, unidirectional', 38, 'Table 57.1 A, p. 477 · 95% of 40'),
  option('large_curved', '大尺度弯曲', 'Large-scale curved', 36, 'Table 57.1 A, p. 477 · 90% of 40'),
  option('large_straight', '大尺度平直、轻微起伏', 'Large-scale straight, slight undulation', 34, 'Table 57.1 A, p. 477 · 85% of 40'),
  option('small_rough_stepped', '小尺度粗糙阶梯状 / 不规则', 'Small-scale rough stepped / irregular', 38, 'Table 57.1 B, p. 477 · 95% of 40'),
  option('small_smooth_stepped', '小尺度光滑阶梯状', 'Small-scale smooth stepped', 36, 'Table 57.1 B, p. 477 · 90% of 40'),
  option('small_slick_stepped', '小尺度镜面阶梯状', 'Small-scale slickensided stepped', 34, 'Table 57.1 B, p. 477 · 85% of 40'),
  option('small_rough_undulating', '小尺度粗糙起伏状', 'Small-scale rough undulating', 32, 'Table 57.1 B, p. 477 · 80% of 40'),
  option('small_smooth_undulating', '小尺度光滑起伏状', 'Small-scale smooth undulating', 30, 'Table 57.1 B, p. 477 · 75% of 40'),
  option('small_slick_undulating', '小尺度镜面起伏状', 'Small-scale slickensided undulating', 28, 'Table 57.1 B, p. 477 · 70% of 40'),
  option('small_rough_planar', '小尺度粗糙平直', 'Small-scale rough planar', 26, 'Table 57.1 B, p. 477 · 65% of 40'),
  option('small_smooth_planar', '小尺度光滑平直', 'Small-scale smooth planar', 24, 'Table 57.1 B, p. 477 · 60% of 40'),
  option('small_polished', '小尺度抛光面', 'Small-scale polished', 22, 'Table 57.1 B, p. 477 · 55% of 40'),
  option('wall_alteration', '节理壁蚀变弱于围岩或充填物', 'Joint-wall alteration weaker than sidewall/filling', 30, 'Table 57.1 C, p. 477 · 75% of 40'),
  option('gouge_thin', '断层泥厚度小于起伏幅度', 'Gouge thinner than joint amplitudes', 24, 'Table 57.1 D, p. 477 · 60% of 40'),
  option('gouge_thick', '断层泥厚度大于起伏幅度', 'Gouge thicker than joint amplitudes', 12, 'Table 57.1 D, p. 477 · 30% of 40'),
  option('cemented_h5', '胶结 / 充填节理，莫氏硬度 5', 'Cemented/filled joint, Mohs hardness 5', 38, 'Table 57.1 E, p. 477 · 95% of 40'),
  option('cemented_h4', '胶结 / 充填节理，莫氏硬度 4', 'Cemented/filled joint, Mohs hardness 4', 36, 'Table 57.1 E, p. 477 · 90% of 40'),
  option('cemented_h3', '胶结 / 充填节理，莫氏硬度 3', 'Cemented/filled joint, Mohs hardness 3', 34, 'Table 57.1 E, p. 477 · 85% of 40'),
  option('cemented_h2', '胶结 / 充填节理，莫氏硬度 2', 'Cemented/filled joint, Mohs hardness 2', 32, 'Table 57.1 E, p. 477 · 80% of 40'),
  option('cemented_h1', '胶结 / 充填节理，莫氏硬度 1', 'Cemented/filled joint, Mohs hardness 1', 30, 'Table 57.1 E, p. 477 · 75% of 40'),
]

export const MRMR_WEATHERING_CONDITIONS = [
  { id: 'fresh', label: '新鲜', labelEn: 'Fresh', values: [100, 100, 100, 100, 100] },
  { id: 'slight', label: '轻微风化', labelEn: 'Slightly weathered', values: [88, 90, 92, 94, 96] },
  { id: 'moderate', label: '中等风化', labelEn: 'Moderately weathered', values: [82, 84, 86, 88, 90] },
  { id: 'high', label: '强风化', labelEn: 'Highly weathered', values: [70, 72, 74, 76, 78] },
  { id: 'complete', label: '完全风化', labelEn: 'Completely weathered', values: [54, 56, 58, 60, 62] },
  { id: 'residual_soil', label: '残积土', labelEn: 'Residual soil', values: [30, 32, 34, 36, 38] },
] as const

export const MRMR_WEATHERING_EXPOSURES = [
  { id: '6m', label: '6 个月', labelEn: '6 months' },
  { id: '1y', label: '1 年', labelEn: '1 year' },
  { id: '2y', label: '2 年', labelEn: '2 years' },
  { id: '3y', label: '3 年', labelEn: '3 years' },
  { id: '4y_plus', label: '4 年及以上', labelEn: '4+ years' },
] as const

interface MrmrOrientationOption {
  id: string
  label: string
  labelEn: string
  factorsByJointBand?: readonly [number, number, number]
  fixedPercent?: number
  sourceRef: string
}

export const MRMR_ORIENTATION_OPTIONS: readonly MrmrOrientationOption[] = [
  { id: 'none', label: '无控制性不利组合', labelEn: 'No controlling adverse combination', fixedPercent: 100, sourceRef: 'Neutral engineering case' },
  { id: 'block_3_3', label: '块体由 3 个节理面限定，3 个面偏离铅直', labelEn: '3 defining joints; 3 faces inclined from vertical', factorsByJointBand: [70, 80, 95], sourceRef: 'Table 57.3, p. 479' },
  { id: 'block_3_2', label: '块体由 3 个节理面限定，2 个面偏离铅直', labelEn: '3 defining joints; 2 faces inclined from vertical', factorsByJointBand: [80, 90, 95], sourceRef: 'Table 57.3, p. 479' },
  { id: 'block_4_4', label: '块体由 4 个节理面限定，4 个面偏离铅直', labelEn: '4 defining joints; 4 faces inclined from vertical', factorsByJointBand: [70, 80, 90], sourceRef: 'Table 57.3, p. 479' },
  { id: 'block_4_3', label: '块体由 4 个节理面限定，3 个面偏离铅直', labelEn: '4 defining joints; 3 faces inclined from vertical', factorsByJointBand: [75, 80, 95], sourceRef: 'Table 57.3, p. 479' },
  { id: 'block_4_2', label: '块体由 4 个节理面限定，2 个面偏离铅直', labelEn: '4 defining joints; 2 faces inclined from vertical', factorsByJointBand: [85, 90, 95], sourceRef: 'Table 57.3, p. 479' },
  { id: 'block_5_5', label: '块体由 5 个节理面限定，5 个面偏离铅直', labelEn: '5 defining joints; 5 faces inclined from vertical', factorsByJointBand: [70, 75, 80], sourceRef: 'Table 57.3, p. 479' },
  { id: 'block_5_4', label: '块体由 5 个节理面限定，4 个面偏离铅直', labelEn: '5 defining joints; 4 faces inclined from vertical', factorsByJointBand: [75, 80, 85], sourceRef: 'Table 57.3, p. 479' },
  { id: 'block_5_3', label: '块体由 5 个节理面限定，3 个面偏离铅直', labelEn: '5 defining joints; 3 faces inclined from vertical', factorsByJointBand: [80, 85, 90], sourceRef: 'Table 57.3, p. 479' },
  { id: 'block_5_2', label: '块体由 5 个节理面限定，2 个面偏离铅直', labelEn: '5 defining joints; 2 faces inclined from vertical', factorsByJointBand: [85, 90, 95], sourceRef: 'Table 57.3, p. 479' },
  { id: 'block_5_1', label: '块体由 5 个节理面限定，1 个面偏离铅直（高 JC 按中性）', labelEn: '5 defining joints; 1 face inclined (high-JC cell treated as neutral)', factorsByJointBand: [90, 95, 100], sourceRef: 'Table 57.3, p. 479; blank high-JC cell treated as neutral 100%' },
  { id: 'shear_0_15', label: '剪切带与巷道夹角 0°～15°', labelEn: 'Shear zone 0°-15° to development', fixedPercent: 76, sourceRef: 'Section 57.7.3, p. 479' },
  { id: 'shear_16_45', label: '剪切带与巷道夹角 16°～45°', labelEn: 'Shear zone 16°-45° to development', fixedPercent: 84, sourceRef: 'Section 57.7.3, p. 479' },
  { id: 'shear_46_75', label: '剪切带与巷道夹角 46°～75°', labelEn: 'Shear zone 46°-75° to development', fixedPercent: 92, sourceRef: 'Section 57.7.3, p. 479' },
  { id: 'advance_into_dip', label: '掘进方向顺节理倾向', labelEn: 'Advance into joint-set dip', fixedPercent: 90, sourceRef: 'Section 57.7.3, p. 479' },
]

// Section 57.7.4 supplies a range and case anchors, not a universal stress lookup table.
export const MRMR_STRESS_OPTIONS: readonly MrmrOption[] = [
  option('beneficial_confinement', '有利压应力约束（原文章节上限）', 'Beneficial compressive confinement (chapter upper bound)', 1.2, 'Section 57.7.4, p. 479 · 120% case anchor'),
  option('neutral', '无显著采矿诱发应力修正', 'No significant mining-induced stress adjustment', 1, 'Neutral engineering case'),
  option('low_angle_failure', '低角度应力导致剪切破坏（原文示例）', 'Low-angle stress causing shear failure (source example)', 0.7, 'Section 57.7.4, p. 479 · 70% case anchor'),
  option('high_stress_failure', '高应力引发岩体破坏（工程下限）', 'High stress causing rock-mass failure (engineering lower bound)', 0.2, 'Engineering control range 20%-120%'),
]

export const MRMR_BLASTING_OPTIONS: readonly MrmrOption[] = [
  option('boring', '机械掘进 / 钻进', 'Boring / mechanical excavation', 1, 'Table 57.4, p. 479 · 100%'),
  option('smooth_wall', '光面爆破', 'Smooth-wall blasting', 0.97, 'Table 57.4, p. 479 · 97%'),
  option('good_conventional', '良好常规爆破', 'Good conventional blasting', 0.94, 'Table 57.4, p. 479 · 94%'),
  option('poor', '较差爆破', 'Poor blasting', 0.8, 'Table 57.4, p. 479 · 80%'),
]

export const MRMR_WATER_OPTIONS: readonly MrmrWaterOption[] = [
  { id: 'dry', label: '干燥 / 有利排水', labelEn: 'Dry / favourable drainage', minPercent: 100, maxPercent: 110, sourceRef: 'Engineering control range 70%-110%' },
  { id: 'moist', label: '潮湿', labelEn: 'Moist', minPercent: 90, maxPercent: 100, sourceRef: 'Engineering control range 70%-110%' },
  { id: 'moderate_pressure', label: '中等水压 1～5 MPa，25～125 L/m', labelEn: 'Moderate pressure 1-5 MPa; 25-125 L/m', minPercent: 80, maxPercent: 90, sourceRef: 'Engineering control range 70%-110%' },
  { id: 'high_pressure', label: '高水压 >5 MPa，>125 L/m', labelEn: 'High pressure >5 MPa; >125 L/m', minPercent: 70, maxPercent: 80, sourceRef: 'Engineering control range 70%-110%' },
]

const FRACTURE_VEIN_CURVE: readonly [number, number][] = [
  [0, 1], [0.1, 1], [0.2, 0.95], [0.4, 0.9], [1, 0.85], [2, 0.8], [4, 0.75], [10, 0.7], [20, 0.65], [40, 0.6],
]

// Figure 57.5 is a graph, not a tabulated equation. These knots digitize the published curve.
const RBS_RATING_CURVE: readonly [number, number][] = [
  [0, 0], [10, 5], [20, 9], [30, 12], [40, 14.5], [50, 16], [60, 17.5], [80, 19.5], [100, 21], [120, 22.3], [140, 23.7], [160, 25],
]

// Figure 57.6 is likewise digitized. The explicit 0.5 m / two-set value of 23 follows the worked text on p. 477.
const JOINT_SPACING_CURVES: Record<MrmrJointSetCount, readonly [number, number][]> = {
  '1': [[0.1, 9], [0.2, 16], [0.3, 20.5], [0.5, 27], [0.7, 29.5], [1, 32], [2, 35], [5, 35]],
  '2': [[0.1, 5], [0.2, 12], [0.3, 16.5], [0.5, 23], [0.7, 26], [1, 29], [2, 33], [3, 35], [5, 35]],
  '3_plus': [[0.1, 0], [0.2, 7], [0.3, 11], [0.5, 17.5], [0.65, 21], [0.7, 21.5], [1, 25], [2, 30], [3, 32.5], [4, 34], [5, 35]],
}

function interpolate(curve: readonly [number, number][], value: number) {
  if (value <= curve[0][0]) return curve[0][1]
  for (let index = 1; index < curve.length; index += 1) {
    const [rightX, rightY] = curve[index]
    const [leftX, leftY] = curve[index - 1]
    if (value <= rightX) {
      const ratio = (value - leftX) / (rightX - leftX)
      return leftY + ratio * (rightY - leftY)
    }
  }
  return curve[curve.length - 1][1]
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value)
  return null
}

function knownId(raw: unknown, options: readonly { id: string }[]) {
  return typeof raw === 'string' && options.some((item) => item.id === raw) ? raw : null
}

export function createInitialMrmrState(): MrmrFormState {
  return {
    irsMpa: null,
    sizeAdjustmentPercent: null,
    fractureVeinMode: 'none',
    mohsHardness: null,
    fractureVeinFrequencyPerM: null,
    jointSpacingM: null,
    jointSetCount: null,
    jointConditionId: null,
    weatheringConditionId: null,
    weatheringExposureId: null,
    miningMethodId: null,
    stressId: null,
    blastingId: null,
    waterId: null,
    waterFactorPercent: null,
    applicability: {
      scenarioId: null,
      jointedRockMass: null,
      irsBasisConfirmed: false,
      jointSpacingBasisConfirmed: false,
      jointConditionBasisConfirmed: false,
      groundwaterBasisConfirmed: false,
      miningEnvironmentBasisConfirmed: false,
    },
  }
}

function waterReferenceFromRmr(state: RmrFormState): MrmrSourceMetadata['waterReference'] {
  const criterion = state.a5Criterion ?? 'condition'
  if (criterion === 'inflow') return { criterion, value: state.a5InflowValue, optionId: state.a5OptionId }
  if (criterion === 'pressure') return { criterion, value: state.a5PressureValue, optionId: state.a5OptionId }
  return { criterion, optionId: state.a5OptionId }
}

/** Carry only raw values that are directly equivalent between RMR and MRMR. */
export function buildMrmrHandoffFromRmr(
  state: RmrFormState,
  pointMeta: Pick<MrmrSourceMetadata, 'caseName' | 'pointName' | 'oreType' | 'note'>,
): MrmrHandoff {
  const inferredFields: string[] = []
  const source: MrmrSourceMetadata = {
    methodId: 'rmr' as const,
    ...pointMeta,
    inferredFields,
    waterReference: waterReferenceFromRmr(state),
  }
  const form = createInitialMrmrState()

  if (state.a1Mode === 'ucs' && state.a1UcsValue != null && state.a1UcsValue > 0) form.irsMpa = state.a1UcsValue
  else inferredFields.push('irsMpa')
  if (state.a3SpacingValue != null && state.a3SpacingValue > 0) form.jointSpacingM = state.a3SpacingValue / 100
  else inferredFields.push('jointSpacingM')
  inferredFields.push(
    'sizeAdjustmentPercent',
    'fractureVeinMode',
    'mohsHardness',
    'fractureVeinFrequencyPerM',
    'jointSetCount',
    'jointConditionId',
    'weatheringConditionId',
    'weatheringExposureId',
    'miningMethodId',
    'stressId',
    'blastingId',
    'waterId',
    'waterFactorPercent',
    'applicability',
  )
  form.source = source
  return { form, source }
}

export const buildMrmrPrefillFromRmr = buildMrmrHandoffFromRmr

export function normalizeMrmrState(raw: unknown): MrmrFormState {
  const value = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const legacy = Object.prototype.hasOwnProperty.call(value, 'correctedIrsMpa') || Object.prototype.hasOwnProperty.call(value, 'orientationId')
  const fractureVeinMode = value.fractureVeinMode === 'measured' ? 'measured' : 'none'
  const rawApplicability = value.applicability && typeof value.applicability === 'object' ? value.applicability as Record<string, unknown> : null
  const applicability: MrmrApplicability = {
    scenarioId: rawApplicability?.scenarioId === 'underground_roadway' || rawApplicability?.scenarioId === 'underground_stope' || rawApplicability?.scenarioId === 'other'
      ? rawApplicability.scenarioId
      : null,
    jointedRockMass: typeof rawApplicability?.jointedRockMass === 'boolean' ? rawApplicability.jointedRockMass : null,
    irsBasisConfirmed: rawApplicability?.irsBasisConfirmed === true,
    jointSpacingBasisConfirmed: rawApplicability?.jointSpacingBasisConfirmed === true,
    jointConditionBasisConfirmed: rawApplicability?.jointConditionBasisConfirmed === true,
    groundwaterBasisConfirmed: rawApplicability?.groundwaterBasisConfirmed === true,
    miningEnvironmentBasisConfirmed: rawApplicability?.miningEnvironmentBasisConfirmed === true,
  }
  const state: MrmrFormState = {
    irsMpa: asNumber(value.irsMpa ?? value.correctedIrsMpa),
    sizeAdjustmentPercent: asNumber(value.sizeAdjustmentPercent) ?? (legacy && value.correctedIrsMpa != null ? 80 : null),
    fractureVeinMode,
    mohsHardness: asNumber(value.mohsHardness),
    fractureVeinFrequencyPerM: asNumber(value.fractureVeinFrequencyPerM),
    jointSpacingM: asNumber(value.jointSpacingM),
    jointSetCount: knownId(value.jointSetCount, MRMR_JOINT_SET_OPTIONS) as MrmrJointSetCount | null,
    jointConditionId: knownId(value.jointConditionId, MRMR_JOINT_OPTIONS),
    weatheringConditionId: knownId(value.weatheringConditionId, MRMR_WEATHERING_CONDITIONS),
    weatheringExposureId: knownId(value.weatheringExposureId, MRMR_WEATHERING_EXPOSURES) as MrmrWeatheringExposure | null,
    miningMethodId: knownId(value.miningMethodId ?? value.orientationId, [...MRMR_MINING_METHOD_OPTIONS, ...MRMR_ORIENTATION_OPTIONS]),
    stressId: knownId(value.stressId, MRMR_STRESS_OPTIONS),
    blastingId: knownId(value.blastingId, MRMR_BLASTING_OPTIONS),
    waterId: knownId(value.waterId, MRMR_WATER_OPTIONS),
    waterFactorPercent: asNumber(value.waterFactorPercent),
    applicability: legacy && !rawApplicability ? {
      scenarioId: 'underground_roadway',
      jointedRockMass: true,
      irsBasisConfirmed: true,
      jointSpacingBasisConfirmed: true,
      jointConditionBasisConfirmed: true,
      groundwaterBasisConfirmed: true,
      miningEnvironmentBasisConfirmed: true,
    } : applicability,
  }
  const source = value.source && typeof value.source === 'object'
      ? (() => {
          const source = value.source as Record<string, unknown>
          return source.methodId === 'rmr' && typeof source.caseName === 'string' && typeof source.pointName === 'string'
            ? {
                methodId: 'rmr' as const,
                caseName: source.caseName,
                pointName: source.pointName,
                oreType: typeof source.oreType === 'string' ? source.oreType : undefined,
                note: typeof source.note === 'string' ? source.note : undefined,
                inferredFields: Array.isArray(source.inferredFields) ? source.inferredFields.filter((item): item is string => typeof item === 'string') : [],
                waterReference: source.waterReference && typeof source.waterReference === 'object'
                  ? {
                      criterion: ((source.waterReference as Record<string, unknown>).criterion === 'pressure'
                        ? 'pressure'
                        : (source.waterReference as Record<string, unknown>).criterion === 'condition'
                          ? 'condition'
                          : 'inflow') as 'inflow' | 'pressure' | 'condition',
                      value: asNumber((source.waterReference as Record<string, unknown>).value),
                      optionId: typeof (source.waterReference as Record<string, unknown>).optionId === 'string' ? (source.waterReference as Record<string, unknown>).optionId as string : null,
                    }
                  : undefined,
              }
            : undefined
        })()
      : undefined
  if (source) state.source = source
  return state
}

export function validateMrmrState(raw: unknown) {
  const state = normalizeMrmrState(raw)
  const issues: { field: string; message: string; messageEn: string }[] = []
  const add = (field: string, message: string, messageEn: string) => issues.push({ field, message, messageEn })

  if (state.irsMpa == null || state.irsMpa <= 0) add('irsMpa', '请输入大于 0 的完整岩石强度 IRS。', 'Enter an intact rock strength IRS greater than 0.')
  if (state.sizeAdjustmentPercent == null || state.sizeAdjustmentPercent <= 0 || state.sizeAdjustmentPercent > 100) add('sizeAdjustmentPercent', '请输入 0～100% 的尺寸 / 块内裂隙修正值。', 'Enter a size / in-block fracture adjustment from 0 to 100%.')
  if (state.fractureVeinMode === 'measured') {
    if (state.mohsHardness == null || !Number.isInteger(state.mohsHardness) || state.mohsHardness < 1 || state.mohsHardness > 5) add('mohsHardness', '莫氏硬度应为 1～5 的整数。', 'Mohs hardness must be an integer from 1 to 5.')
    if (state.fractureVeinFrequencyPerM == null || state.fractureVeinFrequencyPerM < 0) add('fractureVeinFrequencyPerM', '请输入不小于 0 的裂隙 / 脉体频率。', 'Enter a non-negative fracture/vein frequency.')
  }
  if (state.jointSpacingM == null || state.jointSpacingM < 0.1 || state.jointSpacingM > 5) add('jointSpacingM', '节理间距应在图 57.6 的 0.1～5 m 范围内。', 'Joint spacing must be within the Figure 57.6 range of 0.1-5 m.')
  if (!state.jointSetCount) add('jointSetCount', '请选择开放节理组数。', 'Select the number of open-joint sets.')
  if (!state.jointConditionId) add('jointConditionId', '请按表 57.1 选择控制结构面条件。', 'Select the controlling joint condition from Table 57.1.')
  if (!state.weatheringConditionId) add('weatheringConditionId', '请选择潜在风化程度。', 'Select potential weathering.')
  if (!state.weatheringExposureId) add('weatheringExposureId', '请选择暴露时间。', 'Select the exposure period.')
  if (!state.miningMethodId) add('miningMethodId', '请选择采矿方式控制情景。', 'Select the mining-method control case.')
  if (!state.stressId) add('stressId', '请选择与应力分析相符的诱发应力情景。', 'Select the induced-stress case supported by the stress assessment.')
  if (!state.blastingId) add('blastingId', '请按表 57.4 选择开挖 / 爆破方式。', 'Select excavation/blasting from Table 57.4.')
  const water = MRMR_WATER_OPTIONS.find((item) => item.id === state.waterId)
  if (!water) {
    add('waterId', '请按表 57.5 选择水条件。', 'Select the water condition from Table 57.5.')
  } else if (state.waterFactorPercent == null || state.waterFactorPercent < water.minPercent || state.waterFactorPercent > water.maxPercent) {
    add('waterFactorPercent', `水修正取值应在 ${water.minPercent}%～${water.maxPercent}% 内。`, `Water adjustment must be within ${water.minPercent}%-${water.maxPercent}%.`)
  }
  const app = state.applicability ?? createInitialMrmrState().applicability!
  if (app.scenarioId !== 'underground_roadway' && app.scenarioId !== 'underground_stope') add('applicability', 'MRMR 仅适用于地下采矿巷道或采场。', 'MRMR is limited to underground mining roadways or stopes.')
  if (app.jointedRockMass !== true) add('applicability', '必须确认岩体属于节理发育岩体。', 'Confirm that the rock mass is jointed.')
  if (!app.irsBasisConfirmed || !app.jointSpacingBasisConfirmed || !app.jointConditionBasisConfirmed || !app.groundwaterBasisConfirmed || !app.miningEnvironmentBasisConfirmed) {
    add('applicability', '请确认 IRS、节理间距、结构面条件、地下水和采矿环境资料均有工程依据。', 'Confirm engineering basis for IRS, joint spacing, joint condition, groundwater and mining-environment data.')
  }
  return issues
}

function required<T>(value: T | null | undefined, message: string): T {
  if (value == null) throw new Error(message)
  return value
}

function weatheringFactor(conditionId: string, exposureId: MrmrWeatheringExposure) {
  const condition = required(MRMR_WEATHERING_CONDITIONS.find((item) => item.id === conditionId), 'MRMR 风化输入不完整。')
  const index = MRMR_WEATHERING_EXPOSURES.findIndex((item) => item.id === exposureId)
  return condition.values[index] / 100
}

function miningMethodFactor(miningMethodId: string, jointConditionRating: number) {
  const method = MRMR_MINING_METHOD_OPTIONS.find((item) => item.id === miningMethodId)
  if (method) return method.value
  const legacyOrientation = required(MRMR_ORIENTATION_OPTIONS.find((item) => item.id === miningMethodId), 'MRMR 采矿方式输入不完整。')
  if (legacyOrientation.fixedPercent != null) return legacyOrientation.fixedPercent / 100
  const band = jointConditionRating <= 15 ? 0 : jointConditionRating <= 30 ? 1 : 2
  return required(legacyOrientation.factorsByJointBand, 'MRMR 采矿方式表缺少分档。')[band] / 100
}

export function classifyMrmr(score: number) {
  return score > 80
    ? { id: '1', label: '1 类 · 81～100', labelEn: 'Class 1 · 81-100' }
    : score > 60
      ? { id: '2', label: '2 类 · 61～80', labelEn: 'Class 2 · 61-80' }
      : score > 40
        ? { id: '3', label: '3 类 · 41～60', labelEn: 'Class 3 · 41-60' }
        : score > 20
          ? { id: '4', label: '4 类 · 21～40', labelEn: 'Class 4 · 21-40' }
          : { id: '5', label: '5 类 · 0～20', labelEn: 'Class 5 · 0-20' }
}

export function calculateMrmr(raw: unknown): MrmrResult {
  const state = normalizeMrmrState(raw)
  const issues = validateMrmrState(state)
  if (issues.length) {
    const applicabilityIssue = issues.find((issue) => issue.field === 'applicability')
    throw new Error(applicabilityIssue ? `MRMR 适用性判断失败：${applicabilityIssue.message}` : issues[0].message)
  }

  const irsMpa = required(state.irsMpa, 'MRMR IRS 输入不完整。')
  const sizeAdjustmentPercent = required(state.sizeAdjustmentPercent, 'MRMR 尺寸修正输入不完整。')
  const fractureVeinIndex = state.fractureVeinMode === 'measured'
    ? required(state.fractureVeinFrequencyPerM, 'MRMR 裂隙频率输入不完整。') / required(state.mohsHardness, 'MRMR 莫氏硬度输入不完整。')
    : 0
  const fractureVeinFactor = interpolate(FRACTURE_VEIN_CURVE, fractureVeinIndex)
  const sizeAdjustedIrsMpa = irsMpa * sizeAdjustmentPercent / 100
  const rbsMpa = sizeAdjustedIrsMpa * fractureVeinFactor
  const rbsRating = interpolate(RBS_RATING_CURVE, rbsMpa)
  const jointSpacingRating = interpolate(JOINT_SPACING_CURVES[required(state.jointSetCount, 'MRMR 节理组数输入不完整。')], required(state.jointSpacingM, 'MRMR 节理间距输入不完整。'))
  const jointCondition = required(MRMR_JOINT_OPTIONS.find((item) => item.id === state.jointConditionId), 'MRMR 结构面条件输入不完整。')
  const jointConditionRating = jointCondition.value
  const irmr = Math.min(100, rbsRating + jointSpacingRating + jointConditionRating)

  const weathering = weatheringFactor(required(state.weatheringConditionId, 'MRMR 风化输入不完整。'), required(state.weatheringExposureId, 'MRMR 暴露时间输入不完整。'))
  const miningMethod = miningMethodFactor(required(state.miningMethodId, 'MRMR 采矿方式输入不完整。'), jointConditionRating)
  const stress = required(MRMR_STRESS_OPTIONS.find((item) => item.id === state.stressId), 'MRMR 应力输入不完整。')
  const blasting = required(MRMR_BLASTING_OPTIONS.find((item) => item.id === state.blastingId), 'MRMR 爆破输入不完整。')
  required(MRMR_WATER_OPTIONS.find((item) => item.id === state.waterId), 'MRMR 水条件输入不完整。')
  const waterFactor = required(state.waterFactorPercent, 'MRMR 水修正输入不完整。') / 100
  const factors = [
    { id: 'weathering', label: '风化', labelEn: 'Weathering', factor: weathering },
    { id: 'mining_method', label: '采矿方式', labelEn: 'Mining method', factor: miningMethod },
    { id: 'stress', label: '诱发应力', labelEn: 'Induced stress', factor: stress.value },
    { id: 'blasting', label: '爆破 / 开挖', labelEn: 'Blasting / excavation', factor: blasting.value },
    { id: 'water', label: '水', labelEn: 'Water', factor: waterFactor },
  ]
  const adverse = factors.filter((item) => item.factor < 1)
  const controllingAdjustment = adverse.length
    ? adverse.reduce((lowest, item) => item.factor < lowest.factor ? item : lowest)
    : factors.reduce((highest, item) => item.factor > highest.factor ? item : highest)
  const mrmr = Math.max(0, Math.min(100, irmr * controllingAdjustment.factor))
  const grade = classifyMrmr(mrmr)

  return {
    irsMpa,
    sizeAdjustmentPercent,
    sizeAdjustedIrsMpa,
    fractureVeinIndex,
    fractureVeinFactor,
    rbsMpa,
    rbsRating,
    jointSpacingRating,
    jointConditionRating,
    irmr,
    weatheringFactor: weathering,
    miningMethodFactor: miningMethod,
    stressFactor: stress.value,
    orientationFactor: miningMethod,
    blastingFactor: blasting.value,
    waterFactor,
    adjustmentCandidates: factors,
    controllingAdjustment,
    governingAdjustment: controllingAdjustment,
    correctedIrsMpa: irsMpa,
    mrmr,
    grade,
    formula: `MRMR（IRMR × 控制因素）= ${irmr.toFixed(1)} × ${controllingAdjustment.factor.toFixed(2)}（采用：${controllingAdjustment.label}）= ${mrmr.toFixed(1)}`,
  }
}

export function describeMrmr(raw: unknown) {
  const state = normalizeMrmrState(raw)
  const jointSet = MRMR_JOINT_SET_OPTIONS.find((item) => item.id === state.jointSetCount)
  const joint = MRMR_JOINT_OPTIONS.find((item) => item.id === state.jointConditionId)
  const weathering = MRMR_WEATHERING_CONDITIONS.find((item) => item.id === state.weatheringConditionId)
  const exposure = MRMR_WEATHERING_EXPOSURES.find((item) => item.id === state.weatheringExposureId)
  const miningMethod = MRMR_MINING_METHOD_OPTIONS.find((item) => item.id === state.miningMethodId)
    ?? MRMR_ORIENTATION_OPTIONS.find((item) => item.id === state.miningMethodId)
  const stress = MRMR_STRESS_OPTIONS.find((item) => item.id === state.stressId)
  const blasting = MRMR_BLASTING_OPTIONS.find((item) => item.id === state.blastingId)
  const water = MRMR_WATER_OPTIONS.find((item) => item.id === state.waterId)
  const empty = '未选择'
  const emptyEn = 'Not selected'
  const descriptions = [
    { key: 'irsMpa', label: '完整岩石强度 IRS', labelEn: 'Intact rock strength IRS', value: state.irsMpa == null ? empty : `${state.irsMpa} MPa`, valueEn: state.irsMpa == null ? emptyEn : `${state.irsMpa} MPa` },
    { key: 'sizeAdjustmentPercent', label: '尺寸 / 块内裂隙修正', labelEn: 'Size / in-block fracture adjustment', value: state.sizeAdjustmentPercent == null ? empty : `${state.sizeAdjustmentPercent}%`, valueEn: state.sizeAdjustmentPercent == null ? emptyEn : `${state.sizeAdjustmentPercent}%` },
    { key: 'fractureVeinMode', label: '块内裂隙 / 脉体', labelEn: 'In-block fractures / veins', value: state.fractureVeinMode === 'none' ? '无' : `莫氏硬度 ${state.mohsHardness ?? '—'}；${state.fractureVeinFrequencyPerM ?? '—'} 条/m`, valueEn: state.fractureVeinMode === 'none' ? 'None' : `Mohs hardness ${state.mohsHardness ?? '—'}; ${state.fractureVeinFrequencyPerM ?? '—'} /m` },
    { key: 'jointSpacingM', label: '开放节理间距', labelEn: 'Open-joint spacing', value: state.jointSpacingM == null ? empty : `${state.jointSpacingM} m`, valueEn: state.jointSpacingM == null ? emptyEn : `${state.jointSpacingM} m` },
    { key: 'jointSetCount', label: '开放节理组数', labelEn: 'Open-joint sets', value: jointSet?.label ?? empty, valueEn: jointSet?.labelEn ?? emptyEn },
    { key: 'jointConditionId', label: '控制结构面条件', labelEn: 'Controlling joint condition', value: joint?.label ?? empty, valueEn: joint?.labelEn ?? emptyEn, score: joint ? `${joint.value}/40` : '—', scoreEn: joint ? `${joint.value}/40` : '—' },
    { key: 'weathering', label: '潜在风化 / 暴露期', labelEn: 'Potential weathering / exposure', value: weathering && exposure ? `${weathering.label} · ${exposure.label}` : empty, valueEn: weathering && exposure ? `${weathering.labelEn} · ${exposure.labelEn}` : emptyEn },
    { key: 'miningMethodId', label: '采矿方式控制修正', labelEn: 'Mining-method control adjustment', value: miningMethod?.label ?? empty, valueEn: miningMethod?.labelEn ?? emptyEn, score: miningMethod && 'value' in miningMethod ? `${miningMethod.value * 100}%` : '—', scoreEn: miningMethod && 'value' in miningMethod ? `${miningMethod.value * 100}%` : '—' },
    { key: 'stressId', label: '诱发应力修正', labelEn: 'Induced-stress adjustment', value: stress?.label ?? empty, valueEn: stress?.labelEn ?? emptyEn, score: stress ? `${stress.value * 100}%` : '—', scoreEn: stress ? `${stress.value * 100}%` : '—' },
    { key: 'blastingId', label: '爆破 / 开挖修正', labelEn: 'Blasting / excavation adjustment', value: blasting?.label ?? empty, valueEn: blasting?.labelEn ?? emptyEn, score: blasting ? `${blasting.value * 100}%` : '—', scoreEn: blasting ? `${blasting.value * 100}%` : '—' },
    { key: 'waterId', label: '水修正', labelEn: 'Water adjustment', value: water?.label ?? empty, valueEn: water?.labelEn ?? emptyEn, score: state.waterFactorPercent == null ? '—' : `${state.waterFactorPercent}%`, scoreEn: state.waterFactorPercent == null ? '—' : `${state.waterFactorPercent}%` },
  ]
  if (state.source) {
    const inferred = state.source.inferredFields.length > 0 ? state.source.inferredFields.join('、') : '无'
    return [
      {
        key: 'source',
        label: '数据来源',
        labelEn: 'Data source',
        value: `RMR · ${state.source.caseName} · ${state.source.pointName}；推导字段：${inferred}`,
        valueEn: `RMR · ${state.source.caseName} · ${state.source.pointName}; inferred fields: ${inferred}`,
      },
      ...descriptions,
    ]
  }
  return descriptions
}
