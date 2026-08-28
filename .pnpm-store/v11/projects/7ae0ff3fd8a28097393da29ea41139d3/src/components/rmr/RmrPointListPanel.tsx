import { useEffect, useState } from 'react'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import BackIconButton from '../BackIconButton'
import { computeRmrScores } from '../../utils/rmrCalc'
import type { RockMassCaseRecord, RockMassPointRecord } from '../../types/rockmassCase'

interface RmrPointListPanelProps {
  darkMode: boolean
  language: 'zh' | 'en'
  caseRecord: RockMassCaseRecord
  message: string | null
  onCasePatch: (patch: Partial<RockMassCaseRecord>) => void
  onOpenPoint: (pointId: string) => void
  onCreatePoint: () => void
  onDuplicatePoint: (pointId: string) => void
  onDeletePoint: (pointId: string) => void
  onGoSummary: () => void
  onBackToWorkspace: () => void
}

function pointSummary(point: RockMassPointRecord, language: 'zh' | 'en') {
  if (point.migration?.needsReview) return { rmr: null as number | null, className: language === 'en' ? 'Needs review' : '待复核', scores: [null, null, null, null, null, null] }
  if (!point.rmr) return { rmr: null as number | null, className: '—', scores: [null, null, null, null, null, null] }
  const scores = computeRmrScores(point.rmr)
  return {
    rmr: scores.rmr,
    className: scores.classInfo
      ? language === 'en'
        ? `${scores.classInfo.labelEn} (${scores.classInfo.qualityEn})`
        : `${scores.classInfo.label}（${scores.classInfo.quality}）`
      : '—',
    scores: [scores.A1, scores.A2, scores.A3, scores.A4, scores.A5, scores.A6],
  }
}

export default function RmrPointListPanel({
  darkMode,
  language,
  caseRecord,
  message,
  onCasePatch,
  onOpenPoint,
  onCreatePoint,
  onDuplicatePoint,
  onDeletePoint,
  onGoSummary,
  onBackToWorkspace,
}: RmrPointListPanelProps) {
  const isEn = language === 'en'
  const [nameDraft, setNameDraft] = useState(caseRecord.name)

  useEffect(() => setNameDraft(caseRecord.name), [caseRecord.name])

  useEffect(() => {
    if (nameDraft === caseRecord.name) return
    const timer = window.setTimeout(() => onCasePatch({ name: nameDraft }), 250)
    return () => window.clearTimeout(timer)
  }, [nameDraft, caseRecord.name, onCasePatch])

  const cardCls = `rounded-lg border p-4 sm:p-5 ${
    darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white shadow-sm'
  }`
  const inputCls = `w-full rounded-lg border px-3 py-2 text-sm ${
    darkMode ? 'border-gray-500 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
  }`
  const border = darkMode ? 'border-gray-600' : 'border-gray-200'
  const headCell = darkMode ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-50 text-gray-600'
  const linkCls = darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800'
  const cellCls = `border-b ${border} px-1.5 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
  const copy = isEn
    ? {
        back: 'Back to workspace', workspace: 'Project workspace', title: 'Project points',
        count: `${caseRecord.points.length} ${caseRecord.points.length === 1 ? 'point' : 'points'}`,
        caseInfo: 'Project information', caseName: 'Project name', projectName: 'Engineering name',
        projectNamePlaceholder: 'e.g. Deep mine development', projectLocation: 'Project location',
        projectLocationPlaceholder: 'e.g. -450 m haulage level', notes: 'Notes',
        notesPlaceholder: 'Investigation stage or data source', points: 'Points', newPoint: 'New point',
        overview: 'Project overview', empty: 'This case has no points. Select “New point” to begin an RMR classification.',
        headers: ['No.', 'Point name', 'Note', 'Ore type', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'RMR', 'Class', 'Actions'],
        edit: 'Edit', duplicate: 'Copy', delete: 'Delete',
      }
    : {
        back: '返回工作区', workspace: '项目工作区', title: '项目点位', count: `共 ${caseRecord.points.length} 个点位`,
        caseInfo: '项目信息', caseName: '项目名称', projectName: '工程名称', projectNamePlaceholder: '如：某铜矿深部开拓工程',
        projectLocation: '工程部位', projectLocationPlaceholder: '如：-450 m 中段运输巷', notes: '备注',
        notesPlaceholder: '勘察阶段、资料来源等', points: '点位列表', newPoint: '新建点位', overview: '工程总览',
        empty: '该项目还没有点位。点击「新建点位」为第一个计算点位命名后开始 RMR 分级。',
        headers: ['#', '点位名称', '说明', '矿岩类型', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'RMR', '等级', '操作'],
        edit: '编辑', duplicate: '复制', delete: '删除',
      }
  const messageIsError = message ? /失败|failed|invalid|incompatible/i.test(message) : false
  // Keep every column visible in the normal project workspace width. The table
  // remains horizontally scrollable on genuinely narrow windows as a fallback.
  const columnWidths = ['4%', '12%', '10%', '10%', '4.5%', '4.5%', '4.5%', '4.5%', '4.5%', '4.5%', '6%', '12%', '18%']

  return (
    <div className={`flex-1 min-h-0 min-w-0 flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="w-full space-y-4">
          <div className="flex items-start gap-2">
            <BackIconButton label={copy.back} onClick={onBackToWorkspace} darkMode={darkMode} className="mt-1" />
            <div className="min-w-0">
              <nav className={`flex flex-wrap items-center gap-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <button type="button" onClick={onBackToWorkspace} className={linkCls}>
                  {copy.workspace}
                </button>
                <span aria-hidden>/</span>
                <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{caseRecord.name}</span>
              </nav>
              <h1
                className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${
                  darkMode ? 'text-gray-100' : 'text-gray-900'
                }`}
              >
                {copy.title}
              </h1>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {copy.count}
              </p>
            </div>
          </div>

          <div className={cardCls}>
            <h2 className={`mb-3 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{copy.caseInfo}</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block space-y-1">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{copy.caseName}</span>
                <input className={inputCls} value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} />
              </label>
              <label className="block space-y-1">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{copy.projectName}</span>
                <input
                  className={inputCls}
                  value={caseRecord.engineering ?? ''}
                  onChange={(event) => onCasePatch({ engineering: event.target.value })}
                  placeholder={copy.projectNamePlaceholder}
                />
              </label>
              <label className="block space-y-1">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{copy.projectLocation}</span>
                <input
                  className={inputCls}
                  value={caseRecord.location ?? ''}
                  onChange={(event) => onCasePatch({ location: event.target.value })}
                  placeholder={copy.projectLocationPlaceholder}
                />
              </label>
              <label className="block space-y-1">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{copy.notes}</span>
                <input
                  className={inputCls}
                  value={caseRecord.remark ?? ''}
                  onChange={(event) => onCasePatch({ remark: event.target.value })}
                  placeholder={copy.notesPlaceholder}
                />
              </label>
            </div>
          </div>

          <div className={cardCls}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {copy.points} ({caseRecord.points.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onCreatePoint}
                  className="rounded-lg border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  {copy.newPoint}
                </button>
                <button
                  type="button"
                  onClick={onGoSummary}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    darkMode
                      ? 'border-gray-600 text-gray-200 hover:bg-gray-800'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {copy.overview}
                </button>
              </div>
            </div>

            {caseRecord.points.length === 0 ? (
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {copy.empty}
              </p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-0 table-fixed border-collapse text-sm">
                  <colgroup>
                    {copy.headers.map((label, index) => (
                      <col key={`point-col-${label}`} style={{ width: columnWidths[index] }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      {copy.headers.map((label) => (
                        <th
                          key={label}
                          className={`border-b ${border} ${headCell} px-1 py-2 text-center text-xs font-medium`}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {caseRecord.points.map((point, index) => {
                      const summary = pointSummary(point, language)
                      return (
                        <tr key={point.id} className={darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'}>
                          <td className={`${cellCls} text-center tabular-nums`}>{index + 1}</td>
                          <td className={`border-b ${border} px-1.5 py-2 text-center`}>
                            <button
                              type="button"
                              onClick={() => onOpenPoint(point.id)}
                              className={`font-medium ${linkCls}`}
                            >
                              {point.name}
                            </button>
                          </td>
                          <td className={`${cellCls} truncate text-center`}>{point.note || '—'}</td>
                          <td className={`${cellCls} truncate text-center`}>{point.oreType || '—'}</td>
                          {summary.scores.map((score, scoreIndex) => (
                            <td key={`score-${point.id}-${scoreIndex}`} className={`${cellCls} text-center tabular-nums font-semibold`}>{score ?? '—'}</td>
                          ))}
                          <td className={`${cellCls} text-center tabular-nums font-semibold`}>{summary.rmr ?? '—'}</td>
                          <td className={`${cellCls} text-center`}>{summary.className}</td>
                          <td className={`border-b ${border} px-1 py-2`}>
                            <div className="flex justify-center gap-0.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => onOpenPoint(point.id)}
                                aria-label={copy.edit}
                                title={copy.edit}
                                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${linkCls}`}
                              >
                                <Pencil className="h-4 w-4" aria-hidden />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDuplicatePoint(point.id)}
                                aria-label={copy.duplicate}
                                title={copy.duplicate}
                                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${linkCls}`}
                              >
                                <Copy className="h-4 w-4" aria-hidden />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeletePoint(point.id)}
                                aria-label={copy.delete}
                                title={copy.delete}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-600 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-300 dark:hover:text-red-200"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {message ? (
              <p className={`mt-3 text-sm ${messageIsError ? 'text-red-600 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`} role="status">{message}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
