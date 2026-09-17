import { useState, type KeyboardEvent } from 'react'
import { Q_ESR_OPTIONS, Q_SUPPORT_DESCRIPTION, formatQValue, validateQState, type QFormState, type QResult } from '../../methods/q'
import { FormulaFrame } from '../calculationUiPrimitives'
import { CoefficientSectionHeader } from '../CoefficientSectionHeader'
import { Kblock, Km } from '../math/Katex'
import QSupportChart from './QSupportChart'

export default function QSupportPanel({ state, result, darkMode, language, onChange }: { state: QFormState; result: QResult | null; darkMode: boolean; language: 'zh' | 'en'; onChange: (patch: Partial<QFormState>) => void }) {
  const en = language === 'en'
  const [editingEsr, setEditingEsr] = useState(false)
  const muted = darkMode ? 'text-gray-400' : 'text-gray-600'
  const input = `mt-1 min-h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`
  const esr = Q_ESR_OPTIONS.find((option) => option.id === state.esrId)
  const canEditEsr = esr != null && esr.range.min !== esr.range.max
  const adoptedEsr = esr ? state.esrValue ?? esr.range.min : null
  const decision = result?.support
  const errors = validateQState(state).filter((issue) => issue.severity === 'error' && ['span', 'esrId', 'esrValue'].includes(issue.field))
  const preventNumberKeys = (event: KeyboardEvent<HTMLInputElement>) => {
    if (['ArrowUp', 'ArrowDown', 'e', 'E', '+', '-'].includes(event.key)) event.preventDefault()
  }
  return <section data-testid="q-support-panel" className={`rounded-lg border p-4 sm:p-5 ${darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white shadow-sm'}`}>
    <CoefficientSectionHeader
      testId="q-support-header"
      field="esrValue"
      darkMode={darkMode}
      language={language}
      title={en ? 'Support requirement assessment' : '支护需求判定'}
      symbol="ESR"
      scoreTestId="q-esr-value"
      score={adoptedEsr}
      editing={editingEsr}
      canEdit={canEditEsr}
      value={state.esrValue}
      validationMin={esr?.range.min ?? 0}
      validationMax={esr?.range.max ?? 0}
      onStartEdit={() => { onChange({ esrValue: adoptedEsr }); setEditingEsr(true) }}
      onChange={(value) => onChange({ esrValue: value })}
      onEndEdit={() => setEditingEsr(false)}
    />
    <p data-testid="q-support-introduction" className={`text-sm leading-relaxed ${muted}`}>{Q_SUPPORT_DESCRIPTION[language]}</p>
    <div data-testid="q-support-formula" className="mt-4">
      <FormulaFrame darkMode={darkMode}>
        <div className="grid items-center gap-2 text-center sm:grid-cols-2">
          <Kblock math={String.raw`D_e = \frac{B}{\mathrm{ESR}}`} />
          <Kblock math={String.raw`D_{e,\max} = 2Q^{0.4}`} />
        </div>
      </FormulaFrame>
      <p className={`mt-2 text-xs leading-relaxed ${muted}`}><Km math="B" />{en ? ': excavation span, diameter or height (m); ESR: excavation support ratio; De and De,max: equivalent dimension and empirical unsupported limit (m).' : '：开挖跨度、直径或高度（m）；ESR：开挖支护比；De 与 De,max 分别为当量尺寸和经验无支护极限（m）。'}</p>
    </div>
    <div data-testid="q-support-inputs" className="mt-4 grid gap-3 md:grid-cols-2">
      <label data-field="span" className="text-sm font-medium">{en ? 'Excavation span, diameter or height (m)' : '开挖跨度、直径或高度 (m)'}<input className={`${input} text-center tabular-nums`} type="number" min="0.01" step="any" value={state.span ?? ''} aria-invalid={errors.some((error) => error.field === 'span')} onKeyDown={preventNumberKeys} onWheel={(event) => event.currentTarget.blur()} onChange={(event) => onChange({ span: event.target.value === '' || !Number.isFinite(event.target.valueAsNumber) ? null : event.target.valueAsNumber })} /></label>
      <label data-field="esrId" className="min-w-0 text-sm font-medium">{en ? 'Excavation type / ESR' : '工程类型 / ESR'}<select className={input} value={state.esrId} onChange={(event) => { setEditingEsr(false); onChange({ esrId: event.target.value, esrValue: null }) }}><option value="">{en ? 'Select engineering use' : '请选择工程用途'}</option>{Q_ESR_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label[language]} · {option.range.min}{option.range.min !== option.range.max ? `–${option.range.max}` : ''}</option>)}</select></label>
    </div>
    {errors.filter((error) => error.field !== 'esrValue').map((error) => <p key={error.field} role="alert" className={`mt-2 text-sm ${darkMode ? 'text-red-300' : 'text-red-600'}`}>{error.message[language]}</p>)}
    <div data-testid="q-support-decision" className={`my-4 rounded-lg border p-3 text-sm ${darkMode ? 'border-gray-600 bg-gray-900/40' : 'border-gray-200 bg-gray-50'}`}>
      {decision && result ? <><p className="font-semibold">{decision.label[language]}</p><p className="mt-1 tabular-nums">De = {formatQValue(result.equivalentDimension!)} m · {en ? 'Empirical unsupported limit' : '经验无支护极限'} = {formatQValue(decision.maximumUnsupportedDimension)} m</p><p className={`mt-1 leading-relaxed ${muted}`}>{decision.recommendation[language]}</p></> : <p className={muted}>{en ? 'Complete the six Q parameters, excavation size and ESR to assess support requirements.' : '完整填写六项 Q 参数、开挖尺寸及 ESR 后显示支护需求判定结果。'}</p>}
    </div>
    <div className="overflow-x-auto rounded-lg"><div className="min-w-[620px]"><QSupportChart result={result} darkMode={darkMode} language={language} /></div></div>
    <p className={`mt-2 text-xs leading-relaxed ${muted}`}>{en ? 'Blue point: current location; dashed line: current Q. Applicable range: Q 0.001–1000, De 0.1–100 m. No support decision is extrapolated outside this range.' : '蓝点：当前点位；虚线：当前 Q 值。适用范围 Q＝0.001～1000，De＝0.1～100 m；超出范围不外推支护结论。'}</p>
  </section>
}
