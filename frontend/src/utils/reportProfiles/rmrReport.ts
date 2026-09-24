import { RMR89_STANDARD } from '../../config/rmrTables'
import type { RockMassCaseRecord } from '../../types/rockmassCase'
import type { CalculationInputRow, CalculationPointBlock } from '../reportDocxTemplate'
import { describeRmrForm, initialRmrFormState } from '../rmrCalc'
import { buildCaseSummary } from '../rmrCaseSummary'

export const RMR_REPORT_USAGE = [
  'RMR = A1 + A2 + A3 + A4 + A5 + A6。A1 为完整岩石强度，A2 为岩石质量指标 RQD，A3 为结构面间距，A4 为结构面条件，A5 为地下水，A6 为结构面方向修正。',
  '等级按 81～100、61～80、41～60、21～40、不大于 20 划分。参数表只记录已经选择的分项及其评分。自稳跨度、自稳时间、粘聚力、内摩擦角和支护指南写在评价中。',
  '支护指南适用于跨度 10 m 的马蹄形钻爆隧道，且竖向应力小于 25 MPa。超出该条件时不得直接套用。',
]

export const RMR_REPORT_CLOSING = `本计算书依据 ${RMR89_STANDARD.source} 编制，采用 1989 版评分表。支护指南的适用条件见方法说明。计算结果仅供工程分析参考，实际工程须结合现行规范、现场条件与专业判断综合决策。生成软件按各点位已保存的输入重算，不另列未选择的评分档。`

function inputOf(description: { title: string; choice: string; inputValue?: string; score: number | null }): CalculationInputRow | null {
  if (description.score == null && description.choice === '未选择' && !description.inputValue) return null
  return {
    parameter: description.title,
    entered: description.inputValue ? `${description.inputValue}；${description.choice}` : description.choice,
    adopted: description.score == null ? '—' : String(description.score),
  }
}

export function buildRmrReportPoints(record: RockMassCaseRecord): CalculationPointBlock[] {
  return buildCaseSummary(record).rows.map((row) => {
    const form = row.point.rmr ?? initialRmrFormState()
    const descriptions = describeRmrForm(form, 'zh')
    const inputs = descriptions.map(inputOf).filter((item): item is CalculationInputRow => item != null)
    if (row.needsReview) {
      return {
        name: row.point.name,
        note: row.point.note,
        oreType: row.point.oreType,
        resultText: '待复核',
        gradeText: '—',
        status: '待复核',
        inputs,
        evaluation: ['该点位由旧版项目迁移，需重新打开并确认后才形成 RMR 结论。'],
      }
    }
    const info = row.scores.classInfo
    if (!info || row.scores.rmr == null) {
      const missing = 6 - row.scores.completedCount
      return {
        name: row.point.name,
        note: row.point.note,
        oreType: row.point.oreType,
        resultText: '—',
        gradeText: '—',
        status: `待补充 ${missing} 项`,
        inputs,
        evaluation: [`该点位尚有 ${missing} 项参数未选择，未形成分级结论。`],
      }
    }
    const sum = descriptions.map((item) => item.score).join(' + ')
    return {
      name: row.point.name,
      note: row.point.note,
      oreType: row.point.oreType,
      resultText: `RMR = ${row.scores.rmr}`,
      gradeText: `${info.label}（${info.quality}）`,
      status: '有效',
      inputs,
      evaluation: [
        `RMR = ${sum} = ${row.scores.rmr}。岩体质量等级：${info.label}（${info.quality}），评分区间 ${info.rmrRange}。`,
        `岩体描述：${info.description}。平均自稳跨度 ${info.span}，自稳时间 ${info.standUpTime}。`,
        `岩体粘聚力 ${info.cohesion}，内摩擦角 ${info.friction}。`,
        `开挖方式：${info.excavation}。锚杆（φ20 mm，全长锚固）：${info.bolt}。喷射混凝土：${info.shotcrete}。钢支架：${info.steelArch}。`,
        '上述支护指南适用于跨度 10 m 的马蹄形钻爆隧道，且竖向应力小于 25 MPa。',
      ],
    }
  })
}
