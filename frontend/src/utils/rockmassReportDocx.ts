/** RMR 案例 Word 报告。版式与其他分级共用计算书骨架。 */

import { RMR89_STANDARD } from '../config/rmrTables'
import type { RockMassCaseRecord } from '../types/rockmassCase'
import { sanitizeFileNamePart } from './rockmassCaseFile'
import { buildCalculationBookBlob } from './reportDocxTemplate'
import { RMR_REPORT_CLOSING, RMR_REPORT_USAGE, buildRmrReportPoints } from './reportProfiles/rmrReport'
import { saveFile, type SaveFileResult } from './saveFile'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export function buildReportFileName(record: RockMassCaseRecord) {
  return `${sanitizeFileNamePart(record.name)}_RMR分级计算书.docx`
}

export async function buildCaseReportBlob(record: RockMassCaseRecord): Promise<Blob> {
  return buildCalculationBookBlob({
    record,
    methodName: 'RMR 岩体地质力学分级',
    standardLine: `${RMR89_STANDARD.title}（${RMR89_STANDARD.edition}）`,
    usage: RMR_REPORT_USAGE,
    points: buildRmrReportPoints(record),
    closing: RMR_REPORT_CLOSING,
  })
}

export async function exportCaseReport(record: RockMassCaseRecord): Promise<SaveFileResult> {
  const blob = await buildCaseReportBlob(record)
  return saveFile(buildReportFileName(record), await blob.arrayBuffer(), {
    title: '导出 Word 报告',
    filters: [{ name: 'Word 文档', extensions: ['docx'] }, { name: '所有文件', extensions: ['*'] }],
    mimeType: DOCX_MIME,
  })
}
