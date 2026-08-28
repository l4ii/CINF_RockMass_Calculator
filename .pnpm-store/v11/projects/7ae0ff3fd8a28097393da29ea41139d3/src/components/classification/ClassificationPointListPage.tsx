import { useEffect, useState } from 'react'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import BackIconButton from '../BackIconButton'
import type { RockMassCaseRecord, RockMassPointRecord } from '../../types/rockmassCase'
import { formatDateTimeDisplay } from '../../utils/rockmassCaseStore'

export interface PointListEntry {
  label: string
  value: string
  grade: string
}

export interface PointListResult {
  value: string
  grade: string
  incomplete: boolean
  entries?: PointListEntry[]
}

interface ClassificationPointListPageProps {
  darkMode: boolean
  language: 'zh' | 'en'
  methodName: string
  caseRecord: RockMassCaseRecord
  message: string | null
  getPointResult: (point: RockMassPointRecord) => PointListResult
  onCasePatch: (patch: Partial<RockMassCaseRecord>) => void
  onOpenPoint: (pointId: string) => void
  onCreatePoint: () => void
  onDuplicatePoint: (pointId: string) => void
  onDeletePoint: (pointId: string) => void
  onGoSummary: () => void
  onBackToWorkspace: () => void
}

export default function ClassificationPointListPage({
  darkMode,
  language,
  methodName,
  caseRecord,
  message,
  getPointResult,
  onCasePatch,
  onOpenPoint,
  onCreatePoint,
  onDuplicatePoint,
  onDeletePoint,
  onGoSummary,
  onBackToWorkspace,
}: ClassificationPointListPageProps) {
  const isEn = language === 'en'
  const [caseName, setCaseName] = useState(caseRecord.name)

  useEffect(() => setCaseName(caseRecord.name), [caseRecord.name])
  useEffect(() => {
    if (caseName === caseRecord.name) return
    const timer = window.setTimeout(() => onCasePatch({ name: caseName }), 300)
    return () => window.clearTimeout(timer)
  }, [caseName, caseRecord.name, onCasePatch])

  const input = `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${
    darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
  }`
  const border = darkMode ? 'border-gray-700' : 'border-gray-200'
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const link = darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800'
  const copy = isEn
    ? {
        back: 'Back to project workspace',
        workspace: 'Project workspace',
        title: 'Point management',
        count: `${caseRecord.points.length} ${caseRecord.points.length === 1 ? 'point' : 'points'}`,
        projectInfo: 'Project information',
        fields: [
          { label: 'Case name', placeholder: 'Case name' },
          { label: 'Project name', placeholder: 'e.g. Deep mine development' },
          { label: 'Project location', placeholder: 'e.g. -450 m level' },
          { label: 'Notes', placeholder: 'Data source or investigation stage' },
        ],
        pointList: 'Points',
        overview: 'Project overview',
        newPoint: 'New point',
        empty: 'No points yet. Select “New point” to start a calculation.',
        headers: ['No.', 'Point name', 'Point note', 'Result', 'Class', 'Updated', 'Actions'],
        needsInput: 'Needs input',
        edit: 'Edit',
        copy: 'Copy',
        delete: 'Delete',
      }
    : {
        back: '返回项目工作区',
        workspace: '项目工作区',
        title: '点位管理',
        count: `共 ${caseRecord.points.length} 个点位`,
        projectInfo: '工程信息',
        fields: [
          { label: '案例名称', placeholder: '案例名称' },
          { label: '工程名称', placeholder: '如：深部开拓工程' },
          { label: '工程部位', placeholder: '如：-450 m 中段' },
          { label: '备注', placeholder: '资料来源或勘察阶段' },
        ],
        pointList: '点位列表',
        overview: '工程总览',
        newPoint: '新建点位',
        empty: '暂无点位，点击“新建点位”开始计算。',
        headers: ['序号', '点位名称', '点位说明', '计算结果', '等级', '更新时间', '操作'],
        needsInput: '待补充',
        edit: '编辑',
        copy: '复制',
        delete: '删除',
      }
  const messageIsError = message ? /失败|failed|invalid|incompatible/i.test(message) : false

  return (
    <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="w-full space-y-5">
          <header className="flex items-start gap-2">
            <BackIconButton label={copy.back} onClick={onBackToWorkspace} darkMode={darkMode} className="mt-1" />
            <div className="min-w-0">
              <p className={`text-xs ${muted}`}>{copy.workspace} / {caseRecord.name}</p>
              <h1 className={`mt-1 text-2xl font-bold sm:text-3xl ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {copy.title}
              </h1>
              <p className={`mt-1 text-sm ${muted}`}>{methodName} · {copy.count}</p>
            </div>
          </header>

          <section className={`border-y py-4 ${border}`} aria-labelledby="project-information-heading">
            <h2 id="project-information-heading" className={`mb-3 text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {copy.projectInfo}
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                { ...copy.fields[0], value: caseName, set: setCaseName },
                { ...copy.fields[1], value: caseRecord.engineering ?? '', set: (value: string) => onCasePatch({ engineering: value }) },
                { ...copy.fields[2], value: caseRecord.location ?? '', set: (value: string) => onCasePatch({ location: value }) },
                { ...copy.fields[3], value: caseRecord.remark ?? '', set: (value: string) => onCasePatch({ remark: value }) },
              ].map((field) => (
                <label key={field.label} className="block">
                  <span className={`mb-1 block text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{field.label}</span>
                  <input className={input} value={field.value} onChange={(event) => field.set(event.target.value)} placeholder={field.placeholder} />
                </label>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{copy.pointList}</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={onGoSummary} className={`rounded-lg border px-3 py-2 text-sm font-medium ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-white'}`}>
                  {copy.overview}
                </button>
                <button type="button" onClick={onCreatePoint} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  {copy.newPoint}
                </button>
              </div>
            </div>

            {caseRecord.points.length === 0 ? (
              <div className={`border-y py-10 text-center text-sm ${border} ${muted}`}>{copy.empty}</div>
            ) : (
              <div className={`overflow-x-auto border-y ${border}`}>
                <table className="w-full min-w-[780px] border-collapse text-sm">
                  <thead className={darkMode ? 'bg-gray-800/70 text-gray-300' : 'bg-gray-100 text-gray-600'}>
                    <tr>
                      {copy.headers.map((label) => (
                        <th key={label} className="px-3 py-2.5 text-center text-xs font-medium">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={darkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
                    {caseRecord.points.map((point, index) => {
                      const result = getPointResult(point)
                      return (
                        <tr key={point.id} className={darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-white'}>
                          <td className="px-3 py-2.5 text-center tabular-nums">{index + 1}</td>
                          <td className="px-3 py-2.5 text-center">
                            <button type="button" onClick={() => onOpenPoint(point.id)} className={`font-medium ${link}`}>{point.name}</button>
                          </td>
                          <td className="max-w-[220px] truncate px-3 py-2.5 text-center">{point.note || '—'}</td>
                          <td className="px-3 py-2.5 text-center tabular-nums">
                            {result.incomplete ? (
                              <span className="text-amber-600 dark:text-amber-300">{copy.needsInput}</span>
                            ) : result.entries?.length ? (
                              <div className="inline-flex flex-col items-center gap-0.5">
                                {result.entries.map((entry) => (
                                  <div key={entry.label} className="whitespace-nowrap">
                                    <span className={`mr-1 font-medium ${muted}`}>{entry.label}</span>
                                    {entry.value ? <span className="font-semibold">{entry.value}</span> : null}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="font-semibold">{result.value}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {result.incomplete ? '—' : result.entries?.length ? (
                              <div className="inline-flex flex-col items-center gap-0.5">
                                {result.entries.map((entry) => (
                                  <div key={entry.label} className="whitespace-nowrap">{entry.grade}</div>
                                ))}
                              </div>
                            ) : result.grade}
                          </td>
                          <td className={`px-3 py-2.5 text-center text-xs ${muted}`}>{formatDateTimeDisplay(point.updatedAt)}</td>
                          <td className="px-3 py-2.5 text-center text-xs">
                            <div className="flex justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => onOpenPoint(point.id)}
                                aria-label={copy.edit}
                                title={copy.edit}
                                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${link}`}
                              >
                                <Pencil className="h-4 w-4" aria-hidden />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDuplicatePoint(point.id)}
                                aria-label={copy.copy}
                                title={copy.copy}
                                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${link}`}
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
            {message ? <p className={`mt-3 text-right text-sm ${messageIsError ? 'text-red-600 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`} role="status">{message}</p> : null}
          </section>
        </div>
      </div>
    </div>
  )
}
