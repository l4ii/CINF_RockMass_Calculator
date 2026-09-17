import { describe, expect, it } from 'vitest'
import { qAdapter } from './methods/adapters/qAdapter'
import {
  Q_ESR_OPTIONS,
  Q_QUALITY_BANDS,
  Q_STANDARD,
  calculateQ,
  createInitialQState,
  formatQValue,
  getQAnalysis,
  maximumUnsupportedDimension,
  qualityFromQ,
  tryCalculateQ,
  validateQState,
  type QFormState,
} from './methods/q'

function complete(partial: Partial<QFormState> = {}): QFormState {
  return {
    ...createInitialQState(),
    rqd: 80,
    jnId: 'two_sets',
    jnValue: 4,
    jrId: 'rough_undulating',
    jrValue: 3,
    jaId: 'unaltered_walls',
    jaValue: 1,
    jwId: 'dry_minor',
    jwValue: 1,
    srfId: 'medium_stress',
    srfValue: 1,
    ...partial,
  }
}

describe('Q domain calculations', () => {
  it('does not require span or ESR to calculate Q', () => {
    const state = complete()
    expect(state.span).toBeNull()
    expect(validateQState(state).filter((item) => item.severity === 'error')).toHaveLength(0)
    const result = calculateQ(state)
    expect(result.q).toBe(60)
    expect(result.grade.id).toBe('I')
    expect(result.span).toBeNull()
    expect(result.support).toBeNull()
    expect(result.breakdown.blockSize).toBe(20)
    expect(result.breakdown.jointShearStrength).toBe(3)
    expect(result.breakdown.activeStress).toBe(1)
  })

  it('uses the nominal RQD of 10% when the measured value is below 10%', () => {
    const result = calculateQ(complete({ rqd: 5 }))
    expect(result.originalRqd).toBe(5)
    expect(result.effectiveRqd).toBe(10)
    expect(result.q).toBe(7.5)
    expect(result.grade.id).toBe('III')
    expect(result.warnings.some((item) => item.code === 'nominal_minimum')).toBe(true)
  })

  it('accepts typed factor values without a table id', () => {
    const result = calculateQ(
      complete({
        jnId: '',
        jnValue: 4,
        jrId: '',
        jrValue: 3,
      })
    )
    expect(result.q).toBe(60)
    expect(result.factors.jn.optionId).toBe('two_sets')
    expect(result.factors.jr.optionId).toBe('rough_undulating')
  })

  it('leaves the initial state incomplete and does not invent a Q value', () => {
    const issues = validateQState(createInitialQState()).filter((item) => item.severity === 'error')
    expect(issues.some((item) => item.field === 'rqd')).toBe(true)
    expect(issues.some((item) => item.field === 'jnValue')).toBe(true)
    expect(issues.some((item) => item.field === 'span')).toBe(false)
    expect(tryCalculateQ(createInitialQState())).toBeNull()
  })

  it('adapts a span-free result without support metrics', () => {
    const adapted = qAdapter.calculate(complete() as unknown as Record<string, unknown>)
    expect(adapted.displayValue).toContain('60')
    expect(adapted.grade).toBe('I 级')
    expect(adapted.summary).not.toMatch(/支护/)
    expect(adapted.metrics.some((item) => item.key === 'block')).toBe(true)
    expect(adapted.metrics.some((item) => item.key === 'blockSize')).toBe(true)
    expect(adapted.metrics.some((item) => item.key === 'support')).toBe(false)
  })

  it('multiplies Jn by 3 at a tunnel intersection', () => {
    const result = calculateQ(complete({ jnId: 'two_sets', jnValue: 12, jnSite: 'intersection' }))
    expect(result.q).toBe(20)
    expect(result.factors.jn.value).toBe(12)
    expect(result.factors.jn.optionId).toBe('two_sets')
  })

  it('adds 1 to Jr when the relevant joint-set spacing is greater than 3 m', () => {
    const result = calculateQ(complete({ jrId: 'rough_undulating', jrValue: 4, jrWideSpacing: true }))
    expect(result.q).toBe(80)
    expect(result.factors.jr.value).toBe(4)
    expect(result.factors.jr.optionId).toBe('rough_undulating')
  })

  it('accepts Ja = 5 for silty or sandy-clay bands', () => {
    const result = calculateQ(complete({ jaId: 'banded_silty_sandy_clay', jaValue: 5 }))
    expect(result.q).toBe(12)
    expect(result.grade.id).toBe('II')
  })

  it('rejects a typed Jn above 60', () => {
    const issues = validateQState(complete({ jnId: '', jnValue: 61, jnSite: '' })).filter((item) => item.severity === 'error')
    expect(issues.some((item) => item.field === 'jnValue' && item.code === 'out_of_range')).toBe(true)
    expect(tryCalculateQ(complete({ jnId: '', jnValue: 61 }))).toBeNull()
  })

  it.each([
    [40.0000001, { rqd: 40.0000001, jnId: '', jnValue: 1, jrId: 'smooth_planar', jrValue: 1 }, 'I'],
    [40, { rqd: 40, jnId: '', jnValue: 1, jrId: 'smooth_planar', jrValue: 1 }, 'II'],
    [10.0000001, { rqd: 10.0000001, jnId: '', jnValue: 1, jrId: 'smooth_planar', jrValue: 1 }, 'II'],
    [10, { rqd: 10, jnId: '', jnValue: 1, jrId: 'smooth_planar', jrValue: 1 }, 'III'],
    [1.0000001, { rqd: 20.000002, jnId: 'crushed', jnValue: 20, jrId: 'smooth_planar', jrValue: 1 }, 'III'],
    [1, { rqd: 20, jnId: 'crushed', jnValue: 20, jrId: 'smooth_planar', jrValue: 1 }, 'IV'],
    [0.1, { rqd: 10, jnId: 'crushed', jnValue: 20, jrId: 'slickensided_planar', jrValue: 0.5, jaId: 'banded_silty_sandy_clay', jaValue: 5, srfId: 'high_stress_stable', srfValue: 0.5 }, 'IV'],
    [0.0999999, { rqd: 10, jnId: 'crushed', jnValue: 20, jrId: 'slickensided_planar', jrValue: 0.5, jaId: 'banded_silty_sandy_clay', jaValue: 5, srfId: 'high_stress_stable', srfValue: 0.5000005 }, 'V'],
  ] satisfies Array<[number, Partial<QFormState>, string]>)('keeps Q = %s on the conservative side of the five-grade boundary', (_q, partial, grade) => {
    const result = calculateQ(complete(partial))
    expect(result.grade.id).toBe(grade)
  })

  it('defines nine lower-inclusive quality bands independently from the five grades', () => {
    expect(Q_QUALITY_BANDS).toHaveLength(9)
    expect(Q_QUALITY_BANDS.map((band) => band.label.zh)).toEqual([
      '异常差',
      '极差',
      '很差',
      '差',
      '一般',
      '好',
      '很好',
      '极好',
      '异常好',
    ])
    expect(qualityFromQ(0.009999)?.label.zh).toBe('异常差')
    expect(qualityFromQ(0.01)?.label.zh).toBe('极差')
    expect(qualityFromQ(0.1)?.label.zh).toBe('很差')
    expect(qualityFromQ(1)?.label.zh).toBe('差')
    expect(qualityFromQ(4)?.label.zh).toBe('一般')
    expect(qualityFromQ(10)?.label.zh).toBe('好')
    expect(qualityFromQ(40)?.label.zh).toBe('很好')
    expect(qualityFromQ(100)?.label.zh).toBe('极好')
    expect(qualityFromQ(400)?.label.zh).toBe('异常好')
    expect(qualityFromQ(1000)?.label.zh).toBe('异常好')
    expect(qualityFromQ(0.000999)).toBeNull()
    expect(qualityFromQ(1000.001)).toBeNull()
  })

  it('formats Q without rounding a value onto the other side of a classification boundary', () => {
    expect(Number(formatQValue(40.0000001))).toBeGreaterThan(40)
    expect(Number(formatQValue(39.9999999))).toBeLessThan(40)
    expect(Number(formatQValue(0.100000001))).toBeGreaterThanOrEqual(0.1)
    expect(Number(formatQValue(0.099999999))).toBeLessThan(0.1)
  })

  it('preserves full Q precision in the result', () => {
    const result = calculateQ(complete({ rqd: 10, jnId: 'one_set_random', jnValue: 3, jrId: 'smooth_planar', jrValue: 1, srfId: 'multiple_clay_free_shear', srfValue: 7.5 }))
    expect(result.q).toBe((10 / 3) * (1 / 7.5))
    expect(result.q).not.toBe(0.444444)
  })

  it('screens only the two sides and boundary of the unsupported-dimension curve', () => {
    const q = 60
    const maximum = maximumUnsupportedDimension(q)
    const atBoundary = calculateQ(complete({ span: maximum, esrId: 'major_civil', esrValue: 1 }))
    const below = calculateQ(complete({ span: maximum * 0.9, esrId: 'major_civil', esrValue: 1 }))
    const above = calculateQ(complete({ span: maximum * 1.1, esrId: 'major_civil', esrValue: 1 }))

    expect(atBoundary.support).toMatchObject({ status: 'boundary', maximumUnsupportedDimension: maximum, demandRatio: 1 })
    expect(below.support?.status).toBe('not-required')
    expect(above.support?.status).toBe('required')
    expect(atBoundary.support).not.toHaveProperty('category')
  })

  it('does not make an automatic support decision outside the schematic chart bounds', () => {
    const result = calculateQ(complete({ span: 101, esrId: 'major_civil', esrValue: 1 }))
    expect(result.support?.status).toBe('outside-chart')
    expect(result.support?.sourceNote.zh).toContain('经验无支护极限')
    expect(result.support?.sourceNote.en).toContain('empirical unsupported limit')
    expect(result.support?.sourceNote.en).not.toContain('2025')
  })

  it('keeps Q valid but omits support when only span or ESR is supplied', () => {
    const spanOnly = complete({ span: 10 })
    const esrOnly = complete({ esrId: 'major_civil', esrValue: 1 })

    expect(validateQState(spanOnly).some((item) => item.code === 'missing_esr' && item.severity === 'warning')).toBe(true)
    expect(validateQState(esrOnly).some((item) => item.code === 'missing_span' && item.severity === 'warning')).toBe(true)
    expect(calculateQ(spanOnly).support).toBeNull()
    expect(calculateQ(esrOnly).support).toBeNull()
  })

  it('rejects non-positive support inputs', () => {
    expect(validateQState(complete({ span: 0 })).some((item) => item.field === 'span' && item.severity === 'error')).toBe(true)
    expect(validateQState(complete({ esrId: 'major_civil', esrValue: 0 })).some((item) => item.field === 'esrValue' && item.severity === 'error')).toBe(true)
  })

  it('includes the critical permanent ESR option from table 3.7', () => {
    expect(Q_ESR_OPTIONS.find((option) => option.id === 'critical_permanent')).toMatchObject({ range: { min: 0.5, max: 0.5 } })
  })

  it('provides three factual ratio explanations from the calculated data', () => {
    const result = calculateQ(complete())
    const analysis = getQAnalysis(result)
    expect(analysis.map((item) => item.key)).toEqual(['blockSize', 'jointShearStrength', 'activeStress'])
    expect(analysis.map((item) => item.value)).toEqual(['20', '3', '1'])
    expect(analysis[0].description.zh).toContain('80 / 4')
    expect(analysis[1].description.zh).toContain('3 / 1')
    expect(analysis[2].description.zh).toContain('1 / 1')
  })

  it('exports five-grade results and analysis without nine-band descriptions', () => {
    const adapted = qAdapter.calculate(complete() as unknown as Record<string, unknown>)
    expect(qAdapter.name).toBe('Q分级')
    expect(qAdapter.nameEn).toBe('Q classification')
    expect(adapted.summary).not.toContain('很好')
    expect(adapted.metrics.some((item) => item.key === 'quality')).toBe(false)
    expect(adapted.metrics.filter((item) => ['blockSize', 'jointShearStrength', 'activeStress'].includes(item.key))).toHaveLength(3)
    const described = qAdapter.describe(complete() as unknown as Record<string, unknown>, adapted)
    expect(described.find((item) => item.key === 'quality')).toBeUndefined()
    expect(described.find((item) => item.key === 'blockSize')?.score).toContain('80 / 4')
    expect(Q_STANDARD.title).toEqual({ zh: 'Q分级', en: 'Q classification' })
  })
})
