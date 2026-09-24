import type { GsiResult } from '../../methods/gsi'

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

  return (
    <section data-testid="gsi-result-analysis" className={`rounded-lg border p-4 sm:p-5 ${darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white shadow-sm'}`}>
      <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Results and interpretation' : '结果与分析'}</h2>
      <p className={`mt-3 text-sm leading-relaxed ${muted}`}>
        {en
          ? 'GSI and RMR both assess rock-mass quality through rock-mass integrity and discontinuity conditions, with related assessment factors and score trends. Drawing on engineering experience, Changsha Nonferrous Metallurgical Design Institute has established the GSI classification used in this software with reference to the RMR five-class framework.'
          : 'GSI 与 RMR 均通过岩体完整性和结构面条件反映岩体质量，两者在评价指标和分值变化趋势上具有相关性。长沙有色冶金设计院根据工程经验，参照 RMR 五级分级框架，拟定本软件 GSI 岩体质量等级。'}
      </p>
      {result ? (
        <>
          <div className={`mt-4 grid gap-4 rounded-lg p-4 sm:grid-cols-2 ${darkMode ? 'bg-blue-950/40' : 'bg-blue-50'}`}>
            <div>
              <p className={`text-sm ${muted}`}>{en ? 'Calculated GSI' : '计算 GSI 值'}</p>
              <p className={`mt-1 text-3xl font-bold tabular-nums ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{result.gsi}</p>
            </div>
            <div>
              <p className={`text-sm ${muted}`}>{en ? 'GSI rock-mass class' : 'GSI 岩体质量等级'}</p>
              <p className="mt-1 text-3xl font-bold">{en ? result.grade.labelEn : result.grade.label}</p>
            </div>
          </div>
        </>
      ) : (
        <p className={`mt-3 text-sm ${muted}`}>{en ? 'Complete the required GSI inputs to show the value and class.' : '完成必填参数后，显示 GSI 值与岩体质量等级。'}</p>
      )}
    </section>
  )
}
