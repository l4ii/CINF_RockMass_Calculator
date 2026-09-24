/** Digitised NGI 2022 Figure 7 geometry in log–log (Q, De) space. */

export const Q_CHART_Q_MIN = 0.001
export const Q_CHART_Q_MAX = 1000
export const Q_CHART_DE_MIN = 1
export const Q_CHART_DE_MAX = 100
export const Q_CHART_ORANGE_DE_MIN = 3
export const Q_CHART_ORANGE_DE_MAX = 100
export const Q_CHART_EMPIRICAL_Q_MAX = 400
export const Q_CHART_UNSUPPORTED_K = 2
export const Q_CHART_SLOPE = 0.4

export type QSupportCategoryId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type QRrsClass = 'I' | 'II' | 'III'
export type QEnergyClass = 500 | 700 | 1000

export interface QChartPoint {
  q: number
  de: number
}

export interface QSupportCategoryBand {
  category: Exclude<QSupportCategoryId, 1 | 9>
  points: QChartPoint[]
}

export type QSupportBoundaryId = 'upper' | 'lower' | '5cm' | '6cm' | '9cm' | '12cm' | '15cm' | '25cm'

/** Reduced controls digitised from NGI 2022 Figure 7; interpolation is log-log. */
export const Q_CHART_BOUNDARY_TABLES: Record<QSupportBoundaryId, readonly QChartPoint[]> = {
  upper: [
    { q: 0.001, de: 13.6 },
    { q: 0.0088, de: 20 },
    { q: 0.0859, de: 30 },
    { q: 0.4219, de: 40 },
    { q: 1.4809, de: 50 },
    { q: 3.9948, de: 60 },
    { q: 9.4681, de: 70 },
    { q: 36.0705, de: 80 },
    { q: 220.8818, de: 90 },
    { q: 1000, de: 100 },
  ],
  lower: [
    { q: 0.333, de: 1.65 },
    { q: 0.65136, de: 2 },
    { q: 1.93591, de: 3 },
    { q: 7.57681, de: 5 },
    { q: 49.09025, de: 10 },
    { q: 145.9729, de: 15 },
    { q: 322.39987, de: 20 },
    { q: 957.77106, de: 29.9399 },
  ],
  '25cm': [
    { q: 0.00165, de: 4.9975 },
    { q: 0.0055, de: 8 },
    { q: 0.0101, de: 10 },
    { q: 0.0304, de: 15 },
    { q: 0.0646, de: 20 },
    { q: 0.1765, de: 30 },
    { q: 0.2492, de: 36 },
  ],
  '15cm': [
    { q: 0.001, de: 1.0262 },
    { q: 0.009897, de: 3 },
    { q: 0.028, de: 5 },
    { q: 0.0986, de: 10 },
    { q: 0.2899, de: 20 },
    { q: 0.5258, de: 30 },
    { q: 0.8025, de: 40 },
    { q: 0.88239, de: 42.658 },
    { q: 0.92, de: 45.5 },
  ],
  '12cm': [
    { q: 0.00602, de: 1.0262 },
    { q: 0.043916, de: 3 },
    { q: 0.099862, de: 5 },
    { q: 0.305282, de: 10 },
    { q: 0.8518, de: 20 },
    { q: 1.6122, de: 30 },
    { q: 2.5643, de: 40 },
    { q: 3.7638, de: 50 },
    { q: 5.13075, de: 59.395 },
    { q: 5.5, de: 63 },
  ],
  '9cm': [
    { q: 0.02394, de: 1.0262 },
    { q: 0.17498, de: 3 },
    { q: 0.38733, de: 5 },
    { q: 1.06687, de: 10 },
    { q: 2.96317, de: 20 },
    { q: 5.48883, de: 30 },
    { q: 8.82887, de: 40 },
    { q: 12.8196, de: 50 },
    { q: 18.0859, de: 60 },
    { q: 24.3044, de: 70 },
    { q: 28.2, de: 76 },
    { q: 29, de: 78 },
  ],
  '6cm': [
    { q: 0.09857, de: 1.0233 },
    { q: 0.64446, de: 3 },
    { q: 1.24867, de: 5 },
    { q: 3.19592, de: 10 },
    { q: 8.44748, de: 20 },
    { q: 16.0049, de: 30 },
    { q: 24.5098, de: 40 },
    { q: 34.3408, de: 50 },
    { q: 38.64854, de: 53.3949 },
    { q: 39.2, de: 60 },
    { q: 39.7, de: 75 },
    { q: 41.4109, de: 81 },
  ],
  '5cm': [
    { q: 29.32297, de: 8.8359 },
    { q: 32.2307, de: 10 },
    { q: 55.2709, de: 20 },
    { q: 75.5966, de: 30 },
    { q: 94.5416, de: 40 },
    { q: 98.9983, de: 50 },
    { q: 99.3, de: 70 },
    { q: 99.6, de: 80 },
    { q: 100, de: 85 },
  ],
}

/** Numeric tokens are retained because the SVG chart consumes this public shape. */
export const Q_CHART_THICKNESS_CONTOURS: readonly { thicknessCm: number; k: number; boundary: Exclude<QSupportBoundaryId, 'upper' | 'lower'> }[] = [
  { thicknessCm: 5, k: 3.0, boundary: '5cm' },
  { thicknessCm: 6, k: 4.8, boundary: '6cm' },
  { thicknessCm: 9, k: 6.0, boundary: '9cm' },
  { thicknessCm: 12, k: 7.4, boundary: '12cm' },
  { thicknessCm: 15, k: 10.0, boundary: '15cm' },
  { thicknessCm: 25, k: 14.0, boundary: '25cm' },
]

/** Bolt spacing with Sfr (m) along increasing support intensity k. */
export const Q_CHART_BOLT_SPACING_WITH_SFR: readonly { k: number; spacingM: number }[] = [
  { k: 3.0, spacingM: 2.5 },
  { k: 3.4, spacingM: 2.3 },
  { k: 4.0, spacingM: 2.1 },
  { k: 5.0, spacingM: 1.7 },
  { k: 6.5, spacingM: 1.5 },
  { k: 8.5, spacingM: 1.3 },
  { k: 12, spacingM: 1.2 },
  { k: 25, spacingM: 1.0 },
]

/** Bolt spacing without Sfr (m) along the unsupported-limit band, vs Q. */
export const Q_CHART_BOLT_SPACING_WITHOUT_SFR: readonly { q: number; spacingM: number }[] = [
  { q: 0.4, spacingM: 1.4 },
  { q: 1, spacingM: 1.5 },
  { q: 4, spacingM: 1.6 },
  { q: 10, spacingM: 2.0 },
  { q: 40, spacingM: 3.0 },
  { q: 100, spacingM: 4.0 },
  { q: 1000, spacingM: 4.0 },
]

/** RRS centre-to-centre spacing (m) vs k in categories 6–8. */
export const Q_CHART_RRS_SPACING: readonly { k: number; spacingM: number }[] = [
  { k: 6.0, spacingM: 4.0 },
  { k: 7.4, spacingM: 2.9 },
  { k: 10, spacingM: 2.3 },
  { k: 14, spacingM: 1.7 },
  { k: 22, spacingM: 1.0 },
]

/** Horizontal RRS I/II/III badges sit on this De inside categories 6–8. */
export const Q_CHART_RRS_LABEL_DE = 7.5

export const Q_CHART_QUALITY_TICKS: readonly { q: number; letter: string }[] = [
  { q: 0.001, letter: 'G' },
  { q: 0.01, letter: 'F' },
  { q: 0.1, letter: 'E' },
  { q: 1, letter: 'D' },
  { q: 4, letter: 'C' },
  { q: 10, letter: 'B' },
  { q: 40, letter: 'A' },
  { q: 100, letter: 'A' },
  { q: 400, letter: 'A' },
  { q: 1000, letter: 'A' },
]

export function chartK(q: number, de: number): number {
  return de / q ** Q_CHART_SLOPE
}

function interpolateLogLog(table: readonly QChartPoint[], q: number): number {
  let a = table[0]
  let b = table[1]
  if (q >= table[table.length - 1].q) {
    a = table[table.length - 2]
    b = table[table.length - 1]
  } else if (q > table[0].q) {
    for (let i = 1; i < table.length; i += 1) {
      if (q <= table[i].q) {
        a = table[i - 1]
        b = table[i]
        break
      }
    }
  }
  const t = Math.log(q / a.q) / Math.log(b.q / a.q)
  return a.de * (b.de / a.de) ** t
}

export function supportBoundaryDe(boundary: QSupportBoundaryId, q: number): number {
  return interpolateLogLog(Q_CHART_BOUNDARY_TABLES[boundary], q)
}

/** Inverse of supportBoundaryDe on the digitised log-log controls. */
export function qAtBoundaryDe(boundary: QSupportBoundaryId, de: number): number | null {
  const table = Q_CHART_BOUNDARY_TABLES[boundary]
  const qLo = table[0].q
  const qHi = table[table.length - 1].q
  const deLo = supportBoundaryDe(boundary, qLo)
  const deHi = supportBoundaryDe(boundary, qHi)
  const deMin = Math.min(deLo, deHi)
  const deMax = Math.max(deLo, deHi)
  if (de < deMin || de > deMax) return null
  const increasing = deHi >= deLo
  let lo = qLo
  let hi = qHi
  for (let i = 0; i < 40; i += 1) {
    const mid = 10 ** ((Math.log10(lo) + Math.log10(hi)) / 2)
    const deMid = supportBoundaryDe(boundary, mid)
    if ((increasing && deMid < de) || (!increasing && deMid > de)) lo = mid
    else hi = mid
  }
  return 10 ** ((Math.log10(lo) + Math.log10(hi)) / 2)
}

function qWhereOrangeTopEquals(de: number): number | null {
  return qAtBoundaryDe('upper', de)
}

/**
 * Centre of categories 6–8 at a constant De, so RRS I/II/III can sit inside
 * their bands instead of on the shared contour.
 */
export function rrsClassAnchor(category: 6 | 7 | 8, de = Q_CHART_RRS_LABEL_DE): { q: number; de: number; qLow: number; qHigh: number } | null {
  const rightBoundary: Record<6 | 7 | 8, QSupportBoundaryId> = { 6: '12cm', 7: '15cm', 8: '25cm' }
  const leftBoundary: Record<6 | 7 | 8, QSupportBoundaryId | null> = { 6: '15cm', 7: '25cm', 8: null }
  const qRight = qAtBoundaryDe(rightBoundary[category], de)
  if (qRight == null) return null
  let qLeft = leftBoundary[category] ? qAtBoundaryDe(leftBoundary[category]!, de) : Q_CHART_Q_MIN
  if (qLeft == null) return null
  if (orangeTopDe(qLeft) < de) {
    const hinge = qWhereOrangeTopEquals(de)
    if (hinge == null || hinge >= qRight) return null
    qLeft = hinge
  }
  qLeft = Math.max(qLeft, Q_CHART_Q_MIN)
  if (qRight <= qLeft) return null
  const q = Math.sqrt(qLeft * qRight)
  if (de < Q_CHART_ORANGE_DE_MIN || de > orangeTopDe(q) || de < unsupportedDe(q) || q > Q_CHART_EMPIRICAL_Q_MAX) return null
  return { q, de, qLow: qLeft, qHigh: qRight }
}

/** Vertical RRS c/c labels sit just below the class pills; 1.0 m is in category 8, not on k·Q^0.4. */
export const Q_CHART_RRS_SPACING_LABEL_DE = 6

export function rrsSpacingAnchor(k: number, de = Q_CHART_RRS_SPACING_LABEL_DE): QChartPoint | null {
  const contour = Q_CHART_THICKNESS_CONTOURS.find((item) => item.k === k)
  let q: number | null
  if (contour) {
    q = qAtBoundaryDe(contour.boundary, de)
  } else {
    const qRight = qAtBoundaryDe('25cm', de)
    if (qRight == null) return null
    let qLeft = Q_CHART_Q_MIN
    if (orangeTopDe(qLeft) < de) {
      const hinge = qWhereOrangeTopEquals(de)
      if (hinge == null || hinge >= qRight) return null
      qLeft = hinge
    }
    if (qRight <= qLeft) return null
    q = Math.sqrt(qLeft * qRight)
  }
  if (q == null || !Number.isFinite(q)) return null
  if (de < Q_CHART_ORANGE_DE_MIN || de > orangeTopDe(q) || de < unsupportedDe(q) || q > Q_CHART_EMPIRICAL_Q_MAX) return null
  return { q, de }
}

export function contourDe(q: number, k: number): number {
  if (k === Q_CHART_UNSUPPORTED_K) return supportBoundaryDe('lower', q)
  const contour = Q_CHART_THICKNESS_CONTOURS.find((item) => item.k === k)
  if (contour) return supportBoundaryDe(contour.boundary, q)
  return k * q ** Q_CHART_SLOPE
}

export function unsupportedDe(q: number): number {
  return supportBoundaryDe('lower', q)
}

export function orangeTopDe(q: number): number {
  return supportBoundaryDe('upper', q)
}

export function envelopeSpan(q: number): { deLow: number; deHigh: number } | null {
  if (q < Q_CHART_Q_MIN || q > Q_CHART_EMPIRICAL_Q_MAX) return null
  const deLow = Math.max(Q_CHART_ORANGE_DE_MIN, unsupportedDe(q))
  const deHigh = Math.min(Q_CHART_DE_MAX, orangeTopDe(q))
  if (deHigh <= deLow) return null
  return { deLow, deHigh }
}

function contourVisible(q: number, de: number): boolean {
  return de >= Q_CHART_DE_MIN && de <= Q_CHART_DE_MAX && de >= unsupportedDe(q) && de <= orangeTopDe(q)
}

function intersectVisible(k: number, qInside: number, qOutside: number): QChartPoint {
  let inside = qInside
  let outside = qOutside
  for (let i = 0; i < 28; i += 1) {
    const mid = 10 ** ((Math.log10(inside) + Math.log10(outside)) / 2)
    if (contourVisible(mid, contourDe(mid, k))) inside = mid
    else outside = mid
  }
  return { q: inside, de: contourDe(inside, k) }
}

function pushContourPoint(point: QChartPoint, dashedBelowDataLimit: boolean, dashed: QChartPoint[], current: QChartPoint[], flush: () => void) {
  if (point.de < Q_CHART_ORANGE_DE_MIN) {
    if (dashedBelowDataLimit) dashed.push(point)
    flush()
    return
  }
  if (dashedBelowDataLimit && dashed.length > 0 && current.length === 0) dashed.push(point)
  current.push(point)
}

/** Solid isolines follow the orange fill; the same curve continues dashed below De = 3 and east of Q = 400. */
export function sampleEnvelopeContour(k: number, dashedBelowDataLimit = false, count = 120): {
  solid: QChartPoint[][]
  dashed: QChartPoint[]
  eastDashed: QChartPoint[]
} {
  const solid: QChartPoint[][] = []
  const dashed: QChartPoint[] = []
  const eastDashed: QChartPoint[] = []
  let current: QChartPoint[] = []
  const flush = () => {
    if (current.length > 1) solid.push(current)
    current = []
  }
  let eastStarted = false
  const startEast = () => {
    if (eastStarted) return
    eastStarted = true
    const hingeDe = contourDe(Q_CHART_EMPIRICAL_Q_MAX, k)
    if (contourVisible(Q_CHART_EMPIRICAL_Q_MAX, hingeDe)) {
      const hinge = { q: Q_CHART_EMPIRICAL_Q_MAX, de: hingeDe }
      pushContourPoint(hinge, dashedBelowDataLimit, dashed, current, flush)
      eastDashed.push(hinge)
    }
    flush()
  }
  let prev: { q: number; de: number; visible: boolean } | null = null
  for (const q of sampleLogQ(count)) {
    if (q > Q_CHART_EMPIRICAL_Q_MAX) {
      startEast()
      const de = contourDe(q, k)
      if (contourVisible(q, de)) eastDashed.push({ q, de })
      continue
    }
    const de = contourDe(q, k)
    const visible = contourVisible(q, de)
    if (visible) {
      if (prev && !prev.visible) pushContourPoint(intersectVisible(k, q, prev.q), dashedBelowDataLimit, dashed, current, flush)
      pushContourPoint({ q, de }, dashedBelowDataLimit, dashed, current, flush)
    } else if (prev?.visible) {
      pushContourPoint(intersectVisible(k, prev.q, q), dashedBelowDataLimit, dashed, current, flush)
      flush()
    }
    prev = { q, de, visible }
  }
  startEast()
  flush()
  return { solid, dashed, eastDashed }
}

export function inChartAxes(q: number, de: number): boolean {
  return q >= Q_CHART_Q_MIN && q <= Q_CHART_Q_MAX && de >= Q_CHART_DE_MIN && de <= Q_CHART_DE_MAX
}

export function interpolateTable(table: readonly { k: number; spacingM: number }[], k: number): number {
  if (k <= table[0].k) return table[0].spacingM
  const last = table[table.length - 1]
  if (k >= last.k) return last.spacingM
  for (let i = 1; i < table.length; i += 1) {
    const a = table[i - 1]
    const b = table[i]
    if (k <= b.k) {
      const t = (Math.log(k) - Math.log(a.k)) / (Math.log(b.k) - Math.log(a.k))
      return a.spacingM + t * (b.spacingM - a.spacingM)
    }
  }
  return last.spacingM
}

export function interpolateThicknessCm(q: number, de: number): number {
  const table = Q_CHART_THICKNESS_CONTOURS
  const first = table[0]
  const firstDe = supportBoundaryDe(first.boundary, q)
  if (de <= firstDe) return first.thicknessCm
  for (let i = 1; i < table.length; i += 1) {
    const a = table[i - 1]
    const b = table[i]
    const deA = supportBoundaryDe(a.boundary, q)
    const deB = supportBoundaryDe(b.boundary, q)
    if (de <= deB) {
      const t = Math.log(de / deA) / Math.log(deB / deA)
      return a.thicknessCm + t * (b.thicknessCm - a.thicknessCm)
    }
  }
  return table[table.length - 1].thicknessCm
}

export function interpolateWithoutSfrSpacing(q: number): number {
  const table = Q_CHART_BOLT_SPACING_WITHOUT_SFR
  if (q <= table[0].q) return table[0].spacingM
  const last = table[table.length - 1]
  if (q >= last.q) return last.spacingM
  for (let i = 1; i < table.length; i += 1) {
    const a = table[i - 1]
    const b = table[i]
    if (q <= b.q) {
      const t = (Math.log10(q) - Math.log10(a.q)) / (Math.log10(b.q) - Math.log10(a.q))
      return a.spacingM + t * (b.spacingM - a.spacingM)
    }
  }
  return last.spacingM
}

export function sampleLogQ(count = 48): number[] {
  const n = Math.max(2, count)
  return Array.from({ length: n }, (_, i) => 10 ** (-3 + (6 * i) / (n - 1)))
}

function sampleQUpTo(maxQ: number, count: number): number[] {
  const qs = sampleLogQ(count).filter((q) => q <= maxQ)
  if (qs.length === 0 || qs[qs.length - 1] < maxQ) qs.push(maxQ)
  return qs
}

function sampleQFrom(minQ: number, count: number): number[] {
  const qs = sampleLogQ(count).filter((q) => q >= minQ)
  if (qs.length === 0 || qs[0] > minQ) qs.unshift(minQ)
  return qs
}

export function sampleContour(k: number, clip: { minDe?: number; maxDe?: (q: number) => number } = {}): QChartPoint[] {
  const minDe = clip.minDe ?? Q_CHART_DE_MIN
  const points: QChartPoint[] = []
  for (const q of sampleLogQ(64)) {
    const de = contourDe(q, k)
    const maxDe = clip.maxDe ? clip.maxDe(q) : Q_CHART_DE_MAX
    if (de >= minDe && de <= maxDe && de >= Q_CHART_DE_MIN && de <= Q_CHART_DE_MAX) points.push({ q, de })
  }
  return points
}

export function sampleOrangeTop(maxQ = Q_CHART_Q_MAX, minQ = Q_CHART_Q_MIN): QChartPoint[] {
  const qs = sampleLogQ(48).filter((q) => q >= minQ && q <= maxQ)
  if (minQ > Q_CHART_Q_MIN && (qs.length === 0 || qs[0] > minQ)) qs.unshift(minQ)
  if (qs.length === 0 || qs[qs.length - 1] < maxQ) qs.push(maxQ)
  return qs.map((q) => ({ q, de: orangeTopDe(q) }))
}

const SUPPORT_CATEGORY_BOUNDS: readonly {
  category: Exclude<QSupportCategoryId, 1 | 9>
  min: QSupportBoundaryId
  max: QSupportBoundaryId
}[] = [
  { category: 2, min: 'lower', max: '5cm' },
  { category: 3, min: '5cm', max: '6cm' },
  { category: 4, min: '6cm', max: '9cm' },
  { category: 5, min: '9cm', max: '12cm' },
  { category: 6, min: '12cm', max: '15cm' },
  { category: 7, min: '15cm', max: '25cm' },
  { category: 8, min: '25cm', max: 'upper' },
]

function orderedBoundaryDe(boundary: QSupportBoundaryId, q: number): number {
  if (boundary === 'lower' || boundary === 'upper') return supportBoundaryDe(boundary, q)
  return Math.min(orangeTopDe(q), Math.max(unsupportedDe(q), supportBoundaryDe(boundary, q)))
}

function stripPolygon(count: number, include: (q: number) => { deLow: number; deHigh: number } | null, qs?: number[]): QChartPoint[] {
  const samples = qs ?? sampleLogQ(count)
  const lower: QChartPoint[] = []
  const upper: QChartPoint[] = []
  for (const q of samples) {
    const span = include(q)
    if (span == null || span.deHigh <= span.deLow) continue
    lower.push({ q, de: span.deLow })
    upper.push({ q, de: span.deHigh })
  }
  return [...lower, ...upper.reverse()]
}

/**
 * Empirical support classes are discrete bands. Categories 1 and 9 stay on
 * the blue chart background; categories 2-8 are clipped to De >= 3 and the
 * digitised upper support envelope.
 */
export function sampleSupportCategoryBands(count = 64, floorDe = Q_CHART_ORANGE_DE_MIN): QSupportCategoryBand[] {
  const qs = sampleQUpTo(Q_CHART_EMPIRICAL_Q_MAX, count)
  return SUPPORT_CATEGORY_BOUNDS.map(({ category, min, max }) => ({
    category,
    points: stripPolygon(
      count,
      (q) => {
        const deLow = Math.max(floorDe, orderedBoundaryDe(min, q))
        const deHigh = Math.min(Q_CHART_DE_MAX, orderedBoundaryDe(max, q))
        return { deLow, deHigh }
      },
      qs
    ),
  }))
}

/** Category 3–8 wedges below De = 3, bounded by the same isolines drawn as dashed lines. */
export function sampleDashedCategoryBands(count = 64): QSupportCategoryBand[] {
  const qs = sampleQUpTo(Q_CHART_EMPIRICAL_Q_MAX, count)
  return SUPPORT_CATEGORY_BOUNDS.map(({ category, min, max }) => ({
    category,
    points: stripPolygon(
      count,
      (q) => {
        const deLow = Math.max(Q_CHART_DE_MIN, orderedBoundaryDe(min, q))
        const deHigh = Math.min(Q_CHART_ORANGE_DE_MIN, orderedBoundaryDe(max, q))
        return { deLow, deHigh }
      },
      qs
    ),
  })).filter((band) => band.points.length > 2)
}

/** Union of categories 2–8, used so the orange envelope never lets the cyan plot show through. */
export function sampleEmpiricalEnvelope(count = 64): QChartPoint[] {
  return stripPolygon(count, (q) => {
    if (q > Q_CHART_EMPIRICAL_Q_MAX) return null
    return {
      deLow: Math.max(Q_CHART_ORANGE_DE_MIN, unsupportedDe(q)),
      deHigh: Math.min(Q_CHART_DE_MAX, orangeTopDe(q)),
    }
  }, sampleQUpTo(Q_CHART_EMPIRICAL_Q_MAX, count))
}

export function sampleCategory1Band(count = 64): QChartPoint[] {
  return stripPolygon(count, (q) => {
    const deHigh = Math.min(unsupportedDe(q), Q_CHART_DE_MAX)
    return { deLow: Q_CHART_DE_MIN, deHigh }
  })
}

export function sampleCategory2EastBand(count = 48): QChartPoint[] {
  return stripPolygon(
    count,
    (q) => ({
      deLow: Math.max(Q_CHART_DE_MIN, unsupportedDe(q)),
      deHigh: Math.min(Q_CHART_DE_MAX, orangeTopDe(q)),
    }),
    sampleQFrom(Q_CHART_EMPIRICAL_Q_MAX, count),
  )
}

export function sampleCategory9Bands(count = 64): QChartPoint[][] {
  const qs = sampleLogQ(count)
  return [
    stripPolygon(count, (q) => {
      const deLow = Math.min(Q_CHART_DE_MAX, orangeTopDe(q))
      return { deLow, deHigh: Q_CHART_DE_MAX }
    }, qs),
  ].filter((points) => points.length > 2)
}

function kForBoundary(boundary: QSupportBoundaryId): number | 'upper' {
  if (boundary === 'upper') return 'upper'
  if (boundary === 'lower') return Q_CHART_UNSUPPORTED_K
  return Q_CHART_THICKNESS_CONTOURS.find((item) => item.boundary === boundary)!.k
}

function contourFrameParts(k: number): { points: QChartPoint[]; dashed: boolean }[] {
  const { solid, dashed, eastDashed } = sampleEnvelopeContour(k, true)
  const parts = solid.filter((segment) => segment.length > 1).map((points) => ({ points, dashed: false }))
  if (dashed.length > 1) parts.push({ points: dashed, dashed: true })
  if (eastDashed.length > 1) parts.push({ points: eastDashed, dashed: true })
  return parts
}

/** Red isoline frame for a category, sampled with the same functions as the drawn chart. */
export function sampleCategoryFrame(category: QSupportCategoryId): { points: QChartPoint[]; dashed: boolean }[] {
  if (category === 1) return contourFrameParts(Q_CHART_UNSUPPORTED_K)
  if (category === 9) {
    const parts: { points: QChartPoint[]; dashed: boolean }[] = []
    const top = sampleOrangeTop(Q_CHART_EMPIRICAL_Q_MAX)
    const east = sampleOrangeTop(Q_CHART_Q_MAX, Q_CHART_EMPIRICAL_Q_MAX)
    if (top.length > 1) parts.push({ points: top, dashed: false })
    if (east.length > 1) parts.push({ points: east, dashed: true })
    return parts
  }
  const bounds = SUPPORT_CATEGORY_BOUNDS.find((item) => item.category === category)
  if (!bounds) return []
  const parts: { points: QChartPoint[]; dashed: boolean }[] = []
  for (const edge of [bounds.min, bounds.max]) {
    const k = kForBoundary(edge)
    if (k === 'upper') {
      const top = sampleOrangeTop(Q_CHART_EMPIRICAL_Q_MAX)
      if (top.length > 1) parts.push({ points: top, dashed: false })
    } else {
      parts.push(...contourFrameParts(k))
    }
  }
  if (category === 2) {
    const five = sampleEnvelopeContour(3, true).solid.flat()
    const hingeQ = five[five.length - 1]?.q ?? 100
    const topSolid = sampleOrangeTop(Q_CHART_EMPIRICAL_Q_MAX).filter((point) => point.q >= hingeQ)
    if (topSolid.length > 1) parts.push({ points: topSolid, dashed: false })
    const topDashed = sampleOrangeTop(Q_CHART_Q_MAX, Q_CHART_EMPIRICAL_Q_MAX)
    if (topDashed.length > 1) parts.push({ points: topDashed, dashed: true })
    const deLow = Math.max(unsupportedDe(Q_CHART_Q_MAX), Q_CHART_DE_MIN)
    if (Q_CHART_DE_MAX > deLow) {
      parts.push({
        points: [
          { q: Q_CHART_Q_MAX, de: deLow },
          { q: Q_CHART_Q_MAX, de: Q_CHART_DE_MAX },
        ],
        dashed: true,
      })
    }
  }
  return parts
}

export function sampleHighlightBand(category: QSupportCategoryId, _count = 64): QChartPoint[][] {
  return sampleCategoryFrame(category).map((part) => part.points)
}

export function boltLengthM(de: number): number {
  return 2 + 0.15 * de
}

export function fiveCmDe(q: number): number {
  return orderedBoundaryDe('5cm', q)
}
