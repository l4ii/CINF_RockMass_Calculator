import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { Km } from '../math/Katex'
import { SYM } from '../math/symbols'
import {
  GSI_STRUCTURE_OPTIONS,
  GSI_SURFACE_OPTIONS,
  type GsiFormState,
  type GsiResult,
} from '../../methods/gsi'

interface GsiScorePreviewProps {
  darkMode: boolean
  language: 'zh' | 'en'
  state: GsiFormState
  result: GsiResult | null
}

function inRange(value: number | null | undefined, min: number, max: number) {
  return value != null && Number.isFinite(value) && value >= min && value <= max
}

function round1(value: number) {
  return Math.round((value + Number.EPSILON) * 10) / 10
}

export default function GsiScorePreview({ darkMode, language, state, result }: GsiScorePreviewProps) {
  const en = language === 'en'
  const panel = `sticky top-0 rounded-lg border p-4 ${darkMode ? 'border-gray-600 bg-gray-800/80' : 'border-gray-200 bg-white shadow-sm'}`
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const quantitative = state.entryMode === 'quantitative'
  const structure = GSI_STRUCTURE_OPTIONS.find((item) => item.id === state.structureId)
  const surface = GSI_SURFACE_OPTIONS.find((item) => item.id === state.surfaceQualityId)
  const jcondReady = inRange(state.jcond89Value, 0, 30)
  const rqdReady = inRange(state.rqd, 0, 100)
  const completedItems = quantitative
    ? [jcondReady, rqdReady].filter(Boolean).length
    : [Boolean(structure), Boolean(surface)].filter(Boolean).length
  const scaleA = result?.scaleA ?? (quantitative
    ? (state.quantChartScaleA ?? (jcondReady ? round1(1.5 * (state.jcond89Value as number)) : null))
    : (state.chartScaleA ?? (surface ? surface.scaleA : null)))
  const scaleB = result?.scaleB ?? (quantitative
    ? (state.quantChartScaleB ?? (rqdReady ? round1((state.rqd as number) / 2) : null))
    : (state.chartScaleB ?? (structure ? structure.scaleB : null)))
  const emptyGrade = quantitative
    ? (en ? <>Enter <Km math={SYM.JCond89} /> and <Km math={SYM.RQD} /> to show the class.</> : <>输入 <Km math={SYM.JCond89} /> 和 <Km math={SYM.RQD} /> 后显示正式等级</>)
    : (en ? 'Select a point on the chart to show the class.' : '在图上点选点位后显示正式等级')
  const gradeLine = result ? (en ? result.grade.labelEn : result.grade.label) : null

  const row = (label: ReactNode, value: ReactNode, done: boolean) => (
    <li className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-sm ${done ? (darkMode ? 'bg-blue-950/35' : 'bg-blue-50/80') : (darkMode ? 'bg-gray-700/40' : 'bg-gray-50')}`}>
      <span className={`flex min-w-0 items-center gap-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
        <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${done ? 'bg-blue-600 text-white' : (darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-500')}`}>
          {done ? <Check className="h-3 w-3" aria-hidden /> : '·'}
        </span>
        <span className="min-w-0 break-words leading-5">{label}</span>
      </span>
      <span className={`ml-2 shrink-0 font-semibold tabular-nums ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{value}</span>
    </li>
  )

  return (
    <aside className={panel} data-testid="gsi-result-preview">
      <h3 className={`mb-1 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Rating preview' : '分值预览'}</h3>
      <p className={`mb-3 text-xs ${muted}`}>{en ? `${completedItems} / 2 selected` : `已选 ${completedItems} / 2 项`}</p>
      <ul className="space-y-2">
        {quantitative ? (
          <>
            {row(en ? <>Joint condition <Km math={SYM.JCond89} /></> : <>节理状态 <Km math={SYM.JCond89} /></>, jcondReady ? state.jcond89Value : '—', jcondReady)}
            {row(en ? <>Rock Quality Designation <Km math={SYM.RQD} /></> : <>岩石质量指标 <Km math={SYM.RQD} /></>, rqdReady ? `${state.rqd}%` : '—', rqdReady)}
          </>
        ) : (
          <>
            {row(en ? 'Structure' : '岩体结构', structure ? (en ? structure.labelEn : structure.label) : '—', Boolean(structure))}
            {row(en ? 'Surface condition' : '表面条件', surface ? (en ? surface.labelEn : surface.label) : '—', Boolean(surface))}
          </>
        )}
        {row(en ? 'Scale A' : '刻度 A', scaleA == null ? '—' : scaleA, scaleA != null)}
        {row(en ? 'Scale B' : '刻度 B', scaleB == null ? '—' : scaleB, scaleB != null)}
      </ul>
      <div className={`mt-4 border-t pt-3 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <div data-testid="gsi-preview-result">
          <div className="flex items-baseline justify-between">
            <span className={`text-sm ${muted}`}><Km math={SYM.GSI} />{en ? ' evaluation result' : '评价结果'}</span>
            <span className={`text-2xl font-bold tabular-nums ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{result ? result.gsi : '—'}</span>
          </div>
          {gradeLine ? (
            <div className={`mt-2 text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
              <p>{gradeLine}</p>
              <p className={`mt-1 text-xs ${muted}`}>{result ? (en ? result.grade.rangeEn : result.grade.range) : ''}</p>
            </div>
          ) : (
            <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{emptyGrade}</p>
          )}
        </div>
      </div>
    </aside>
  )
}
