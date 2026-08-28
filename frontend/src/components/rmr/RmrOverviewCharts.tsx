import { RMR_CLASSES } from '../../config/rmrTables'
import { RMR_NUMERIC_INPUTS, type RmrNumericInputKey } from '../../utils/rmrCalc'
import type { RmrOverviewStats } from '../../utils/rmrOverviewAnalytics'

interface RmrOverviewChartsProps {
  darkMode: boolean
  language: 'zh' | 'en'
  stats: RmrOverviewStats
  scatterKey: RmrNumericInputKey | null
  onScatterKeyChange: (key: RmrNumericInputKey | null) => void
}

export default function RmrOverviewCharts({
  darkMode,
  language,
  stats,
  scatterKey,
  onScatterKeyChange,
}: RmrOverviewChartsProps) {
  const en = language === 'en'
  const border = darkMode ? 'border-gray-700' : 'border-gray-200'
  const card = darkMode ? 'bg-gray-800/60' : 'bg-white'
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const text = darkMode ? 'text-gray-200' : 'text-gray-800'
  const maxCount = Math.max(1, ...stats.gradeDistribution.map((item) => item.count))
  const maxHistogram = Math.max(1, ...stats.rmrHistogram.map((item) => item.count))
  const maxScore = Math.max(1, ...stats.scoreAverages.map((item) => item.average ?? 0))
  const chartLabel = (id: string) => {
    const info = RMR_CLASSES.find((item) => item.id === id)
    return info ? (en ? info.labelEn : info.label) : id
  }
  const selectedMetric = RMR_NUMERIC_INPUTS.find((item) => item.key === scatterKey)
  const xValues = stats.scatter.map((point) => point.x)
  const xMin = xValues.length ? Math.min(...xValues) : 0
  const xMax = xValues.length ? Math.max(...xValues) : 1
  const xSpan = xMax - xMin || 1

  return (
    <section data-testid="rmr-overview-analysis" className="space-y-4" aria-label={en ? 'RMR data analysis' : 'RMR 数据分析'}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className={`rounded-lg border p-4 ${border} ${card}`}>
          <h3 className={`mb-3 text-sm font-semibold ${text}`}>{en ? 'Class distribution' : '等级分布'}</h3>
          {stats.eligible ? (
            <div className="space-y-2">
              {stats.gradeDistribution.map((item) => (
                <div key={item.id} className="block w-full rounded p-1" title={`${chartLabel(item.id)}: ${item.count} (${item.percentage}%)`} aria-label={`${chartLabel(item.id)}: ${item.count} (${item.percentage}%)`}>
                  <div className={`mb-1 flex justify-between text-xs ${muted}`}><span>{chartLabel(item.id)}</span><span>{item.count} ({item.percentage}%)</span></div>
                  <div className={`h-3 overflow-hidden rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}><div className="h-full rounded bg-blue-500 transition-all" style={{ width: `${(item.count / maxCount) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          ) : <p className={`py-8 text-center text-sm ${muted}`}>{en ? 'No calculable points in the current selection.' : '当前筛选中没有可计算点位。'}</p>}
        </div>

        <div className={`rounded-lg border p-4 ${border} ${card}`}>
          <h3 className={`mb-3 text-sm font-semibold ${text}`}>{en ? 'RMR range distribution' : 'RMR 区间分布'}</h3>
          {stats.eligible ? (
            <div className="flex h-36 items-end gap-1">
              {stats.rmrHistogram.map((item) => (
                <div key={item.min} className="group flex h-full min-w-0 flex-1 flex-col justify-end rounded-t p-0.5" title={`RMR ${item.min}-${item.max}: ${item.count}`} aria-label={`RMR ${item.min}-${item.max}: ${item.count}`}>
                  <span className={`mb-1 text-[10px] ${muted}`}>{item.count || ''}</span>
                  <span className="block min-h-[2px] w-full rounded-t bg-emerald-500 transition-all group-hover:bg-emerald-400" style={{ height: `${(item.count / maxHistogram) * 100}%` }} />
                  <span className={`mt-1 text-[10px] ${muted}`}>{item.min}</span>
                </div>
              ))}
            </div>
          ) : <p className={`py-8 text-center text-sm ${muted}`}>{en ? 'No RMR ranges in the current selection.' : '当前筛选中没有 RMR 区间数据。'}</p>}
        </div>

        <div className={`rounded-lg border p-4 ${border} ${card}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className={`text-sm font-semibold ${text}`}>{en ? 'Parameter / RMR relationship' : '参数与 RMR 关系'}</h3>
            <select aria-label={en ? 'Scatter parameter' : '散点参数'} className={`rounded-md border px-2 py-1 text-xs ${border} ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-800'}`} value={scatterKey ?? ''} onChange={(event) => onScatterKeyChange((event.target.value || null) as RmrNumericInputKey | null)}>
              <option value="">{en ? 'Select input' : '选择实际参数'}</option>
              {RMR_NUMERIC_INPUTS.map((item) => <option key={item.key} value={item.key}>{en ? item.labelEn : item.label} ({item.unit})</option>)}
            </select>
          </div>
          {selectedMetric && stats.scatter.length ? (
            <svg viewBox="0 0 520 190" className="h-44 w-full" role="img" aria-label={`${selectedMetric.label} / RMR`}>
              <line x1="40" y1="10" x2="40" y2="160" stroke="currentColor" opacity="0.25" />
              <line x1="40" y1="160" x2="510" y2="160" stroke="currentColor" opacity="0.25" />
              {stats.scatter.map((point) => {
                const cx = 45 + ((point.x - xMin) / xSpan) * 455
                const cy = 160 - (point.y / 100) * 145
                return <circle key={point.pointId} cx={cx} cy={cy} r="5" fill="#2563eb" tabIndex={0}><title>{point.pointName}: {point.x} {selectedMetric.unit}, RMR {point.y}</title></circle>
              })}
              <text x="45" y="182" fontSize="10" fill="currentColor">{xMin} {selectedMetric.unit}</text>
              <text x="460" y="182" fontSize="10" fill="currentColor">{xMax} {selectedMetric.unit}</text>
              <text x="5" y="20" fontSize="10" fill="currentColor">100</text>
              <text x="15" y="164" fontSize="10" fill="currentColor">0</text>
            </svg>
          ) : <p className={`py-12 text-center text-sm ${muted}`}>{en ? 'No numeric input and RMR pairs in the current selection.' : '当前筛选中没有可绘制的实际参数与 RMR 数据。'}</p>}
        </div>

        <div className={`rounded-lg border p-4 ${border} ${card}`}>
          <h3 className={`mb-3 text-sm font-semibold ${text}`}>{en ? 'Average score contribution' : '参数平均分贡献'}</h3>
          {stats.eligible ? (
            <div className="space-y-2">
              {stats.scoreAverages.map((item) => (
                <div key={item.key} className="flex items-center gap-2" title={`${item.key}: ${item.average ?? '—'} (${en ? item.count + ' points' : item.count + ' 个点位'})`}>
                  <span className={`w-8 text-xs font-medium ${muted}`}>{item.key}</span>
                  <div className={`h-3 flex-1 overflow-hidden rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}><div className="h-full rounded bg-violet-500" style={{ width: `${((item.average ?? 0) / maxScore) * 100}%` }} /></div>
                  <span className={`w-10 text-right text-xs tabular-nums ${muted}`}>{item.average ?? '—'}</span>
                </div>
              ))}
            </div>
          ) : <p className={`py-8 text-center text-sm ${muted}`}>{en ? 'No score contribution data in the current selection.' : '当前筛选中没有参数分值数据。'}</p>}
        </div>
      </div>

      <section data-testid="rmr-overview-statistics" aria-label={en ? 'Data analysis' : '数据分析'}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            [en ? 'Rows' : '当前点位', stats.total],
            [en ? 'Calculable' : '可计算点位', stats.eligible],
            [en ? 'Mean RMR' : 'RMR 平均值', stats.average ?? '—'],
            [en ? 'Median' : '中位数', stats.median ?? '—'],
            [en ? 'Range' : '范围', stats.min == null ? '—' : `${stats.min} ~ ${stats.max}`],
          ].map(([label, value]) => (
            <div key={String(label)} className={`rounded-lg border px-3 py-3 text-center ${border} ${card}`}>
              <div className={`text-xs ${muted}`}>{label}</div>
              <div className={`mt-1 text-lg font-semibold ${text}`}>{value}</div>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}
