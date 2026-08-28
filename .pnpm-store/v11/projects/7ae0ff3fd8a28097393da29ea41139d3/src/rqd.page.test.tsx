import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import RqdMethodForm from './components/classification/forms/RqdMethodForm'
import { createInitialRqdState } from './methods/rqd'

function renderForm() {
  const onChange = vi.fn()
  render(
    <RqdMethodForm
      form={createInitialRqdState() as unknown as Record<string, unknown>}
      onChange={onChange}
      darkMode={false}
      language="zh"
    />
  )
  return onChange
}

describe('RQD calculation form', () => {
  it('places qualifying core length before total drill-hole length', () => {
    renderForm()
    const qualifying = screen.getByLabelText('长度 ≥ 10 cm 的岩芯累计长度')
    const total = screen.getByLabelText('钻孔总长')
    expect(qualifying.compareDocumentPosition(total) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText(/完整岩芯试样/)).toBeInTheDocument()
    expect(screen.getByText(/同一岩芯回次/)).toBeInTheDocument()
  })

  it('keeps the existing RQD equation and puts the class table in the result area', () => {
    renderForm()
    expect(screen.getByTestId('rqd-formula')).toHaveTextContent('长度')
    expect(screen.getByTestId('rqd-result-section')).toBeInTheDocument()
    expect(screen.getByTestId('rqd-result-section').querySelector('[data-testid="rqd-grade-reference"]')).toBeTruthy()
  })

  it('blocks wheel and arrow stepping for RQD numeric inputs', () => {
    renderForm()
    const input = screen.getByLabelText('长度 ≥ 10 cm 的岩芯累计长度')
    const blur = vi.spyOn(input, 'blur')
    fireEvent.wheel(input, { deltaY: 100 })
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(blur).toHaveBeenCalledTimes(1)
    expect(input).toHaveClass('rqd-number-input')
  })
})
