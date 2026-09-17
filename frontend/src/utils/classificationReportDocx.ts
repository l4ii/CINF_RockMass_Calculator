import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { AnyClassificationAdapter } from '../methods/types'
import {
  Q_GRADES,
  calculateQ,
  formatQValue,
  getQAnalysis,
  type QResult,
} from '../methods/q'
import QSupportChart from '../components/q/QSupportChart'
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

async function qChartImage(result: QResult): Promise<ImageRun> {
  const markup = renderToStaticMarkup(createElement(QSupportChart, { result, darkMode: false, language: 'zh' }))
  const svg = new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement
  const [, , width, height] = svg.getAttribute('viewBox')!.split(/\s+/).map(Number)
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  // Give the standalone image explicit dimensions; the UI uses responsive sizing.
  svg.setAttribute('style', `width:${width}px;height:${height}px;font-family:Microsoft YaHei,Arial,sans-serif;background:#fff`)
  const data = new Uint8Array(new TextEncoder().encode(new XMLSerializer().serializeToString(svg)))
  const url = URL.createObjectURL(new Blob([data], { type: 'image/svg+xml' }))
  try {
    const chart = new Image()
    await new Promise<void>((resolve, reject) => {
      chart.onload = () => resolve()
      chart.onerror = () => reject(new Error('Q 支护图生成失败，请重试导出。'))
      chart.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = width * 2
    canvas.height = height * 2
    const context = canvas.getContext('2d')
    if (!context) throw new Error('无法生成 Q 支护图，请在应用或浏览器中导出。')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(chart, 0, 0, canvas.width, canvas.height)
    return new ImageRun({
      type: 'svg',
      data,
      fallback: { type: 'png', data: canvas.toDataURL('image/png') },
      transformation: { width: 560, height: 560 * height / width },
      altText: { title: 'Q–当量尺寸支护关系示意', description: `Q = ${formatQValue(result.q)}；De = ${result.equivalentDimension == null ? '未确定' : `${formatQValue(result.equivalentDimension)} m`}`, name: 'Q 支护关系图' },
    })
  } finally {
    URL.revokeObjectURL(url)
  }
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
      ...(adapter.id === 'q' ? [] : [new TableRow({ children: [cell('标准来源', true), cell(adapter.standard.source)] })]),
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

  for (const { point, index, form, result, issues, descriptions } of rows) {
    const qResult = adapter.id === 'q' && result ? calculateQ(form) : null
    const parameterRows = qResult
      ? descriptions.filter((item) => ['RQD', 'Jn', 'Jr', 'Ja', 'Jw', 'SRF'].includes(item.key))
      : descriptions
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
        header(['参数', '选取值', adapter.id === 'q' ? '选取依据' : '评分/系数']),
        ...parameterRows.map((item) =>
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
    const warnings = qResult ? qResult.warnings.map((warning) => warning.message.zh) : result?.warnings
    warnings?.forEach((warning) => children.push(paragraph(`注意：${warning}`)))

    if (qResult) {
      const { jn, jr, ja, jw, srf } = qResult.factors
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: 'Q 分级分析与支护需求判定', bold: true })] }))
      children.push(paragraph(`计算过程：Q = (${qResult.effectiveRqd} / ${jn.value}) × (${jr.value} / ${ja.value}) × (${jw.value} / ${srf.value}) = ${formatQValue(qResult.q)}。`))
      children.push(paragraph(`五级分级依据：${qResult.grade.label.zh}，${qResult.grade.range}；Q = ${formatQValue(qResult.q)}。`))
      getQAnalysis(qResult).forEach((item) => {
        children.push(paragraph(`${item.title.zh}：${item.value}。${item.description.zh}`))
      })
      if (qResult.support) {
        children.push(paragraph(`支护决策：${qResult.support.label.zh}；${qResult.support.recommendation.zh}`, true))
        children.push(paragraph(`ESR 选取：${qResult.esr!.label.zh}，采用 ${qResult.esr!.value}${qResult.esr!.usedConservativeDefault ? '（按区间下限保守取值）' : ''}。`))
        children.push(paragraph(`当量尺寸 De = 开挖尺寸 / ESR = ${qResult.span} / ${qResult.esr!.value} = ${formatQValue(qResult.equivalentDimension!)} m。`))
        children.push(paragraph(`无支护极限 De_max = 2Q^0.4 = ${formatQValue(qResult.support.maximumUnsupportedDimension)} m；需求比 De/De_max = ${formatQValue(qResult.support.demandRatio)}。`))
      } else {
        children.push(paragraph('支护决策：未提供跨度或 ESR，未进行支护需求判定。'))
      }
      try {
        children.push(new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, children: [await qChartImage(qResult)] }))
      } catch (error) {
        children.push(paragraph(`Q 支护关系图未嵌入：${error instanceof Error ? error.message : '当前环境不支持图像渲染'}。请查看软件中的关系图。`))
      }
      const outsideChart = qResult.q < 0.001 || qResult.q > 1000 || qResult.support?.status === 'outside-chart'
      children.push(paragraph(`图 ${index + 1}：${point.name} Q–当量尺寸支护关系示意。Q 范围 0.001～1000，De 范围 0.1～100 m。${outsideChart ? '当前点位超出示意范围，不绘制定位点。' : qResult.support ? '蓝点表示当前计算点位。' : '未提供完整支护参数，仅显示 Q 位置，不作支护判定。'}`))
    }
  }

  if (adapter.id === 'q') {
    children.push(paragraph(''))
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: 'Q 分级等级划分', bold: true })] }))
    children.push(table([
      header(['等级', 'Q 范围']),
      ...Q_GRADES.map((grade) => new TableRow({ children: [cell(grade.label.zh), cell(grade.range)] })),
    ]))
    children.push(paragraph('支护需求按 De = 开挖尺寸 / ESR 与经验无支护极限 De,max = 2Q^0.4 比较确定；等于分界值时按需支护侧处理。该关系用于识别支护需求，支护形式与参数需结合工程条件确定。'))
  }

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
