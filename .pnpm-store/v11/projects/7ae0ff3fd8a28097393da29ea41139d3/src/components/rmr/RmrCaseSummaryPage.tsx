import { Fragment, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Download } from 'lucide-react'
import BackIconButton from '../BackIconButton'
import { buildCaseSummary } from '../../utils/rmrCaseSummary'
import type { RmrNumericInputKey } from '../../utils/rmrCalc'
import {
  applyRmrOverviewFilters,
  DEFAULT_RMR_OVERVIEW_FILTERS,
  getRmrOverviewStats,
  sortRmrOverviewRows,
  type RmrOverviewFilters,
  type RmrOverviewSortKey,
  type SortDirection,
} from '../../utils/rmrOverviewAnalytics'
import RmrOverviewCharts from './RmrOverviewCharts'
import RmrOverviewControls from './RmrOverviewControls'
import type { RockMassCaseRecord } from '../../types/rockmassCase'

interface RmrCaseSummaryPageProps {
  darkMode: boolean
  language: 'zh' | 'en'
  caseRecord: RockMassCaseRecord
  message: string | null
  onBackToWorkspace: () => void
  onBackToPoints: () => void
  onOpenPoint: (pointId: string) => void
  onOpenExport: () => void
}

const PARAM_COLUMNS = [
  { key: 'A1', label: '完整岩石强度', labelEn: 'Intact rock strength' },
  { key: 'A2', label: '岩石质量指标 RQD', labelEn: 'Rock Quality Designation' },
  { key: 'A3', label: '结构面间距', labelEn: 'Discontinuity spacing' },
  { key: 'A4', label: '结构面条件', labelEn: 'Discontinuity condition' },
  { key: 'A5', label: '地下水', labelEn: 'Groundwater' },
  { key: 'A6', label: '结构面方向修正', labelEn: 'Orientation adjustment' },
] as const

const SUMMARY_COLUMN_WIDTHS = ['4%', '15%', '11%', '11%', '5.5%', '5.5%', '5.5%', '5.5%', '5.5%', '5.5%', '7%', '11%', '8%']

export default function RmrCaseSummaryPage({
  darkMode,
  language,
  caseRecord,
  message,
  onBackToWorkspace,
  onBackToPoints,
  onOpenPoint,
  onOpenExport,
}: RmrCaseSummaryPageProps) {
  const isEn = language === 'en'
  const summary = useMemo(() => buildCaseSummary(caseRecord, language), [caseRecord, language])
  const [expandedPointIds, setExpandedPointIds] = useState<Set<string>>(() => new Set())
  const [filters, setFilters] = useState<RmrOverviewFilters>(() => ({ ...DEFAULT_RMR_OVERVIEW_FILTERS }))
  const [sortKey, setSortKey] = useState<RmrOverviewSortKey>('ordinal')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [scatterKey, setScatterKey] = useState<RmrNumericInputKey | null>(null)

  useEffect(() => {
    setExpandedPointIds(new Set())
    setFilters({ ...DEFAULT_RMR_OVERVIEW_FILTERS })
    setSortKey('ordinal')
    setSortDirection('asc')
    setScatterKey(null)
  }, [summary.rows])

  const filteredRows = useMemo(() => applyRmrOverviewFilters(summary.rows, filters), [summary.rows, filters])
  const sortedRows = useMemo(() => sortRmrOverviewRows(filteredRows, sortKey, sortDirection), [filteredRows, sortKey, sortDirection])
  const stats = useMemo(() => getRmrOverviewStats(sortedRows, filters.includeNeedsReview, scatterKey), [sortedRows, filters.includeNeedsReview, scatterKey])

  const cardCls = `rounded-lg border p-4 sm:p-5 ${
    darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white shadow-sm'
  }`
  const tableBorder = darkMode ? 'border-gray-600' : 'border-gray-300'
  const headCell = darkMode ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-50 text-gray-600'
  const linkCls = darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800'
  const bodyText = darkMode ? 'text-gray-300' : 'text-gray-700'
  const mutedText = darkMode ? 'text-gray-500' : 'text-gray-400'
  const copy = isEn
    ? {
        back: 'Back to points', workspace: 'Project workspace', overview: 'Project overview',
        noProjectInfo: 'Project information not entered', export: 'Export',
        noPoints: 'No points in this case.', point: 'Point', pointNote: 'Note',
        oreType: 'Ore type', grade: 'Class', details: 'Parameters', hideDetails: 'Hide parameters', showDetails: 'Show parameters',
        parameterDetail: 'Parameter', actualInput: 'Actual input', score: 'Score', description: 'Rock-mass description',
        standup: 'Stand-up span / time', cohesion: 'Cohesion', friction: 'Friction angle', needsReview: 'Needs review',
        note: 'Click a point name to open its RMR calculation. Detailed scores are shown by default; use the arrow to view actual inputs.',
      }
    : {
        back: '返回点位列表', workspace: '项目工作区', overview: '工程总览', noProjectInfo: '未填写工程信息',
        export: '导出', noPoints: '项目内还没有点位。', point: '点位名称',
        pointNote: '说明', oreType: '矿岩类型', grade: '等级', details: '参数', hideDetails: '隐藏参数', showDetails: '显示参数',
        parameterDetail: '参数', actualInput: '实际输入', score: '分值', description: '岩体描述', standup: '自稳跨度 / 时间',
        cohesion: '粘聚力', friction: '内摩擦角', needsReview: '待复核',
        note: '点击点位名称进入 RMR 计算；点击末列箭头查看实际输入和工程参数。',
      }
  const messageIsError = message ? /失败|failed|invalid|incompatible/i.test(message) : false

  const updateFilters = (patch: Partial<RmrOverviewFilters>) => setFilters((current) => ({ ...current, ...patch }))
  const clearFilters = () => {
    setFilters({ ...DEFAULT_RMR_OVERVIEW_FILTERS })
    setSortKey('ordinal')
    setSortDirection('asc')
    setExpandedPointIds(new Set())
  }

  const toggleDetails = (pointId: string) => {
    setExpandedPointIds((current) => {
      const next = new Set(current)
      if (next.has(pointId)) next.delete(pointId)
      else next.add(pointId)
      return next
    })
  }

  return (
    <div className={`flex-1 min-h-0 min-w-0 flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="w-full space-y-4">
          <div className="flex items-start gap-2">
            <BackIconButton label={copy.back} onClick={onBackToPoints} darkMode={darkMode} className="mt-1" />
            <div className="min-w-0">
              <nav className={`flex flex-wrap items-center gap-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <button type="button" onClick={onBackToWorkspace} className={linkCls}>{copy.workspace}</button>
                <span aria-hidden>/</span>
                <button type="button" onClick={onBackToPoints} className={linkCls}>{caseRecord.name}</button>
                <span aria-hidden>/</span>
                <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{copy.overview}</span>
              </nav>
              <h1 className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {copy.overview}
              </h1>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {[caseRecord.name, caseRecord.engineering, caseRecord.location].filter(Boolean).join(' · ') || copy.noProjectInfo}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            {message ? (
              <p className={`text-sm ${messageIsError ? 'text-red-600 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`} role="status">{message}</p>
            ) : null}
            <button type="button" onClick={onOpenExport} className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${linkCls}`}>
              <Download className="h-4 w-4" aria-hidden />
              {copy.export}
            </button>
          </div>

          <RmrOverviewControls
            darkMode={darkMode}
            language={language}
            filters={filters}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onFiltersChange={updateFilters}
            onSortChange={(key, direction) => { setSortKey(key); setSortDirection(direction) }}
            onClear={clearFilters}
          />

          <section className={cardCls} data-testid="rmr-point-scores">
            <div className="mb-2 flex justify-end">
              <span className={`text-xs ${mutedText}`}>{sortedRows.length} {isEn ? 'points' : '个点位'}</span>
            </div>
            {sortedRows.length === 0 ? (
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{summary.rows.length ? (isEn ? 'No points match the current filters.' : '没有点位符合当前筛选条件。') : copy.noPoints}</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className={`w-full table-fixed border-collapse border text-sm ${tableBorder}`}>
                  <colgroup>
                    {SUMMARY_COLUMN_WIDTHS.map((width, index) => <col key={`summary-col-${index}`} style={{ width }} />)}
                  </colgroup>
                  <thead className={`sticky top-0 z-10 ${headCell}`}>
                    <tr>
                      <th className={`border ${tableBorder} px-1.5 py-2 text-center text-xs font-medium`}>#</th>
                      <th className={`border ${tableBorder} px-1.5 py-2 text-center text-xs font-medium`}>{copy.point}</th>
                      <th className={`border ${tableBorder} px-1.5 py-2 text-center text-xs font-medium`}>{copy.pointNote}</th>
                      <th className={`border ${tableBorder} px-1.5 py-2 text-center text-xs font-medium`}>{copy.oreType}</th>
                      {PARAM_COLUMNS.map(({ key }) => (
                        <th key={key} className={`border ${tableBorder} px-1 py-2 text-center text-xs font-medium`}>{key}</th>
                      ))}
                      <th className={`border ${tableBorder} px-1 py-2 text-center text-xs font-medium`}>RMR</th>
                      <th className={`border ${tableBorder} px-1 py-2 text-center text-xs font-medium`}>{copy.grade}</th>
                      <th className={`border ${tableBorder} px-1 py-2 text-center text-xs font-medium`}>{copy.details}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((row) => {
                      const info = row.needsReview ? null : row.scores.classInfo
                      const expanded = expandedPointIds.has(row.point.id)
                      return (
                        <Fragment key={row.point.id}>
                          <tr key={`${row.point.id}-summary`} className={darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'}>
                            <td className={`border ${tableBorder} px-1.5 py-2 text-center tabular-nums ${bodyText}`}>{row.ordinal}</td>
                            <td className={`border ${tableBorder} px-1.5 py-2 text-center ${bodyText}`}>
                              <button type="button" onClick={() => onOpenPoint(row.point.id)} className={`block w-full truncate font-medium ${linkCls}`} title={row.point.name}>
                                {row.point.name}
                              </button>
                            </td>
                            <td className={`border ${tableBorder} px-1.5 py-2 text-center ${bodyText}`} title={row.point.note || undefined}><span className="block truncate">{row.point.note || '—'}</span></td>
                            <td className={`border ${tableBorder} px-1.5 py-2 text-center ${bodyText}`} title={row.point.oreType || undefined}><span className="block truncate">{row.point.oreType || '—'}</span></td>
                            {PARAM_COLUMNS.map(({ key }) => (
                              <td key={key} className={`border ${tableBorder} px-1 py-2 text-center tabular-nums ${bodyText}`}>{row.needsReview ? '—' : row.scores[key] ?? '—'}</td>
                            ))}
                            <td className={`border ${tableBorder} px-1 py-2 text-center font-semibold tabular-nums ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                              {row.needsReview ? copy.needsReview : row.scores.rmr ?? '—'}
                            </td>
                            <td className={`border ${tableBorder} px-1 py-2 text-center ${bodyText}`}>
                              <span className="block truncate" title={info ? (isEn ? `${info.labelEn} (${info.qualityEn})` : `${info.label}（${info.quality}）`) : undefined}>
                                {info ? (isEn ? info.labelEn : info.label) : '—'}
                              </span>
                            </td>
                            <td className={`border ${tableBorder} px-1 py-2 text-center ${bodyText}`}>
                              <button
                                type="button"
                                onClick={() => toggleDetails(row.point.id)}
                                aria-expanded={expanded}
                                aria-label={expanded ? `${copy.hideDetails} ${row.point.name}` : `${copy.showDetails} ${row.point.name}`}
                                title={expanded ? copy.hideDetails : copy.showDetails}
                                className={`inline-flex h-8 w-8 items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${linkCls}`}
                              >
                                {expanded ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
                              </button>
                            </td>
                          </tr>
                          {expanded ? (
                            <tr key={`${row.point.id}-details`}>
                              <td colSpan={13} className={`border ${tableBorder} px-3 py-3 text-left ${darkMode ? 'bg-gray-900/40' : 'bg-gray-50/80'}`}>
                                <div className={`mb-2 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{copy.parameterDetail}</div>
                                <div className="overflow-x-auto">
                                  <table className={`w-full min-w-[620px] border-collapse border text-xs ${tableBorder}`}>
                                    <thead>
                                      <tr>
                                        {[copy.parameterDetail, copy.actualInput, copy.score].map((label) => (
                                          <th key={label} className={`border ${tableBorder} ${headCell} px-2 py-1.5 text-left font-medium`}>{label}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {row.descriptions.map((description) => {
                                        const parameter = PARAM_COLUMNS.find((column) => column.key === description.key)
                                        return (
                                          <tr key={description.key}>
                                            <td className={`border ${tableBorder} px-2 py-1.5 font-medium ${bodyText}`}>{description.key} · {isEn ? parameter?.labelEn : parameter?.label}</td>
                                            <td className={`border ${tableBorder} px-2 py-1.5 ${bodyText}`}>{description.inputValue ?? description.choice}</td>
                                            <td className={`border ${tableBorder} px-2 py-1.5 text-center tabular-nums ${bodyText}`}>{description.score ?? '—'}</td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                                {info ? (
                                  <div className={`mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs ${bodyText}`}>
                                    <span><strong className="font-medium">{copy.description}：</strong>{isEn ? info.descriptionEn : info.description}</span>
                                    <span><strong className="font-medium">{copy.standup}：</strong>{isEn ? `${info.spanEn} / ${info.standUpTimeEn}` : `${info.span} / ${info.standUpTime}`}</span>
                                    <span><strong className="font-medium">{copy.cohesion}：</strong>{info.cohesion ?? '—'}</span>
                                    <span><strong className="font-medium">{copy.friction}：</strong>{info.friction ?? '—'}</span>
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className={`mt-2 text-xs ${mutedText}`}>{copy.note}</p>
          </section>

          <RmrOverviewCharts
            darkMode={darkMode}
            language={language}
            stats={stats}
            scatterKey={scatterKey}
            onScatterKeyChange={setScatterKey}
          />
        </div>
      </div>
    </div>
  )
}
