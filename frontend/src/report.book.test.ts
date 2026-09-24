import JSZip from 'jszip'
import { expect, it } from 'vitest'
import { bqAdapter } from './methods/adapters/bqAdapter'
import { gsiAdapter } from './methods/adapters/gsiAdapter'
import { rqdAdapter } from './methods/adapters/rqdAdapter'
import { createInitialBqState } from './methods/bq'
import { createInitialGsiState } from './methods/gsi'
import { createInitialRqdState } from './methods/rqd'
import type { RockMassCaseRecord, RockMassPointRecord } from './types/rockmassCase'
import { buildClassificationReportBlob } from './utils/classificationReportDocx'
import { buildCaseReportBlob } from './utils/rockmassReportDocx'
import { initialRmrFormState } from './utils/rmrCalc'
import type { AnyClassificationAdapter } from './methods/types'

async function documentText(blob: Blob) {
  const buffer = await blob.arrayBuffer()
  const zip = await JSZip.loadAsync(buffer)
  const xml = await zip.file('word/document.xml')!.async('string')
  const text = new DOMParser().parseFromString(xml, 'text/xml').documentElement.textContent ?? ''
  return { xml, text }
}

function record(methodId: RockMassCaseRecord['methodId'], points: RockMassPointRecord[]): RockMassCaseRecord {
  return { id: 'report', name: '计算书项目', methodId, engineering: '主斜井', location: '-450 m', createdAt: '', updatedAt: '', points }
}

function point(methodId: RockMassPointRecord['methodId'], name: string, input: Record<string, unknown>, extra: Partial<RockMassPointRecord> = {}): RockMassPointRecord {
  return { id: name, name, methodId, createdAt: '', updatedAt: '', input, ...extra }
}

async function book(adapter: AnyClassificationAdapter, points: RockMassPointRecord[]) {
  return documentText(await buildClassificationReportBlob(record(adapter.id, points), adapter))
}

it('writes the shared cover, fonts and only the RQD inputs that were entered', async () => {
  const { xml, text } = await book(rqdAdapter, [
    point('rqd', '回次1', { ...createInitialRqdState(), coreRunLength: 2, soundCoreLength: 1.8 }),
  ])
  expect(text).toContain('软件简介')
  expect(text.trimStart().startsWith('RQD分级计算书')).toBe(true)
  expect(text.indexOf('RQD分级计算书')).toBeLessThan(text.indexOf('Q、'))
  expect(text).not.toContain('Q分级计算书')
  expect(xml).toContain('方正小标宋简体')
  expect(xml).toContain('仿宋_GB2312')
  expect(xml).toContain('Times New Roman')
  expect(xml.match(/<w:sectPr/g)?.length).toBeGreaterThanOrEqual(2)
  expect(text).toContain('钻孔总长')
  expect(text).toContain('1.8 m')
  expect(text).toContain('岩体质量极好')
  expect(text).not.toContain('节理组数')
})

it('omits unused BQ corrections from a basic-quality point', async () => {
  const { text } = await book(bqAdapter, [
    point('bq', '基本点', { ...createInitialBqState(), mode: 'basic', rc: 50, kv: 0.5 }),
  ])
  expect(text).toContain('基本 BQ')
  expect(text).toContain('50 MPa')
  expect(text).toContain('规范限定：未触发')
  expect(text).not.toContain('K1')
  expect(text).not.toContain('修正进度')
})

it('keeps a chart-method GSI point to the structure and surface that were selected', async () => {
  const blob = await buildClassificationReportBlob(record('gsi', [
    point('gsi', '图表点', { ...createInitialGsiState(), entryMode: 'chart', structureId: 'blocky', surfaceQualityId: 'good' }),
    point('gsi', '未完成', { ...createInitialGsiState(), entryMode: 'chart' }),
  ]), gsiAdapter)
  const buffer = await blob.arrayBuffer()
  const zip = await JSZip.loadAsync(buffer)
  const xml = await zip.file('word/document.xml')!.async('string')
  const text = new DOMParser().parseFromString(xml, 'text/xml').documentElement.textContent ?? ''
  const core = await zip.file('docProps/core.xml')!.async('string')
  const figures = Object.keys(zip.files).filter((name) => name.endsWith('.svg'))
  expect(text.trimStart().startsWith('GSI岩体分级计算书')).toBe(true)
  expect(text).not.toContain('Q分级计算书')
  expect(text).not.toContain('Q 支护')
  expect(core).toContain('GSI岩体分级计算书')
  expect(core).not.toContain('Q分级')
  expect(text).toContain('图表法')
  expect(text).toContain('较完整块状岩体')
  expect(text).toContain('刻度 A')
  expect(text).toContain('图 1：图表点 节理岩体地质强度指标图')
  expect(text).toContain('不附分级图')
  expect(text).not.toContain('JCond')
  expect(figures).toHaveLength(1)
  const svg = await zip.file(figures[0])!.async('string')
  expect(svg).toContain('节理岩体地质强度指标（GSI）')
  expect(svg).toContain('gsi-report-point')
  expect(svg).toContain('较完整块状岩体')
  expect(svg).not.toContain('Q 支护')
})

it('attaches the quantified chart to a quantitative GSI point', async () => {
  const blob = await buildClassificationReportBlob(record('gsi', [
    point('gsi', '定量点', {
      ...createInitialGsiState(),
      entryMode: 'quantitative',
      rqdSource: 'measured',
      rqd: 80,
      surfaceMethod: 'jcond89',
      jcond89Value: 20,
    }),
  ]), gsiAdapter)
  const zip = await JSZip.loadAsync(await blob.arrayBuffer())
  const figures = Object.keys(zip.files).filter((name) => name.endsWith('.svg'))
  expect(figures).toHaveLength(1)
  const svg = await zip.file(figures[0])!.async('string')
  expect(svg).toContain('量化地质强度指标（GSI）')
  expect(svg).toContain('gsi-report-point')
  expect(svg).toContain('定量点')
})

it('uses the shared book for RMR and lists only the ratings that were chosen', async () => {
  const partial = { ...initialRmrFormState(), a1Mode: 'ucs' as const, a1OptionId: 'ucs_100_250', a1UcsValue: 120 }
  const complete = {
    ...partial,
    a2OptionId: 'rqd_75_90',
    a2RqdValue: 80,
    a3OptionId: 'sp_0_6_2',
    a3SpacingValue: 100,
    a4SimpleId: 'a4_30',
    a5OptionId: 'cond_dry',
    a6Favorability: 'fair' as const,
  }
  const partialBook = await documentText(await buildCaseReportBlob(record('rmr', [
    point('rmr', '未完成', {}, { rmr: partial }),
  ])))
  const completeBook = await documentText(await buildCaseReportBlob(record('rmr', [
    point('rmr', '完成点', {}, { rmr: complete }),
  ])))
  expect(partialBook.text).toContain('软件简介')
  expect(partialBook.xml).toContain('方正小标宋简体')
  expect(partialBook.xml).toContain('仿宋_GB2312')
  expect(partialBook.text).toContain('A1 · 完整岩石材料的强度')
  expect(partialBook.text).not.toContain('A3 · 结构面间距')
  expect(partialBook.text).not.toContain('点位输入汇总')
  expect(completeBook.text).toContain('自稳时间')
  expect(completeBook.text).toContain('粘聚力')
  expect(completeBook.text).not.toContain('点位输入汇总')
})
