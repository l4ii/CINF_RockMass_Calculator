import { useLayoutEffect, useRef, type ReactNode } from 'react'

/** Keep the dedicated about-page scroller at the top whenever its page changes. */
export function useResetScrollTop<T extends HTMLElement>(pageKey: unknown) {
  const ref = useRef<T>(null)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    node.scrollTop = 0
    node.scrollLeft = 0
    node.scrollTo?.({ top: 0, left: 0, behavior: 'auto' })
  }, [pageKey])

  return ref
}

type AboutToneProps = {
  darkMode: boolean
}

type AboutPageHeroProps = AboutToneProps & {
  eyebrow: string
  title: string
  summary: string
  specialties: string[]
  index: string
  children?: ReactNode
}

type AboutSectionHeadingProps = AboutToneProps & {
  index: string
  eyebrow: string
  title: string
  description?: string
  aside?: string
  className?: string
}

export function AboutPageHero({ darkMode, eyebrow, title, summary, specialties, index, children }: AboutPageHeroProps) {
  const surface = darkMode
    ? 'border-gray-700 bg-gray-800/75 shadow-black/20'
    : 'border-slate-200 bg-white shadow-slate-200/70'
  const softSurface = darkMode ? 'border-gray-700 bg-gray-900/45' : 'border-slate-200 bg-slate-50/80'
  const eyebrowColor = darkMode ? 'text-blue-300' : 'text-blue-700'
  const headingColor = darkMode ? 'text-white' : 'text-slate-900'
  const summaryColor = darkMode ? 'text-gray-300' : 'text-slate-700'
  const chip = darkMode
    ? 'border-blue-700/60 bg-blue-950/45 text-blue-200'
    : 'border-blue-200 bg-blue-50 text-blue-800'

  return (
    <section className={`mb-8 overflow-hidden rounded-xl border shadow-sm ${surface}`}>
      <div className={`flex items-center justify-between gap-4 border-b px-5 py-3 sm:px-7 ${softSurface}`}>
        <span className={`text-[11px] font-bold tracking-[0.18em] ${eyebrowColor}`}>ABOUT / {index}</span>
        <span className={`h-px min-w-10 flex-1 ${darkMode ? 'bg-gray-700' : 'bg-slate-200'}`} aria-hidden="true" />
        <span className={`text-[11px] font-medium ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>了解我们</span>
      </div>
      <div className="grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] lg:items-center lg:gap-10">
        <div className="min-w-0">
          <p className={`mb-3 text-[11px] font-semibold tracking-[0.16em] ${eyebrowColor}`}>{eyebrow}</p>
          <h2 className={`text-3xl font-bold leading-tight sm:text-4xl ${headingColor}`}>{title}</h2>
          <p className={`mt-4 max-w-3xl text-sm leading-7 sm:text-base ${summaryColor}`}>{summary}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {specialties.map((specialty) => (
              <span key={specialty} className={`rounded-full border px-3 py-1 text-xs font-medium ${chip}`}>
                {specialty}
              </span>
            ))}
          </div>
        </div>
        {children && <div className="min-w-0">{children}</div>}
      </div>
    </section>
  )
}

export function AboutSectionHeading({ darkMode, index, eyebrow, title, description, aside, className = '' }: AboutSectionHeadingProps) {
  const eyebrowColor = darkMode ? 'text-blue-300' : 'text-blue-700'
  const headingColor = darkMode ? 'text-white' : 'text-slate-900'
  const descriptionColor = darkMode ? 'text-gray-400' : 'text-slate-600'
  const asideSurface = darkMode ? 'border-gray-700 bg-gray-800/60 text-gray-400' : 'border-slate-200 bg-white text-slate-500'

  return (
    <header className={`mb-5 flex flex-col gap-3 border-l-2 pl-4 sm:flex-row sm:items-end sm:justify-between ${darkMode ? 'border-blue-400' : 'border-blue-600'} ${className}`}>
      <div className="min-w-0">
        <div className={`mb-2 flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] ${eyebrowColor}`}>
          <span>SECTION / {index}</span>
          <span className={`h-px w-7 ${darkMode ? 'bg-blue-400/50' : 'bg-blue-600/45'}`} aria-hidden="true" />
          <span className="font-semibold">{eyebrow}</span>
        </div>
        <h2 className={`text-2xl font-bold leading-tight sm:text-3xl ${headingColor}`}>{title}</h2>
        {description && <p className={`mt-2 max-w-3xl text-sm leading-6 ${descriptionColor}`}>{description}</p>}
      </div>
      {aside && <span className={`w-fit shrink-0 border px-3 py-1.5 text-xs font-medium ${asideSurface}`}>{aside}</span>}
    </header>
  )
}
