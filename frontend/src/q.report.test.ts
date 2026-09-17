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
  expect(text.match(/Q 分级分析与支护需求判定/g)).toHaveLength(3)
  expect(text).toContain('五级分级依据：I 级，Q ＞ 40；Q = 60')
  expect(text).toContain('岩块尺寸指标 RQD / Jn：20')
  expect(text).toContain('需求比 De/De_max')
  expect(text).toContain('未提供跨度或 ESR')
  expect(text).toContain('当前点位超出示意范围，不绘制定位点')
  expect(text.match(/Q 分级等级划分/g)).toHaveLength(1)
  expect(text).not.toMatch(/图7-1|书名|照片|九档|质量描述|初判/)
  expect(text).not.toContain('很好')
  const figures = Object.keys(zip.files).filter((name) => name.endsWith('.svg'))
  expect(figures).toHaveLength(3)
  for (const figure of figures) expect(await zip.file(figure)!.async('string')).not.toMatch(/异常差|异常好|很好|极好/)
  expect(await zip.file(figures[0])!.async('string')).toContain('q-chart-point')
  expect(await zip.file(figures[1])!.async('string')).not.toContain('q-chart-point')
  expect(await zip.file(figures[2])!.async('string')).not.toContain('q-chart-point')
  expect(Object.keys(zip.files).some((name) => name.endsWith('.png'))).toBe(true)
})
