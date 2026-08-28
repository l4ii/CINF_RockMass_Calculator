import type { AnyClassificationAdapter } from '../types'
import {
  MRMR_STANDARD,
  calculateMrmr,
  createInitialMrmrState,
  describeMrmr,
  normalizeMrmrState,
  validateMrmrState,
} from '../mrmr'

export const mrmrAdapter: AnyClassificationAdapter = {
  id: 'mrmr',
  name: 'MRMR采矿岩体分级',
  nameEn: 'MRMR Mining Rock Mass Rating',
  standard: MRMR_STANDARD,
  inputVersion: 3,
  createInitialForm: () => createInitialMrmrState() as unknown as Record<string, unknown>,
  normalize: (raw) => normalizeMrmrState(raw) as unknown as Record<string, unknown>,
  validate: (form) => validateMrmrState(form),
  calculate: (form) => {
    const result = calculateMrmr(form)
    return {
      value: result.mrmr,
      displayValue: `MRMR = ${Number(result.mrmr.toFixed(1))}`,
      grade: result.grade.label,
      gradeEn: result.grade.labelEn,
      summary: result.formula,
      summaryEn: `MRMR (IRMR × controlling factor) = ${result.irmr.toFixed(1)} × ${result.controllingAdjustment.factor.toFixed(2)} (${result.controllingAdjustment.labelEn}) = ${result.mrmr.toFixed(1)}`,
      metrics: [
        { key: 'rbs', label: '岩块强度 RBS', labelEn: 'Rock-block strength RBS', value: `${Number(result.rbsMpa.toFixed(1))} MPa → ${Number(result.rbsRating.toFixed(1))}/25` },
        { key: 'jointSpacing', label: '节理间距评分 JS', labelEn: 'Joint-spacing rating JS', value: `${Number(result.jointSpacingRating.toFixed(1))}/35` },
        { key: 'jointCondition', label: '结构面条件评分 JC', labelEn: 'Joint-condition rating JC', value: `${Number(result.jointConditionRating.toFixed(1))}/40` },
        { key: 'irmr', label: 'IRMR', labelEn: 'IRMR', value: Number(result.irmr.toFixed(1)).toString() },
        { key: 'adjustments', label: '候选控制修正', labelEn: 'Adjustment candidates', value: result.adjustmentCandidates.map((item) => `${item.label} ${item.factor}`).join('；'), valueEn: result.adjustmentCandidates.map((item) => `${item.labelEn} ${item.factor}`).join('; ') },
        { key: 'controlling', label: '采用的控制因素', labelEn: 'Controlling factor used', value: `${result.controllingAdjustment.label} · ${result.controllingAdjustment.factor}`, valueEn: `${result.controllingAdjustment.labelEn} · ${result.controllingAdjustment.factor}` },
      ],
      warnings: [],
      warningsEn: [],
    }
  },
  describe: (form) => describeMrmr(form),
}
