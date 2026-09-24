import type { AnyClassificationAdapter } from '../methods/types'
import type { RockMassCaseRecord } from '../types/rockmassCase'
import { APP_NAME_ZH, APP_ORG_NAME_ZH } from '../constants/appCopy'
import { sanitizeFileNamePart } from './rockmassCaseFile'
import { saveFile, type SaveFileResult } from './saveFile'
import { buildCalculationBookBlob, type CalculationPointBlock } from './reportDocxTemplate'
import { BQ_REPORT_USAGE, buildBqReportPoints } from './reportProfiles/bqReport'
import { GSI_REPORT_USAGE, buildGsiReportPoints } from './reportProfiles/gsiReport'
import { Q_REPORT_USAGE, buildQReportPoints } from './reportProfiles/qReport'
import { RQD_REPORT_USAGE, buildRqdReportPoints } from './reportProfiles/rqdReport'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function genericPoints(record: RockMassCaseRecord, adapter: AnyClassificationAdapter): CalculationPointBlock[] {
  return record.points.map((point) => {
    const form = adapter.normalize(point.input)
    const issues = adapter.validate(form)
    const result = issues.length === 0 ? adapter.calculate(form) : null
    const descriptions = adapter.describe(form, result)
    return {
      name: point.name,
      note: point.note,
      oreType: point.oreType,
      resultText: result?.displayValue ?? '—',
      gradeText: result?.grade ?? '—',
      status: issues.length === 0 ? '有效' : `待补充 ${issues.length} 项`,
      inputs: descriptions.map((item) => ({
        parameter: item.label,
        entered: item.value,
        adopted: item.score ?? '—',
      })),
      evaluation: result
        ? [`${result.summary}最终结果 ${result.displayValue}，判定为 ${result.grade}。`, ...result.warnings.map((warning) => `注意：${warning}`)]
        : [`该点位尚有 ${issues.length} 项输入需要补充，未形成工程结论。`],
    }
  })
}

async function pointsFor(record: RockMassCaseRecord, adapter: AnyClassificationAdapter) {
  if (adapter.id === 'q') return buildQReportPoints(record)
  if (adapter.id === 'rqd') return buildRqdReportPoints(record)
  if (adapter.id === 'bq') return buildBqReportPoints(record)
  if (adapter.id === 'gsi') return buildGsiReportPoints(record)
  return genericPoints(record, adapter)
}

function usageFor(adapter: AnyClassificationAdapter) {
  if (adapter.id === 'q') return Q_REPORT_USAGE
  if (adapter.id === 'rqd') return RQD_REPORT_USAGE
  if (adapter.id === 'bq') return BQ_REPORT_USAGE
  if (adapter.id === 'gsi') return GSI_REPORT_USAGE
  return [`本计算书按 ${adapter.name} 整理已经填写的参数与计算结果。未单独编制该方法的参数细表。`]
}

export function buildClassificationReportFileName(record: RockMassCaseRecord, adapter: AnyClassificationAdapter) {
  return `${sanitizeFileNamePart(record.name)}_${adapter.name}计算书.docx`
}

export async function buildClassificationReportBlob(record: RockMassCaseRecord, adapter: AnyClassificationAdapter): Promise<Blob> {
  const standardLine = `${adapter.standard.title}（${adapter.standard.edition}）`
  return buildCalculationBookBlob({
    record,
    methodName: adapter.name,
    standardLine,
    usage: usageFor(adapter),
    points: await pointsFor(record, adapter),
    closing: `本计算书按 ${standardLine} 生成。结果用于工程分析，最终设计应结合现场条件和专业复核。生成软件：${APP_NAME_ZH}（${APP_ORG_NAME_ZH}）。`,
  })
}

export async function exportClassificationReport(record: RockMassCaseRecord, adapter: AnyClassificationAdapter): Promise<SaveFileResult> {
  const blob = await buildClassificationReportBlob(record, adapter)
  return saveFile(buildClassificationReportFileName(record, adapter), await blob.arrayBuffer(), {
    title: '导出 Word 报告',
    filters: [{ name: 'Word 文档', extensions: ['docx'] }],
    mimeType: DOCX_MIME,
  })
}
