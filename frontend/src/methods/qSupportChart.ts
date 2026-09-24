import type { QLocalizedText, QSupportRecommendation, QSupportStatus } from './q'
import {
  Q_CHART_DE_MAX,
  Q_CHART_DE_MIN,
  Q_CHART_BOLT_SPACING_WITH_SFR,
  Q_CHART_EMPIRICAL_Q_MAX,
  Q_CHART_ORANGE_DE_MAX,
  Q_CHART_ORANGE_DE_MIN,
  Q_CHART_Q_MAX,
  Q_CHART_Q_MIN,
  Q_CHART_RRS_SPACING,
  Q_CHART_THICKNESS_CONTOURS,
  Q_CHART_UNSUPPORTED_K,
  boltLengthM,
  chartK,
  fiveCmDe,
  inChartAxes,
  interpolateTable,
  interpolateThicknessCm,
  interpolateWithoutSfrSpacing,
  orangeTopDe,
  supportBoundaryDe,
  unsupportedDe,
  type QEnergyClass,
  type QRrsClass,
  type QSupportCategoryId,
} from './qSupportChartGeometry'

const text = (zh: string, en: string): QLocalizedText => ({ zh, en })

export const Q_CHART_SUPPORT_DESCRIPTION = text(
  '永久支护由岩体质量 Q 与当量尺寸 De 在支护图表上读取。图为经验平均结果，锚杆间距与喷层厚度按连续等值线内插；虚线区无经验数据，不外推。本图主要用于拱顶与拱脚，支护参数仍须结合结构面产状、地下水和施工扰动复核。',
  'Permanent support is read from Q and the equivalent dimension De on the support chart. The chart is an empirical average; bolt spacing and shotcrete thickness are interpolated between isolines. Dashed areas have no empirical data and are not extrapolated. The chart is intended mainly for the crown and springline; verify against joint geometry, groundwater and construction disturbance.'
)

export const Q_SUPPORT_CATEGORIES: readonly {
  id: QSupportCategoryId
  label: QLocalizedText
  measures: QLocalizedText
}[] = [
  { id: 1, label: text('类别 1', 'Category 1'), measures: text('无支护或点锚', 'Unsupported or spot bolting') },
  { id: 2, label: text('类别 2', 'Category 2'), measures: text('点锚 SB', 'Spot bolting, SB') },
  { id: 3, label: text('类别 3', 'Category 3'), measures: text('系统锚杆 + 纤维喷混凝土 5–6 cm，B+Sfr', 'Systematic bolting and fibre-reinforced sprayed concrete, 5–6 cm, B+Sfr') },
  { id: 4, label: text('类别 4', 'Category 4'), measures: text('纤维喷混凝土 6–9 cm + 锚杆，Sfr+B', 'Fibre-reinforced sprayed concrete and bolting, 6–9 cm, Sfr+B') },
  { id: 5, label: text('类别 5', 'Category 5'), measures: text('纤维喷混凝土 9–12 cm + 锚杆，Sfr+B', 'Fibre-reinforced sprayed concrete and bolting, 9–12 cm, Sfr+B') },
  { id: 6, label: text('类别 6', 'Category 6'), measures: text('纤维喷混凝土 12–15 cm + RRS I + 锚杆，Sfr+RRS I+B', 'Fibre-reinforced sprayed concrete 12–15 cm + RRS I and bolting, Sfr+RRS I+B') },
  { id: 7, label: text('类别 7', 'Category 7'), measures: text('纤维喷混凝土 >15 cm + RRS II + 锚杆，Sfr+RRS II+B', 'Fibre-reinforced sprayed concrete >15 cm + RRS II and bolting, Sfr+RRS II+B') },
  { id: 8, label: text('类别 8', 'Category 8'), measures: text('模筑混凝土 CCA，或 Sfr+RRS III+B', 'Cast concrete lining, CCA, or Sfr+RRS III+B') },
  { id: 9, label: text('类别 9', 'Category 9'), measures: text('需专项评价', 'Special evaluation') },
]

export interface QChartSupportFields {
  category: QSupportCategoryId
  boltSpacingWithSfrM: number | null
  boltSpacingWithoutSfrM: number | null
  shotcreteThicknessCm: number | null
  energyAbsorptionJ: QEnergyClass | null
  boltLengthM: number | null
  rrs: { class: QRrsClass; spacingM: number | null } | null
  inDashedRegion: boolean
}

export type QChartSupportRecommendation = QSupportRecommendation & { mode: 'chart' } & QChartSupportFields

function energyFor(category: QSupportCategoryId): QEnergyClass | null {
  if (category === 4) return 500
  if (category === 5 || category === 6) return 700
  if (category === 7 || category === 8) return 1000
  return null
}

function rrsFor(category: QSupportCategoryId, k: number): QChartSupportFields['rrs'] {
  if (category === 6) return { class: 'I', spacingM: interpolateTable(Q_CHART_RRS_SPACING, k) }
  if (category === 7) return { class: 'II', spacingM: interpolateTable(Q_CHART_RRS_SPACING, k) }
  if (category === 8) return { class: 'III', spacingM: interpolateTable(Q_CHART_RRS_SPACING, k) }
  return null
}

function statusFor(category: QSupportCategoryId, inRange: boolean): QSupportStatus {
  if (!inRange || category === 9) return 'outside-chart'
  if (category === 1) return 'not-required'
  return 'required'
}

export function classifySupportChart(q: number, de: number): { category: QSupportCategoryId; inDashedRegion: boolean; outside: boolean } {
  if (!inChartAxes(q, de)) return { category: 9, inDashedRegion: false, outside: true }
  const deU = unsupportedDe(q)
  const top = orangeTopDe(q)
  if (de > top) return { category: 9, inDashedRegion: false, outside: false }
  if (de < deU) return { category: 1, inDashedRegion: false, outside: false }
  if (q > Q_CHART_EMPIRICAL_Q_MAX) return { category: 2, inDashedRegion: true, outside: false }
  const inDashedRegion = de < Q_CHART_ORANGE_DE_MIN
  if (de < fiveCmDe(q)) return { category: 2, inDashedRegion, outside: false }
  if (de < supportBoundaryDe('6cm', q)) return { category: 3, inDashedRegion, outside: false }
  if (de < supportBoundaryDe('9cm', q)) return { category: 4, inDashedRegion, outside: false }
  if (de < supportBoundaryDe('12cm', q)) return { category: 5, inDashedRegion, outside: false }
  if (de < supportBoundaryDe('15cm', q)) return { category: 6, inDashedRegion, outside: false }
  if (de < supportBoundaryDe('25cm', q)) return { category: 7, inDashedRegion, outside: false }
  return { category: 8, inDashedRegion, outside: false }
}

export function supportFromChart(q: number, de: number): QChartSupportRecommendation {
  const limit = unsupportedDe(q)
  const demandRatio = de / limit
  const { category, inDashedRegion, outside } = classifySupportChart(q, de)
  const info = Q_SUPPORT_CATEGORIES[category - 1]
  const k = chartK(q, de)
  const inRange = inChartAxes(q, de)
  const detailed = category >= 3 && category <= 8 && !inDashedRegion && !outside
  const light = category === 1 || category === 2
  const recommendation = outside
    ? text('Q 或 De 超出支护图表范围，不自动给出支护类别或参数；应结合工程条件进行专项设计。', 'Q or De is outside the support-chart range, so no support class or parameters are assigned; perform project-specific design.')
    : category === 9
      ? text(
          inDashedRegion
            ? '点位落在虚线区，无经验数据，不外推喷层厚度或锚杆间距；应作专项评价。'
            : '点位位于经验支护包络以外，需专项评价，不外推图表参数。',
          inDashedRegion
            ? 'The point lies in a dashed region with no empirical data; shotcrete thickness and bolt spacing are not extrapolated. Carry out a special evaluation.'
            : 'The point lies outside the empirical support envelope; perform a special evaluation and do not extrapolate chart parameters.'
        )
      : text(`${info.measures.zh}。推荐为经验指南，等值线之间已内插；仍须结合结构面控制与现场条件复核。`, `${info.measures.en}. The recommendation is an empirical guide with isoline interpolation; verify against discontinuity control and site conditions.`)
  return {
    mode: 'chart',
    status: statusFor(category, inRange),
    maximumUnsupportedDimension: limit,
    demandRatio,
    label: outside ? text('示意图范围外', 'Outside schematic range') : text(`${info.label.zh} · ${info.measures.zh}`, `${info.label.en} · ${info.measures.en}`),
    recommendation,
    sourceNote: Q_CHART_SUPPORT_DESCRIPTION,
    category: outside ? 9 : category,
    boltSpacingWithSfrM: detailed ? interpolateTable(Q_CHART_BOLT_SPACING_WITH_SFR, k) : null,
    boltSpacingWithoutSfrM: light && inRange ? interpolateWithoutSfrSpacing(q) : null,
    shotcreteThicknessCm: detailed ? interpolateThicknessCm(q, de) : null,
    energyAbsorptionJ: detailed ? energyFor(category) : null,
    boltLengthM: inRange ? boltLengthM(de) : null,
    rrs: detailed ? rrsFor(category, k) : null,
    inDashedRegion,
  }
}

export { Q_CHART_Q_MIN, Q_CHART_Q_MAX, Q_CHART_DE_MIN, Q_CHART_DE_MAX, Q_CHART_ORANGE_DE_MIN, Q_CHART_ORANGE_DE_MAX, Q_CHART_EMPIRICAL_Q_MAX, Q_CHART_UNSUPPORTED_K, Q_CHART_THICKNESS_CONTOURS }
