import { GSI_GRADES, type GsiResult } from '../../methods/gsi'

export default function GsiResultPanel({
  result,
  darkMode,
  language,
}: {
  result: GsiResult | null
  darkMode: boolean
  language: 'zh' | 'en'
}) {
  const en = language === 'en'
  const muted = darkMode ? 'text-gray-400' : 'text-gray-600'
  const border = darkMode ? 'border-gray-600' : 'border-gray-200'

  return (
    <section data-testid="gsi-result-analysis" className={`rounded-lg border p-4 sm:p-5 ${darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white shadow-sm'}`}>
      <h2 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Results and interpretation' : '结果与分析'}</h2>
      {result ? (
        <>
          <div className={`mt-4 grid gap-4 rounded-lg p-4 sm:grid-cols-2 ${darkMode ? 'bg-blue-950/40' : 'bg-blue-50'}`}>
            <div>
              <p className={`text-sm ${muted}`}>{en ? 'Calculated GSI' : '计算 GSI 值'}</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{result.gsi}</p>
            </div>
            <div>
              <p className={`text-sm ${muted}`}>{en ? 'GSI rock-mass class' : 'GSI 岩体质量等级'}</p>
              <p className="mt-1 text-2xl font-bold">{result.grade.label}</p>
              <p className={`mt-1 text-xs ${muted}`}>{en ? result.grade.rangeEn : result.grade.range}</p>
            </div>
          </div>
          <p className={`mt-3 text-sm leading-relaxed ${muted}`}>{en ? 'Substitution' : '计算代入'}：{en ? result.formulaEn : result.formula}</p>
        </>
      ) : (
        <p className={`mt-3 text-sm ${muted}`}>{en ? 'Complete the required GSI inputs to show the value, class and interpretation.' : '完成必填 GSI 参数后，显示 GSI 值、质量等级与分级依据。'}</p>
      )}

      <h3 className={`mt-5 text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'GSI class scale · RMR five-class reference' : 'GSI 岩体质量等级 · 参考 RMR 五级标准'}</h3>
      <div className="mt-2 grid gap-2 sm:grid-cols-5">
        {GSI_GRADES.map((grade) => (
          <div
            key={grade.id}
            aria-current={result?.grade.id === grade.id ? 'true' : undefined}
            className={`rounded-lg border p-3 text-center ${result?.grade.id === grade.id ? 'border-blue-500 bg-blue-500/10' : border}`}
          >
            <p className="text-sm font-semibold">{en ? grade.labelEn : grade.label}</p>
            <p className={`mt-1 text-xs ${muted}`}>{en ? grade.rangeEn : grade.range}</p>
          </div>
        ))}
      </div>
      <p className={`mt-2 text-xs leading-relaxed ${muted}`}>
        {en
          ? <>Boundary convention: GSI = 20 → Class V; 40 → Class IV; 60 → Class III; 80 → Class II; values above 80 → Class I. Classification uses the unrounded value.</>
          : <>边界约定：GSI＝20 归 V 级；40 归 IV 级；60 归 III 级；80 归 II 级；大于 80 归 I 级。按未舍入 GSI 值判级。</>}
      </p>
      <p className={`mt-2 text-xs leading-relaxed ${muted}`}>
        {en ? <>The class labels and 20-point intervals follow the RMR final class framework; GSI remains an independent index for Hoek–Brown rock-mass strength assessment.</> : <>等级名称和 20 分区间沿用 RMR 最终等级框架；GSI 仍是用于 Hoek–Brown 岩体强度评价的独立指标。</>}
      </p>
    </section>
  )
}
