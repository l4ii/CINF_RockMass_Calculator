import { useEffect, useState } from 'react'
import { Maximize2, X } from 'lucide-react'
import { GSI_STRUCTURE_OPTIONS, chartScaleBToY } from '../../methods/gsi'
import {
  formatGsiNumber,
  gsiChartIsoline,
  gsiChartPoint,
  type GsiOverviewCloudPoint,
  type GsiOverviewStats,
} from '../../utils/gsiOverviewAnalytics'

interface GsiOverviewChartsProps {
  darkMode: boolean
  language: 'zh' | 'en'
  stats: GsiOverviewStats
}

const CONTOUR_VALUES = [90, 80, 70, 60, 50, 40, 30, 20, 10] as const
const SCALE_A_TICKS = [45, 36, 27, 18, 9, 0] as const
const SCALE_B_TICKS = [50, 40, 30, 20, 10, 0] as const
const PAD = { left: 26, right: 10, top: 10, bottom: 20 }
const PLOT = 100
const VIEW_WIDTH = PAD.left + PLOT + PAD.right
const VIEW_HEIGHT = PAD.top + PLOT + PAD.bottom

function px(chartX: number) {
  return PAD.left + chartX
}

function py(chartY: number) {
  return PAD.top + chartY
}

interface GsiCloudPlotProps {
  darkMode: boolean
  language: 'zh' | 'en'
  cloud: GsiOverviewCloudPoint[]
  showLabels: boolean
  className?: string
}

function GsiCloudPlot({ darkMode, language, cloud, showLabels, className }: GsiCloudPlotProps) {
  const en = language === 'en'
  const ink = darkMode ? '#e5e7eb' : '#111827'
  const grid = darkMode ? '#6b7280' : '#d1d5db'
  const fill = darkMode ? '#1f2937' : '#ffffff'
  const contours = CONTOUR_VALUES.map((gsi) => ({ gsi, line: gsiChartIsoline(gsi) })).filter((item) => item.line)
  const radius = showLabels ? 2 : 2.4

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      className={className}
      role="img"
      aria-label={en ? 'GSI chart overlay' : '工程点群图'}
      data-testid="gsi-overview-cloud"
      overflow="visible"
    >
      <rect x="0" y="0" width={VIEW_WIDTH} height={VIEW_HEIGHT} fill={fill} />
      <rect x={PAD.left} y={PAD.top} width={PLOT} height={PLOT} fill={fill} stroke={ink} strokeOpacity="0.35" strokeWidth="0.4" />
      {GSI_STRUCTURE_OPTIONS.map((_, index) => (
        <line key={`h-${index}`} x1={px(0)} y1={py(((index + 1) / 6) * 100)} x2={px(100)} y2={py(((index + 1) / 6) * 100)} stroke={grid} strokeWidth="0.35" />
      ))}
      {[1, 2, 3, 4].map((index) => (
        <line key={`v-${index}`} x1={px((index / 5) * 100)} y1={py(0)} x2={px((index / 5) * 100)} y2={py(100)} stroke={grid} strokeWidth="0.35" />
      ))}
      {contours.map(({ gsi, line }) => (
        <polyline
          key={gsi}
          points={line!.points.map(([x, y]) => `${px(x)},${py(y)}`).join(' ')}
          fill="none"
          stroke={ink}
          strokeOpacity="0.55"
          strokeWidth={gsi % 20 === 0 ? 0.55 : 0.35}
        />
      ))}
      {contours.filter(({ gsi }) => gsi % 20 === 0).map(({ gsi, line }) => (
        <text
          key={`label-${gsi}`}
          x={px(line!.mx)}
          y={py(line!.my)}
          fontSize="3.4"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={ink}
          stroke={fill}
          strokeWidth="1.2"
          paintOrder="stroke"
        >
          {gsi}
        </text>
      ))}
      {SCALE_A_TICKS.map((tick) => {
        const x = px(gsiChartPoint(tick, 0).x)
        return (
          <g key={`a-${tick}`}>
            <line x1={x} y1={py(100)} x2={x} y2={py(100) + 2} stroke={ink} strokeWidth="0.4" />
            <text x={x} y={py(100) + 6.5} fontSize="3.1" textAnchor="middle" fill={ink}>{tick}</text>
          </g>
        )
      })}
      {SCALE_B_TICKS.map((tick) => {
        const y = py(chartScaleBToY(tick))
        return (
          <g key={`b-${tick}`}>
            <line x1={px(0) - 2} y1={y} x2={px(0)} y2={y} stroke={ink} strokeWidth="0.4" />
            <text x={px(0) - 3.2} y={y} fontSize="3.1" textAnchor="end" dominantBaseline="middle" fill={ink}>{tick}</text>
          </g>
        )
      })}
      <text x={px(50)} y={VIEW_HEIGHT - 2.2} fontSize="3.2" textAnchor="middle" fill={ink}>
        {en ? 'Scale A = 1.5 JCond89' : '刻度 A = 1.5 JCond89'}
      </text>
      <text x={9} y={py(50)} fontSize="3.2" textAnchor="middle" fill={ink} transform={`rotate(-90 9 ${py(50)})`}>
        {en ? 'Scale B = RQD/2' : '刻度 B = RQD/2'}
      </text>
      {cloud.map((point) => {
        const { x, y } = gsiChartPoint(point.scaleA, point.scaleB)
        const cx = px(x)
        const cy = py(y)
        return (
          <g key={point.pointId}>
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill={point.entryMode === 'quantitative' ? '#f59e0b' : '#2563eb'}
              stroke={fill}
              strokeWidth="0.55"
            >
              <title>{`${point.pointName}: A ${formatGsiNumber(point.scaleA)}, B ${formatGsiNumber(point.scaleB)}, GSI ${formatGsiNumber(point.gsi)}`}</title>
            </circle>
            {showLabels ? (
              <text x={cx + 3.2} y={cy} fontSize="3.1" dominantBaseline="middle" fill={ink} stroke={fill} strokeWidth="1" paintOrder="stroke">
                {point.pointName}
              </text>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}

export default function GsiOverviewCharts({ darkMode, language, stats }: GsiOverviewChartsProps) {
  const en = language === 'en'
  const [enlarged, setEnlarged] = useState(false)
  const border = darkMode ? 'border-gray-700' : 'border-gray-200'
  const card = darkMode ? 'bg-gray-800/60' : 'bg-white'
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const text = darkMode ? 'text-gray-200' : 'text-gray-800'
  const maxGrade = Math.max(1, ...stats.gradeDistribution.map((item) => item.count))
  const maxHistogram = Math.max(1, ...stats.gsiHistogram.map((item) => item.count))
  const maxStructure = Math.max(1, ...stats.structureDistribution.map((item) => item.count))
  const enlargeLabel = en ? 'Enlarge point overlay' : '放大点群图'
  const closeLabel = en ? 'Close' : '关闭'
  const overlayTitle = en ? 'GSI chart overlay' : '工程点群图'

  useEffect(() => {
    if (!enlarged) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEnlarged(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enlarged])

  const legend = (
    <div className={`flex gap-3 text-[11px] ${muted}`}>
      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-600" aria-hidden />{en ? 'Chart' : '图表法'}</span>
      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />{en ? 'Quantitative' : '定量法'}</span>
    </div>
  )

  return (
    <section data-testid="gsi-overview-analysis" className="space-y-4" aria-label={en ? 'GSI data analysis' : 'GSI 数据分析'}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className={`rounded-lg border p-4 ${border} ${card}`}>
          <h3 className={`mb-3 text-sm font-semibold ${text}`}>{en ? 'Class distribution' : '等级分布'}</h3>
          {stats.eligible ? (
            <div className="space-y-2">
              {stats.gradeDistribution.map((item) => {
                const label = en ? item.labelEn : item.label
                return (
                  <div key={item.id} className="block w-full rounded p-1" title={`${label}: ${item.count} (${item.percentage}%)`} aria-label={`${label}: ${item.count} (${item.percentage}%)`}>
                    <div className={`mb-1 flex justify-between text-xs ${muted}`}><span>{label}</span><span>{item.count} ({item.percentage}%)</span></div>
                    <div className={`h-3 overflow-hidden rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="h-full rounded bg-blue-500 transition-all" style={{ width: `${(item.count / maxGrade) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <p className={`py-8 text-center text-sm ${muted}`}>{en ? 'No calculable points in the current selection.' : '当前筛选中没有可计算点位。'}</p>}
        </div>

        <div className={`rounded-lg border p-4 ${border} ${card}`}>
          <h3 className={`mb-3 text-sm font-semibold ${text}`}>{en ? 'GSI range distribution' : 'GSI 区间分布'}</h3>
          {stats.eligible ? (
            <div className="flex h-36 items-end gap-1">
              {stats.gsiHistogram.map((item) => (
                <div key={item.min} className="group flex h-full min-w-0 flex-1 flex-col justify-end rounded-t p-0.5" title={`GSI ${item.label}: ${item.count}`} aria-label={`GSI ${item.label}: ${item.count}`}>
                  <span className={`mb-1 text-[10px] ${muted}`}>{item.count || ''}</span>
                  <span className="block min-h-[2px] w-full rounded-t bg-emerald-500 transition-all group-hover:bg-emerald-400" style={{ height: `${(item.count / maxHistogram) * 100}%` }} />
                  <span className={`mt-1 text-[10px] ${muted}`}>{item.min}</span>
                </div>
              ))}
            </div>
          ) : <p className={`py-8 text-center text-sm ${muted}`}>{en ? 'No GSI ranges in the current selection.' : '当前筛选中没有 GSI 区间数据。'}</p>}
        </div>

        <div className={`rounded-lg border p-4 ${border} ${card}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className={`text-sm font-semibold ${text}`}>{overlayTitle}</h3>
            <div className="flex items-center gap-3">
              {legend}
              {stats.cloud.length ? (
                <button
                  type="button"
                  onClick={() => setEnlarged(true)}
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium ${darkMode ? 'text-blue-300 hover:bg-gray-700' : 'text-blue-700 hover:bg-blue-50'}`}
                  title={enlargeLabel}
                >
                  <Maximize2 className="h-3.5 w-3.5" aria-hidden />
                  {en ? 'Enlarge' : '放大'}
                </button>
              ) : null}
            </div>
          </div>
          {stats.cloud.length ? (
            <button
              type="button"
              className="block w-full cursor-zoom-in rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              onClick={() => setEnlarged(true)}
              aria-label={enlargeLabel}
            >
              <GsiCloudPlot darkMode={darkMode} language={language} cloud={stats.cloud} showLabels={false} className="h-80 w-full" />
            </button>
          ) : <p className={`py-12 text-center text-sm ${muted}`}>{en ? 'No Scale A/B pairs in the current selection.' : '当前筛选中没有可绘制的刻度 A/B 数据。'}</p>}
        </div>

        <div className={`rounded-lg border p-4 ${border} ${card}`}>
          <h3 className={`mb-3 text-sm font-semibold ${text}`}>{en ? 'Structure distribution' : '岩体结构分布'}</h3>
          {stats.eligible ? (
            <div className="space-y-2">
              {stats.structureDistribution.map((item) => {
                const label = en ? item.labelEn : item.label
                return (
                  <div key={item.id} className="flex items-center gap-2" title={`${label}: ${item.count}`}>
                    <span className={`w-28 shrink-0 truncate text-xs font-medium ${muted}`}>{label}</span>
                    <div className={`h-3 flex-1 overflow-hidden rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="h-full rounded bg-violet-500" style={{ width: `${(item.count / maxStructure) * 100}%` }} />
                    </div>
                    <span className={`w-6 text-right text-xs tabular-nums ${muted}`}>{item.count}</span>
                  </div>
                )
              })}
            </div>
          ) : <p className={`py-8 text-center text-sm ${muted}`}>{en ? 'No structure data in the current selection.' : '当前筛选中没有岩体结构数据。'}</p>}
        </div>
      </div>

      <section data-testid="gsi-overview-statistics" aria-label={en ? 'Data analysis' : '数据分析'}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            [en ? 'Rows' : '当前点位', stats.total],
            [en ? 'Calculable' : '可计算点位', stats.eligible],
            [en ? 'Mean GSI' : 'GSI 平均值', stats.average ?? '—'],
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

      {enlarged ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gsi-overview-cloud-title"
          data-testid="gsi-overview-cloud-dialog"
          onClick={() => setEnlarged(false)}
        >
          <div
            className={`relative flex max-h-full w-full max-w-5xl flex-col rounded-xl border p-4 sm:p-5 ${border} ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="gsi-overview-cloud-title" className={`text-lg font-semibold ${text}`}>{overlayTitle}</h2>
              <div className="flex items-center gap-3">
                {legend}
                <button
                  type="button"
                  className={`grid h-9 w-9 place-items-center rounded-lg ${darkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`}
                  aria-label={closeLabel}
                  title={closeLabel}
                  onClick={() => setEnlarged(false)}
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>
            <GsiCloudPlot darkMode={darkMode} language={language} cloud={stats.cloud} showLabels className="h-[min(78vh,44rem)] w-full" />
          </div>
        </div>
      ) : null}
    </section>
  )
}
