import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import QClassificationPage from './components/q/QClassificationPage'
import QModule from './components/q/QModule'
import { createInitialQState, type QFormState } from './methods/q'

function renderPage(initial: QFormState = createInitialQState()) {
  function Harness() {
    const [form, setForm] = useState<Record<string, unknown>>(initial as unknown as Record<string, unknown>)
    return (
      <QClassificationPage
        darkMode={false}
        language="zh"
        caseName="工程"
        pointName="P1"
        pointNote=""
        pointOreType=""
        pointOrdinal={1}
        pointTotal={1}
        form={form}
        issues={[]}
        result={null}
        onFormChange={setForm}
        onPointNameChange={vi.fn()}
        onPointNoteChange={vi.fn()}
        onPointOreTypeChange={vi.fn()}
        onBackToWorkspace={vi.fn()}
        onBackToPoints={vi.fn()}
        onComplete={vi.fn()}
        onNext={vi.fn()}
      />
    )
  }
  render(<Harness />)
}

describe('Q dedicated page', () => {
  it('opens the Q project workspace without crashing', () => {
    render(<QModule darkMode={false} language="zh" onBackToHome={vi.fn()} />)
    expect(screen.getByRole('heading', { name: /项目工作区/ })).toBeInTheDocument()
  })

  it('keeps introduction, formula and the three factor groups in order', () => {
    renderPage()
    const pointInformation = screen.getByText('点位信息')
    const introduction = screen.getByTestId('q-method-introduction')
    const formula = screen.getByTestId('q-formula')
    const block = screen.getByTestId('q-group-block')
    const shear = screen.getByTestId('q-group-shear')
    const stress = screen.getByTestId('q-group-stress')
    expect(pointInformation.compareDocumentPosition(introduction) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(introduction.compareDocumentPosition(formula) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(formula.compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(block.compareDocumentPosition(shear) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(shear.compareDocumentPosition(stress) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByTestId('q-formula').textContent).toMatch(/RQD/)
    expect(screen.getByTestId('q-rqd-input')).toBeInTheDocument()
    expect(screen.getByTestId('q-jn-input')).toBeInTheDocument()
    expect(screen.getByTestId('q-jr-input')).toBeInTheDocument()
    expect(screen.getByTestId('q-ja-input')).toBeInTheDocument()
    expect(screen.getByTestId('q-jw-input')).toBeInTheDocument()
    expect(screen.getByTestId('q-srf-input')).toBeInTheDocument()
    expect(screen.queryByText(/开挖跨度/)).not.toBeInTheDocument()
    const preview = screen.getByTestId('q-result-preview')
    expect(preview).toHaveTextContent('分值预览')
    expect(preview).toHaveTextContent('已选 0 / 6')
    expect(preview).toHaveTextContent('评价结果')
    expect(preview).toHaveTextContent('输入六项参数后显示正式等级')
  })

  it('centers every point-information field', () => {
    renderPage()
    const section = screen.getByText('点位信息').closest('section')
    expect(section).toBeTruthy()
    const inputs = section!.querySelectorAll('input')
    expect(inputs.length).toBe(4)
    inputs.forEach((input) => {
      expect(input.className).toContain('text-center')
    })
  })

  it('opens the RQD quick calculator from the underlined control', () => {
    renderPage()
    const quick = screen.getByTestId('q-rqd-quick-open')
    expect(quick.parentElement?.className).toContain('justify-end')
    fireEvent.click(quick)
    expect(screen.getByRole('dialog', { name: 'RQD 快速计算' })).toBeInTheDocument()
  })

  it('fills Jn from the Barton table dialog', () => {
    renderPage()
    fireEvent.click(screen.getByTestId('q-jn-quick-open'))
    const calculator = screen.getByTestId('q-factor-calculator')
    expect(calculator).toHaveTextContent('节理组数')
    fireEvent.click(screen.getByTestId('q-factor-row-two_sets'))
    fireEvent.click(screen.getByRole('button', { name: '确认并回填' }))
    expect(screen.getByTestId('q-jn-input')).toHaveValue(4)
    expect(screen.getByTestId('q-result-preview')).toHaveTextContent('已选 1 / 6')
  })

  it('computes Q and the class after the six ratings are entered', () => {
    renderPage()
    fireEvent.change(screen.getByTestId('q-rqd-input'), { target: { value: '80' } })
    fireEvent.change(screen.getByTestId('q-jn-input'), { target: { value: '4' } })
    fireEvent.change(screen.getByTestId('q-jr-input'), { target: { value: '3' } })
    fireEvent.change(screen.getByTestId('q-ja-input'), { target: { value: '1' } })
    fireEvent.change(screen.getByTestId('q-jw-input'), { target: { value: '1' } })
    fireEvent.change(screen.getByTestId('q-srf-input'), { target: { value: '1' } })
    const preview = screen.getByTestId('q-result-preview')
    expect(preview).toHaveTextContent('已选 6 / 6')
    expect(preview).toHaveTextContent('60')
    expect(preview).toHaveTextContent('很好')
  })

  it('flags out-of-range Jn without changing the preview layout', () => {
    renderPage()
    fireEvent.change(screen.getByTestId('q-jn-input'), { target: { value: '21' } })
    expect(screen.getByText('异常值：请输入 0.5～20 范围内的 Jn。')).toBeInTheDocument()
    const preview = screen.getByTestId('q-result-preview')
    expect(preview).toHaveTextContent('已选 0 / 6')
    expect(preview).toHaveTextContent('评价结果')
  })
})
