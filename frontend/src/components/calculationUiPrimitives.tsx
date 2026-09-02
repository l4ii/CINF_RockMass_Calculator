import type { InputHTMLAttributes, ReactNode } from 'react'

export function UnitBadge({
  darkMode,
  children,
  className = '',
}: {
  darkMode: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex min-h-[2.5rem] shrink-0 items-center border-l px-2.5 text-xs font-medium tabular-nums ${
        darkMode ? 'border-gray-500 bg-gray-700/45 text-gray-200' : 'border-gray-200 bg-gray-50 text-gray-600'
      } ${className}`}
    >
      {children}
    </span>
  )
}

export function FormulaFrame({
  darkMode,
  compact,
  className = '',
  children,
}: {
  darkMode: boolean
  compact?: boolean
  className?: string
  children: ReactNode
}) {
  const pad = compact ? 'px-2 py-2' : 'px-4 py-4'
  return (
    <div
      className={`overflow-x-auto rounded-lg border ${pad} ${
        darkMode ? 'border-gray-500 bg-gray-700/35' : 'border-gray-200 bg-gray-50'
      } ${compact ? '' : 'mb-4'} ${className}`}
    >
      {children}
    </div>
  )
}

export function ParameterFrame({
  darkMode,
  title = '参数输入',
  showTitle = true,
  className = '',
  children,
}: {
  darkMode: boolean
  title?: string
  showTitle?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      {showTitle ? (
        <div className={`mb-3 text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{title}</div>
      ) : null}
      {children}
    </div>
  )
}

type InputWithTrailingUnitProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  darkMode: boolean
  className?: string
  inputClassName?: string
  unit?: string | null
}

export function QuickCalcLink({
  darkMode,
  language,
  onClick,
  testId,
  label,
}: {
  darkMode: boolean
  language: 'zh' | 'en'
  onClick: () => void
  testId?: string
  label?: string
}) {
  const en = language === 'en'
  return (
    <div className="mt-1 flex justify-end">
      <button
        type="button"
        data-testid={testId}
        onClick={onClick}
        className={`text-sm font-medium underline underline-offset-2 ${
          darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800'
        }`}
      >
        ({label ?? (en ? 'Quick calculation' : '快速计算')})
      </button>
    </div>
  )
}

export function InputWithTrailingUnit({
  darkMode,
  className = '',
  inputClassName = '',
  unit,
  disabled,
  readOnly,
  ...inputProps
}: InputWithTrailingUnitProps) {
  const borderCls = darkMode ? 'border-gray-500 bg-gray-700/80' : 'border-gray-300 bg-white'
  const focusRing = darkMode ? 'focus-within:ring-blue-400/40' : 'focus-within:ring-blue-500'

  const inputCls = `min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-base focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 read-only:opacity-90 ${
    darkMode ? 'text-gray-100 placeholder-gray-400' : 'text-gray-900 placeholder-gray-400'
  } ${inputClassName}`

  const showUnit = unit != null && String(unit).trim() !== ''

  return (
    <div
      className={`flex min-h-[2.5rem] min-w-0 items-stretch overflow-hidden rounded-lg border transition-shadow ${borderCls} focus-within:ring-2 ${focusRing} focus-within:border-transparent ${className}`}
    >
      <input
        type="text"
        className={inputCls}
        disabled={disabled}
        readOnly={readOnly}
        {...inputProps}
      />
      {showUnit ? <UnitBadge darkMode={darkMode}>{unit}</UnitBadge> : null}
    </div>
  )
}
