import type { ReactNode } from 'react'
import { BlockMath, InlineMath } from 'react-katex'

const inherit = '[&_.katex]:text-inherit'

export function Km({
  math,
  className = '',
}: {
  math: string
  className?: string
}) {
  return (
    <span className={`${inherit} ${className}`.trim()}>
      <InlineMath math={math} />
    </span>
  )
}

export function Kblock({
  math,
  className = '',
  children,
}: {
  math?: string
  className?: string
  children?: ReactNode
}) {
  return (
    <div className={`${inherit} ${className}`.trim()}>
      {math != null ? <BlockMath math={math} /> : children}
    </div>
  )
}
