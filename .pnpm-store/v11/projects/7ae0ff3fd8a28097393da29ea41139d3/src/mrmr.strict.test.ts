import { describe, expect, it } from 'vitest'
import { buildMrmrHandoffFromRmr, calculateMrmr, createInitialMrmrState, validateMrmrState } from './methods/mrmr'
import { initialRmrFormState } from './utils/rmrCalc'

describe('MRMR strict calculation', () => {
  const valid = { ...createInitialMrmrState(), applicability: { scenarioId: 'underground_roadway' as const, jointedRockMass: true, irsBasisConfirmed: true, jointSpacingBasisConfirmed: true, jointConditionBasisConfirmed: true, groundwaterBasisConfirmed: true, miningEnvironmentBasisConfirmed: true }, irsMpa: 100, sizeAdjustmentPercent: 80, jointSpacingM: 0.5, jointSetCount: '2' as const, jointConditionId: 'small_rough_stepped', weatheringConditionId: 'fresh', weatheringExposureId: '1y' as const, miningMethodId: 'none', stressId: 'neutral', blastingId: 'boring', waterId: 'dry', waterFactorPercent: 100 }

  it('blocks a non-jointed or non-mining setting before calculation', () => {
    const issues = validateMrmrState({ ...valid, applicability: { ...valid.applicability, jointedRockMass: false } })
    expect(issues.some((issue) => issue.field === 'applicability')).toBe(true)
    expect(() => calculateMrmr({ ...valid, applicability: { ...valid.applicability, jointedRockMass: false } })).toThrow(/适用性/)
  })

  it('uses the controlling-factor formula after IRMR', () => {
    const result = calculateMrmr(valid)
    expect(result.mrmr).toBeCloseTo(result.irmr * result.controllingAdjustment.factor)
    expect(result.adjustmentCandidates.map((item) => item.id)).toEqual(['weathering', 'mining_method', 'stress', 'blasting', 'water'])
  })

  it('carries direct RMR raw values without converting scores', () => {
    const rmr = { ...initialRmrFormState(), a1Mode: 'ucs' as const, a1UcsValue: 120, a3SpacingValue: 100, a5Criterion: 'inflow' as const, a5InflowValue: 50 }
    const handoff = buildMrmrHandoffFromRmr(rmr, { caseName: '工程', pointName: 'P1' })
    expect(handoff.form.irsMpa).toBe(120)
    expect(handoff.form.jointSpacingM).toBe(1)
    expect(handoff.form.jointConditionId).toBeNull()
    expect(handoff.form.waterId).toBeNull()
    expect(handoff.form.source?.waterReference).toMatchObject({ criterion: 'inflow', value: 50 })
  })
})
