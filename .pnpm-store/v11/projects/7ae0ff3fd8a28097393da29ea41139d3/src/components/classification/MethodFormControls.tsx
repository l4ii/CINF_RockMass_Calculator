import type { KeyboardEventHandler, ReactNode, WheelEventHandler } from 'react'

export interface LocalOption {
  id: string
  label: string
  labelEn?: string
  hint?: string
}

interface MethodSectionProps {
  title: string
  description?: string
  source?: string
  darkMode: boolean
  children: ReactNode
  prominent?: boolean
}

export function MethodSection({ title, description, source, darkMode, children, prominent = false }: MethodSectionProps) {
  return (
    <section className={`rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-800/35' : 'border-gray-200 bg-white'}`}>
      <header className={`border-b px-4 py-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className={`${prominent ? 'text-base' : 'text-sm'} font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{title}</h2>
            {description ? <p className={`mt-1 ${prominent ? 'text-sm' : 'text-xs'} leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p> : null}
          </div>
          {source ? <span className={`${prominent ? 'text-sm' : 'text-[11px]'} ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{source}</span> : null}
        </div>
      </header>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">{children}</div>
    </section>
  )
}

interface FieldShellProps {
  field: string
  label: string
  labelClassName?: string
  hint?: string
  darkMode: boolean
  children: ReactNode
  wide?: boolean
}

function FieldShell({ field, label, labelClassName = 'text-xs', hint, darkMode, children, wide }: FieldShellProps) {
  return (
    <div data-field={field} className={wide ? 'md:col-span-2' : undefined}>
      <div className="mb-1 flex min-h-5 items-end justify-between gap-2">
        <label htmlFor={`method-field-${field}`} className={`${labelClassName} font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</label>
        {hint ? <span className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{hint}</span> : null}
      </div>
      {children}
    </div>
  )
}

export function NumberField({
  field,
  label,
  value,
  unit,
  min,
  max,
  step = 'any',
  hint,
  labelClassName,
  inputClassName,
  onWheel,
  onKeyDown,
  darkMode,
  onChange,
}: {
  field: string
  label: string
  value: number | null
  unit?: string
  min?: number
  max?: number
  step?: number | 'any'
  hint?: string
  labelClassName?: string
  inputClassName?: string
  onWheel?: WheelEventHandler<HTMLInputElement>
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>
  darkMode: boolean
  onChange: (value: number | null) => void
}) {
  return (
    <FieldShell field={field} label={label} labelClassName={labelClassName} hint={hint} darkMode={darkMode}>
      <div className="relative">
        <input
          id={`method-field-${field}`}
          type="number"
          value={value ?? ''}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          className={`${inputClassName ?? ''} w-full rounded-lg border px-3 py-2 text-center text-sm tabular-nums outline-none focus:ring-2 focus:ring-blue-500/30 ${
            unit ? 'pr-14' : ''
          } ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
        />
        {unit ? <span className={`pointer-events-none absolute right-3 top-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{unit}</span> : null}
      </div>
    </FieldShell>
  )
}

export function SelectField({
  field,
  label,
  value,
  options,
  placeholder,
  hint,
  darkMode,
  language,
  onChange,
  wide,
}: {
  field: string
  label: string
  value: string | null
  options: LocalOption[]
  placeholder?: string
  hint?: string
  darkMode: boolean
  language: 'zh' | 'en'
  onChange: (value: string) => void
  wide?: boolean
}) {
  return (
    <FieldShell field={field} label={label} hint={hint} darkMode={darkMode} wide={wide}>
      <select
        id={`method-field-${field}`}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-lg border px-3 py-2 text-center text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${
          darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
        }`}
      >
        <option value="">{placeholder ?? (language === 'en' ? 'Select an option' : '请选择')}</option>
        {options.map((option) => <option key={option.id} value={option.id}>{language === 'en' && option.labelEn ? option.labelEn : option.label}</option>)}
      </select>
    </FieldShell>
  )
}

export function SegmentedField({
  field,
  label,
  value,
  options,
  darkMode,
  language,
  onChange,
}: {
  field: string
  label: string
  value: string
  options: LocalOption[]
  darkMode: boolean
  language: 'zh' | 'en'
  onChange: (value: string) => void
}) {
  return (
    <FieldShell field={field} label={label} darkMode={darkMode} wide>
      <div id={`method-field-${field}`} className={`grid overflow-hidden rounded-lg border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((option) => {
          const selected = value === option.id
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
              className={`min-h-10 border-r px-2 py-2 text-xs font-medium last:border-r-0 ${
                selected
                  ? 'bg-blue-600 text-white'
                  : darkMode
                    ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {language === 'en' && option.labelEn ? option.labelEn : option.label}
            </button>
          )
        })}
      </div>
    </FieldShell>
  )
}
