import { useEffect, useState } from 'react'

export type ClassificationExportFormat = 'case' | 'report'

interface ClassificationExportDialogProps {
  darkMode: boolean
  language?: 'zh' | 'en'
  open: boolean
  caseName: string
  busy: boolean
  onExport: (formats: ClassificationExportFormat[]) => void
  onClose: () => void
}

const OPTIONS: {
  id: ClassificationExportFormat
  title: { zh: string; en: string }
  description: { zh: string; en: string }
}[] = [
  {
    id: 'report',
    title: { zh: 'Word 文字报告', en: 'Word report' },
    description: {
      zh: '包含工程信息、参数依据、计算过程、结果和采用标准。',
      en: 'Includes project information, parameter sources, calculations, results, and the applied standard.',
    },
  },
  {
    id: 'case',
    title: { zh: '.rmcal 案例文件', en: '.rmcal case file' },
    description: {
      zh: '保留全部点位输入，可重新导入本软件继续编辑。',
      en: 'Preserves all point inputs for later import and editing in this application.',
    },
  },
]

export default function ClassificationExportDialog({
  darkMode,
  language = 'zh',
  open,
  caseName,
  busy,
  onExport,
  onClose,
}: ClassificationExportDialogProps) {
  const isEn = language === 'en'
  const [selected, setSelected] = useState<ClassificationExportFormat[]>(['report', 'case'])

  useEffect(() => {
    if (open) setSelected(['report', 'case'])
  }, [open])

  if (!open) return null

  const toggle = (format: ClassificationExportFormat) => {
    setSelected((current) =>
      current.includes(format) ? current.filter((item) => item !== format) : [...current, format]
    )
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="classification-export-title"
        onMouseDown={(event) => event.stopPropagation()}
        className={`w-full max-w-lg rounded-lg border p-5 shadow-xl ${
          darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white text-gray-900'
        }`}
      >
        <h2 id="classification-export-title" className="text-base font-semibold">{isEn ? 'Select export content' : '选择导出内容'}</h2>
        <p className={`mt-1 truncate text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{caseName}</p>

        <div className="mt-4 divide-y divide-gray-200 dark:divide-gray-700">
          {OPTIONS.map((option) => (
            <label key={option.id} className="flex cursor-pointer items-start gap-3 py-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={selected.includes(option.id)}
                onChange={() => toggle(option.id)}
              />
              <span>
                <span className="block text-sm font-medium">{option.title[language]}</span>
                <span className={`mt-0.5 block text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {option.description[language]}
                </span>
              </span>
            </label>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className={`rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50 ${
              darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {isEn ? 'Cancel' : '取消'}
          </button>
          <button
            type="button"
            disabled={busy || selected.length === 0}
            onClick={() => onExport(selected)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? isEn ? 'Exporting…' : '导出中…'
              : isEn
                ? selected.length > 1 ? 'Export selected' : 'Export'
                : `导出${selected.length > 1 ? '所选内容' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
