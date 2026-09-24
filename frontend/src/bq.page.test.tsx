import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import BqClassificationPage from './components/bq/BqClassificationPage'
import BqModule from './components/bq/BqModule'
import { createInitialBqState } from './methods/bq'

function renderPage(onComplete = vi.fn(), initialForm: Record<string, unknown> = createInitialBqState() as unknown as Record<string, unknown>) {
  function Harness() {
    const [form, setForm] = useState<Record<string, unknown>>(initialForm)
    return (
      <BqClassificationPage
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

function enterCorrectionStage() {
  fireEvent.click(screen.getByRole('button', { name: '进入修正 [BQ]' }))
}

function selectCorrectionType(name: string) {
  fireEvent.click(screen.getByLabelText('修正工程类型'))
  fireEvent.click(screen.getByRole('option', { name }))
}

function enterUndergroundCorrection() {
  enterCorrectionStage()
  selectCorrectionType('地下工程岩体')
}

describe('BQ dedicated page', () => {
  it('opens the BQ workspace from the sidebar entry without crashing', () => {
    render(<BqModule darkMode={false} language="zh" onBackToHome={vi.fn()} />)
    expect(screen.getByRole('heading', { name: /项目工作区/ })).toBeInTheDocument()
  })

  it('keeps the basic workflow ordered and shows the compact preview', () => {
    renderPage()
    expect(screen.queryByText('工程岩体分级标准')).not.toBeInTheDocument()
    expect(screen.getByTestId('bq-main-card')).toBeInTheDocument()
    expect(screen.getByTestId('bq-main-card').querySelector('[data-field="rc"]')).toBeTruthy()
    expect(screen.getByTestId('bq-main-card').querySelector('[data-testid="bq-limitation-formulas"]')).toBeTruthy()
    expect(screen.getByTestId('calculation-result-pane')).toBeInTheDocument()
    expect(screen.getByTestId('bq-standard-formulas')).toBeInTheDocument()
    expect(screen.getByTestId('bq-result-section').querySelector('[data-testid="bq-grade-reference"]')).toBeTruthy()
    expect(screen.getByTestId('bq-result-section').querySelector('.text-3xl')).toBeTruthy()
    expect(screen.getByTestId('bq-preview-rc-label').querySelector('.katex')).toBeTruthy()
    expect(screen.getByTestId('bq-preview-kv-label').querySelector('.katex')).toBeTruthy()
    expect(screen.getByTestId('bq-limitation-formulas')).toHaveTextContent('规范限定')
    expect(screen.getByTestId('bq-limitation-formulas').querySelectorAll(':scope > div')[0]).toHaveClass('bg-gray-50')
    expect(screen.queryByText('有效 Rc')).not.toBeInTheDocument()
    expect(screen.queryByText('有效 Kv')).not.toBeInTheDocument()
    expect(screen.getByTestId('bq-limitation-formulas')).toBeInTheDocument()
    expect(screen.queryByTestId('bq-calculation-order')).not.toBeInTheDocument()
    expect(screen.getByTestId('bq-basic-quality-title').parentElement?.querySelector('span')).toBeNull()
    expect(screen.getByLabelText('Rc 输入值（MPa）')).toHaveAttribute('placeholder', '请输入数值')
    expect(screen.getByLabelText('Kv 输入值')).toHaveAttribute('placeholder', '请输入数值')
  })

  it('labels the reusable rock-mass group field as 岩矿类型', () => {
    renderPage()
    const input = screen.getByLabelText('岩矿类型')
    expect(screen.queryByText('矿岩类型组')).not.toBeInTheDocument()
    expect(input.className).toMatch(/text-center/)
    fireEvent.click(screen.getByRole('button', { name: '打开岩矿类型列表' }))
    expect(screen.getByRole('option', { name: '花岗岩' })).toBeInTheDocument()
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
    expect(result).toHaveTextContent('工程岩体详细定级应按工程类型分别进行：地下、边坡工程在基本 BQ 上计入地下水、主要结构面产状及初始应力等影响；地基工程按岩体基本质量的定性特征判定等级。')
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
    enterUndergroundCorrection()
    expect(screen.getByTestId('bq-k1-table')).toHaveTextContent('BQ')
    expect(screen.getByTestId('bq-k1-table')).toHaveTextContent('I 级')
    expect(screen.getByTestId('bq-k1-table')).toHaveTextContent('V 级')
    const k1HeaderTex = Array.from(screen.getByTestId('bq-k1-table').querySelectorAll('thead annotation')).map((node) => node.textContent)
    expect(k1HeaderTex).toContain(String.raw`\mathrm{BQ}>550`)
    expect(k1HeaderTex).toContain(String.raw`\mathrm{BQ}\le 250`)
    expect(screen.getByTestId('bq-k1-table')).not.toHaveTextContent('5.2.2-1')
  })

  it('classifies foundation from the qualitative BQ table and reports reference f0', () => {
    renderPage()
    fillBasic()
    enterCorrectionStage()
    selectCorrectionType('地基工程岩体')

    const intro = screen.getByTestId('bq-foundation-intro')
    expect(intro).toHaveTextContent('岩石地基工程以岩石作为承载层')
    expect(intro).toHaveTextContent('不使用修正公式')
    expect(intro).toHaveTextContent('定性特征')
    expect(intro).toHaveTextContent('基岩承载力基本值')
    expect(intro).not.toHaveTextContent('4.1.1')
    expect(intro).not.toHaveTextContent('5.4.2')
    expect(screen.queryByLabelText('岩体基岩承载力基本值 f₀（MPa）')).not.toBeInTheDocument()

    const table = screen.getByTestId('bq-foundation-table')
    expect(table).toHaveTextContent('岩体基本质量的定性特征')
    expect(table).toHaveTextContent('坚硬岩，岩体完整')
    expect(table).toHaveTextContent('250＜BQ≤350')

    fireEvent.click(within(table).getByText('IV 级'))
    expect(screen.getByTestId('bq-foundation-result')).toHaveTextContent('修正 BQ 评价结果')
    expect(screen.getByTestId('bq-foundation-result')).toHaveTextContent('IV 级')
    expect(screen.getByTestId('bq-foundation-f0').querySelector('.katex')).toBeTruthy()
    expect(screen.getByTestId('bq-foundation-result')).not.toHaveTextContent('[BQ]')
    expect(screen.getByTestId('calculation-result-pane')).toHaveTextContent('BQ评价结果')
    expect(screen.getByTestId('bq-preview-corrected-result').querySelector('annotation')?.textContent).toBe(String.raw`\left[\mathrm{BQ}\right]`)
    expect(screen.getByTestId('bq-preview-corrected-result')).toHaveTextContent('评价结果')
    expect(screen.getByTestId('bq-preview-corrected-result')).toHaveTextContent('IV 级')
    expect(screen.getByTestId('bq-preview-corrected-result')).toHaveTextContent('岩体质量较差')
    expect(screen.queryByTestId('bq-preview-foundation-result')).not.toBeInTheDocument()
    expect(screen.queryByTestId('bq-preview-foundation-grade-label')).not.toBeInTheDocument()
    expect(screen.queryByTestId('bq-preview-foundation-f0-label')).not.toBeInTheDocument()
  })

  it('adds p and Q inputs and adopts the interpolated K1 value', () => {
    renderPage()
    fillBasic()
    enterUndergroundCorrection()
    fireEvent.change(screen.getByLabelText('围岩裂隙水压 p'), { target: { value: '0.3' } })
    expect(screen.getByTestId('bq-k1-assessment')).toHaveTextContent('淋雨状或线流状出水')
    expect(screen.getByTestId('bq-k1-score')).toHaveTextContent('0.3')
    expect(screen.queryByLabelText('K1 输入值')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '修改 K1' }))
    expect(screen.getByLabelText('K1 输入值')).toHaveValue(0.3)

    fireEvent.change(screen.getByLabelText('每10m洞长出水量 Q'), { target: { value: '10' } })
    expect(screen.getByLabelText('围岩裂隙水压 p')).toHaveValue(null)
    expect(screen.getByLabelText('每10m洞长出水量 Q')).toHaveValue(10)
    expect(screen.getByTestId('bq-k1-assessment')).toHaveTextContent('潮湿或点滴状出水')
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
    expect(screen.getByTestId('bq-limitation-status')).toHaveTextContent('未触发规范限制，采用输入值')
    expect(screen.queryByTestId('bq-limitation-rc-final')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Rc 输入值（MPa）'), { target: { value: '100' } })
    expect(screen.getByTestId('bq-limitation-status')).toHaveTextContent('触发规范限制')
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

  it('puts the limitation outcome on the adopted half of the input row', () => {
    renderPage()
    fillBasic()
    const status = screen.getByTestId('bq-limitation-status')
    expect(status).toHaveTextContent('未触发规范限制，采用输入值')
    expect(status.closest('div')?.textContent).toMatch(/输入/)
    expect(screen.queryByText(/输入 Rc 和 Kv 后/)).not.toBeInTheDocument()
    expect(screen.queryByText(/下面显示最终采用值/)).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Rc 输入值（MPa）'), { target: { value: '100' } })
    expect(screen.getByTestId('bq-limitation-status')).toHaveTextContent('触发规范限制，采用')
    expect(screen.getByTestId('bq-limitation-rc-final')).toHaveClass('text-amber-700')
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
    expect(screen.getByTestId('bq-result-section')).toHaveTextContent('BQ评价结果')
    expect(screen.queryByText('结果项目')).not.toBeInTheDocument()
    fillBasic()
    enterUndergroundCorrection()
    expect(screen.getByTestId('bq-result-section')).toHaveTextContent('BQ评价结果')
    expect(screen.getByTestId('bq-corrected-result')).toHaveTextContent('[BQ]评价结果')
    expect(screen.queryByText('结果项目')).not.toBeInTheDocument()
  })

  it('shows BQ and [BQ] evaluation results separately in the preview pane', () => {
    renderPage()
    const preview = screen.getByTestId('calculation-result-pane')
    expect(screen.getByTestId('bq-preview-basic-result').querySelector('annotation')?.textContent).toBe(String.raw`\mathrm{BQ}`)
    expect(screen.getByTestId('bq-preview-basic-result')).toHaveTextContent('评价结果')
    expect(screen.getByTestId('bq-preview-basic-result')).not.toHaveTextContent('[BQ]')
    expect(screen.queryByTestId('bq-preview-corrected-result')).not.toBeInTheDocument()
    expect(preview.querySelector('[data-testid="bq-preview-corrected-result"]')).toBeNull()

    fillBasic()
    expect(screen.getByTestId('bq-preview-basic-result')).toHaveTextContent('375')
    expect(screen.queryByTestId('bq-preview-corrected-result')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '进入修正 [BQ]' }))
    expect(screen.queryByTestId('bq-preview-corrected-result')).not.toBeInTheDocument()
    selectCorrectionType('地下工程岩体')
    fireEvent.click(screen.getByRole('button', { name: /0\.4～0\.6/ }))
    expect(screen.getByTestId('bq-preview-basic-result')).toHaveTextContent('375')
    expect(screen.getByTestId('bq-preview-basic-result')).not.toHaveTextContent('[BQ]')
    expect(screen.getByTestId('bq-preview-corrected-result').querySelector('annotation')?.textContent).toBe(String.raw`\left[\mathrm{BQ}\right]`)
    expect(screen.getByTestId('bq-preview-corrected-result')).toHaveTextContent('评价结果')
    expect(screen.getByTestId('bq-preview-corrected-result')).toHaveTextContent('315')
    expect(screen.getByTestId('bq-preview-corrected-result')).toHaveTextContent('IV 级')
    expect(screen.getByTestId('bq-preview-corrected-result')).toHaveTextContent('岩体质量较差')
    expect(screen.getByTestId('bq-preview-basic-result')).toHaveTextContent('III 级')
    expect(screen.getByTestId('bq-preview-basic-result')).toHaveTextContent('岩体质量中等')
    expect(screen.queryByTestId('bq-preview-deduction-label')).not.toBeInTheDocument()
  })

  it('shows all underground correction steps without sequential locking', () => {
    renderPage()
    fillBasic()
    enterUndergroundCorrection()
    expect(screen.getByTestId('bq-k1-table')).toBeInTheDocument()
    expect(screen.getByTestId('bq-k2-table')).toBeInTheDocument()
    expect(screen.getByTestId('bq-k3-table')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /完成 K[123]/ })).not.toBeInTheDocument()
  })

  it('shows K1, K2 and K3 together and treats empty coefficients as zero', () => {
    renderPage()
    fillBasic()
    enterUndergroundCorrection()
    expect(screen.getByTestId('bq-k1-table')).toBeInTheDocument()
    expect(screen.getByTestId('bq-k2-table')).toBeInTheDocument()
    expect(screen.getByTestId('bq-k3-table')).toBeInTheDocument()
    expect(screen.getByTestId('bq-preview-k1-label')).toBeInTheDocument()
    expect(screen.getByTestId('bq-preview-k2-label')).toBeInTheDocument()
    expect(screen.getByTestId('bq-preview-k3-label')).toBeInTheDocument()
    expect(screen.queryByLabelText('K2 输入值')).not.toBeInTheDocument()
    expect(screen.queryByText(/（可选）/)).not.toBeInTheDocument()
  })

  it('warns when a typed K2 value falls outside the selected table range', () => {
    renderPage()
    fillBasic()
    enterUndergroundCorrection()
    fireEvent.click(screen.getByRole('button', { name: /0\.4～0\.6/ }))
    expect(screen.getByTestId('bq-k2-score')).toHaveTextContent('0.6')
    expect(screen.getByRole('button', { name: '修改 K2' })).toHaveTextContent('*')
    expect(screen.queryByLabelText('K2 输入值')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '修改 K2' }))
    const k2Input = screen.getByLabelText('K2 输入值')
    expect(k2Input).toHaveValue(0.6)
    fireEvent.change(k2Input, { target: { value: '0.9' } })
    expect(screen.getByText('异常值：请输入 0.4～0.6 范围内的 K2。')).toBeInTheDocument()
  })

  it('shows the K3 stress-ratio input and its grade columns without a table number', () => {
    renderPage()
    fillBasic()
    enterUndergroundCorrection()
    expect(screen.getByLabelText('围岩强度应力比 Rc/σmax')).toBeInTheDocument()
    expect(screen.getByTestId('bq-k3-table')).toHaveTextContent('I 级')
    expect(screen.getByTestId('bq-k3-table').querySelectorAll('thead .katex').length).toBeGreaterThan(0)
    expect(screen.getByTestId('bq-k3-table')).not.toHaveTextContent('5.2.2-3')
  })

  it('keeps the basic BQ result visible after entering correction mode', () => {
    renderPage()
    fillBasic()
    enterUndergroundCorrection()
    expect(screen.getByTestId('bq-result-section')).toBeInTheDocument()
    expect(screen.getByTestId('bq-result-section')).toHaveTextContent('375')
    expect(screen.getByTestId('bq-corrected-result')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '进入修正 [BQ]' })).not.toBeInTheDocument()
  })

  it('shows basic BQ whenever Rc and Kv are present, including incomplete foundation correction', () => {
    renderPage()
    fillBasic()
    expect(screen.getByTestId('bq-result-section')).toHaveTextContent('375')
    enterCorrectionStage()
    selectCorrectionType('地基工程岩体')
    expect(screen.getByLabelText('Rc 输入值（MPa）')).toHaveValue(50)
    expect(screen.getByLabelText('Kv 输入值')).toHaveValue(0.5)
    expect(screen.getByTestId('bq-result-section')).toHaveTextContent('375')
    expect(screen.getByTestId('bq-preview-basic-result')).toHaveTextContent('375')
  })

  it('restores the same BQ result when reopening a point that already has Rc and Kv', () => {
    renderPage(vi.fn(), { ...createInitialBqState(), mode: 'foundation', rc: 50, kv: 0.5 } as unknown as Record<string, unknown>)
    expect(screen.getByLabelText('Rc 输入值（MPa）')).toHaveValue(50)
    expect(screen.getByLabelText('Kv 输入值')).toHaveValue(0.5)
    expect(screen.getByTestId('bq-result-section')).toHaveTextContent('375')
    expect(screen.getByTestId('bq-preview-basic-result')).toHaveTextContent('375')
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
    selectCorrectionType('地下工程岩体')
    const table = screen.getByTestId('bq-k2-table')
    expect(table).toHaveTextContent('结构面产状及其与洞轴线的组合关系')
    expect(table).toHaveTextContent('其他组合')
    expect(table).toHaveTextContent('无一组起控制作用的主要结构面')
    expect(table).toHaveTextContent('0.4～0.6')
    expect(table).toHaveTextContent('0～0.2')
    expect(table).toHaveTextContent('0.2～0.4')
    const k2Tex = Array.from(table.querySelectorAll('annotation')).map((node) => node.textContent).join(' ')
    expect(k2Tex).toContain(String.raw`\alpha\le 30^{\circ}`)
    expect(k2Tex).toContain(String.raw`\alpha>60^{\circ}`)
    expect(table.querySelectorAll('.katex').length).toBeGreaterThan(0)
  })

  it('shows the engineering type first, then the matching introduction and formula', () => {
    renderPage()
    fillBasic()
    enterCorrectionStage()
    expect(screen.getByTestId('bq-correction-scenario')).toBeInTheDocument()
    const typeSelect = screen.getByLabelText('修正工程类型')
    const heading = screen.getByRole('heading', { name: '修正 BQ' })
    expect(heading.parentElement).toContainElement(typeSelect)
    expect(heading.className).not.toMatch(/\bw-full\b/)
    expect(screen.queryByTestId('bq-correction-intro')).not.toBeInTheDocument()
    expect(screen.queryByTestId('bq-k1-table')).not.toBeInTheDocument()
    expect(screen.getByText('请先选择修正工程类型，再显示对应介绍与公式。')).toBeInTheDocument()

    selectCorrectionType('地下工程岩体')
    const intro = screen.getByTestId('bq-correction-intro')
    expect(heading.parentElement).toContainElement(typeSelect)
    expect(typeSelect.compareDocumentPosition(intro) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(intro).toHaveTextContent('地下工程岩体详细定级时，基本质量指标 BQ 可根据地下水')
    expect(intro.querySelectorAll('.katex').length).toBeGreaterThan(0)
  })

  it('offers underground, foundation and slope engineering correction types', () => {
    renderPage()
    fillBasic()
    enterCorrectionStage()
    fireEvent.click(screen.getByLabelText('修正工程类型'))
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(3)
    expect(screen.queryByTestId('bq-correction-intro')).not.toBeInTheDocument()
    expect(options).toHaveLength(3)
    expect(options[0]).toHaveTextContent('地下工程岩体')
    expect(options[1]).toHaveTextContent('边坡工程岩体')
    expect(options[2]).toHaveTextContent('地基工程岩体')
    expect(options.every((option) => option.className.includes('text-center'))).toBe(true)
    expect(screen.queryByText(/已开发|未开发|暂未开发/)).not.toBeInTheDocument()
  })

  it('applies slope corrections from λ, K4 and computed K5', () => {
    renderPage()
    fillBasic()
    enterCorrectionStage()
    selectCorrectionType('边坡工程岩体')

    const intro = screen.getByTestId('bq-slope-intro')
    expect(intro).toHaveTextContent('边坡工程岩体详细定级时')
    expect(intro).toHaveTextContent('主要结构面的类型、延伸性及其产状')
    expect(intro.querySelectorAll('.katex').length).toBeGreaterThan(0)

    const lambdaTable = screen.getByTestId('bq-lambda-table')
    expect(lambdaTable).toHaveTextContent('断层、泥夹层')
    expect(lambdaTable).toHaveTextContent('0.9～0.8')
    expect(lambdaTable).toHaveTextContent('0.7～0.6')
    fireEvent.click(screen.getByText('层面、贯通性较好的节理和裂隙'))
    expect(screen.getByTestId('bq-lambda-score')).toHaveTextContent('0.9')
    expect(screen.queryByLabelText('lambda 输入值')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '修改 lambda' }))
    const lambdaInput = screen.getByLabelText('lambda 输入值')
    expect(lambdaInput).toHaveValue(0.9)
    expect(screen.queryByText(/（可选）/)).not.toBeInTheDocument()
    fireEvent.change(lambdaInput, { target: { value: '0.85' } })

    const k4Table = screen.getByTestId('bq-k4-table')
    expect(k4Table).toHaveTextContent('I 级')
    expect(k4Table).toHaveTextContent('V 级')
    const k4HeaderTex = Array.from(k4Table.querySelectorAll('thead annotation')).map((node) => node.textContent)
    expect(k4HeaderTex).toContain(String.raw`\mathrm{BQ}>550`)
    expect(k4HeaderTex).toContain(String.raw`450<\mathrm{BQ}\le 550`)
    expect(k4Table).toHaveTextContent('pw≤0.2H')
    fireEvent.change(screen.getByLabelText('边坡地下水水头 pw'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('边坡高度 H'), { target: { value: '40' } })
    expect(screen.getByTestId('bq-k4-score')).toHaveTextContent('0.1')
    expect(screen.queryByTestId('bq-k4-assessment')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('K4 输入值')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '修改 K4' }))
    fireEvent.change(screen.getByLabelText('K4 输入值'), { target: { value: '0.1' } })

    const k5Table = screen.getByTestId('bq-k5-table')
    expect(k5Table.querySelector('.katex')).toBeTruthy()
    expect(k5Table).toHaveTextContent('轻微')
    expect(k5Table).toHaveTextContent('很显著')
    expect(k5Table).toHaveTextContent('≤5')
    expect(k5Table).toHaveTextContent('≤−10')
    fireEvent.click(k5Table.querySelectorAll('[aria-selected]')[4])
    fireEvent.click(within(k5Table).getAllByText('≥45')[0])
    fireEvent.click(within(k5Table).getAllByText('≤−10')[0])
    expect(screen.getByTestId('bq-k5-product')).toHaveTextContent('2.5')
    expect(screen.getByTestId('bq-corrected-result')).toHaveTextContent('[BQ]评价结果')
    expect(screen.getByTestId('bq-preview-corrected-result').querySelector('annotation')?.textContent).toBe(String.raw`\left[\mathrm{BQ}\right]`)
    expect(screen.getByTestId('bq-preview-corrected-result')).toHaveTextContent('评价结果')
    expect(screen.getByTestId('bq-preview-corrected-result')).toHaveTextContent('V 级')
    expect(screen.getByTestId('bq-preview-corrected-result')).toHaveTextContent('岩体质量差')
  })
})
