import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import RmrClassificationPage from './components/rmr/RmrClassificationPage'
import { initialRmrFormState, type RmrFormState } from './utils/rmrCalc'

function renderPage(initial: RmrFormState = initialRmrFormState()) {
  function Harness() {
    const [form, setForm] = useState<RmrFormState>(initial)
    return (
      <RmrClassificationPage
        darkMode={false}
        language="zh"
        caseName="工程"
        pointName="P1"
        pointNote=""
        pointOreType=""
        oreTypeOptions={['花岗岩']}
        pointOrdinal={1}
        pointTotal={1}
        value={form}
        onChange={setForm}
        onPointNameChange={vi.fn()}
        onPointNoteChange={vi.fn()}
        onPointOreTypeChange={vi.fn()}
        onBackToWorkspace={vi.fn()}
        onBackToPoints={vi.fn()}
        onComplete={vi.fn()}
        onCompleteAndNext={vi.fn()}
      />
    )
  }
  render(<Harness />)
}

describe('RMR dedicated page', () => {
  it('opens the RQD quick calculator from the underlined control under the input', () => {
    renderPage()
    const input = screen.getByTestId('rmr-rqd-input')
    const quick = screen.getByTestId('rmr-rqd-quick-open')
    expect(quick).toHaveTextContent('快速计算')
    expect(quick.parentElement?.className).toContain('justify-end')
    expect(input.compareDocumentPosition(quick) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByText('进入 RQD 计算')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'RQD 快速计算' })).not.toBeInTheDocument()
    fireEvent.click(quick)
    const dialog = screen.getByRole('dialog', { name: 'RQD 快速计算' })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '确认并回填 RQD' })).toBeInTheDocument()
  })

  it('keeps the shared point-note placeholder', () => {
    renderPage()
    expect(screen.getByLabelText('点位说明（桩号 / 钻孔号）')).toHaveAttribute('placeholder', '如：ZK-07，深度 45 ~ 52 m')
  })
})
