import { useEffect, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
  darkMode: boolean
  language: 'zh' | 'en'
  open: boolean
  title: string
  message: string
  detail?: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  darkMode,
  language,
  open,
  title,
  message,
  detail,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const isEn = language === 'en'
  const titleId = 'confirm-dialog-title'
  const detailId = 'confirm-dialog-detail'

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel, open])

  if (!open) return null

  const muted = darkMode ? 'text-gray-400' : 'text-gray-600'
  const panel = darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white text-gray-900'
  const secondary = darkMode
    ? 'border-gray-600 text-gray-200 hover:bg-gray-700'
    : 'border-gray-300 text-gray-700 hover:bg-gray-50'

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 backdrop-blur-[1px]" onMouseDown={onCancel}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={detail ? detailId : undefined}
        onMouseDown={(event) => event.stopPropagation()}
        className={`w-full max-w-md rounded-lg border p-5 shadow-2xl ${panel}`}
      >
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${darkMode ? 'bg-red-950/60 text-red-300' : 'bg-red-50 text-red-600'}`}>
            <AlertTriangle aria-hidden className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-semibold">{title}</h2>
            <p className={`mt-1 text-sm leading-6 ${muted}`}>{message}</p>
          </div>
          <button
            type="button"
            aria-label={isEn ? 'Close' : '关闭'}
            title={isEn ? 'Close' : '关闭'}
            onClick={onCancel}
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>

        {detail ? <p id={detailId} className={`mt-3 border-l-2 border-red-500 pl-3 text-sm ${muted}`}>{detail}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className={`rounded-lg border px-4 py-2 text-sm font-medium ${secondary}`}
          >
            {isEn ? 'Cancel' : '取消'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            {confirmLabel ?? (isEn ? 'Delete' : '删除')}
          </button>
        </div>
      </section>
    </div>
  )
}
