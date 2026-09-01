import { useState, type KeyboardEvent, type ReactNode, type WheelEvent } from 'react'
// @ts-ignore - react-katex types
import { InlineMath } from 'react-katex'
import QuickRqdCalculator from '../rqd/QuickRqdCalculator'
import GsiJcond89Calculator from './GsiJcond89Calculator'
import GsiQuantitativeChartPanel from './GsiQuantitativeChartPanel'
import { type GsiFormState } from '../../methods/gsi'

interface GsiQuantitativePanelProps {
  darkMode: boolean
  language: 'zh' | 'en'
  state: GsiFormState
  patch: (partial: Partial<GsiFormState>) => void
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
  quickLabel,
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
  quickLabel: string
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
          step={0.1}
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
          ({quickLabel})
        </button>
      </div>
    </div>
  )
}

export default function GsiQuantitativePanel({ darkMode, language, state, patch }: GsiQuantitativePanelProps) {
  const en = language === 'en'
  const [rqdOpen, setRqdOpen] = useState(false)
  const [jcondOpen, setJcondOpen] = useState(false)

  return (
    <div data-testid="gsi-quantitative" className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <NumberInput
          darkMode={darkMode}
          language={language}
          field="jcond89Value"
          testId="gsi-jcond89-input"
          ariaLabel={en ? 'Joint condition JCond89' : '节理状态 JCond89'}
          symbol="JCond₈₉"
          label={en ? <>Joint condition <InlineMath math="\mathrm{JCond}_{89}" />:</> : <>节理状态 <InlineMath math="\mathrm{JCond}_{89}" />：</>}
          quickLabel={en ? 'Quick calculation' : '快速计算'}
          value={state.jcond89Value}
          min={0}
          max={30}
          onQuick={() => setJcondOpen(true)}
          onChange={(jcond89Value) => patch({ surfaceMethod: 'jcond89', jcond89Value })}
        />
        <NumberInput
          darkMode={darkMode}
          language={language}
          field="rqd"
          testId="gsi-rqd-input"
          ariaLabel={en ? 'Rock Quality Designation RQD' : '岩石质量指标 RQD'}
          symbol="RQD"
          label={en ? <>Rock Quality Designation <InlineMath math="\mathrm{RQD}" />:</> : <>岩石质量指标 <InlineMath math="\mathrm{RQD}" />：</>}
          quickLabel={en ? 'Quick calculation' : '快速计算'}
          value={state.rqd}
          unit="%"
          min={0}
          max={100}
          onQuick={() => setRqdOpen(true)}
          onChange={(rqd) => patch({ rqdSource: 'measured', rqd })}
        />
      </div>

      <GsiQuantitativeChartPanel
        darkMode={darkMode}
        language={language}
        jcond89={state.jcond89Value}
        rqd={state.rqd}
        onSelect={(jcond89Value, rqd) => patch({
          surfaceMethod: 'jcond89',
          rqdSource: 'measured',
          jcond89Mode: 'simple',
          jcond89Value,
          rqd,
        })}
      />

      {jcondOpen ? (
        <GsiJcond89Calculator
          darkMode={darkMode}
          language={language}
          state={state}
          onClose={() => setJcondOpen(false)}
          onComplete={(next) => {
            patch(next)
            setJcondOpen(false)
          }}
        />
      ) : null}

      {rqdOpen ? (
        <QuickRqdCalculator
          darkMode={darkMode}
          language={language}
          showIntro
          titleId="gsi-rqd-quick-title"
          formulaTestId="gsi-rqd-formula"
          confirmLabel={en ? 'Confirm and fill RQD' : '确认并回填 RQD'}
          onClose={() => setRqdOpen(false)}
          onComplete={(rqd) => {
            patch({ rqdSource: 'measured', rqd })
            setRqdOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}
