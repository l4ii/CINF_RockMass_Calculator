/** RMR 案例 Word 报告（介绍页 + 正文）。 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  PageOrientation,
  Packer,
  Paragraph,
  SectionType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx'
import type { RockMassCaseRecord } from '../types/rockmassCase'
import { APP_NAME_ZH, APP_ORG_NAME_ZH, APP_TAGLINE_ZH } from '../constants/appCopy'
import { RMR89_STANDARD } from '../config/rmrTables'
import { buildCaseSummary, type RmrPointSummary } from './rmrCaseSummary'
import { sanitizeFileNamePart } from './rockmassCaseFile'
import { formatDateTimeDisplay } from './rockmassCaseStore'
import { saveFile, type SaveFileResult } from './saveFile'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const PARAM_KEYS = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'] as const
const PARAM_HEADERS = ['A1\n完整岩石强度', 'A2\n岩石质量指标 RQD', 'A3\n结构面间距', 'A4\n结构面条件', 'A5\n地下水', 'A6\n结构面方向修正'] as const

const BODY_FONT = { ascii: 'Times New Roman', hAnsi: 'Times New Roman', eastAsia: '仿宋_GB2312', cs: 'Times New Roman' }
const TITLE_FONT = { ascii: 'Times New Roman', hAnsi: 'Times New Roman', eastAsia: '方正小标宋简体', cs: 'Times New Roman' }
const HEADER_BORDER = '667085'
const BODY_BORDER = 'DCE3EA'
const HEADER_FILL = 'DCE6F1'
const SUBHEADER_FILL = 'EDF2F7'
const NORMAL_MARGIN = 1440
const TABLE_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 8, color: HEADER_BORDER },
  bottom: { style: BorderStyle.SINGLE, size: 8, color: HEADER_BORDER },
  left: { style: BorderStyle.SINGLE, size: 8, color: HEADER_BORDER },
  right: { style: BorderStyle.SINGLE, size: 8, color: HEADER_BORDER },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BODY_BORDER },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: BODY_BORDER },
}

function run(value: string, size = 21, options: { bold?: boolean; title?: boolean } = {}) {
  return new TextRun({ text: value, size, bold: options.bold, font: options.title ? TITLE_FONT : BODY_FONT })
}

function paragraph(value = '', options: { size?: number; bold?: boolean; title?: boolean; align?: typeof AlignmentType[keyof typeof AlignmentType]; before?: number; after?: number; line?: number; keepNext?: boolean } = {}) {
  return new Paragraph({
    alignment: options.align,
    keepNext: options.keepNext,
    spacing: { before: options.before, after: options.after, line: options.line },
    children: [run(value, options.size ?? 21, { bold: options.bold, title: options.title })],
  })
}

function heading(value: string, level: typeof HeadingLevel.HEADING_1 | typeof HeadingLevel.HEADING_2 = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, keepNext: true, spacing: { before: 180, after: 100 }, children: [run(value, level === HeadingLevel.HEADING_1 ? 26 : 23, { bold: true, title: true })] })
}

function cell(value: string, options: { bold?: boolean; widthPercent?: number; align?: typeof AlignmentType[keyof typeof AlignmentType]; fill?: string } = {}) {
  return new TableCell({
    width: options.widthPercent ? { size: options.widthPercent, type: WidthType.PERCENTAGE } : undefined,
    shading: options.fill ? { fill: options.fill } : undefined,
    borders: TABLE_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 90, bottom: 90, left: 110, right: 110 },
    children: [new Paragraph({ alignment: options.align, spacing: { after: 0, line: 240 }, children: [run(value, 19, { bold: options.bold })] })],
  })
}

function table(rows: TableRow[]) {
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: TABLE_BORDERS, rows })
}

function headerRow(labels: string[]) {
  return new TableRow({ tableHeader: true, children: labels.map((label) => cell(label, { bold: true, align: AlignmentType.CENTER, fill: HEADER_FILL })) })
}

function keyValueTable(entries: { label: string; value: string }[]) {
  return table(entries.map((entry) => new TableRow({ children: [cell(entry.label, { bold: true, widthPercent: 28, fill: SUBHEADER_FILL }), cell(entry.value, { widthPercent: 72 })] })))
}

function titlePageChildren(record: RockMassCaseRecord, exportedAt: string) {
  return [
    paragraph('岩体质量分级计算报告', { size: 36, bold: true, title: true, align: AlignmentType.CENTER, before: 480, after: 180 }),
    paragraph(APP_NAME_ZH, { size: 22, align: AlignmentType.CENTER, after: 480 }),
    paragraph('软件简介', { size: 24, bold: true, title: true, after: 120 }),
    paragraph(`${APP_TAGLINE_ZH}本软件支持参数输入、计算校核与技术报告导出。`, { after: 240, line: 300 }),
    paragraph('开发单位简介', { size: 24, bold: true, title: true, after: 120 }),
    paragraph(`${APP_ORG_NAME_ZH}（简称长沙有色院）成立于1953年，是从事有色金属采选、冶炼、矿山工程、环保及工程设计咨询的综合性技术单位。`, { after: 240, line: 300 }),
    paragraph('联系信息', { size: 24, bold: true, title: true, after: 120 }),
    paragraph('商务联系：电话：0731-84397032；邮箱：cinf@chinalco.com.cn', { after: 80, line: 240 }),
    paragraph('开发者联系：xuqianglai@outlook.com', { after: 80, line: 240 }),
    paragraph('地址：湖南省长沙市雨花区木莲东路299号', { after: 260, line: 240 }),
    paragraph(`项目名称：${record.name}`, { size: 22, after: 120 }),
    paragraph('采用方法：RMR 岩体地质力学分级（Bieniawski 1989）', { size: 22, after: 120 }),
    paragraph(`导出日期：${exportedAt}`, { size: 20, align: AlignmentType.RIGHT, before: 360 }),
  ]
}

function buildInputTable(rows: RmrPointSummary[]) {
  return table([
    headerRow(['点位', ...PARAM_HEADERS]),
    ...rows.map((row) => new TableRow({ children: [cell(`${row.ordinal}. ${row.point.name}`), ...row.descriptions.map((description) => cell(`${description.inputValue ?? description.choice}\n评分：${description.score ?? '—'}`))] })),
  ])
}

function buildResultTable(rows: RmrPointSummary[]) {
  return table([
    headerRow(['点位', ...PARAM_KEYS, 'RMR', '等级', '岩体描述', '自稳跨度/时间', '粘聚力', '内摩擦角']),
    ...rows.map((row) => {
      const info = row.needsReview ? null : row.scores.classInfo
      return new TableRow({ children: [
        cell(`${row.ordinal}. ${row.point.name}`),
        ...PARAM_KEYS.map((key) => cell(!row.needsReview && row.scores[key] != null ? String(row.scores[key]) : '—', { align: AlignmentType.CENTER })),
        cell(row.needsReview ? '待复核' : row.scores.rmr != null ? String(row.scores.rmr) : '—', { bold: true, align: AlignmentType.CENTER }),
        cell(info ? `${info.label}（${info.quality}）` : '—'),
        cell(info?.description ?? '—'),
        cell(info ? `${info.span} / ${info.standUpTime}` : '—'),
        cell(info?.cohesion ?? '—'),
        cell(info?.friction ?? '—'),
      ] })
    }),
  ])
}

function buildPointSection(row: RmrPointSummary) {
  const info = row.needsReview ? null : row.scores.classInfo
  const blocks: (Paragraph | Table)[] = [heading(`${row.ordinal}. ${row.point.name}`, HeadingLevel.HEADING_2)]
  if (row.point.note || row.point.oreType) blocks.push(paragraph([row.point.note ? `点位说明：${row.point.note}` : '', row.point.oreType ? `矿岩类型：${row.point.oreType}` : ''].filter(Boolean).join('；')))
  blocks.push(table([
    headerRow(['参数', '实际输入 / 选择', '评分']),
    ...row.descriptions.map((description) => new TableRow({ children: [cell(description.title, { widthPercent: 24 }), cell(description.inputValue ?? description.choice, { widthPercent: 64 }), cell(description.score != null ? String(description.score) : '—', { widthPercent: 12, align: AlignmentType.CENTER })] })),
  ]))
  if (info && row.scores.rmr != null && !row.needsReview) {
    blocks.push(paragraph(`RMR = ${row.descriptions.map((description) => description.score).join(' + ')} = ${row.scores.rmr}；岩体质量等级：${info.label}（${info.quality}）。`, { bold: true, before: 160, after: 120 }))
    blocks.push(keyValueTable([
      { label: '评分值区间', value: info.rmrRange },
      { label: '岩体描述', value: info.description },
      { label: '平均自稳跨度 / 自稳时间', value: `${info.span} / ${info.standUpTime}` },
      { label: '岩体的粘聚力', value: info.cohesion },
      { label: '内摩擦角', value: info.friction },
      { label: '开挖方式', value: info.excavation },
      { label: '锚杆（φ20 mm，全长锚固）', value: info.bolt },
      { label: '喷射混凝土', value: info.shotcrete },
      { label: '钢支架', value: info.steelArch },
    ]))
  } else {
    blocks.push(paragraph(row.needsReview ? '该点位由旧版案例迁移，需重新打开并确认后才形成 RMR 结论。' : `该点位尚有 ${6 - row.scores.completedCount} 项参数未选择，未形成分级结论。`, { before: 160 }))
  }
  return blocks
}

export function buildReportFileName(record: RockMassCaseRecord) {
  return `${sanitizeFileNamePart(record.name)}_RMR分级计算书.docx`
}

export async function buildCaseReportBlob(record: RockMassCaseRecord): Promise<Blob> {
  const summary = buildCaseSummary(record)
  const exportedAt = formatDateTimeDisplay(new Date().toISOString())
  const body: (Paragraph | Table)[] = [
    heading('一、工程信息'),
    keyValueTable([
      { label: '工程名称', value: record.engineering || '—' },
      { label: '工程部位', value: record.location || '—' },
      { label: '备注', value: record.remark || '—' },
      { label: '点位总数', value: String(summary.total) },
      { label: 'RMR统计', value: summary.averageRmr != null ? `平均 ${summary.averageRmr}，区间 ${summary.minRmr} ~ ${summary.maxRmr}` : '暂无可计算的 RMR' },
      { label: '等级分布', value: summary.distribution.filter((item) => item.count > 0).map((item) => `${item.label} × ${item.count}`).join('；') || '—' },
      { label: '采用标准', value: `${RMR89_STANDARD.title}（${RMR89_STANDARD.edition}）` },
      { label: '导出时间', value: exportedAt },
    ]),
    heading('二、点位输入汇总'),
  ]
  if (summary.rows.length > 0) {
    body.push(buildInputTable(summary.rows), heading('三、点位结果汇总'), buildResultTable(summary.rows), heading('四、各点位计算详情'))
    summary.rows.forEach((row) => body.push(...buildPointSection(row)))
  } else {
    body.push(paragraph('该项目暂无点位记录。'))
  }
  body.push(heading('五、说明'), paragraph(`本计算书依据 ${RMR89_STANDARD.source} 编制，采用1989版评分表，等级按81～100、61～80、41～60、21～40、≤20划分。支护指南适用于跨度10 m的马蹄形钻爆隧道、竖向应力小于25 MPa；超出该条件不得直接套用。计算结果仅供工程分析参考，实际工程须结合现行规范、现场条件与专业判断综合决策。`, { line: 300 }))

  const doc = new Document({
    creator: APP_ORG_NAME_ZH,
    title: `${record.name} RMR 分级计算书`,
    description: 'CINF矿山岩体质量分级软件生成的 RMR 分级计算报告。',
    styles: { default: { document: { run: { font: BODY_FONT, size: 21 } } } },
    sections: [
      { properties: { page: { margin: { top: NORMAL_MARGIN, right: NORMAL_MARGIN, bottom: NORMAL_MARGIN, left: NORMAL_MARGIN } } }, children: titlePageChildren(record, exportedAt) },
      { properties: { type: SectionType.NEXT_PAGE, page: { size: { orientation: PageOrientation.PORTRAIT }, margin: { top: NORMAL_MARGIN, right: NORMAL_MARGIN, bottom: NORMAL_MARGIN, left: NORMAL_MARGIN } } }, children: body },
    ],
  })
  return Packer.toBlob(doc)
}

export async function exportCaseReport(record: RockMassCaseRecord): Promise<SaveFileResult> {
  const blob = await buildCaseReportBlob(record)
  return saveFile(buildReportFileName(record), await blob.arrayBuffer(), {
    title: '导出 Word 报告',
    filters: [{ name: 'Word 文档', extensions: ['docx'] }, { name: '所有文件', extensions: ['*'] }],
    mimeType: DOCX_MIME,
  })
}
