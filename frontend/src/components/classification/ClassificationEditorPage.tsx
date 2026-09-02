import { useState, type ReactNode } from 'react'
import BackIconButton from '../BackIconButton'
import type { ClassificationResult, StandardDescriptor, ValidationIssue } from '../../methods/types'
import PointInformationFields from './PointInformationFields'

interface ClassificationEditorPageProps {
  darkMode: boolean
  language: 'zh' | 'en'
  methodName: string
  methodNameEn: string
  standard: StandardDescriptor
  caseName: string
  pointName: string
  pointOreType: string
  oreTypeOptions?: string[]
  pointNote: string
  pointOrdinal: number
  pointTotal: number
  issues: ValidationIssue[]
  result: ClassificationResult | null
  renderForm: () => ReactNode
  onPointNameChange: (value: string) => void
  onPointOreTypeChange: (value: string) => void
  onPointNoteChange: (value: string) => void
  onBackToWorkspace: () => void
  onPrevious: () => void
  onComplete: () => void
  onNext: () => void
  wideResultRatio?: boolean
}

export default function ClassificationEditorPage({
  darkMode,
  language,
  methodName,
  methodNameEn,
  caseName,
  pointName,
  pointOreType,
  oreTypeOptions = [],
  pointNote,
  pointOrdinal,
  pointTotal,
  issues,
  result,
  renderForm,
  onPointNameChange,
  onPointOreTypeChange,
  onPointNoteChange,
  onBackToWorkspace,
  onPrevious,
  onComplete,
  onNext,
}: ClassificationEditorPageProps) {
  const [attempted, setAttempted] = useState(false)
  const isEn = language === 'en'

  const input = `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${
    darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
  }`
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const card = `rounded-lg border p-4 sm:p-5 ${
    darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white shadow-sm'
  }`
  const visibleWarnings = result ? (isEn ? result.warningsEn ?? result.warnings : result.warnings) : []

  const submit = (action: () => void) => {
    if (issues.length > 0) {
      setAttempted(true)
      const target = document.querySelector<HTMLElement>(`[data-field="${issues[0].field}"]`)
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      target?.querySelector<HTMLElement>('input,select,button')?.focus()
      return
    }
    setAttempted(false)
    action()
  }

  return (
    <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      <div className="grid w-full min-h-0 flex-1 grid-cols-1 gap-4 px-4 py-5 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,3fr)_minmax(220px,1fr)]">
        <main data-testid="calculation-input-pane" className="thin-scroll -mr-1 min-h-0 min-w-0 flex-1 overflow-y-auto space-y-4 pr-0.5">
          <header className="flex items-start gap-2">
            <BackIconButton label={isEn ? 'Back' : '返回'} onClick={onPrevious} darkMode={darkMode} className="mt-1" />
            <div className="min-w-0">
              <nav className={`flex flex-wrap items-center gap-1 text-xs ${muted}`}>
                <button type="button" onClick={onBackToWorkspace} className={darkMode ? 'hover:text-blue-300' : 'hover:text-blue-700'}>{isEn ? 'Project workspace' : '项目工作区'}</button>
                <span aria-hidden>/</span>
                <button type="button" onClick={onPrevious} className={darkMode ? 'hover:text-blue-300' : 'hover:text-blue-700'}>{caseName}</button>
                <span aria-hidden>/</span>
                <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{pointName}</span>
              </nav>
              <h1 className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {isEn ? methodNameEn : methodName}
              </h1>
              <p className={`mt-1 text-sm ${muted}`}>{isEn ? 'Point' : '点位'} {pointOrdinal} / {pointTotal}</p>
            </div>
          </header>

          <section className={card}>
            <PointInformationFields
              darkMode={darkMode}
              language={language}
              pointOrdinal={pointOrdinal}
              pointName={pointName}
              pointNote={pointNote}
              pointOreType={pointOreType}
              oreTypeOptions={oreTypeOptions}
              listId="rock-mass-groups"
              inputClassName={input}
              onPointNameChange={onPointNameChange}
              onPointNoteChange={onPointNoteChange}
              onPointOreTypeChange={onPointOreTypeChange}
            />
          </section>

          <div className="min-w-0 space-y-4">{renderForm()}</div>

          <footer className={card}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              {attempted && issues.length > 0 ? (
                <p className="text-sm text-red-600 dark:text-red-300 sm:mr-auto">{isEn ? issues[0].messageEn : issues[0].message}</p>
              ) : (
                <p className={`text-sm sm:mr-auto ${muted}`}>{issues.length > 0 ? (isEn ? 'Draft is saved automatically.' : '草稿已自动保存，可稍后补充。') : (isEn ? 'All required parameters are complete.' : '必填参数已完整。')}</p>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={onPrevious} className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>{isEn ? 'Previous' : '上一步'}</button>
                <button type="button" onClick={() => submit(onComplete)} className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">{isEn ? 'Complete' : '完成'}</button>
                <button type="button" onClick={() => submit(onNext)} className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>{isEn ? 'Next point' : '下一个'}</button>
              </div>
            </div>
          </footer>
          <div className="pb-24" />
        </main>

        <aside data-testid="calculation-result-pane" className="min-w-0 xl:sticky xl:top-0 xl:self-start">
          <div className={card}>
            <div className="flex items-center justify-between gap-2">
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{isEn ? 'Classification result' : '评价结果'}</h2>
              <span className={`text-xs ${issues.length === 0 ? 'text-green-600 dark:text-green-300' : 'text-amber-600 dark:text-amber-300'}`}>
                {issues.length === 0 ? (isEn ? 'Valid' : '可计算') : `${issues.length} ${isEn ? 'missing' : '项待补充'}`}
              </span>
            </div>
            {result ? (
              <>
                <div className={`mt-4 rounded-lg border px-4 py-3 text-center ${darkMode ? 'border-blue-500/40 bg-blue-950/40' : 'border-blue-200 bg-blue-50'}`}>
                  <div className={`break-words text-3xl font-bold ${darkMode ? 'text-blue-100' : 'text-blue-900'}`}>{result.displayValue}</div>
                  <div className={`mt-1 text-sm font-medium ${darkMode ? 'text-blue-100' : 'text-blue-900'}`}>{isEn ? result.gradeEn : result.grade}</div>
                </div>
                <dl className={`mt-4 divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {result.metrics.map((metric) => (
                    <div key={metric.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2 text-xs">
                      <dt className={muted}>{isEn ? metric.labelEn : metric.label}</dt>
                      <dd className={`text-right font-medium tabular-nums ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{isEn ? metric.valueEn ?? metric.value : metric.value}</dd>
                    </div>
                  ))}
                </dl>
                <p className={`mt-3 text-xs leading-relaxed ${muted}`}>{isEn ? result.summaryEn : result.summary}</p>
                {visibleWarnings.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-xs text-amber-700 dark:text-amber-300">
                    {visibleWarnings.map((warning) => <li key={warning}>{warning}</li>)}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className={`mt-4 text-center text-sm leading-relaxed ${muted}`}>{isEn ? 'Complete the required parameters to calculate.' : '补充必填参数后显示结果。'}</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
