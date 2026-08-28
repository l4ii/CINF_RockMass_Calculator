import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import BqClassificationPage from './components/bq/BqClassificationPage'
import { createInitialBqState } from './methods/bq'

function renderPage(onComplete = vi.fn()) {
  function Harness() {
    const [form, setForm] = useState<Record<string, unknown>>(createInitialBqState() as unknown as Record<string, unknown>)
    return (
      <BqClassificationPage
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
        onComplete={onComplete}
        onNext={vi.fn()}
      />
    )
  }
  render(<Harness />)
  return onComplete
}

function fillBasic() {
  const inputs = screen.getAllByRole('spinbutton')
  fireEvent.change(inputs[0], { target: { value: '50' } })
  fireEvent.change(inputs[1], { target: { value: '0.5' } })
}

describe('BQ dedicated page', () => {
  it('keeps the basic workflow ordered and shows the compact preview', () => {
    renderPage()
    expect(screen.queryByText('工程岩体分级标准')).not.toBeInTheDocument()
    expect(screen.getByTestId('bq-main-card')).toBeInTheDocument()
    expect(screen.getByTestId('bq-main-card').querySelector('[data-field="rc"]')).toBeTruthy()
    expect(screen.getByTestId('bq-main-card').querySelector('[data-testid="bq-limitation-formulas"]')).toBeTruthy()
    expect(screen.getByTestId('calculation-result-pane')).toBeInTheDocument()
    expect(screen.getByTestId('bq-standard-formulas')).toBeInTheDocument()
    expect(screen.getByTestId('bq-result-section').querySelector('[data-testid="bq-grade-reference"]')).toBeTruthy()
    expect(screen.getByTestId('bq-preview-rc-label').querySelector('.katex')).toBeTruthy()
    expect(screen.getByTestId('bq-preview-kv-label').querySelector('.katex')).toBeTruthy()
    expect(screen.getByTestId('bq-limitation-formulas')).toHaveTextContent('规范限定')
    expect(screen.getByTestId('bq-limitation-formulas').querySelectorAll(':scope > div')[0]).toHaveClass('bg-gray-50')
    expect(screen.queryByText('有效 Rc')).not.toBeInTheDocument()
    expect(screen.queryByText('有效 Kv')).not.toBeInTheDocument()
    expect(screen.getByTestId('bq-limitation-formulas')).toBeInTheDocument()
    expect(screen.queryByTestId('bq-calculation-order')).not.toBeInTheDocument()
    expect(screen.getByTestId('bq-basic-quality-title').parentElement?.querySelector('span')).toBeNull()
    expect(screen.getByLabelText('Rc 输入值（MPa）')).toHaveAttribute('placeholder', '如：80')
    expect(screen.getByLabelText('Kv 输入值')).toHaveAttribute('placeholder', '如：0.65')
  })

  it('uses engineering-language guidance for basic quality and auxiliary methods', () => {
    renderPage()
    const mainCard = screen.getByTestId('bq-main-card')
    expect(mainCard).toHaveTextContent('岩体基本质量评价以完整岩石饱和单轴抗压强度')
    expect(mainCard).toHaveTextContent('应优先采用同一工程分区内具有代表性的实测资料')

    fireEvent.click(screen.getByRole('button', { name: '展开点荷载换算' }))
    expect(screen.getByTestId('bq-rc-helper-formula').parentElement).toHaveTextContent(/用于在缺少饱和单轴抗压强度试验成果时/)
    expect(screen.getByTestId('bq-rc-helper-formula').parentElement).toHaveTextContent(/该估算值不能替代规范要求的单轴抗压强度试验/)

    fireEvent.click(screen.getByRole('button', { name: '展开波速法 \/ Jv 对照' }))
    expect(screen.getByTestId('bq-kv-velocity-formula').parentElement).toHaveTextContent(/岩体弹性纵波速度/)
    expect(screen.getByTestId('bq-kv-jv-table').parentElement).toHaveTextContent(/当缺少可靠波速资料时，可根据岩体体积节理数/)
  })

  it('describes corrected BQ by its engineering purpose', () => {
    renderPage()
    const result = screen.getByTestId('bq-result-section')
    expect(result).toHaveTextContent('修正 BQ 用于在地下工程条件下，综合考虑地下水、主要结构面产状和初始应力状态对基本 BQ 的影响。')
    expect(result).not.toHaveTextContent('可选步骤')
    expect(result).not.toHaveTextContent('仅用于地下工程')
  })

  it('centers every column in the BQ evaluation reference table', () => {
    renderPage()
    const table = screen.getByTestId('bq-result-section').querySelector('[data-testid="bq-grade-reference"] table')
    expect(table).toBeTruthy()
    expect(Array.from(table!.querySelectorAll('th, td')).every((cell) => cell.classList.contains('text-center'))).toBe(true)
  })

  it('uses the standard BQ grade headings and qualitative characteristics', () => {
    renderPage()
    const table = screen.getByTestId('bq-result-section').querySelector('[data-testid="bq-grade-reference"] table')
    expect(table).toBeTruthy()
    const headers = Array.from(table!.querySelectorAll('th')).map((cell) => cell.textContent?.replace(/\s+/g, ' ').trim())
    expect(headers).toEqual(['岩体基本质量分级', '岩体基本质量的定性特征', '岩体基本质量指标 BQ'])
    expect(table).toHaveTextContent('坚硬岩，岩体完整')
    expect(table).toHaveTextContent('坚硬岩，岩体较完整；较坚硬岩，岩体完整')
    expect(table).toHaveTextContent('坚硬岩，岩体较破碎；较坚硬岩，岩体较完整；较软岩，岩体完整')
    expect(table).toHaveTextContent('坚硬岩，岩体破碎；较坚硬岩，岩体较破碎～破碎；较软岩，岩体较完整～较破碎；软岩，岩体完整～较完整')
    expect(table).toHaveTextContent('较软岩，岩体破碎；软岩，岩体较破碎～破碎；全部极软岩及全部极破碎岩')
    expect(table).toHaveTextContent('>550')
    expect(table).toHaveTextContent('450＜BQ≤550')
    expect(table).toHaveTextContent('350＜BQ≤450')
    expect(table).toHaveTextContent('250＜BQ≤350')
    expect(table).toHaveTextContent('≤250')
  })

  it('shows BQ grade ranges in the K1 table header and uses the software title', () => {
    renderPage()
    fillBasic()
    fireEvent.click(screen.getByRole('button', { name: '进入修正 [BQ]' }))
    expect(screen.getByTestId('bq-k1-table')).toHaveTextContent('BQ')
    expect(screen.getByTestId('bq-k1-table')).toHaveTextContent('I级 ＞550')
    expect(screen.getByTestId('bq-k1-table')).toHaveTextContent('V级 ≤250')
    expect(screen.getByTestId('bq-k1-table')).not.toHaveTextContent('5.2.2-1')
  })

  it('selects foundation class from qualitative characteristics and reports the f0 range', () => {
    renderPage()
    fillBasic()
    fireEvent.click(screen.getByRole('button', { name: '进入修正 [BQ]' }))
    fireEvent.click(screen.getByLabelText('修正工程类型'))
    fireEvent.click(screen.getByRole('option', { name: '地基' }))

    const intro = screen.getByTestId('bq-foundation-intro')
    expect(intro).toHaveTextContent('岩石地基工程主要指以岩石作为承载层')
    expect(intro).toHaveTextContent('应按表 4.1.1 的岩体基本质量级别定级')
    expect(intro).toHaveTextContent('基岩承载力基本值')
    expect(screen.queryByLabelText('岩体基岩承载力基本值 f₀（MPa）')).not.toBeInTheDocument()

    const table = screen.getByTestId('bq-foundation-table')
    expect(table).toHaveTextContent('岩体基本质量的定性特征')
    expect(table).toHaveTextContent('坚硬岩，岩体完整')
    expect(table).not.toHaveTextContent('0.5＜f₀≤2.0')

    fireEvent.click(within(screen.getByTestId('bq-foundation-table')).getByText('坚硬岩，岩体破碎；较坚硬岩，岩体较破碎～破碎；较软岩，岩体较完整～较破碎；软岩，岩体完整～较完整'))
    expect(screen.getByTestId('bq-foundation-result')).toHaveTextContent('修正 BQ 评价结果')
    expect(screen.getByTestId('bq-foundation-result')).toHaveTextContent('IV 级')
    expect(screen.getByTestId('bq-foundation-f0').querySelector('.katex')).toBeTruthy()
    expect(screen.getByTestId('bq-foundation-result')).not.toHaveTextContent('[BQ]')
    expect(screen.getByTestId('calculation-result-pane')).toHaveTextContent('BQ评价结果')
    expect(screen.getByTestId('bq-preview-foundation-result')).toHaveTextContent('[BQ]评价结果')
    expect(screen.getByTestId('bq-preview-foundation-result')).toHaveTextContent('IV 级')
    expect(screen.queryByTestId('bq-preview-corrected-result')).not.toBeInTheDocument()
  })

  it('adds p and Q inputs and adopts the interpolated K1 value', () => {
    renderPage()
    fillBasic()
    fireEvent.click(screen.getByRole('button', { name: '进入修正 [BQ]' }))
    fireEvent.change(screen.getByLabelText('p（地下工程围岩裂隙水压，MPa）'), { target: { value: '0.3' } })
    expect(screen.getByTestId('bq-k1-assessment')).toHaveTextContent('淋雨状或线流状出水')
    expect(screen.getByLabelText('K1 输入值')).toHaveValue(0.3)
  })

  it('reserves stable space for auxiliary results and apply actions', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '展开点荷载换算' }))
    expect(screen.getByTestId('bq-rc-helper-estimate')).toHaveClass('min-w-[150px]')
    expect(screen.getByRole('button', { name: '应用到 Rc' })).toHaveClass('w-[120px]')

    fireEvent.click(screen.getByRole('button', { name: '展开波速法 / Jv 对照' }))
    expect(screen.getByTestId('bq-kv-velocity-estimate')).toHaveClass('min-w-[150px]')
    expect(screen.getByTestId('bq-kv-jv-estimate')).toHaveClass('min-w-[170px]')
    expect(screen.getByRole('button', { name: '应用到 Kv' })).toHaveClass('w-[120px]')
    expect(screen.getByRole('button', { name: '应用区间中值到 Kv' })).toHaveClass('w-[170px]')
  })

  it('shows colored effective Rc and Kv values in the limitation area', () => {
    renderPage()
    fillBasic()
    expect(screen.getByTestId('bq-limitation-status')).toHaveTextContent('未调整')
    expect(screen.getByTestId('bq-limitation-rc-final')).toHaveClass('text-green-700')

    fireEvent.change(screen.getByLabelText('Rc 输入值（MPa）'), { target: { value: '100' } })
    expect(screen.getByTestId('bq-limitation-status')).toHaveTextContent('Rc')
    expect(screen.getByTestId('bq-limitation-rc-final')).toHaveClass('text-amber-700')
  })

  it('marks only the coefficient changed by the active code limitation', () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('Rc 输入值（MPa）'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Kv 输入值'), { target: { value: '0.5' } })
    expect(screen.getByTestId('bq-preview-rc-label').querySelector('annotation')?.textContent).toBe('R_c^{*}')
    expect(screen.getByTestId('bq-preview-kv-label').querySelector('annotation')?.textContent).toBe('K_v')

    fireEvent.change(screen.getByLabelText('Rc 输入值（MPa）'), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText('Kv 输入值'), { target: { value: '0.9' } })
    expect(screen.getByTestId('bq-preview-rc-label').querySelector('annotation')?.textContent).toBe('R_c')
    expect(screen.getByTestId('bq-preview-kv-label').querySelector('annotation')?.textContent).toBe('K_v^{*}')
  })

  it('explains Chinese meanings beside the Kv helper inputs', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '展开波速法 / Jv 对照' }))
    expect(screen.getAllByText(/岩体弹性纵波速度/).length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText(/完整岩石岩芯纵波速度/).length).toBeGreaterThanOrEqual(2)
    expect(screen.getByLabelText('Jv · 条/m³')).toBeInTheDocument()
  })

  it('renders preview coefficient labels with mathematical subscripts', () => {
    renderPage()
    expect(screen.getByTestId('bq-preview-effective-rc-label').querySelector('.katex')).toBeTruthy()
    expect(screen.getByTestId('bq-preview-effective-kv-label').querySelector('.katex')).toBeTruthy()
  })

  it('does not step BQ number inputs when the wheel is used', () => {
    renderPage()
    const rc = screen.getByLabelText('Rc 输入值（MPa）')
    const blur = vi.spyOn(rc, 'blur')
    fireEvent.wheel(rc, { deltaY: 100 })
    expect(blur).toHaveBeenCalledTimes(1)
  })

  it('requires an explicit apply action for the Rc helper estimate', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '展开点荷载换算' }))
    const helperFormula = screen.getByTestId('bq-rc-helper-formula')
    expect(helperFormula).toBeInTheDocument()
    expect(helperFormula.firstElementChild).toHaveClass('bg-gray-50')
    fireEvent.change(screen.getByLabelText('Is(50) · MPa'), { target: { value: '4' } })
    expect(screen.getByText(/64\.5 MPa/)).toBeInTheDocument()
    expect(screen.getAllByRole('spinbutton')[0]).toHaveValue(null)
    fireEvent.click(screen.getByRole('button', { name: '应用到 Rc' }))
    expect(screen.getAllByRole('spinbutton')[0]).toHaveValue(64.54)
  })

  it('shows the Kv helper equations as mathematical formulas', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '展开波速法 / Jv 对照' }))
    expect(screen.getByTestId('bq-kv-velocity-formula')).toBeInTheDocument()
    expect(screen.getByTestId('bq-kv-jv-table')).toBeInTheDocument()
  })

  it('selects a Jv band midpoint by click and applies it to Kv', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '展开波速法 / Jv 对照' }))
    fireEvent.click(screen.getByTestId('bq-kv-jv-row-2'))
    expect(screen.getByTestId('bq-kv-jv-estimate')).toHaveTextContent('0.450')
    fireEvent.click(screen.getByRole('button', { name: '应用区间中值到 Kv' }))
    expect(screen.getByLabelText('Kv 输入值')).toHaveValue(0.45)
  })

  it('interpolates a typed Jv value between table boundaries', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '展开波速法 / Jv 对照' }))
    fireEvent.change(screen.getByLabelText('Jv · 条/m³'), { target: { value: '10' } })
    expect(screen.getByTestId('bq-kv-jv-estimate')).toHaveTextContent('0.550')
    fireEvent.click(screen.getByRole('button', { name: '应用区间中值到 Kv' }))
    expect(screen.getByLabelText('Kv 输入值')).toHaveValue(0.55)
  })

  it('keeps only one Kv source active at a time', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '展开波速法 / Jv 对照' }))
    fireEvent.change(screen.getByLabelText('vpm · km/s'), { target: { value: '3.2' } })
    fireEvent.change(screen.getByLabelText('vpr · km/s'), { target: { value: '4.5' } })
    fireEvent.change(screen.getByLabelText('Jv · 条/m³'), { target: { value: '12' } })
    expect(screen.getByLabelText('vpm · km/s')).toHaveValue(null)
    expect(screen.getByLabelText('vpr · km/s')).toHaveValue(null)
    fireEvent.change(screen.getByLabelText('Kv 输入值'), { target: { value: '0.5' } })
    expect(screen.getByLabelText('Jv · 条/m³')).toHaveValue(null)
    expect(screen.getByLabelText('Kv 输入值')).toHaveValue(0.5)
  })

  it('does not show the Jv interval after applying its interpolated value', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '展开波速法 / Jv 对照' }))
    fireEvent.change(screen.getByLabelText('Jv · 条/m³'), { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: '应用区间中值到 Kv' }))
    expect(screen.getByTestId('bq-kv-jv-estimate')).toHaveTextContent('0.510')
    expect(screen.getByTestId('bq-kv-jv-estimate')).not.toHaveTextContent('0.35–0.55')
  })

  it('places limitation status below a neutral adopted-value display', () => {
    renderPage()
    fillBasic()
    const panel = screen.getByTestId('bq-limitation-formulas')
    const status = screen.getByTestId('bq-limitation-status')
    const display = screen.getByTestId('bq-limitation-rc-final').closest('div')?.parentElement?.parentElement
    expect(display).toBeTruthy()
    expect(display!.compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(status.className).not.toMatch(/bg-(green|amber)/)
    expect(panel.querySelector('[data-testid="bq-limitation-rc-final"]')).toHaveClass('text-green-700')
  })

  it('can complete basic BQ without entering the correction stage', () => {
    const onComplete = renderPage()
    fillBasic()
    fireEvent.click(screen.getByRole('button', { name: /^完成$/ }))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: '进入修正 [BQ]' })).toBeInTheDocument()
  })

  it('keeps basic and corrected BQ results in separate sections', () => {
    renderPage()
    expect(screen.getByTestId('bq-result-table')).not.toHaveTextContent('[BQ]')
    expect(screen.getByTestId('bq-result-section')).toHaveTextContent('BQ评价结果')
    fillBasic()
    fireEvent.click(screen.getByRole('button', { name: '进入修正 [BQ]' }))
    expect(screen.getByTestId('bq-result-table')).not.toHaveTextContent('[BQ]')
    expect(screen.getByTestId('bq-corrected-result')).toHaveTextContent('[BQ]评价结果')
  })

  it('shows BQ and [BQ] evaluation results separately in the preview pane', () => {
    renderPage()
    const preview = screen.getByTestId('calculation-result-pane')
    expect(screen.getByTestId('bq-preview-basic-result')).toHaveTextContent('BQ评价结果')
    expect(screen.getByTestId('bq-preview-basic-result')).not.toHaveTextContent('[BQ]')
    expect(screen.queryByTestId('bq-preview-corrected-result')).not.toBeInTheDocument()
    expect(preview).not.toHaveTextContent('[BQ]评价结果')

    fillBasic()
    expect(screen.getByTestId('bq-preview-basic-result')).toHaveTextContent('375')
    expect(screen.queryByTestId('bq-preview-corrected-result')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '进入修正 [BQ]' }))
    fireEvent.click(screen.getByRole('button', { name: /0\.4～0\.6/ }))
    expect(screen.getByTestId('bq-preview-basic-result')).toHaveTextContent('BQ评价结果')
    expect(screen.getByTestId('bq-preview-basic-result')).toHaveTextContent('375')
    expect(screen.getByTestId('bq-preview-basic-result')).not.toHaveTextContent('[BQ]')
    expect(screen.getByTestId('bq-preview-corrected-result')).toHaveTextContent('[BQ]评价结果')
    expect(screen.getByTestId('bq-preview-corrected-result')).toHaveTextContent('315')
  })

  it('shows all underground correction steps without sequential locking', () => {
    renderPage()
    fillBasic()
    fireEvent.click(screen.getByRole('button', { name: '进入修正 [BQ]' }))
    expect(screen.getByTestId('bq-k1-table')).toBeInTheDocument()
    expect(screen.getByTestId('bq-k2-table')).toBeInTheDocument()
    expect(screen.getByTestId('bq-k3-table')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /完成 K[123]/ })).not.toBeInTheDocument()
  })

  it('shows K1, K2 and K3 together and treats empty coefficients as zero', () => {
    renderPage()
    fillBasic()
    fireEvent.click(screen.getByRole('button', { name: '进入修正 [BQ]' }))
    expect(screen.getByTestId('bq-k1-table')).toBeInTheDocument()
    expect(screen.getByTestId('bq-k2-table')).toBeInTheDocument()
    expect(screen.getByTestId('bq-k3-table')).toBeInTheDocument()
    expect(screen.getByTestId('bq-preview-k1-label')).toBeInTheDocument()
    expect(screen.getByTestId('bq-preview-k2-label')).toBeInTheDocument()
    expect(screen.getByTestId('bq-preview-k3-label')).toBeInTheDocument()
    const k2Input = screen.getByLabelText('K2 输入值')
    expect(k2Input.compareDocumentPosition(screen.getByTestId('bq-k2-table')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('warns when a typed K2 value falls outside the selected table range', () => {
    renderPage()
    fillBasic()
    fireEvent.click(screen.getByRole('button', { name: '进入修正 [BQ]' }))
    fireEvent.click(screen.getByRole('button', { name: /0\.4～0\.6/ }))
    fireEvent.change(screen.getByLabelText('K2 输入值'), { target: { value: '0.9' } })
    expect(screen.getByText('异常值：请输入 0.4～0.6 范围内的 K2。')).toBeInTheDocument()
  })

  it('shows the K3 stress-ratio input and its grade columns without a table number', () => {
    renderPage()
    fillBasic()
    fireEvent.click(screen.getByRole('button', { name: '进入修正 [BQ]' }))
    expect(screen.getByLabelText('围岩强度应力比 Rc/σmax')).toBeInTheDocument()
    expect(screen.getByTestId('bq-k3-table')).toHaveTextContent('I级 ＞550')
    expect(screen.getByTestId('bq-k3-table')).not.toHaveTextContent('5.2.2-3')
  })

  it('keeps the basic BQ result table visible after entering correction mode', () => {
    renderPage()
    fillBasic()
    fireEvent.click(screen.getByRole('button', { name: '进入修正 [BQ]' }))
    expect(screen.getByTestId('bq-result-section')).toBeInTheDocument()
    expect(screen.getByTestId('bq-result-table')).toHaveTextContent('375')
    expect(screen.getByTestId('bq-corrected-result')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '进入修正 [BQ]' })).not.toBeInTheDocument()
  })

  it('uses the standard three-condition K2 table and centers helper estimates', () => {
    renderPage()
    fillBasic()
    fireEvent.click(screen.getByRole('button', { name: '展开点荷载换算' }))
    expect(screen.getByTestId('bq-rc-helper-estimate')).toHaveClass('justify-center')

    fireEvent.click(screen.getByRole('button', { name: '展开波速法 / Jv 对照' }))
    expect(screen.getByTestId('bq-kv-velocity-estimate')).toHaveClass('justify-center')
    expect(screen.getByTestId('bq-kv-jv-estimate')).toHaveClass('justify-center')

    fireEvent.click(screen.getByRole('button', { name: '进入修正 [BQ]' }))
    const table = screen.getByTestId('bq-k2-table')
    expect(table).toHaveTextContent('结构面产状及其与洞轴线的组合关系')
    expect(table).toHaveTextContent('α≤30°，倾角 β=30°～75°')
    expect(table).toHaveTextContent('α＞60°，倾角 β＞75°')
    expect(table).toHaveTextContent('其他组合')
    expect(table).toHaveTextContent('0.4～0.6')
    expect(table).toHaveTextContent('0～0.2')
    expect(table).toHaveTextContent('0.2～0.4')
  })

  it('places the formal correction BQ introduction before its engineering type', () => {
    renderPage()
    fillBasic()
    fireEvent.click(screen.getByRole('button', { name: '进入修正 [BQ]' }))
    const intro = screen.getByTestId('bq-correction-intro')
    const engineeringType = screen.getByLabelText('修正工程类型')
    expect(intro.compareDocumentPosition(engineeringType) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(intro).toHaveTextContent('地下工程岩体详细定级时，基本质量指标 BQ 可根据地下水')
    expect(intro.querySelectorAll('.katex').length).toBeGreaterThan(0)
  })

  it('offers underground, foundation and slope engineering correction types', () => {
    renderPage()
    fillBasic()
    fireEvent.click(screen.getByRole('button', { name: '进入修正 [BQ]' }))
    fireEvent.click(screen.getByLabelText('修正工程类型'))
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(3)
    expect(options[0]).toHaveTextContent('地下工程岩体')
    expect(options[1]).toHaveTextContent('地基')
    expect(options[2]).toHaveTextContent('边坡工程')
    expect(options.every((option) => option.className.includes('text-center'))).toBe(true)
    expect(screen.queryByText(/已开发|未开发|暂未开发/)).not.toBeInTheDocument()
  })

  it('applies slope corrections from λ, K4 and computed K5', () => {
    renderPage()
    fillBasic()
    fireEvent.click(screen.getByRole('button', { name: '进入修正 [BQ]' }))
    fireEvent.click(screen.getByLabelText('修正工程类型'))
    fireEvent.click(screen.getByRole('option', { name: '边坡工程' }))

    const intro = screen.getByTestId('bq-slope-intro')
    expect(intro).toHaveTextContent('边坡工程岩体详细定级时')
    expect(intro).toHaveTextContent('主要结构面的类型、延伸性及其产状')
    expect(intro.querySelectorAll('.katex').length).toBeGreaterThan(0)

    const lambdaTable = screen.getByTestId('bq-lambda-table')
    expect(lambdaTable).toHaveTextContent('断层、泥夹层')
    expect(lambdaTable).toHaveTextContent('0.9～0.8')
    expect(lambdaTable).toHaveTextContent('0.7～0.6')
    fireEvent.click(screen.getByText('层面、贯通性较好的节理和裂隙'))
    fireEvent.change(screen.getByLabelText('lambda 输入值'), { target: { value: '0.85' } })

    const k4Table = screen.getByTestId('bq-k4-table')
    expect(k4Table).toHaveTextContent('I级 ＞550')
    expect(k4Table).toHaveTextContent('450＜BQ≤550')
    expect(k4Table).toHaveTextContent('V级 ≤250')
    expect(k4Table).toHaveTextContent('pw≤0.2H')
    fireEvent.change(screen.getByLabelText('pw（边坡地下水水头，m）'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('H（边坡高度，m）'), { target: { value: '40' } })
    expect(screen.getByTestId('bq-k4-assessment')).toHaveTextContent('潮湿或点滴状出水')
    fireEvent.change(screen.getByLabelText('K4 输入值'), { target: { value: '0.1' } })

    const k5Table = screen.getByTestId('bq-k5-table')
    expect(k5Table).toHaveTextContent('轻微')
    expect(k5Table).toHaveTextContent('很显著')
    expect(k5Table).toHaveTextContent('≤5')
    expect(k5Table).toHaveTextContent('≤−10')
    fireEvent.click(k5Table.querySelectorAll('[aria-selected]')[4])
    fireEvent.click(within(k5Table).getAllByText('≥45')[0])
    fireEvent.click(within(k5Table).getAllByText('≤−10')[0])
    expect(screen.getByTestId('bq-k5-product')).toHaveTextContent('2.5')
    expect(screen.getByTestId('bq-corrected-result')).toHaveTextContent('[BQ]评价结果')
    expect(screen.getByTestId('bq-preview-corrected-result')).toHaveTextContent('[BQ]评价结果')
  })
})
