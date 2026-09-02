import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import MrmrClassificationPage from './components/mrmr/MrmrClassificationPage'
import { createInitialMrmrState } from './methods/mrmr'

describe('MRMR dedicated page', () => {
  it('keeps the workflow in the approved order and uses the RMR result pane', () => {
    render(<MrmrClassificationPage darkMode={false} language="zh" caseName="工程" pointName="P1" pointNote="" pointOreType="" pointOrdinal={1} pointTotal={1} value={createInitialMrmrState()} onChange={vi.fn()} onPointNameChange={vi.fn()} onPointNoteChange={vi.fn()} onPointOreTypeChange={vi.fn()} onBackToWorkspace={vi.fn()} onBackToPoints={vi.fn()} onComplete={vi.fn()} onCompleteAndNext={vi.fn()} />)
    const headings = [
      screen.getByRole('heading', { name: /MRMR 适用性判断/ }),
      screen.getByRole('heading', { name: /完整岩石强度/ }),
      screen.getByRole('heading', { name: /开放节理间距/ }),
      screen.getByRole('heading', { name: /结构面条件/ }),
      screen.getByRole('heading', { name: /原位岩体质量/ }),
    ]
    headings.slice(0, -1).forEach((heading, index) => {
      expect(heading.compareDocumentPosition(headings[index + 1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
    expect(screen.getByTestId('calculation-result-pane')).toBeInTheDocument()
  })

  it('shows the method introduction and formulas before the parameter workflow', () => {
    render(<MrmrClassificationPage darkMode={false} language="zh" caseName="工程" pointName="P1" pointNote="" pointOreType="" pointOrdinal={1} pointTotal={1} value={createInitialMrmrState()} onChange={vi.fn()} onPointNameChange={vi.fn()} onPointNoteChange={vi.fn()} onPointOreTypeChange={vi.fn()} onBackToWorkspace={vi.fn()} onBackToPoints={vi.fn()} onComplete={vi.fn()} onCompleteAndNext={vi.fn()} />)
    const pointInformation = screen.getByText('点位信息')
    const introduction = screen.getByTestId('mrmr-method-introduction')
    const formula = screen.getByTestId('mrmr-formula')
    const applicability = screen.getByRole('heading', { name: /MRMR 适用性判断/ })

    expect(pointInformation.compareDocumentPosition(introduction) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(introduction).toBeInTheDocument()
    expect(formula).toBeInTheDocument()
    expect(introduction.compareDocumentPosition(formula) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(formula.compareDocumentPosition(applicability) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(formula.textContent).toContain('RBS')
    expect(formula.textContent).toContain('IRMR')
    expect(formula.textContent).toContain('MRMR')
    expect(formula.className).not.toContain('text-[11px]')
  })

  it('labels the reusable rock-mass group field as 岩矿类型', () => {
    render(<MrmrClassificationPage darkMode={false} language="zh" caseName="工程" pointName="P1" pointNote="" pointOreType="" oreTypeOptions={['花岗岩']} pointOrdinal={1} pointTotal={1} value={createInitialMrmrState()} onChange={vi.fn()} onPointNameChange={vi.fn()} onPointNoteChange={vi.fn()} onPointOreTypeChange={vi.fn()} onBackToWorkspace={vi.fn()} onBackToPoints={vi.fn()} onComplete={vi.fn()} onCompleteAndNext={vi.fn()} />)
    const input = screen.getByLabelText('岩矿类型')
    expect(input.className).toMatch(/text-center/)
    fireEvent.click(screen.getByRole('button', { name: '打开岩矿类型列表' }))
    expect(screen.getByRole('option', { name: '花岗岩' })).toBeInTheDocument()
  })
})
