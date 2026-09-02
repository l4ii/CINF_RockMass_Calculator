/**
 * Geological Strength Index.
 *
 * Chart path (descriptive): pick structure × surface condition on the GSI
 * chart. GSI = Scale A + Scale B (Hoek, Carter & Diederichs, 2013, ARMA 13-672).
 *   Scale A — surface quality (very good → very poor): 45, 37.5, 30, 15, 0
 *   Scale B — interlocking / structure (intact → laminated): 50, 40, 30, 20, 10, 0
 *
 * Quantitative path (same two scales, filled from ratings):
 *   Scale A = 1.5 JCond89    →  GSI = 1.5 JCond89 + RQD / 2
 *   Scale B = RQD / 2
 * When JCond89 is unavailable: GSI = 2 JCond76 + RQD/2, or
 *   GSI = 52.5 (Jr/Ja)/(1+Jr/Ja) + RQD/2.
 */

import {
  A4_APERTURE,
  A4_INFILL,
  A4_PERSISTENCE,
  A4_ROUGHNESS,
  A4_SIMPLE,
  A4_WEATHERING,
  type ScoreOption,
} from '../config/rmrTables'
import type { ParameterDescription, ValidationIssue } from './types'
import { Q_JA_OPTIONS, Q_JR_OPTIONS, type QFactorOption } from './q'

export const GSI_INPUT_VERSION = 1

export const GSI_STANDARD = {
  id: 'hoek-carter-diederichs-2013-gsi',
  title: 'Hoek–Carter–Diederichs 量化 GSI',
  titleEn: 'Quantified Geological Strength Index (GSI)',
  edition: '2013',
  source: 'Hoek, E., Carter, T.G. & Diederichs, M.S. (2013). Quantification of the Geological Strength Index chart. ARMA 13-672.',
  sourceEn: 'Hoek, E., Carter, T.G. & Diederichs, M.S. (2013). Quantification of the Geological Strength Index chart. ARMA 13-672.',
}

export type GsiEntryMode = '' | 'chart' | 'quantitative'
export type GsiApplicabilityId =
  | ''
  | 'jointed_isotropic'
  | 'intact_massive'
  | 'sheared_transported'
  | 'structurally_controlled'
export type GsiStructureId = '' | 'intact' | 'blocky' | 'very_blocky' | 'blocky_disturbed' | 'disintegrated' | 'laminated'
export type GsiSurfaceQualityId = '' | 'very_good' | 'good' | 'fair' | 'poor' | 'very_poor'
export type GsiRqdSource = 'measured' | 'priest_hudson' | 'palmstrom_2005' | 'palmstrom_1982'
export type GsiSurfaceMethod = 'jcond89' | 'jcond76' | 'jr_ja'
export type GsiJcond89Mode = 'simple' | 'detailed'

export interface GsiFormState {
  applicabilityId: GsiApplicabilityId
  entryMode: GsiEntryMode
  structureId: GsiStructureId
  surfaceQualityId: GsiSurfaceQualityId
  rqdSource: GsiRqdSource
  rqd: number | null
  lambdaPerM: number | null
  jv: number | null
  surfaceMethod: GsiSurfaceMethod
  jcond89Mode: GsiJcond89Mode
  jcond89Value: number | null
  jcond89SimpleId: string
  jcond89PersistenceId: string
  jcond89ApertureId: string
  jcond89RoughnessId: string
  jcond89InfillId: string
  jcond89WeatheringId: string
  jcond76Id: string
  jrId: string
  jrValue: number | null
  jaId: string
  jaValue: number | null
}

export interface GsiLocalized {
  zh: string
  en: string
}

export interface GsiGradeInfo {
  id: string
  min: number
  label: string
  labelEn: string
}

export interface GsiResolvedRqd {
  value: number
  source: GsiRqdSource
  estimated: boolean
  clamped: boolean
  formula: GsiLocalized
}

export interface GsiResolvedSurface {
  method: GsiSurfaceMethod
  jcond89Equivalent: number
  scaleA: number
  jr?: number
  ja?: number
  jrJa?: number
  jcond76?: number
  formula: GsiLocalized
  alternative: boolean
  nonWallContact: boolean
}

export interface GsiResult {
  gsi: number
  entryMode: GsiEntryMode
  rqd: number
  jcond89Equivalent: number
  scaleA: number
  scaleB: number
  grade: GsiGradeInfo
  formula: string
  formulaEn: string
  warnings: string[]
  warningsEn: string[]
  rqdResolution: GsiResolvedRqd | null
  surfaceResolution: GsiResolvedSurface | null
  chartCell: { structureId: GsiStructureId; surfaceQualityId: GsiSurfaceQualityId } | null
}

export interface GsiChartCell {
  structureId: Exclude<GsiStructureId, ''>
  surfaceQualityId: Exclude<GsiSurfaceQualityId, ''>
  scaleA: number
  scaleB: number
  gsi: number | null
  applicable: boolean
}

export const GSI_APPLICABILITY_OPTIONS: readonly { id: Exclude<GsiApplicabilityId, ''>; label: string; labelEn: string; allowed: boolean }[] = [
  { id: 'jointed_isotropic', label: '多组节理、可视为均质各向同性的镶嵌块体岩体', labelEn: 'Jointed, interlocked rock mass that can be treated as homogeneous and isotropic', allowed: true },
  { id: 'intact_massive', label: '完整或极稀疏节理岩体（不适用本量化图表）', labelEn: 'Intact or very sparsely jointed rock (outside the quantified chart)', allowed: false },
  { id: 'sheared_transported', label: '已剪切、搬运或强烈蚀变岩体（应改用 flysch 等专用图）', labelEn: 'Sheared, transported or heavily altered material (use a flysch / site-specific chart)', allowed: false },
  { id: 'structurally_controlled', label: '稀疏节理中的结构面控制破坏，或岩爆 / 片帮（不适用）', labelEn: 'Structurally controlled failure in sparse joints, or rockburst / spalling (not applicable)', allowed: false },
]

export const GSI_STRUCTURE_OPTIONS: readonly {
  id: Exclude<GsiStructureId, ''>
  label: string
  labelEn: string
  description: string
  descriptionEn: string
  scaleB: number
  representativeRqd: number
  naSurfaceIds: readonly Exclude<GsiSurfaceQualityId, ''>[]
}[] = [
  {
    id: 'intact',
    label: '完整块状岩体',
    labelEn: 'Intact or massive',
    description: '裂隙非常罕见，一定范围内连续分布',
    descriptionEn: 'Fractures very rare; continuous over the scale of interest',
    scaleB: 50,
    representativeRqd: 100,
    naSurfaceIds: ['poor', 'very_poor'],
  },
  {
    id: 'blocky',
    label: '较完整块状岩体',
    labelEn: 'Blocky',
    description: '由三组相互垂直的不连续面将岩体切割成立方块体，连接好，没有扰动',
    descriptionEn: 'Cubical blocks formed by three orthogonal discontinuity sets; well interlocked, undisturbed',
    scaleB: 40,
    representativeRqd: 80,
    naSurfaceIds: [],
  },
  {
    id: 'very_blocky',
    label: '一般块状岩体',
    labelEn: 'Very blocky',
    description: '由四组或四组以上不连续面将岩体切割成角砾状岩体，部分扰动',
    descriptionEn: 'Angular blocks formed by four or more discontinuity sets; partially disturbed',
    scaleB: 30,
    representativeRqd: 60,
    naSurfaceIds: [],
  },
  {
    id: 'blocky_disturbed',
    label: '扰动岩体',
    labelEn: 'Blocky / disturbed / seamy',
    description: '更多组不连续面相互交切，将岩体切割成角砾状岩块，伴随着褶皱和断层的形成',
    descriptionEn: 'Many intersecting discontinuity sets forming angular blocks, with folding and faulting',
    scaleB: 20,
    representativeRqd: 40,
    naSurfaceIds: [],
  },
  {
    id: 'disintegrated',
    label: '严重扰动岩体',
    labelEn: 'Disintegrated',
    description: '岩块之间连接性差，破坏严重，由混杂状的角砾或圆形颗粒组成',
    descriptionEn: 'Poorly interlocked, heavily broken mixture of angular or rounded pieces',
    scaleB: 10,
    representativeRqd: 20,
    naSurfaceIds: [],
  },
  {
    id: 'laminated',
    label: '鳞片状岩体',
    labelEn: 'Laminated / sheared',
    description: '剪切形成片状、鳞片状岩体，密集展布的剪理叠加在其他不连续面上，完全不具备块体性质',
    descriptionEn: 'Sheared into laminated or foliated fragments; closely spaced shears overprint other discontinuities; lack of blockiness',
    scaleB: 0,
    representativeRqd: 0,
    naSurfaceIds: ['very_good', 'good'],
  },
]

export const GSI_SURFACE_OPTIONS: readonly {
  id: Exclude<GsiSurfaceQualityId, ''>
  label: string
  labelEn: string
  description: string
  descriptionEn: string
  scaleA: number
  jcond89: number
}[] = [
  { id: 'very_good', label: '非常好', labelEn: 'Very good', description: '非常粗糙、新鲜、未风化表面', descriptionEn: 'Very rough, fresh, unweathered surfaces', scaleA: 45, jcond89: 30 },
  { id: 'good', label: '好', labelEn: 'Good', description: '粗糙、轻微风化、有铁质薄膜的表面', descriptionEn: 'Rough, slightly weathered, iron-stained surfaces', scaleA: 37.5, jcond89: 25 },
  { id: 'fair', label: '一般', labelEn: 'Fair', description: '光滑、中等风化或被改造的表面', descriptionEn: 'Smooth, moderately weathered or altered surfaces', scaleA: 30, jcond89: 20 },
  { id: 'poor', label: '差', labelEn: 'Poor', description: '光滑、严重风化、有夹亚性薄膜或角砾充填的表面', descriptionEn: 'Smooth, highly weathered surfaces with compact coatings or breccia fillings', scaleA: 15, jcond89: 10 },
  { id: 'very_poor', label: '非常差', labelEn: 'Very poor', description: '光滑、严重风化、含泥质薄膜或充填物的表面', descriptionEn: 'Smooth, highly weathered surfaces with clay coatings or fillings', scaleA: 0, jcond89: 0 },
]

export type GsiQuantStructureId = 'blocky' | 'very_blocky' | 'blocky_disturbed' | 'disintegrated'

export const GSI_QUANT_STRUCTURE_OPTIONS: readonly {
  id: GsiQuantStructureId
  label: string
  labelEn: string
  description: string
  descriptionEn: string
  scaleBMin: number
  scaleBMax: number
  representativeRqd: number
}[] = [
  {
    id: 'blocky',
    label: '块状结构',
    labelEn: 'Blocky',
    description: '结构面紧密结合，未受扰动，岩体由3组结构面互相切割形成立方体块组成',
    descriptionEn: 'Discontinuities tightly interlocking, undisturbed; cubical blocks cut by three joint sets',
    scaleBMin: 30,
    scaleBMax: 40,
    representativeRqd: 70,
  },
  {
    id: 'very_blocky',
    label: '裂隙块状结构',
    labelEn: 'Very blocky',
    description: '结构面互相咬合，岩体由4组或更多的结构面相交切割成的多面棱角块状体组成',
    descriptionEn: 'Joints interlocked; multi-faceted angular blocks cut by four or more joint sets',
    scaleBMin: 20,
    scaleBMax: 30,
    representativeRqd: 50,
  },
  {
    id: 'blocky_disturbed',
    label: '层状破裂结构',
    labelEn: 'Blocky / disturbed / seamy',
    description: '由多组结构面切割的棱角状块状、褶曲、层面或连续的片理面',
    descriptionEn: 'Angular blocks cut by many joint sets, with folding, bedding or continuous foliation',
    scaleBMin: 10,
    scaleBMax: 20,
    representativeRqd: 30,
  },
  {
    id: 'disintegrated',
    label: '碎裂结构',
    labelEn: 'Disintegrated',
    description: '块体间结合程度差，由棱角状或柱状岩块组成的非常破碎的岩体结构',
    descriptionEn: 'Poorly interlocked, highly broken rock of angular or columnar fragments',
    scaleBMin: 0,
    scaleBMax: 10,
    representativeRqd: 10,
  },
]

export const GSI_QUANT_SURFACE_OPTIONS: readonly {
  id: Exclude<GsiSurfaceQualityId, ''>
  label: string
  labelEn: string
  description: string
  descriptionEn: string
  jcond89: number
}[] = [
  { id: 'very_good', label: '很好', labelEn: 'Very good', description: '表面非常粗糙，新鲜未风化', descriptionEn: 'Very rough surfaces, fresh and unweathered', jcond89: 30 },
  { id: 'good', label: '好', labelEn: 'Good', description: '表面粗糙，微风化，表面有铁锈发育', descriptionEn: 'Rough surfaces, slightly weathered, with iron staining', jcond89: 25 },
  { id: 'fair', label: '一般', labelEn: 'Fair', description: '表面光滑，中等风化，有蚀变', descriptionEn: 'Smooth surfaces, moderately weathered, altered', jcond89: 20 },
  { id: 'poor', label: '差', labelEn: 'Poor', description: '表面有擦痕，强风化，泥膜覆盖或棱角碎块充填', descriptionEn: 'Slickensided, highly weathered, clay film or angular fragment filling', jcond89: 10 },
  { id: 'very_poor', label: '很差', labelEn: 'Very poor', description: '表面有镜面擦痕，强风化，黏土覆盖或充填', descriptionEn: 'Mirror slickensides, highly weathered, clay coating or filling', jcond89: 0 },
]

export const GSI_QUANT_SCALE_A_MAX = 45
export const GSI_QUANT_SCALE_B_MAX = 40
export const GSI_QUANT_TICK_STEP = 5
export const GSI_QUANT_TICK_COLS = GSI_QUANT_SCALE_A_MAX / GSI_QUANT_TICK_STEP
export const GSI_QUANT_TICK_ROWS = GSI_QUANT_SCALE_B_MAX / GSI_QUANT_TICK_STEP
export const GSI_QUANT_SCALE_A_TICKS = [45, 40, 35, 30, 25, 20, 15, 10, 5, 0] as const
export const GSI_QUANT_SCALE_B_TICKS = [40, 35, 30, 25, 20, 15, 10, 5, 0] as const

function relabelScoreOptions(source: readonly ScoreOption[], labels: readonly { label: string; labelEn: string }[]): ScoreOption[] {
  return source.map((item, index) => ({ ...item, label: labels[index].label, labelEn: labels[index].labelEn }))
}

export const GSI_JCOND89_SIMPLE: ScoreOption[] = relabelScoreOptions(A4_SIMPLE, [
  { label: '表面很粗糙，不连续，张开度为零，未风化的围岩', labelEn: 'Very rough, discontinuous, zero aperture, unweathered wall rock' },
  { label: '表面稍粗糙，张开度 < 1 mm，微风化的围岩', labelEn: 'Slightly rough, aperture < 1 mm, slightly weathered wall rock' },
  { label: '表面稍粗糙，张开度 < 1 mm，强风化的围岩', labelEn: 'Slightly rough, aperture < 1 mm, highly weathered wall rock' },
  { label: '表面有擦痕，或软质填充物 < 5 mm，或连续节理张开度 1～5 mm', labelEn: 'Slickensided, or soft infill < 5 mm, or continuous aperture 1–5 mm' },
  { label: '软质填充物 > 5 mm，或连续节理张开度 > 5 mm', labelEn: 'Soft infill > 5 mm, or continuous aperture > 5 mm' },
])

export type GsiJcond89DetailTableKey =
  | 'a4PersistenceId'
  | 'a4ApertureId'
  | 'a4RoughnessId'
  | 'a4InfillId'
  | 'a4WeatheringId'

export const GSI_JCOND89_DETAIL_ROWS: { key: GsiJcond89DetailTableKey; label: string; labelEn: string; options: ScoreOption[] }[] = [
  {
    key: 'a4PersistenceId',
    label: '迹长',
    labelEn: 'Persistence',
    options: relabelScoreOptions(A4_PERSISTENCE, [
      { label: '< 1 m', labelEn: '< 1 m' },
      { label: '1 ~ 3 m', labelEn: '1–3 m' },
      { label: '3 ~ 10 m', labelEn: '3–10 m' },
      { label: '10 ~ 20 m', labelEn: '10–20 m' },
      { label: '≥ 20 m', labelEn: '≥ 20 m' },
    ]),
  },
  {
    key: 'a4ApertureId',
    label: '节理张开度（隙宽）',
    labelEn: 'Aperture',
    options: relabelScoreOptions(A4_APERTURE, [
      { label: '无', labelEn: 'None' },
      { label: '< 0.1 mm', labelEn: '< 0.1 mm' },
      { label: '0.1 ~ 1.0 mm', labelEn: '0.1–1.0 mm' },
      { label: '1 ~ 5 mm', labelEn: '1–5 mm' },
      { label: '≥ 5 mm', labelEn: '≥ 5 mm' },
    ]),
  },
  {
    key: 'a4RoughnessId',
    label: '节理面粗糙度',
    labelEn: 'Roughness',
    options: relabelScoreOptions(A4_ROUGHNESS, [
      { label: '很粗糙', labelEn: 'Very rough' },
      { label: '粗糙', labelEn: 'Rough' },
      { label: '稍粗糙', labelEn: 'Slightly rough' },
      { label: '光滑', labelEn: 'Smooth' },
      { label: '非常光滑', labelEn: 'Very smooth' },
    ]),
  },
  {
    key: 'a4InfillId',
    label: '节理填充物',
    labelEn: 'Infilling',
    options: relabelScoreOptions(A4_INFILL, [
      { label: '无', labelEn: 'None' },
      { label: '硬质填充物厚度 < 5 mm', labelEn: 'Hard infill < 5 mm' },
      { label: '硬质填充物厚度 > 5 mm', labelEn: 'Hard infill > 5 mm' },
      { label: '软质填充物厚度 < 5 mm', labelEn: 'Soft infill < 5 mm' },
      { label: '软质填充物厚度 > 5 mm', labelEn: 'Soft infill > 5 mm' },
    ]),
  },
  {
    key: 'a4WeatheringId',
    label: '围岩风化程度',
    labelEn: 'Wall-rock weathering',
    options: relabelScoreOptions(A4_WEATHERING, [
      { label: '未风化', labelEn: 'Unweathered' },
      { label: '微风化', labelEn: 'Slightly weathered' },
      { label: '中风化', labelEn: 'Moderately weathered' },
      { label: '强风化', labelEn: 'Highly weathered' },
      { label: '全风化', labelEn: 'Completely weathered' },
    ]),
  },
]

function clampIndex(value: number, last: number) {
  return Math.min(last, Math.max(0, value))
}

export function locateQuantitativeCell(jcond89: number, rqd: number): {
  structureId: GsiQuantStructureId
  surfaceQualityId: Exclude<GsiSurfaceQualityId, ''>
} {
  const scaleA = Math.min(GSI_QUANT_SCALE_A_MAX, Math.max(0, 1.5 * jcond89))
  const scaleB = Math.min(GSI_QUANT_SCALE_B_MAX, Math.max(0, rqd / 2))
  const colWidth = GSI_QUANT_SCALE_A_MAX / GSI_QUANT_SURFACE_OPTIONS.length
  const rowHeight = GSI_QUANT_SCALE_B_MAX / GSI_QUANT_STRUCTURE_OPTIONS.length
  const col = clampIndex(Math.floor((GSI_QUANT_SCALE_A_MAX - scaleA) / colWidth), GSI_QUANT_SURFACE_OPTIONS.length - 1)
  const row = clampIndex(Math.floor((GSI_QUANT_SCALE_B_MAX - scaleB) / rowHeight), GSI_QUANT_STRUCTURE_OPTIONS.length - 1)
  return {
    structureId: GSI_QUANT_STRUCTURE_OPTIONS[row].id,
    surfaceQualityId: GSI_QUANT_SURFACE_OPTIONS[col].id,
  }
}

export function quantitativeCellFill(structureId: GsiQuantStructureId, surfaceQualityId: Exclude<GsiSurfaceQualityId, ''>) {
  const col = GSI_QUANT_SURFACE_OPTIONS.findIndex((item) => item.id === surfaceQualityId)
  const row = GSI_QUANT_STRUCTURE_OPTIONS.findIndex((item) => item.id === structureId)
  if (col < 0 || row < 0) throw new Error('Unknown quantitative GSI cell')
  const scaleA = GSI_QUANT_SCALE_A_MAX - (col + 0.5) * (GSI_QUANT_SCALE_A_MAX / GSI_QUANT_SURFACE_OPTIONS.length)
  const scaleB = GSI_QUANT_SCALE_B_MAX - (row + 0.5) * (GSI_QUANT_SCALE_B_MAX / GSI_QUANT_STRUCTURE_OPTIONS.length)
  return { jcond89: scaleA / 1.5, rqd: scaleB * 2 }
}

export function locateQuantitativeTickCell(jcond89: number, rqd: number) {
  const scaleA = Math.min(GSI_QUANT_SCALE_A_MAX, Math.max(0, 1.5 * jcond89))
  const scaleB = Math.min(GSI_QUANT_SCALE_B_MAX, Math.max(0, rqd / 2))
  const col = clampIndex(Math.floor((GSI_QUANT_SCALE_A_MAX - scaleA) / GSI_QUANT_TICK_STEP), GSI_QUANT_TICK_COLS - 1)
  const row = clampIndex(Math.floor((GSI_QUANT_SCALE_B_MAX - scaleB) / GSI_QUANT_TICK_STEP), GSI_QUANT_TICK_ROWS - 1)
  return {
    col,
    row,
    scaleAMin: GSI_QUANT_SCALE_A_MAX - (col + 1) * GSI_QUANT_TICK_STEP,
    scaleBMin: GSI_QUANT_SCALE_B_MAX - (row + 1) * GSI_QUANT_TICK_STEP,
  }
}

export function quantitativeTickFill(col: number, row: number) {
  const scaleA = GSI_QUANT_SCALE_A_MAX - (col + 0.5) * GSI_QUANT_TICK_STEP
  const scaleB = GSI_QUANT_SCALE_B_MAX - (row + 0.5) * GSI_QUANT_TICK_STEP
  return { jcond89: Math.round((scaleA / 1.5) * 10) / 10, rqd: scaleB * 2 }
}

export const GSI_JCOND76_OPTIONS: readonly { id: string; label: string; labelEn: string; value: number }[] = [
  { id: 'j76_25', label: '表面非常粗糙；不连续；无张开；结构面壁坚硬', labelEn: 'Very rough surfaces; not continuous; no separation; hard joint wall rock', value: 25 },
  { id: 'j76_20', label: '表面微粗糙；张开度 < 1 mm；结构面壁坚硬', labelEn: 'Slightly rough surfaces; separation < 1 mm; hard joint wall rock', value: 20 },
  { id: 'j76_12', label: '表面微粗糙；张开度 < 1 mm；结构面壁软弱', labelEn: 'Slightly rough surfaces; separation < 1 mm; soft joint wall rock', value: 12 },
  { id: 'j76_6', label: '镜面，或泥质充填 < 5 mm，或连续张开 1～5 mm', labelEn: 'Slickensided surfaces, or gouge < 5 mm, or continuous opening 1–5 mm', value: 6 },
  { id: 'j76_0', label: '软泥质充填 > 5 mm，或连续张开 > 5 mm', labelEn: 'Soft gouge > 5 mm thick, or continuous opening > 5 mm', value: 0 },
]

export const GSI_GRADES: readonly GsiGradeInfo[] = [
  { id: 'good', min: 75, label: '好', labelEn: 'Good' },
  { id: 'fair_good', min: 55, label: '较好', labelEn: 'Fair to good' },
  { id: 'fair', min: 40, label: '一般', labelEn: 'Fair' },
  { id: 'poor', min: 25, label: '较差', labelEn: 'Poor' },
  { id: 'very_poor', min: 0, label: '很差', labelEn: 'Very poor' },
]

export function createInitialGsiState(): GsiFormState {
  return {
    applicabilityId: '',
    entryMode: 'chart',
    structureId: '',
    surfaceQualityId: '',
    rqdSource: 'measured',
    rqd: null,
    lambdaPerM: null,
    jv: null,
    surfaceMethod: 'jcond89',
    jcond89Mode: 'simple',
    jcond89Value: null,
    jcond89SimpleId: '',
    jcond89PersistenceId: '',
    jcond89ApertureId: '',
    jcond89RoughnessId: '',
    jcond89InfillId: '',
    jcond89WeatheringId: '',
    jcond76Id: '',
    jrId: '',
    jrValue: null,
    jaId: '',
    jaValue: null,
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function finiteNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isFinite(parsed) ? parsed : null
}

function knownId(value: unknown, ids: readonly string[], fallback = ''): string {
  return typeof value === 'string' && ids.includes(value) ? value : fallback
}

function optionIds(options: readonly { id: string }[]) {
  return options.map((item) => item.id)
}

export function normalizeGsiState(raw: unknown): GsiFormState {
  const source = asRecord(raw)
  const initial = createInitialGsiState()
  const entryMode: GsiEntryMode = source.entryMode === 'quantitative' ? 'quantitative' : 'chart'
  const rqdSource: GsiRqdSource =
    source.rqdSource === 'priest_hudson' || source.rqdSource === 'palmstrom_2005' || source.rqdSource === 'palmstrom_1982' || source.rqdSource === 'measured'
      ? source.rqdSource
      : initial.rqdSource
  const surfaceMethod: GsiSurfaceMethod =
    source.surfaceMethod === 'jcond76' || source.surfaceMethod === 'jr_ja' || source.surfaceMethod === 'jcond89'
      ? source.surfaceMethod
      : initial.surfaceMethod
  const jcond89Mode: GsiJcond89Mode = source.jcond89Mode === 'detailed' || source.jcond89Mode === 'simple' ? source.jcond89Mode : initial.jcond89Mode
  return {
    applicabilityId: knownId(source.applicabilityId, optionIds(GSI_APPLICABILITY_OPTIONS), initial.applicabilityId) as GsiApplicabilityId,
    entryMode,
    structureId: knownId(source.structureId, optionIds(GSI_STRUCTURE_OPTIONS), initial.structureId) as GsiStructureId,
    surfaceQualityId: knownId(source.surfaceQualityId, optionIds(GSI_SURFACE_OPTIONS), initial.surfaceQualityId) as GsiSurfaceQualityId,
    rqdSource,
    rqd: finiteNumber(source.rqd),
    lambdaPerM: finiteNumber(source.lambdaPerM),
    jv: finiteNumber(source.jv),
    surfaceMethod,
    jcond89Mode,
    jcond89Value: finiteNumber(source.jcond89Value),
    jcond89SimpleId: knownId(source.jcond89SimpleId, optionIds(A4_SIMPLE)),
    jcond89PersistenceId: knownId(source.jcond89PersistenceId, optionIds(A4_PERSISTENCE)),
    jcond89ApertureId: knownId(source.jcond89ApertureId, optionIds(A4_APERTURE)),
    jcond89RoughnessId: knownId(source.jcond89RoughnessId, optionIds(A4_ROUGHNESS)),
    jcond89InfillId: knownId(source.jcond89InfillId, optionIds(A4_INFILL)),
    jcond89WeatheringId: knownId(source.jcond89WeatheringId, optionIds(A4_WEATHERING)),
    jcond76Id: knownId(source.jcond76Id, optionIds(GSI_JCOND76_OPTIONS)),
    jrId: knownId(source.jrId, optionIds(Q_JR_OPTIONS)),
    jrValue: finiteNumber(source.jrValue),
    jaId: knownId(source.jaId, optionIds(Q_JA_OPTIONS)),
    jaValue: finiteNumber(source.jaValue),
  }
}

function issue(field: string, zh: string, en: string): ValidationIssue {
  return { field, message: zh, messageEn: en }
}

function scoreOf(options: readonly ScoreOption[], id: string) {
  return options.find((item) => item.id === id)?.score ?? null
}

export function estimateRqdFromLambda(lambdaPerM: number) {
  const rqd = 100 * Math.exp(-0.1 * lambdaPerM) * (0.1 * lambdaPerM + 1)
  return clampRqd(rqd)
}

export function estimateRqdFromJv(jv: number, edition: 'palmstrom_2005' | 'palmstrom_1982') {
  const rqd = edition === 'palmstrom_2005' ? 110 - 2.5 * jv : 115 - 3.3 * jv
  return clampRqd(rqd)
}

function clampRqd(value: number) {
  const clamped = Math.min(100, Math.max(0, value))
  return { value: round1(clamped), raw: value, clamped: value < 0 || value > 100 }
}

export function gsiFromRatings(jcond89: number, rqd: number) {
  return 1.5 * jcond89 + rqd / 2
}

export function gsiFromScales(scaleA: number, scaleB: number) {
  return round1(scaleA + scaleB)
}

export function chartCellGsi(structureId: Exclude<GsiStructureId, ''>, surfaceQualityId: Exclude<GsiSurfaceQualityId, ''>): GsiChartCell {
  const structure = GSI_STRUCTURE_OPTIONS.find((item) => item.id === structureId)
  const surface = GSI_SURFACE_OPTIONS.find((item) => item.id === surfaceQualityId)
  if (!structure || !surface) throw new Error('Unknown GSI chart cell')
  const applicable = !structure.naSurfaceIds.includes(surface.id)
  const gsi = applicable ? gsiFromScales(surface.scaleA, structure.scaleB) : null
  return {
    structureId,
    surfaceQualityId,
    scaleA: surface.scaleA,
    scaleB: structure.scaleB,
    gsi,
    applicable,
  }
}

export function allChartCells(): GsiChartCell[] {
  return GSI_STRUCTURE_OPTIONS.flatMap((structure) =>
    GSI_SURFACE_OPTIONS.map((surface) => chartCellGsi(structure.id, surface.id))
  )
}

export function nearestChartCell(rqd: number, jcond89: number) {
  const structure: Exclude<GsiStructureId, ''> =
    rqd >= 70 ? 'blocky' : rqd >= 50 ? 'very_blocky' : rqd >= 30 ? 'blocky_disturbed' : 'disintegrated'
  const surface: Exclude<GsiSurfaceQualityId, ''> =
    jcond89 >= 27.5 ? 'very_good' : jcond89 >= 22.5 ? 'good' : jcond89 >= 15 ? 'fair' : jcond89 >= 5 ? 'poor' : 'very_poor'
  return chartCellGsi(structure, surface)
}

function resolveQValue(options: readonly QFactorOption[], id: string, adopted: number | null, prefer: 'min' | 'max') {
  const option = options.find((item) => item.id === id)
  if (!option) return null
  if (adopted != null && adopted >= option.range.min && adopted <= option.range.max) return { value: adopted, option, usedRangeDefault: false }
  const value = prefer === 'min' ? option.range.min : option.range.max
  return { value, option, usedRangeDefault: adopted == null && option.range.min !== option.range.max }
}

function isNoWallContact(option: QFactorOption) {
  return /no (rock-)?wall contact/i.test(option.group.en)
}

function resolveDetailedJcond89(state: GsiFormState) {
  const persistence = scoreOf(A4_PERSISTENCE, state.jcond89PersistenceId)
  const aperture = scoreOf(A4_APERTURE, state.jcond89ApertureId)
  const roughness = scoreOf(A4_ROUGHNESS, state.jcond89RoughnessId)
  const infill = scoreOf(A4_INFILL, state.jcond89InfillId)
  const weathering = scoreOf(A4_WEATHERING, state.jcond89WeatheringId)
  if ([persistence, aperture, roughness, infill, weathering].some((item) => item == null)) return null
  return (persistence as number) + (aperture as number) + (roughness as number) + (infill as number) + (weathering as number)
}

export function resolveQuantitativeRqd(state: GsiFormState): { ok: true; resolved: GsiResolvedRqd } | { ok: false; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = []
  if (state.rqdSource === 'measured') {
    if (state.rqd == null) issues.push(issue('rqd', '请输入实测 RQD。', 'Enter the measured RQD.'))
    else if (state.rqd < 0 || state.rqd > 100) issues.push(issue('rqd', 'RQD 应在 0～100 之间。', 'RQD must be between 0 and 100.'))
    if (issues.length) return { ok: false, issues }
    const value = state.rqd as number
    return {
      ok: true,
      resolved: {
        value,
        source: 'measured',
        estimated: false,
        clamped: false,
        formula: { zh: `RQD = ${round1(value)}%（实测）`, en: `RQD = ${round1(value)}% (measured)` },
      },
    }
  }
  if (state.rqdSource === 'priest_hudson') {
    if (state.lambdaPerM == null) issues.push(issue('lambdaPerM', '请输入每米结构面数 λ。', 'Enter discontinuity frequency λ (per metre).'))
    else if (state.lambdaPerM < 0) issues.push(issue('lambdaPerM', 'λ 不能为负。', 'λ cannot be negative.'))
    if (issues.length) return { ok: false, issues }
    const estimated = estimateRqdFromLambda(state.lambdaPerM as number)
    return {
      ok: true,
      resolved: {
        value: estimated.value,
        source: 'priest_hudson',
        estimated: true,
        clamped: estimated.clamped,
        formula: {
          zh: `RQD = 100 e^{-0.1λ}(0.1λ+1) = ${estimated.value}%（λ = ${state.lambdaPerM} /m）`,
          en: `RQD = 100 e^{-0.1λ}(0.1λ+1) = ${estimated.value}% (λ = ${state.lambdaPerM} /m)`,
        },
      },
    }
  }
  if (state.jv == null) issues.push(issue('jv', '请输入体积节理数 Jv。', 'Enter the volumetric joint count Jv.'))
  else if (state.jv < 0) issues.push(issue('jv', 'Jv 不能为负。', 'Jv cannot be negative.'))
  if (issues.length) return { ok: false, issues }
  const edition = state.rqdSource
  const estimated = estimateRqdFromJv(state.jv as number, edition)
  const expr = edition === 'palmstrom_2005' ? '110 − 2.5 Jv' : '115 − 3.3 Jv'
  return {
    ok: true,
    resolved: {
      value: estimated.value,
      source: edition,
      estimated: true,
      clamped: estimated.clamped,
      formula: {
        zh: `RQD = ${expr} = ${estimated.value}%（Jv = ${state.jv}）`,
        en: `RQD = ${expr} = ${estimated.value}% (Jv = ${state.jv})`,
      },
    },
  }
}

export function resolveQuantitativeSurface(state: GsiFormState): { ok: true; resolved: GsiResolvedSurface } | { ok: false; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = []
  if (state.surfaceMethod === 'jcond89') {
    const detailed = resolveDetailedJcond89(state)
    const simple = scoreOf(A4_SIMPLE, state.jcond89SimpleId)
    const jcond89 = state.jcond89Value ?? detailed ?? simple
    if (jcond89 == null) {
      issues.push(issue('jcond89Value', '请输入 JCond₈₉（0～30），或用五档 / 五分项回填。', 'Enter JCond₈₉ (0–30), or fill it from the five-class / five-item ratings.'))
      return { ok: false, issues }
    }
    if (jcond89 < 0 || jcond89 > 30) {
      issues.push(issue('jcond89Value', 'JCond₈₉ 应在 0～30 之间。', 'JCond₈₉ must be between 0 and 30.'))
      return { ok: false, issues }
    }
    const sourceLabel = state.jcond89Value != null
      ? { zh: '输入值', en: 'entered value' }
      : detailed != null
        ? { zh: '五分项合计', en: 'five-item sum' }
        : { zh: '五档综合', en: 'five-class rating' }
    return {
      ok: true,
      resolved: {
        method: 'jcond89',
        jcond89Equivalent: jcond89,
        scaleA: 1.5 * jcond89,
        alternative: false,
        nonWallContact: false,
        formula: { zh: `JCond₈₉ = ${round1(jcond89)}（${sourceLabel.zh}）；刻度 A = 1.5 JCond₈₉`, en: `JCond₈₉ = ${round1(jcond89)} (${sourceLabel.en}); Scale A = 1.5 JCond₈₉` },
      },
    }
  }
  if (state.surfaceMethod === 'jcond76') {
    const option = GSI_JCOND76_OPTIONS.find((item) => item.id === state.jcond76Id)
    if (!option) issues.push(issue('jcond76Id', '请选择 JCond76（RMR 1976 结构面条件）。', 'Select JCond76 (RMR 1976 discontinuity condition).'))
    if (issues.length) return { ok: false, issues }
    const jcond76 = option!.value
    const jcond89 = 1.3 * jcond76
    return {
      ok: true,
      resolved: {
        method: 'jcond76',
        jcond89Equivalent: jcond89,
        jcond76,
        scaleA: 2 * jcond76,
        alternative: true,
        nonWallContact: false,
        formula: { zh: `JCond₇₆ = ${jcond76}；GSI = 2 JCond₇₆ + RQD/2`, en: `JCond76 = ${jcond76}; GSI = 2 JCond76 + RQD/2` },
      },
    }
  }
  const jr = resolveQValue(Q_JR_OPTIONS, state.jrId, state.jrValue, 'min')
  const ja = resolveQValue(Q_JA_OPTIONS, state.jaId, state.jaValue, 'max')
  if (!jr) issues.push(issue('jrId', '请选择 Jr。', 'Select Jr.'))
  if (!ja) issues.push(issue('jaId', '请选择 Ja。', 'Select Ja.'))
  if (jr && state.jrValue != null && (state.jrValue < jr.option.range.min || state.jrValue > jr.option.range.max)) {
    issues.push(issue('jrValue', `Jr 采用值应在 ${jr.option.range.min}～${jr.option.range.max}。`, `Jr must lie in ${jr.option.range.min}–${jr.option.range.max}.`))
  }
  if (ja && state.jaValue != null && (state.jaValue < ja.option.range.min || state.jaValue > ja.option.range.max)) {
    issues.push(issue('jaValue', `Ja 采用值应在 ${ja.option.range.min}～${ja.option.range.max}。`, `Ja must lie in ${ja.option.range.min}–${ja.option.range.max}.`))
  }
  if (issues.length || !jr || !ja) return { ok: false, issues }
  const ratio = ja.value === 0 ? Number.POSITIVE_INFINITY : jr.value / ja.value
  const jcond89 = 35 * (ratio / (1 + ratio))
  return {
    ok: true,
    resolved: {
      method: 'jr_ja',
      jcond89Equivalent: jcond89,
      scaleA: 52.5 * (ratio / (1 + ratio)),
      jr: jr.value,
      ja: ja.value,
      jrJa: ratio,
      alternative: true,
      nonWallContact: isNoWallContact(jr.option) || isNoWallContact(ja.option),
      formula: {
        zh: `Jr/Ja = ${round2(ratio)}；GSI = 52.5 (Jr/Ja)/(1+Jr/Ja) + RQD/2`,
        en: `Jr/Ja = ${round2(ratio)}; GSI = 52.5 (Jr/Ja)/(1+Jr/Ja) + RQD/2`,
      },
    },
  }
}

export function validateGsiState(raw: unknown): ValidationIssue[] {
  const state = normalizeGsiState(raw)
  const issues: ValidationIssue[] = []
  if (!state.entryMode) {
    issues.push(issue('entryMode', '请选择图表法或定量法。', 'Choose the chart method or the quantitative method.'))
    return issues
  }
  if (state.entryMode === 'chart') {
    if (!state.structureId || !state.surfaceQualityId) {
      issues.push(issue('structureId', '请在 GSI 图上点选格点（构造 × 表面条件）。', 'Click a cell on the GSI chart (structure × surface condition).'))
      return issues
    }
    const cell = chartCellGsi(state.structureId, state.surfaceQualityId)
    if (!cell.applicable) {
      issues.push(issue('structureId', '该构造与表面条件组合在 GSI 图上为不适用（N/A）。', 'That structure × surface combination is marked N/A on the GSI chart.'))
    }
    return issues
  }
  const rqd = resolveQuantitativeRqd(state)
  if (!rqd.ok) issues.push(...rqd.issues)
  const surface = resolveQuantitativeSurface(state)
  if (!surface.ok) issues.push(...surface.issues)
  return issues
}

export function classifyGsi(gsi: number): GsiGradeInfo {
  return GSI_GRADES.find((item) => gsi >= item.min) ?? GSI_GRADES[GSI_GRADES.length - 1]
}

function round1(value: number) {
  return Math.round((value + Number.EPSILON) * 10) / 10
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function buildWarnings(state: GsiFormState, gsi: number, rqd: GsiResolvedRqd | null, surface: GsiResolvedSurface | null) {
  const warnings: string[] = []
  const warningsEn: string[] = []
  const add = (zh: string, en: string) => {
    warnings.push(zh)
    warningsEn.push(en)
  }
  if (rqd?.estimated) add('RQD 由面测绘相关公式估算，并非岩心实测。', 'RQD is estimated from mapping correlations, not from core measurement.')
  if (rqd?.clamped) add('估算 RQD 已限制在 0～100%。', 'Estimated RQD was clamped to 0–100%.')
  if (surface?.alternative && surface.method === 'jcond76') {
    add('JCond76 为替代刻度（式 2），与主公式的拟合略差。', 'JCond76 is an alternative scale (Eq. 2) with a slightly weaker fit than the primary equation.')
  }
  if (surface?.alternative && surface.method === 'jr_ja') {
    add('Jr/Ja 为替代刻度（式 3），文献检验的拟合不如 JCond₈₉ 主公式。', 'Jr/Ja is an alternative scale (Eq. 3); the published fit is weaker than the JCond₈₉ equation.')
  }
  if (surface?.nonWallContact) {
    add('当前 Jr/Ja 属于岩壁不接触类别，超出 2013 年附录对照表的推导范围。', 'The selected Jr/Ja ratings have no wall contact, which lies outside the 2013 appendix correlation.')
  }
  if (gsi < 10 || gsi > 85) {
    add('GSI 落在常用区间（约 10～85）之外，请复核块体尺寸、破坏模式是否仍适合用 GSI + Hoek–Brown。', 'GSI lies outside the usual range (about 10–85); re-check block size and failure mode before using GSI with Hoek–Brown.')
  }
  if (state.entryMode === 'chart' && state.structureId === 'intact') {
    add('完整或极稀疏节理岩体（GSI 常 > 75）需检查脆裂片帮；若破坏由结构面控制，不宜直接用 Hoek–Brown。', 'Intact or sparsely jointed rock (GSI often > 75) needs a spalling check; do not use Hoek–Brown when failure is structurally controlled.')
  }
  if (state.entryMode === 'chart' && state.structureId === 'laminated') {
    add('鳞片状 / 剪切岩体位于量化图下缘，GSI 仅作弱化估计；强烈剪切或 flysch 宜用专用图表。', 'Laminated / sheared rock sits at the bottom of the quantified chart; use a dedicated flysch chart when shearing is intense.')
  }
  return { warnings, warningsEn }
}

export function calculateGsi(raw: unknown): GsiResult {
  const state = normalizeGsiState(raw)
  const issues = validateGsiState(state)
  if (issues.length > 0) throw new Error(issues.map((item) => item.message).join('；'))

  if (state.entryMode === 'chart') {
    const cell = chartCellGsi(state.structureId as Exclude<GsiStructureId, ''>, state.surfaceQualityId as Exclude<GsiSurfaceQualityId, ''>)
    if (!cell.applicable || cell.gsi == null) throw new Error('该格点在 GSI 图上为不适用。')
    const gsi = cell.gsi
    const grade = classifyGsi(gsi)
    const { warnings, warningsEn } = buildWarnings(state, gsi, null, null)
    return {
      gsi,
      entryMode: 'chart',
      rqd: cell.scaleB * 2,
      jcond89Equivalent: cell.scaleA / 1.5,
      scaleA: cell.scaleA,
      scaleB: cell.scaleB,
      grade,
      formula: `GSI = 刻度 A + 刻度 B = ${cell.scaleA} + ${cell.scaleB} = ${gsi}`,
      formulaEn: `GSI = Scale A + Scale B = ${cell.scaleA} + ${cell.scaleB} = ${gsi}`,
      warnings,
      warningsEn,
      rqdResolution: null,
      surfaceResolution: null,
      chartCell: { structureId: cell.structureId, surfaceQualityId: cell.surfaceQualityId },
    }
  }

  const rqd = resolveQuantitativeRqd(state)
  const surface = resolveQuantitativeSurface(state)
  if (!rqd.ok || !surface.ok) throw new Error('GSI 定量输入不完整。')
  const gsiRaw =
    surface.resolved.method === 'jcond76'
      ? 2 * (surface.resolved.jcond76 as number) + rqd.resolved.value / 2
      : surface.resolved.method === 'jr_ja'
        ? 52.5 * ((surface.resolved.jrJa as number) / (1 + (surface.resolved.jrJa as number))) + rqd.resolved.value / 2
        : gsiFromRatings(surface.resolved.jcond89Equivalent, rqd.resolved.value)
  const gsi = round1(Math.min(100, Math.max(0, gsiRaw)))
  const grade = classifyGsi(gsi)
  const { warnings, warningsEn } = buildWarnings(state, gsi, rqd.resolved, surface.resolved)
  const formulaZh =
    surface.resolved.method === 'jcond76'
      ? `GSI = 2 JCond₇₆ + RQD/2 = 2×${surface.resolved.jcond76} + ${rqd.resolved.value}/2 = ${gsi}`
      : surface.resolved.method === 'jr_ja'
        ? `GSI = 52.5 (Jr/Ja)/(1+Jr/Ja) + RQD/2 = 52.5×${round2((surface.resolved.jrJa as number) / (1 + (surface.resolved.jrJa as number)))} + ${rqd.resolved.value}/2 = ${gsi}`
        : `GSI = 1.5 JCond₈₉ + RQD/2 = 1.5×${round1(surface.resolved.jcond89Equivalent)} + ${rqd.resolved.value}/2 = ${gsi}`
  const formulaEn =
    surface.resolved.method === 'jcond76'
      ? `GSI = 2 JCond76 + RQD/2 = 2×${surface.resolved.jcond76} + ${rqd.resolved.value}/2 = ${gsi}`
      : surface.resolved.method === 'jr_ja'
        ? `GSI = 52.5 (Jr/Ja)/(1+Jr/Ja) + RQD/2 = 52.5×${round2((surface.resolved.jrJa as number) / (1 + (surface.resolved.jrJa as number)))} + ${rqd.resolved.value}/2 = ${gsi}`
        : `GSI = 1.5 JCond₈₉ + RQD/2 = 1.5×${round1(surface.resolved.jcond89Equivalent)} + ${rqd.resolved.value}/2 = ${gsi}`
  return {
    gsi,
    entryMode: 'quantitative',
    rqd: rqd.resolved.value,
    jcond89Equivalent: round1(surface.resolved.jcond89Equivalent),
    scaleA: round1(surface.resolved.scaleA),
    scaleB: round1(rqd.resolved.value / 2),
    grade,
    formula: formulaZh,
    formulaEn,
    warnings,
    warningsEn,
    rqdResolution: rqd.resolved,
    surfaceResolution: surface.resolved,
    chartCell: nearestChartCell(rqd.resolved.value, surface.resolved.jcond89Equivalent),
  }
}

export function tryCalculateGsi(raw: unknown): GsiResult | null {
  try {
    return calculateGsi(raw)
  } catch {
    return null
  }
}

export function describeGsi(raw: unknown): ParameterDescription[] {
  const state = normalizeGsiState(raw)
  const empty = '未选择'
  const emptyEn = 'Not selected'
  const structure = GSI_STRUCTURE_OPTIONS.find((item) => item.id === state.structureId)
  const surface = GSI_SURFACE_OPTIONS.find((item) => item.id === state.surfaceQualityId)
  const jcond89 = A4_SIMPLE.find((item) => item.id === state.jcond89SimpleId)
  const jcond76 = GSI_JCOND76_OPTIONS.find((item) => item.id === state.jcond76Id)
  const jr = Q_JR_OPTIONS.find((item) => item.id === state.jrId)
  const ja = Q_JA_OPTIONS.find((item) => item.id === state.jaId)
  const rqdSourceLabel =
    state.rqdSource === 'measured'
      ? { zh: '实测', en: 'Measured' }
      : state.rqdSource === 'priest_hudson'
        ? { zh: 'Priest–Hudson λ', en: 'Priest–Hudson λ' }
        : state.rqdSource === 'palmstrom_2005'
          ? { zh: 'Palmström 2005 Jv', en: 'Palmström 2005 Jv' }
          : { zh: 'Palmström 1982 Jv', en: 'Palmström 1982 Jv' }
  return [
    {
      key: 'entryMode',
      label: '计算入口',
      labelEn: 'Entry path',
      value: state.entryMode === 'chart' ? '图表法' : state.entryMode === 'quantitative' ? '定量法' : '未选择',
      valueEn: state.entryMode === 'chart' ? 'Chart method' : state.entryMode === 'quantitative' ? 'Quantitative method' : emptyEn,
    },
    {
      key: 'structureId',
      label: '岩体结构',
      labelEn: 'Rock-mass structure',
      value: structure?.label ?? empty,
      valueEn: structure?.labelEn ?? emptyEn,
    },
    {
      key: 'surfaceQualityId',
      label: '表面质量',
      labelEn: 'Surface quality',
      value: surface?.label ?? empty,
      valueEn: surface?.labelEn ?? emptyEn,
    },
    {
      key: 'rqd',
      label: 'RQD',
      labelEn: 'RQD',
      value: state.rqd == null ? `${rqdSourceLabel.zh}${state.lambdaPerM != null ? ` · λ=${state.lambdaPerM}` : ''}${state.jv != null ? ` · Jv=${state.jv}` : ''}` : `${state.rqd}%`,
      valueEn: state.rqd == null ? `${rqdSourceLabel.en}${state.lambdaPerM != null ? ` · λ=${state.lambdaPerM}` : ''}${state.jv != null ? ` · Jv=${state.jv}` : ''}` : `${state.rqd}%`,
    },
    {
      key: 'surfaceMethod',
      label: '结构面条件',
      labelEn: 'Joint condition',
      value:
        state.surfaceMethod === 'jcond89'
          ? jcond89?.label ?? (state.jcond89Mode === 'detailed' ? 'JCond₈₉ 五分项' : empty)
          : state.surfaceMethod === 'jcond76'
            ? jcond76?.label ?? empty
            : jr && ja
              ? `Jr ${jr.label.zh} / Ja ${ja.label.zh}`
              : empty,
      valueEn:
        state.surfaceMethod === 'jcond89'
          ? jcond89?.labelEn ?? (state.jcond89Mode === 'detailed' ? 'JCond₈₉ five ratings' : emptyEn)
          : state.surfaceMethod === 'jcond76'
            ? jcond76?.labelEn ?? emptyEn
            : jr && ja
              ? `Jr ${jr.label.en} / Ja ${ja.label.en}`
              : emptyEn,
    },
  ]
}
