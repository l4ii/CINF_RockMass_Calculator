import { Fragment, useState, type ReactNode } from 'react'
// @ts-ignore - react-katex types
import { InlineMath } from 'react-katex'
import {
  conservativeAdoptedValue,
  groupFactorOptions,
  Q_FACTOR_CONSERVATIVE_END,
  type QFactorOption,
  type QFactorSymbol,
} from '../../methods/q'

interface QFactorCalculatorProps {
  darkMode: boolean
  language: 'zh' | 'en'
  symbol: QFactorSymbol
  title: ReactNode
  intro: ReactNode
  options: readonly QFactorOption[]
  selectedId: string
  selectedValue: number | null
  onClose: () => void
  onComplete: (next: { id: string; value: number }) => void
}

function formatRange(option: QFactorOption) {
  return option.range.min === option.range.max ? String(option.range.min) : `${option.range.min}～${option.range.max}`
}

function tableShell(darkMode: boolean) {
  return darkMode ? 'border-gray-600' : 'border-gray-300'
}

function headCell(darkMode: boolean) {
  return darkMode ? 'bg-gray-700/60 text-gray-200' : 'bg-gray-100 text-gray-700'
}

function selectedCell(darkMode: boolean) {
  return darkMode ? 'bg-blue-900/50 text-blue-100' : 'bg-blue-100 text-blue-900'
}

function bodyCell(darkMode: boolean) {
  return darkMode ? 'text-gray-300' : 'text-gray-700'
}

export default function QFactorCalculator({
  darkMode,
  language,
  symbol,
  title,
  intro,
  options,
  selectedId,
  selectedValue,
  onClose,
  onComplete,
}: QFactorCalculatorProps) {
  const en = language === 'en'
  const groups = groupFactorOptions(options)
  const [optionId, setOptionId] = useState(selectedId)
  const selected = options.find((item) => item.id === optionId)
  const [adopted, setAdopted] = useState<number | null>(() => {
    if (selectedValue != null) return selectedValue
    const current = options.find((item) => item.id === selectedId)
    return current ? conservativeAdoptedValue(current) : null
  })
  const muted = darkMode ? 'text-gray-400' : 'text-gray-600'
  const panel = darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
  const border = tableShell(darkMode)
  const rangeOpen = selected != null && selected.range.min !== selected.range.max
  const adoptedValid = selected != null && adopted != null && adopted >= selected.range.min && adopted <= selected.range.max
  const canConfirm = selected != null && (rangeOpen ? adoptedValid : true)

  const selectOption = (option: QFactorOption) => {
    setOptionId(option.id)
    setAdopted(conservativeAdoptedValue(option))
  }

  const confirm = () => {
    if (!selected) return
    const value = adopted ?? conservativeAdoptedValue(selected)
    if (value < selected.range.min || value > selected.range.max) return
    onComplete({ id: selected.id, value })
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="q-factor-quick-title"
        data-testid="q-factor-calculator"
        className={`max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border p-5 shadow-xl ${panel}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="q-factor-quick-title" className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {title}
          </h2>
          <button
            type="button"
            aria-label={en ? 'Close' : '关闭'}
            title={en ? 'Close' : '关闭'}
            onClick={onClose}
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            ×
          </button>
        </div>

        <p className={`mt-3 text-sm leading-relaxed ${muted}`}>{intro}</p>

        <div className="mt-4 overflow-x-auto">
          <table className={`w-full min-w-[520px] border-collapse border text-sm ${border}`}>
            <thead>
              <tr>
                <th className={`border ${border} ${headCell(darkMode)} px-2 py-1.5 text-left font-medium`}>{en ? 'Description' : '描述'}</th>
                <th className={`w-28 border ${border} ${headCell(darkMode)} px-2 py-1.5 text-center font-medium`}>{en ? 'Rating' : '取值'}</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Fragment key={group.label.zh}>
                  <tr>
                    <th colSpan={2} className={`border ${border} ${headCell(darkMode)} px-2 py-1.5 text-left font-medium`}>
                      {en ? group.label.en : group.label.zh}
                    </th>
                  </tr>
                  {group.options.map((option) => {
                    const isSelected = optionId === option.id
                    return (
                      <tr key={option.id}>
                        <td
                          data-testid={`q-factor-row-${option.id}`}
                          aria-pressed={isSelected}
                          onClick={() => selectOption(option)}
                          className={`border ${border} cursor-pointer px-2 py-1.5 leading-snug hover:underline ${isSelected ? selectedCell(darkMode) : bodyCell(darkMode)}`}
                        >
                          {en ? option.label.en : option.label.zh}
                          {option.note ? <div className={`mt-0.5 text-xs ${isSelected ? '' : muted}`}>{en ? option.note.en : option.note.zh}</div> : null}
                        </td>
                        <td
                          aria-pressed={isSelected}
                          onClick={() => selectOption(option)}
                          className={`border ${border} cursor-pointer px-2 py-1.5 text-center font-semibold tabular-nums hover:underline ${isSelected ? selectedCell(darkMode) : bodyCell(darkMode)}`}
                        >
                          {formatRange(option)}
                        </td>
                      </tr>
                    )
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {rangeOpen && selected ? (
          <label className="mt-4 block space-y-1">
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {en ? <>Adopted <InlineMath math={symbol === 'SRF' ? String.raw`\mathrm{SRF}` : `J_${symbol.slice(1)}`} /> within {selected.range.min}–{selected.range.max}</> : <>区间内采用的 <InlineMath math={symbol === 'SRF' ? String.raw`\mathrm{SRF}` : `J_${symbol.slice(1)}`} />（{selected.range.min}～{selected.range.max}）</>}
            </span>
            <input
              aria-label={en ? `Adopted ${symbol}` : `${symbol} 采用值`}
              type="number"
              min={selected.range.min}
              max={selected.range.max}
              step={0.01}
              value={adopted ?? ''}
              onChange={(event) => setAdopted(event.target.value === '' ? null : Number(event.target.value))}
              className={`w-full max-w-xs rounded-lg border px-3 py-2 text-center text-sm tabular-nums outline-none focus:ring-2 focus:ring-blue-500/30 ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
            />
            {adopted != null && !adoptedValid ? (
              <p role="alert" className={`text-xs ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                {en ? `Value must be between ${selected.range.min} and ${selected.range.max}.` : `异常值：请输入 ${selected.range.min}～${selected.range.max} 范围内的 ${symbol}。`}
              </p>
            ) : (
              <p className={`text-xs ${muted}`}>
                {en
                  ? `If left unchanged, the conservative value ${conservativeAdoptedValue(selected, Q_FACTOR_CONSERVATIVE_END[symbol])} is used.`
                  : `未改动时按保守端 ${conservativeAdoptedValue(selected, Q_FACTOR_CONSERVATIVE_END[symbol])} 回填。`}
              </p>
            )}
          </label>
        ) : null}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled={!canConfirm}
            onClick={confirm}
            className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {en ? 'Confirm and fill' : '确认并回填'}
          </button>
        </div>
      </div>
    </div>
  )
}
