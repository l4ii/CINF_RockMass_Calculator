import { describe, expect, it } from 'vitest'
import {
  calculateGsi,
  chartCellGsi,
  createInitialGsiState,
  estimateRqdFromJv,
  estimateRqdFromLambda,
  gsiFromRatings,
  nearestChartCell,
  locateQuantitativeCell,
  locateQuantitativePoint,
  quantitativeCellFill,
  quantitativePointFill,
  locateChartRegion,
  chartIsoline,
  chartIsolineDiagonalLabel,
  chartIsolinePickPoints,
  chartPointApplicable,
  classifyGsi,
  GSI_GRADES,
  GSI_CHART_ISOLINE_VALUES,
  GSI_QUANT_SCALE_A_TICKS,
  GSI_QUANT_SCALE_B_TICKS,
  normalizeGsiState,
  validateGsiState,
  type GsiFormState,
} from './methods/gsi'
import { gsiAdapter } from './methods/adapters/gsiAdapter'

function complete(partial: Partial<GsiFormState>): GsiFormState {
  return {
    ...createInitialGsiState(),
    applicabilityId: 'jointed_isotropic',
    entryMode: 'quantitative',
    rqdSource: 'measured',
    rqd: 80,
    surfaceMethod: 'jcond89',
    jcond89Mode: 'simple',
    jcond89SimpleId: 'a4_25',
    ...partial,
  }
}

describe('GSI domain calculations', () => {
  it('uses the RMR five-class bands with explicit decimal boundaries', () => {
    const cases: Array<[number, string]> = [
      [0, 'very_poor'],
      [20, 'very_poor'],
      [20.1, 'poor'],
      [40, 'poor'],
      [40.1, 'fair'],
      [60, 'fair'],
      [60.1, 'fair_good'],
      [80, 'fair_good'],
      [80.1, 'good'],
      [81, 'good'],
      [100, 'good'],
    ]
    cases.forEach(([value, id]) => expect(classifyGsi(value).id).toBe(id))
    expect(GSI_GRADES.map((grade) => grade.label)).toEqual(['I 级', 'II 级', 'III 级', 'IV 级', 'V 级'])
    expect(GSI_GRADES.map((grade) => grade.range)).toEqual(['>80～100', '>60～80', '>40～60', '>20～40', '0～20'])
  })

  it('accepts JCond89 typed as an input value', () => {
    const result = calculateGsi(complete({ jcond89SimpleId: '', jcond89Value: 25 }))
    expect(result.scaleA).toBe(37.5)
    expect(result.gsi).toBe(77.5)
  })

  it('uses GSI = 1.5 JCond89 + RQD/2 as the primary equation', () => {
    expect(gsiFromRatings(25, 80)).toBe(77.5)
    const result = calculateGsi(complete({}))
    expect(result.gsi).toBe(77.5)
    expect(result.entryMode).toBe('quantitative')
    expect(result.formula).toContain('1.5')
  })

  it('substitutes JCond76 with GSI = 2 JCond76 + RQD/2', () => {
    const result = calculateGsi(complete({ surfaceMethod: 'jcond76', jcond76Id: 'j76_20' }))
    expect(result.gsi).toBe(80)
    expect(result.surfaceResolution?.method).toBe('jcond76')
    expect(result.warnings.some((item) => item.includes('JCond76'))).toBe(true)
  })

  it('substitutes Jr/Ja with GSI = 52.5 (Jr/Ja)/(1+Jr/Ja) + RQD/2', () => {
    const result = calculateGsi(complete({ surfaceMethod: 'jr_ja', jrId: 'rough_undulating', jaId: 'unaltered_walls' }))
    expect(result.gsi).toBe(79.4)
    expect(result.jcond89Equivalent).toBe(26.3)
    expect(result.warnings.some((item) => item.includes('Jr/Ja'))).toBe(true)
  })

  it('sums the five JCond89 detail ratings', () => {
    const result = calculateGsi(
      complete({
        jcond89Mode: 'detailed',
        jcond89PersistenceId: 'pers_lt1',
        jcond89ApertureId: 'ap_none',
        jcond89RoughnessId: 'rough_vr',
        jcond89InfillId: 'inf_none',
        jcond89WeatheringId: 'w_uw',
      })
    )
    expect(result.jcond89Equivalent).toBe(30)
    expect(result.gsi).toBe(85)
  })

  it('estimates RQD from Priest–Hudson λ and Palmström Jv', () => {
    expect(estimateRqdFromLambda(10).value).toBeCloseTo(73.6, 1)
    expect(estimateRqdFromJv(10, 'palmstrom_2005').value).toBe(85)
    expect(estimateRqdFromJv(10, 'palmstrom_1982').value).toBe(82)
    const priest = calculateGsi(complete({ rqdSource: 'priest_hudson', lambdaPerM: 10, rqd: null }))
    expect(priest.rqd).toBeCloseTo(73.6, 1)
    expect(priest.rqdResolution?.estimated).toBe(true)
    const palm = calculateGsi(complete({ rqdSource: 'palmstrom_2005', jv: 10, rqd: null }))
    expect(palm.rqd).toBe(85)
    expect(palm.gsi).toBe(80)
  })

  it('computes chart cells as Scale A + Scale B, not from logged JCond89 / RQD', () => {
    const cell = chartCellGsi('blocky', 'good')
    expect(cell.scaleA).toBe(37.5)
    expect(cell.scaleB).toBe(40)
    expect(cell.gsi).toBe(77.5)
    expect(cell.applicable).toBe(true)
    const result = calculateGsi(
      complete({ entryMode: 'chart', structureId: 'blocky', surfaceQualityId: 'good' })
    )
    expect(result.gsi).toBe(77.5)
    expect(result.scaleA).toBe(37.5)
    expect(result.scaleB).toBe(40)
    expect(result.entryMode).toBe('chart')
    expect(result.formula).toContain('刻度 A')
  })

  it('marks intact+poor and laminated+very good as N/A', () => {
    expect(chartCellGsi('intact', 'poor').applicable).toBe(false)
    expect(chartCellGsi('intact', 'very_poor').applicable).toBe(false)
    expect(chartCellGsi('laminated', 'very_good').applicable).toBe(false)
    expect(chartCellGsi('laminated', 'good').applicable).toBe(false)
    expect(chartCellGsi('intact', 'very_good').gsi).toBe(95)
    expect(chartCellGsi('laminated', 'very_poor').gsi).toBe(0)
    const issues = validateGsiState(complete({ entryMode: 'chart', structureId: 'intact', surfaceQualityId: 'poor' }))
    expect(issues.some((issue) => issue.message.includes('N/A'))).toBe(true)
  })

  it('maps a quantitative result back onto the nearest chart cell', () => {
    const nearest = nearestChartCell(80, 25)
    expect(nearest.structureId).toBe('blocky')
    expect(nearest.surfaceQualityId).toBe('good')
  })

  it('locates the 4-row quantitative cell from Jcond89 and RQD', () => {
    expect(locateQuantitativeCell(21, 70)).toEqual({ structureId: 'blocky', surfaceQualityId: 'good' })
    expect(locateQuantitativeCell(15, 50)).toEqual({ structureId: 'very_blocky', surfaceQualityId: 'fair' })
    expect(quantitativeCellFill('very_blocky', 'fair')).toEqual({ jcond89: 15, rqd: 50 })
    expect(quantitativeCellFill('blocky', 'good')).toEqual({ jcond89: 21, rqd: 70 })
    expect(locateQuantitativePoint(15, 45)).toEqual({ scaleA: 23, scaleB: 23 })
    expect(quantitativePointFill(24, 20)).toEqual({ scaleA: 24, scaleB: 20, jcond89: 16, rqd: 40 })
    expect(quantitativePointFill(16, 34)).toEqual({ scaleA: 16, scaleB: 34, jcond89: 16 / 1.5, rqd: 68 })
    expect(GSI_QUANT_SCALE_A_TICKS).toEqual([45, 40, 35, 30, 25, 20, 15, 10, 5, 0])
    expect(GSI_QUANT_SCALE_B_TICKS).toEqual([40, 35, 30, 25, 20, 15, 10, 5, 0])
    expect(locateChartRegion(35, 40)).toEqual({ structureId: 'blocky', surfaceQualityId: 'good' })
    expect(locateChartRegion(15, 0)).toEqual({ structureId: 'laminated', surfaceQualityId: 'poor' })
    expect(locateChartRegion(10, 10)).toEqual({ structureId: 'disintegrated', surfaceQualityId: 'poor' })
    expect(chartPointApplicable(15, 0)).toBe(true)
    expect(chartPointApplicable(15, 5)).toBe(true)
    expect(chartPointApplicable(5, 50)).toBe(false)
    expect(chartIsolinePickPoints().some((item) => item.scaleA === 35 && item.scaleB === 40)).toBe(true)
    expect(chartIsolinePickPoints().some((item) => item.scaleA === 37.5 && item.scaleB === 40)).toBe(false)
    expect(GSI_CHART_ISOLINE_VALUES[0]).toBe(95)
    expect(GSI_CHART_ISOLINE_VALUES[GSI_CHART_ISOLINE_VALUES.length - 1]).toBe(5)
    expect(chartIsoline(95)).not.toBeNull()
    const isoline5 = chartIsoline(5)
    expect(isoline5?.points).toHaveLength(2)
    expect(isoline5?.y2).toBe(100)
    const label50 = chartIsolineDiagonalLabel(50)
    expect(label50.left).toBeCloseTo(label50.top)
    expect(label50.left).toBeCloseTo((1 - 50 / 95) * 100)
    expect(chartIsolineDiagonalLabel(90).left).toBeLessThan(chartIsolineDiagonalLabel(10).left)
  })

  it('uses clicked chart Scale A + Scale B without cell-center values', () => {
    const result = calculateGsi(complete({
      entryMode: 'chart',
      structureId: 'blocky',
      surfaceQualityId: 'good',
      chartScaleA: 35,
      chartScaleB: 40,
    }))
    expect(result.scaleA).toBe(35)
    expect(result.scaleB).toBe(40)
    expect(result.gsi).toBe(75)
    expect(result.formula).toContain('35 + 40')
  })

  it('uses clicked Scale A + Scale B without reverse-calculating through JCond89', () => {
    const result = calculateGsi(complete({
      jcond89SimpleId: '',
      jcond89Value: 16 / 1.5,
      rqd: 68,
      quantChartScaleA: 16,
      quantChartScaleB: 34,
    }))
    expect(result.scaleA).toBe(16)
    expect(result.scaleB).toBe(34)
    expect(result.gsi).toBe(50)
    expect(result.formula).toContain('16 + 34')
  })

  it('requires a chart cell by default', () => {
    const blank = validateGsiState(createInitialGsiState())
    expect(blank.some((issue) => issue.field === 'structureId')).toBe(true)
    expect(createInitialGsiState().entryMode).toBe('chart')
  })

  it('keeps adapter form keys stable for the v2 file contract', () => {
    const initial = gsiAdapter.createInitialForm()
    const normalized = gsiAdapter.normalize(initial)
    expect(Object.keys(normalized).sort()).toEqual(Object.keys(createInitialGsiState()).sort())
    expect(Object.keys(normalizeGsiState({ rqd: 40 })).sort()).toEqual(Object.keys(createInitialGsiState()).sort())
  })
})
