import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import BqSummaryPage from './components/bq/BqSummaryPage'
import { bqAdapter } from './methods/adapters/bqAdapter'
import { createInitialBqState } from './methods/bq'
import type { ClassificationSummaryRow } from './components/classification/ClassificationSummaryPage'
import type { RockMassCaseRecord } from './types/rockmassCase'

function row(id: string, name: string, rc: number, kv: number): ClassificationSummaryRow {
  const form = { ...createInitialBqState(), rc, kv }
  const result = bqAdapter.calculate(form as unknown as Record<string, unknown>)
  return {
    point: { id, name, createdAt: '', updatedAt: '', methodId: 'bq', input: form },
    result,
    descriptions: bqAdapter.describe(form as unknown as Record<string, unknown>, result),
    issueCount: 0,
  }
}

const caseRecord: RockMassCaseRecord = { id: 'case', name: '工程', methodId: 'bq', createdAt: '', updatedAt: '', points: [] }

describe('BQ project overview', () => {
  it('filters and sorts points while rendering the overview charts', () => {
    const rows = [row('p1', 'A 点', 50, 0.5), row('p2', 'B 点', 90, 0.6)]
    render(<BqSummaryPage darkMode={false} language="zh" methodName="BQ" standard={bqAdapter.standard} caseRecord={caseRecord} rows={rows} message={null} onBackToWorkspace={vi.fn()} onBackToPoints={vi.fn()} onOpenPoint={vi.fn()} onOpenExport={vi.fn()} />)
    expect(screen.getByText('BQ 区间分布')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '参数与 BQ 关系' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '有效 Rc' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '有效 Kv' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'K1' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'K2' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'K3' })).toBeInTheDocument()
    const minRc = screen.getByRole('spinbutton', { name: 'Rc 最小值' })
    fireEvent.change(minRc, { target: { value: '70' } })
    expect(screen.queryByRole('button', { name: 'A 点' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'B 点' })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox', { name: '排序' }), { target: { value: 'name' } })
    expect(screen.getByText('有效结果').nextElementSibling).toHaveTextContent('1')
  })
})
