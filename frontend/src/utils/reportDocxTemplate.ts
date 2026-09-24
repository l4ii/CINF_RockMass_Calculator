/** Shared calculation-book skeleton. Each export fills this layout; method profiles supply the rows. */

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  type FileChild,
  SectionType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx'
import { APP_NAME_ZH, APP_ORG_NAME_ZH } from '../constants/appCopy'
import type { RockMassCaseRecord } from '../types/rockmassCase'
import { formatDateTimeDisplay } from './rockmassCaseStore'

export const BODY_FONT = { ascii: 'Times New Roman', hAnsi: 'Times New Roman', eastAsia: '仿宋_GB2312', cs: 'Times New Roman' }
export const TITLE_FONT = { ascii: 'Times New Roman', hAnsi: 'Times New Roman', eastAsia: '方正小标宋简体', cs: 'Times New Roman' }

const BODY_SIZE = 24
const TABLE_SIZE = 21
const H1_SIZE = 32
const H2_SIZE = 28
const COVER_TITLE_SIZE = 36
const NORMAL_MARGIN = 1440
const HEADER_BORDER = '667085'
const BODY_BORDER = 'DCE3EA'
const HEADER_FILL = 'DCE6F1'
const SUBHEADER_FILL = 'EDF2F7'

const TABLE_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 8, color: HEADER_BORDER },
  bottom: { style: BorderStyle.SINGLE, size: 8, color: HEADER_BORDER },
  left: { style: BorderStyle.SINGLE, size: 8, color: HEADER_BORDER },
  right: { style: BorderStyle.SINGLE, size: 8, color: HEADER_BORDER },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BODY_BORDER },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: BODY_BORDER },
}

export function softwareIntro(methodName: string) {
  return `${APP_NAME_ZH}面向矿山工程建设与生产管理，在本机完成本次${methodName}，并整理为计算书。其余方法（RQD、BQ、Q、RMR、GSI、MRMR）各自单独成册。计算结果供工程分析参考，正式设计应以现行规范和现场复核为准。`
}

export interface CalculationInputRow {
  parameter: string
  entered: string
  adopted: string
}

export interface CalculationPointBlock {
  name: string
  note?: string
  oreType?: string
  resultText: string
  gradeText: string
  status: string
  inputs: CalculationInputRow[]
  evaluation: string[]
  extras?: FileChild[]
}

export interface CalculationBook {
  record: RockMassCaseRecord
  methodName: string
  standardLine: string
  usage: string[]
  points: CalculationPointBlock[]
  closing: string
}

function run(value: string, size = BODY_SIZE, options: { bold?: boolean; title?: boolean } = {}) {
  return new TextRun({ text: value, size, bold: options.bold, font: options.title ? TITLE_FONT : BODY_FONT })
}

function paragraph(value = '', options: { size?: number; bold?: boolean; title?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; before?: number; after?: number; line?: number } = {}) {
  return new Paragraph({
    alignment: options.align,
    spacing: { before: options.before, after: options.after ?? 80, line: options.line ?? 360 },
    children: [run(value, options.size ?? BODY_SIZE, { bold: options.bold, title: options.title })],
  })
}

function heading(value: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) {
  const size = level === HeadingLevel.HEADING_1 ? H1_SIZE : level === HeadingLevel.HEADING_2 ? H2_SIZE : 24
  return new Paragraph({
    heading: level,
    keepNext: true,
    spacing: { before: 200, after: 100, line: 360 },
    children: [run(value, size, { bold: true, title: true })],
  })
}

function cell(value: string, options: { bold?: boolean; widthPercent?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; fill?: string } = {}) {
  return new TableCell({
    width: options.widthPercent ? { size: options.widthPercent, type: WidthType.PERCENTAGE } : undefined,
    shading: options.fill ? { fill: options.fill } : undefined,
    borders: TABLE_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [new Paragraph({ alignment: options.align, spacing: { after: 0, line: 276 }, children: [run(value, TABLE_SIZE, { bold: options.bold })] })],
  })
}

function table(rows: TableRow[]) {
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: TABLE_BORDERS, rows })
}

function headerRow(labels: string[]) {
  return new TableRow({ tableHeader: true, children: labels.map((label) => cell(label, { bold: true, align: AlignmentType.CENTER, fill: HEADER_FILL })) })
}

function keyValueTable(entries: { label: string; value: string }[]) {
  return table(entries.map((entry) => new TableRow({
    children: [
      cell(entry.label, { bold: true, widthPercent: 28, fill: SUBHEADER_FILL }),
      cell(entry.value, { widthPercent: 72 }),
    ],
  })))
}

function cover(book: CalculationBook, exportedAt: string) {
  return [
    paragraph(`${book.methodName}计算书`, { size: COVER_TITLE_SIZE, bold: true, title: true, align: AlignmentType.CENTER, before: 480, after: 120 }),
    paragraph(book.record.name, { size: H1_SIZE, bold: true, title: true, align: AlignmentType.CENTER, after: 200 }),
    paragraph(APP_NAME_ZH, { size: 22, align: AlignmentType.CENTER, after: 360 }),
    paragraph('软件简介', { size: H2_SIZE, bold: true, title: true, after: 120 }),
    paragraph(softwareIntro(book.methodName), { after: 200 }),
    paragraph(`编制单位：${APP_ORG_NAME_ZH}`, { after: 280 }),
    paragraph(`项目名称：${book.record.name}`, { before: 200, after: 80 }),
    paragraph(`采用方法：${book.methodName}（${book.standardLine}）`, { after: 80 }),
    paragraph(`导出日期：${exportedAt}`, { size: 21, align: AlignmentType.RIGHT, before: 280 }),
  ]
}

function pointSection(point: CalculationPointBlock, index: number): FileChild[] {
  const blocks: FileChild[] = [heading(`${index + 1}. ${point.name}`, HeadingLevel.HEADING_2)]
  const meta = [point.note ? `点位说明：${point.note}` : '', point.oreType ? `岩矿类型：${point.oreType}` : ''].filter(Boolean).join('；')
  if (meta) blocks.push(paragraph(meta))
  const rows = point.inputs.length > 0
    ? point.inputs
    : [{ parameter: '尚无已填写的计算参数', entered: '—', adopted: '—' }]
  blocks.push(table([
    headerRow(['参数', '输入结果', '参与计算的取值']),
    ...rows.map((row) => new TableRow({
      children: [
        cell(row.parameter, { widthPercent: 28, fill: SUBHEADER_FILL }),
        cell(row.entered, { widthPercent: 46 }),
        cell(row.adopted, { widthPercent: 26, align: AlignmentType.CENTER }),
      ],
    })),
  ]))
  blocks.push(paragraph('评价', { bold: true, title: true, before: 160, after: 60 }))
  point.evaluation.forEach((line) => blocks.push(paragraph(line)))
  point.extras?.forEach((extra) => blocks.push(extra))
  return blocks
}

export async function buildCalculationBookBlob(book: CalculationBook): Promise<Blob> {
  const exportedAt = formatDateTimeDisplay(new Date().toISOString())
  const body: FileChild[] = [
    heading('一、方法说明'),
    ...book.usage.map((line) => paragraph(line)),
    heading('二、工程信息'),
    keyValueTable([
      { label: '工程名称', value: book.record.engineering || '—' },
      { label: '工程部位', value: book.record.location || '—' },
      { label: '备注', value: book.record.remark || '—' },
      { label: '点位总数', value: String(book.points.length) },
      { label: '采用标准', value: book.standardLine },
      { label: '导出时间', value: exportedAt },
    ]),
    heading('三、点位结果'),
  ]
  if (book.points.length === 0) {
    body.push(paragraph('该项目暂无点位记录。'))
  } else {
    body.push(table([
      headerRow(['序号', '点位名称', '计算结果', '等级或评价', '状态']),
      ...book.points.map((point, index) => new TableRow({
        children: [
          cell(String(index + 1), { align: AlignmentType.CENTER }),
          cell(point.name),
          cell(point.resultText, { bold: true, align: AlignmentType.CENTER }),
          cell(point.gradeText, { align: AlignmentType.CENTER }),
          cell(point.status, { align: AlignmentType.CENTER }),
        ],
      })),
    ]))
    body.push(heading('四、各点位计算详情'))
    book.points.forEach((point, index) => body.push(...pointSection(point, index)))
  }
  body.push(heading(book.points.length === 0 ? '四、说明' : '五、说明'), paragraph(book.closing))

  return Packer.toBlob(new Document({
    creator: APP_ORG_NAME_ZH,
    title: `${book.methodName}计算书`,
    description: `${APP_NAME_ZH}生成的${book.methodName}计算书。`,
    styles: { default: { document: { run: { font: BODY_FONT, size: BODY_SIZE } } } },
    sections: [
      { properties: { page: { margin: { top: NORMAL_MARGIN, right: NORMAL_MARGIN, bottom: NORMAL_MARGIN, left: NORMAL_MARGIN } } }, children: cover(book, exportedAt) },
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: { margin: { top: NORMAL_MARGIN, right: NORMAL_MARGIN, bottom: NORMAL_MARGIN, left: NORMAL_MARGIN } },
        },
        children: body,
      },
    ],
  }))
}
