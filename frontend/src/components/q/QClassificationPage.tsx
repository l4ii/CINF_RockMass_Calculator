import { useMemo, useState, type KeyboardEvent, type ReactNode, type WheelEvent } from 'react'
// @ts-ignore - react-katex types
import { BlockMath, InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import BackIconButton from '../BackIconButton'
import { FormulaFrame } from '../calculationUiPrimitives'
import type { CustomEditorPageProps } from '../classification/ClassificationModule'
import QuickRqdCalculator from '../rqd/QuickRqdCalculator'
import QFactorCalculator from './QFactorCalculator'
import QScorePreview from './QScorePreview'
import {
  displayedFactorValue,
  factorOptionsFor,
  matchFactorOption,
  normalizeQState,
  Q_FACTOR_BOUNDS,
  Q_JA_OPTIONS,
  Q_JN_OPTIONS,
  Q_JR_OPTIONS,
  Q_JW_OPTIONS,
  Q_SRF_OPTIONS,
  tryCalculateQ,
  validateQState,
  type QFactorSymbol,
  type QFormState,
} from '../../methods/q'

type QProps = CustomEditorPageProps
type FactorKey = 'jn' | 'jr' | 'ja' | 'jw' | 'srf'
type CalculatorTarget = 'rqd' | QFactorSymbol | null

const FACTOR_KEY: Record<QFactorSymbol, FactorKey> = {
  Jn: 'jn',
  Jr: 'jr',
  Ja: 'ja',
  Jw: 'jw',
  SRF: 'srf',
}

function preventNumberWheel(event: WheelEvent<HTMLInputElement>) {
  event.currentTarget.blur()
}

function preventNumberArrow(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') event.preventDefault()
}

function NumberInput({
  darkMode,
  language,
  field,
  label,
  ariaLabel,
  symbol,
  value,
  unit,
  min,
  max,
  testId,
  onQuick,
  onChange,
}: {
  darkMode: boolean
  language: 'zh' | 'en'
  field: string
  label: ReactNode
  ariaLabel: string
  symbol: string
  value: number | null | undefined
  unit?: string
  min?: number
  max?: number
  testId?: string
  onQuick: () => void
  onChange: (value: number | null) => void
}) {
  const en = language === 'en'
  const invalid = value != null && Number.isFinite(value) && ((min != null && value < min) || (max != null && value > max))
  const invalidText = en
    ? `Invalid value: enter ${symbol} between ${min} and ${max}.`
    : `异常值：请输入 ${min}～${max} 范围内的 ${symbol}。`
  const input = `w-full rounded-lg border px-3 py-2 text-center text-sm tabular-nums outline-none focus:ring-2 ${unit ? 'pr-14' : ''} ${
    invalid
      ? `border-red-400 focus:ring-red-500/30 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`
      : darkMode
        ? 'border-gray-600 bg-gray-800 text-gray-100 focus:ring-blue-500/30'
        : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500/30'
  }`
  return (
    <div data-field={field} className="min-w-0">
      <div className={`mb-1 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {label}
      </div>
      <div className="relative">
        <input
          aria-label={ariaLabel}
          aria-invalid={invalid}
          data-testid={testId}
          type="number"
          className={input}
          value={value ?? ''}
          min={min}
          max={max}
          step={0.01}
          onWheel={preventNumberWheel}
          onKeyDown={(event) => {
            preventNumberArrow(event)
            if (event.key === '-' || event.key === '+' || event.key === 'e' || event.key === 'E') event.preventDefault()
          }}
          onChange={(event) => {
            const raw = event.target.value
            if (raw === '') {
              onChange(null)
              return
            }
            const next = Number(raw)
            if (Number.isFinite(next)) onChange(next)
          }}
        />
        {unit ? <span className={`pointer-events-none absolute right-3 top-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{unit}</span> : null}
      </div>
      {invalid ? <p role="alert" className={`mt-1 text-xs ${darkMode ? 'text-red-300' : 'text-red-600'}`}>{invalidText}</p> : null}
      <div className="mt-1 flex justify-end">
        <button
          type="button"
          data-testid={`${testId}-quick-open`.replace('-input', '')}
          onClick={onQuick}
          className={`text-sm font-medium underline underline-offset-2 ${darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800'}`}
        >
          ({en ? 'Quick calculation' : '快速计算'})
        </button>
      </div>
    </div>
  )
}

export default function QClassificationPage({
  darkMode,
  language,
  caseName,
  pointName,
  pointNote,
  pointOreType,
  oreTypeOptions = [],
  pointOrdinal,
  pointTotal,
  form,
  onFormChange,
  onPointNameChange,
  onPointNoteChange,
  onPointOreTypeChange,
  onBackToWorkspace,
  onBackToPoints,
  onComplete,
  onNext,
}: QProps) {
  const en = language === 'en'
  const state = useMemo(() => normalizeQState(form), [form])
  const issues = useMemo(() => validateQState(state).filter((item) => item.severity === 'error'), [state])
  const result = useMemo(() => tryCalculateQ(state), [state])
  const [attempted, setAttempted] = useState(false)
  const [calculator, setCalculator] = useState<CalculatorTarget>(null)
  const patch = (partial: Partial<QFormState>) => onFormChange({ ...state, ...partial } as unknown as Record<string, unknown>)
  const centered = `w-full rounded-lg border px-3 py-2 text-center text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`
  const card = `rounded-lg border p-4 sm:p-5 ${darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white shadow-sm'}`
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'

  const setFactor = (symbol: QFactorSymbol, value: number | null) => {
    const key = FACTOR_KEY[symbol]
    const options = factorOptionsFor(symbol)
    if (value == null) {
      patch({ [`${key}Id`]: '', [`${key}Value`]: null } as Partial<QFormState>)
      return
    }
    const match = matchFactorOption(options, value, state[`${key}Id` as keyof QFormState] as string)
    patch({ [`${key}Id`]: match?.id ?? '', [`${key}Value`]: value } as Partial<QFormState>)
  }

  const finish = (action: () => void) => {
    if (issues.length > 0) {
      setAttempted(true)
      document.querySelector<HTMLElement>(`[data-field="${issues[0].field}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setAttempted(false)
    action()
  }

  const factorMeta: Record<QFactorSymbol, { title: ReactNode; intro: ReactNode }> = {
    Jn: {
      title: en ? <>Joint-set number <InlineMath math="J_n" /></> : <>节理组数 <InlineMath math="J_n" /> 取值</>,
      intro: en
        ? <>Select the number of joint sets that cut the rock mass. Massive rock uses 0.5–1; crushed, earth-like rock uses 20. Intersections and portals are not automatically doubled in this version.</>
        : <>按切割岩体的节理组数点选。<InlineMath math="J_n" /> 从整体岩体（0.5～1）到压碎土状岩体（20）。本版不自动对交叉口或洞口加倍。</>,
    },
    Jr: {
      title: en ? <>Joint roughness <InlineMath math="J_r" /></> : <>节理粗糙度 <InlineMath math="J_r" /> 取值</>,
      intro: en
        ? <>Rate the roughness of the least favourable joint or joint set that controls stability. Use the same discontinuity as for Ja.</>
        : <>按控制稳定的最不利节理或节理组评定粗糙度，必须与 <InlineMath math="J_a" /> 取自同一条结构面。</>,
    },
    Ja: {
      title: en ? <>Joint alteration <InlineMath math="J_a" /></> : <>节理蚀变 <InlineMath math="J_a" /> 取值</>,
      intro: en
        ? <>Rate the alteration, coating or filling of the same least favourable discontinuity used for Jr. Thin clay fillings reduce shear strength sharply.</>
        : <>按与 <InlineMath math="J_r" /> 相同的最不利结构面评定蚀变、涂层或充填。薄层黏土充填会显著降低抗剪强度。</>,
    },
    Jw: {
      title: en ? <>Joint-water reduction <InlineMath math="J_w" /></> : <>裂隙水状态 <InlineMath math="J_w" /> 取值</>,
      intro: en
        ? <>Select the groundwater condition in the joints, from dry or minor seepage (1.0) to exceptional sustained inflow (0.05–0.1).</>
        : <>按节理中的地下水状态点选，从干燥或少量渗水（1.0）到持续异常涌水（0.05～0.1）。</>,
    },
    SRF: {
      title: en ? <>Stress reduction factor <InlineMath math="\mathrm{SRF}" /></> : <>应力折减 <InlineMath math="\mathrm{SRF}" /> 取值</>,
      intro: en
        ? <>Choose the governing condition among weakness/shear zones, competent-rock stress (including bursting), squeezing, or swelling. Do not combine unrelated branches.</>
        : <>在软弱带/剪切带、完整硬岩应力（含岩爆）、挤压或膨胀四类条件中选择控制性工况，不要把无关分支叠乘。</>,
    },
  }

  const openFactor = calculator && calculator !== 'rqd' ? calculator : null
  const openOptions = openFactor ? factorOptionsFor(openFactor) : []
  const openKey = openFactor ? FACTOR_KEY[openFactor] : null

  return (
    <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      <div className="grid w-full min-h-0 flex-1 grid-cols-1 gap-4 px-4 py-5 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,3fr)_minmax(220px,1fr)]">
        <main data-testid="calculation-input-pane" className="thin-scroll -mr-1 min-h-0 min-w-0 flex-1 overflow-y-auto space-y-3 pr-0.5">
          <header className="flex items-start gap-2">
            <BackIconButton label={en ? 'Back' : '返回'} onClick={onBackToPoints} darkMode={darkMode} className="mt-1" />
            <div className="min-w-0">
              <nav className={`flex flex-wrap items-center gap-1 text-xs ${muted}`}>
                <button type="button" onClick={onBackToWorkspace} className="hover:text-blue-600">{en ? 'Project workspace' : '项目工作区'}</button>
                <span>/</span>
                <button type="button" onClick={onBackToPoints} className="hover:text-blue-600">{caseName}</button>
                <span>/</span>
                <span>{pointName}</span>
              </nav>
              <h1 className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {en ? 'Barton Q-system rock-mass classification' : 'Q 系统岩体分级'}
              </h1>
              <p className={`mt-1 text-sm ${muted}`}>{en ? 'Point' : '点位'} {pointOrdinal} / {pointTotal}</p>
            </div>
          </header>

          <section className={card}>
            <h2 className={`mb-3 text-center text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Point information' : '点位信息'}</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="block space-y-1 text-center">
                <span className="text-sm font-medium">{en ? 'Point number' : '点位序号'}</span>
                <input className={centered} value={pointOrdinal} readOnly />
              </label>
              <label className="block space-y-1 text-center">
                <span className="text-sm font-medium">{en ? 'Point name' : '点位名称'}</span>
                <input className={centered} value={pointName} onChange={(event) => onPointNameChange(event.target.value)} />
              </label>
              <label className="block space-y-1 text-center">
                <span className="text-sm font-medium">{en ? 'Ore / rock type' : '矿岩类型'}</span>
                <input list="q-rock-mass-groups" className={centered} value={pointOreType} onChange={(event) => onPointOreTypeChange(event.target.value)} />
                <datalist id="q-rock-mass-groups">{oreTypeOptions.map((option) => <option key={option} value={option} />)}</datalist>
              </label>
              <label className="block space-y-1 text-center">
                <span className="text-sm font-medium">{en ? 'Point note' : '点位说明'}</span>
                <input className={centered} value={pointNote} onChange={(event) => onPointNoteChange(event.target.value)} />
              </label>
            </div>
          </section>

          <section data-testid="q-method-introduction" className={card}>
            <h2 className={`mb-3 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {en ? 'Barton rock-mass quality classification (Q)' : '巴顿岩体质量分类（Q）'}
            </h2>
            <p className={`mb-4 text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {en ? (
                <>
                  The Q-value is determined from engineering geology, hydrogeology, ore-body occurrence, jointing, excavation-induced stresses and intact-rock properties.
                  {' '}It is the product of three conceptual parameters: block size <InlineMath math="\mathrm{RQD}/J_n" />, joint shear <InlineMath math="J_r/J_a" />, and active stress <InlineMath math="J_w/\mathrm{SRF}" />.
                  {' '}<InlineMath math="\mathrm{RQD}" /> is rock quality designation; <InlineMath math="J_n" /> is the joint-set number; <InlineMath math="J_r" /> and <InlineMath math="J_a" /> describe roughness and alteration of the least favourable discontinuity; <InlineMath math="J_w" /> is the joint-water factor; <InlineMath math="\mathrm{SRF}" /> covers weakness zones, competent-rock stress, squeezing and swelling.
                  {' '}Known ratings may be typed directly; otherwise use Quick calculation to pick from the Barton tables.
                </>
              ) : (
                <>
                  Q 值根据工程地质、水文地质、矿体赋存、节理发育、开挖地应力及岩石物理性质综合确定。
                  公式由三个概念参数相乘得到：块体尺寸 <InlineMath math="\mathrm{RQD}/J_n" />、节理抗剪 <InlineMath math="J_r/J_a" />、主动应力 <InlineMath math="J_w/\mathrm{SRF}" />。
                  <InlineMath math="\mathrm{RQD}" /> 为岩石质量指标，<InlineMath math="J_n" /> 为节理组数；<InlineMath math="J_r" />、<InlineMath math="J_a" /> 分别描述最不利节理或节理组的粗糙度与蚀变状态；<InlineMath math="J_w" /> 为裂隙水状态；<InlineMath math="\mathrm{SRF}" /> 反映断层软弱带、硬岩强度应力比、挤压与膨胀等条件。
                  已有测值可直接填入；需要查表时点「快速计算」。
                </>
              )}
            </p>
            <div data-testid="q-formula">
              <FormulaFrame darkMode={darkMode}>
                <div className={`text-center ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  <BlockMath math={String.raw`Q=\frac{\mathrm{RQD}}{J_n}\times\frac{J_r}{J_a}\times\frac{J_w}{\mathrm{SRF}}`} />
                </div>
              </FormulaFrame>
            </div>
          </section>

          <section data-testid="q-group-block" className={card}>
            <h2 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {en ? <>Rock structure · <InlineMath math="\mathrm{RQD}/J_n" /></> : <>岩体结构 / 块体尺寸 · <InlineMath math="\mathrm{RQD}/J_n" /></>}
            </h2>
            <p className={`mt-1 mb-3 text-sm leading-relaxed ${muted}`}>
              {en
                ? <>Use RQD and the joint-set number to estimate block size. The ratio typically lies between 100/0.5 and 10/20. RQD below 10% is entered as measured but calculated as 10%.</>
                : <>用岩石质量指标与节理组数估计块体尺寸，比值约介于 100/0.5 与 10/20 之间。实测 RQD 小于 10% 时仍记录实测值，计算按名义 10% 代入。</>}
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <NumberInput
                darkMode={darkMode}
                language={language}
                field="rqd"
                testId="q-rqd-input"
                ariaLabel={en ? 'Rock quality designation RQD' : '岩石质量指标 RQD'}
                symbol="RQD"
                label={en ? <>Rock quality designation <InlineMath math="\mathrm{RQD}" />:</> : <>岩石质量指标 <InlineMath math="\mathrm{RQD}" />：</>}
                value={state.rqd}
                unit="%"
                min={0}
                max={100}
                onQuick={() => setCalculator('rqd')}
                onChange={(rqd) => patch({ rqd })}
              />
              <NumberInput
                darkMode={darkMode}
                language={language}
                field="jnValue"
                testId="q-jn-input"
                ariaLabel={en ? 'Joint-set number Jn' : '节理组数 Jn'}
                symbol="Jn"
                label={en ? <>Joint-set number <InlineMath math="J_n" />:</> : <>节理组数指标 <InlineMath math="J_n" />：</>}
                value={displayedFactorValue(state.jnId, state.jnValue, Q_JN_OPTIONS)}
                min={Q_FACTOR_BOUNDS.Jn.min}
                max={Q_FACTOR_BOUNDS.Jn.max}
                onQuick={() => setCalculator('Jn')}
                onChange={(value) => setFactor('Jn', value)}
              />
            </div>
          </section>

          <section data-testid="q-group-shear" className={card}>
            <h2 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {en ? <>Joint shear · <InlineMath math="J_r/J_a" /></> : <>节理抗剪 · <InlineMath math="J_r/J_a" /></>}
            </h2>
            <p className={`mt-1 mb-3 text-sm leading-relaxed ${muted}`}>
              {en
                ? <>Jr and Ja must describe the same least favourable discontinuity. Higher Jr/Ja means higher frictional strength; thin clay fillings reduce it sharply.</>
                : <>Jr 与 Ja 必须针对同一条最不利结构面选取。比值越大抗剪越有利；薄层黏土充填会显著降低强度。</>}
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <NumberInput
                darkMode={darkMode}
                language={language}
                field="jrValue"
                testId="q-jr-input"
                ariaLabel={en ? 'Joint roughness Jr' : '节理粗糙度 Jr'}
                symbol="Jr"
                label={en ? <>Joint roughness <InlineMath math="J_r" />:</> : <>最不利节理粗糙度 <InlineMath math="J_r" />：</>}
                value={displayedFactorValue(state.jrId, state.jrValue, Q_JR_OPTIONS)}
                min={Q_FACTOR_BOUNDS.Jr.min}
                max={Q_FACTOR_BOUNDS.Jr.max}
                onQuick={() => setCalculator('Jr')}
                onChange={(value) => setFactor('Jr', value)}
              />
              <NumberInput
                darkMode={darkMode}
                language={language}
                field="jaValue"
                testId="q-ja-input"
                ariaLabel={en ? 'Joint alteration Ja' : '节理蚀变 Ja'}
                symbol="Ja"
                label={en ? <>Joint alteration <InlineMath math="J_a" />:</> : <>最不利节理蚀变 <InlineMath math="J_a" />：</>}
                value={displayedFactorValue(state.jaId, state.jaValue, Q_JA_OPTIONS)}
                min={Q_FACTOR_BOUNDS.Ja.min}
                max={Q_FACTOR_BOUNDS.Ja.max}
                onQuick={() => setCalculator('Ja')}
                onChange={(value) => setFactor('Ja', value)}
              />
            </div>
          </section>

          <section data-testid="q-group-stress" className={card}>
            <h2 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {en ? <>Active stress · <InlineMath math="J_w/\mathrm{SRF}" /></> : <>主动应力 · <InlineMath math="J_w/\mathrm{SRF}" /></>}
            </h2>
            <p className={`mt-1 mb-3 text-sm leading-relaxed ${muted}`}>
              {en
                ? <>Jw/SRF is an empirical factor for water pressure and the effective principal stress. SRF covers faults, strength-to-stress ratio, squeezing and swelling.</>
                : <>Jw/SRF 描述裂隙水与岩体中有效主应力的经验影响。SRF 涵盖断层软弱带、硬岩强度应力比、挤压与膨胀。</>}
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <NumberInput
                darkMode={darkMode}
                language={language}
                field="jwValue"
                testId="q-jw-input"
                ariaLabel={en ? 'Joint-water reduction Jw' : '裂隙水状态 Jw'}
                symbol="Jw"
                label={en ? <>Joint-water factor <InlineMath math="J_w" />:</> : <>裂隙水状态指标 <InlineMath math="J_w" />：</>}
                value={displayedFactorValue(state.jwId, state.jwValue, Q_JW_OPTIONS)}
                min={Q_FACTOR_BOUNDS.Jw.min}
                max={Q_FACTOR_BOUNDS.Jw.max}
                onQuick={() => setCalculator('Jw')}
                onChange={(value) => setFactor('Jw', value)}
              />
              <NumberInput
                darkMode={darkMode}
                language={language}
                field="srfValue"
                testId="q-srf-input"
                ariaLabel={en ? 'Stress reduction factor SRF' : '应力折减 SRF'}
                symbol="SRF"
                label={en ? <>Stress reduction factor <InlineMath math="\mathrm{SRF}" />:</> : <>应力折减指标 <InlineMath math="\mathrm{SRF}" />：</>}
                value={displayedFactorValue(state.srfId, state.srfValue, Q_SRF_OPTIONS)}
                min={Q_FACTOR_BOUNDS.SRF.min}
                max={Q_FACTOR_BOUNDS.SRF.max}
                onQuick={() => setCalculator('SRF')}
                onChange={(value) => setFactor('SRF', value)}
              />
            </div>
          </section>

          <footer className={card}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              {attempted && issues.length > 0 ? (
                <p className="text-sm text-red-600 dark:text-red-300 sm:mr-auto">{en ? issues[0].message.en : issues[0].message.zh}</p>
              ) : (
                <p className={`text-sm sm:mr-auto ${muted}`}>
                  {issues.length > 0
                    ? (en ? 'Draft is saved automatically.' : '草稿已自动保存，可稍后补充。')
                    : (en ? 'All required parameters are complete.' : '必填参数已完整。')}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={onBackToPoints} className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>{en ? 'Previous' : '上一步'}</button>
                <button type="button" onClick={() => finish(onComplete)} className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">{en ? 'Complete' : '完成'}</button>
                <button type="button" onClick={() => finish(onNext)} className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>{en ? 'Next point' : '下一个'}</button>
              </div>
            </div>
          </footer>
          <div className="pb-24" />
        </main>
        <aside data-testid="calculation-result-pane" className="hidden min-w-0 xl:block">
          <QScorePreview darkMode={darkMode} language={language} state={state} result={result} />
        </aside>
      </div>

      {calculator === 'rqd' ? (
        <QuickRqdCalculator
          darkMode={darkMode}
          language={language}
          showIntro
          titleId="q-rqd-quick-title"
          formulaTestId="q-rqd-formula"
          confirmLabel={en ? 'Confirm and fill RQD' : '确认并回填 RQD'}
          onClose={() => setCalculator(null)}
          onComplete={(rqd) => {
            patch({ rqd })
            setCalculator(null)
          }}
        />
      ) : null}

      {openFactor && openKey ? (
        <QFactorCalculator
          darkMode={darkMode}
          language={language}
          symbol={openFactor}
          title={factorMeta[openFactor].title}
          intro={factorMeta[openFactor].intro}
          options={openOptions}
          selectedId={state[`${openKey}Id`]}
          selectedValue={state[`${openKey}Value`]}
          onClose={() => setCalculator(null)}
          onComplete={({ id, value }) => {
            patch({ [`${openKey}Id`]: id, [`${openKey}Value`]: value } as Partial<QFormState>)
            setCalculator(null)
          }}
        />
      ) : null}
    </div>
  )
}
