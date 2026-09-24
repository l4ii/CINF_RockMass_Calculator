import { useState, type ReactNode } from 'react'
import { Km } from '../math/Katex'
import { SYM } from '../math/symbols'
import {
  conservativeAdoptedValue,
  formatFactorRating,
  formulaValueFor,
  optionsForLetter,
  Q_FACTOR_CONSERVATIVE_END,
  tableValueFor,
  type QFactorModifiers,
  type QFactorOption,
  type QFactorSymbol,
  type QJnSite,
} from '../../methods/q'
import { Q_AUXILIARY_DIALOG_CLASS, Q_AUXILIARY_OVERLAY_CLASS } from '../calculationUiPrimitives'
import QFactorQuickTable from './QFactorQuickTable'

interface QFactorCalculatorProps {
  darkMode: boolean
  language: 'zh' | 'en'
  symbol: QFactorSymbol
  title: ReactNode
  intro: ReactNode
  options: readonly QFactorOption[]
  selectedId: string
  selectedValue: number | null
  jnSite?: QJnSite
  jrWideSpacing?: boolean
  onClose: () => void
  onComplete: (next: { id: string; value: number; jnSite?: QJnSite; jrWideSpacing?: boolean }) => void
}

function inferJnSite(option: QFactorOption | undefined, value: number | null, given: QJnSite | undefined): QJnSite {
  if (given === 'normal' || given === 'intersection' || given === 'portal') return given
  if (!option || value == null) return 'normal'
  const min = option.range.min
  const max = option.range.max
  if (Math.abs(value - min * 3) < 1e-6 || Math.abs(value - max * 3) < 1e-6) return 'intersection'
  if (Math.abs(value - min * 2) < 1e-6 || Math.abs(value - max * 2) < 1e-6) return 'portal'
  return 'normal'
}

function initialTableValue(symbol: QFactorSymbol, option: QFactorOption | undefined, selectedValue: number | null, modifiers: QFactorModifiers) {
  if (selectedValue != null && option) {
    const table = tableValueFor(symbol, selectedValue, modifiers)
    if (table >= option.range.min && table <= option.range.max) return table
  }
  if (selectedValue != null && option == null) return selectedValue
  return option ? conservativeAdoptedValue(option) : null
}

function mathSymbol(symbol: QFactorSymbol) {
  return symbol === 'SRF' ? SYM.SRF : SYM[symbol]
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
  jnSite: jnSiteProp,
  jrWideSpacing: jrWideSpacingProp,
  onClose,
  onComplete,
}: QFactorCalculatorProps) {
  const en = language === 'en'
  const [optionId, setOptionId] = useState(selectedId)
  const selected = options.find((item) => item.id === optionId)
  const [jnSite, setJnSite] = useState<QJnSite>(() => inferJnSite(selected, selectedValue, jnSiteProp))
  const [jrWideSpacing, setJrWideSpacing] = useState(Boolean(jrWideSpacingProp))
  const modifiers: QFactorModifiers = { jnSite, jrWideSpacing }
  const [adopted, setAdopted] = useState<number | null>(() =>
    initialTableValue(symbol, selected, selectedValue, { jnSite: inferJnSite(selected, selectedValue, jnSiteProp), jrWideSpacing: Boolean(jrWideSpacingProp) })
  )
  const muted = darkMode ? 'text-gray-400' : 'text-gray-600'
  const panel = darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
  const rangeOpen = selected != null && selected.range.min !== selected.range.max
  const adoptedValid = selected != null && adopted != null && adopted >= selected.range.min && adopted <= selected.range.max
  const canConfirm = selected != null && (rangeOpen ? adoptedValid : true)
  const letterGroup = selected?.letter ? optionsForLetter(options, selected.letter) : []
  const formulaPreview = selected != null ? formulaValueFor(symbol, adopted ?? conservativeAdoptedValue(selected), modifiers) : null

  const selectOption = (option: QFactorOption) => {
    setOptionId(option.id)
    setAdopted(conservativeAdoptedValue(option))
  }

  const selectLetter = (letter: string) => {
    const matches = optionsForLetter(options, letter)
    if (matches.length === 0) return
    const current = matches.find((item) => item.id === optionId)
    selectOption(current ?? matches[matches.length - 1])
  }

  const confirm = () => {
    if (!selected) return
    const table = adopted ?? conservativeAdoptedValue(selected)
    if (table < selected.range.min || table > selected.range.max) return
    onComplete({
      id: selected.id,
      value: formulaValueFor(symbol, table, modifiers),
      ...(symbol === 'Jn' ? { jnSite } : {}),
      ...(symbol === 'Jr' ? { jrWideSpacing } : {}),
    })
  }

  return (
    <div className={Q_AUXILIARY_OVERLAY_CLASS} onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="q-factor-quick-title"
        data-testid="q-factor-calculator"
        className={`${Q_AUXILIARY_DIALOG_CLASS} ${panel}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="q-factor-quick-title" className={`min-w-0 text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
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

        <div data-testid={`q-${symbol.toLowerCase()}-intro`} className={`mt-3 space-y-2 text-sm leading-relaxed ${muted}`}>
          {intro}
        </div>

        <div className="mt-4">
          {symbol === 'Jn' ? (
            <div className="mb-2 flex justify-end">
              <label className={`flex items-center gap-2 whitespace-nowrap text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                <span>{en ? 'Site factor' : '部位修正'}</span>
                <select
                  aria-label={en ? 'Jn site multiplier' : '部位修正'}
                  data-testid="q-jn-site"
                  value={jnSite === '' ? 'normal' : jnSite}
                  onChange={(event) => setJnSite(event.target.value as QJnSite)}
                  className={`rounded-lg border px-2.5 py-1.5 text-sm ${
                    darkMode ? 'border-gray-500 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
                  }`}
                >
                  <option value="normal">{en ? '×1 general' : '1倍（一般部位）'}</option>
                  <option value="portal">{en ? '×2 cross-cut' : '2倍（穿脉）'}</option>
                  <option value="intersection">{en ? '×3 intersection' : '3倍（巷道交叉点）'}</option>
                </select>
              </label>
            </div>
          ) : null}
          {symbol === 'Jr' ? (
            <div className="mb-2 flex justify-end">
              <label className={`flex items-center gap-2 whitespace-nowrap text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                <span>{en ? 'Extra modifier' : '附加修正'}</span>
                <select
                  aria-label={en ? 'Jr extra modifier' : '附加修正'}
                  data-testid="q-jr-note"
                  value={jrWideSpacing ? 'wide_spacing' : 'none'}
                  onChange={(event) => setJrWideSpacing(event.target.value === 'wide_spacing')}
                  className={`rounded-lg border px-2.5 py-1.5 text-sm ${
                    darkMode ? 'border-gray-500 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
                  }`}
                >
                  <option value="none">{en ? 'None (table value)' : '无附加修正（按表取值）'}</option>
                  <option value="wide_spacing">
                    {en ? 'Note 1: joint-set spacing > 3 m, Jr + 1.0' : '注 1：节理组平均间距 > 3 m，Jr + 1.0'}
                  </option>
                  <option value="min_strength" disabled>
                    {en
                      ? 'Note 2: slickensided planar joints oriented for minimum strength use row G, 0.5'
                      : '注 2：带擦痕的平面状节理与最弱方位一致时按 G 档 0.5'}
                  </option>
                </select>
              </label>
            </div>
          ) : null}
          {letterGroup.length > 1 && symbol === 'Ja' ? (
            <div className="mb-2 flex justify-end">
              <label className={`flex items-center gap-2 whitespace-nowrap text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                <span>{en ? `Clay condition for ${selected?.letter}` : `${selected?.letter} 档黏土状况`}</span>
                <select
                  aria-label={en ? 'Clay condition' : '黏土状况'}
                  data-testid="q-ja-clay"
                  value={optionId}
                  onChange={(event) => {
                    const next = letterGroup.find((item) => item.id === event.target.value)
                    if (next) selectOption(next)
                  }}
                  className={`rounded-lg border px-2.5 py-1.5 text-sm ${
                    darkMode ? 'border-gray-500 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
                  }`}
                >
                  {letterGroup.map((option) => (
                    <option key={option.id} value={option.id} data-testid={`q-factor-row-${option.id}`}>
                      {`${en ? option.label.en : option.label.zh} · ${symbol} = ${formatFactorRating(option)}`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
          <div className="flex justify-center overflow-x-auto">
            <QFactorQuickTable
              darkMode={darkMode}
              language={language}
              symbol={symbol}
              options={options}
              selectedId={optionId}
              selectedLetter={selected?.letter}
              onSelectOption={selectOption}
              onSelectLetter={selectLetter}
            />
          </div>
        </div>

        {rangeOpen && selected ? (
          <label className="mt-4 block space-y-1">
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {en ? (
                <>
                  Adopted <Km math={mathSymbol(symbol)} /> within {selected.range.min}–{selected.range.max}
                </>
              ) : (
                <>
                  区间内采用的 <Km math={mathSymbol(symbol)} />（{selected.range.min}～{selected.range.max}）
                </>
              )}
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

        <div className="mt-5 flex items-center justify-end gap-3">
          <p
            data-testid={`q-${symbol.toLowerCase()}-result`}
            className={`text-sm tabular-nums ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}
          >
            <Km math={mathSymbol(symbol)} /> = {formulaPreview ?? '—'}
          </p>
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
