import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import GsiClassificationPage from './components/gsi/GsiClassificationPage'
import GsiModule from './components/gsi/GsiModule'
import { createInitialGsiState, type GsiFormState } from './methods/gsi'

function renderPage(initial: GsiFormState = createInitialGsiState()) {
  function Harness() {
    const [form, setForm] = useState<GsiFormState>(initial)
    return (
      <GsiClassificationPage
        darkMode={false}
        language="zh"
        caseName="工程"
        pointName="P1"
        pointNote=""
        pointOreType=""
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

describe('GSI dedicated page', () => {
  it('opens the GSI project workspace without crashing', () => {
    render(<GsiModule darkMode={false} language="zh" methodName="GSI分级" onBackToHome={vi.fn()} />)
    expect(screen.getByRole('heading', { name: /项目工作区/ })).toBeInTheDocument()
  })

  it('starts with the Scale A/B chart after the introduction', () => {
    renderPage()
    const pointInformation = screen.getByText('点位信息')
    const introduction = screen.getByTestId('gsi-method-introduction')
    const formula = screen.getByTestId('gsi-formula')
    const chart = screen.getByTestId('gsi-chart')
    expect(pointInformation.compareDocumentPosition(introduction) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(introduction.compareDocumentPosition(formula) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(formula.compareDocumentPosition(chart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByTestId('gsi-quantitative')).not.toBeInTheDocument()
    expect(screen.queryByText('本点位是否适用量化 GSI 图？')).not.toBeInTheDocument()
    expect(screen.getByTestId('calculation-result-pane')).toBeInTheDocument()
    expect(screen.getByTestId('gsi-method-introduction')).toContainElement(screen.getByTestId('gsi-entry-mode'))
    expect(screen.getByRole('heading', { name: /^地质强度指标（GSI）$/ })).toBeInTheDocument()
    expect(screen.getByTestId('gsi-formula').textContent).toContain('GSI')
    expect(screen.getByTestId('gsi-formula').textContent).toMatch(/Scale/)
    expect(screen.getByRole('heading', { name: /^图表法$/ })).toBeInTheDocument()
    expect(screen.queryByText(/请点选格点/)).not.toBeInTheDocument()
    expect(screen.getByText('完整块状岩体')).toBeInTheDocument()
    expect(screen.getByText('鳞片状岩体')).toBeInTheDocument()
    const preview = screen.getByTestId('gsi-result-preview')
    expect(preview).toHaveTextContent('分值预览')
    expect(preview).toHaveTextContent('已选 0 / 2')
    expect(preview).toHaveTextContent('岩体结构')
    expect(preview).toHaveTextContent('表面条件')
    expect(preview).toHaveTextContent('刻度 A')
    expect(preview).toHaveTextContent('刻度 B')
    expect(preview).toHaveTextContent('评价结果')
    expect(preview).toHaveTextContent('在图上点选格点后显示正式等级')
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

  it('shows the Chinese Scale A/B chart by default and scores a clicked cell', () => {
    renderPage()
    expect(screen.getByTestId('gsi-chart')).toBeInTheDocument()
    expect(screen.queryByTestId('gsi-quantitative')).not.toBeInTheDocument()
    expect(screen.getByText('非常好')).toBeInTheDocument()
    const chartIntro = screen.getByRole('heading', { name: /^图表法$/ }).closest('section')?.querySelector('p')?.textContent ?? ''
    expect(chartIntro).toMatch(/对应 Scale A/)
    expect(chartIntro).toMatch(/对应 Scale B/)
    expect(chartIntro.indexOf('Scale A')).toBeLessThan(chartIntro.indexOf('Scale B'))
    expect(screen.getByTestId('gsi-chart').textContent).not.toContain('Scale A')
    expect(screen.getByTestId('gsi-chart').textContent).not.toContain('Scale B')
    expect(screen.getByTestId('gsi-cell-intact-very_poor')).toHaveTextContent('N/A')
    fireEvent.click(screen.getByTestId('gsi-cell-blocky-good'))
    expect(screen.getByTestId('gsi-result-preview')).toHaveTextContent('77.5')
    expect(screen.getByTestId('gsi-result-preview')).toHaveTextContent('已选 2 / 2')
    expect(screen.getByTestId('gsi-result-preview')).toHaveTextContent('刻度 A')
    expect(screen.getByTestId('gsi-result-preview')).toHaveTextContent('较完整块状岩体')
    expect(screen.getByTestId('gsi-result-preview')).not.toHaveTextContent('JCond89')
  })

  it('switches to quantitative inputs, formula, and the 4-row chart', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '定量法' }))
    expect(screen.getByTestId('gsi-quantitative')).toBeInTheDocument()
    expect(screen.queryByTestId('gsi-chart')).not.toBeInTheDocument()
    expect(screen.getByTestId('gsi-formula').textContent).toMatch(/1\.5/)
    expect(screen.getByTestId('gsi-jcond89-input')).toBeInTheDocument()
    expect(screen.getByTestId('gsi-rqd-input')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^地质强度指标（GSI）$/ })).toBeInTheDocument()
    expect(screen.getByTestId('gsi-quantitative')).toHaveTextContent(/节理状态/)
    expect(screen.getByTestId('gsi-quantitative')).toHaveTextContent(/岩石质量指标/)
    const jcondQuick = screen.getByTestId('gsi-jcond89-quick-open')
    expect(jcondQuick.parentElement?.className).toContain('justify-end')
    expect(screen.getByTestId('gsi-jcond89-input').compareDocumentPosition(jcondQuick) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByTestId('gsi-rqd-input').compareDocumentPosition(screen.getByTestId('gsi-rqd-quick-open')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByTestId('gsi-quantitative-chart')).toBeInTheDocument()
    expect(screen.getByText('块状结构')).toBeInTheDocument()
    expect(screen.getByText('裂隙块状结构')).toBeInTheDocument()
    expect(screen.getByText('层状破裂结构')).toBeInTheDocument()
    expect(screen.getByText('碎裂结构')).toBeInTheDocument()
    expect(screen.queryByText('完整块状岩体')).not.toBeInTheDocument()
    expect(screen.queryByText('鳞片状岩体')).not.toBeInTheDocument()
    expect(screen.queryByText('JCond89 实测不到？')).not.toBeInTheDocument()
    expect(screen.getByTestId('gsi-quantitative-chart').textContent).not.toMatch(/1\.5 Jcond89/)
    expect(screen.getByTestId('gsi-quantitative-chart').textContent).not.toMatch(/RQD\/2/)
    expect(screen.getByRole('heading', { name: /^定量法$/ })).toBeInTheDocument()
    expect(screen.getByTestId('gsi-quantitative-chart')).toHaveTextContent('结构面质量')
    expect(screen.getByTestId('gsi-quantitative-chart')).toHaveTextContent('由强到弱')
    expect(screen.getByTestId('gsi-quantitative-chart')).toHaveTextContent('岩体结构')
    expect(screen.getByTestId('gsi-quantitative-chart')).toHaveTextContent('节理块状岩体地质强度指标（GSI）')
    expect(screen.getByTestId('gsi-quantitative-chart')).not.toHaveTextContent('岩体块体连续性')
    expect(screen.getByTestId('gsi-quant-scale-a')).toHaveTextContent('45')
    expect(screen.getByTestId('gsi-quant-scale-a')).toHaveTextContent('5')
    expect(screen.getByTestId('gsi-quant-scale-b')).toHaveTextContent('35')
    expect(screen.getByTestId('gsi-quant-scale-b')).toHaveTextContent('5')
    const gsiSection = screen.getByRole('heading', { name: /^定量法$/ }).closest('section')
    expect(gsiSection?.textContent).toMatch(/1\.5/)
    expect(gsiSection?.textContent).toMatch(/RQD/)
    fireEvent.click(screen.getByTestId('gsi-rqd-quick-open'))
    expect(screen.getByRole('dialog', { name: 'RQD 快速计算' })).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'RQD 快速计算' })).toHaveTextContent(/岩石质量指标 RQD/)
    fireEvent.click(screen.getByRole('button', { name: '关闭' }))
    fireEvent.click(screen.getByTestId('gsi-jcond89-quick-open'))
    const calculator = screen.getByTestId('gsi-jcond89-calculator')
    expect(calculator).toBeInTheDocument()
    expect(calculator).not.toHaveTextContent(/表\s*5-12/)
    expect(calculator).toHaveTextContent('结构面状态')
    expect(calculator).toHaveTextContent('节理状态判断')
    expect(calculator).toHaveTextContent('不连续节理面分类取值')
    expect(calculator).toHaveTextContent('迹长')
    expect(calculator.querySelector('input')).toBeNull()
    expect(calculator.querySelector('select')).toBeNull()
    expect(screen.queryByText(/计算结果/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('gsi-jcond89-simple-a4_25'))
    expect(screen.getByTestId('gsi-jcond89-simple-a4_25')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByTestId('gsi-jcond89-detail-a4PersistenceId-pers_lt1'))
    expect(screen.getByTestId('gsi-jcond89-simple-a4_25')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('gsi-jcond89-detail-a4PersistenceId-pers_lt1')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: '确认并回填' }))
    expect(screen.getByTestId('gsi-jcond89-calculator')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '关闭' }))
  })

  it('plots the quantitative point and highlights the matching cell after typing Jcond89 and RQD', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '定量法' }))
    fireEvent.change(screen.getByTestId('gsi-jcond89-input'), { target: { value: '25' } })
    fireEvent.change(screen.getByTestId('gsi-rqd-input'), { target: { value: '80' } })
    const preview = screen.getByTestId('gsi-result-preview')
    expect(preview).toHaveTextContent('77.5')
    expect(preview).toHaveTextContent('已选 2 / 2')
    expect(preview).toHaveTextContent('节理状态')
    expect(preview).toHaveTextContent('岩石质量指标')
    expect(screen.getByTestId('gsi-quant-point')).toBeInTheDocument()
    expect(screen.getByTestId('gsi-quant-tick-35-35')).toHaveAttribute('aria-pressed', 'true')
  })

  it('flags out-of-range JCond89 and RQD without changing the preview layout', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '定量法' }))
    const preview = screen.getByTestId('gsi-result-preview')
    expect(preview).toHaveTextContent('分值预览')
    expect(preview).toHaveTextContent('已选 0 / 2')
    expect(preview).toHaveTextContent('节理状态')
    expect(preview).toHaveTextContent('岩石质量指标')
    expect(preview).toHaveTextContent('刻度 A')
    expect(preview).toHaveTextContent('刻度 B')
    fireEvent.change(screen.getByTestId('gsi-jcond89-input'), { target: { value: '-1' } })
    expect(screen.getByText('异常值：请输入 0～30 范围内的 JCond₈₉。')).toBeInTheDocument()
    fireEvent.change(screen.getByTestId('gsi-jcond89-input'), { target: { value: '31' } })
    expect(screen.getByText('异常值：请输入 0～30 范围内的 JCond₈₉。')).toBeInTheDocument()
    fireEvent.change(screen.getByTestId('gsi-rqd-input'), { target: { value: '101' } })
    expect(screen.getByText('异常值：请输入 0～100 范围内的 RQD。')).toBeInTheDocument()
    expect(preview).toHaveTextContent('已选 0 / 2')
    expect(preview).toHaveTextContent('评价结果')
    expect(screen.queryByTestId('gsi-quant-point')).not.toBeInTheDocument()
  })

  it('fills Jcond89 and RQD from a clicked quantitative cell', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '定量法' }))
    fireEvent.click(screen.getByTestId('gsi-quant-tick-20-20'))
    expect(screen.getByTestId('gsi-jcond89-input')).toHaveValue(15)
    expect(screen.getByTestId('gsi-rqd-input')).toHaveValue(45)
    expect(screen.getByTestId('gsi-result-preview')).toHaveTextContent('45')
    expect(screen.getByTestId('gsi-quant-tick-20-20')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('gsi-quant-point')).toHaveStyle({ left: '50%', top: '43.75%' })
  })

  it('opens a structure sketch gallery without changing the selected cell', () => {
    renderPage()
    fireEvent.click(screen.getByTestId('gsi-cell-blocky-good'))
    expect(screen.getByTestId('gsi-result-preview')).toHaveTextContent('77.5')
    expect(screen.getByTestId('gsi-chart').textContent).not.toMatch(/请点击|点击查看/)
    fireEvent.click(screen.getByTestId('gsi-structure-sketch-intact'))
    const dialog = screen.getByTestId('gsi-structure-example-dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveTextContent('完整块状岩体')
    expect(dialog).toHaveTextContent('裂隙非常罕见')
    expect(screen.queryByText(/请点击|点击查看/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '关闭' }))
    expect(screen.queryByTestId('gsi-structure-example-dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('gsi-result-preview')).toHaveTextContent('77.5')
    expect(screen.getByTestId('gsi-cell-blocky-good')).toHaveAttribute('aria-pressed', 'true')
  })
})
