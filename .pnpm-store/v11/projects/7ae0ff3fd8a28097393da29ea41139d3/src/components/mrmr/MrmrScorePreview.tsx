import type { MrmrResult } from '../../methods/mrmr'

interface MrmrScorePreviewProps {
  darkMode: boolean
  language: 'zh' | 'en'
  result: MrmrResult | null
  issueCount: number
}

export default function MrmrScorePreview({ darkMode, language, result, issueCount }: MrmrScorePreviewProps) {
  const en = language === 'en'
  const panel = `sticky top-0 rounded-lg border p-4 sm:p-5 ${darkMode ? 'border-gray-600 bg-gray-800/80' : 'border-gray-200 bg-white shadow-sm'}`
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'
  if (!result) {
    return (
      <aside className={panel} data-testid="mrmr-result-preview">
        <h2 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'MRMR result' : 'MRMR 结果'}</h2>
        <p className={`mt-3 text-sm leading-relaxed ${muted}`}>
          {en ? `${issueCount} required item(s) remain. Complete the applicability check and parameter sequence to calculate.` : `还有 ${issueCount} 项必填内容未完成。请先完成适用性判断和参数填写。`}
        </p>
      </aside>
    )
  }
  return (
    <aside className={panel} data-testid="mrmr-result-preview">
      <h2 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'MRMR result' : 'MRMR 结果'}</h2>
      <div className={`mt-4 rounded-lg border px-4 py-4 text-center ${darkMode ? 'border-blue-500/40 bg-blue-950/40' : 'border-blue-200 bg-blue-50'}`}>
        <div className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{en ? 'MRMR final rating' : 'MRMR 最终评分'}</div>
        <div className={`mt-1 text-3xl font-bold tabular-nums ${darkMode ? 'text-blue-100' : 'text-blue-900'}`}>{Number(result.mrmr.toFixed(1))}</div>
        <div className={`mt-1 text-sm font-medium ${darkMode ? 'text-blue-100' : 'text-blue-900'}`}>{en ? result.grade.labelEn : result.grade.label}</div>
      </div>
      <div className={`mt-4 rounded-lg border px-3 py-3 ${darkMode ? 'border-gray-600 bg-gray-900/40' : 'border-gray-200 bg-gray-50'}`}>
        <div className={`text-sm ${muted}`}>{en ? 'IRMR in-situ rating' : 'IRMR 原位岩体质量'}</div>
        <div className={`mt-1 text-2xl font-bold tabular-nums ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{Number(result.irmr.toFixed(1))}</div>
      </div>
      <div className={`mt-4 border-t pt-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`text-sm ${muted}`}>{en ? 'Controlling factor used' : '采用的控制因素'}</div>
        <div className={`mt-1 text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          {en ? result.controllingAdjustment.labelEn : result.controllingAdjustment.label} · {Math.round(result.controllingAdjustment.factor * 100)}%
        </div>
        <p className={`mt-2 text-sm leading-relaxed ${muted}`}>{en ? result.formula : result.formula}</p>
      </div>
      <details className={`mt-4 border-t pt-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <summary className={`cursor-pointer text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{en ? 'Adjustment candidates' : '候选修正值'}</summary>
        <ul className="mt-2 space-y-1.5">
          {result.adjustmentCandidates.map((item) => <li key={item.id} className={`flex items-center justify-between gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}><span>{en ? item.labelEn : item.label}</span><span className="font-medium tabular-nums">{Math.round(item.factor * 100)}%</span></li>)}
        </ul>
      </details>
    </aside>
  )
}
