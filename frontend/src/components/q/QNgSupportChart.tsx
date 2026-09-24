import { memo, useId, useState, type MouseEvent } from 'react'
import { formatQValue, type QResult } from '../../methods/q'
import {
  Q_CHART_BOLT_SPACING_WITH_SFR,
  Q_CHART_BOLT_SPACING_WITHOUT_SFR,
  Q_CHART_DE_MAX,
  Q_CHART_DE_MIN,
  Q_CHART_EMPIRICAL_Q_MAX,
  Q_CHART_Q_MAX,
  Q_CHART_Q_MIN,
  Q_CHART_RRS_SPACING,
  Q_CHART_THICKNESS_CONTOURS,
  Q_CHART_UNSUPPORTED_K,
  envelopeSpan,
  orangeTopDe,
  rrsClassAnchor,
  rrsSpacingAnchor,
  sampleCategory1Band,
  sampleCategory2EastBand,
  sampleCategory9Bands,
  sampleCategoryFrame,
  sampleDashedCategoryBands,
  sampleEmpiricalEnvelope,
  sampleEnvelopeContour,
  sampleOrangeTop,
  sampleSupportCategoryBands,
  unsupportedDe,
  type QChartPoint,
  type QSupportCategoryId,
} from '../../methods/qSupportChartGeometry'

export type QChartOverlayId = 'thicknessValues' | 'thicknessLines' | 'sfrSpacing' | 'noSfrSpacing' | 'rrsClass' | 'rrsSpacing'

export const Q_CHART_OVERLAY_DEFAULTS: Record<QChartOverlayId, boolean> = {
  thicknessValues: true,
  thicknessLines: true,
  sfrSpacing: true,
  noSfrSpacing: true,
  rrsClass: true,
  rrsSpacing: true,
}

const OVERLAY_ITEMS: readonly { id: QChartOverlayId; zh: string; en: string }[] = [
  { id: 'thicknessValues', zh: '喷层厚度数值', en: 'Thickness labels' },
  { id: 'thicknessLines', zh: '喷层厚度等值线', en: 'Thickness isolines' },
  { id: 'sfrSpacing', zh: '有 Sfr 平均锚杆间距', en: 'Bolt spacing with Sfr' },
  { id: 'noSfrSpacing', zh: '无 Sfr 平均锚杆间距', en: 'Bolt spacing without Sfr' },
  { id: 'rrsClass', zh: 'RRS 等级', en: 'RRS class' },
  { id: 'rrsSpacing', zh: 'RRS 肋间距', en: 'RRS rib spacing' },
]

const LEFT = 84
const RIGHT = 908
const HEADER_TOP = 14
const TITLE_LINE = 44
const LETTER_LINE = 78
const HEADER_BOTTOM = 116
const TOP = HEADER_BOTTOM
const BOTTOM = TOP + Math.round((RIGHT - LEFT) / 2)
const TEXT = 16
const TITLE = 18
const FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"

function xOf(q: number) {
  return LEFT + ((Math.log10(q) + 3) / 6) * (RIGHT - LEFT)
}

function yOf(de: number) {
  return BOTTOM - (Math.log10(de) / 2) * (BOTTOM - TOP)
}

function poly(points: QChartPoint[]) {
  return points.map((point) => `${xOf(point.q)},${yOf(point.de)}`).join(' ')
}

function contourSlopeDeg() {
  return (Math.atan2(-0.2 * (BOTTOM - TOP), (RIGHT - LEFT) / 6) * 180) / Math.PI
}

function rrsBadgeSize(cls: 'I' | 'II' | 'III') {
  if (cls === 'III') return { width: 68, height: 22 }
  if (cls === 'II') return { width: 58, height: 22 }
  return { width: 54, height: 22 }
}

function qAtDe(k: number, de: number) {
  return (de / k) ** (1 / 0.4)
}

function svgPoint(event: MouseEvent<SVGElement>) {
  const svg = event.currentTarget.ownerSVGElement
  if (!svg) return { x: LEFT + 80, y: BOTTOM - 40 }
  const ctm = typeof svg.getScreenCTM === 'function' ? svg.getScreenCTM() : null
  if (!ctm || typeof svg.createSVGPoint !== 'function') return { x: LEFT + 80, y: BOTTOM - 40 }
  const pt = svg.createSVGPoint()
  pt.x = event.clientX
  pt.y = event.clientY
  const mapped = pt.matrixTransform(ctm.inverse())
  return { x: mapped.x, y: mapped.y }
}

const QUALITY_LETTERS = [
  { from: 0.001, to: 0.01, letter: 'G' },
  { from: 0.01, to: 0.1, letter: 'F' },
  { from: 0.1, to: 1, letter: 'E' },
  { from: 1, to: 4, letter: 'D' },
  { from: 4, to: 10, letter: 'C' },
  { from: 10, to: 40, letter: 'B' },
  { from: 40, to: 1000, letter: 'A' },
] as const

const QUALITY_NAMES = [
  { from: 0.001, to: 0.01, zh: '异常差', en: 'Exceptionally poor' },
  { from: 0.01, to: 0.1, zh: '极差', en: 'Extremely poor' },
  { from: 0.1, to: 1, zh: '很差', en: 'Very poor' },
  { from: 1, to: 4, zh: '差', en: 'Poor' },
  { from: 4, to: 10, zh: '一般', en: 'Fair' },
  { from: 10, to: 40, zh: '好', en: 'Good' },
  { from: 40, to: 100, zh: '很好', en: 'Very good' },
  { from: 100, to: 400, zh: '极好', en: 'Extremely good' },
  { from: 400, to: 1000, zh: '异常好', en: 'Excep. good' },
] as const

const CATEGORY_MARKS = [
  { id: 9, q: 0.004, de: 48 },
  { id: 8, q: 0.03, de: 20 },
  { id: 7, q: 0.15, de: 20 },
  { id: 6, q: 0.6, de: 20 },
  { id: 5, q: 2, de: 20 },
  { id: 4, q: 6, de: 20 },
  { id: 3, q: 18, de: 20 },
  { id: 2, q: 80, de: 20 },
  { id: 1, q: 200, de: 4 },
] as const

const Q_TICKS = [0.001, 0.004, 0.01, 0.04, 0.1, 0.4, 1, 4, 10, 40, 100, 400]
const DE_TICKS = [1, 2, 3, 5, 10, 20, 50]
const ENERGY_LINES: readonly { k: number; joule: 500 | 700 | 1000 }[] = [
  { k: 10, joule: 1000 },
  { k: 7.4, joule: 700 },
  { k: 6, joule: 700 },
  { k: 4.8, joule: 500 },
]

const RRS_EXPLAIN: Record<'I' | 'II' | 'III', { zh: string; en: string }> = {
  I: { zh: 'RRS I：钢筋喷混凝土肋 I 级（Reinforced Ribs of Shotcrete），加强等级最轻', en: 'RRS I: reinforced ribs of shotcrete, lightest class' },
  II: { zh: 'RRS II：钢筋喷混凝土肋 II 级（Reinforced Ribs of Shotcrete），中等加强', en: 'RRS II: reinforced ribs of shotcrete, medium class' },
  III: { zh: 'RRS III：钢筋喷混凝土肋 III 级（Reinforced Ribs of Shotcrete），加强等级最重', en: 'RRS III: reinforced ribs of shotcrete, heaviest class' },
}

type SupportFillCategory = Exclude<QSupportCategoryId, 1 | 9>

const SUPPORT_CATEGORY_BANDS = sampleSupportCategoryBands()
const DASHED_CATEGORY_BANDS = sampleDashedCategoryBands()
const CATEGORY_2_EAST_BAND = sampleCategory2EastBand()
const EMPIRICAL_ENVELOPE = sampleEmpiricalEnvelope()
const ENVELOPE_TOP = sampleOrangeTop(Q_CHART_EMPIRICAL_Q_MAX)
const ENVELOPE_TOP_DASHED = sampleOrangeTop(Q_CHART_Q_MAX, Q_CHART_EMPIRICAL_Q_MAX)
const CATEGORY_1_BAND = sampleCategory1Band()
const CATEGORY_9_BANDS = sampleCategory9Bands()
const SUPPORT_CATEGORY_FILLS: Record<SupportFillCategory, { light: string; dark: string }> = {
  2: { light: '#f0e277', dark: '#bca62a' },
  3: { light: '#eed66b', dark: '#d9b31d' },
  4: { light: '#e9c467', dark: '#d99916' },
  5: { light: '#e4ad5d', dark: '#d27d1c' },
  6: { light: '#df9656', dark: '#cb6425' },
  7: { light: '#d77a51', dark: '#b94b2f' },
  8: { light: '#c65a4b', dark: '#9f3d35' },
}

type EnergyTip = { joule: 500 | 700 | 1000; x: number; y: number }

function OverlayBar({
  overlays,
  darkMode,
  language,
  onToggle,
}: {
  overlays: Record<QChartOverlayId, boolean>
  darkMode: boolean
  language: 'zh' | 'en'
  onToggle: (id: QChartOverlayId) => void
}) {
  const en = language === 'en'
  return (
    <div
      data-testid="q-ng-overlay-bar"
      role="group"
      aria-label={en ? 'Chart labels' : '图面标注'}
      className={`flex flex-wrap items-center gap-1.5 rounded-lg border px-2.5 py-2 ${darkMode ? 'border-gray-600 bg-gray-900/40' : 'border-gray-200 bg-gray-50'}`}
    >
      <span className={`mr-1 shrink-0 text-[11px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{en ? 'Labels' : '图面标注'}</span>
      {OVERLAY_ITEMS.map((item) => {
        const on = overlays[item.id]
        return (
          <label
            key={item.id}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs leading-none ${
              on
                ? darkMode
                  ? 'border-blue-400 bg-blue-600 text-white'
                  : 'border-blue-600 bg-blue-50 text-blue-800'
                : darkMode
                  ? 'border-gray-600 bg-gray-800 text-gray-300'
                  : 'border-gray-300 bg-white text-gray-600'
            }`}
          >
            <input
              type="checkbox"
              className="h-3.5 w-3.5 shrink-0 accent-blue-600"
              checked={on}
              onChange={() => onToggle(item.id)}
            />
            {en ? item.en : item.zh}
          </label>
        )
      })}
    </div>
  )
}

const QNgSupportChartBase = memo(function QNgSupportChartBase({
  darkMode,
  language,
  highlightedCategory,
  overlays,
  onHighlight,
  onEnergyHover,
}: {
  darkMode: boolean
  language: 'zh' | 'en'
  highlightedCategory: QSupportCategoryId | null
  overlays: Record<QChartOverlayId, boolean>
  onHighlight: (category: QSupportCategoryId | null) => void
  onEnergyHover: (tip: EnergyTip | null) => void
}) {
  const en = language === 'en'
  const ink = darkMode ? '#e2e8f0' : '#334155'
  const grid = darkMode ? '#475569' : '#94a3b8'
  const line = darkMode ? '#fb7185' : '#9f1239'
  const cyan = darkMode ? '#134e4a' : '#9adbf7'
  const halo = darkMode ? '#172033' : '#ffffff'
  const envelopeFill = darkMode ? '#c47c2a' : '#e8b56a'
  const unsupported = sampleEnvelopeContour(Q_CHART_UNSUPPORTED_K, true)
  const slope = contourSlopeDeg()
  const note = { fill: ink, stroke: halo, strokeWidth: 3.5, paintOrder: 'stroke' as const }
  const energyLabel = (joule: number) => (en ? `Energy absorption E = ${joule} J` : `喷层吸收能量 E = ${joule} J`)
  const toggleCategory = (category: QSupportCategoryId) => onHighlight(highlightedCategory === category ? null : category)
  const along = (q: number, de: number, label: string, extra?: { weight?: number; dy?: number; rotate?: number; anchor?: 'start' | 'middle' | 'end'; title?: string; clip?: boolean; testId?: string; fontSize?: number; spacingM?: number }) => {
    if (extra?.clip !== false) {
      const span = envelopeSpan(q)
      if (!span || de < span.deLow || de > span.deHigh) return null
    }
    return (
    <text
      key={`${label}-${q}-${de}`}
      data-testid={extra?.testId}
      data-spacing={extra?.spacingM}
      transform={`translate(${xOf(q)} ${yOf(de) + (extra?.dy ?? 0)}) rotate(${extra?.rotate ?? slope})`}
      textAnchor={extra?.anchor ?? 'middle'}
      fontSize={extra?.fontSize ?? TEXT}
      fontWeight={extra?.weight}
      {...note}
    >
      {extra?.title ? <title>{extra.title}</title> : null}
      {label}
    </text>
    )
  }
  const rrsAnchors = ([6, 7, 8] as const).map((category) => ({
    category,
    class: (category === 6 ? 'I' : category === 7 ? 'II' : 'III') as 'I' | 'II' | 'III',
    point: rrsClassAnchor(category),
  }))
  const rrsRotate = rrsAnchors.some(({ class: cls, point }) => {
    if (!point) return false
    return xOf(point.qHigh) - xOf(point.qLow) < rrsBadgeSize(cls).width + 12
  })
    ? slope
    : 0
  const highlight = highlightedCategory == null ? [] : sampleCategoryFrame(highlightedCategory)
  return (
    <g>
      <rect data-testid="q-ng-header" x={LEFT} y={HEADER_TOP} width={RIGHT - LEFT} height={HEADER_BOTTOM - HEADER_TOP} fill={darkMode ? '#1e293b' : '#f8fafc'} />
      <text x={(LEFT + RIGHT) / 2} y={HEADER_TOP + 22} textAnchor="middle" fontSize={TITLE} fontWeight="600" fill={ink}>{en ? 'Rock mass quality and rock support' : '岩体质量与支护'}</text>
      <line x1={LEFT} x2={RIGHT} y1={TITLE_LINE} y2={TITLE_LINE} stroke={ink} />
      <line x1={LEFT} x2={RIGHT} y1={LETTER_LINE} y2={LETTER_LINE} stroke={ink} />
      {QUALITY_LETTERS.map((band) => {
        const x0 = xOf(band.from)
        const x1 = xOf(band.to)
        return (
          <g key={band.letter}>
            {band.from > 0.001 ? <line x1={x0} x2={x0} y1={TITLE_LINE} y2={HEADER_BOTTOM} stroke={ink} /> : null}
            <text data-testid="q-ng-quality-letter" x={(x0 + x1) / 2} y={TITLE_LINE + 20} textAnchor="middle" fontSize={TEXT} fontWeight="700" fill={ink}>{band.letter}</text>
          </g>
        )
      })}
      {QUALITY_NAMES.map((band) => {
        const x0 = xOf(band.from)
        const x1 = xOf(band.to)
        const aSplit = band.from === 100 || band.from === 400
        const lines = en ? band.en.split(' ') : [band.zh]
        return (
          <g key={`${band.from}-${band.zh}`}>
            {aSplit ? <line x1={x0} x2={x0} y1={LETTER_LINE} y2={HEADER_BOTTOM} stroke={ink} strokeDasharray="3 3" /> : null}
            <text data-testid="q-ng-quality-name" x={(x0 + x1) / 2} y={LETTER_LINE + 17} textAnchor="middle" fontSize={TEXT} fill={ink}>
              {lines.map((lineText, index) => <tspan key={lineText} x={(x0 + x1) / 2} dy={index === 0 ? 0 : TEXT + 2}>{lineText}</tspan>)}
            </text>
          </g>
        )
      })}
      <rect data-testid="q-ng-plot" x={LEFT} y={TOP} width={RIGHT - LEFT} height={BOTTOM - TOP} fill={cyan} />
      <polygon
        data-testid="q-ng-outside-region"
        data-category="1"
        points={poly(CATEGORY_1_BAND)}
        fill={cyan}
        className="cursor-pointer"
        onClick={() => toggleCategory(1)}
      />
      {CATEGORY_9_BANDS.map((points, index) => (
        <polygon
          key={`c9-${index}`}
          data-testid="q-ng-outside-region"
          data-category="9"
          points={poly(points)}
          fill={cyan}
          className="cursor-pointer"
          onClick={() => toggleCategory(9)}
        />
      ))}
      {DASHED_CATEGORY_BANDS.map((band) => (
        <polygon
          key={`dash-${band.category}`}
          data-testid="q-ng-dashed-region"
          data-category={band.category}
          points={poly(band.points)}
          fill="transparent"
          className="cursor-pointer"
          onClick={() => toggleCategory(band.category)}
        />
      ))}
      {CATEGORY_2_EAST_BAND.length > 2 ? (
        <polygon
          data-testid="q-ng-dashed-region"
          data-category="2"
          points={poly(CATEGORY_2_EAST_BAND)}
          fill="transparent"
          className="cursor-pointer"
          onClick={() => toggleCategory(2)}
        />
      ) : null}
      {EMPIRICAL_ENVELOPE.length > 2 ? <polygon data-testid="q-ng-envelope-fill" points={poly(EMPIRICAL_ENVELOPE)} fill={envelopeFill} /> : null}
      {[...SUPPORT_CATEGORY_BANDS].reverse().map((band) => {
        const fill = SUPPORT_CATEGORY_FILLS[band.category][darkMode ? 'dark' : 'light']
        const dimmed = highlightedCategory != null && highlightedCategory !== band.category
        return (
          <polygon
            key={band.category}
            data-testid="q-ng-support-region"
            data-category={band.category}
            points={poly(band.points)}
            fill={fill}
            stroke={fill}
            strokeWidth="2"
            strokeLinejoin="round"
            opacity={dimmed ? 0.55 : 1}
            className="cursor-pointer"
            onClick={() => toggleCategory(band.category)}
          />
        )
      })}
      {Array.from({ length: 6 }, (_, decade) => Array.from({ length: 8 }, (_, i) => (i + 2) * 10 ** (decade - 3))).flat().filter((q) => q > Q_CHART_Q_MIN && q < Q_CHART_Q_MAX).map((q) => <line key={`qv-${q}`} x1={xOf(q)} x2={xOf(q)} y1={TOP} y2={BOTTOM} stroke={grid} strokeWidth="0.5" opacity="0.45" />)}
      {[2, 4, 6, 8, 15, 30, 40, 60, 70, 80].map((de) => <line key={`dh-${de}`} x1={LEFT} x2={RIGHT} y1={yOf(de)} y2={yOf(de)} stroke={grid} strokeWidth="0.5" opacity="0.45" />)}
      {Q_TICKS.map((q) => (
        <g key={`q-${q}`}>
          <line x1={xOf(q)} x2={xOf(q)} y1={TOP} y2={BOTTOM} stroke={grid} />
          <text data-testid="q-ng-q-tick" x={xOf(q)} y={BOTTOM + 22} textAnchor="middle" fontSize={TEXT} fill={ink}>{q}</text>
        </g>
      ))}
      {DE_TICKS.map((de) => (
        <g key={`de-${de}`}>
          <line x1={LEFT} x2={RIGHT} y1={yOf(de)} y2={yOf(de)} stroke={grid} />
          <text data-testid="q-ng-de-tick" x={LEFT - 10} y={yOf(de) + 5} textAnchor="end" fontSize={TEXT} fill={ink}>{de}</text>
        </g>
      ))}
      {unsupported.solid.map((segment, index) => (segment.length > 1 ? <polyline key={`u-${index}`} points={poly(segment)} fill="none" stroke={line} strokeWidth="2.8" /> : null))}
      {unsupported.dashed.length > 1 ? <polyline data-testid="q-ng-unsupported-dashed" points={poly(unsupported.dashed)} fill="none" stroke={line} strokeWidth="2.4" strokeDasharray="5 4" /> : null}
      {unsupported.eastDashed.length > 1 ? <polyline data-testid="q-ng-unsupported-east-dashed" points={poly(unsupported.eastDashed)} fill="none" stroke={line} strokeWidth="2.4" strokeDasharray="5 4" /> : null}
      {overlays.thicknessLines
        ? Q_CHART_THICKNESS_CONTOURS.map((contour) => {
        const energy = ENERGY_LINES.find((item) => item.k === contour.k)
        const { solid, dashed, eastDashed } = sampleEnvelopeContour(contour.k, true)
        const moveEnergy = (event: MouseEvent<SVGElement>) => {
          if (!energy) return
          onEnergyHover({ joule: energy.joule, ...svgPoint(event) })
        }
        return (
          <g
            key={contour.k}
            data-testid={energy ? 'q-ng-energy-tooltip' : 'q-ng-thickness-line'}
            data-energy={energy?.joule}
            aria-label={energy ? energyLabel(energy.joule) : undefined}
            onMouseMove={energy ? moveEnergy : undefined}
            onMouseLeave={energy ? () => onEnergyHover(null) : undefined}
          >
            {energy ? <title>{energyLabel(energy.joule)}</title> : null}
            {energy ? solid.map((segment, index) => (segment.length > 1 ? <polyline key={`eh-s-${index}`} points={poly(segment)} fill="none" stroke="transparent" strokeWidth="14" /> : null)) : null}
            {energy && dashed.length > 1 ? <polyline points={poly(dashed)} fill="none" stroke="transparent" strokeWidth="14" /> : null}
            {solid.map((segment, index) => (segment.length > 1 ? <polyline key={`s-${index}`} points={poly(segment)} fill="none" stroke={line} strokeWidth="2.6" /> : null))}
            {dashed.length > 1 ? <polyline data-testid={energy ? 'q-ng-energy-dashed' : undefined} points={poly(dashed)} fill="none" stroke={line} strokeWidth="2.4" strokeDasharray="5 4" /> : null}
            {eastDashed.length > 1 ? <polyline points={poly(eastDashed)} fill="none" stroke={line} strokeWidth="2.4" strokeDasharray="5 4" /> : null}
          </g>
        )
      })
        : null}
      {ENVELOPE_TOP.length > 1 ? <polyline data-testid="q-ng-envelope-outline" points={poly(ENVELOPE_TOP)} fill="none" stroke={line} strokeWidth="3.4" /> : null}
      {ENVELOPE_TOP_DASHED.length > 1 ? <polyline data-testid="q-ng-envelope-dashed" points={poly(ENVELOPE_TOP_DASHED)} fill="none" stroke={line} strokeWidth="3.4" strokeDasharray="5 4" /> : null}
      {highlight.map((part, index) => (
        <polyline
          key={`hl-${index}`}
          data-testid="q-ng-region-highlight"
          data-category={highlightedCategory ?? undefined}
          data-dashed={part.dashed ? 'true' : undefined}
          points={poly(part.points)}
          fill="none"
          stroke={line}
          strokeWidth="5.2"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={part.dashed ? '5 4' : undefined}
          className="pointer-events-none"
        />
      ))}
      {CATEGORY_MARKS.map((mark) => {
        const cx = xOf(mark.q)
        const cy = yOf(mark.de)
        const active = highlightedCategory === mark.id
        return (
          <g key={mark.id} data-testid="q-ng-category-mark" data-category={mark.id} className="cursor-pointer" onClick={() => toggleCategory(mark.id as QSupportCategoryId)}>
            <circle cx={cx} cy={cy} r="12" fill={active ? '#2563eb' : halo} stroke={active ? '#1d4ed8' : ink} strokeWidth={active ? '2.5' : '1.25'} />
            <text x={cx} y={cy + 5} textAnchor="middle" fontSize={TEXT} fontWeight="700" fill={active ? '#ffffff' : ink}>{mark.id}</text>
          </g>
        )
      })}
      {overlays.rrsClass
        ? rrsAnchors.map(({ category, class: cls, point }) => {
        if (!point) return null
        const { width, height } = rrsBadgeSize(cls)
        const active = highlightedCategory === category
        return (
          <g
            key={cls}
            data-testid="q-ng-rrs-class"
            data-rrs={cls}
            data-category={category}
            className="cursor-pointer"
            transform={`translate(${xOf(point.q)} ${yOf(point.de)}) rotate(${rrsRotate})`}
            onClick={() => toggleCategory(category)}
          >
            <title>{RRS_EXPLAIN[cls][language]}</title>
            <rect
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              rx={height / 2}
              fill={active ? '#2563eb' : halo}
              stroke={active ? '#1d4ed8' : line}
              strokeWidth={active ? 2.2 : 1.6}
            />
            <text y={4} textAnchor="middle" fontSize={12} fontWeight={700} fill={active ? '#ffffff' : line}>RRS {cls}</text>
          </g>
        )
      })
        : null}
      {overlays.thicknessValues ? (
        <>
          {along(qAtDe(10, 9), 9, '25 cm', { testId: 'q-ng-thickness-label' })}
          {along(qAtDe(7.4, 10), 10, '15 cm', { testId: 'q-ng-thickness-label' })}
          {along(qAtDe(6, 10), 10, '12 cm', { testId: 'q-ng-thickness-label' })}
          {along(qAtDe(4.8, 10), 10, '9 cm', { testId: 'q-ng-thickness-label' })}
          {along(qAtDe(3.7, 11), 11, '6 cm', { testId: 'q-ng-thickness-label' })}
          {along(qAtDe(3, 12), 12, '5 cm', { testId: 'q-ng-thickness-label' })}
        </>
      ) : null}
      {overlays.sfrSpacing
        ? Q_CHART_BOLT_SPACING_WITH_SFR.map((item, index) => {
        const q = 10 ** (-3 + (5.6 * index) / Math.max(1, Q_CHART_BOLT_SPACING_WITH_SFR.length - 1))
        return along(q, orangeTopDe(q), `${item.spacingM.toFixed(1)} m`, { dy: -8, rotate: -8, testId: 'q-ng-sfr-spacing' })
      })
        : null}
      {overlays.noSfrSpacing
        ? Q_CHART_BOLT_SPACING_WITHOUT_SFR.filter((item) => item.q >= 1).map((item) => {
        const de = unsupportedDe(item.q)
        if (de < Q_CHART_DE_MIN || de > Q_CHART_DE_MAX) return null
        return along(item.q, de, `${item.spacingM.toFixed(1)} m`, { dy: 12, clip: false, testId: 'q-ng-no-sfr-spacing' })
      })
        : null}
      {overlays.rrsSpacing
        ? Q_CHART_RRS_SPACING.map((item) => {
        const point = rrsSpacingAnchor(item.k)
        if (!point) return null
        return along(point.q, point.de, `c/c ${item.spacingM.toFixed(1)} m`, {
          rotate: -90,
          anchor: 'end',
          fontSize: 11,
          spacingM: item.spacingM,
          title: en ? `RRS rib spacing c/c ${item.spacingM.toFixed(1)} m` : `RRS 肋中心距 c/c ${item.spacingM.toFixed(1)} m`,
          testId: 'q-ng-rrs-spacing',
        })
      })
        : null}
      <rect x={LEFT} y={HEADER_TOP} width={RIGHT - LEFT} height={BOTTOM - HEADER_TOP} fill="none" stroke={ink} />
      <text x={(LEFT + RIGHT) / 2} y={BOTTOM + 44} textAnchor="middle" fontSize={TEXT} fill={ink}>{en ? 'Rock-mass quality Q (log scale)' : '岩体质量 Q（对数坐标）'}</text>
      <text transform={`translate(18 ${(TOP + BOTTOM) / 2}) rotate(-90)`} textAnchor="middle" fontSize={TEXT} fill={ink}>{en ? 'Equivalent dimension De (m)' : '当量尺寸 De（m）'}</text>
      {[1.5, 2.4, 3, 5, 7, 11, 20].map((length) => {
        const de = length >= 20 ? Q_CHART_DE_MAX : Math.max(Q_CHART_DE_MIN, (length - 2) / 0.15)
        return (
          <text
            key={length}
            data-testid={length === 20 ? 'q-ng-bolt-tick-20' : undefined}
            x={RIGHT + 10}
            y={yOf(de) + 5}
            fontSize={TEXT}
            fill={ink}
          >
            {length}
          </text>
        )
      })}
      <text data-testid="q-ng-bolt-axis" transform={`translate(${RIGHT + 48} ${(TOP + BOTTOM) / 2}) rotate(-90)`} textAnchor="middle" fontSize={TEXT} fill={ink}>{en ? 'Bolt length (m) for ESR = 1' : '锚杆长度 (m)，ESR＝1'}</text>
    </g>
  )
})

export default function QNgSupportChart({
  result,
  darkMode = false,
  language = 'zh',
  highlightedCategory,
  onHighlight,
}: {
  result: QResult | null
  darkMode?: boolean
  language?: 'zh' | 'en'
  highlightedCategory?: QSupportCategoryId | null
  onHighlight?: (category: QSupportCategoryId | null) => void
}) {
  const en = language === 'en'
  const id = useId()
  const [internalHighlight, setInternalHighlight] = useState<QSupportCategoryId | null>(null)
  const [energyTip, setEnergyTip] = useState<EnergyTip | null>(null)
  const [overlays, setOverlays] = useState(Q_CHART_OVERLAY_DEFAULTS)
  const focus = highlightedCategory ?? internalHighlight
  const setFocus = onHighlight ?? setInternalHighlight
  const inRange = result != null && result.q >= Q_CHART_Q_MIN && result.q <= Q_CHART_Q_MAX
  const showPoint = inRange && result.equivalentDimension != null && result.equivalentDimension >= Q_CHART_DE_MIN && result.equivalentDimension <= Q_CHART_DE_MAX
  const tipX = energyTip == null ? 0 : Math.min(RIGHT - 170, Math.max(LEFT + 8, energyTip.x + 14))
  const tipY = energyTip == null ? 0 : Math.max(TOP + 8, energyTip.y - 36)
  const toggleOverlay = (overlay: QChartOverlayId) => setOverlays((current) => ({ ...current, [overlay]: !current[overlay] }))
  return (
    <div data-testid="q-ng-chart-shell" className="w-full space-y-2">
      <OverlayBar overlays={overlays} darkMode={darkMode} language={language} onToggle={toggleOverlay} />
      <svg data-testid="q-ng-support-chart" xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 990 ${BOTTOM + 58}`} role="img" aria-labelledby={`${id}-title ${id}-desc`} style={{ width: '100%', height: 'auto', fontFamily: FONT_STACK, background: darkMode ? '#172033' : '#ffffff' }}>
      <title id={`${id}-title`}>{en ? 'Rock mass quality and rock support' : '岩体质量与支护'}</title>
      <desc id={`${id}-desc`}>{en ? 'NGI Q-support chart. Horizontal axis Q, vertical axis equivalent dimension De. Colour follows support intensity: darker on the left where poorer rock needs heavier support.' : '永久支护图。横轴为 Q，纵轴为当量尺寸 De。颜色表示支护强度：左侧岩体越差、支护越重，色越深。'}{result ? ` Q=${formatQValue(result.q)}, De=${result.equivalentDimension ?? '—'}.` : ''}</desc>
      <QNgSupportChartBase darkMode={darkMode} language={language} highlightedCategory={focus} overlays={overlays} onHighlight={setFocus} onEnergyHover={setEnergyTip} />
      {inRange ? <line x1={xOf(result.q)} x2={xOf(result.q)} y1={TOP} y2={BOTTOM} stroke="#2563eb" strokeWidth="1.8" strokeDasharray="5 4" /> : null}
      {showPoint ? (
        <g data-testid="q-ng-chart-point">
          <line x1={LEFT} x2={xOf(result.q)} y1={yOf(result.equivalentDimension!)} y2={yOf(result.equivalentDimension!)} stroke="#2563eb" strokeWidth="1.8" strokeDasharray="5 4" />
          <circle cx={xOf(result.q)} cy={yOf(result.equivalentDimension!)} r="12" fill="white" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx={xOf(result.q)} cy={yOf(result.equivalentDimension!)} r="8" fill="#2563eb" stroke="white" strokeWidth="2" />
          <text
            data-testid="q-ng-chart-point-label"
            x={xOf(result.q) + (xOf(result.q) > (LEFT + RIGHT) / 2 ? -16 : 16)}
            y={yOf(result.equivalentDimension!) - 16}
            textAnchor={xOf(result.q) > (LEFT + RIGHT) / 2 ? 'end' : 'start'}
            fontSize="14"
            fontWeight="700"
            fill="#1d4ed8"
            stroke={darkMode ? '#172033' : '#ffffff'}
            strokeWidth="4"
            paintOrder="stroke"
          >
            Q={formatQValue(result.q)}  De={formatQValue(result.equivalentDimension!)}
          </text>
          <title>{en ? 'Current point' : '当前点位'}: Q={formatQValue(result.q)}, De={formatQValue(result.equivalentDimension!)}</title>
        </g>
      ) : null}
      {energyTip ? (
        <g data-testid="q-ng-energy-tip-float" pointerEvents="none">
          <rect x={tipX} y={tipY} width="168" height="28" rx="6" fill={darkMode ? '#0f172a' : '#111827'} stroke={darkMode ? '#fb7185' : '#9f1239'} />
          <text x={tipX + 84} y={tipY + 19} textAnchor="middle" fontSize="13" fontWeight="700" fill="#ffffff">E = {energyTip.joule} J</text>
        </g>
      ) : null}
    </svg>
    </div>
  )
}
