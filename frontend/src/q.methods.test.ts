import { describe, expect, it } from 'vitest'
import { qAdapter } from './methods/adapters/qAdapter'
import {
  calculateQ,
  createInitialQState,
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
})
