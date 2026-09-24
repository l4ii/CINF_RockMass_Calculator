import JSZip from 'jszip'
import { afterEach, expect, it, vi } from 'vitest'
import { qAdapter } from './methods/adapters/qAdapter'
import { createInitialQState } from './methods/q'
import type { RockMassCaseRecord } from './types/rockmassCase'
import { buildClassificationReportBlob } from './utils/classificationReportDocx'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('exports Q analysis and a chart for valid points, with explicit unavailable support for span-free points', async () => {
  // jsdom does not implement image decoding or canvas; the real SVG and DOCX remain under test.
  vi.stubGlobal('Image', class {
    onload: (() => void) | null = null
    set src(_value: string) { queueMicrotask(() => this.onload?.()) }
  })
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:q-chart', revokeObjectURL: () => {} })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    fillRect: () => {}, drawImage: () => {}, fillStyle: '',
  } as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=')
  const input = { ...createInitialQState(), rqd: 80, jnValue: 4, jrValue: 3, jaValue: 1, jwValue: 1, srfValue: 1 }
  const record: RockMassCaseRecord = {
    id: 'q-report', name: 'Q 报告', methodId: 'q', createdAt: '', updatedAt: '',
    points: [
      { id: 'complete', name: '已计算点', methodId: 'q', createdAt: '', updatedAt: '', input: { ...input, span: 4, esrId: 'permanent_general', esrValue: 1.6 } },
      { id: 'chart', name: '图表法点', methodId: 'q', createdAt: '', updatedAt: '', input: { ...input, span: 8, esrId: 'major_civil', esrValue: 1, supportMode: 'chart' } },
      { id: 'no-span', name: '未提供跨度点', methodId: 'q', createdAt: '', updatedAt: '', input },
      { id: 'outside', name: '图外点', methodId: 'q', createdAt: '', updatedAt: '', input: { ...input, span: 200, esrId: 'permanent_general', esrValue: 1.6 } },
      { id: 'invalid', name: '未完成点', methodId: 'q', createdAt: '', updatedAt: '', input: {} },
    ],
  }
  const blob = await buildClassificationReportBlob(record, qAdapter)
  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
  const zip = await JSZip.loadAsync(buffer)
  const xml = await zip.file('word/document.xml')!.async('string')
  const text = new DOMParser().parseFromString(xml, 'text/xml').documentElement.textContent!
  expect(text).toContain('软件简介')
  expect(text).toContain('CINF矿山岩体质量分级软件')
  expect(xml).toContain('方正小标宋简体')
  expect(xml).toContain('仿宋_GB2312')
  expect(xml).toContain('Times New Roman')
  expect(xml.match(/<w:sectPr/g)?.length).toBeGreaterThanOrEqual(2)
  expect(text.match(/计算过程：/g)).toHaveLength(4)
  expect(text).not.toContain('Q 分级分析与支护需求判定')
  expect(text).toContain('五级分级依据：I 级，Q ＞ 40；Q = 60')
  expect(text).toContain('岩块尺寸指标 RQD / Jn：20')
  expect(text).toContain('需求比 De/De_max')
  expect(text).toContain('类别 1')
  expect(text).toContain('锚杆长度 L = 2 + 0.15 De')
  expect(text).toContain('等值线之间内插')
  expect(text).toContain('未提供跨度或 ESR')
  expect(text).toContain('当前点位超出示意范围，不绘制定位点')
  expect(text.match(/五级分级依据/g)?.length).toBe(4)
  expect(text).not.toMatch(/图7-1|书名|照片|九档|质量描述|初判/)
  expect(text).not.toContain('很好')
  expect(text).toContain('无支护极限按')
  expect(text).toContain('永久支护图读取')
  const figures = Object.keys(zip.files).filter((name) => name.endsWith('.svg'))
  expect(figures).toHaveLength(4)
  const limitSvg = await zip.file(figures[0])!.async('string')
  const chartSvg = await zip.file(figures[1])!.async('string')
  expect(limitSvg).toContain('q-chart-point')
  expect(limitSvg).not.toMatch(/异常差|异常好|很好|极好/)
  expect(chartSvg).toContain('q-ng-chart-point')
  expect(chartSvg).toContain('岩体质量与支护')
  expect(chartSvg).toContain('异常差')
  expect(chartSvg).toContain('很好')
  expect(chartSvg).toContain('当量尺寸 De')
  expect(chartSvg.match(/data-testid="q-ng-quality-letter"/g)).toHaveLength(7)
  expect(chartSvg.match(/data-testid="q-ng-q-tick"/g)).toHaveLength(12)
  expect(chartSvg.match(/data-testid="q-ng-de-tick"/g)).toHaveLength(7)
  expect(chartSvg.match(/data-testid="q-ng-category-mark"/g)).toHaveLength(9)
  expect(chartSvg).toContain('q-ng-header')
  expect(chartSvg).toContain('q-ng-energy-tooltip')
  expect(chartSvg).not.toMatch(/<text[^>]*>E = /)
  expect(chartSvg).toContain('q-ng-bolt-axis')
  expect(chartSvg).toMatch(/rotate\(-90\)/)
  expect(chartSvg).not.toContain('ROCK MASS QUALITY')
  expect(chartSvg).not.toContain('Exceptionally poor')
  expect(await zip.file(figures[2])!.async('string')).not.toContain('q-chart-point')
  expect(await zip.file(figures[3])!.async('string')).not.toContain('q-chart-point')
  expect(Object.keys(zip.files).some((name) => name.endsWith('.png'))).toBe(true)
})
