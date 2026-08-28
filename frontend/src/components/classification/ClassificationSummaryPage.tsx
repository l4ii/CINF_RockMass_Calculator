import { useMemo } from 'react'
import BackIconButton from '../BackIconButton'
import type { ClassificationResult, ParameterDescription, StandardDescriptor } from '../../methods/types'
import type { RockMassCaseRecord, RockMassPointRecord } from '../../types/rockmassCase'

export interface ClassificationSummaryRow {
  point: RockMassPointRecord
  result: ClassificationResult | null
  descriptions: ParameterDescription[]
  issueCount: number
}

interface ClassificationSummaryPageProps {
  darkMode: boolean
  language: 'zh' | 'en'
  methodName: string
  standard: StandardDescriptor
  caseRecord: RockMassCaseRecord
  rows: ClassificationSummaryRow[]
  message: string | null
  onBackToWorkspace: () => void
  onBackToPoints: () => void
  onOpenPoint: (pointId: string) => void
  onOpenExport: () => void
}

export default function ClassificationSummaryPage({
  darkMode,
  language,
  methodName,
  standard,
  caseRecord,
  rows,
  message,
  onBackToWorkspace,
  onBackToPoints,
  onOpenPoint,
  onOpenExport,
}: ClassificationSummaryPageProps) {
  const isEn = language === 'en'
  const validRows = rows.filter((row) => row.result)
  const average = validRows.length
    ? validRows.reduce((sum, row) => sum + (row.result?.value ?? 0), 0) / validRows.length
    : null
  const distribution = useMemo(() => {
    const counts = new Map<string, number>()
    validRows.forEach((row) => {
      const grade = row.result ? (isEn ? row.result.gradeEn : row.result.grade) : null
      if (grade) counts.set(grade, (counts.get(grade) ?? 0) + 1)
    })
    return [...counts.entries()].map(([grade, count]) => `${grade} × ${count}`).join(isEn ? '; ' : '；') || '—'
  }, [isEn, validRows])
  const parameterHeaders = useMemo(() => {
    const seen = new Set<string>()
    return rows.flatMap((row) =>
      row.descriptions.filter((description) => {
        if (seen.has(description.key)) return false
        seen.add(description.key)
        return true
      })
    )
  }, [rows])
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const border = darkMode ? 'border-gray-700' : 'border-gray-200'
  const link = darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800'
  const copy = isEn
    ? {
        back: 'Back to points',
        workspace: 'Project workspace',
        overview: 'Project overview',
        export: 'Export',
        metrics: ['Total points', 'Valid results', 'Mean result', 'Class distribution'],
        section: 'Point inputs and results',
        recalculation: `All values are recalculated against ${standard.id}.`,
        empty: 'No points in this case.',
        pointName: 'Point name',
        result: 'Result',
        grade: 'Class',
        needsInput: (count: number) => `Needs ${count} ${count === 1 ? 'input' : 'inputs'}`,
      }
    : {
        back: '返回点位列表',
        workspace: '项目工作区',
        overview: '工程总览',
        export: '导出',
        metrics: ['点位总数', '有效结果', '结果平均值', '等级分布'],
        section: '点位输入与结果',
        recalculation: `所有数值按 ${standard.id} 实时重算。`,
        empty: '案例中暂无点位。',
        pointName: '点位名称',
        result: '计算结果',
        grade: '等级',
        needsInput: (count: number) => `待补充 ${count} 项`,
      }
  const messageIsError = message ? /失败|failed|invalid|incompatible/i.test(message) : false

  return (
    <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="w-full space-y-5">
          <header className="flex items-start gap-2">
            <BackIconButton label={copy.back} onClick={onBackToPoints} darkMode={darkMode} className="mt-1" />
            <div className="min-w-0 flex-1">
              <p className={`text-xs ${muted}`}>
                <button type="button" onClick={onBackToWorkspace} className={link}>{copy.workspace}</button> / {caseRecord.name} / {copy.overview}
              </p>
              <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h1 className={`text-2xl font-bold sm:text-3xl ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{copy.overview}</h1>
                  <p className={`mt-1 text-sm ${muted}`}>{methodName} · {standard.edition}</p>
                </div>
                <button type="button" onClick={onOpenExport} className={`text-sm font-medium underline-offset-4 hover:underline ${link}`}>{copy.export}</button>
              </div>
            </div>
          </header>

          <section className={`grid grid-cols-2 gap-px overflow-hidden rounded-lg border ${border} ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} lg:grid-cols-4`}>
            {[
              { label: copy.metrics[0], value: String(rows.length) },
              { label: copy.metrics[1], value: String(validRows.length) },
              { label: copy.metrics[2], value: average == null ? '—' : Number(average.toFixed(3)).toString() },
              { label: copy.metrics[3], value: distribution },
            ].map((metric) => (
              <div key={metric.label} className={`min-w-0 px-4 py-3 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className={`text-xs ${muted}`}>{metric.label}</div>
                <div className={`mt-1 break-words text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{metric.value}</div>
              </div>
            ))}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{copy.section}</h2>
                <p className={`mt-1 text-xs ${muted}`}>{copy.recalculation}</p>
              </div>
              {message ? <p className={`text-sm ${messageIsError ? 'text-red-600 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`} role="status">{message}</p> : null}
            </div>
            {rows.length === 0 ? (
              <div className={`border-y py-10 text-center text-sm ${border} ${muted}`}>{copy.empty}</div>
            ) : (
              <div className={`overflow-x-auto border-y ${border}`}>
                <table className="w-full min-w-[900px] border-collapse text-xs">
                  <thead className={darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}>
                    <tr>
                      <th className="whitespace-nowrap px-3 py-2.5 text-center font-medium">{copy.pointName}</th>
                      {parameterHeaders.map((item) => <th key={item.key} className="min-w-[120px] px-3 py-2.5 text-center font-medium">{isEn ? item.labelEn : item.label}</th>)}
                      <th className="whitespace-nowrap px-3 py-2.5 text-center font-medium">{copy.result}</th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-center font-medium">{copy.grade}</th>
                    </tr>
                  </thead>
                  <tbody className={darkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
                    {rows.map((row) => (
                      <tr key={row.point.id} className={darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-white'}>
                        <td className="px-3 py-2.5 text-center">
                          <button type="button" onClick={() => onOpenPoint(row.point.id)} className={`font-medium ${link}`}>{row.point.name}</button>
                          {row.point.note ? <div className={`mt-0.5 max-w-[180px] truncate ${muted}`}>{row.point.note}</div> : null}
                        </td>
                        {parameterHeaders.map((header) => {
                          const description = row.descriptions.find((item) => item.key === header.key)
                          const value = isEn ? description?.valueEn ?? description?.value : description?.value
                          const score = isEn ? description?.scoreEn ?? description?.score : description?.score
                          return <td key={header.key} className="px-3 py-2.5 text-center align-top"><div>{value ?? '—'}</div>{score ? <div className={`mt-0.5 tabular-nums ${muted}`}>{score}</div> : null}</td>
                        })}
                        <td className="px-3 py-2.5 text-center font-semibold tabular-nums text-blue-700 dark:text-blue-300">{row.result?.displayValue ?? <span className="text-amber-600 dark:text-amber-300">{copy.needsInput(row.issueCount)}</span>}</td>
                        <td className="px-3 py-2.5 text-center">{row.result ? (isEn ? row.result.gradeEn : row.result.grade) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
