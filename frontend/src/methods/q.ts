/**
 * Barton Q rock-mass classification and preliminary support screening.
 *
 * Q = (RQD / Jn) * (Jr / Ja) * (Jw / SRF)
 *
 * Several Q table cells are ranges rather than single values. The
 * selected table cell and the engineer-selected value are therefore stored
 * separately. If the value is omitted, this module resolves the range toward
 * the conservative (lower-Q) end and records the decision in the result.
 */

import { supportFromChart } from './qSupportChart'

export type QIssueSeverity = 'error' | 'warning'
export type QFactorSymbol = 'Jn' | 'Jr' | 'Ja' | 'Jw' | 'SRF'
export type QGradeId = 'I' | 'II' | 'III' | 'IV' | 'V'
export type QJnSite = '' | 'normal' | 'intersection' | 'portal'
export type QSupportStatus = 'required' | 'not-required' | 'boundary' | 'outside-chart'
export type QSupportMode = 'limit' | 'chart'

export interface QFactorModifiers {
  jnSite: QJnSite
  jrWideSpacing: boolean
}

export interface QLocalizedText {
  zh: string
  en: string
}

export interface QSourceMetadata {
  id: string
  title: QLocalizedText
  edition: string
  references: readonly string[]
  sourceNote: QLocalizedText
}

export interface QValueRange {
  min: number
  max: number
}

export interface QFactorOption {
  id: string
  symbol: QFactorSymbol
  group: QLocalizedText
  label: QLocalizedText
  range: QValueRange
  sourceRef: string
  letter?: string
  /** Book-order rating text when it differs from min～max. */
  displayRange?: string
  waterPressure?: QLocalizedText
  /** Residual friction angle shown in the Ja table, e.g. 25～35°. */
  phiR?: QLocalizedText
  note?: QLocalizedText
}

export interface QEsrOption {
  id: string
  label: QLocalizedText
  range: QValueRange
  sourceRef: string
  note?: QLocalizedText
}

export interface QFormState {
  /** Rock quality designation, percent. */
  rqd: number | null
  jnId: string
  jnValue: number | null
  /** Site modifier applied to the table Jn before it enters Q. */
  jnSite: QJnSite
  jrId: string
  jrValue: number | null
  /** When true, the relevant joint-set spacing is > 3 m and Jr is increased by 1. */
  jrWideSpacing: boolean
  jaId: string
  jaValue: number | null
  jwId: string
  jwValue: number | null
  srfId: string
  srfValue: number | null
  /** Excavation span, diameter or height, in metres. */
  span: number | null
  esrId: string
  esrValue: number | null
  /** Limit screening vs NGI Figure 7 chart. Defaults to limit. */
  supportMode: QSupportMode
}

export interface QValidationIssue {
  field: keyof QFormState | 'form'
  code: string
  severity: QIssueSeverity
  message: QLocalizedText
}

export interface QResolvedFactor {
  symbol: QFactorSymbol
  optionId: string
  group: QLocalizedText
  label: QLocalizedText
  range: QValueRange
  value: number
  conservativeEnd: 'minimum' | 'maximum'
  usedConservativeDefault: boolean
  sourceRef: string
}

export interface QResolvedEsr {
  optionId: string
  label: QLocalizedText
  range: QValueRange
  value: number
  usedConservativeDefault: boolean
  sourceRef: string
}

export interface QGradeInfo {
  id: QGradeId
  label: QLocalizedText
  range: string
  rangeEn?: string
}

export interface QQualityBand {
  min: number
  max: number
  label: QLocalizedText
}

export interface QSupportRecommendation {
  mode: QSupportMode
  status: QSupportStatus
  maximumUnsupportedDimension: number
  demandRatio: number
  label: QLocalizedText
  recommendation: QLocalizedText
  sourceNote: QLocalizedText
  category?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  boltSpacingWithSfrM?: number | null
  boltSpacingWithoutSfrM?: number | null
  shotcreteThicknessCm?: number | null
  energyAbsorptionJ?: 500 | 700 | 1000 | null
  boltLengthM?: number | null
  rrs?: { class: 'I' | 'II' | 'III'; spacingM: number | null } | null
  inDashedRegion?: boolean
}

export interface QResult {
  standard: QSourceMetadata
  originalRqd: number
  effectiveRqd: number
  factors: {
    jn: QResolvedFactor
    jr: QResolvedFactor
    ja: QResolvedFactor
    jw: QResolvedFactor
    srf: QResolvedFactor
  }
  breakdown: {
    blockSize: number
    jointShearStrength: number
    activeStress: number
  }
  q: number
  grade: QGradeInfo
  quality: QQualityBand | null
  span: number | null
  esr: QResolvedEsr | null
  equivalentDimension: number | null
  support: QSupportRecommendation | null
  warnings: QValidationIssue[]
  formula: QLocalizedText
  sourceNote: QLocalizedText
}

export interface QDescriptionRow {
  key: string
  label: QLocalizedText
  value: string
  basis: QLocalizedText
}

export interface QAnalysisItem {
  key: 'blockSize' | 'jointShearStrength' | 'activeStress'
  title: QLocalizedText
  value: string
  description: QLocalizedText
}

export class QValidationError extends Error {
  readonly issues: QValidationIssue[]

  constructor(issues: QValidationIssue[]) {
    super(issues.map((item) => item.message.zh).join('；'))
    this.name = 'QValidationError'
    this.issues = issues
  }
}

const text = (zh: string, en: string): QLocalizedText => ({ zh, en })
const range = (min: number, max = min): QValueRange => ({ min, max })

export const Q_STANDARD: QSourceMetadata = {
  id: 'ngi-q-system',
  title: text('Q分级', 'Q classification'),
  edition: 'Barton 六参数分级；无支护极限示意图',
  references: [
    'Barton, Lien & Lunde (1974), Engineering classification of rock masses for the design of tunnel support',
  ],
  sourceNote: text(
    'Q 值由 RQD/Jn、Jr/Ja 与 Jw/SRF 三个比值相乘得到，按五级区间判定岩体质量等级。支护需求采用当量尺寸与经验无支护极限的比较结果；区间参数未指定采用值时按保守端计算。',
    'Q is the product of RQD/Jn, Jr/Ja and Jw/SRF and is assigned to one of five rock-mass classes. Support requirements are assessed by comparing the equivalent dimension with the empirical unsupported limit. Unspecified range values use the conservative end.'
  ),
}

const jointSetGroup = text('节理组数', 'Joint-set number')

export const Q_JN_OPTIONS: readonly QFactorOption[] = [
  { id: 'massive', symbol: 'Jn', letter: 'A', group: jointSetGroup, label: text('块状岩体，无节理或只有少量节理', 'Massive rock, no or few joints'), range: range(0.5, 1), sourceRef: 'Q-system Jn table' },
  { id: 'one_set', symbol: 'Jn', letter: 'B', group: jointSetGroup, label: text('一组节理', 'One joint set'), range: range(2), sourceRef: 'Q-system Jn table' },
  { id: 'one_set_random', symbol: 'Jn', letter: 'C', group: jointSetGroup, label: text('一组节理与任一节理', 'One joint set plus a random joint'), range: range(3), sourceRef: 'Q-system Jn table' },
  { id: 'two_sets', symbol: 'Jn', letter: 'D', group: jointSetGroup, label: text('两组节理', 'Two joint sets'), range: range(4), sourceRef: 'Q-system Jn table' },
  {
    id: 'columnar',
    symbol: 'Jn',
    letter: 'D',
    group: jointSetGroup,
    label: text('柱状节理（三个节理方向）', 'Columnar jointing (three joint directions)'),
    range: range(4),
    note: text('节理方向数不一定等于节理组数，仍取 Jn = 4。', 'The number of joint directions is not always the same as the number of joint sets; Jn remains 4.'),
    sourceRef: 'Q-system Jn table',
  },
  { id: 'two_sets_random', symbol: 'Jn', letter: 'E', group: jointSetGroup, label: text('两组节理与任一节理', 'Two joint sets plus a random joint'), range: range(6), sourceRef: 'Q-system Jn table' },
  { id: 'three_sets', symbol: 'Jn', letter: 'F', group: jointSetGroup, label: text('三组节理', 'Three joint sets'), range: range(9), sourceRef: 'Q-system Jn table' },
  { id: 'three_sets_random', symbol: 'Jn', letter: 'G', group: jointSetGroup, label: text('三组节理与任一节理', 'Three joint sets plus a random joint'), range: range(12), sourceRef: 'Q-system Jn table' },
  {
    id: 'four_or_more',
    symbol: 'Jn',
    letter: 'H',
    group: jointSetGroup,
    label: text('四组或四组以上的节理、随机分布节理、严重节理化、岩体被切割成方糖块状等', 'Four or more joint sets, random, heavily jointed or sugar-cube rock'),
    range: range(15),
    sourceRef: 'Q-system Jn table',
  },
  { id: 'crushed', symbol: 'Jn', letter: 'J', group: jointSetGroup, label: text('粉碎状岩石、类土状物', 'Crushed, earth-like rock'), range: range(20), sourceRef: 'Q-system Jn table' },
]

const wallContactGroup = text(
  '（1）节理面完全接触；（2）节理面在剪切错动 10 cm 位移前属于接触',
  '(1) Rock-wall contact; (2) Rock-wall contact before 10 cm of shear movement'
)
const noContactGroup = text('（3）剪切过程中节理面不接触', '(3) No rock-wall contact when sheared')

export const Q_JR_OPTIONS: readonly QFactorOption[] = [
  { id: 'discontinuous', symbol: 'Jr', letter: 'A', group: wallContactGroup, label: text('非连续节理', 'Discontinuous joints'), range: range(4), sourceRef: 'Q-system Jr table' },
  { id: 'rough_undulating', symbol: 'Jr', letter: 'B', group: wallContactGroup, label: text('粗糙或不规则的波状节理', 'Rough or irregular, undulating'), range: range(3), sourceRef: 'Q-system Jr table' },
  { id: 'smooth_undulating', symbol: 'Jr', letter: 'C', group: wallContactGroup, label: text('光滑的波状节理', 'Smooth, undulating'), range: range(2), sourceRef: 'Q-system Jr table' },
  { id: 'slickensided_undulating', symbol: 'Jr', letter: 'D', group: wallContactGroup, label: text('带擦痕的波状节理', 'Slickensided, undulating'), range: range(1.5), sourceRef: 'Q-system Jr table' },
  { id: 'rough_planar', symbol: 'Jr', letter: 'E', group: wallContactGroup, label: text('粗糙或不规则的平面状节理', 'Rough or irregular, planar'), range: range(1.5), sourceRef: 'Q-system Jr table' },
  { id: 'smooth_planar', symbol: 'Jr', letter: 'F', group: wallContactGroup, label: text('光滑的平面状节理', 'Smooth, planar'), range: range(1), sourceRef: 'Q-system Jr table' },
  {
    id: 'slickensided_planar',
    symbol: 'Jr',
    letter: 'G',
    group: wallContactGroup,
    label: text('带擦痕的平面状节理', 'Slickensided, planar'),
    range: range(0.5),
    sourceRef: 'Q-system Jr table',
    note: text('若该平面状节理与最弱方位一致，仍取 0.5。', 'If the planar joint coincides with the weakest direction, keep Jr = 0.5.'),
  },
  {
    id: 'clay_zone_no_contact',
    symbol: 'Jr',
    letter: 'H',
    group: noContactGroup,
    label: text('节理中含有足够厚的黏土矿物，能够阻止节理面接触', 'Clay-mineral zone thick enough to prevent wall contact'),
    range: range(1),
    sourceRef: 'Q-system Jr table',
  },
  {
    id: 'crushed_zone_no_contact',
    symbol: 'Jr',
    letter: 'J',
    group: noContactGroup,
    label: text('节理中含有足够厚的砂、砾岩、岩石压碎区，能够阻止节理面接触', 'Sandy, gravelly or crushed zone thick enough to prevent wall contact'),
    range: range(1),
    sourceRef: 'Q-system Jr table',
  },
]

const jaWallContactGroup = text('（1）节理面闭合（无矿物填充物，只有覆盖层）', '(1) Rock-wall contact (no mineral filling, coatings only)')
const jaThinFillingGroup = text('（2）剪切错动 10 cm 前是接触的（含薄层矿物填充物）', '(2) Contact before 10 cm shear (thin mineral filling)')
const jaNoContactGroup = text('（3）剪切错动时节理面不接触（含厚层矿物填充物）', '(3) No wall contact when sheared (thick mineral filling)')

export const Q_JA_OPTIONS: readonly QFactorOption[] = [
  {
    id: 'healed_hard_filling',
    symbol: 'Ja',
    letter: 'A',
    group: jaWallContactGroup,
    label: text('节理紧密接触，坚硬、无软化、不渗透性填充物，如石英或绿帘石', 'Tightly healed, hard, non-softening, impermeable filling, e.g. quartz or epidote'),
    range: range(0.75),
    phiR: text('—', '—'),
    sourceRef: 'Q-system Ja table',
  },
  { id: 'unaltered_walls', symbol: 'Ja', letter: 'B', group: jaWallContactGroup, label: text('节理面未蚀变，仅表面褪色', 'Unaltered joint walls, surface staining only'), range: range(1), phiR: text('25～35', '25–35'), sourceRef: 'Q-system Ja table' },
  {
    id: 'slightly_altered',
    symbol: 'Ja',
    letter: 'C',
    group: jaWallContactGroup,
    label: text('节理面轻度蚀变，不含软化的矿物覆盖层、砂粒、无黏土分解岩石等', 'Slightly altered joint walls, non-softening mineral coatings, sandy particles, clay-free disintegrated rock'),
    range: range(2),
    phiR: text('25～30', '25–30'),
    sourceRef: 'Q-system Ja table',
  },
  { id: 'silty_sandy_clay_coating', symbol: 'Ja', letter: 'D', group: jaWallContactGroup, label: text('粉砂质或砂质黏土覆盖层，含少量黏土颗粒（非软化）', 'Silty or sandy clay coating, small non-softening clay fraction'), range: range(3), phiR: text('20～25', '20–25'), sourceRef: 'Q-system Ja table' },
  {
    id: 'softening_clay_coating',
    symbol: 'Ja',
    letter: 'E',
    group: jaWallContactGroup,
    label: text('软化或低摩擦黏土矿物覆盖层，即高岭土或云母。也可是绿泥石、滑石、石膏、石墨等，以及少量膨胀性黏土（非连续覆盖层，厚度 ≤2 mm）', 'Softening or low-friction clay-mineral coatings, i.e. kaolinite or mica; also chlorite, talc, gypsum, graphite etc., and small quantities of swelling clay (discontinuous coating, ≤2 mm)'),
    range: range(4),
    phiR: text('8～16', '8–16'),
    sourceRef: 'Q-system Ja table',
  },
  { id: 'sandy_particles', symbol: 'Ja', letter: 'F', group: jaThinFillingGroup, label: text('含砂粒、无黏土分解岩石等', 'Sandy particles, clay-free disintegrated rock etc.'), range: range(4), phiR: text('25～30', '25–30'), sourceRef: 'Q-system Ja table' },
  { id: 'thin_strong_clay', symbol: 'Ja', letter: 'G', group: jaThinFillingGroup, label: text('含强超固结、非软化的黏土矿物填充物（连续，厚度 <5 mm）', 'Strongly over-consolidated, non-softening clay mineral filling (continuous, <5 mm)'), range: range(6), phiR: text('16～24', '16–24'), sourceRef: 'Q-system Ja table' },
  { id: 'thin_soft_clay', symbol: 'Ja', letter: 'H', group: jaThinFillingGroup, label: text('中等或低超固结、软化的黏土矿物填充物（连续，厚度 <5 mm）', 'Medium or low over-consolidated, softening clay mineral filling (continuous, <5 mm)'), range: range(8), phiR: text('12～16', '12–16'), sourceRef: 'Q-system Ja table' },
  {
    id: 'thin_swelling_clay',
    symbol: 'Ja',
    letter: 'J',
    group: jaThinFillingGroup,
    label: text('膨胀性黏土填充物，即蒙脱石（连续，厚度 <5 mm）', 'Swelling-clay filling, i.e. montmorillonite (continuous, <5 mm)'),
    range: range(8, 12),
    phiR: text('6～12', '6–12'),
    sourceRef: 'Q-system Ja table',
    note: text('取值取决于膨胀性黏土颗粒所占百分数、含水量等。', 'Value depends on the percentage of swelling-clay particles, water content etc.'),
  },
  {
    id: 'crushed_strong_clay',
    symbol: 'Ja',
    letter: 'K',
    group: jaNoContactGroup,
    label: text('按 G 档黏土状况（强超固结、非软化）', 'G clay condition (strongly over-consolidated, non-softening)'),
    range: range(6),
    phiR: text('6～24', '6–24'),
    sourceRef: 'Q-system Ja table',
  },
  {
    id: 'crushed_soft_clay',
    symbol: 'Ja',
    letter: 'K',
    group: jaNoContactGroup,
    label: text('按 H 档黏土状况（中等或低超固结、软化）', 'H clay condition (medium or low over-consolidated, softening)'),
    range: range(8),
    phiR: text('6～24', '6–24'),
    sourceRef: 'Q-system Ja table',
  },
  {
    id: 'crushed_swelling_clay',
    symbol: 'Ja',
    letter: 'K',
    group: jaNoContactGroup,
    label: text('按 J 档黏土状况（膨胀性黏土）', 'J clay condition (swelling clay)'),
    range: range(8, 12),
    phiR: text('6～24', '6–24'),
    sourceRef: 'Q-system Ja table',
  },
  {
    id: 'banded_silty_sandy_clay',
    symbol: 'Ja',
    letter: 'L',
    group: jaNoContactGroup,
    label: text('含区域或带状粉砂质或砂质黏土、少量黏土颗粒（非软化）', 'Zones or bands of silty or sandy clay, small clay fraction (non-softening)'),
    range: range(5),
    phiR: text('—', '—'),
    sourceRef: 'Q-system Ja table',
  },
  {
    id: 'thick_strong_clay',
    symbol: 'Ja',
    letter: 'M',
    group: jaNoContactGroup,
    label: text('按 G 档黏土状况（强超固结、非软化）', 'G clay condition (strongly over-consolidated, non-softening)'),
    range: range(10),
    phiR: text('6～24', '6–24'),
    sourceRef: 'Q-system Ja table',
  },
  {
    id: 'thick_soft_clay',
    symbol: 'Ja',
    letter: 'M',
    group: jaNoContactGroup,
    label: text('按 H 档黏土状况（中等或低超固结、软化）', 'H clay condition (medium or low over-consolidated, softening)'),
    range: range(13),
    phiR: text('6～24', '6–24'),
    sourceRef: 'Q-system Ja table',
  },
  {
    id: 'thick_swelling_clay',
    symbol: 'Ja',
    letter: 'M',
    group: jaNoContactGroup,
    label: text('按 J 档黏土状况（膨胀性黏土）', 'J clay condition (swelling clay)'),
    range: range(13, 20),
    phiR: text('6～24', '6–24'),
    sourceRef: 'Q-system Ja table',
  },
]

const waterGroup = text('节理水折减', 'Joint-water reduction')

export const Q_JW_OPTIONS: readonly QFactorOption[] = [
  {
    id: 'dry_minor',
    symbol: 'Jw',
    letter: 'A',
    group: waterGroup,
    label: text('干燥开挖或较小渗流的水，即局部渗流量小于 5 L/min', 'Dry excavations or minor inflow, i.e. local inflow <5 L/min'),
    range: range(1),
    waterPressure: text('<1', '<1'),
    sourceRef: 'Q-system Jw table',
  },
  {
    id: 'medium_inflow',
    symbol: 'Jw',
    letter: 'B',
    group: waterGroup,
    label: text('中等流量或中等压力，偶尔发生节理填充物被冲刷现象', 'Medium inflow or pressure, occasional outwash of joint fillings'),
    range: range(0.66),
    waterPressure: text('1～2.5', '1–2.5'),
    sourceRef: 'Q-system Jw table',
  },
  {
    id: 'large_inflow_unfilled',
    symbol: 'Jw',
    letter: 'C',
    group: waterGroup,
    label: text('流量大或水压高，节理无充填物，岩石坚固', 'Large inflow or high pressure in competent rock with unfilled joints'),
    range: range(0.5),
    waterPressure: text('2.5～10', '2.5–10'),
    sourceRef: 'Q-system Jw table',
  },
  {
    id: 'large_inflow_washout',
    symbol: 'Jw',
    letter: 'D',
    group: waterGroup,
    label: text('流量大或水压高，大量填充物均被冲出', 'Large inflow or high pressure with considerable outwash of joint fillings'),
    range: range(0.33),
    waterPressure: text('2.5～10', '2.5–10'),
    sourceRef: 'Q-system Jw table',
  },
  {
    id: 'exceptional_decaying',
    symbol: 'Jw',
    letter: 'E',
    group: waterGroup,
    label: text('爆破时，流量特别大或压力特别高，但随时间增长而减弱', 'Exceptionally high inflow or pressure at blasting, decaying with time'),
    range: range(0.1, 0.2),
    displayRange: '0.2～0.1',
    waterPressure: text('>10', '>10'),
    sourceRef: 'Q-system Jw table',
  },
  {
    id: 'exceptional_sustained',
    symbol: 'Jw',
    letter: 'F',
    group: waterGroup,
    label: text('持续不衰减的特大涌水或特高水压', 'Exceptionally high sustained inflow or pressure without noticeable decay'),
    range: range(0.05, 0.1),
    displayRange: '0.1～0.05',
    waterPressure: text('>10', '>10'),
    sourceRef: 'Q-system Jw table',
  },
]

const weaknessZoneGroup = text('（1）软弱区穿切开挖体，引起岩体松散冒落', '(1) Weakness zones intersecting the excavation, which may cause loosening of the rock mass')
const competentStressGroup = text('（2）坚硬完整岩体中的应力状态', '(2) Competent rock, rock-stress problems')
const squeezingGroup = text('（3）塑性岩体挤压变形', '(3) Squeezing rock')
const swellingGroup = text('（4）膨胀岩化学膨胀', '(4) Swelling rock')

export const Q_SRF_OPTIONS: readonly QFactorOption[] = [
  { id: 'multiple_clay_weakness', symbol: 'SRF', letter: 'A', group: weaknessZoneGroup, label: text('多处出现含黏土或化学分解的岩石软弱区，围岩十分松散（深度不限），或长掘进断面穿过不同弱层', 'Multiple occurrences of weakness zones containing clay or chemically disintegrated rock, very loose surrounding rock (any depth), or long headings crossing different weak layers'), range: range(10), sourceRef: 'Q-system SRF table' },
  { id: 'single_clay_shallow', symbol: 'SRF', letter: 'B', group: weaknessZoneGroup, label: text('单一弱区含或不含黏土或化学分解的岩石（开挖深度 ≤50 m）', 'Single weakness zone containing clay or chemically disintegrated rock (excavation depth ≤50 m)'), range: range(5), sourceRef: 'Q-system SRF table' },
  { id: 'single_clay_deep', symbol: 'SRF', letter: 'C', group: weaknessZoneGroup, label: text('单一弱区含或不含黏土或化学分解的岩石（开挖深度 >50 m）', 'Single weakness zone containing clay or chemically disintegrated rock (excavation depth >50 m)'), range: range(2.5), sourceRef: 'Q-system SRF table' },
  { id: 'multiple_clay_free_shear', symbol: 'SRF', letter: 'D', group: weaknessZoneGroup, label: text('在短段多处出现剪切带、围岩出现非黏土松散冒落（深度不限）', 'Multiple shear zones in competent rock over a short section, clay-free loosening of the surrounding rock (any depth)'), range: range(7.5), sourceRef: 'Q-system SRF table' },
  { id: 'single_clay_free_shallow', symbol: 'SRF', letter: 'E', group: weaknessZoneGroup, label: text('岩石坚固（不含黏土），含单一剪切带（开挖深度 ≤50 m）', 'Competent rock (clay-free) with a single shear zone (excavation depth ≤50 m)'), range: range(5), sourceRef: 'Q-system SRF table' },
  { id: 'single_clay_free_deep', symbol: 'SRF', letter: 'F', group: weaknessZoneGroup, label: text('岩石坚固（不含黏土），含单一剪切带（开挖深度 >50 m）', 'Competent rock (clay-free) with a single shear zone (excavation depth >50 m)'), range: range(2.5), sourceRef: 'Q-system SRF table' },
  { id: 'loose_open_joints', symbol: 'SRF', letter: 'G', group: weaknessZoneGroup, label: text('松散、张节理、严重节理化或呈“方糖块”状等（深度不限）', 'Loose, open joints, heavily jointed or “sugar cube” rock etc. (any depth)'), range: range(5), sourceRef: 'Q-system SRF table' },
  { id: 'low_stress', symbol: 'SRF', letter: 'H', group: competentStressGroup, label: text('低应力、近地表、节理张开', 'Low stress, near surface, open joints'), range: range(2.5), sourceRef: 'Q-system SRF table' },
  { id: 'medium_stress', symbol: 'SRF', letter: 'J', group: competentStressGroup, label: text('中等应力，有利应力状态', 'Medium stress, favourable stress condition'), range: range(1), sourceRef: 'Q-system SRF table' },
  { id: 'high_stress_stable', symbol: 'SRF', letter: 'K', group: competentStressGroup, label: text('高应力、结构很紧密，通常有利于稳定', 'High stress, very tight structure, generally favourable to stability'), range: range(0.5, 2), sourceRef: 'Q-system SRF table' },
  { id: 'mild_rock_burst', symbol: 'SRF', letter: 'L', group: competentStressGroup, label: text('完整坚硬岩体，轻度片帮或岩爆', 'Massive competent rock, mild slabbing or rock burst'), range: range(5, 50), sourceRef: 'Q-system SRF table' },
  { id: 'heavy_rock_burst', symbol: 'SRF', letter: 'M', group: competentStressGroup, label: text('完整坚硬岩体，强烈岩爆', 'Massive competent rock, heavy rock burst'), range: range(50, 200), sourceRef: 'Q-system SRF table' },
  { id: 'mild_squeezing', symbol: 'SRF', letter: 'O', group: squeezingGroup, label: text('轻度挤压变形', 'Mild squeezing pressure'), range: range(5, 10), sourceRef: 'Q-system SRF table' },
  { id: 'heavy_squeezing', symbol: 'SRF', letter: 'P', group: squeezingGroup, label: text('强烈挤压变形', 'Heavy squeezing pressure'), range: range(10, 20), sourceRef: 'Q-system SRF table' },
  { id: 'mild_swelling', symbol: 'SRF', letter: 'Q', group: swellingGroup, label: text('轻度膨胀压力', 'Mild swelling pressure'), range: range(5, 10), sourceRef: 'Q-system SRF table' },
  { id: 'heavy_swelling', symbol: 'SRF', letter: 'R', group: swellingGroup, label: text('强烈膨胀压力', 'Heavy swelling pressure'), range: range(10, 15), sourceRef: 'Q-system SRF table' },
]

export const Q_ESR_OPTIONS: readonly QEsrOption[] = [
  { id: 'temporary_mine', label: text('临时矿山巷道', 'Temporary mine openings'), range: range(3, 5), sourceRef: 'Barton ESR table' },
  { id: 'circular_shaft', label: text('圆形竖井', 'Circular shafts'), range: range(2.5), sourceRef: 'Barton ESR table' },
  { id: 'rectangular_shaft', label: text('矩形竖井', 'Rectangular shafts'), range: range(2), sourceRef: 'Barton ESR table' },
  { id: 'permanent_general', label: text('永久矿山巷道、水工隧洞或大型洞室导洞', 'Permanent mine openings, water tunnels or pilot tunnels for large excavations'), range: range(1.6), sourceRef: 'Barton ESR table' },
  { id: 'storage_minor', label: text('小型公路和铁路隧洞、调压室及交通隧洞', 'Minor road and railway tunnels, surge chambers and access tunnels'), range: range(1.3), sourceRef: 'Barton ESR table' },
  { id: 'major_civil', label: text('储藏洞室、水处理设施、电站厂房、主要公路铁路隧洞及地下民防工程', 'Storage caverns, water-treatment facilities, power stations, major road/rail tunnels and civil-defence chambers'), range: range(1), sourceRef: 'Barton ESR table' },
  { id: 'public_critical', label: text('医院、车站、公共体育设施及重要地下设施', 'Hospitals, stations, public sports facilities and important underground facilities'), range: range(0.8), sourceRef: 'Barton ESR table' },
  { id: 'critical_permanent', label: text('极重要永久地下工程', 'Critical permanent underground structures'), range: range(0.5), sourceRef: '表3.7 G / Table 3.7 G' },
]

export const Q_GRADES: readonly QGradeInfo[] = [
  { id: 'I', label: text('I 级', 'Class I'), range: 'Q ＞ 40', rangeEn: 'Q > 40' },
  { id: 'II', label: text('II 级', 'Class II'), range: '10 ＜ Q ≤ 40', rangeEn: '10 < Q ≤ 40' },
  { id: 'III', label: text('III 级', 'Class III'), range: '1 ＜ Q ≤ 10', rangeEn: '1 < Q ≤ 10' },
  { id: 'IV', label: text('IV 级', 'Class IV'), range: '0.1 ≤ Q ≤ 1', rangeEn: '0.1 ≤ Q ≤ 1' },
  { id: 'V', label: text('V 级', 'Class V'), range: 'Q ＜ 0.1', rangeEn: 'Q < 0.1' },
]

/** Standard descriptive bands: lower bound included; upper bound excluded, except 1000 is included. */
export const Q_QUALITY_BANDS: readonly QQualityBand[] = [
  { min: 0.001, max: 0.01, label: text('异常差', 'Exceptionally poor') },
  { min: 0.01, max: 0.1, label: text('极差', 'Extremely poor') },
  { min: 0.1, max: 1, label: text('很差', 'Very poor') },
  { min: 1, max: 4, label: text('差', 'Poor') },
  { min: 4, max: 10, label: text('一般', 'Fair') },
  { min: 10, max: 40, label: text('好', 'Good') },
  { min: 40, max: 100, label: text('很好', 'Very good') },
  { min: 100, max: 400, label: text('极好', 'Extremely good') },
  { min: 400, max: 1000, label: text('异常好', 'Exceptionally good') },
]

export function qualityFromQ(q: number): QQualityBand | null {
  if (!Number.isFinite(q) || q < Q_QUALITY_BANDS[0].min || q > Q_QUALITY_BANDS[Q_QUALITY_BANDS.length - 1].max) return null
  return Q_QUALITY_BANDS.find((band, index) => q >= band.min && (q < band.max || index === Q_QUALITY_BANDS.length - 1)) ?? null
}

export const Q_FACTOR_CONSERVATIVE_END: Record<QFactorSymbol, 'minimum' | 'maximum'> = {
  Jn: 'maximum',
  Jr: 'minimum',
  Ja: 'maximum',
  Jw: 'minimum',
  SRF: 'maximum',
}

function boundsOf(options: readonly QFactorOption[]) {
  return {
    min: Math.min(...options.map((item) => item.range.min)),
    max: Math.max(...options.map((item) => item.range.max)),
  }
}

export const Q_FACTOR_BOUNDS = {
  Jn: { min: 0.5, max: 60 },
  Jr: { min: 0.5, max: 5 },
  Ja: boundsOf(Q_JA_OPTIONS),
  Jw: boundsOf(Q_JW_OPTIONS),
  SRF: boundsOf(Q_SRF_OPTIONS),
} as const

export function jnSiteMultiplier(site: QJnSite): number {
  if (site === 'intersection') return 3
  if (site === 'portal') return 2
  return 1
}

export function emptyFactorModifiers(): QFactorModifiers {
  return { jnSite: '', jrWideSpacing: false }
}

export function tableValueFor(symbol: QFactorSymbol, formulaValue: number, modifiers: QFactorModifiers): number {
  if (symbol === 'Jn') return formulaValue / jnSiteMultiplier(modifiers.jnSite)
  if (symbol === 'Jr' && modifiers.jrWideSpacing) return formulaValue - 1
  return formulaValue
}

export function formulaValueFor(symbol: QFactorSymbol, tableValue: number, modifiers: QFactorModifiers): number {
  if (symbol === 'Jn') return tableValue * jnSiteMultiplier(modifiers.jnSite)
  if (symbol === 'Jr' && modifiers.jrWideSpacing) return tableValue + 1
  return tableValue
}

export function formatFactorRating(option: QFactorOption) {
  if (option.displayRange) return option.displayRange
  return option.range.min === option.range.max ? String(option.range.min) : `${option.range.min}～${option.range.max}`
}

export function optionsForLetter(options: readonly QFactorOption[], letter: string) {
  return options.filter((item) => item.letter === letter)
}

export function factorOptionsFor(symbol: QFactorSymbol): readonly QFactorOption[] {
  if (symbol === 'Jn') return Q_JN_OPTIONS
  if (symbol === 'Jr') return Q_JR_OPTIONS
  if (symbol === 'Ja') return Q_JA_OPTIONS
  if (symbol === 'Jw') return Q_JW_OPTIONS
  return Q_SRF_OPTIONS
}

export function groupFactorOptions(options: readonly QFactorOption[]) {
  const groups: Array<{ label: QLocalizedText; options: QFactorOption[] }> = []
  for (const option of options) {
    const last = groups[groups.length - 1]
    if (last && last.label.zh === option.group.zh) last.options.push(option)
    else groups.push({ label: option.group, options: [option] })
  }
  return groups
}

export function groupFactorOptionsByLetter(options: readonly QFactorOption[]) {
  const rows: Array<{ letter?: string; options: QFactorOption[] }> = []
  for (const option of options) {
    const last = rows[rows.length - 1]
    if (option.letter && last?.letter === option.letter) last.options.push(option)
    else rows.push({ letter: option.letter, options: [option] })
  }
  return rows
}

export function conservativeAdoptedValue(option: QFactorOption, end: 'minimum' | 'maximum' = Q_FACTOR_CONSERVATIVE_END[option.symbol]) {
  return end === 'minimum' ? option.range.min : option.range.max
}

export function displayedFactorValue(id: string, value: number | null, options: readonly QFactorOption[]): number | null {
  if (value != null) return value
  const option = findOption(options, id)
  return option ? conservativeAdoptedValue(option) : null
}

export function matchFactorOption(options: readonly QFactorOption[], value: number, preferredId = '') {
  const matches = options.filter((item) => value >= item.range.min && value <= item.range.max)
  if (preferredId) {
    const preferred = matches.find((item) => item.id === preferredId)
    if (preferred) return preferred
  }
  const exact = matches.filter((item) => item.range.min === item.range.max)
  return exact[0] ?? matches[0] ?? null
}

export const createInitialQState = (): QFormState => ({
  rqd: null,
  jnId: '',
  jnValue: null,
  jnSite: '',
  jrId: '',
  jrValue: null,
  jrWideSpacing: false,
  jaId: '',
  jaValue: null,
  jwId: '',
  jwValue: null,
  srfId: '',
  srfValue: null,
  span: null,
  esrId: '',
  esrValue: null,
  supportMode: 'limit',
})

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function finiteNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isFinite(parsed) ? parsed : null
}

function knownId<T extends { id: string }>(value: unknown, options: readonly T[], fallback: string): string {
  return typeof value === 'string' && options.some((item) => item.id === value) ? value : fallback
}

function knownJnSite(value: unknown): QJnSite {
  return value === 'normal' || value === 'intersection' || value === 'portal' ? value : ''
}

export function normalizeQState(value: unknown): QFormState {
  const raw = asRecord(value)
  const initial = createInitialQState()
  return {
    rqd: finiteNumber(raw.rqd ?? raw.RQD),
    jnId: knownId(raw.jnId, Q_JN_OPTIONS, initial.jnId),
    jnValue: finiteNumber(raw.jnValue ?? raw.Jn),
    jnSite: knownJnSite(raw.jnSite),
    jrId: knownId(raw.jrId, Q_JR_OPTIONS, initial.jrId),
    jrValue: finiteNumber(raw.jrValue ?? raw.Jr),
    jrWideSpacing: raw.jrWideSpacing === true,
    jaId: knownId(raw.jaId, Q_JA_OPTIONS, initial.jaId),
    jaValue: finiteNumber(raw.jaValue ?? raw.Ja),
    jwId: knownId(raw.jwId, Q_JW_OPTIONS, initial.jwId),
    jwValue: finiteNumber(raw.jwValue ?? raw.Jw),
    srfId: knownId(raw.srfId, Q_SRF_OPTIONS, initial.srfId),
    srfValue: finiteNumber(raw.srfValue ?? raw.SRF),
    span: finiteNumber(raw.span ?? raw.excavationSpan ?? raw.diameterOrHeight),
    esrId: knownId(raw.esrId, Q_ESR_OPTIONS, initial.esrId),
    esrValue: finiteNumber(raw.esrValue ?? raw.ESR),
    supportMode: raw.supportMode === 'chart' ? 'chart' : 'limit',
  }
}

function issue(
  field: QValidationIssue['field'],
  code: string,
  severity: QIssueSeverity,
  zh: string,
  en: string
): QValidationIssue {
  return { field, code, severity, message: text(zh, en) }
}

function findOption(options: readonly QFactorOption[], id: string): QFactorOption | undefined {
  return options.find((item) => item.id === id)
}

function findEsrOption(id: string): QEsrOption | undefined {
  return Q_ESR_OPTIONS.find((item) => item.id === id)
}

function validateRangeValue(
  issues: QValidationIssue[],
  field: keyof QFormState,
  value: number | null,
  selectedRange: QValueRange,
  symbol: string,
  conservativeEnd: 'minimum' | 'maximum'
) {
  if (value == null) {
    if (selectedRange.min !== selectedRange.max) {
      const defaultValue = conservativeEnd === 'minimum' ? selectedRange.min : selectedRange.max
      issues.push(
        issue(
          field,
          'conservative_default',
          'warning',
          `${symbol} 未指定区间内工程取值，将保守采用 ${defaultValue}。`,
          `${symbol} has no project value within the selected range; ${defaultValue} will be used conservatively.`
        )
      )
    }
    return
  }
  if (value < selectedRange.min || value > selectedRange.max) {
    issues.push(
      issue(
        field,
        'outside_table_range',
        'error',
        `${symbol} 必须位于所选表项区间 ${selectedRange.min}–${selectedRange.max}。`,
        `${symbol} must be within the selected table-cell range ${selectedRange.min}–${selectedRange.max}.`
      )
    )
  }
}

function factorHasModifier(symbol: QFactorSymbol, modifiers: QFactorModifiers) {
  return (symbol === 'Jn' && jnSiteMultiplier(modifiers.jnSite) !== 1) || (symbol === 'Jr' && modifiers.jrWideSpacing)
}

function validateFactor(
  issues: QValidationIssue[],
  idField: keyof QFormState,
  valueField: keyof QFormState,
  id: string,
  value: number | null,
  options: readonly QFactorOption[],
  symbol: QFactorSymbol,
  modifiers: QFactorModifiers
) {
  const bounds = Q_FACTOR_BOUNDS[symbol]
  const option = findOption(options, id)
  if (value == null && !option) {
    issues.push(issue(valueField, 'required', 'error', `请输入或点选 ${symbol}。`, `Enter or select ${symbol}.`))
    return
  }
  if (value != null && (value < bounds.min || value > bounds.max)) {
    issues.push(
      issue(
        valueField,
        'out_of_range',
        'error',
        `${symbol} 必须位于 ${bounds.min}～${bounds.max}。`,
        `${symbol} must be between ${bounds.min} and ${bounds.max}.`
      )
    )
    return
  }
  const tableValue = value == null ? null : tableValueFor(symbol, value, modifiers)
  if (option) {
    if (factorHasModifier(symbol, modifiers) && tableValue != null) {
      if (tableValue < option.range.min || tableValue > option.range.max) {
        issues.push(
          issue(
            valueField,
            'outside_table_range',
            'error',
            `${symbol} 修正后与所选表档不一致，请重新点选或核对修正项。`,
            `The modified ${symbol} does not match the selected table cell; reselect or check the modifier.`
          )
        )
      }
    } else {
      validateRangeValue(issues, valueField, tableValue, option.range, symbol, Q_FACTOR_CONSERVATIVE_END[symbol])
    }
  } else if (tableValue != null && !matchFactorOption(options, tableValue)) {
    issues.push(
      issue(
        idField,
        'unmatched_table',
        'warning',
        `${symbol} = ${value} 未落入标准表档，请核对后使用。`,
        `${symbol} = ${value} does not match a standard table cell; confirm before use.`
      )
    )
  }
}

export function validateQState(input: QFormState | unknown): QValidationIssue[] {
  const state = normalizeQState(input)
  const issues: QValidationIssue[] = []
  const modifiers: QFactorModifiers = { jnSite: state.jnSite, jrWideSpacing: state.jrWideSpacing }
  if (state.rqd == null) issues.push(issue('rqd', 'required', 'error', '请输入岩石质量指标 RQD。', 'Enter rock quality designation RQD.'))
  else if (state.rqd < 0 || state.rqd > 100) issues.push(issue('rqd', 'out_of_range', 'error', 'RQD 必须位于 0%–100%。', 'RQD must be between 0% and 100%.'))
  else if (state.rqd < 10) {
    issues.push(issue('rqd', 'nominal_minimum', 'warning', '实测 RQD 小于 10%，Q 计算按名义值 10% 代入。', 'Measured RQD is below 10%; the nominal 10% is used in Q.'))
  }
  if (state.span != null && state.span <= 0) issues.push(issue('span', 'out_of_range', 'error', '开挖尺寸必须大于 0 m。', 'Excavation dimension must be greater than 0 m.'))

  validateFactor(issues, 'jnId', 'jnValue', state.jnId, state.jnValue, Q_JN_OPTIONS, 'Jn', modifiers)
  validateFactor(issues, 'jrId', 'jrValue', state.jrId, state.jrValue, Q_JR_OPTIONS, 'Jr', modifiers)
  validateFactor(issues, 'jaId', 'jaValue', state.jaId, state.jaValue, Q_JA_OPTIONS, 'Ja', modifiers)
  validateFactor(issues, 'jwId', 'jwValue', state.jwId, state.jwValue, Q_JW_OPTIONS, 'Jw', modifiers)
  validateFactor(issues, 'srfId', 'srfValue', state.srfId, state.srfValue, Q_SRF_OPTIONS, 'SRF', modifiers)

  const esr = findEsrOption(state.esrId)
  if (esr) validateRangeValue(issues, 'esrValue', state.esrValue, esr.range, 'ESR', 'minimum')
  else if (state.esrValue != null && state.esrValue <= 0) {
    issues.push(issue('esrValue', 'out_of_range', 'error', 'ESR 必须大于 0。', 'ESR must be greater than 0.'))
  }
  if (state.span != null && !esr) {
    issues.push(issue('esrId', 'missing_esr', 'warning', '已输入开挖尺寸，但未选择 ESR；Q 值仍可计算，暂不进行支护需求判定。', 'An excavation dimension was entered without ESR; Q remains valid, but support screening is omitted.'))
  } else if (state.span == null && esr) {
    issues.push(issue('span', 'missing_span', 'warning', '已选择 ESR，但未输入开挖尺寸；Q 值仍可计算，暂不进行支护需求判定。', 'ESR was selected without an excavation dimension; Q remains valid, but support screening is omitted.'))
  }
  return issues
}

function round(value: number, digits = 4): number {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

function typedFactor(symbol: QFactorSymbol, value: number): QResolvedFactor {
  return {
    symbol,
    optionId: '',
    group: text('手填取值', 'Typed value'),
    label: text(`手填 ${symbol} = ${value}`, `Typed ${symbol} = ${value}`),
    range: { min: value, max: value },
    value,
    conservativeEnd: Q_FACTOR_CONSERVATIVE_END[symbol],
    usedConservativeDefault: false,
    sourceRef: 'typed-value',
  }
}

function resolveFactorInput(
  options: readonly QFactorOption[],
  id: string,
  value: number | null,
  symbol: QFactorSymbol,
  modifiers: QFactorModifiers = emptyFactorModifiers()
): QResolvedFactor {
  const end = Q_FACTOR_CONSERVATIVE_END[symbol]
  const tableValue = value == null ? null : tableValueFor(symbol, value, modifiers)
  const option = findOption(options, id) ?? (tableValue != null ? matchFactorOption(options, tableValue, id) : null)
  if (option) {
    const resolved = resolveFactor(option, tableValue, end)
    return { ...resolved, value: value ?? formulaValueFor(symbol, resolved.value, modifiers) }
  }
  return typedFactor(symbol, value as number)
}

function resolveFactor(
  option: QFactorOption,
  selected: number | null,
  conservativeEnd: 'minimum' | 'maximum'
): QResolvedFactor {
  const fallback = conservativeEnd === 'minimum' ? option.range.min : option.range.max
  return {
    symbol: option.symbol,
    optionId: option.id,
    group: option.group,
    label: option.label,
    range: option.range,
    value: selected ?? fallback,
    conservativeEnd,
    usedConservativeDefault: selected == null && option.range.min !== option.range.max,
    sourceRef: option.sourceRef,
  }
}

function resolveEsr(option: QEsrOption, selected: number | null): QResolvedEsr {
  return {
    optionId: option.id,
    label: option.label,
    range: option.range,
    value: selected ?? option.range.min,
    usedConservativeDefault: selected == null && option.range.min !== option.range.max,
    sourceRef: option.sourceRef,
  }
}

export function gradeFromQ(q: number): QGradeInfo {
  if (q > 40) return Q_GRADES[0]
  if (q > 10) return Q_GRADES[1]
  if (q > 1) return Q_GRADES[2]
  if (q >= 0.1) return Q_GRADES[3]
  return Q_GRADES[4]
}

function sameQClassification(left: number, right: number): boolean {
  return gradeFromQ(left).id === gradeFromQ(right).id && qualityFromQ(left) === qualityFromQ(right)
}

export function formatQValue(q: number): string {
  if (!Number.isFinite(q)) return String(q)
  for (let precision = 5; precision <= 15; precision += 1) {
    const candidate = Number(q.toPrecision(precision)).toString()
    if (sameQClassification(q, Number(candidate))) return candidate
  }
  return q.toString()
}

export function maximumUnsupportedDimension(q: number): number {
  return 2 * q ** 0.4
}

export const Q_SUPPORT_DESCRIPTION = text(
  '支护需求由岩体质量 Q、开挖尺寸及工程用途共同确定。开挖支护比 ESR 反映工程用途和稳定性要求，将开挖跨度、直径或高度折算为当量尺寸 De，并与经验无支护极限 De,max 比较。De 小于极限时位于无需支护区，大于或等于极限时按需支护处理。判定用于识别支护需求，支护形式与参数应结合结构面控制、地下水和施工扰动确定。',
  'Support requirements depend on Q, excavation size and engineering use. ESR represents the use and stability requirements, converting the span, diameter or height to an equivalent dimension De. Compare De with the empirical unsupported limit De,max: below the limit is the unsupported region; at or above it requires support. Support type and parameters depend on discontinuity control, groundwater and construction disturbance.'
)

function supportFromQ(q: number, equivalentDimension: number): QSupportRecommendation {
  const limit = maximumUnsupportedDimension(q)
  const demandRatio = equivalentDimension / limit
  const outsideChart = q < 0.001 || q > 1000 || equivalentDimension < 0.1 || equivalentDimension > 100
  const tolerance = 1e-9 * Math.max(1, equivalentDimension, limit)
  const status: QSupportStatus = outsideChart
    ? 'outside-chart'
    : Math.abs(equivalentDimension - limit) <= tolerance
      ? 'boundary'
      : equivalentDimension < limit
        ? 'not-required'
        : 'required'
  const content: Record<QSupportStatus, { label: QLocalizedText; recommendation: QLocalizedText }> = {
    'not-required': {
      label: text('无需支护区', 'Support not required'),
      recommendation: text('点位位于无支护极限以内；仍需结合现场块体稳定、施工扰动和工程要求复核。', 'The point lies within the unsupported limit; verify against block stability, construction disturbance, and project requirements.'),
    },
    required: {
      label: text('需支护区', 'Support required'),
      recommendation: text('点位超过无支护极限，应开展支护设计；本示意不提供支护类型或厚度。', 'The point exceeds the unsupported limit; support design is required. This schematic does not prescribe support type or thickness.'),
    },
    boundary: {
      label: text('无支护极限边界', 'Unsupported-limit boundary'),
      recommendation: text('点位落在数值边界附近，按需支护侧保守处理并结合现场条件复核。', 'The point is numerically close to the boundary; treat it conservatively as requiring support and verify site conditions.'),
    },
    'outside-chart': {
      label: text('示意图范围外', 'Outside schematic range'),
      recommendation: text('Q 或 De 超出示意范围，不自动判断是否需要支护；应结合工程条件进行专项设计。', 'Q or De is outside the schematic range, so no automatic support decision is made; perform project-specific assessment and design.'),
    },
  }
  return {
    mode: 'limit',
    status,
    maximumUnsupportedDimension: limit,
    demandRatio,
    ...content[status],
    sourceNote: Q_SUPPORT_DESCRIPTION,
  }
}

export function calculateQ(input: QFormState | unknown): QResult {
  const state = normalizeQState(input)
  const issues = validateQState(state)
  const errors = issues.filter((item) => item.severity === 'error')
  if (errors.length > 0) throw new QValidationError(errors)

  const modifiers: QFactorModifiers = { jnSite: state.jnSite, jrWideSpacing: state.jrWideSpacing }
  const effectiveRqd = Math.max(10, state.rqd as number)
  const jn = resolveFactorInput(Q_JN_OPTIONS, state.jnId, state.jnValue, 'Jn', modifiers)
  const jr = resolveFactorInput(Q_JR_OPTIONS, state.jrId, state.jrValue, 'Jr', modifiers)
  const ja = resolveFactorInput(Q_JA_OPTIONS, state.jaId, state.jaValue, 'Ja', modifiers)
  const jw = resolveFactorInput(Q_JW_OPTIONS, state.jwId, state.jwValue, 'Jw', modifiers)
  const srf = resolveFactorInput(Q_SRF_OPTIONS, state.srfId, state.srfValue, 'SRF', modifiers)
  const esrOption = findEsrOption(state.esrId)
  const esr = esrOption ? resolveEsr(esrOption, state.esrValue) : null
  const blockSize = effectiveRqd / jn.value
  const jointShearStrength = jr.value / ja.value
  const activeStress = jw.value / srf.value
  const q = blockSize * jointShearStrength * activeStress
  const equivalentDimension = state.span != null && esr ? state.span / esr.value : null
  const warnings = issues.filter((item) => item.severity === 'warning')
  if (
    state.supportMode === 'chart' &&
    equivalentDimension != null &&
    q <= 0.1 &&
    esr != null &&
    esr.value > 1 &&
    (state.esrId === 'circular_shaft' || state.esrId === 'rectangular_shaft' || state.esrId === 'permanent_general' || state.esrId === 'storage_minor')
  ) {
    warnings.push(
      issue(
        'esrValue',
        'low_q_esr',
        'warning',
        '当 Q≤0.1 时，竖井、永久矿山巷道及小型交通隧洞建议采用 ESR＝1.0；当前未改写已选 ESR。',
        'When Q ≤ 0.1, ESR = 1.0 is recommended for shafts, permanent mine openings and minor traffic tunnels; the selected ESR is left unchanged.'
      )
    )
  }

  return {
    standard: Q_STANDARD,
    originalRqd: state.rqd as number,
    effectiveRqd,
    factors: { jn, jr, ja, jw, srf },
    breakdown: {
      blockSize: round(blockSize),
      jointShearStrength: round(jointShearStrength),
      activeStress: round(activeStress),
    },
    q,
    grade: gradeFromQ(q),
    quality: qualityFromQ(q),
    span: state.span,
    esr,
    equivalentDimension,
    support: equivalentDimension == null ? null : state.supportMode === 'chart' ? supportFromChart(q, equivalentDimension) : supportFromQ(q, equivalentDimension),
    warnings,
    formula: text('Q = (RQD / Jn) × (Jr / Ja) × (Jw / SRF)', 'Q = (RQD / Jn) × (Jr / Ja) × (Jw / SRF)'),
    sourceNote: Q_STANDARD.sourceNote,
  }
}

export function tryCalculateQ(input: QFormState | unknown): QResult | null {
  try {
    return calculateQ(input)
  } catch {
    return null
  }
}

export function getQAnalysis(result: QResult): QAnalysisItem[] {
  const { jn, jr, ja, jw, srf } = result.factors
  return [
    {
      key: 'blockSize',
      title: text('岩块尺寸指标 RQD / Jn', 'Block-size quotient RQD / Jn'),
      value: formatQValue(result.breakdown.blockSize),
      description: text(
        `采用计算 RQD ${result.effectiveRqd} / ${jn.value} = ${formatQValue(result.breakdown.blockSize)}，表示岩体完整程度与节理组数共同控制的相对岩块尺度。`,
        `Calculated RQD ${result.effectiveRqd} / ${jn.value} = ${formatQValue(result.breakdown.blockSize)}, expressing the relative block scale governed by rock integrity and joint-set count.`
      ),
    },
    {
      key: 'jointShearStrength',
      title: text('节理抗剪指标 Jr / Ja', 'Joint shear-strength quotient Jr / Ja'),
      value: formatQValue(result.breakdown.jointShearStrength),
      description: text(
        `${jr.value} / ${ja.value} = ${formatQValue(result.breakdown.jointShearStrength)}，反映节理面粗糙度与蚀变或填充对抗剪条件的组合。`,
        `Jr ${jr.value} / Ja ${ja.value} = ${formatQValue(result.breakdown.jointShearStrength)}, combining joint roughness with alteration or filling conditions that affect shear resistance.`
      ),
    },
    {
      key: 'activeStress',
      title: text('水与应力指标 Jw / SRF', 'Water-stress quotient Jw / SRF'),
      value: formatQValue(result.breakdown.activeStress),
      description: text(
        `${jw.value} / ${srf.value} = ${formatQValue(result.breakdown.activeStress)}，反映节理水条件与应力折减条件的组合。`,
        `Jw ${jw.value} / SRF ${srf.value} = ${formatQValue(result.breakdown.activeStress)}, combining joint-water conditions with the stress-reduction condition.`
      ),
    },
  ]
}

function factorValue(factor: QResolvedFactor): string {
  return `${factor.value}${factor.usedConservativeDefault ? '（保守取值）' : ''}`
}

function factorBasis(factor: QResolvedFactor, state: QFormState): QLocalizedText {
  if (factor.symbol === 'Jn' && state.jnSite === 'intersection') {
    return text(`${factor.label.zh}；巷道交叉点按 3.0×Jn。`, `${factor.label.en}; tunnel intersection uses 3.0×Jn.`)
  }
  if (factor.symbol === 'Jn' && state.jnSite === 'portal') {
    return text(`${factor.label.zh}；穿脉按 2.0×Jn。`, `${factor.label.en}; cross-cut uses 2.0×Jn.`)
  }
  if (factor.symbol === 'Jr' && state.jrWideSpacing) {
    return text(`${factor.label.zh}；相关节理组平均间距 > 3 m，Jr + 1.0。`, `${factor.label.en}; relevant joint-set spacing > 3 m, Jr + 1.0.`)
  }
  return factor.label
}

export function describeQ(input: QFormState | unknown, suppliedResult?: QResult): QDescriptionRow[] {
  const state = normalizeQState(input)
  const result = suppliedResult ?? calculateQ(input)
  const rows: QDescriptionRow[] = [
    {
      key: 'RQD',
      label: text('岩石质量指标 RQD', 'Rock quality designation RQD'),
      value: `${result.originalRqd}%`,
      basis:
        result.originalRqd < 10
          ? text('实测值小于 10%，计算采用名义值 10%。', 'Measured value is below 10%; nominal 10% is used in the calculation.')
          : text('采用实测值。', 'Measured value used.'),
    },
  ]
  for (const factor of [result.factors.jn, result.factors.jr, result.factors.ja, result.factors.jw, result.factors.srf]) {
    rows.push({
      key: factor.symbol,
      label: text(`${factor.symbol} 参数`, `${factor.symbol} factor`),
      value: factorValue(factor),
      basis: factorBasis(factor, state),
    })
  }
  rows.push(
    {
      key: 'Q',
      label: text('Q 值', 'Q value'),
      value: formatQValue(result.q),
      basis: result.formula,
    },
    {
      key: 'grade',
      label: text('岩体质量等级', 'Rock-mass quality class'),
      value: result.grade.label.zh,
      basis: text(result.grade.range, result.grade.range),
    }
  )
  for (const analysis of getQAnalysis(result)) {
    rows.push({ key: analysis.key, label: analysis.title, value: analysis.value, basis: analysis.description })
  }
  if (result.span != null && result.esr && result.equivalentDimension != null && result.support) {
    rows.push(
      {
        key: 'span',
        label: text('开挖跨度、直径或高度', 'Excavation span, diameter, or height'),
        value: `${result.span} m`,
        basis: text('工程输入', 'Project input'),
      },
      {
        key: 'ESR',
        label: text('开挖支护比 ESR', 'Excavation support ratio ESR'),
        value: `${result.esr.value}${result.esr.usedConservativeDefault ? '（保守取区间下限）' : ''}`,
        basis: result.esr.label,
      },
      {
        key: 'De',
        label: text('等效尺寸 De', 'Equivalent dimension De'),
        value: `${result.equivalentDimension} m`,
        basis: text('De = 开挖尺寸 / ESR', 'De = excavation dimension / ESR'),
      },
      {
        key: 'support',
        label: text('支护需求判定', result.support.mode === 'chart' ? 'Support chart' : 'Unsupported-limit screening'),
        value: result.support.label.zh,
        basis: result.support.sourceNote,
      }
    )
    if (result.support.mode === 'chart') {
      const chart = result.support
      if (chart.shotcreteThicknessCm != null) {
        rows.push({
          key: 'shotcrete',
          label: text('喷层厚度', 'Shotcrete thickness'),
          value: `${formatQValue(chart.shotcreteThicknessCm)} cm`,
          basis: text('支护图等值线内插', 'Interpolated from support-chart isolines'),
        })
      }
      const spacing = chart.boltSpacingWithSfrM ?? chart.boltSpacingWithoutSfrM
      if (spacing != null) {
        rows.push({
          key: 'boltSpacing',
          label: text(chart.boltSpacingWithSfrM != null ? '锚杆间距（有 Sfr）' : '锚杆间距（无 Sfr）', chart.boltSpacingWithSfrM != null ? 'Bolt spacing with Sfr' : 'Bolt spacing without Sfr'),
          value: `${formatQValue(spacing)} m`,
          basis: text('支护图等值线内插', 'Interpolated from support-chart isolines'),
        })
      }
      if (chart.boltLengthM != null) {
        rows.push({
          key: 'boltLength',
          label: text('锚杆长度', 'Bolt length'),
          value: `${formatQValue(chart.boltLengthM)} m`,
          basis: text('L = 2 + 0.15 De（ESR = 1 尺）', 'L = 2 + 0.15 De (ESR = 1 scale)'),
        })
      }
    }
  }
  return rows
}

export const createInitial = createInitialQState
export const normalize = normalizeQState
export const validate = validateQState
export const calculate = calculateQ
export const describe = describeQ
