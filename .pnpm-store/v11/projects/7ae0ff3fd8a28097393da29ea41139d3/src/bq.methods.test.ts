import { describe, expect, it } from 'vitest'
import {
  applyBqLimitations,
  calculateBq,
  createInitialBqState,
  formatBqPointList,
  foundationGradeFromF0,
  assessGroundwaterK1,
  assessSlopeK4,
  estimateKvFromJv,
  interpolateKvFromJv,
  estimateKvFromVelocities,
  estimateRcFromIs50,
} from './methods/bq'
import { normalizeImportedCase } from './utils/rockmassCaseFile'

describe('BQ domain calculations', () => {
  it('estimates saturated UCS Rc from the 50 mm point-load index', () => {
    expect(estimateRcFromIs50(1)).toBeCloseTo(22.82, 10)
    expect(estimateRcFromIs50(4)).toBeCloseTo(22.82 * 4 ** 0.75, 10)
  })

  it('estimates Kv from rock-mass and intact-core wave velocities', () => {
    expect(estimateKvFromVelocities(4, 5)).toBeCloseTo(0.64, 10)
  })

  it('returns the standard Kv interval midpoint for each Jv boundary', () => {
    expect(estimateKvFromJv(2.99)).toMatchObject({ min: 0.75, max: 1, value: 0.875 })
    expect(estimateKvFromJv(3)).toMatchObject({ min: 0.55, max: 0.75, value: 0.65 })
    expect(estimateKvFromJv(10)).toMatchObject({ min: 0.35, max: 0.55, value: 0.45 })
    expect(estimateKvFromJv(20)).toMatchObject({ min: 0.15, max: 0.35, value: 0.25 })
    expect(estimateKvFromJv(35)).toMatchObject({ min: 0, max: 0.15, value: 0.075 })
  })

  it('interpolates typed Jv values between standard boundaries', () => {
    expect(interpolateKvFromJv(6)?.value).toBeCloseTo(0.6642857, 5)
    expect(interpolateKvFromJv(10)?.value).toBeCloseTo(0.55, 5)
    expect(interpolateKvFromJv(40)?.value).toBeCloseTo(0.15, 5)
  })

  it('classifies groundwater from p/Q and uses the selected range upper bound', () => {
    expect(assessGroundwaterK1(0.1, null, 'IV')).toMatchObject({ optionId: 'damp_or_drip', value: 0.3 })
    expect(assessGroundwaterK1(0.3, null, 'IV')?.optionId).toBe('rain_or_linear_flow')
    expect(assessGroundwaterK1(0.3, null, 'IV')?.value).toBeCloseTo(0.6, 10)
    expect(assessGroundwaterK1(null, 125, 'V')).toMatchObject({ optionId: 'rain_or_linear_flow', value: 0.9 })
    expect(assessGroundwaterK1(0.6, null, 'V')).toMatchObject({ optionId: 'surging', value: 1 })
  })

  it('calculates basic BQ with the 250Kv coefficient', () => {
    const state = { ...createInitialBqState(), rc: 50, kv: 0.5 }
    const result = calculateBq(state)

    expect(result.basicBq).toBeCloseTo(375, 10)
    expect(result.formula.zh).toContain('250Kv')
  })

  it('classifies foundation bearing capacity with inclusive upper boundaries', () => {
    expect(foundationGradeFromF0(7).id).toBe('II')
    expect(foundationGradeFromF0(4).id).toBe('III')
    expect(foundationGradeFromF0(2).id).toBe('IV')
    expect(foundationGradeFromF0(0.5).id).toBe('V')
  })

  it('takes the selected qualitative class as the foundation result and reports the f0 range', () => {
    const result = calculateBq({
      ...createInitialBqState(),
      mode: 'foundation',
      rc: 50,
      kv: 0.5,
      foundationGradeId: 'IV',
    })
    expect(result.foundationGrade?.id).toBe('IV')
    expect(result.foundationGrade?.displayRange).toBe('0.5＜f₀≤2.0')
    expect(result.grade.id).toBe('IV')
    expect(result.basicBq).toBeCloseTo(375, 10)
  })

  it('still computes basic BQ when Rc and Kv are present but correction is incomplete', () => {
    const foundation = calculateBq({
      ...createInitialBqState(),
      mode: 'foundation',
      rc: 50,
      kv: 0.5,
    })
    expect(foundation.basicBq).toBeCloseTo(375, 10)
    expect(foundation.foundationGrade).toBeNull()

    const underground = calculateBq({
      ...createInitialBqState(),
      mode: 'underground',
      rc: 50,
      kv: 0.5,
      k1Value: 2,
    })
    expect(underground.basicBq).toBeCloseTo(375, 10)
  })

  it('classifies foundation from a recorded f0 value with inclusive upper bounds', () => {
    const result = calculateBq({
      ...createInitialBqState(),
      mode: 'foundation',
      rc: 50,
      kv: 0.5,
      foundationF0: 2,
    })
    expect(result.foundationGrade?.id).toBe('IV')
    expect(result.foundationGrade?.tableCell).toBe('0.5＜f₀≤2.0')
  })

  it('applies underground K1, K2 and K3 corrections to basic BQ', () => {
    const result = calculateBq({
      ...createInitialBqState(),
      mode: 'underground',
      rc: 50,
      kv: 0.5,
      undergroundWaterId: 'damp_or_drip',
      k1Value: 0.1,
      undergroundOrientationId: 'axis_angle_lt30_dip_30_75',
      k2Value: 0.5,
      undergroundStressId: 'ratio_4_7',
      k3Value: 0.5,
    })

    expect(result.corrections.k1?.value).toBe(0.1)
    expect(result.corrections.k2?.value).toBe(0.5)
    expect(result.corrections.k3?.value).toBe(0.5)
    expect(result.corrections.deduction).toBeCloseTo(110, 10)
    expect(result.engineeringBq).toBeCloseTo(265, 10)
    expect(result.grade.id).toBe('IV')
  })

  it('uses configured defaults when underground correction coefficients are omitted', () => {
    const result = calculateBq({
      ...createInitialBqState(),
      mode: 'underground',
      rc: 50,
      kv: 0.5,
      undergroundWaterId: 'damp_or_drip',
      undergroundOrientationId: 'axis_angle_lt30_dip_30_75',
      undergroundStressId: 'ratio_4_7',
      k1Value: null,
      k2Value: null,
      k3Value: null,
    })
    expect(result.corrections.k1?.value).toBe(0.1)
    expect(result.corrections.k2?.value).toBe(0.6)
    expect(result.corrections.k3?.value).toBe(0.5)
    expect(result.corrections.deduction).toBe(120)
    expect(result.engineeringBq).toBe(result.basicBq - 120)
    expect(result.warnings).toHaveLength(0)
  })

  it('uses K1/K2 upper bounds and K3 lower bounds when values are omitted', () => {
    const result = calculateBq({
      ...createInitialBqState(), mode: 'underground', rc: 50, kv: 0.5,
      undergroundWaterId: 'rain_or_linear_flow',
      undergroundOrientationId: 'axis_angle_lt30_dip_30_75',
      undergroundStressId: 'ratio_4_7',
      k1Value: null, k2Value: null, k3Value: null,
    })
    expect(result.corrections.k1?.value).toBe(0.3)
    expect(result.corrections.k2?.value).toBe(0.6)
    expect(result.corrections.k3?.value).toBe(0.5)
  })

  it('records and classifies the underground stress ratio input', () => {
    const result = calculateBq({
      ...createInitialBqState(), mode: 'underground', rc: 50, kv: 0.5,
      undergroundStressId: 'ratio_lt4', undergroundStressRatio: 3.5,
      k3Value: null,
    })
    expect(result.corrections.k3?.value).toBe(1)
  })

  it('classifies slope K4 from pw/H and uses the selected range upper bound', () => {
    expect(assessSlopeK4(4, 40, 'III')).toMatchObject({ optionId: 'damp_or_drip', value: 0.1 })
    expect(assessSlopeK4(8, 20, 'III')?.optionId).toBe('linear_flow')
    expect(assessSlopeK4(8, 20, 'III')?.value).toBeCloseTo(0.3, 10)
    expect(assessSlopeK4(30, 40, 'V')).toMatchObject({ optionId: 'surging', value: 1 })
  })

  it('applies slope K4, λ and computed K5 corrections to basic BQ', () => {
    const result = calculateBq({
      ...createInitialBqState(),
      mode: 'slope',
      rc: 50,
      kv: 0.5,
      slopeWaterId: 'damp_or_drip',
      k4Value: 0.1,
      slopeStructureTypeId: 'bedding_or_persistent_joint',
      lambdaValue: 0.85,
      slopeF1Id: 'le5',
      slopeF2Id: 'ge45',
      slopeF3Id: 'le_minus10',
    })
    expect(result.corrections.k4?.value).toBe(0.1)
    expect(result.corrections.lambda?.value).toBe(0.85)
    expect(result.corrections.slopeFactors?.k5).toBeCloseTo(2.5, 10)
    expect(result.corrections.deduction).toBeCloseTo(222.5, 10)
    expect(result.engineeringBq).toBeCloseTo(152.5, 10)
  })

  it('keeps slope K5 at 0 until F1, F2 and F3 are selected', () => {
    const result = calculateBq({
      ...createInitialBqState(),
      mode: 'slope',
      rc: 50,
      kv: 0.5,
      slopeStructureTypeId: 'fault_or_interlayer_mud',
      lambdaValue: 1,
    })
    expect(result.corrections.slopeFactors?.k5).toBe(0)
    expect(result.engineeringBq).toBe(result.basicBq)
  })

  it('lists the preferred final BQ result for point management', () => {
    expect(formatBqPointList({ ...createInitialBqState(), rc: 50, kv: 0.5 })).toEqual([
      { label: 'BQ', value: '375', grade: 'III 级' },
    ])
    expect(formatBqPointList({
      ...createInitialBqState(),
      mode: 'foundation',
      rc: 50,
      kv: 0.5,
    })).toEqual([
      { label: 'BQ', value: '375', grade: 'III 级' },
    ])
    expect(formatBqPointList({
      ...createInitialBqState(),
      mode: 'underground',
      correctionStep: 4,
      rc: 50,
      kv: 0.5,
      undergroundWaterId: 'damp_or_drip',
      k1Value: 0.1,
      undergroundOrientationId: 'axis_angle_lt30_dip_30_75',
      k2Value: 0.5,
      undergroundStressId: 'ratio_4_7',
      k3Value: 0.5,
    })).toEqual([
      { label: '[BQ]', value: '265', grade: 'IV 级' },
    ])
    expect(formatBqPointList({
      ...createInitialBqState(),
      mode: 'foundation',
      rc: 50,
      kv: 0.5,
      foundationGradeId: 'IV',
      foundationF0: 2,
    })).toEqual([
      { label: 'BQ', value: '375', grade: 'III 级' },
    ])
  })

  it('limits Rc only when it is above 90Kv + 30', () => {
    const limited = applyBqLimitations(150, 0.5)
    expect(limited.rule).toBe('rc_limit')
    expect(limited.applied).toBe(true)
    expect(limited.after).toEqual({ rc: 75, kv: 0.5 })

    const atBoundary = applyBqLimitations(75, 0.5)
    expect(atBoundary.applied).toBe(false)
    expect(atBoundary.after).toEqual({ rc: 75, kv: 0.5 })
  })

  it('limits Kv only when it is above 0.04Rc + 0.4', () => {
    const limited = applyBqLimitations(10, 0.9)
    expect(limited.rule).toBe('kv_limit')
    expect(limited.applied).toBe(true)
    expect(limited.after).toEqual({ rc: 10, kv: 0.8 })

    const atBoundary = applyBqLimitations(10, 0.8)
    expect(atBoundary.applied).toBe(false)
    expect(atBoundary.after).toEqual({ rc: 10, kv: 0.8 })
  })

  it('accepts v2 BQ case inputs created before correctionStep was persisted', () => {
    const oldInput = { ...createInitialBqState(), rc: 50, kv: 0.5 } as Record<string, unknown>
    delete oldInput.correctionStep
    const imported = normalizeImportedCase({
      type: 'cinf-rockmass-case',
      version: 2,
      exportedAt: '2026-08-27T00:00:00.000Z',
      case: {
        id: 'case-1',
        name: 'Legacy BQ',
        methodId: 'bq',
        schemaVersion: 2,
        standardId: 'gbt-50218-2014',
        createdAt: '2026-08-27T00:00:00.000Z',
        updatedAt: '2026-08-27T00:00:00.000Z',
        points: [{
          id: 'point-1',
          name: 'P1',
          methodId: 'bq',
          standardId: 'gbt-50218-2014',
          inputVersion: 1,
          createdAt: '2026-08-27T00:00:00.000Z',
          updatedAt: '2026-08-27T00:00:00.000Z',
          input: oldInput,
        }],
      },
    }, 'bq')
    expect(imported?.points[0].input).toEqual(oldInput)
  })
})
