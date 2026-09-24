import type { ReactNode, Ref } from 'react'

export interface CollapsiblePanel {
  key: string
  label: string
  content: ReactNode
}

interface RmrParamSectionProps {
  darkMode: boolean
  language: 'zh' | 'en'
  title: ReactNode
  score: number | null
  children: ReactNode
  /** 参数说明 */
  description?: ReactNode
  /** 操作提示：告诉用户这一步该怎么选 */
  hint?: ReactNode
  sectionRef?: Ref<HTMLElement>
  sectionId?: string
  /** 可折叠的标准评分表 / 详评面板 */
  panels?: CollapsiblePanel[]
}

export default function RmrParamSection({
  darkMode,
  language: _language,
  title,
  score,
  children,
  description,
  hint,
  sectionRef,
  sectionId,
  panels,
}: RmrParamSectionProps) {
  const border = darkMode ? 'border-gray-600' : 'border-gray-200'
  const bg = darkMode ? 'bg-gray-800/50' : 'bg-white'

  return (
    <section ref={sectionRef} id={sectionId} className={`scroll-mt-4 rounded-lg border ${border} ${bg} p-4 sm:p-5`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{title}</h3>
        <span
          className={`shrink-0 rounded-md px-2.5 py-1 text-sm font-semibold tabular-nums ${
            score != null
              ? darkMode
                ? 'bg-blue-900/50 text-blue-200'
                : 'bg-blue-50 text-blue-800'
              : darkMode
                ? 'bg-gray-700 text-gray-400'
                : 'bg-gray-100 text-gray-400'
          }`}
        >
          {score != null ? score : '—'}
        </span>
      </div>
      {description ? (
        <p className={`mb-2 text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
      ) : null}
      {hint ? (
        <div
            className={`mb-3 rounded-lg border-l-2 px-3 py-2 text-sm leading-relaxed ${
            darkMode ? 'border-blue-500 bg-blue-950/30 text-blue-200' : 'border-blue-400 bg-blue-50/70 text-blue-800'
          }`}
        >
          {hint}
        </div>
      ) : null}
      {children}
      {panels && panels.length > 0 ? (
        <div className={`mt-3 space-y-3 border-t pt-3 ${darkMode ? 'border-gray-600' : 'border-gray-100'}`}>
          {panels.map((panel) => (
            <div key={panel.key} className="space-y-3">
              <div className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{panel.label}</div>
              {panel.content}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export function OptionRadioGroup({
  darkMode,
  name,
  options,
  value,
  onChange,
}: {
  darkMode: boolean
  name: string
  options: { id: string; label: string; score?: number }[]
  value: string | null
  onChange: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
      {options.map((opt) => {
        const selected = value === opt.id
        return (
          <label
            key={opt.id}
            className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
              selected
                ? darkMode
                  ? 'border-blue-500 bg-blue-950/40 text-blue-100'
                  : 'border-blue-500 bg-blue-50 text-blue-900'
                : darkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700/40'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              className="mt-0.5"
              name={name}
              checked={selected}
              onChange={() => onChange(opt.id)}
            />
            <span className="flex-1 leading-snug">{opt.label}</span>
            {opt.score != null ? (
              <span className={`shrink-0 tabular-nums ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {opt.score}
              </span>
            ) : null}
          </label>
        )
      })}
    </div>
  )
}

export function SelectField({
  darkMode,
  language,
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  darkMode: boolean
  language: 'zh' | 'en'
  label: string
  value: string | null
  onChange: (id: string) => void
  options: { id: string; label: string }[]
  placeholder?: string
}) {
  return (
    <label className="block space-y-1">
      <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
      <select
        className={`w-full rounded-lg border px-3 py-2 text-sm ${
          darkMode ? 'border-gray-500 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
        }`}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          {placeholder ?? (language === 'en' ? 'Select an option' : '请选择')}
        </option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
