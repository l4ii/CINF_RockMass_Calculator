import { useRef, type ReactNode } from 'react'

function formatCoefficientScore(value: number | null | undefined, compact = false) {
  if (value == null) return '—'
  return String(Number(value.toFixed(compact ? 1 : 3)))
}

export function CoefficientScoreSlot({
  darkMode,
  language,
  symbol,
  score,
  editing,
  canEdit,
  value,
  validationMin,
  validationMax,
  onStartEdit,
  onChange,
  onEndEdit,
  scoreTestId,
  field,
  compact = false,
}: {
  darkMode: boolean
  language: 'zh' | 'en'
  symbol: string
  score: number | null | undefined
  editing: boolean
  canEdit: boolean
  value: number | null
  validationMin: number
  validationMax: number
  onStartEdit: () => void
  onChange: (value: number | null) => void
  onEndEdit: () => void
  scoreTestId: string
  field?: string
  compact?: boolean
}) {
  const en = language === 'en'
  const buttonRef = useRef<HTMLButtonElement>(null)
  const previousValue = useRef<number | null>(null)
  const finishEdit = () => {
    onEndEdit()
    requestAnimationFrame(() => buttonRef.current?.focus())
  }
  const invalid = value != null && (!Number.isFinite(value) || value < validationMin || value > validationMax)
  const editHint = en ? 'Click to edit' : '点击修改'
  const invalidText = en
    ? `Value must be between ${validationMin} and ${validationMax}.`
    : `异常值：请输入 ${validationMin}～${validationMax} 范围内的 ${symbol}。`
  const scoreClass = `text-sm font-semibold tabular-nums ${score != null ? (darkMode ? 'text-blue-200' : 'text-blue-800') : (darkMode ? 'text-gray-400' : 'text-gray-600')}`
  const box = compact ? 'h-8 w-12' : 'h-8 w-24'
  const align = compact ? 'justify-center px-1 text-center' : 'justify-end pr-2.5 text-right'
  return (
    <div data-field={field} className={`relative shrink-0 ${box}`}>
      {canEdit && editing ? (
        <input
          aria-label={en ? `${symbol} adopted value` : `${symbol} 输入值`}
          aria-invalid={invalid}
          min={validationMin}
          max={validationMax}
          autoFocus
          type="number"
          step="0.01"
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value === '' || !Number.isFinite(event.target.valueAsNumber) ? null : event.target.valueAsNumber)}
          onFocus={(event) => event.currentTarget.select()}
          onBlur={onEndEdit}
          onWheel={(event) => event.currentTarget.blur()}
          onKeyDown={(event) => {
            if (['ArrowUp', 'ArrowDown', 'e', 'E', '+', '-'].includes(event.key)) event.preventDefault()
            if (event.key === 'Enter') { event.preventDefault(); finishEdit() }
            if (event.key === 'Escape') {
              event.preventDefault()
              onChange(previousValue.current)
              finishEdit()
            }
          }}
          placeholder={en ? 'Enter value' : '请输入数值'}
          className={`absolute inset-0 ${box} rounded-lg border text-sm tabular-nums outline-none focus:ring-2 focus:ring-blue-500/30 ${compact ? 'px-1 text-center' : 'px-2 text-right'} ${darkMode ? 'border-gray-500 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
        />
      ) : canEdit ? (
        <button
          ref={buttonRef}
          type="button"
          aria-label={en ? `Edit ${symbol}` : `修改 ${symbol}`}
          title={editHint}
          onClick={() => { previousValue.current = value; onStartEdit() }}
          className={`group absolute inset-0 flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${align}`}
        >
          <span data-testid={scoreTestId} className={scoreClass}>{formatCoefficientScore(score, compact)}</span>
          <span className={`absolute right-0 top-0 text-[11px] font-semibold leading-none ${invalid ? 'text-red-600 dark:text-red-300' : (darkMode ? 'text-blue-300' : 'text-blue-700')}`} aria-hidden>*</span>
          <span className={`pointer-events-none absolute bottom-full right-0 z-20 mb-1 hidden whitespace-nowrap rounded-md px-2 py-1 text-xs shadow-sm group-hover:block group-focus-visible:block ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-900 text-white'}`}>{editHint}</span>
        </button>
      ) : (
        <div data-testid={scoreTestId} className={`flex h-full w-full items-center ${compact ? 'justify-center' : 'justify-end'} ${scoreClass}`}>{formatCoefficientScore(score, compact)}</div>
      )}
      {invalid ? <p role="alert" className={`pointer-events-none absolute right-0 top-full z-20 mt-1 w-max max-w-[16rem] rounded-md px-2 py-1 text-left text-xs shadow-sm ${darkMode ? 'bg-gray-800 text-red-300' : 'bg-white text-red-600 ring-1 ring-red-200'}`}>{invalidText}</p> : null}
    </div>
  )
}

export function CoefficientSectionHeader({
  darkMode,
  language,
  title,
  symbol,
  score,
  editing,
  canEdit,
  value,
  validationMin,
  validationMax,
  onStartEdit,
  onChange,
  onEndEdit,
  scoreTestId,
  testId,
  field,
  titleExtra,
}: {
  darkMode: boolean
  language: 'zh' | 'en'
  title: ReactNode
  symbol: string
  score: number | null | undefined
  editing: boolean
  canEdit: boolean
  value: number | null
  validationMin: number
  validationMax: number
  onStartEdit: () => void
  onChange: (value: number | null) => void
  onEndEdit: () => void
  scoreTestId: string
  testId?: string
  field?: string
  titleExtra?: ReactNode
}) {
  return (
    <div data-testid={testId} className="mb-2 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <h2 className={`min-w-0 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{title}</h2>
        {titleExtra}
      </div>
      <CoefficientScoreSlot
        darkMode={darkMode}
        language={language}
        symbol={symbol}
        score={score}
        editing={editing}
        canEdit={canEdit}
        value={value}
        validationMin={validationMin}
        validationMax={validationMax}
        onStartEdit={onStartEdit}
        onChange={onChange}
        onEndEdit={onEndEdit}
        scoreTestId={scoreTestId}
        field={field}
      />
    </div>
  )
}
