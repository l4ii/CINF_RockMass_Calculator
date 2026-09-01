import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface GsiStructureExampleDialogProps {
  language: 'zh' | 'en'
  title: string
  description: string
  images: readonly string[]
  onClose: () => void
}

export default function GsiStructureExampleDialog({
  language,
  title,
  description,
  images,
  onClose,
}: GsiStructureExampleDialogProps) {
  const en = language === 'en'
  const [index, setIndex] = useState(0)
  const total = images.length
  const current = images[Math.min(index, Math.max(0, total - 1))]
  const closeLabel = en ? 'Close' : '关闭'
  const prevLabel = en ? 'Previous' : '上一张'
  const nextLabel = en ? 'Next' : '下一张'

  useEffect(() => {
    setIndex(0)
  }, [title])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (total < 2) return
      if (event.key === 'ArrowLeft') setIndex((value) => (value - 1 + total) % total)
      if (event.key === 'ArrowRight') setIndex((value) => (value + 1) % total)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, total])

  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gsi-structure-example-title"
      data-testid="gsi-structure-example-dialog"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-lg bg-white/15 text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label={closeLabel}
        title={closeLabel}
        onClick={onClose}
      >
        <X className="h-5 w-5" aria-hidden />
      </button>
      <div
        className="flex max-h-full w-full max-w-4xl flex-col items-center"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="gsi-structure-example-title" className="text-center text-lg font-semibold text-white">
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-center text-sm leading-6 text-white/80">{description}</p>
        <div className="relative mt-4 flex w-full items-center justify-center">
          {total > 1 ? (
            <button
              type="button"
              className="absolute left-0 z-10 grid h-10 w-10 place-items-center rounded-lg bg-white/15 text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label={prevLabel}
              onClick={() => setIndex((value) => (value - 1 + total) % total)}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
          ) : null}
          <img
            src={current}
            alt=""
            className="max-h-[72vh] max-w-full rounded-lg bg-white object-contain shadow-2xl"
          />
          {total > 1 ? (
            <button
              type="button"
              className="absolute right-0 z-10 grid h-10 w-10 place-items-center rounded-lg bg-white/15 text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label={nextLabel}
              onClick={() => setIndex((value) => (value + 1) % total)}
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          ) : null}
        </div>
        {total > 1 ? (
          <div className="mt-3 flex items-center gap-1.5" aria-hidden>
            {images.map((src, imageIndex) => (
              <button
                key={src}
                type="button"
                className={`h-2 w-2 rounded-full ${imageIndex === index ? 'bg-white' : 'bg-white/40'}`}
                onClick={() => setIndex(imageIndex)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
