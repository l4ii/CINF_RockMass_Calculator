/**
 * Barton Q-system rock-mass classification and preliminary support design.
 *
 * Q = (RQD / Jn) * (Jr / Ja) * (Jw / SRF)
 *
 * Several Q-system table cells are ranges rather than single values. The
 * selected table cell and the engineer-selected value are therefore stored
 * separately. If the value is omitted, this module resolves the range toward
 * the conservative (lower-Q) end and records the decision in the result.
 */

export type QIssueSeverity = 'error' | 'warning'
export type QFactorSymbol = 'Jn' | 'Jr' | 'Ja' | 'Jw' | 'SRF'
export type QGradeId =
  | 'exceptionally_good'
  | 'extremely_good'
  | 'very_good'
  | 'good'
  | 'fair'
  | 'poor'
  | 'very_poor'
  | 'extremely_poor'
  | 'exceptionally_poor'
export type QSupportCategory = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

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

export interface QRqdRule {
  id: string
  label: QLocalizedText
  measuredRange: QValueRange
  effectiveValue: number | 'measured'
  sourceRef: string
  note: QLocalizedText
}

export interface QFactorOption {
  id: string
  symbol: QFactorSymbol
  group: QLocalizedText
  label: QLocalizedText
  range: QValueRange
  sourceRef: string
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
  jrId: string
  jrValue: number | null
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
}

export interface QSupportRecommendation {
  category: QSupportCategory
  demandRatio: number
  label: QLocalizedText
  recommendation: QLocalizedText
  isApproximation: true
  sourceNote: QLocalizedText
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
  span: number
  esr: QResolvedEsr
  equivalentDimension: number
  support: QSupportRecommendation
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
  title: text('Q-System 岩体质量分级与支护设计', 'Q-system rock-mass classification and support design'),
  edition: '经典六参数表；支护图参考 NGI 2025',
  references: [
    'Barton, Lien & Lunde (1974), Engineering classification of rock masses for the design of tunnel support',
    'NGI (2015), Using the Q-system: Rock mass classification and support design',
    'NGI Q-system support chart (2025)',
  ],
  sourceNote: text(
    'Q 值采用 Barton 六参数公式及通用参数表。区间项未指定工程取值时，按使 Q 值更低的一端保守计算。支护分区是对 NGI 支护图的经验离散近似，仅用于方案初判，不能代替原图查读、现场工程判断和专项设计。',
    'Q uses the Barton six-factor equation and commonly published factor tables. If no project value is supplied for a range, the end producing the lower Q is used conservatively. Support zones are an empirical discretized approximation of the NGI support chart for preliminary screening only; they do not replace reading the original chart, engineering judgement, or detailed design.'
  ),
}

/** RQD is measured numerically; this table captures the Q-system minimum rule. */
export const Q_RQD_TABLE: readonly QRqdRule[] = [
  {
    id: 'nominal_minimum',
    label: text('实测 RQD 为 0%–10%', 'Measured RQD from 0% to 10%'),
    measuredRange: range(0, 10),
    effectiveValue: 10,
    sourceRef: 'Q-system RQD note',
    note: text('计算时采用名义值 10%，实测值仍在结果中保留。', 'Use a nominal 10% in the calculation while retaining the measured value.'),
  },
  {
    id: 'measured_value',
    label: text('实测 RQD 大于 10% 且不超过 100%', 'Measured RQD above 10% and at most 100%'),
    measuredRange: range(10, 100),
    effectiveValue: 'measured',
    sourceRef: 'Q-system RQD definition',
    note: text('计算时采用实测值。', 'Use the measured value in the calculation.'),
  },
]

const jointSetGroup = text('节理组数', 'Joint-set number')

export const Q_JN_OPTIONS: readonly QFactorOption[] = [
  { id: 'massive', symbol: 'Jn', group: jointSetGroup, label: text('整体岩体，无节理或仅少量节理', 'Massive rock, no or few joints'), range: range(0.5, 1), sourceRef: 'Q-system Jn table' },
  { id: 'one_set', symbol: 'Jn', group: jointSetGroup, label: text('一组节理', 'One joint set'), range: range(2), sourceRef: 'Q-system Jn table' },
  { id: 'one_set_random', symbol: 'Jn', group: jointSetGroup, label: text('一组节理加零星节理', 'One joint set plus random joints'), range: range(3), sourceRef: 'Q-system Jn table' },
  { id: 'two_sets', symbol: 'Jn', group: jointSetGroup, label: text('两组节理', 'Two joint sets'), range: range(4), sourceRef: 'Q-system Jn table' },
  { id: 'two_sets_random', symbol: 'Jn', group: jointSetGroup, label: text('两组节理加零星节理', 'Two joint sets plus random joints'), range: range(6), sourceRef: 'Q-system Jn table' },
  { id: 'three_sets', symbol: 'Jn', group: jointSetGroup, label: text('三组节理', 'Three joint sets'), range: range(9), sourceRef: 'Q-system Jn table' },
  { id: 'three_sets_random', symbol: 'Jn', group: jointSetGroup, label: text('三组节理加零星节理', 'Three joint sets plus random joints'), range: range(12), sourceRef: 'Q-system Jn table' },
  {
    id: 'four_or_more',
    symbol: 'Jn',
    group: jointSetGroup,
    label: text('四组或更多节理，呈碎块状', 'Four or more joint sets, heavily jointed or sugar-cube rock'),
    range: range(15),
    sourceRef: 'Q-system Jn table',
  },
  { id: 'crushed', symbol: 'Jn', group: jointSetGroup, label: text('压碎、土状岩体', 'Crushed, earth-like rock'), range: range(20), sourceRef: 'Q-system Jn table' },
]

const wallContactGroup = text(
  '两侧岩壁接触，或剪切位移小于 10 cm 时接触',
  'Rock-wall contact, or contact before 10 cm shear'
)
const noContactGroup = text('剪切时两侧岩壁不接触', 'No rock-wall contact when sheared')

export const Q_JR_OPTIONS: readonly QFactorOption[] = [
  { id: 'discontinuous', symbol: 'Jr', group: wallContactGroup, label: text('不连续节理', 'Discontinuous joints'), range: range(4), sourceRef: 'Q-system Jr table' },
  { id: 'rough_undulating', symbol: 'Jr', group: wallContactGroup, label: text('粗糙或不规则、起伏面', 'Rough or irregular, undulating'), range: range(3), sourceRef: 'Q-system Jr table' },
  { id: 'smooth_undulating', symbol: 'Jr', group: wallContactGroup, label: text('平滑、起伏面', 'Smooth, undulating'), range: range(2), sourceRef: 'Q-system Jr table' },
  { id: 'slickensided_undulating', symbol: 'Jr', group: wallContactGroup, label: text('镜面、起伏面', 'Slickensided, undulating'), range: range(1.5), sourceRef: 'Q-system Jr table' },
  { id: 'rough_planar', symbol: 'Jr', group: wallContactGroup, label: text('粗糙或不规则、平直面', 'Rough or irregular, planar'), range: range(1.5), sourceRef: 'Q-system Jr table' },
  { id: 'smooth_planar', symbol: 'Jr', group: wallContactGroup, label: text('平滑、平直面', 'Smooth, planar'), range: range(1), sourceRef: 'Q-system Jr table' },
  { id: 'slickensided_planar', symbol: 'Jr', group: wallContactGroup, label: text('镜面、平直面', 'Slickensided, planar'), range: range(0.5), sourceRef: 'Q-system Jr table' },
  {
    id: 'clay_zone_no_contact',
    symbol: 'Jr',
    group: noContactGroup,
    label: text('含黏土矿物带，厚度足以阻止岩壁接触', 'Clay-mineral zone thick enough to prevent wall contact'),
    range: range(1),
    sourceRef: 'Q-system Jr table',
  },
  {
    id: 'crushed_zone_no_contact',
    symbol: 'Jr',
    group: noContactGroup,
    label: text('砂质、砾质或压碎带，厚度足以阻止岩壁接触', 'Sandy, gravelly or crushed zone thick enough to prevent wall contact'),
    range: range(1),
    sourceRef: 'Q-system Jr table',
  },
]

const unalteredContactGroup = text('岩壁接触，节理面基本未蚀变', 'Rock-wall contact, essentially unaltered walls')
const alteredContactGroup = text('岩壁接触，节理面有蚀变或涂层', 'Rock-wall contact, altered walls or coatings')
const thinFillingGroup = text('剪切位移小于 10 cm 时岩壁接触，填充厚度小于 5 mm', 'Wall contact before 10 cm shear, filling under 5 mm')
const crushedClayZoneGroup = text('压碎岩与黏土带，剪切时岩壁不接触', 'Crushed-rock and clay zones, no wall contact')
const thickClayZoneGroup = text('厚而连续的黏土带，剪切时岩壁不接触', 'Thick continuous clay zones, no wall contact')

export const Q_JA_OPTIONS: readonly QFactorOption[] = [
  {
    id: 'healed_hard_filling',
    symbol: 'Ja',
    group: unalteredContactGroup,
    label: text('紧密愈合，硬质、不软化且不透水的填充物', 'Tightly healed with hard, non-softening, impermeable filling'),
    range: range(0.75),
    sourceRef: 'Q-system Ja table',
  },
  { id: 'unaltered_walls', symbol: 'Ja', group: unalteredContactGroup, label: text('节理壁未蚀变，仅有表面染色', 'Unaltered joint walls, surface staining only'), range: range(1), sourceRef: 'Q-system Ja table' },
  {
    id: 'slightly_altered',
    symbol: 'Ja',
    group: alteredContactGroup,
    label: text('轻微蚀变，非软化矿物涂层、砂粒或无黏土的崩解岩屑', 'Slightly altered, non-softening coatings, sandy particles or clay-free disintegrated rock'),
    range: range(2),
    sourceRef: 'Q-system Ja table',
  },
  { id: 'silty_sandy_clay_coating', symbol: 'Ja', group: alteredContactGroup, label: text('粉质或砂质黏土涂层，黏土含量少且不软化', 'Silty or sandy clay coating, small non-softening clay fraction'), range: range(3), sourceRef: 'Q-system Ja table' },
  {
    id: 'softening_clay_coating',
    symbol: 'Ja',
    group: alteredContactGroup,
    label: text('软化或低摩擦黏土矿物涂层，少量膨胀性黏土', 'Softening or low-friction clay-mineral coating, small amount of swelling clay'),
    range: range(4),
    sourceRef: 'Q-system Ja table',
  },
  { id: 'sandy_particles', symbol: 'Ja', group: thinFillingGroup, label: text('砂粒或无黏土的崩解岩屑', 'Sandy particles or clay-free disintegrated rock'), range: range(4), sourceRef: 'Q-system Ja table' },
  { id: 'thin_strong_clay', symbol: 'Ja', group: thinFillingGroup, label: text('强超固结、非软化黏土填充', 'Strongly over-consolidated, non-softening clay filling'), range: range(6), sourceRef: 'Q-system Ja table' },
  { id: 'thin_soft_clay', symbol: 'Ja', group: thinFillingGroup, label: text('中低超固结、软化黏土填充', 'Medium/low over-consolidated, softening clay filling'), range: range(8), sourceRef: 'Q-system Ja table' },
  {
    id: 'thin_swelling_clay',
    symbol: 'Ja',
    group: thinFillingGroup,
    label: text('膨胀性黏土填充', 'Swelling-clay filling'),
    range: range(8, 12),
    sourceRef: 'Q-system Ja table',
    note: text('取值取决于膨胀性黏土含量及膨胀压力。', 'Value depends on the swelling-clay fraction and swelling pressure.'),
  },
  { id: 'crushed_strong_clay', symbol: 'Ja', group: crushedClayZoneGroup, label: text('强超固结、非软化黏土', 'Strongly over-consolidated, non-softening clay'), range: range(6), sourceRef: 'Q-system Ja table' },
  { id: 'crushed_soft_clay', symbol: 'Ja', group: crushedClayZoneGroup, label: text('中低超固结、软化黏土', 'Medium/low over-consolidated, softening clay'), range: range(8), sourceRef: 'Q-system Ja table' },
  {
    id: 'crushed_swelling_clay',
    symbol: 'Ja',
    group: crushedClayZoneGroup,
    label: text('膨胀性黏土', 'Swelling clay'),
    range: range(8, 12),
    sourceRef: 'Q-system Ja table',
  },
  { id: 'thick_strong_clay', symbol: 'Ja', group: thickClayZoneGroup, label: text('强超固结、非软化厚黏土带', 'Thick, strongly over-consolidated non-softening clay zone'), range: range(10), sourceRef: 'Q-system Ja table' },
  { id: 'thick_soft_clay', symbol: 'Ja', group: thickClayZoneGroup, label: text('中低超固结、软化厚黏土带', 'Thick, medium/low over-consolidated softening clay zone'), range: range(13), sourceRef: 'Q-system Ja table' },
  {
    id: 'thick_swelling_clay',
    symbol: 'Ja',
    group: thickClayZoneGroup,
    label: text('厚而连续的膨胀性黏土带', 'Thick continuous swelling-clay zone'),
    range: range(13, 20),
    sourceRef: 'Q-system Ja table',
  },
]

const waterGroup = text('节理水折减', 'Joint-water reduction')

export const Q_JW_OPTIONS: readonly QFactorOption[] = [
  { id: 'dry_minor', symbol: 'Jw', group: waterGroup, label: text('干燥或少量局部渗水（约 <5 L/min）', 'Dry or minor local inflow (about <5 L/min)'), range: range(1), sourceRef: 'Q-system Jw table' },
  { id: 'medium_inflow', symbol: 'Jw', group: waterGroup, label: text('中等涌水或水压，偶有节理填充物冲蚀', 'Medium inflow or pressure, occasional washout of joint filling'), range: range(0.66), sourceRef: 'Q-system Jw table' },
  { id: 'large_inflow_unfilled', symbol: 'Jw', group: waterGroup, label: text('坚硬岩体未填充节理中的大量涌水或高水压', 'Large inflow or high pressure in competent rock with unfilled joints'), range: range(0.5), sourceRef: 'Q-system Jw table' },
  { id: 'large_inflow_washout', symbol: 'Jw', group: waterGroup, label: text('大量涌水或高水压并显著冲蚀填充物', 'Large inflow or high pressure with considerable filling washout'), range: range(0.33), sourceRef: 'Q-system Jw table' },
  { id: 'exceptional_decaying', symbol: 'Jw', group: waterGroup, label: text('爆破后异常高涌水或水压，随时间衰减', 'Exceptionally high inflow or pressure after blasting, decaying with time'), range: range(0.1, 0.2), sourceRef: 'Q-system Jw table' },
  { id: 'exceptional_sustained', symbol: 'Jw', group: waterGroup, label: text('持续异常高涌水或水压，无明显衰减', 'Exceptionally high sustained inflow or pressure without noticeable decay'), range: range(0.05, 0.1), sourceRef: 'Q-system Jw table' },
]

const weaknessZoneGroup = text('穿过开挖的软弱带或剪切带', 'Weakness or shear zones intersecting the excavation')
const competentStressGroup = text('坚硬完整岩体中的应力状态', 'Stress state in competent rock')
const squeezingGroup = text('塑性岩体挤压变形', 'Squeezing ground')
const swellingGroup = text('膨胀岩化学膨胀', 'Swelling ground')

export const Q_SRF_OPTIONS: readonly QFactorOption[] = [
  { id: 'multiple_clay_weakness', symbol: 'SRF', group: weaknessZoneGroup, label: text('多条含黏土或化学分解岩的软弱带，围岩很松散', 'Multiple clay-bearing or chemically disintegrated weakness zones, very loose surrounding rock'), range: range(10), sourceRef: 'Q-system SRF table' },
  { id: 'single_clay_shallow', symbol: 'SRF', group: weaknessZoneGroup, label: text('单条含黏土或化学分解岩的软弱带，埋深 ≤50 m', 'Single clay-bearing or chemically disintegrated weakness zone, depth ≤50 m'), range: range(5), sourceRef: 'Q-system SRF table' },
  { id: 'single_clay_deep', symbol: 'SRF', group: weaknessZoneGroup, label: text('单条含黏土或化学分解岩的软弱带，埋深 >50 m', 'Single clay-bearing or chemically disintegrated weakness zone, depth >50 m'), range: range(2.5), sourceRef: 'Q-system SRF table' },
  { id: 'multiple_clay_free_shear', symbol: 'SRF', group: weaknessZoneGroup, label: text('坚硬岩体中多条无黏土剪切带，围岩松散', 'Multiple clay-free shear zones in competent rock, loose surrounding rock'), range: range(7.5), sourceRef: 'Q-system SRF table' },
  { id: 'single_clay_free_shallow', symbol: 'SRF', group: weaknessZoneGroup, label: text('坚硬岩体中单条无黏土剪切带，埋深 ≤50 m', 'Single clay-free shear zone in competent rock, depth ≤50 m'), range: range(5), sourceRef: 'Q-system SRF table' },
  { id: 'single_clay_free_deep', symbol: 'SRF', group: weaknessZoneGroup, label: text('坚硬岩体中单条无黏土剪切带，埋深 >50 m', 'Single clay-free shear zone in competent rock, depth >50 m'), range: range(2.5), sourceRef: 'Q-system SRF table' },
  { id: 'loose_open_joints', symbol: 'SRF', group: weaknessZoneGroup, label: text('松弛张开节理，强烈节理化或碎块状岩体', 'Loose open joints, heavily jointed or sugar-cube rock'), range: range(5), sourceRef: 'Q-system SRF table' },
  { id: 'low_stress', symbol: 'SRF', group: competentStressGroup, label: text('低应力、近地表、节理张开', 'Low stress, near surface, open joints'), range: range(2.5), sourceRef: 'Q-system SRF table' },
  { id: 'medium_stress', symbol: 'SRF', group: competentStressGroup, label: text('中等应力，有利应力状态', 'Medium stress, favourable stress condition'), range: range(1), sourceRef: 'Q-system SRF table' },
  { id: 'high_stress_stable', symbol: 'SRF', group: competentStressGroup, label: text('高应力、结构很紧密，通常有利于稳定', 'High stress, very tight structure, generally favourable to stability'), range: range(0.5, 2), sourceRef: 'Q-system SRF table' },
  { id: 'mild_rock_burst', symbol: 'SRF', group: competentStressGroup, label: text('完整坚硬岩体，轻度片帮或岩爆', 'Massive competent rock, mild slabbing or rock burst'), range: range(5, 50), sourceRef: 'Q-system SRF table' },
  { id: 'heavy_rock_burst', symbol: 'SRF', group: competentStressGroup, label: text('完整坚硬岩体，强烈岩爆', 'Massive competent rock, heavy rock burst'), range: range(50, 200), sourceRef: 'Q-system SRF table' },
  { id: 'mild_squeezing', symbol: 'SRF', group: squeezingGroup, label: text('轻度挤压变形', 'Mild squeezing pressure'), range: range(5, 10), sourceRef: 'Q-system SRF table' },
  { id: 'heavy_squeezing', symbol: 'SRF', group: squeezingGroup, label: text('强烈挤压变形', 'Heavy squeezing pressure'), range: range(10, 20), sourceRef: 'Q-system SRF table' },
  { id: 'mild_swelling', symbol: 'SRF', group: swellingGroup, label: text('轻度膨胀压力', 'Mild swelling pressure'), range: range(5, 10), sourceRef: 'Q-system SRF table' },
  { id: 'heavy_swelling', symbol: 'SRF', group: swellingGroup, label: text('强烈膨胀压力', 'Heavy swelling pressure'), range: range(10, 15), sourceRef: 'Q-system SRF table' },
]

export const Q_ESR_OPTIONS: readonly QEsrOption[] = [
  { id: 'temporary_mine', label: text('临时矿山巷道', 'Temporary mine openings'), range: range(3, 5), sourceRef: 'Q-system ESR table' },
  { id: 'circular_shaft', label: text('圆形竖井', 'Circular shafts'), range: range(2.5), sourceRef: 'Q-system ESR table' },
  { id: 'rectangular_shaft', label: text('矩形竖井', 'Rectangular shafts'), range: range(2), sourceRef: 'Q-system ESR table' },
  { id: 'permanent_general', label: text('永久矿山巷道、水工隧洞或大型隧洞导洞', 'Permanent mine openings, water tunnels or pilot tunnels for large excavations'), range: range(1.6), sourceRef: 'Q-system ESR table' },
  { id: 'storage_minor', label: text('储藏洞室、输水隧洞或小型公路和铁路隧洞', 'Storage rooms, water-treatment tunnels, minor road and railway tunnels'), range: range(1.3), sourceRef: 'Q-system ESR table' },
  { id: 'major_civil', label: text('主要公路铁路隧洞、电站厂房、地下民防工程及交叉口', 'Major road/rail tunnels, power stations, civil-defence chambers and intersections'), range: range(1), sourceRef: 'Q-system ESR table' },
  { id: 'public_critical', label: text('公共或重要地下设施、重要洞室', 'Public or critical underground facilities and important caverns'), range: range(0.8), sourceRef: 'Q-system ESR table' },
]

export const Q_GRADES: readonly QGradeInfo[] = [
  { id: 'exceptionally_good', label: text('极好', 'Exceptionally good'), range: 'Q ≥ 400' },
  { id: 'extremely_good', label: text('特好', 'Extremely good'), range: '100 ≤ Q < 400' },
  { id: 'very_good', label: text('很好', 'Very good'), range: '40 ≤ Q < 100' },
  { id: 'good', label: text('好', 'Good'), range: '10 ≤ Q < 40' },
  { id: 'fair', label: text('一般', 'Fair'), range: '4 ≤ Q < 10' },
  { id: 'poor', label: text('差', 'Poor'), range: '1 ≤ Q < 4' },
  { id: 'very_poor', label: text('很差', 'Very poor'), range: '0.1 ≤ Q < 1' },
  { id: 'extremely_poor', label: text('特差', 'Extremely poor'), range: '0.01 ≤ Q < 0.1' },
  { id: 'exceptionally_poor', label: text('极差', 'Exceptionally poor'), range: 'Q < 0.01' },
]

export const createInitialQState = (): QFormState => ({
  rqd: null,
  jnId: 'two_sets',
  jnValue: null,
  jrId: 'rough_undulating',
  jrValue: null,
  jaId: 'unaltered_walls',
  jaValue: null,
  jwId: 'dry_minor',
  jwValue: null,
  srfId: 'medium_stress',
  srfValue: null,
  span: null,
  esrId: 'permanent_general',
  esrValue: null,
})

export const initialQFormState = createInitialQState

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

export function normalizeQState(value: unknown): QFormState {
  const raw = asRecord(value)
  const initial = createInitialQState()
  return {
    rqd: finiteNumber(raw.rqd ?? raw.RQD),
    jnId: knownId(raw.jnId, Q_JN_OPTIONS, initial.jnId),
    jnValue: finiteNumber(raw.jnValue ?? raw.Jn),
    jrId: knownId(raw.jrId, Q_JR_OPTIONS, initial.jrId),
    jrValue: finiteNumber(raw.jrValue ?? raw.Jr),
    jaId: knownId(raw.jaId, Q_JA_OPTIONS, initial.jaId),
    jaValue: finiteNumber(raw.jaValue ?? raw.Ja),
    jwId: knownId(raw.jwId, Q_JW_OPTIONS, initial.jwId),
    jwValue: finiteNumber(raw.jwValue ?? raw.Jw),
    srfId: knownId(raw.srfId, Q_SRF_OPTIONS, initial.srfId),
    srfValue: finiteNumber(raw.srfValue ?? raw.SRF),
    span: finiteNumber(raw.span ?? raw.excavationSpan ?? raw.diameterOrHeight),
    esrId: knownId(raw.esrId, Q_ESR_OPTIONS, initial.esrId),
    esrValue: finiteNumber(raw.esrValue ?? raw.ESR),
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

function selectedOption(options: readonly QFactorOption[], id: string): QFactorOption {
  return options.find((item) => item.id === id) as QFactorOption
}

function selectedEsrOption(id: string): QEsrOption {
  return Q_ESR_OPTIONS.find((item) => item.id === id) as QEsrOption
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

export function validateQState(input: QFormState | unknown): QValidationIssue[] {
  const state = normalizeQState(input)
  const issues: QValidationIssue[] = []
  if (state.rqd == null) issues.push(issue('rqd', 'required', 'error', '请输入岩石质量指标 RQD。', 'Enter rock quality designation RQD.'))
  else if (state.rqd < 0 || state.rqd > 100) issues.push(issue('rqd', 'out_of_range', 'error', 'RQD 必须位于 0%–100%。', 'RQD must be between 0% and 100%.'))
  else if (state.rqd < 10) {
    issues.push(issue('rqd', 'nominal_minimum', 'warning', '实测 RQD 小于 10%，Q 计算按名义值 10% 代入。', 'Measured RQD is below 10%; the nominal 10% is used in Q.'))
  }
  if (state.span == null) issues.push(issue('span', 'required', 'error', '请输入开挖跨度、直径或高度。', 'Enter excavation span, diameter, or height.'))
  else if (state.span <= 0) issues.push(issue('span', 'out_of_range', 'error', '开挖尺寸必须大于 0 m。', 'Excavation dimension must be greater than 0 m.'))

  const jn = selectedOption(Q_JN_OPTIONS, state.jnId)
  const jr = selectedOption(Q_JR_OPTIONS, state.jrId)
  const ja = selectedOption(Q_JA_OPTIONS, state.jaId)
  const jw = selectedOption(Q_JW_OPTIONS, state.jwId)
  const srf = selectedOption(Q_SRF_OPTIONS, state.srfId)
  const esr = selectedEsrOption(state.esrId)
  validateRangeValue(issues, 'jnValue', state.jnValue, jn.range, 'Jn', 'maximum')
  validateRangeValue(issues, 'jrValue', state.jrValue, jr.range, 'Jr', 'minimum')
  validateRangeValue(issues, 'jaValue', state.jaValue, ja.range, 'Ja', 'maximum')
  validateRangeValue(issues, 'jwValue', state.jwValue, jw.range, 'Jw', 'minimum')
  validateRangeValue(issues, 'srfValue', state.srfValue, srf.range, 'SRF', 'maximum')
  validateRangeValue(issues, 'esrValue', state.esrValue, esr.range, 'ESR', 'minimum')
  return issues
}

function round(value: number, digits = 4): number {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
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

function gradeFromQ(q: number): QGradeInfo {
  if (q >= 400) return Q_GRADES[0]
  if (q >= 100) return Q_GRADES[1]
  if (q >= 40) return Q_GRADES[2]
  if (q >= 10) return Q_GRADES[3]
  if (q >= 4) return Q_GRADES[4]
  if (q >= 1) return Q_GRADES[5]
  if (q >= 0.1) return Q_GRADES[6]
  if (q >= 0.01) return Q_GRADES[7]
  return Q_GRADES[8]
}

interface QSupportTemplate {
  maximumRatio: number
  category: QSupportCategory
  label: QLocalizedText
  recommendation: QLocalizedText
}

const SUPPORT_TEMPLATES: readonly QSupportTemplate[] = [
  {
    maximumRatio: 0.5,
    category: 1,
    label: text('基本无需支护', 'Generally unsupported'),
    recommendation: text('以地质巡视和局部安全处理为主；最终方案仍应按原 NGI 支护图复核。', 'Use geological inspection and local scaling as the preliminary basis; verify against the original NGI chart.'),
  },
  {
    maximumRatio: 1,
    category: 2,
    label: text('局部锚固', 'Spot bolting'),
    recommendation: text('局部系统处理，按不稳定块体布置点锚杆。', 'Provide local treatment and spot bolts for identified unstable blocks.'),
  },
  {
    maximumRatio: 2,
    category: 3,
    label: text('系统锚杆', 'Systematic bolting'),
    recommendation: text('采用系统锚杆，并结合掌子面揭露调整间距和长度。', 'Use systematic rock bolts, adjusting spacing and length to exposed conditions.'),
  },
  {
    maximumRatio: 4,
    category: 4,
    label: text('系统锚杆与薄层喷射混凝土', 'Systematic bolts and thin shotcrete'),
    recommendation: text('系统锚杆配合约 40–100 mm 喷射混凝土，厚度需按原图和工程条件复核。', 'Combine systematic bolts with about 40–100 mm shotcrete; verify thickness from the original chart and project conditions.'),
  },
  {
    maximumRatio: 8,
    category: 5,
    label: text('纤维喷射混凝土与系统锚杆', 'Fibre-reinforced shotcrete and systematic bolts'),
    recommendation: text('采用系统锚杆与约 50–90 mm 纤维喷射混凝土，必要时加强局部块体。', 'Use systematic bolts with about 50–90 mm fibre-reinforced shotcrete and reinforce local blocks where needed.'),
  },
  {
    maximumRatio: 16,
    category: 6,
    label: text('加厚纤维喷射混凝土与系统锚杆', 'Thicker fibre-reinforced shotcrete and systematic bolts'),
    recommendation: text('采用系统锚杆与约 90–120 mm 纤维喷射混凝土，按变形监测校核。', 'Use systematic bolts with about 90–120 mm fibre-reinforced shotcrete and check against deformation monitoring.'),
  },
  {
    maximumRatio: 32,
    category: 7,
    label: text('重型纤维喷射混凝土支护', 'Heavy fibre-reinforced shotcrete support'),
    recommendation: text('采用系统锚杆与约 120–150 mm 纤维喷射混凝土，并评估钢筋网或加强肋。', 'Use systematic bolts with about 120–150 mm fibre-reinforced shotcrete and assess mesh or reinforced ribs.'),
  },
  {
    maximumRatio: 64,
    category: 8,
    label: text('纤维喷射混凝土与加强肋', 'Fibre-reinforced shotcrete with reinforced ribs'),
    recommendation: text('采用厚层纤维喷射混凝土、系统锚杆和加强肋，需开展专项支护设计。', 'Use thick fibre-reinforced shotcrete, systematic bolts, and reinforced ribs under a dedicated support design.'),
  },
  {
    maximumRatio: Number.POSITIVE_INFINITY,
    category: 9,
    label: text('重型复合支护或混凝土衬砌', 'Heavy composite support or concrete lining'),
    recommendation: text('按极高支护需求开展专项设计，评估重型复合支护、钢拱架及现浇混凝土衬砌。', 'Perform a dedicated design for very high support demand, assessing heavy composite support, steel sets, and cast concrete lining.'),
  },
]

function supportFromQ(q: number, equivalentDimension: number): QSupportRecommendation {
  const demandRatio = equivalentDimension / (2 * q ** 0.4)
  const template = SUPPORT_TEMPLATES.find((item) => demandRatio <= item.maximumRatio) as QSupportTemplate
  return {
    category: template.category,
    demandRatio: round(demandRatio),
    label: template.label,
    recommendation: template.recommendation,
    isApproximation: true,
    sourceNote: text(
      '该分区由 De/(2Q^0.4) 的经验阈值离散得到，并非 NGI 2025 支护图的精确数字化。',
      'This zone is discretized from empirical De/(2Q^0.4) thresholds and is not an exact digitization of the NGI 2025 support chart.'
    ),
  }
}

export function calculateQ(input: QFormState | unknown): QResult {
  const state = normalizeQState(input)
  const issues = validateQState(state)
  const errors = issues.filter((item) => item.severity === 'error')
  if (errors.length > 0) throw new QValidationError(errors)

  const effectiveRqd = Math.max(10, state.rqd as number)
  const jn = resolveFactor(selectedOption(Q_JN_OPTIONS, state.jnId), state.jnValue, 'maximum')
  const jr = resolveFactor(selectedOption(Q_JR_OPTIONS, state.jrId), state.jrValue, 'minimum')
  const ja = resolveFactor(selectedOption(Q_JA_OPTIONS, state.jaId), state.jaValue, 'maximum')
  const jw = resolveFactor(selectedOption(Q_JW_OPTIONS, state.jwId), state.jwValue, 'minimum')
  const srf = resolveFactor(selectedOption(Q_SRF_OPTIONS, state.srfId), state.srfValue, 'maximum')
  const esr = resolveEsr(selectedEsrOption(state.esrId), state.esrValue)
  const blockSize = effectiveRqd / jn.value
  const jointShearStrength = jr.value / ja.value
  const activeStress = jw.value / srf.value
  const q = blockSize * jointShearStrength * activeStress
  const equivalentDimension = (state.span as number) / esr.value

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
    q: round(q, 6),
    grade: gradeFromQ(q),
    span: state.span as number,
    esr,
    equivalentDimension: round(equivalentDimension),
    support: supportFromQ(q, equivalentDimension),
    warnings: issues.filter((item) => item.severity === 'warning'),
    formula: text('Q = (RQD / Jn) × (Jr / Ja) × (Jw / SRF)', 'Q = (RQD / Jn) × (Jr / Ja) × (Jw / SRF)'),
    sourceNote: Q_STANDARD.sourceNote,
  }
}

function factorValue(factor: QResolvedFactor): string {
  return `${factor.value}${factor.usedConservativeDefault ? '（保守取值）' : ''}`
}

export function describeQ(input: QFormState | unknown, suppliedResult?: QResult): QDescriptionRow[] {
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
      basis: factor.label,
    })
  }
  rows.push(
    {
      key: 'Q',
      label: text('Q 值', 'Q value'),
      value: String(result.q),
      basis: result.formula,
    },
    {
      key: 'grade',
      label: text('岩体质量等级', 'Rock-mass quality class'),
      value: result.grade.label.zh,
      basis: text(result.grade.range, result.grade.range),
    },
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
      label: text('初步支护分区', 'Preliminary support zone'),
      value: `${result.support.category} 区：${result.support.label.zh}`,
      basis: result.support.sourceNote,
    }
  )
  return rows
}

export const createInitial = createInitialQState
export const normalize = normalizeQState
export const validate = validateQState
export const calculate = calculateQ
export const describe = describeQ
