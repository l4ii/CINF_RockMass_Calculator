import { Fragment, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Download } from 'lucide-react'
import BackIconButton from '../BackIconButton'
import {
  GSI_STANDARD,
  GSI_STRUCTURE_OPTIONS,
  GSI_SURFACE_OPTIONS,
  type GsiStructureId,
  type GsiSurfaceQualityId,
} from '../../methods/gsi'
import { buildGsiCaseSummary, gsiOverviewDetailDescriptions } from '../../utils/gsiCaseSummary'
import {
  DEFAULT_GSI_OVERVIEW_FILTERS,
  applyGsiOverviewFilters,
  formatGsiNumber,
  getGsiOverviewStats,
  sortGsiOverviewRows,
  type GsiOverviewFilters,
  type GsiOverviewSortKey,
  type SortDirection,
} from '../../utils/gsiOverviewAnalytics'
import type { RockMassCaseRecord } from '../../types/rockmassCase'
import GsiOverviewCharts from './GsiOverviewCharts'
import GsiOverviewControls from './GsiOverviewControls'

interface GsiSummaryPageProps {
  darkMode: boolean
  language: 'zh' | 'en'
  methodName: string
  caseRecord: RockMassCaseRecord
  message: string | null
  onBackToWorkspace: () => void
  onBackToPoints: () => void
  onOpenPoint: (pointId: string) => void
  onOpenExport: () => void
}

const COLUMN_COUNT = 12

function structureLabel(id: GsiStructureId, language: 'zh' | 'en') {
  const option = GSI_STRUCTURE_OPTIONS.find((item) => item.id === id)
  if (!option) return '—'
  return language === 'en' ? option.labelEn : option.label
}

function surfaceLabel(id: GsiSurfaceQualityId, language: 'zh' | 'en') {
  const option = GSI_SURFACE_OPTIONS.find((item) => item.id === id)
  if (!option) return '—'
  return language === 'en' ? option.labelEn : option.label
}

export default function GsiSummaryPage({
  darkMode,
  language,
  methodName,
  caseRecord,
  message,
  onBackToWorkspace,
  onBackToPoints,
  onOpenPoint,
  onOpenExport,
}: GsiSummaryPageProps) {
  const isEn = language === 'en'
  const summary = useMemo(() => buildGsiCaseSummary(caseRecord), [caseRecord])
  const [expandedPointIds, setExpandedPointIds] = useState<Set<string>>(() => new Set())
  const [filters, setFilters] = useState<GsiOverviewFilters>(() => ({ ...DEFAULT_GSI_OVERVIEW_FILTERS }))
  const [sortKey, setSortKey] = useState<GsiOverviewSortKey>('ordinal')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  useEffect(() => {
    setExpandedPointIds(new Set())
    setFilters({ ...DEFAULT_GSI_OVERVIEW_FILTERS })
    setSortKey('ordinal')
    setSortDirection('asc')
  }, [summary.rows])

  const filteredRows = useMemo(() => applyGsiOverviewFilters(summary.rows, filters), [summary.rows, filters])
  const sortedRows = useMemo(() => sortGsiOverviewRows(filteredRows, sortKey, sortDirection), [filteredRows, sortKey, sortDirection])
  const stats = useMemo(() => getGsiOverviewStats(sortedRows, filters.includeIncomplete), [sortedRows, filters.includeIncomplete])

  const cardCls = `rounded-lg border p-4 sm:p-5 ${darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white shadow-sm'}`
  const tableBorder = darkMode ? 'border-gray-600' : 'border-gray-300'
  const headCell = darkMode ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-50 text-gray-600'
  const linkCls = darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800'
  const bodyText = darkMode ? 'text-gray-300' : 'text-gray-700'
  const mutedText = darkMode ? 'text-gray-500' : 'text-gray-400'
  const copy = isEn
    ? {
        back: 'Back to points', workspace: 'Project workspace', overview: 'Project overview',
        noProjectInfo: 'Project information not entered', export: 'Export',
        noPoints: 'No points in this case.', noMatch: 'No points match the current filters.',
        point: 'Point', pointNote: 'Note', oreType: 'Rock type', entry: 'Entry path',
        structure: 'Structure', surface: 'Surface condition', scaleA: 'Scale A', scaleB: 'Scale B',
        grade: 'Class', details: 'Details', hideDetails: 'Hide details', showDetails: 'Show details',
        parameter: 'Parameter', value: 'Value', formula: 'Formula',
        needsInput: 'Needs input', chart: 'Chart', quantitative: 'Quantitative',
        note: 'Click a point name to open its GSI calculation. Scale A and Scale B unify chart and quantitative points; use the arrow for formula and warnings.',
      }
    : {
        back: '返回点位列表', workspace: '项目工作区', overview: '工程总览',
        noProjectInfo: '未填写工程信息', export: '导出',
        noPoints: '项目内还没有点位。', noMatch: '没有点位符合当前筛选条件。',
        point: '点位名称', pointNote: '说明', oreType: '矿岩类型', entry: '入口',
        structure: '岩体结构', surface: '表面条件', scaleA: '刻度 A', scaleB: '刻度 B',
        grade: '等级', details: '详情', hideDetails: '隐藏详情', showDetails: '显示详情',
        parameter: '参数', value: '数值', formula: '公式',
        needsInput: '待补充', chart: '图表法', quantitative: '定量法',
        note: '点击点位名称进入 GSI 计算；刻度 A/B 统一图表法与定量法。点击末列箭头查看公式和警告。',
      }
  const messageIsError = message ? /失败|failed|invalid|incompatible/i.test(message) : false
  const headers = ['#', copy.point, copy.pointNote, copy.oreType, copy.entry, copy.structure, copy.surface, copy.scaleA, copy.scaleB, 'GSI', copy.grade, copy.details]

  const updateFilters = (patch: Partial<GsiOverviewFilters>) => setFilters((current) => ({ ...current, ...patch }))
  const clearFilters = () => {
    setFilters({ ...DEFAULT_GSI_OVERVIEW_FILTERS })
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
    <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
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
              <p className={`mt-0.5 text-xs ${mutedText}`}>{methodName} · {GSI_STANDARD.edition}</p>
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

          <GsiOverviewControls
            darkMode={darkMode}
            language={language}
            filters={filters}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onFiltersChange={updateFilters}
            onSortChange={(key, direction) => { setSortKey(key); setSortDirection(direction) }}
            onClear={clearFilters}
          />

          <section className={cardCls} data-testid="gsi-point-scores">
            <div className="mb-2 flex justify-end">
              <span className={`text-xs ${mutedText}`}>{sortedRows.length} {isEn ? 'points' : '个点位'}</span>
            </div>
            {sortedRows.length === 0 ? (
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{summary.rows.length ? copy.noMatch : copy.noPoints}</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className={`w-full min-w-[1100px] border-collapse border text-sm ${tableBorder}`}>
                  <thead className={`sticky top-0 z-10 ${headCell}`}>
                    <tr>
                      {headers.map((header) => (
                        <th key={header} className={`border ${tableBorder} px-1.5 py-2 text-center text-xs font-medium`}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((row) => {
                      const expanded = expandedPointIds.has(row.point.id)
                      const grade = row.result?.grade
                      const entry = row.entryMode === 'quantitative' ? copy.quantitative : row.entryMode === 'chart' ? copy.chart : '—'
                      const detailRows = gsiOverviewDetailDescriptions(row, language)
                      const warnings = isEn ? row.result?.warningsEn ?? [] : row.result?.warnings ?? []
                      const structure = structureLabel(row.structureId, language)
                      const surface = surfaceLabel(row.surfaceQualityId, language)
                      return (
                        <Fragment key={row.point.id}>
                          <tr className={darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'}>
                            <td className={`border ${tableBorder} px-1.5 py-2 text-center tabular-nums ${bodyText}`}>{row.ordinal}</td>
                            <td className={`border ${tableBorder} px-1.5 py-2 text-center ${bodyText}`}>
                              <button type="button" onClick={() => onOpenPoint(row.point.id)} className={`block w-full truncate font-medium ${linkCls}`} title={row.point.name}>
                                {row.point.name}
                              </button>
                            </td>
                            <td className={`border ${tableBorder} px-1.5 py-2 text-center ${bodyText}`} title={row.point.note || undefined}><span className="block truncate">{row.point.note || '—'}</span></td>
                            <td className={`border ${tableBorder} px-1.5 py-2 text-center ${bodyText}`} title={row.point.oreType || undefined}><span className="block truncate">{row.point.oreType || '—'}</span></td>
                            <td className={`border ${tableBorder} px-1.5 py-2 text-center ${bodyText}`}>{entry}</td>
                            <td className={`border ${tableBorder} px-1.5 py-2 text-center ${bodyText}`} title={structure === '—' ? undefined : structure}>
                              <span className="block truncate">{structure}</span>
                            </td>
                            <td className={`border ${tableBorder} px-1.5 py-2 text-center ${bodyText}`} title={surface === '—' ? undefined : surface}>
                              <span className="block truncate">{surface}</span>
                            </td>
                            <td className={`border ${tableBorder} px-1 py-2 text-center tabular-nums ${bodyText}`}>{formatGsiNumber(row.scaleA)}</td>
                            <td className={`border ${tableBorder} px-1 py-2 text-center tabular-nums ${bodyText}`}>{formatGsiNumber(row.scaleB)}</td>
                            <td className={`border ${tableBorder} px-1 py-2 text-center font-semibold tabular-nums ${row.needsInput ? 'text-amber-600 dark:text-amber-300' : darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                              {row.needsInput ? copy.needsInput : formatGsiNumber(row.gsi)}
                            </td>
                            <td className={`border ${tableBorder} px-1 py-2 text-center ${bodyText}`}>
                              {grade ? (isEn ? grade.labelEn : grade.label) : '—'}
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
                            <tr>
                              <td colSpan={COLUMN_COUNT} className={`border ${tableBorder} px-3 py-3 text-left ${darkMode ? 'bg-gray-900/40' : 'bg-gray-50/80'}`}>
                                <div className="overflow-x-auto">
                                  <table className={`w-full min-w-[520px] border-collapse border text-xs ${tableBorder}`}>
                                    <thead>
                                      <tr>
                                        {[copy.parameter, copy.value].map((header) => (
                                          <th key={header} className={`border ${tableBorder} ${headCell} px-2 py-1.5 text-left font-medium`}>{header}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {detailRows.map((description) => (
                                        <tr key={description.key}>
                                          <td className={`border ${tableBorder} px-2 py-1.5 font-medium ${bodyText}`}>{isEn ? description.labelEn : description.label}</td>
                                          <td className={`border ${tableBorder} px-2 py-1.5 ${bodyText}`}>{isEn ? description.valueEn ?? description.value : description.value}</td>
                                        </tr>
                                      ))}
                                      {row.result ? (
                                        <>
                                          <tr>
                                            <td className={`border ${tableBorder} px-2 py-1.5 font-medium ${bodyText}`}>{copy.scaleA}</td>
                                            <td className={`border ${tableBorder} px-2 py-1.5 tabular-nums ${bodyText}`}>{formatGsiNumber(row.result.scaleA)}</td>
                                          </tr>
                                          <tr>
                                            <td className={`border ${tableBorder} px-2 py-1.5 font-medium ${bodyText}`}>{copy.scaleB}</td>
                                            <td className={`border ${tableBorder} px-2 py-1.5 tabular-nums ${bodyText}`}>{formatGsiNumber(row.result.scaleB)}</td>
                                          </tr>
                                          <tr>
                                            <td className={`border ${tableBorder} px-2 py-1.5 font-medium ${bodyText}`}>{copy.formula}</td>
                                            <td className={`border ${tableBorder} px-2 py-1.5 ${bodyText}`}>{isEn ? row.result.formulaEn : row.result.formula}</td>
                                          </tr>
                                        </>
                                      ) : null}
                                    </tbody>
                                  </table>
                                </div>
                                {warnings.length ? (
                                  <ul className={`mt-2 list-disc space-y-0.5 pl-5 text-xs ${darkMode ? 'text-amber-200' : 'text-amber-800'}`}>
                                    {warnings.map((warning) => <li key={warning}>{warning}</li>)}
                                  </ul>
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

          <GsiOverviewCharts darkMode={darkMode} language={language} stats={stats} />
        </div>
      </div>
    </div>
  )
}
