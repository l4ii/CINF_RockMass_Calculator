import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import QNgSupportChart from './components/q/QNgSupportChart'
import { classifySupportChart } from './methods/qSupportChart'
import {
  Q_CHART_BOUNDARY_TABLES,
  Q_CHART_EMPIRICAL_Q_MAX,
  Q_CHART_ORANGE_DE_MIN,
  Q_CHART_RRS_LABEL_DE,
  Q_CHART_RRS_SPACING,
  Q_CHART_THICKNESS_CONTOURS,
  interpolateThicknessCm,
  orangeTopDe,
  rrsClassAnchor,
  rrsSpacingAnchor,
  sampleCategoryFrame,
  sampleEnvelopeContour,
  sampleSupportCategoryBands,
  supportBoundaryDe,
  unsupportedDe,
  type QChartPoint,
} from './methods/qSupportChartGeometry'

function hasHorizontalDe3Run(points: QChartPoint[]) {
  let run = 0
  for (const point of points) {
    if (Math.abs(point.de - Q_CHART_ORANGE_DE_MIN) < 0.02) run += 1
    else run = 0
    if (run >= 4) return true
  }
  return false
}

describe('Q support-chart region semantics', () => {
  it('builds discrete empirical support bands for categories 2-8', () => {
    const bands = sampleSupportCategoryBands()

    expect(bands.map((band) => band.category)).toEqual([2, 3, 4, 5, 6, 7, 8])
    for (const band of bands) {
      expect(band.points.length).toBeGreaterThan(2)
      for (const point of band.points) {
        expect(point.de).toBeGreaterThanOrEqual(Q_CHART_ORANGE_DE_MIN)
        expect(point.de).toBeLessThanOrEqual(orangeTopDe(point.q) + 1e-9)
      }
    }

    expect(bands.flatMap((band) => band.points).every((point) => point.q <= 400)).toBe(true)
    expect(bands.find((band) => band.category === 2)?.points.some((point) => Math.abs(point.q - 400) < 1e-9)).toBe(true)
  })

  it('uses the digitised log-log controls for every empirical boundary', () => {
    for (const [boundary, controls] of Object.entries(Q_CHART_BOUNDARY_TABLES)) {
      for (const control of controls) {
        expect(supportBoundaryDe(boundary as keyof typeof Q_CHART_BOUNDARY_TABLES, control.q)).toBeCloseTo(control.de, 8)
      }
    }

    expect(supportBoundaryDe('6cm', 41.4109)).toBeCloseTo(81, 8)
    expect(supportBoundaryDe('5cm', 100)).toBeCloseTo(85.1, 0)
    expect(Math.abs(supportBoundaryDe('6cm', 0.333) - unsupportedDe(0.333))).toBeGreaterThan(0.2)
  })

  it('builds category polygons from the same boundaries used for classification', () => {
    const bands = sampleSupportCategoryBands(121)
    const q = 10
    const category4 = bands.find((band) => band.category === 4)!
    const atQ = category4.points.filter((point) => Math.abs(Math.log10(point.q / q)) < 1e-9)

    expect(atQ.map((point) => point.de).sort((a, b) => a - b)).toEqual([
      supportBoundaryDe('6cm', q),
      supportBoundaryDe('9cm', q),
    ].sort((a, b) => a - b))
  })

  it('interpolates shotcrete thickness between the same digitised boundaries', () => {
    for (const [boundary, thickness, q] of [
      ['5cm', 5, 60],
      ['6cm', 6, 10],
      ['9cm', 9, 4],
      ['12cm', 12, 1],
      ['15cm', 15, 0.1],
      ['25cm', 25, 0.04],
    ] as const) {
      expect(interpolateThicknessCm(q, supportBoundaryDe(boundary, q))).toBeCloseTo(thickness, 8)
    }

    const q = 1
    const low = supportBoundaryDe('9cm', q)
    const high = supportBoundaryDe('12cm', q)
    expect(interpolateThicknessCm(q, Math.sqrt(low * high))).toBeCloseTo(10.5, 8)
  })

  it.each([
    [0.01, 15, 8],
    [0.01, 6, 7],
    [0.1, 7, 6],
    [1, 15, 5],
    [4, 18, 4],
    [20, 20, 3],
    [80, 20, 2],
    [100, 5, 1],
    [1, 60, 9],
  ] as const)('classifies Q=%s and De=%s as category %s', (q, de, category) => {
    expect(classifySupportChart(q, de).category).toBe(category)
  })

  it('renders category fills without a continuous gradient and keeps four dashed energy curves', () => {
    render(<QNgSupportChart result={null} />)
    const chart = screen.getByTestId('q-ng-support-chart')

    expect(chart.querySelectorAll('[data-testid="q-ng-support-region"]')).toHaveLength(7)
    expect(chart.querySelector('linearGradient')).toBeNull()
    expect(chart.querySelectorAll('[data-testid="q-ng-energy-dashed"]')).toHaveLength(4)
    expect(chart.querySelector('[data-testid="q-ng-envelope-fill"]')).toBeTruthy()
    expect(chart.querySelector('[data-testid="q-ng-envelope-outline"]')).toBeTruthy()

    const aligned = [...chart.querySelectorAll('[data-testid="q-ng-category-mark"]')]
      .filter((node) => ['2', '3', '4', '5', '6', '7', '8'].includes(node.getAttribute('data-category') || ''))
      .map((node) => node.querySelector('circle')?.getAttribute('cy'))
    expect(aligned).toHaveLength(7)
    expect(new Set(aligned).size).toBe(1)

    fireEvent.click(chart.querySelector('[data-testid="q-ng-support-region"][data-category="5"]')!)
    const highlight = chart.querySelector('[data-testid="q-ng-region-highlight"]')
    expect(highlight).toHaveAttribute('data-category', '5')
    expect(highlight).toHaveAttribute('stroke', '#9f1239')
    expect(highlight).toHaveAttribute('fill', 'none')

    const nineCm = sampleEnvelopeContour(6, true)
    const frame = sampleCategoryFrame(5)
    expect(frame.some((part) => part.points[0]?.q === nineCm.solid.flat()[0]?.q && part.points[0]?.de === nineCm.solid.flat()[0]?.de)).toBe(true)

    fireEvent.mouseMove(chart.querySelector('[data-testid="q-ng-energy-tooltip"][data-energy="500"]')!)
    expect(screen.getByTestId('q-ng-energy-tip-float')).toHaveTextContent('E = 500 J')
  })

  it('treats demanded support below De 3 as the dashed continuation of categories 3-8', () => {
    expect(classifySupportChart(0.4, 2)).toEqual({
      category: 3,
      inDashedRegion: true,
      outside: false,
    })
    expect(classifySupportChart(0.1, 2)).toEqual({
      category: 4,
      inDashedRegion: true,
      outside: false,
    })
  })

  it('keeps 异常好 cyan and continues category 2 with dashed lines to bolt length 20', () => {
    expect(classifySupportChart(500, 30)).toEqual({
      category: 2,
      inDashedRegion: true,
      outside: false,
    })
    expect(classifySupportChart(400, 30).category).toBe(2)
    expect(classifySupportChart(500, 5).category).toBe(1)

    const frame = sampleCategoryFrame(2)
    const dashed = frame.filter((part) => part.dashed).flatMap((part) => part.points)
    expect(dashed.some((point) => point.q >= Q_CHART_EMPIRICAL_Q_MAX && Math.abs(point.de - 100) < 1e-6)).toBe(true)
    expect(dashed.some((point) => point.q > Q_CHART_EMPIRICAL_Q_MAX && Math.abs(point.de - unsupportedDe(point.q)) < 1e-6)).toBe(true)
  })

  it('clips solid isolines to the orange envelope and keeps category 1 free of 5 cm lines', () => {
    for (const contour of Q_CHART_THICKNESS_CONTOURS) {
      const { solid, dashed } = sampleEnvelopeContour(contour.k, true)
      expect(solid.some((segment) => segment.length > 1)).toBe(true)
      expect(hasHorizontalDe3Run(solid.flat())).toBe(false)
      expect(hasHorizontalDe3Run(dashed)).toBe(false)
      for (const point of solid.flat()) {
        expect(point.de).toBeGreaterThanOrEqual(unsupportedDe(point.q) - 1e-6)
        expect(point.de).toBeLessThanOrEqual(orangeTopDe(point.q) + 1e-6)
        expect(point.de).toBeGreaterThanOrEqual(Q_CHART_ORANGE_DE_MIN - 1e-6)
        expect(point.q).toBeLessThanOrEqual(Q_CHART_EMPIRICAL_Q_MAX + 1e-6)
      }
    }
    expect(sampleEnvelopeContour(3).solid.flat().every((point) => point.q > 20)).toBe(true)
    const six = sampleEnvelopeContour(4.8).solid.flat()
    const last = six[six.length - 1]
    expect(last.de / orangeTopDe(last.q)).toBeCloseTo(1, 1)
  })

  it('draws the envelope solid to Q=400, dashed to bolt-length 20, and highlights the dashed east frame', () => {
    render(<QNgSupportChart result={null} />)
    const chart = screen.getByTestId('q-ng-support-chart')
    const outline = chart.querySelector('[data-testid="q-ng-envelope-outline"]')
    const xs = [...(outline?.getAttribute('points') ?? '').trim().split(/\s+/)].map((pair) => Number(pair.split(',')[0]))
    expect(Math.max(...xs)).toBeCloseTo(853, 0)
    const dashedXs = [...(chart.querySelector('[data-testid="q-ng-envelope-dashed"]')?.getAttribute('points') ?? '').trim().split(/\s+/)].map((pair) => Number(pair.split(',')[0]))
    expect(Math.max(...dashedXs)).toBeCloseTo(908, 0)
    expect(chart.querySelector('[data-testid="q-ng-unsupported-east-dashed"]')).toBeTruthy()
    const bolt20 = chart.querySelector('[data-testid="q-ng-bolt-tick-20"]')
    expect(bolt20).toHaveTextContent('20')
    const plotTop = Number(chart.querySelector('[data-testid="q-ng-plot"]')?.getAttribute('y'))
    expect(Number(bolt20?.getAttribute('y'))).toBeCloseTo(plotTop + 5, 5)

    fireEvent.click(chart.querySelector('[data-testid="q-ng-support-region"][data-category="2"]')!)
    const highlights = [...chart.querySelectorAll('[data-testid="q-ng-region-highlight"]')]
    expect(highlights.some((node) => node.getAttribute('data-dashed') === 'true')).toBe(true)
    expect(highlights.every((node) => node.getAttribute('stroke') === '#9f1239')).toBe(true)
  })

  it('places RRS I/II/III pills inside categories 6-8 at the same De', () => {
    for (const category of [6, 7, 8] as const) {
      const anchor = rrsClassAnchor(category)
      expect(anchor).not.toBeNull()
      expect(anchor!.de).toBe(Q_CHART_RRS_LABEL_DE)
      expect(anchor!.q).toBeGreaterThan(anchor!.qLow)
      expect(anchor!.q).toBeLessThan(anchor!.qHigh)
      expect(classifySupportChart(anchor!.q, anchor!.de).category).toBe(category)
    }

    render(<QNgSupportChart result={null} />)
    const chart = screen.getByTestId('q-ng-support-chart')
    const badges = [...chart.querySelectorAll('[data-testid="q-ng-rrs-class"]')]
    expect(badges.map((node) => node.getAttribute('data-rrs'))).toEqual(['I', 'II', 'III'])
    expect(badges.map((node) => node.getAttribute('data-category'))).toEqual(['6', '7', '8'])
    const parsed = badges.map((node) => {
      const match = node.getAttribute('transform')?.match(/translate\(([-.\d]+) ([-.\d]+)\)/)
      return { x: Number(match?.[1]), y: Number(match?.[2]) }
    })
    expect(parsed.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true)
    expect(new Set(parsed.map((point) => point.y.toFixed(2))).size).toBe(1)
    expect(parsed[0].x).toBeGreaterThan(parsed[1].x)
    expect(parsed[1].x).toBeGreaterThan(parsed[2].x)
    expect(chart.querySelector('[data-testid="q-ng-rrs-class"][data-rrs="I"] text')?.textContent).toBe('RRS I')
  })

  it('puts RRS c/c 1.0 m in category 8, left of the 25 cm isoline', () => {
    const oneMetre = rrsSpacingAnchor(22)
    const onePointSeven = rrsSpacingAnchor(14)
    expect(oneMetre).not.toBeNull()
    expect(onePointSeven).not.toBeNull()
    expect(oneMetre!.q).toBeLessThan(onePointSeven!.q)
    expect(classifySupportChart(oneMetre!.q, oneMetre!.de).category).toBe(8)
    expect(Q_CHART_RRS_SPACING.map((item) => rrsSpacingAnchor(item.k)?.q).every((q) => q != null)).toBe(true)
  })

  it('toggles thickness labels, isolines and Sfr spacing from the overlay bar', () => {
    render(<QNgSupportChart result={null} />)
    const chart = screen.getByTestId('q-ng-support-chart')
    expect(screen.getByTestId('q-ng-overlay-bar')).toBeInTheDocument()
    expect(chart.querySelectorAll('[data-testid="q-ng-thickness-label"]').length).toBeGreaterThan(0)
    expect(chart.querySelectorAll('[data-testid="q-ng-energy-dashed"]').length).toBe(4)
    expect(chart.querySelector('[data-testid="q-ng-sfr-caption"]')).toBeNull()
    expect(chart).not.toHaveTextContent('有 Sfr 平均锚杆间距')
    expect(chart).not.toHaveTextContent('无 Sfr 平均锚杆间距')
    expect(chart.querySelector('[data-testid="q-ng-sfr-spacing"]')).toBeTruthy()
    expect(chart.querySelector('[data-testid="q-ng-rrs-class"]')).toBeTruthy()
    const rrsSpacing = [...chart.querySelectorAll('[data-testid="q-ng-rrs-spacing"]')]
    expect(rrsSpacing).toHaveLength(5)
    expect(rrsSpacing.every((node) => /rotate\(-90\)/.test(node.getAttribute('transform') || ''))).toBe(true)
    const spacingOrder = rrsSpacing
      .map((node) => {
        const match = node.getAttribute('transform')?.match(/translate\(([-.\d]+) ([-.\d]+)\)/)
        return { spacing: Number(node.getAttribute('data-spacing')), x: Number(match?.[1]), y: Number(match?.[2]) }
      })
      .sort((a, b) => a.x - b.x)
    expect(spacingOrder.map((item) => item.spacing)).toEqual([1, 1.7, 2.3, 2.9, 4])
    const badgeY = Number(chart.querySelector('[data-testid="q-ng-rrs-class"]')?.getAttribute('transform')?.match(/translate\([-.\d]+ ([-.\d]+)\)/)?.[1])
    expect(spacingOrder.every((item) => item.y > badgeY)).toBe(true)
    expect(chart).toHaveTextContent('c/c 1.0 m')
    expect(chart).not.toHaveTextContent('RRS c/c')

    fireEvent.click(screen.getByRole('checkbox', { name: '喷层厚度数值' }))
    expect(chart.querySelector('[data-testid="q-ng-thickness-label"]')).toBeNull()
    expect(chart.querySelectorAll('[data-testid="q-ng-energy-dashed"]')).toHaveLength(4)

    fireEvent.click(screen.getByRole('checkbox', { name: '喷层厚度等值线' }))
    expect(chart.querySelector('[data-testid="q-ng-energy-tooltip"]')).toBeNull()
    expect(chart.querySelector('[data-testid="q-ng-energy-dashed"]')).toBeNull()

    fireEvent.click(screen.getByRole('checkbox', { name: '有 Sfr 平均锚杆间距' }))
    expect(chart.querySelector('[data-testid="q-ng-sfr-spacing"]')).toBeNull()

    fireEvent.click(screen.getByRole('checkbox', { name: 'RRS 等级' }))
    expect(chart.querySelector('[data-testid="q-ng-rrs-class"]')).toBeNull()

    fireEvent.click(screen.getByRole('checkbox', { name: 'RRS 肋间距' }))
    expect(chart.querySelector('[data-testid="q-ng-rrs-spacing"]')).toBeNull()
  })
})
