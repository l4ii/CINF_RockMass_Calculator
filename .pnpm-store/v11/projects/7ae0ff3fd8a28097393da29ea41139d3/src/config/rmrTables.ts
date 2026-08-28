/** Bieniawski RMR89 查表数据（评分、方向修正、等级与支护建议） */

export const RMR89_STANDARD = {
  storageId: 'bieniawski-rmr89',
  legacyStorageIds: ['bienawski-rmr89'],
  title: 'Bieniawski RMR 岩体地质力学分级',
  titleEn: 'Bieniawski RMR Rock Mass Rating',
  edition: '1989',
  source:
    'Bieniawski, Z. T. (1989). Engineering Rock Mass Classifications. Wiley-Interscience.',
  verificationSource:
    'Hoek, E. Practical Rock Engineering, Chapter 3, Tables 4.4-4.5 (after Bieniawski, 1989).',
  verificationUrl: 'https://home.agh.edu.pl/~cala/hoek/Chapter3.pdf',
} as const

export const RMR89_TABLE_REFS = {
  basic: 'Hoek, Practical Rock Engineering, Table 4.4A (after Bieniawski, 1989)',
  condition: 'Hoek, Practical Rock Engineering, Table 4.4E (after Bieniawski, 1989)',
  adjustment: 'Hoek, Practical Rock Engineering, Table 4.4B (after Bieniawski, 1989)',
  tunnelOrientation: 'Hoek, Practical Rock Engineering, Table 4.4F (after Bieniawski, 1989)',
  classes: 'RMR rock-mass class and engineering-property reference',
  support: 'RMR support-design reference',
} as const

export type ScoreOption = {
  id: string
  label: string
  labelEn: string
  score: number
  sourceRef: string
}

function basicOption(id: string, label: string, labelEn: string, score: number): ScoreOption {
  return { id, label, labelEn, score, sourceRef: RMR89_TABLE_REFS.basic }
}

function conditionOption(id: string, label: string, labelEn: string, score: number): ScoreOption {
  return { id, label, labelEn, score, sourceRef: RMR89_TABLE_REFS.condition }
}

/** A1：点荷载强度指数 (MPa) */
export const A1_POINT_LOAD: ScoreOption[] = [
  // 选项 id 沿用早期案例结构；显示区间与评分按 RMR89 校正。
  basicOption('pl_gt8', '> 10 MPa', '> 10 MPa', 15),
  basicOption('pl_4_8', '4 ~ 10 MPa', '4-10 MPa', 12),
  basicOption('pl_2_4', '2 ~ 4 MPa', '2-4 MPa', 7),
  basicOption('pl_1_2', '1 ~ 2 MPa', '1-2 MPa', 4),
]

/** A1：单轴抗压强度 (MPa) */
export const A1_UCS: ScoreOption[] = [
  basicOption('ucs_gt250', '> 250 MPa', '> 250 MPa', 15),
  basicOption('ucs_100_250', '100 ~ 250 MPa', '100-250 MPa', 12),
  basicOption('ucs_50_100', '50 ~ 100 MPa', '50-100 MPa', 7),
  basicOption('ucs_25_50', '25 ~ 50 MPa', '25-50 MPa', 4),
  basicOption('ucs_5_25', '5 ~ 25 MPa', '5-25 MPa', 2),
  basicOption('ucs_1_5', '1 ~ 5 MPa', '1-5 MPa', 1),
  basicOption('ucs_lt1', '< 1 MPa', '< 1 MPa', 0),
]

export const A2_RQD: ScoreOption[] = [
  basicOption('rqd_90_100', '90 ~ 100', '90-100', 20),
  basicOption('rqd_75_90', '75 ~ 90', '75-90', 17),
  basicOption('rqd_50_75', '50 ~ 75', '50-75', 13),
  basicOption('rqd_25_50', '25 ~ 50', '25-50', 8),
  basicOption('rqd_lt25', '< 25', '< 25', 3),
]

export const A3_SPACING: ScoreOption[] = [
  basicOption('sp_gt2', '> 200 cm', '> 200 cm', 20),
  basicOption('sp_0_6_2', '60 ~ 200 cm', '60-200 cm', 15),
  basicOption('sp_0_2_0_6', '20 ~ 60 cm', '20-60 cm', 10),
  basicOption('sp_0_06_0_2', '6 ~ 20 cm', '6-20 cm', 8),
  basicOption('sp_lt0_06', '< 6 cm', '< 6 cm', 5),
]

/** A4 综合五档描述 */
export const A4_SIMPLE: ScoreOption[] = [
  basicOption(
    'a4_30',
    '表面非常粗糙；不连续；无张开；结构面壁未风化',
    'Very rough surfaces; not continuous; no separation; unweathered wall rock',
    30
  ),
  basicOption(
    'a4_25',
    '表面微粗糙；张开度 < 1 mm；结构面壁轻微风化',
    'Slightly rough surfaces; separation < 1 mm; slightly weathered walls',
    25
  ),
  basicOption(
    'a4_20',
    '表面微粗糙；张开度 < 1 mm；结构面壁高度风化',
    'Slightly rough surfaces; separation < 1 mm; highly weathered walls',
    20
  ),
  basicOption(
    'a4_10',
    '镜面，或泥质充填厚度 < 5 mm，或连续结构面张开度 1 ~ 5 mm',
    'Slickensided surfaces, or gouge < 5 mm thick, or continuous separation 1-5 mm',
    10
  ),
  basicOption(
    'a4_0',
    '软泥质充填厚度 > 5 mm，或连续结构面张开度 > 5 mm',
    'Soft gouge > 5 mm thick, or continuous separation > 5 mm',
    0
  ),
]

/** A4 分项详评（RMR89 表 E） */
export const A4_PERSISTENCE: ScoreOption[] = [
  conditionOption('pers_lt1', '< 1 m', '< 1 m', 6),
  conditionOption('pers_1_3', '1 ~ 3 m', '1-3 m', 4),
  conditionOption('pers_3_10', '3 ~ 10 m', '3-10 m', 2),
  conditionOption('pers_10_20', '10 ~ 20 m', '10-20 m', 1),
  conditionOption('pers_gt20', '> 20 m', '> 20 m', 0),
]

export const A4_APERTURE: ScoreOption[] = [
  conditionOption('ap_none', '无', 'None', 6),
  conditionOption('ap_lt0_1', '< 0.1 mm', '< 0.1 mm', 5),
  conditionOption('ap_0_1_1', '0.1 ~ 1.0 mm', '0.1-1.0 mm', 4),
  conditionOption('ap_1_5', '1 ~ 5 mm', '1-5 mm', 1),
  conditionOption('ap_gt5', '> 5 mm', '> 5 mm', 0),
]

export const A4_ROUGHNESS: ScoreOption[] = [
  conditionOption('rough_vr', '非常粗糙', 'Very rough', 6),
  conditionOption('rough_r', '粗糙', 'Rough', 5),
  conditionOption('rough_sr', '微粗糙', 'Slightly rough', 3),
  conditionOption('rough_s', '光滑', 'Smooth', 1),
  conditionOption('rough_sl', '镜面', 'Slickensided', 0),
]

export const A4_INFILL: ScoreOption[] = [
  conditionOption('inf_none', '无充填', 'None', 6),
  conditionOption('inf_hard_lt5', '硬质充填 < 5 mm', 'Hard filling < 5 mm', 4),
  conditionOption('inf_hard_gt5', '硬质充填 > 5 mm', 'Hard filling > 5 mm', 2),
  conditionOption('inf_soft_lt5', '软质充填 < 5 mm', 'Soft filling < 5 mm', 2),
  conditionOption('inf_soft_gt5', '软质充填 > 5 mm', 'Soft filling > 5 mm', 0),
]

export const A4_WEATHERING: ScoreOption[] = [
  conditionOption('w_uw', '未风化', 'Unweathered', 6),
  conditionOption('w_sw', '轻微风化', 'Slightly weathered', 5),
  conditionOption('w_mw', '中等风化', 'Moderately weathered', 3),
  conditionOption('w_hw', '高度风化', 'Highly weathered', 1),
  conditionOption('w_dec', '分解', 'Decomposed', 0),
]

export type A5Criterion = 'inflow' | 'pressure' | 'condition'

export const A5_CRITERIA: { id: A5Criterion; label: string; labelEn: string; sourceRef: string }[] = [
  {
    id: 'inflow',
    label: '每 10 m 隧道长度涌水量 (L/min)',
    labelEn: 'Inflow per 10 m tunnel length (L/min)',
    sourceRef: RMR89_TABLE_REFS.basic,
  },
  {
    id: 'pressure',
    label: '结构面水压力 pw / 最大主应力 σ1',
    labelEn: 'Joint water pressure pw / major principal stress sigma1',
    sourceRef: RMR89_TABLE_REFS.basic,
  },
  {
    id: 'condition',
    label: '一般状况',
    labelEn: 'General conditions',
    sourceRef: RMR89_TABLE_REFS.basic,
  },
]

export const A5_BY_CRITERION: Record<A5Criterion, ScoreOption[]> = {
  inflow: [
    basicOption('inf_none', '无', 'None', 15),
    basicOption('inf_lt10', '< 10 L/min', '< 10 L/min', 10),
    basicOption('inf_10_25', '10 ~ 25 L/min', '10-25 L/min', 7),
    basicOption('inf_25_125', '25 ~ 125 L/min', '25-125 L/min', 4),
    basicOption('inf_gt125', '> 125 L/min', '> 125 L/min', 0),
  ],
  pressure: [
    basicOption('pr_0', '0', '0', 15),
    basicOption('pr_lt0_1', '< 0.1', '< 0.1', 10),
    basicOption('pr_0_1_0_2', '0.1 ~ 0.2', '0.1-0.2', 7),
    basicOption('pr_0_2_0_5', '0.2 ~ 0.5', '0.2-0.5', 4),
    basicOption('pr_gt0_5', '> 0.5', '> 0.5', 0),
  ],
  condition: [
    basicOption('cond_dry', '完全干燥', 'Completely dry', 15),
    basicOption('cond_damp', '潮湿', 'Damp', 10),
    basicOption('cond_wet', '湿润', 'Wet', 7),
    basicOption('cond_drip', '滴水', 'Dripping', 4),
    basicOption('cond_flow', '流水', 'Flowing', 0),
  ],
}

export type ProjectType = 'tunnel' | 'foundation' | 'slope'
export type Favorability = 'vf' | 'f' | 'fair' | 'uf' | 'vuf'

export const PROJECT_TYPES: { id: ProjectType; label: string; labelEn: string; sourceRef: string }[] = [
  {
    id: 'tunnel',
    label: '隧道与矿山巷道',
    labelEn: 'Tunnels and mines',
    sourceRef: RMR89_TABLE_REFS.adjustment,
  },
  { id: 'foundation', label: '地基', labelEn: 'Foundations', sourceRef: RMR89_TABLE_REFS.adjustment },
  { id: 'slope', label: '边坡', labelEn: 'Slopes', sourceRef: RMR89_TABLE_REFS.adjustment },
]

export const FAVORABILITY_OPTIONS: { id: Favorability; label: string; labelEn: string; sourceRef: string }[] = [
  { id: 'vf', label: '非常有利', labelEn: 'Very favourable', sourceRef: RMR89_TABLE_REFS.adjustment },
  { id: 'f', label: '有利', labelEn: 'Favourable', sourceRef: RMR89_TABLE_REFS.adjustment },
  { id: 'fair', label: '一般', labelEn: 'Fair', sourceRef: RMR89_TABLE_REFS.adjustment },
  { id: 'uf', label: '不利', labelEn: 'Unfavourable', sourceRef: RMR89_TABLE_REFS.adjustment },
  { id: 'vuf', label: '非常不利', labelEn: 'Very unfavourable', sourceRef: RMR89_TABLE_REFS.adjustment },
]

/** A6 修正分：工程类型 × 利弊等级 */
export const A6_ADJUSTMENT: Record<ProjectType, Record<Favorability, number>> = {
  tunnel: { vf: 0, f: -2, fair: -5, uf: -10, vuf: -12 },
  foundation: { vf: 0, f: -2, fair: -7, uf: -15, vuf: -25 },
  slope: { vf: 0, f: -5, fair: -25, uf: -50, vuf: -60 },
}

/** RMR89 表 F：走向–轴线关系 + 倾角 → 隧道利弊 */
export type StrikeRelation =
  | 'perp_with_dip'
  | 'perp_against_dip'
  | 'parallel'
  | 'irrespective'

export const STRIKE_RELATIONS: { id: StrikeRelation; label: string; labelEn: string; sourceRef: string }[] = [
  {
    id: 'perp_with_dip',
    label: '沿倾向',
    labelEn: 'Strike perpendicular to tunnel axis; drive with dip',
    sourceRef: RMR89_TABLE_REFS.tunnelOrientation,
  },
  {
    id: 'perp_against_dip',
    label: '逆倾向',
    labelEn: 'Strike perpendicular to tunnel axis; drive against dip',
    sourceRef: RMR89_TABLE_REFS.tunnelOrientation,
  },
  {
    id: 'parallel',
    label: '平行',
    labelEn: 'Strike parallel to tunnel axis',
    sourceRef: RMR89_TABLE_REFS.tunnelOrientation,
  },
  {
    id: 'irrespective',
    label: '无关',
    labelEn: 'Irrespective of strike (dip 0-20 degrees)',
    sourceRef: RMR89_TABLE_REFS.tunnelOrientation,
  },
]

export type DipBand = '45_90' | '20_45' | '0_20'

export const DIP_BANDS: { id: DipBand; label: string; labelEn: string; sourceRef: string }[] = [
  {
    id: '45_90',
    label: '倾角 45° ~ 90°',
    labelEn: 'Dip 45-90 degrees',
    sourceRef: RMR89_TABLE_REFS.tunnelOrientation,
  },
  {
    id: '20_45',
    label: '倾角 20° ~ 45°',
    labelEn: 'Dip 20-45 degrees',
    sourceRef: RMR89_TABLE_REFS.tunnelOrientation,
  },
  {
    id: '0_20',
    label: '倾角 0° ~ 20°',
    labelEn: 'Dip 0-20 degrees',
    sourceRef: RMR89_TABLE_REFS.tunnelOrientation,
  },
]

export function favorabilityFromOrientation(relation: StrikeRelation, dip: DipBand): Favorability | null {
  if (relation === 'irrespective') return dip === '0_20' ? 'fair' : null
  if (dip === '0_20') return 'fair'
  if (relation === 'perp_with_dip') {
    if (dip === '45_90') return 'vf'
    if (dip === '20_45') return 'f'
  }
  if (relation === 'perp_against_dip') {
    if (dip === '45_90') return 'fair'
    if (dip === '20_45') return 'uf'
  }
  if (relation === 'parallel') {
    if (dip === '45_90') return 'vuf'
    if (dip === '20_45') return 'fair'
  }
  return null
}

export type RmrClassId = 'I' | 'II' | 'III' | 'IV' | 'V'

export interface RmrClassInfo {
  id: RmrClassId
  label: string
  labelEn: string
  /** RMR89 表 C 岩体质量等级 */
  quality: string
  qualityEn: string
  /** RMR89 表 C 岩体描述 */
  description: string
  descriptionEn: string
  rmrRange: string
  cohesion: string
  friction: string
  /** RMR89 表 D 平均自稳跨度 */
  span: string
  spanEn: string
  /** RMR89 表 D 自稳时间 */
  standUpTime: string
  standUpTimeEn: string
  /** RMR89 支护指南开挖方式 */
  excavation: string
  excavationEn: string
  /** RMR89 支护指南锚杆（φ20 mm，全长锚固） */
  bolt: string
  boltEn: string
  /** RMR89 支护指南喷射混凝土 */
  shotcrete: string
  shotcreteEn: string
  /** RMR89 支护指南钢支架 */
  steelArch: string
  steelArchEn: string
}

/** RMR89 岩体质量等级、工程特性与支护设计参考（10 m 马蹄形钻爆隧道，竖向应力 < 25 MPa） */
export const RMR_CLASSES: RmrClassInfo[] = [
  {
    id: 'I',
    label: 'I 级',
    labelEn: 'Class I',
    quality: '非常好',
    qualityEn: 'Very good',
    description: '很好',
    descriptionEn: 'Very good rock',
    rmrRange: '81 ~ 100',
    cohesion: '> 0.4 MPa',
    friction: '> 45°',
    span: '15 m 跨度',
    spanEn: '15 m span',
    standUpTime: '20 年',
    standUpTimeEn: '20 years',
    excavation: '全断面开挖，进尺 3 m',
    excavationEn: 'Full-face excavation, 3 m advance',
    bolt: '采用点锚杆支护',
    boltEn: 'Spot bolting where required',
    shotcrete: '无',
    shotcreteEn: 'None',
    steelArch: '无',
    steelArchEn: 'None',
  },
  {
    id: 'II',
    label: 'II 级',
    labelEn: 'Class II',
    quality: '好',
    qualityEn: 'Good',
    description: '好',
    descriptionEn: 'Good rock',
    rmrRange: '61 ~ 80',
    cohesion: '0.3 ~ 0.4 MPa',
    friction: '35° ~ 45°',
    span: '10 m 跨度',
    spanEn: '10 m span',
    standUpTime: '1 年',
    standUpTimeEn: '1 year',
    excavation: '全断面开挖，进尺 1 ~ 1.5 m；距工作面 20 m 进行全支护',
    excavationEn: 'Full-face excavation, 1-1.5 m advance; complete support 20 m from the face',
    bolt: '局部支护，顶锚杆 3 m、间距 2.5 m，偶尔采用金属网',
    boltEn: 'Local 3 m crown bolts at 2.5 m spacing, with occasional wire mesh',
    shotcrete: '局部顶板喷射 50 mm 混凝土',
    shotcreteEn: '50 mm shotcrete in the crown where required',
    steelArch: '无',
    steelArchEn: 'None',
  },
  {
    id: 'III',
    label: 'III 级',
    labelEn: 'Class III',
    quality: '一般',
    qualityEn: 'Fair',
    description: '中等',
    descriptionEn: 'Fair rock',
    rmrRange: '41 ~ 60',
    cohesion: '0.2 ~ 0.3 MPa',
    friction: '25° ~ 35°',
    span: '5 m 跨度',
    spanEn: '5 m span',
    standUpTime: '1 周',
    standUpTimeEn: '1 week',
    excavation: '台阶法开挖，上台阶进尺 1.5 ~ 3 m；爆破后进行临时支护，距工作面 10 m 进行支护',
    excavationEn: 'Top heading and bench, 1.5-3 m advance in the top heading; start support after each blast and complete it 10 m from the face',
    bolt: '巷道顶板和两帮支护锚杆 4 m、间距 1.5 ~ 2 m，顶板支护金属网',
    boltEn: 'Systematic 4 m bolts in the crown and walls at 1.5-2 m spacing, with wire mesh in the crown',
    shotcrete: '顶板喷射 50 ~ 100 mm 混凝土，两帮喷射 30 mm 混凝土',
    shotcreteEn: '50-100 mm in the crown and 30 mm on the walls',
    steelArch: '无',
    steelArchEn: 'None',
  },
  {
    id: 'IV',
    label: 'IV 级',
    labelEn: 'Class IV',
    quality: '差',
    qualityEn: 'Poor',
    description: '差',
    descriptionEn: 'Poor rock',
    rmrRange: '21 ~ 40',
    cohesion: '0.1 ~ 0.2 MPa',
    friction: '15° ~ 25°',
    span: '2.5 m 跨度',
    spanEn: '2.5 m span',
    standUpTime: '10 h',
    standUpTimeEn: '10 hours',
    excavation: '台阶法开挖，上台阶进尺 1.0 ~ 1.5 m；距工作面 10 m 进行全支护',
    excavationEn: 'Top heading and bench, 1.0-1.5 m advance in the top heading; complete support within 10 m of the face',
    bolt: '全巷道进行锚网支护，锚杆 4 ~ 5 m、间距 1 ~ 1.5 m',
    boltEn: 'Systematic 4-5 m bolts in the crown and walls at 1-1.5 m spacing, with wire mesh',
    shotcrete: '顶板喷射 100 ~ 150 mm 混凝土，两帮喷射 100 mm 混凝土',
    shotcreteEn: '100-150 mm in the crown and 100 mm on the walls',
    steelArch: '局部采用轻型至中型钢支架，间距 1.5 m',
    steelArchEn: 'Light to medium ribs at 1.5 m spacing where required',
  },
  {
    id: 'V',
    label: 'V 级',
    labelEn: 'Class V',
    quality: '非常差',
    qualityEn: 'Very poor',
    description: '很差',
    descriptionEn: 'Very poor rock',
    rmrRange: '≤ 20',
    cohesion: '< 0.1 MPa',
    friction: '< 15°',
    span: '1 m 跨度',
    spanEn: '1 m span',
    standUpTime: '30 min',
    standUpTimeEn: '30 minutes',
    excavation: '分次推进，上台阶进尺 0.5 ~ 1.5 m；爆破后即进行支护，工作面喷射混凝土',
    excavationEn: 'Multiple drifts, 0.5-1.5 m advance in the top heading; install support concurrently with excavation and shotcrete the face immediately',
    bolt: '全巷道进行锚网支护，锚杆 5 ~ 6 m、间距 1 ~ 1.5 m，底部锚杆、反拱',
    boltEn: 'Systematic 5-6 m bolts in the crown and walls at 1-1.5 m spacing, with wire mesh, invert bolts and an invert',
    shotcrete: '顶板喷射 150 ~ 200 mm 混凝土，两帮喷射 150 mm，工作面喷射 50 mm',
    shotcreteEn: '150-200 mm in the crown, 150 mm on the walls, and 50 mm on the face',
    steelArch: '中型至重型钢支架，间距 0.75 m，与顶板钢筋间隙内安装钢背板，需要时进行超前支护',
    steelArchEn: 'Medium to heavy ribs at 0.75 m spacing, with steel lagging and forepoling where required',
  },
]

export function classFromRmr(rmr: number): RmrClassInfo {
  if (rmr >= 81) return RMR_CLASSES[0]
  if (rmr >= 61) return RMR_CLASSES[1]
  if (rmr >= 41) return RMR_CLASSES[2]
  if (rmr >= 21) return RMR_CLASSES[3]
  return RMR_CLASSES[4]
}

/* ------------------------------------------------------------------ *
 * RMR89 表 A/E/F 的渲染数据
 * ------------------------------------------------------------------ */

export interface ReferenceCell {
  text: string
  textEn: string
  /** 点击该单元格时选中的选项；未设置时单元格不可选 */
  optionId?: string
  /** 横向合并列数，用于 RMR89 表 A 中的跨列说明 */
  span?: number
}

export interface ReferenceRow {
  label: string
  labelEn: string
  cells: ReferenceCell[]
}

export interface ReferenceTableSpec {
  caption: string
  captionEn: string
  rows: ReferenceRow[]
  scores: number[]
  /** 每一列对应的选项 id；null 表示该列不可选（如跨列说明覆盖的列） */
  optionIds: (string | null)[]
  footnote?: string
  footnoteEn?: string
}

const A1_UCS_COLUMNS = A1_UCS.map((option) => option.label)

/** RMR89 表 A 参数 1：点荷载与单轴抗压两行共用一条评分行 */
export function buildA1ReferenceTable(mode: 'point_load' | 'ucs' | null): ReferenceTableSpec {
  const pointLoadIds: (string | null)[] = [...A1_POINT_LOAD.map((o) => o.id), null, null, null]
  const ucsIds: (string | null)[] = A1_UCS.map((o) => o.id)
  return {
    caption: '表1 · 完整岩石材料的强度',
    captionEn: 'Table 1 · Strength of intact rock material',
    rows: [
      {
        label: '点荷载强度指标 / MPa',
        labelEn: 'Point-load strength index / MPa',
        cells: [
          ...A1_POINT_LOAD.map((option) => ({ text: option.label, textEn: option.labelEn, optionId: option.id })),
          { text: '对于低值范围宜用单轴抗压试验', textEn: 'For low ranges, use the uniaxial compressive strength test', span: 3 },
        ],
      },
      {
        label: '单轴抗压强度 / MPa',
        labelEn: 'Uniaxial compressive strength / MPa',
        cells: A1_UCS.map((option) => ({ text: option.label, textEn: option.labelEn, optionId: option.id })),
      },
    ],
    scores: A1_UCS.map((option) => option.score),
    optionIds: mode === 'point_load' ? pointLoadIds : mode === 'ucs' ? ucsIds : A1_UCS_COLUMNS.map(() => null),
    footnote: '点荷载指标仅覆盖 1 MPa 以上的四档；低强度范围应采用单轴抗压强度试验评分。',
    footnoteEn: 'The point-load index covers only the four ranges above 1 MPa; use the uniaxial compressive strength test for lower strengths.',
  }
}

function simpleReferenceTable(
  caption: string,
  captionEn: string,
  label: string,
  labelEn: string,
  options: ScoreOption[],
  footnote?: string,
  footnoteEn?: string
): ReferenceTableSpec {
  return {
    caption,
    captionEn,
    rows: [{ label, labelEn, cells: options.map((option) => ({ text: option.label, textEn: option.labelEn, optionId: option.id })) }],
    scores: options.map((option) => option.score),
    optionIds: options.map((option) => option.id),
    footnote,
    footnoteEn,
  }
}

export const A2_REFERENCE_TABLE = simpleReferenceTable(
  '表2 · 岩石质量指标 RQD',
  'Table 2 · Rock Quality Designation (RQD)',
  '岩石质量指标 RQD / %',
  'Rock Quality Designation (RQD) / %',
  A2_RQD.map((option) => ({
    ...option,
    label: option.label.replace(/\d+(?:\.\d+)?(?!.*\d)/, '$& %'),
    labelEn: option.labelEn.replace(/\d+(?:\.\d+)?(?!.*\d)/, '$& %'),
  }))
)

export const A3_REFERENCE_TABLE = simpleReferenceTable(
  '表3 · 结构面间距',
  'Table 3 · Spacing of discontinuities',
  '结构面间距 / cm',
  'Discontinuity spacing / cm',
  A3_SPACING
)

export const A4_REFERENCE_TABLE = simpleReferenceTable(
  '表4 · 结构面条件',
  'Table 4 · Condition of discontinuities',
  '结构面条件',
  'Condition of discontinuities',
  A4_SIMPLE,
  '优先按五档综合描述快速判断；无法匹配时展开“详细评分”，五项评分之和即为 A4。',
  'Start with the five summary descriptions; if none fits, expand “Detailed ratings” and use the sum as A4.'
)

/** RMR89 表 A 参数 5：三条准则共用一条评分行 */
export function buildA5ReferenceTable(criterion: A5Criterion): ReferenceTableSpec {
  const rows: ReferenceRow[] = A5_CRITERIA.map((item) => ({
    label: item.label,
    labelEn: item.labelEn,
    cells: A5_BY_CRITERION[item.id].map((option) => ({ text: option.label, textEn: option.labelEn })),
  }))
  return {
    caption: '表5 · 地下水',
    captionEn: 'Table 5 · Groundwater',
    rows,
    scores: A5_BY_CRITERION.condition.map((option) => option.score),
    optionIds: A5_BY_CRITERION[criterion].map((option) => option.id),
    footnote: '三条准则相互等效，任选其一即可；点击表内单元格可直接选中该列。',
    footnoteEn: 'The three criteria are equivalent; use any one of them. Select a table cell to choose that range.',
  }
}

/** RMR89 表 E：结构面条件详细评分的五个分项 */
export const A4_DETAIL_ROWS: { key: string; label: string; labelEn: string; options: ScoreOption[] }[] = [
  { key: 'a4PersistenceId', label: '结构面长度（延续性）', labelEn: 'Persistence', options: A4_PERSISTENCE },
  { key: 'a4ApertureId', label: '结构面张开度', labelEn: 'Separation (aperture)', options: A4_APERTURE },
  { key: 'a4RoughnessId', label: '粗糙度', labelEn: 'Roughness', options: A4_ROUGHNESS },
  { key: 'a4InfillId', label: '充填物（泥质充填）', labelEn: 'Infilling (gouge)', options: A4_INFILL },
  { key: 'a4WeatheringId', label: '结构面壁风化程度', labelEn: 'Weathering', options: A4_WEATHERING },
]

/** RMR89 表 F：结构面方向对隧道的影响 */
export interface OrientationCellSpec {
  strike: StrikeRelation
  dip: DipBand
  groupLabel: string
  groupLabelEn: string
  dipLabel: string
  dipLabelEn: string
  favorability: Favorability
}

export const TABLE_B_GROUPS: { label: string; labelEn: string; cells: OrientationCellSpec[] }[] = [
  {
    label: '沿倾向',
    labelEn: 'Strike perpendicular to tunnel axis · drive with dip',
    cells: [
      {
        strike: 'perp_with_dip',
        dip: '45_90',
        groupLabel: '沿倾向掘进',
        groupLabelEn: 'Drive with dip',
        dipLabel: '倾角 45° ~ 90°',
        dipLabelEn: 'Dip 45-90°',
        favorability: 'vf',
      },
      {
        strike: 'perp_with_dip',
        dip: '20_45',
        groupLabel: '沿倾向掘进',
        groupLabelEn: 'Drive with dip',
        dipLabel: '倾角 20° ~ 45°',
        dipLabelEn: 'Dip 20-45°',
        favorability: 'f',
      },
    ],
  },
  {
    label: '逆倾向',
    labelEn: 'Strike perpendicular to tunnel axis · drive against dip',
    cells: [
      {
        strike: 'perp_against_dip',
        dip: '45_90',
        groupLabel: '逆倾向掘进',
        groupLabelEn: 'Drive against dip',
        dipLabel: '倾角 45° ~ 90°',
        dipLabelEn: 'Dip 45-90°',
        favorability: 'fair',
      },
      {
        strike: 'perp_against_dip',
        dip: '20_45',
        groupLabel: '逆倾向掘进',
        groupLabelEn: 'Drive against dip',
        dipLabel: '倾角 20° ~ 45°',
        dipLabelEn: 'Dip 20-45°',
        favorability: 'uf',
      },
    ],
  },
  {
    label: '平行',
    labelEn: 'Strike parallel to tunnel axis',
    cells: [
      {
        strike: 'parallel',
        dip: '45_90',
        groupLabel: '走向平行',
        groupLabelEn: 'Strike parallel',
        dipLabel: '倾角 45° ~ 90°',
        dipLabelEn: 'Dip 45-90°',
        favorability: 'vuf',
      },
      {
        strike: 'parallel',
        dip: '20_45',
        groupLabel: '走向平行',
        groupLabelEn: 'Strike parallel',
        dipLabel: '倾角 20° ~ 45°',
        dipLabelEn: 'Dip 20-45°',
        favorability: 'fair',
      },
    ],
  },
  {
    label: '无关',
    labelEn: 'Irrespective of strike',
    cells: [
      {
        strike: 'irrespective',
        dip: '0_20',
        groupLabel: '与走向无关',
        groupLabelEn: 'Irrespective of strike',
        dipLabel: '倾角 0° ~ 20°',
        dipLabelEn: 'Dip 0-20°',
        favorability: 'fair',
      },
    ],
  },
]

/** 表 7 中每种走向关系可搭配的倾角范围。 */
export function availableDipBandsForStrike(strike: StrikeRelation | null): DipBand[] {
  if (!strike) return []
  return DIP_BANDS
    .filter((band) => TABLE_B_GROUPS.some((group) => group.cells.some((cell) => cell.strike === strike && cell.dip === band.id)))
    .map((band) => band.id)
}

type RmrLanguage = 'zh' | 'en'

function localizedLabel(item: { label: string; labelEn: string } | undefined, language: RmrLanguage) {
  return item ? (language === 'en' ? item.labelEn : item.label) : '—'
}

export function labelForFavorability(favorability: Favorability, language: RmrLanguage = 'zh') {
  return localizedLabel(FAVORABILITY_OPTIONS.find((item) => item.id === favorability), language)
}

export function labelForProjectType(project: ProjectType, language: RmrLanguage = 'zh') {
  return localizedLabel(PROJECT_TYPES.find((item) => item.id === project), language)
}

export function labelForStrike(strike: StrikeRelation, language: RmrLanguage = 'zh') {
  return localizedLabel(STRIKE_RELATIONS.find((item) => item.id === strike), language)
}

export function labelForDip(dip: DipBand, language: RmrLanguage = 'zh') {
  return localizedLabel(DIP_BANDS.find((item) => item.id === dip), language)
}

export function labelForA5Criterion(criterion: A5Criterion, language: RmrLanguage = 'zh') {
  return localizedLabel(A5_CRITERIA.find((item) => item.id === criterion), language)
}
