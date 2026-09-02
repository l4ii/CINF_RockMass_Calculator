import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface RockMassOreTypeFieldProps {
  darkMode: boolean
  language: 'zh' | 'en'
  value: string
  options?: readonly string[]
  listId: string
  inputClassName: string
  align?: 'start' | 'center'
  onChange: (value: string) => void
}

export default function RockMassOreTypeField({
  darkMode,
  language,
  value,
  options = [],
  listId,
  inputClassName,
  align = 'start',
  onChange,
}: RockMassOreTypeFieldProps) {
  const en = language === 'en'
  const label = en ? 'Ore / rock type' : '岩矿类型'
  const openLabel = en ? 'Show rock types' : '打开岩矿类型列表'
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <label className={`block space-y-1 ${align === 'center' ? 'text-center' : ''}`}>
      <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
      <div ref={rootRef} className="relative">
        <input
          aria-label={label}
          aria-expanded={open}
          aria-controls={listId}
          autoComplete="off"
          className={`${inputClassName} appearance-none text-center !px-10 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-list-button]:hidden`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => {
            if (options.length > 0) setOpen(true)
          }}
          placeholder={en ? 'e.g. Granite' : '如：花岗岩'}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={openLabel}
          aria-expanded={open}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (options.length === 0) return
            setOpen((current) => !current)
          }}
          className={`absolute inset-y-0 right-0 flex w-10 items-center justify-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        {open && options.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            className={`absolute z-20 mt-1 w-full overflow-hidden rounded-lg border ${darkMode ? 'border-gray-500 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900 shadow-lg'}`}
          >
            {options.map((option) => {
              const selected = option === value
              return (
                <li key={option}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onChange(option)
                      setOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-center text-sm ${selected ? (darkMode ? 'bg-blue-900/50 text-blue-100' : 'bg-blue-100 text-blue-900') : darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}`}
                  >
                    {option}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </label>
  )
}
