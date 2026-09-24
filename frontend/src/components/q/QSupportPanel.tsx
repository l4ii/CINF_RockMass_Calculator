import { useState, type KeyboardEvent } from 'react'
import { Q_ESR_OPTIONS, Q_SUPPORT_DESCRIPTION, validateQState, type QFormState, type QResult, type QSupportMode } from '../../methods/q'
import type { QSupportCategoryId } from '../../methods/qSupportChartGeometry'
import { Q_CHART_SUPPORT_DESCRIPTION } from '../../methods/qSupportChart'
import { FormulaFrame } from '../calculationUiPrimitives'
import { CoefficientScoreSlot } from '../CoefficientSectionHeader'
import { Kblock, Km } from '../math/Katex'
import QNgSupportChart from './QNgSupportChart'
import QSupportChart from './QSupportChart'
import QSupportResultBlock from './QSupportResultBlock'

export default function QSupportPanel({ state, result, darkMode, language, onChange }: { state: QFormState; result: QResult | null; darkMode: boolean; language: 'zh' | 'en'; onChange: (patch: Partial<QFormState>) => void }) {
  const en = language === 'en'
  const chartMode = state.supportMode === 'chart'
  const [editingEsr, setEditingEsr] = useState(false)
  const [focusCategory, setFocusCategory] = useState<QSupportCategoryId | null>(null)
  const muted = darkMode ? 'text-gray-400' : 'text-gray-600'
  const control = `min-h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`
  const input = `mt-1 ${control}`
  const esr = Q_ESR_OPTIONS.find((option) => option.id === state.esrId)
  const canEditEsr = esr != null && esr.range.min !== esr.range.max
  const adoptedEsr = esr ? state.esrValue ?? esr.range.min : null
  const errors = validateQState(state).filter((issue) => issue.severity === 'error' && ['span', 'esrId', 'esrValue'].includes(issue.field))
  const setMode = (supportMode: QSupportMode) => {
    setFocusCategory(null)
    onChange({ supportMode })
  }
  const preventNumberKeys = (event: KeyboardEvent<HTMLInputElement>) => {
    if (['ArrowUp', 'ArrowDown', 'e', 'E', '+', '-'].includes(event.key)) event.preventDefault()
  }
  return <section data-testid="q-support-panel" className={`rounded-lg border p-4 sm:p-5 ${darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white shadow-sm'}`}>
    <div data-testid="q-support-header" className="mb-2 flex items-center justify-between gap-3">
      <h2 className={`min-w-0 text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
        {en ? 'Support requirement assessment' : '支护需求判定'}
      </h2>
      <div data-testid="q-support-mode" className="flex h-6 shrink-0 overflow-hidden rounded-md border text-xs font-medium leading-none">
        <button
          type="button"
          onClick={() => setMode('limit')}
          className={`inline-flex h-full items-center px-2.5 ${!chartMode ? 'bg-blue-600 text-white' : darkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          {en ? 'Unsupported limit' : '无支护极限'}
        </button>
        <button
          type="button"
          onClick={() => setMode('chart')}
          className={`inline-flex h-full items-center border-l px-2.5 ${chartMode ? 'bg-blue-600 text-white' : darkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          {en ? 'Permanent support chart' : '永久支护图'}
        </button>
      </div>
    </div>
    <p data-testid="q-support-introduction" className={`text-sm leading-relaxed ${muted}`}>{chartMode ? Q_CHART_SUPPORT_DESCRIPTION[language] : Q_SUPPORT_DESCRIPTION[language]}</p>
    <div data-testid="q-support-formula" className="mt-4">
      <FormulaFrame darkMode={darkMode}>
        <div className="grid items-center gap-2 text-center sm:grid-cols-2">
          <Kblock math={String.raw`D_e = \frac{B}{\mathrm{ESR}}`} />
          {chartMode ? <Kblock math={String.raw`L = 2 + 0.15\,\frac{B}{\mathrm{ESR}}`} /> : <Kblock math={String.raw`D_{e,\max} = 2Q^{0.4}`} />}
        </div>
      </FormulaFrame>
      <p className={`mt-2 text-xs leading-relaxed ${muted}`}>
        <Km math="B" />
        {chartMode
          ? (en ? ': excavation span, diameter or height (m); ESR: excavation support ratio; De: equivalent dimension (m); L: bolt length (m) on the ESR = 1 scale.' : '：开挖跨度、直径或高度（m）；ESR：开挖支护比；De：当量尺寸（m）；L：ESR＝1 尺上的锚杆长度（m）。')
          : (en ? ': excavation span, diameter or height (m); ESR: excavation support ratio; De and De,max: equivalent dimension and empirical unsupported limit (m).' : '：开挖跨度、直径或高度（m）；ESR：开挖支护比；De 与 De,max 分别为当量尺寸和经验无支护极限（m）。')}
      </p>
    </div>
    <div data-testid="q-support-inputs" className="mt-4 grid gap-3 md:grid-cols-2">
      <label data-field="span" className="text-sm font-medium">{en ? 'Excavation span, diameter or height (m)' : '开挖跨度、直径或高度 (m)'}<input className={`${input} text-center tabular-nums`} type="number" min="0.01" step="any" value={state.span ?? ''} aria-invalid={errors.some((error) => error.field === 'span')} onKeyDown={preventNumberKeys} onWheel={(event) => event.currentTarget.blur()} onChange={(event) => onChange({ span: event.target.value === '' || !Number.isFinite(event.target.valueAsNumber) ? null : event.target.valueAsNumber })} /></label>
      <div data-field="esrId" className="min-w-0 text-sm font-medium">
        <span className="block">{en ? 'Excavation type / ESR' : '工程类型 / ESR'}</span>
        <div className="mt-1 flex items-center gap-2">
          <select aria-label={en ? 'Excavation type / ESR' : '工程类型 / ESR'} className={`${control} min-w-0 flex-1`} value={state.esrId} onChange={(event) => { setEditingEsr(false); onChange({ esrId: event.target.value, esrValue: null }) }}><option value="">{en ? 'Select engineering use' : '请选择工程用途'}</option>{Q_ESR_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label[language]} · {option.range.min}{option.range.min !== option.range.max ? `–${option.range.max}` : ''}</option>)}</select>
          <CoefficientScoreSlot
            darkMode={darkMode}
            language={language}
            symbol="ESR"
            score={adoptedEsr}
            editing={editingEsr}
            canEdit={canEditEsr}
            value={state.esrValue}
            validationMin={esr?.range.min ?? 0}
            validationMax={esr?.range.max ?? 0}
            scoreTestId="q-esr-value"
            field="esrValue"
            compact
            onStartEdit={() => { onChange({ esrValue: adoptedEsr }); setEditingEsr(true) }}
            onChange={(value) => onChange({ esrValue: value })}
            onEndEdit={() => setEditingEsr(false)}
          />
        </div>
      </div>
    </div>
    {errors.filter((error) => error.field !== 'esrValue').map((error) => <p key={error.field} role="alert" className={`mt-2 text-sm ${darkMode ? 'text-red-300' : 'text-red-600'}`}>{error.message[language]}</p>)}
    <div className="mt-4 w-full">{chartMode ? <QNgSupportChart result={result} darkMode={darkMode} language={language} highlightedCategory={focusCategory} onHighlight={setFocusCategory} /> : <QSupportChart result={result} darkMode={darkMode} language={language} />}</div>
    <QSupportResultBlock result={result} darkMode={darkMode} language={language} showCategories={chartMode} focusCategory={focusCategory} onFocusCategory={setFocusCategory} />
  </section>
}
