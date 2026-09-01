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
  locateQuantitativeTickCell,
  quantitativeCellFill,
  quantitativeTickFill,
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
    expect(locateQuantitativeTickCell(15, 45)).toEqual({ col: 4, row: 3, scaleAMin: 20, scaleBMin: 20 })
    expect(quantitativeTickFill(4, 3)).toEqual({ jcond89: 15, rqd: 45 })
    expect(GSI_QUANT_SCALE_A_TICKS).toEqual([45, 40, 35, 30, 25, 20, 15, 10, 5, 0])
    expect(GSI_QUANT_SCALE_B_TICKS).toEqual([40, 35, 30, 25, 20, 15, 10, 5, 0])
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
