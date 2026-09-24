import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AlignmentType, ImageRun, Paragraph, TextRun } from 'docx'
import { GsiReportChart } from '../../components/gsi/GsiReportChart'
import { Q_JA_OPTIONS, Q_JR_OPTIONS } from '../../methods/q'
import {
  GSI_JCOND76_OPTIONS,
  GSI_JCOND89_DETAIL_ROWS,
  GSI_JCOND89_SIMPLE,
  GSI_STRUCTURE_OPTIONS,
  GSI_SURFACE_OPTIONS,
  calculateGsi,
  normalizeGsiState,
  validateGsiState,
  type GsiFormState,
} from '../../methods/gsi'
import type { RockMassCaseRecord } from '../../types/rockmassCase'
import type { CalculationInputRow, CalculationPointBlock } from '../reportDocxTemplate'

export const GSI_REPORT_USAGE = [
  '图表法在节理岩体分级图上点选岩体结构与表面条件，GSI 为刻度 A 与刻度 B 之和。定量法由岩石质量指标和结构面条件确定两项刻度。',
  '岩石质量指标可实测，也可由节理频率或体积节理数估算。结构面条件按本次选用的路径取值。参数表只记录当前入口下已经填写的输入；另一条路径中未使用的参数不写入计算书。GSI、刻度 A、刻度 B 和等级写在评价中。已经算出的点位附上对应分级图，蓝点为本次取值。',
]

const DETAIL_KEYS = ['jcond89PersistenceId', 'jcond89ApertureId', 'jcond89RoughnessId', 'jcond89InfillId', 'jcond89WeatheringId'] as const

function optionText(id: string, options: readonly { id: string; label: string }[]) {
  return options.find((item) => item.id === id)?.label ?? ''
}

function quantitativeRows(state: GsiFormState): CalculationInputRow[] {
  const rows: CalculationInputRow[] = [{ parameter: '计算入口', entered: '定量法', adopted: '定量法' }]
  if (state.rqdSource === 'measured' && state.rqd != null) {
    rows.push({ parameter: '岩石质量指标 RQD（实测）', entered: `${state.rqd}%`, adopted: `${state.rqd}%` })
  } else if (state.rqdSource === 'priest_hudson' && state.lambdaPerM != null) {
    rows.push({ parameter: '节理频率 λ', entered: `${state.lambdaPerM} 条/m`, adopted: `${state.lambdaPerM} 条/m` })
  } else if ((state.rqdSource === 'palmstrom_2005' || state.rqdSource === 'palmstrom_1982') && state.jv != null) {
    rows.push({
      parameter: state.rqdSource === 'palmstrom_2005' ? '体积节理数 Jv（Palmström 2005）' : '体积节理数 Jv（Palmström 1982）',
      entered: String(state.jv),
      adopted: String(state.jv),
    })
  }

  if (state.surfaceMethod === 'jcond89') {
    if (state.jcond89Value != null) {
      rows.push({ parameter: '结构面条件 JCond89', entered: String(state.jcond89Value), adopted: String(state.jcond89Value) })
    } else if (state.jcond89Mode === 'detailed') {
      DETAIL_KEYS.forEach((key, index) => {
        const row = GSI_JCOND89_DETAIL_ROWS[index]
        const selected = row?.options.find((item) => item.id === state[key])
        if (!selected || !row) return
        rows.push({ parameter: `结构面${row.label}`, entered: selected.label, adopted: String(selected.score) })
      })
    } else {
      const selected = optionText(state.jcond89SimpleId, GSI_JCOND89_SIMPLE)
      if (selected) rows.push({ parameter: '结构面条件 JCond89', entered: selected, adopted: selected })
    }
  } else if (state.surfaceMethod === 'jcond76') {
    const selected = GSI_JCOND76_OPTIONS.find((item) => item.id === state.jcond76Id)
    if (selected) rows.push({ parameter: '结构面条件 JCond76', entered: selected.label, adopted: String(selected.value) })
  } else {
    const jr = Q_JR_OPTIONS.find((item) => item.id === state.jrId)
    const ja = Q_JA_OPTIONS.find((item) => item.id === state.jaId)
    if (jr || state.jrValue != null) rows.push({ parameter: '节理粗糙度 Jr', entered: jr?.label.zh ?? String(state.jrValue), adopted: state.jrValue == null ? (jr ? String(jr.range.min) : '—') : String(state.jrValue) })
    if (ja || state.jaValue != null) rows.push({ parameter: '节理蚀变 Ja', entered: ja?.label.zh ?? String(state.jaValue), adopted: state.jaValue == null ? (ja ? String(ja.range.max) : '—') : String(state.jaValue) })
  }
  return rows
}

function chartRows(state: GsiFormState): CalculationInputRow[] {
  const rows: CalculationInputRow[] = [{ parameter: '计算入口', entered: '图表法', adopted: '图表法' }]
  const structure = GSI_STRUCTURE_OPTIONS.find((item) => item.id === state.structureId)
  const surface = GSI_SURFACE_OPTIONS.find((item) => item.id === state.surfaceQualityId)
  if (structure) rows.push({ parameter: '岩体结构', entered: structure.label, adopted: structure.label })
  if (surface) rows.push({ parameter: '表面质量', entered: surface.label, adopted: surface.label })
  return rows
}

const CAPTION_FONT = { ascii: 'Times New Roman', hAnsi: 'Times New Roman', eastAsia: '仿宋_GB2312', cs: 'Times New Roman' }
const TINY_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

function extractChartSvg(markup: string) {
  const svg = new DOMParser().parseFromString(markup, 'text/html').querySelector('svg')
  if (!svg) throw new Error('GSI 分级图生成失败，请重试导出。')
  return svg
}

async function gsiChartImage(mode: 'chart' | 'quantitative', pointName: string, scaleA: number, scaleB: number, gsi: number) {
  const markup = renderToStaticMarkup(createElement(GsiReportChart, { mode, pointName, scaleA, scaleB, gsi }))
  const svg = extractChartSvg(markup)
  const [, , width, height] = svg.getAttribute('viewBox')!.split(/\s+/).map(Number)
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  const data = new Uint8Array(new TextEncoder().encode(new XMLSerializer().serializeToString(svg)))
  let fallback = TINY_PNG
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (context && typeof URL.createObjectURL === 'function') {
    const url = URL.createObjectURL(new Blob([data], { type: 'image/svg+xml' }))
    try {
      const chart = new Image()
      await new Promise<void>((resolve, reject) => {
        chart.onload = () => resolve()
        chart.onerror = () => reject(new Error('GSI 分级图生成失败，请重试导出。'))
        chart.src = url
      })
      canvas.width = width * 2
      canvas.height = height * 2
      context.fillStyle = '#fff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(chart, 0, 0, canvas.width, canvas.height)
      fallback = canvas.toDataURL('image/png')
    } finally {
      URL.revokeObjectURL(url)
    }
  }
  const displayWidth = 560
  return new ImageRun({
    type: 'svg',
    data,
    fallback: { type: 'png', data: fallback },
    transformation: { width: displayWidth, height: displayWidth * height / width },
    altText: {
      title: mode === 'chart' ? '节理岩体地质强度指标（GSI）' : '量化地质强度指标（GSI）',
      description: `${pointName}，GSI = ${gsi}`,
      name: 'GSI分级图',
    },
  })
}

async function chartExtras(mode: 'chart' | 'quantitative', pointName: string, index: number, scaleA: number, scaleB: number, gsi: number) {
  const outside = mode === 'quantitative' && (scaleA < 0 || scaleB < 0 || scaleA > 45 || scaleB > 40)
  const caption = `图 ${index + 1}：${pointName} ${mode === 'chart' ? '节理岩体地质强度指标图' : '量化地质强度指标图'}。蓝点为本次取值，GSI = ${gsi}。${outside ? '取值超出量化图幅，蓝点标在图内边界。' : ''}`
  try {
    return [
      new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, children: [await gsiChartImage(mode, pointName, scaleA, scaleB, gsi)] }),
      new Paragraph({ spacing: { before: 80, after: 80, line: 360 }, children: [new TextRun({ text: caption, font: CAPTION_FONT, size: 21 })] }),
    ]
  } catch (error) {
    return [new Paragraph({
      spacing: { before: 80, after: 80, line: 360 },
      children: [new TextRun({ text: `GSI 分级图未嵌入：${error instanceof Error ? error.message : '当前环境不支持图像渲染'}。`, font: CAPTION_FONT, size: 24 })],
    })]
  }
}

export async function buildGsiReportPoints(record: RockMassCaseRecord): Promise<CalculationPointBlock[]> {
  const points: CalculationPointBlock[] = []
  for (let index = 0; index < record.points.length; index += 1) {
    const point = record.points[index]
    const state = normalizeGsiState(point.input)
    const issues = validateGsiState(state)
    const inputs = state.entryMode === 'quantitative' ? quantitativeRows(state) : chartRows(state)
    if (issues.length > 0) {
      points.push({
        name: point.name,
        note: point.note,
        oreType: point.oreType,
        resultText: '—',
        gradeText: '—',
        status: `待补充 ${issues.length} 项`,
        inputs,
        evaluation: [`该点位尚有 ${issues.length} 项输入需要补充，未形成工程结论，不附分级图。${issues.map((issue) => issue.message).join('')}`],
      })
      continue
    }
    const result = calculateGsi(state)
    points.push({
      name: point.name,
      note: point.note,
      oreType: point.oreType,
      resultText: `GSI = ${result.gsi}`,
      gradeText: result.grade.label,
      status: '有效',
      inputs,
      evaluation: [
        result.formula,
        `刻度 A = ${result.scaleA}，刻度 B = ${result.scaleB}，GSI = ${result.gsi}。`,
        `岩体质量等级：${result.grade.label}（${result.grade.quality}），${result.grade.range}。`,
        ...result.warnings.map((warning) => `注意：${warning}`),
      ],
      extras: await chartExtras(result.entryMode === 'quantitative' ? 'quantitative' : 'chart', point.name, index, result.scaleA, result.scaleB, result.gsi),
    })
  }
  return points
}
