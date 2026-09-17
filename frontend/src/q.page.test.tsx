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
        oreTypeOptions={['花岗岩']}
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
    expect(screen.getByLabelText('开挖跨度、直径或高度 (m)')).toBeInTheDocument()
    const preview = screen.getByTestId('q-result-preview')
    expect(preview).toHaveTextContent('分值预览')
    expect(preview).toHaveTextContent('已选 0 / 6')
    expect(preview).toHaveTextContent('评价结果')
    expect(preview).toHaveTextContent('输入六项参数后显示正式等级')
  })

  it('labels the reusable rock-mass group field as 岩矿类型', () => {
    renderPage()
    const input = screen.getByLabelText('岩矿类型')
    expect(screen.queryByText('矿岩类型组')).not.toBeInTheDocument()
    expect(input.className).toMatch(/text-center/)
    fireEvent.click(screen.getByRole('button', { name: '打开岩矿类型列表' }))
    expect(screen.getByRole('option', { name: '花岗岩' })).toBeInTheDocument()
  })

  it('keeps point-information inputs centered', () => {
    renderPage()
    const heading = screen.getByRole('heading', { name: '点位信息' })
    expect(heading.className).not.toContain('text-center')
    const section = heading.closest('section')
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
    expect(screen.getByTestId('q-jn-result')).toHaveTextContent('= 4')
    fireEvent.click(screen.getByRole('button', { name: '确认并回填' }))
    expect(screen.getByTestId('q-jn-input')).toHaveValue(4)
    expect(screen.getByTestId('q-result-preview')).toHaveTextContent('已选 1 / 6')
  })

  it('fills the intersection-modified Jn from the table dialog', () => {
    renderPage()
    fireEvent.click(screen.getByTestId('q-jn-quick-open'))
    fireEvent.click(screen.getByTestId('q-factor-row-two_sets'))
    fireEvent.change(screen.getByTestId('q-jn-site'), { target: { value: 'intersection' } })
    expect(screen.getByTestId('q-jn-result')).toHaveTextContent('= 12')
    fireEvent.click(screen.getByRole('button', { name: '确认并回填' }))
    expect(screen.getByTestId('q-jn-input')).toHaveValue(12)
  })

  it('adds 1 to Jr when the wide-spacing note is selected', () => {
    renderPage()
    fireEvent.click(screen.getByTestId('q-jr-quick-open'))
    fireEvent.click(screen.getByTestId('q-factor-row-rough_undulating'))
    expect(screen.getByTestId('q-jr-result')).toHaveTextContent('= 3')
    fireEvent.change(screen.getByTestId('q-jr-note'), { target: { value: 'wide_spacing' } })
    expect(screen.getByTestId('q-jr-result')).toHaveTextContent('= 4')
    fireEvent.click(screen.getByRole('button', { name: '确认并回填' }))
    expect(screen.getByTestId('q-jr-input')).toHaveValue(4)
  })

  it('draws the Jr roughness table with a profile under each description', () => {
    renderPage()
    fireEvent.click(screen.getByTestId('q-jr-quick-open'))
    const calculator = screen.getByTestId('q-factor-calculator')
    expect(calculator).toHaveTextContent('3. 节理粗糙度')
    expect(calculator).toHaveTextContent('粗糙或不规则的波状节理')
    expect(calculator).not.toHaveTextContent('已选')
    expect(calculator).not.toHaveTextContent('代入公式的值')
    const note = screen.getByTestId('q-jr-note')
    expect(note).toHaveDisplayValue('无附加修正（按表取值）')
    expect(note).toHaveTextContent('注 1：节理组平均间距 > 3 m，Jr + 1.0')
    expect(note).toHaveTextContent('注 2：带擦痕的平面状节理与最弱方位一致时按 G 档 0.5')
    for (const id of ['discontinuous', 'smooth_undulating', 'slickensided_planar', 'clay_zone_no_contact', 'crushed_zone_no_contact']) {
      expect(calculator.querySelector(`[data-testid="q-jr-profile-${id}"]`)).toBeTruthy()
    }
  })

  it('shows the two Q-system RQD notes in the quick calculator', () => {
    renderPage()
    fireEvent.click(screen.getByTestId('q-rqd-quick-open'))
    const dialog = screen.getByRole('dialog', { name: 'RQD 快速计算' })
    expect(dialog).toHaveTextContent(/按 5 为间隔/)
    expect(dialog).toHaveTextContent(/名义值 10/)
  })

  it('draws the Jw table with a water-pressure column instead of a copied figure', () => {
    renderPage()
    fireEvent.click(screen.getByTestId('q-jw-quick-open'))
    const calculator = screen.getByTestId('q-factor-calculator')
    expect(calculator.querySelector('table')).toBeTruthy()
    expect(calculator.querySelector('img')).toBeNull()
    expect(calculator).toHaveTextContent('5. 节理水折减系数')
    expect(calculator).toHaveTextContent('水压近似值')
    expect(calculator).toHaveTextContent('kg·cm')
    expect(calculator).not.toHaveTextContent('已选')
    expect(calculator).not.toHaveTextContent('注 1：')
    const dryRow = screen.getByTestId('q-factor-row-dry_minor')
    expect(dryRow).toHaveTextContent('<1')
    expect(screen.getByTestId('q-factor-row-large_inflow_unfilled')).toHaveTextContent('2.5～10')
    fireEvent.click(dryRow)
    expect(screen.getByTestId('q-jw-result')).toHaveTextContent('= 1')
    fireEvent.click(screen.getByRole('button', { name: '确认并回填' }))
    expect(screen.getByTestId('q-jw-input')).toHaveValue(1)
  })

  it('draws the Ja table with a residual-friction column', () => {
    renderPage()
    fireEvent.click(screen.getByTestId('q-ja-quick-open'))
    const calculator = screen.getByTestId('q-factor-calculator')
    expect(calculator.querySelector('table')).toBeTruthy()
    expect(calculator.querySelector('img')).toBeNull()
    expect(calculator).toHaveTextContent('4. 节理蚀变系数')
    expect(calculator).not.toHaveTextContent('已选')
    expect(screen.getByTestId('q-factor-row-unaltered_walls')).toHaveTextContent('25～35')
    expect(screen.getByTestId('q-factor-row-silty_sandy_clay_coating')).toHaveTextContent('20～25')
    expect(screen.queryByTestId('q-ja-clay')).toBeNull()
    fireEvent.click(screen.getByTestId('q-factor-letter-K'))
    const clay = screen.getByTestId('q-ja-clay')
    expect(clay).toHaveTextContent('按 G 档黏土状况（强超固结、非软化） · Ja = 6')
    expect(clay).toHaveTextContent('按 J 档黏土状况（膨胀性黏土） · Ja = 8～12')
    fireEvent.change(clay, { target: { value: 'crushed_strong_clay' } })
    expect(screen.getByTestId('q-ja-result')).toHaveTextContent('= 6')
    fireEvent.click(screen.getByRole('button', { name: '确认并回填' }))
    expect(screen.getByTestId('q-ja-input')).toHaveValue(6)
  })

  it('draws the SRF table with book lettering and an inline result', () => {
    renderPage()
    fireEvent.click(screen.getByTestId('q-srf-quick-open'))
    const calculator = screen.getByTestId('q-factor-calculator')
    expect(calculator.querySelector('table')).toBeTruthy()
    expect(calculator.querySelector('img')).toBeNull()
    expect(calculator).toHaveTextContent('6. 应力折减系数')
    expect(calculator).toHaveTextContent('（1）软弱区穿切开挖体，引起岩体松散冒落')
    expect(calculator).toHaveTextContent('（4）膨胀岩化学膨胀')
    expect(calculator).not.toHaveTextContent('已选')
    const loose = screen.getByTestId('q-factor-row-loose_open_joints')
    expect(loose).toHaveTextContent('G')
    expect(screen.getByTestId('q-factor-row-medium_stress')).toHaveTextContent('J')
    expect(screen.getByTestId('q-factor-row-heavy_swelling')).toHaveTextContent('R')
    fireEvent.click(loose)
    expect(screen.getByTestId('q-srf-result')).toHaveTextContent('= 5')
    fireEvent.click(screen.getByRole('button', { name: '确认并回填' }))
    expect(screen.getByTestId('q-srf-input')).toHaveValue(5)
  })

  it('draws the Jn rating table instead of embedding the source figure', () => {
    renderPage()
    fireEvent.click(screen.getByTestId('q-jn-quick-open'))
    const calculator = screen.getByTestId('q-factor-calculator')
    expect(calculator.querySelector('table')).toBeTruthy()
    expect(calculator.querySelector('img')).toBeNull()
    expect(calculator).toHaveTextContent('2. 节理组数')
    expect(calculator).toHaveTextContent('块状岩体，无节理或只有少量节理')
    expect(calculator).not.toHaveTextContent('已选')
    expect(calculator).not.toHaveTextContent('代入公式的值')
    expect(calculator).not.toHaveTextContent('注：')
    expect(screen.getByTestId('q-jn-site')).toHaveDisplayValue('1倍（一般部位）')
    expect(screen.getByLabelText('部位修正').className).toContain('text-sm')
    expect(calculator.querySelector('[data-testid="q-jn-sketch-one_set"]')).toBeTruthy()
    expect(calculator.querySelector('[data-testid="q-jn-sketch-two_sets"]')).toBeTruthy()
    expect(calculator.querySelector('[data-testid="q-jn-sketch-three_sets"]')).toBeTruthy()
    expect(calculator.querySelector('[data-testid="q-jn-sketch-three_sets_random"]')).toBeTruthy()
    expect(calculator.querySelector('[data-testid="q-jn-sketch-massive"]')).toBeNull()
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
    expect(preview).toHaveTextContent('I 级')
    expect(screen.getByTestId('q-result-analysis')).toHaveTextContent('巴顿岩体质量等级')
    expect(screen.getByTestId('q-result-analysis')).not.toHaveTextContent('很好')
    expect(screen.queryByText('九档质量评价与取值说明')).not.toBeInTheDocument()
    expect(screen.getByTestId('q-support-chart')).toBeInTheDocument()
    expect(screen.queryByTestId('q-chart-point')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('开挖跨度、直径或高度 (m)'), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText('工程类型 / ESR'), { target: { value: 'major_civil' } })
    expect(screen.getByTestId('q-chart-point')).toBeInTheDocument()
    expect(screen.getByTestId('q-support-decision')).toHaveTextContent('无需支护区')
    fireEvent.change(screen.getByLabelText('开挖跨度、直径或高度 (m)'), { target: { value: '50' } })
    expect(screen.getByTestId('q-support-decision')).toHaveTextContent('需支护区')
    fireEvent.change(screen.getByLabelText('开挖跨度、直径或高度 (m)'), { target: { value: '' } })
    expect(screen.queryByTestId('q-chart-point')).not.toBeInTheDocument()
    expect(preview).toHaveTextContent('60')
  })

  it('edits temporary-mine ESR in the header and resets it for a fixed ESR', () => {
    renderPage()
    const panel = screen.getByTestId('q-support-panel')
    expect(panel).toHaveTextContent('支护需求判定')
    expect(panel).not.toHaveTextContent('初判')
    expect(panel).not.toHaveTextContent('照片')
    expect(panel).not.toHaveTextContent('书名')
    expect(screen.getByTestId('q-support-introduction').compareDocumentPosition(screen.getByTestId('q-support-formula')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByTestId('q-support-formula').compareDocumentPosition(screen.getByTestId('q-support-inputs')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.change(screen.getByLabelText('工程类型 / ESR'), { target: { value: 'temporary_mine' } })
    expect(screen.queryByLabelText('ESR 输入值')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '修改 ESR' }))
    const input = screen.getByLabelText('ESR 输入值')
    expect(screen.getByTestId('q-support-header')).toContainElement(input)
    fireEvent.change(input, { target: { value: '4' } })
    fireEvent.blur(input)
    expect(screen.getByRole('button', { name: '修改 ESR' })).toHaveTextContent('4')
    fireEvent.click(screen.getByRole('button', { name: '修改 ESR' }))
    fireEvent.change(screen.getByLabelText('ESR 输入值'), { target: { value: '5' } })
    fireEvent.keyDown(screen.getByLabelText('ESR 输入值'), { key: 'Escape' })
    expect(screen.getByRole('button', { name: '修改 ESR' })).toHaveTextContent('4')
    fireEvent.click(screen.getByRole('button', { name: '修改 ESR' }))
    fireEvent.change(screen.getByLabelText('ESR 输入值'), { target: { value: '3.5' } })
    fireEvent.keyDown(screen.getByLabelText('ESR 输入值'), { key: 'Enter' })
    expect(screen.getByRole('button', { name: '修改 ESR' })).toHaveTextContent('3.5')
    fireEvent.click(screen.getByRole('button', { name: '修改 ESR' }))
    fireEvent.change(screen.getByLabelText('ESR 输入值'), { target: { value: '6' } })
    fireEvent.blur(screen.getByLabelText('ESR 输入值'))
    expect(screen.getByRole('alert')).toHaveTextContent('ESR')
    fireEvent.change(screen.getByLabelText('工程类型 / ESR'), { target: { value: 'major_civil' } })
    expect(screen.queryByRole('button', { name: '修改 ESR' })).not.toBeInTheDocument()
    expect(screen.getByTestId('q-esr-value')).toHaveTextContent('1')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('flags out-of-range Jn without changing the preview layout', () => {
    renderPage()
    fireEvent.change(screen.getByTestId('q-jn-input'), { target: { value: '61' } })
    expect(screen.getByText('异常值：请输入 0.5～60 范围内的 Jn。')).toBeInTheDocument()
    const preview = screen.getByTestId('q-result-preview')
    expect(preview).toHaveTextContent('已选 0 / 6')
    expect(preview).toHaveTextContent('评价结果')
  })
})
