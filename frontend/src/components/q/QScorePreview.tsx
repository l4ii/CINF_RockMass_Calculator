import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { Km } from '../math/Katex'
import { SYM } from '../math/symbols'
import {
  displayedFactorValue,
  formatQValue,
  Q_FACTOR_BOUNDS,
  Q_JA_OPTIONS,
  Q_JN_OPTIONS,
  Q_JR_OPTIONS,
  Q_JW_OPTIONS,
  Q_SRF_OPTIONS,
  type QFormState,
  type QResult,
} from '../../methods/q'

interface QScorePreviewProps {
  darkMode: boolean
  language: 'zh' | 'en'
  state: QFormState
  result: QResult | null
}

function inRange(value: number | null | undefined, min: number, max: number) {
  return value != null && Number.isFinite(value) && value >= min && value <= max
}

const formatPreview = formatQValue

export default function QScorePreview({ darkMode, language, state, result }: QScorePreviewProps) {
  const en = language === 'en'
  const panel = `sticky top-0 rounded-lg border p-4 ${darkMode ? 'border-gray-600 bg-gray-800/80' : 'border-gray-200 bg-white shadow-sm'}`
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const rqdReady = inRange(state.rqd, 0, 100)
  const jn = displayedFactorValue(state.jnId, state.jnValue, Q_JN_OPTIONS)
  const jr = displayedFactorValue(state.jrId, state.jrValue, Q_JR_OPTIONS)
  const ja = displayedFactorValue(state.jaId, state.jaValue, Q_JA_OPTIONS)
  const jw = displayedFactorValue(state.jwId, state.jwValue, Q_JW_OPTIONS)
  const srf = displayedFactorValue(state.srfId, state.srfValue, Q_SRF_OPTIONS)
  const jnReady = inRange(jn, Q_FACTOR_BOUNDS.Jn.min, Q_FACTOR_BOUNDS.Jn.max)
  const jrReady = inRange(jr, Q_FACTOR_BOUNDS.Jr.min, Q_FACTOR_BOUNDS.Jr.max)
  const jaReady = inRange(ja, Q_FACTOR_BOUNDS.Ja.min, Q_FACTOR_BOUNDS.Ja.max)
  const jwReady = inRange(jw, Q_FACTOR_BOUNDS.Jw.min, Q_FACTOR_BOUNDS.Jw.max)
  const srfReady = inRange(srf, Q_FACTOR_BOUNDS.SRF.min, Q_FACTOR_BOUNDS.SRF.max)
  const completedItems = [rqdReady, jnReady, jrReady, jaReady, jwReady, srfReady].filter(Boolean).length
  const blockSize = result?.breakdown.blockSize ?? (rqdReady && jnReady ? (Math.max(10, state.rqd as number) / (jn as number)) : null)
  const shear = result?.breakdown.jointShearStrength ?? (jrReady && jaReady ? (jr as number) / (ja as number) : null)
  const stress = result?.breakdown.activeStress ?? (jwReady && srfReady ? (jw as number) / (srf as number) : null)
  const gradeLine = result ? (en ? result.grade.label.en : result.grade.label.zh) : null

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
    <aside className={panel} data-testid="q-result-preview">
      <h3 className={`mb-1 text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Rating preview' : '分值预览'}</h3>
      <p className={`mb-3 text-xs ${muted}`}>{en ? `${completedItems} / 6 selected` : `已选 ${completedItems} / 6 项`}</p>
      <ul className="space-y-2">
        {row(<Km math={SYM.RQD} />, rqdReady ? `${state.rqd}%` : '—', rqdReady)}
        {row(<Km math={SYM.Jn} />, jnReady ? jn : '—', jnReady)}
        {row(<Km math={SYM.Jr} />, jrReady ? jr : '—', jrReady)}
        {row(<Km math={SYM.Ja} />, jaReady ? ja : '—', jaReady)}
        {row(<Km math={SYM.Jw} />, jwReady ? jw : '—', jwReady)}
        {row(<Km math={SYM.SRF} />, srfReady ? srf : '—', srfReady)}
        {row(<Km math={SYM.RQD_over_Jn} />, blockSize == null ? '—' : formatPreview(blockSize), blockSize != null)}
        {row(<Km math={SYM.Jr_over_Ja} />, shear == null ? '—' : formatPreview(shear), shear != null)}
        {row(<Km math={SYM.Jw_over_SRF} />, stress == null ? '—' : formatPreview(stress), stress != null)}
      </ul>
      <div className={`mt-4 border-t pt-3 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <div data-testid="q-preview-result">
          <div className="flex items-baseline justify-between">
            <span className={`text-sm ${muted}`}><Km math={SYM.Q} />{en ? ' evaluation result' : '评价结果'}</span>
            <span className={`text-2xl font-bold tabular-nums ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{result ? formatPreview(result.q) : '—'}</span>
          </div>
          {gradeLine ? (
            <div className={`mt-2 text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}><p>{gradeLine}</p><p className={`mt-1 text-xs ${muted}`}>{result ? (en ? result.grade.rangeEn ?? result.grade.range : result.grade.range) : ''}</p></div>
          ) : (
            <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {en ? 'Enter the six ratings to show the class.' : '输入六项参数后显示正式等级'}
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}
