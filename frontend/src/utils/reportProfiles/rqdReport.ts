import { calculateRqd, classifyRqd, normalizeRqdState, validateRqdState, RQD_CLASSES } from '../../methods/rqd'
import type { RockMassCaseRecord } from '../../types/rockmassCase'
import type { CalculationPointBlock } from '../reportDocxTemplate'

export const RQD_REPORT_USAGE = [
  'RQD =（长度不小于 10 cm 的岩芯累计长度 / 钻孔总长）× 100%。沿岩芯轴线量测完整段；钻进造成的机械折断不计入裂隙，短于 10 cm 的碎块不计入分子。',
  '等级按 Deere 等（1964）划分：90%～100% 极好，75%～<90% 好，50%～<75% 中等，25%～<50% 差，0%～<25% 很差。参数表只记录钻孔总长和符合长度的岩芯累计长度，RQD 与等级写在评价中。',
]

function rangeOf(id: string) {
  const grade = RQD_CLASSES.find((item) => item.id === id)
  if (!grade) return '—'
  return grade.includeMax ? `${grade.min}%～${grade.max}%` : `${grade.min}%～<${grade.max}%`
}

export function buildRqdReportPoints(record: RockMassCaseRecord): CalculationPointBlock[] {
  return record.points.map((point) => {
    const state = normalizeRqdState(point.input)
    const issues = validateRqdState(state)
    const inputs = [
      state.coreRunLength == null ? null : { parameter: '钻孔总长', entered: `${state.coreRunLength} m`, adopted: `${state.coreRunLength} m` },
      state.soundCoreLength == null ? null : { parameter: '长度不小于 10 cm 的岩芯累计长度', entered: `${state.soundCoreLength} m`, adopted: `${state.soundCoreLength} m` },
    ].filter((row): row is NonNullable<typeof row> => row != null)
    if (issues.length > 0 || state.coreRunLength == null || state.soundCoreLength == null) {
      return {
        name: point.name,
        note: point.note,
        oreType: point.oreType,
        resultText: '—',
        gradeText: '—',
        status: `待补充 ${Math.max(issues.length, 1)} 项`,
        inputs,
        evaluation: [`该点位尚有 ${issues.length || 1} 项输入需要补充，未形成工程结论。${issues.map((issue) => issue.message).join('')}`],
      }
    }
    const result = calculateRqd(state)
    const grade = classifyRqd(result.rqd)
    const shown = Number(result.rqd.toFixed(2)).toString()
    return {
      name: point.name,
      note: point.note,
      oreType: point.oreType,
      resultText: `RQD = ${shown}%`,
      gradeText: grade.quality,
      status: '有效',
      inputs,
      evaluation: [
        `RQD = ${state.soundCoreLength} / ${state.coreRunLength} × 100% = ${shown}%。`,
        `岩体质量等级：${grade.quality}，区间 ${rangeOf(grade.id)}。`,
      ],
    }
  })
}
