import { formatQValue, getQAnalysis, Q_GRADES, type QResult } from '../../methods/q'

export default function QResultPanel({ result, darkMode, language }: { result: QResult | null; darkMode: boolean; language: 'zh' | 'en' }) {
  const en = language === 'en'
  const muted = darkMode ? 'text-gray-400' : 'text-gray-600'
  const border = darkMode ? 'border-gray-600' : 'border-gray-200'
  return <section data-testid="q-result-analysis" className={`rounded-lg border p-4 sm:p-5 ${darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white shadow-sm'}`}>
    <h2 className="text-base font-semibold">{en ? 'Results and interpretation' : '结果与分析'}</h2>
    {result ? <>
      <div className={`mt-4 grid gap-4 rounded-lg p-4 sm:grid-cols-2 ${darkMode ? 'bg-blue-950/40' : 'bg-blue-50'}`}>
        <div><p className={`text-sm ${muted}`}>{en ? 'Calculated Q' : '计算 Q 值'}</p><p className={`mt-1 text-2xl font-bold tabular-nums ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{formatQValue(result.q)}</p></div>
        <div><p className={`text-sm ${muted}`}>{en ? 'Barton rock-mass class' : '巴顿岩体质量等级'}</p><p className="mt-1 text-2xl font-bold">{result.grade.label[language]}</p><p className={`mt-1 text-xs ${muted}`}>{en ? result.grade.rangeEn ?? result.grade.range : result.grade.range}</p></div>
      </div>
      <p className={`mt-3 text-sm leading-relaxed ${muted}`}>{en ? 'Substitution' : '计算代入'}：Q = ({result.effectiveRqd} / {result.factors.jn.value}) × ({result.factors.jr.value} / {result.factors.ja.value}) × ({result.factors.jw.value} / {result.factors.srf.value}) = {formatQValue(result.q)}</p>
      <div className="mt-4 grid gap-3 2xl:grid-cols-3">{getQAnalysis(result).map((item) => <div key={item.key} className={`rounded-lg border p-3 ${border}`}><h3 className="text-sm font-semibold">{item.title[language]}</h3><p className="mt-1 text-lg font-semibold tabular-nums">{item.value}</p><p className={`mt-1 text-sm leading-relaxed ${muted}`}>{item.description[language]}</p></div>)}</div>
      {result.warnings.length > 0 ? <ul className={`mt-3 space-y-1 text-sm ${darkMode ? 'text-amber-200' : 'text-amber-800'}`}>{result.warnings.map((warning) => <li key={`${warning.field}-${warning.code}`}>{warning.message[language]}</li>)}</ul> : null}
    </> : <p className={`mt-3 text-sm ${muted}`}>{en ? 'Complete the six parameters to show the Q value, class and interpretation.' : '完成六项参数后，显示 Q 值、质量等级与参数分析。'}</p>}
    <h3 className="mt-5 text-sm font-semibold">{en ? 'Barton rock-mass classes · reference' : '巴顿岩体质量等级 · 判级标准'}</h3>
    <div className="mt-2 grid gap-2 sm:grid-cols-5">{Q_GRADES.map((grade) => <div key={grade.id} aria-current={result?.grade.id === grade.id ? 'true' : undefined} className={`rounded-lg border p-3 text-center ${result?.grade.id === grade.id ? 'border-blue-500 bg-blue-500/10' : border}`}><p className="text-sm font-semibold">{grade.label[language]}</p><p className={`mt-1 text-xs ${muted}`}>{grade.range}</p></div>)}</div>
    <p className={`mt-2 text-xs leading-relaxed ${muted}`}>{en ? 'Boundary convention: Q = 40 → II; 10 → III; 1 → IV; 0.1 → IV. Classification uses unrounded values.' : '边界约定：Q＝40 归 II 级；Q＝10 归 III 级；Q＝1 与 Q＝0.1 归 IV 级。按未舍入 Q 值判级。'}</p>
  </section>
}
