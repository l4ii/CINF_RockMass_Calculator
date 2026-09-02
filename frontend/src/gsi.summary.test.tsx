import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GsiSummaryPage from './components/gsi/GsiSummaryPage'
import { createInitialGsiState, type GsiFormState } from './methods/gsi'
import type { RockMassCaseRecord, RockMassPointRecord } from './types/rockmassCase'

function point(id: string, name: string, input: Partial<GsiFormState>, extra: Partial<RockMassPointRecord> = {}): RockMassPointRecord {
  return {
    id,
    name,
    createdAt: '',
    updatedAt: '',
    methodId: 'gsi',
    input: { ...createInitialGsiState(), ...input },
    ...extra,
  }
}

const caseRecord: RockMassCaseRecord = {
  id: 'case',
  name: '深部开拓',
  methodId: 'gsi',
  engineering: '主斜井',
  location: '-450 m',
  createdAt: '',
  updatedAt: '',
  points: [
    point('chart', '图表点', { entryMode: 'chart', structureId: 'blocky', surfaceQualityId: 'good' }, { oreType: '花岗岩' }),
    point('quant', '定量点', { entryMode: 'quantitative', rqd: 40, jcond89Value: 10 }, { oreType: '板岩' }),
    point('mid', '中等点', { entryMode: 'chart', structureId: 'very_blocky', surfaceQualityId: 'fair' }),
  ],
}

function renderOverview() {
  render(
    <GsiSummaryPage
      darkMode={false}
      language="zh"
      methodName="GSI分级"
      caseRecord={caseRecord}
      message={null}
      onBackToWorkspace={vi.fn()}
      onBackToPoints={vi.fn()}
      onOpenPoint={vi.fn()}
      onOpenExport={vi.fn()}
    />
  )
}

describe('GSI project overview', () => {
  it('keeps the ledger before charts and unifies mixed entry paths', () => {
    renderOverview()
    const toolbar = screen.getByTestId('gsi-overview-toolbar')
    const ledger = screen.getByTestId('gsi-point-scores')
    const analysis = screen.getByTestId('gsi-overview-analysis')
    const statistics = screen.getByTestId('gsi-overview-statistics')
    expect(toolbar.compareDocumentPosition(ledger) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(ledger.compareDocumentPosition(analysis) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(analysis.compareDocumentPosition(statistics) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByText('点位总数')).not.toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '刻度 A' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '刻度 B' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '工程点群图' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '放大' })).toBeInTheDocument()
    expect(screen.getByText('刻度 A = 1.5 JCond89')).toBeInTheDocument()
    expect(screen.getByText('刻度 B = RQD/2')).toBeInTheDocument()
    expect(screen.queryByTestId('gsi-overview-cloud-note')).not.toBeInTheDocument()
    expect(screen.getByText('岩体结构分布')).toBeInTheDocument()
    expect(ledger).toHaveTextContent('77.5')
    expect(ledger).toHaveTextContent('37.5')
    expect(ledger).toHaveTextContent('40')
    expect(ledger).toHaveTextContent('35')
    expect(ledger).toHaveTextContent('15')
    expect(ledger).toHaveTextContent('20')
    expect(ledger).toHaveTextContent('图表法')
    expect(ledger).toHaveTextContent('定量法')
    expect(ledger).toHaveTextContent('较完整块状岩体')
    expect(ledger).toHaveTextContent('扰动岩体')
    fireEvent.click(screen.getByRole('button', { name: '显示详情 图表点' }))
    expect(screen.getByText(/GSI = 刻度 A \+ 刻度 B/)).toBeInTheDocument()
    const detailTable = screen.getByText('公式').closest('table')
    expect(detailTable).toHaveTextContent('计算入口')
    expect(detailTable).not.toHaveTextContent('RQD')
  })

  it('filters and sorts points while keeping the same data in charts', () => {
    renderOverview()
    fireEvent.change(screen.getByRole('spinbutton', { name: 'GSI 最小值' }), { target: { value: '50' } })
    expect(screen.queryByRole('button', { name: '定量点' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '图表点' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '中等点' })).toBeInTheDocument()
    expect(screen.getByText('可计算点位').nextElementSibling).toHaveTextContent('2')
    fireEvent.change(screen.getByRole('combobox', { name: '排序字段' }), { target: { value: 'gsi' } })
    const bodyRows = [...screen.getByTestId('gsi-point-scores').querySelectorAll('tbody tr')].filter((row) => row.querySelectorAll('td').length > 2)
    expect(bodyRows[0]).toHaveTextContent('中等点')
    expect(bodyRows[1]).toHaveTextContent('图表点')
  })

  it('enlarges the GSI overlay without clipping axis ticks', () => {
    renderOverview()
    fireEvent.click(screen.getByRole('button', { name: '放大' }))
    const dialog = screen.getByRole('dialog', { name: '工程点群图' })
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveTextContent('图表点')
    fireEvent.click(screen.getByRole('button', { name: '关闭' }))
    expect(screen.queryByRole('dialog', { name: '工程点群图' })).not.toBeInTheDocument()
  })
})
