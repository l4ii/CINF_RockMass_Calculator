import { AlignmentType, ImageRun, Paragraph, TextRun } from 'docx'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import QNgSupportChart from '../../components/q/QNgSupportChart'
import QSupportChart from '../../components/q/QSupportChart'
import {
  Q_JA_OPTIONS,
  Q_JN_OPTIONS,
  Q_JR_OPTIONS,
  Q_JW_OPTIONS,
  Q_SRF_OPTIONS,
  calculateQ,
  displayedFactorValue,
  formatQValue,
  getQAnalysis,
  normalizeQState,
  validateQState,
  type QFactorOption,
  type QFormState,
  type QResolvedFactor,
  type QResult,
} from '../../methods/q'
import type { RockMassCaseRecord } from '../../types/rockmassCase'
import type { CalculationInputRow, CalculationPointBlock } from '../reportDocxTemplate'

export const Q_REPORT_USAGE = [
  'Q = (RQD / Jn) × (Jr / Ja) × (Jw / SRF)。RQD 为岩石质量指标（%）；Jn、Jr、Ja、Jw、SRF 分别按节理组数、粗糙度、蚀变、节理水和应力折减选取。RQD 小于 10% 时，计算采用名义值 10%，并保留实测值。',
  '填写开挖尺寸和开挖支护比 ESR 后，可比较当量尺寸与无支护极限，或读取永久支护图。无支护极限按 De = 开挖尺寸 / ESR 与经验无支护极限 De,max = 2Q^0.4 比较确定。永久支护图读取 Q–De 类别与参数，等值线之间内插，虚线区与经验包络以外不外推。',
  '等级按巴顿五级划分。边界约定：Q＝40 归 II 级，Q＝10 归 III 级，Q＝1 与 Q＝0.1 归 IV 级，按未舍入 Q 值判级。本计算书的参数表只记录六项输入；若已填写开挖条件，再记录开挖尺寸与 ESR。块体尺寸、抗剪、应力组合和支护参数写在评价中。',
]

const FACTOR_FIELDS: { symbol: string; label: string; idKey: keyof QFormState; valueKey: keyof QFormState; options: readonly QFactorOption[] }[] = [
  { symbol: 'Jn', label: '节理组数 Jn', idKey: 'jnId', valueKey: 'jnValue', options: Q_JN_OPTIONS },
  { symbol: 'Jr', label: '节理粗糙度 Jr', idKey: 'jrId', valueKey: 'jrValue', options: Q_JR_OPTIONS },
  { symbol: 'Ja', label: '节理蚀变 Ja', idKey: 'jaId', valueKey: 'jaValue', options: Q_JA_OPTIONS },
  { symbol: 'Jw', label: '节理水 Jw', idKey: 'jwId', valueKey: 'jwValue', options: Q_JW_OPTIONS },
  { symbol: 'SRF', label: '应力折减 SRF', idKey: 'srfId', valueKey: 'srfValue', options: Q_SRF_OPTIONS },
]

function optionLabel(id: string, options: readonly QFactorOption[]) {
  return options.find((item) => item.id === id)?.label.zh ?? ''
}

function factorNote(factor: QResolvedFactor, state: QFormState) {
  if (factor.symbol === 'Jn' && state.jnSite === 'intersection') return '；巷道交叉点按 3.0×Jn'
  if (factor.symbol === 'Jn' && state.jnSite === 'portal') return '；穿脉按 2.0×Jn'
  if (factor.symbol === 'Jr' && state.jrWideSpacing) return '；相关节理组间距 > 3 m，Jr + 1.0'
  if (factor.usedConservativeDefault) return '（保守取值）'
  return ''
}

function incompleteRows(state: QFormState): CalculationInputRow[] {
  const rows: CalculationInputRow[] = []
  if (state.rqd != null) rows.push({ parameter: '岩石质量指标 RQD', entered: `${state.rqd}%`, adopted: state.rqd < 10 ? '10%（名义下限）' : `${state.rqd}%` })
  for (const field of FACTOR_FIELDS) {
    const id = String(state[field.idKey] ?? '')
    const value = state[field.valueKey] as number | null
    if (!id && value == null) continue
    const shown = displayedFactorValue(id, value, field.options)
    rows.push({
      parameter: field.label,
      entered: optionLabel(id, field.options) || (value == null ? '已选择' : String(value)),
      adopted: shown == null ? '—' : String(shown),
    })
  }
  if (state.span != null) rows.push({ parameter: '开挖跨度、直径或高度', entered: `${state.span} m`, adopted: `${state.span} m` })
  if (state.esrId) {
    const esr = state.esrValue
    rows.push({ parameter: '开挖支护比 ESR', entered: state.esrId, adopted: esr == null ? '—' : String(esr) })
  }
  return rows
}

function completeRows(state: QFormState, result: QResult): CalculationInputRow[] {
  const rows: CalculationInputRow[] = [{
    parameter: '岩石质量指标 RQD',
    entered: `${result.originalRqd}%`,
    adopted: result.originalRqd < 10 ? `10%（实测 ${result.originalRqd}%）` : `${result.originalRqd}%`,
  }]
  for (const field of FACTOR_FIELDS) {
    const factor = result.factors[field.symbol === 'Jn' ? 'jn' : field.symbol === 'Jr' ? 'jr' : field.symbol === 'Ja' ? 'ja' : field.symbol === 'Jw' ? 'jw' : 'srf']
    rows.push({
      parameter: field.label,
      entered: factor.label.zh,
      adopted: `${factor.value}${factorNote(factor, state)}`,
    })
  }
  if (result.span != null) rows.push({ parameter: '开挖跨度、直径或高度', entered: `${result.span} m`, adopted: `${result.span} m` })
  if (result.esr) {
    rows.push({
      parameter: '开挖支护比 ESR',
      entered: result.esr.label.zh,
      adopted: `${result.esr.value}${result.esr.usedConservativeDefault ? '（保守取区间下限）' : ''}`,
    })
  }
  return rows
}

function extractChartSvg(markup: string): SVGSVGElement {
  const trimmed = markup.trim()
  if (trimmed.startsWith('<svg')) {
    return new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement as unknown as SVGSVGElement
  }
  const svg = new DOMParser().parseFromString(markup, 'text/html').querySelector('svg')
  if (!svg) throw new Error('Q 支护图生成失败，请重试导出。')
  return svg
}

async function qChartImage(result: QResult): Promise<ImageRun> {
  const chartMode = result.support?.mode === 'chart'
  const markup = renderToStaticMarkup(createElement(chartMode ? QNgSupportChart : QSupportChart, { result, darkMode: false, language: 'zh' }))
  const svg = extractChartSvg(markup)
  const [, , width, height] = svg.getAttribute('viewBox')!.split(/\s+/).map(Number)
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  svg.setAttribute('style', `width:${width}px;height:${height}px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif;background:#fff`)
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
      altText: {
        title: chartMode ? 'Q 支护图表' : 'Q–当量尺寸支护关系示意',
        description: `Q = ${formatQValue(result.q)}；De = ${result.equivalentDimension == null ? '未确定' : `${formatQValue(result.equivalentDimension)} m`}`,
        name: 'Q 支护关系图',
      },
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

function evaluation(result: QResult): string[] {
  const { jn, jr, ja, jw, srf } = result.factors
  const lines = [
    `计算过程：Q = (${result.effectiveRqd} / ${jn.value}) × (${jr.value} / ${ja.value}) × (${jw.value} / ${srf.value}) = ${formatQValue(result.q)}。`,
    `五级分级依据：${result.grade.label.zh}，${result.grade.range}；Q = ${formatQValue(result.q)}。`,
    ...getQAnalysis(result).map((item) => `${item.title.zh}：${item.value}。${item.description.zh}`),
  ]
  result.warnings.forEach((warning) => lines.push(`注意：${warning.message.zh}`))
  if (!result.support || result.span == null || result.esr == null || result.equivalentDimension == null) {
    lines.push('支护决策：未提供跨度或 ESR，未进行支护需求判定。')
    return lines
  }
  lines.push(`支护决策：${result.support.label.zh}；${result.support.recommendation.zh}`)
  lines.push(`ESR 选取：${result.esr.label.zh}，采用 ${result.esr.value}${result.esr.usedConservativeDefault ? '（按区间下限保守取值）' : ''}。`)
  lines.push(`当量尺寸 De = 开挖尺寸 / ESR = ${result.span} / ${result.esr.value} = ${formatQValue(result.equivalentDimension)} m。`)
  if (result.support.mode === 'chart') {
    const support = result.support
    if (support.shotcreteThicknessCm != null) lines.push(`喷层厚度 ${formatQValue(support.shotcreteThicknessCm)} cm${support.energyAbsorptionJ != null ? `，吸能等级 E${support.energyAbsorptionJ}` : ''}。`)
    if (support.boltSpacingWithSfrM != null) lines.push(`有 Sfr 锚杆间距 ${formatQValue(support.boltSpacingWithSfrM)} m。`)
    if (support.boltSpacingWithoutSfrM != null) lines.push(`无 Sfr 锚杆间距 ${formatQValue(support.boltSpacingWithoutSfrM)} m。`)
    if (support.boltLengthM != null) lines.push(`锚杆长度 L = 2 + 0.15 De = ${formatQValue(support.boltLengthM)} m。`)
    if (support.rrs) lines.push(`RRS ${support.rrs.class}${support.rrs.spacingM != null ? `，间距 c/c ${formatQValue(support.rrs.spacingM)} m` : ''}。`)
    if (support.category != null) lines.push(`类别 ${support.category}。`)
  } else {
    lines.push(`无支护极限 De_max = 2Q^0.4 = ${formatQValue(result.support.maximumUnsupportedDimension)} m；需求比 De/De_max = ${formatQValue(result.support.demandRatio)}。`)
  }
  return lines
}

async function chartExtras(result: QResult, pointName: string, index: number) {
  const chartMode = result.support?.mode === 'chart'
  const outsideChart = result.q < 0.001 || result.q > 1000 || result.support?.status === 'outside-chart'
  const caption = `图 ${index + 1}：${pointName} ${chartMode ? 'Q 支护图表。Q 范围 0.001～1000，De 范围 1～100 m。' : 'Q–当量尺寸支护关系示意。Q 范围 0.001～1000，De 范围 0.1～100 m。'}${outsideChart ? '当前点位超出示意范围，不绘制定位点。' : result.support ? '蓝点表示当前计算点位。' : '未提供完整支护参数，仅显示 Q 位置，不作支护判定。'}`
const captionFont = { ascii: 'Times New Roman', hAnsi: 'Times New Roman', eastAsia: '仿宋_GB2312', cs: 'Times New Roman' }
  try {
    return [
      new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, children: [await qChartImage(result)] }),
      new Paragraph({ spacing: { before: 80, after: 80, line: 360 }, children: [new TextRun({ text: caption, font: captionFont, size: 21 })] }),
    ]
  } catch (error) {
    return [new Paragraph({
      spacing: { before: 80, after: 80, line: 360 },
      children: [new TextRun({ text: `Q 支护关系图未嵌入：${error instanceof Error ? error.message : '当前环境不支持图像渲染'}。请查看软件中的关系图。`, font: captionFont, size: 24 })],
    })]
  }
}

export async function buildQReportPoints(record: RockMassCaseRecord): Promise<CalculationPointBlock[]> {
  const points: CalculationPointBlock[] = []
  for (let index = 0; index < record.points.length; index += 1) {
    const point = record.points[index]
    const state = normalizeQState(point.input)
    const errors = validateQState(state).filter((issue) => issue.severity === 'error')
    if (errors.length > 0) {
      points.push({
        name: point.name,
        note: point.note,
        oreType: point.oreType,
        resultText: '—',
        gradeText: '—',
        status: `待补充 ${errors.length} 项`,
        inputs: incompleteRows(state),
        evaluation: [`该点位尚有 ${errors.length} 项输入需要补充，未形成工程结论。${errors.map((issue) => issue.message.zh).join('')}`],
      })
      continue
    }
    const result = calculateQ(state)
    points.push({
      name: point.name,
      note: point.note,
      oreType: point.oreType,
      resultText: `Q = ${formatQValue(result.q)}`,
      gradeText: result.grade.label.zh,
      status: '有效',
      inputs: completeRows(state, result),
      evaluation: evaluation(result),
      extras: await chartExtras(result, point.name, index),
    })
  }
  return points
}
