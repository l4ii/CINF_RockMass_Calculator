import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MrmrClassificationPage from './components/mrmr/MrmrClassificationPage'
import { createInitialMrmrState } from './methods/mrmr'

describe('MRMR dedicated page', () => {
  it('keeps the workflow in the approved order and uses the RMR result pane', () => {
    render(<MrmrClassificationPage darkMode={false} language="zh" caseName="工程" pointName="P1" pointNote="" pointOreType="" pointOrdinal={1} pointTotal={1} value={createInitialMrmrState()} onChange={vi.fn()} onPointNameChange={vi.fn()} onPointNoteChange={vi.fn()} onPointOreTypeChange={vi.fn()} onBackToWorkspace={vi.fn()} onBackToPoints={vi.fn()} onComplete={vi.fn()} onCompleteAndNext={vi.fn()} />)
    const headings = [
      screen.getByText('1. MRMR 适用性判断'),
      screen.getByText('2. 完整岩石强度 IRS、尺寸修正'),
      screen.getByText('3. 开放节理间距 JS'),
      screen.getByText('4. 结构面条件 JC'),
      screen.getByText('5. 原位岩体质量 IRMR'),
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
    const applicability = screen.getByText('1. MRMR 适用性判断')

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
})
