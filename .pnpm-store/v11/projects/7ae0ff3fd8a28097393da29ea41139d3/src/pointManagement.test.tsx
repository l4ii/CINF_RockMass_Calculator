import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ClassificationPointListPage from './components/classification/ClassificationPointListPage'
import RmrPointListPanel from './components/rmr/RmrPointListPanel'
import type { RockMassCaseRecord } from './types/rockmassCase'

const caseRecord: RockMassCaseRecord = {
  id: 'case-1',
  name: '测试工程',
  methodId: 'rmr',
  createdAt: '2026-08-27T00:00:00.000Z',
  updatedAt: '2026-08-27T00:00:00.000Z',
  points: [{
    id: 'point-1',
    name: 'P1',
    note: '测试点位',
    methodId: 'rmr',
    createdAt: '2026-08-27T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z',
  }],
}

const sharedProps = {
  darkMode: false,
  language: 'zh' as const,
  caseRecord,
  message: null,
  onCasePatch: vi.fn(),
  onOpenPoint: vi.fn(),
  onCreatePoint: vi.fn(),
  onDuplicatePoint: vi.fn(),
  onDeletePoint: vi.fn(),
  onGoSummary: vi.fn(),
  onBackToWorkspace: vi.fn(),
}

describe('point management actions', () => {
  it('removes rename from the shared classification point list', () => {
    render(<ClassificationPointListPage {...sharedProps} methodName="BQ分级" getPointResult={() => ({ value: '—', grade: '—', incomplete: true })} />)

    expect(screen.queryByRole('button', { name: '重命名' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '编辑' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '复制' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '删除' })).toBeInTheDocument()
  })

  it('removes rename and right-click rename from the RMR point list', () => {
    render(<RmrPointListPanel {...sharedProps} />)

    const pointButton = screen.getByRole('button', { name: 'P1' })
    fireEvent.contextMenu(pointButton)
    expect(screen.queryByRole('button', { name: '重命名' })).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue('P1')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '编辑' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '复制' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '删除' })).toBeInTheDocument()
  })

  it('shows BQ and corrected [BQ] with both classes in the point list', () => {
    render(
      <ClassificationPointListPage
        {...sharedProps}
        methodName="BQ分级"
        getPointResult={() => ({
          value: 'BQ 375；[BQ] 265',
          grade: 'III 级；IV 级',
          incomplete: false,
          entries: [
            { label: 'BQ', value: '375', grade: 'III 级' },
            { label: '[BQ]', value: '265', grade: 'IV 级' },
          ],
        })}
      />
    )
    expect(screen.getByText('BQ')).toBeInTheDocument()
    expect(screen.getByText('375')).toBeInTheDocument()
    expect(screen.getByText('[BQ]')).toBeInTheDocument()
    expect(screen.getByText('265')).toBeInTheDocument()
    expect(screen.getByText('III 级')).toBeInTheDocument()
    expect(screen.getByText('IV 级')).toBeInTheDocument()
    expect(screen.queryByText(/岩体质量/)).not.toBeInTheDocument()
    expect(screen.queryByText(/\[BQ\] =/)).not.toBeInTheDocument()
  })
})
