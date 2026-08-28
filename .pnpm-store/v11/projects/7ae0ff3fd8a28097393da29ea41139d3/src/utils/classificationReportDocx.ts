import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import type { AnyClassificationAdapter } from '../methods/types'
import type { RockMassCaseRecord } from '../types/rockmassCase'
import { APP_NAME_ZH, APP_ORG_NAME_ZH } from '../constants/appCopy'
import { sanitizeFileNamePart } from './rockmassCaseFile'
import { formatDateTimeDisplay } from './rockmassCaseStore'
import { saveFile, type SaveFileResult } from './saveFile'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function paragraph(value: string, bold = false) {
  return new Paragraph({ children: [new TextRun({ text: value, bold })] })
}

function cell(value: string, bold = false) {
  return new TableCell({
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: value, bold })] })],
  })
}

function table(rows: TableRow[]) {
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })
}

function header(values: string[]) {
  return new TableRow({ tableHeader: true, children: values.map((value) => cell(value, true)) })
}

export function buildClassificationReportFileName(record: RockMassCaseRecord, adapter: AnyClassificationAdapter) {
  return `${sanitizeFileNamePart(record.name)}_${adapter.name}计算书.docx`
}

export async function buildClassificationReportBlob(
  record: RockMassCaseRecord,
  adapter: AnyClassificationAdapter
): Promise<Blob> {
  const rows = record.points.map((point, index) => {
    const form = adapter.normalize(point.input)
    const issues = adapter.validate(form)
    const result = issues.length === 0 ? adapter.calculate(form) : null
    return { point, index, form, result, issues, descriptions: adapter.describe(form, result) }
  })
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: record.name, bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `${adapter.name}工程计算书`, bold: true })],
    }),
    paragraph(''),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '一、工程信息', bold: true })] }),
    table([
      header(['项目', '内容']),
      new TableRow({ children: [cell('工程名称', true), cell(record.engineering || '—')] }),
      new TableRow({ children: [cell('工程部位', true), cell(record.location || '—')] }),
      new TableRow({ children: [cell('备注', true), cell(record.remark || '—')] }),
      new TableRow({ children: [cell('采用方法', true), cell(`${adapter.name} / ${adapter.standard.edition}`)] }),
      new TableRow({ children: [cell('标准来源', true), cell(adapter.standard.source)] }),
      new TableRow({ children: [cell('导出时间', true), cell(formatDateTimeDisplay(new Date().toISOString()))] }),
    ]),
    paragraph(''),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '二、点位结果', bold: true })] }),
    table([
      header(['序号', '点位名称', '计算结果', '等级', '状态']),
      ...rows.map(({ point, index, result, issues }) =>
        new TableRow({
          children: [
            cell(String(index + 1)),
            cell(point.name),
            cell(result?.displayValue ?? '—', true),
            cell(result?.grade ?? '—'),
            cell(issues.length === 0 ? '有效' : `待补充 ${issues.length} 项`),
          ],
        })
      ),
    ]),
  ]

  rows.forEach(({ point, index, result, issues, descriptions }) => {
    children.push(paragraph(''))
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: `${index + 1}. ${point.name}`, bold: true })],
      })
    )
    if (point.note) children.push(paragraph(`点位说明：${point.note}`))
    children.push(
      table([
        header(['参数', '选取值', '评分/系数']),
        ...descriptions.map((item) =>
          new TableRow({ children: [cell(item.label), cell(item.value), cell(item.score ?? '—')] })
        ),
      ])
    )
    children.push(paragraph(''))
    children.push(
      paragraph(
        result
          ? `${result.summary}；最终结果 ${result.displayValue}，判定为 ${result.grade}。`
          : `该点位尚有 ${issues.length} 项输入需要补充，未形成工程结论。`,
        true
      )
    )
    result?.warnings.forEach((warning) => children.push(paragraph(`注意：${warning}`)))
  })

  children.push(paragraph(''))
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '说明', bold: true })] }))
  children.push(
    paragraph(
      `本报告按 ${adapter.standard.title}（${adapter.standard.edition}）生成。结果用于工程分析，最终设计应结合现场条件和专业复核。生成软件：${APP_NAME_ZH}（${APP_ORG_NAME_ZH}）。`
    )
  )

  return Packer.toBlob(
    new Document({
      styles: { default: { document: { run: { font: '宋体', size: 21 } } } },
      sections: [{ children }],
    })
  )
}

export async function exportClassificationReport(
  record: RockMassCaseRecord,
  adapter: AnyClassificationAdapter
): Promise<SaveFileResult> {
  const blob = await buildClassificationReportBlob(record, adapter)
  return saveFile(buildClassificationReportFileName(record, adapter), await blob.arrayBuffer(), {
    title: '导出 Word 报告',
    filters: [{ name: 'Word 文档', extensions: ['docx'] }],
    mimeType: DOCX_MIME,
  })
}
