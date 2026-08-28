import { useMemo, useRef, useState } from 'react'
import { Plus, Upload } from 'lucide-react'
import type { RockMassCaseRecord } from '../../types/rockmassCase'
import { ROCKMASS_CASE_FILE_EXT } from '../../utils/rockmassCaseFile'
import { formatDateTimeDisplay } from '../../utils/rockmassCaseStore'
import BackIconButton from '../BackIconButton'

const PAGE_SIZE = 8

interface ClassificationWorkspacePageProps {
  darkMode: boolean
  language: 'zh' | 'en'
  methodName: string
  cases: RockMassCaseRecord[]
  newCaseName: string
  onNewCaseNameChange: (name: string) => void
  onCreateCase: () => void
  onOpenCase: (record: RockMassCaseRecord) => void
  onDeleteCase: (caseId: string) => void
  onImportFiles: (files: FileList | File[]) => void
  message: string | null
  onBack: () => void
  terminology?: 'case' | 'project'
}

export default function ClassificationWorkspacePage({
  darkMode,
  language,
  methodName,
  cases,
  newCaseName,
  onNewCaseNameChange,
  onCreateCase,
  onOpenCase,
  onDeleteCase,
  onImportFiles,
  message,
  onBack,
  terminology = 'case',
}: ClassificationWorkspacePageProps) {
  const [page, setPage] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEn = language === 'en'

  const copy = isEn
    ? {
        back: 'Back',
        title: `${methodName} workspace`,
        intro: `One case represents one project and can contain any number of calculation points. Create or open a case to begin. Cases are stored locally; exported ${ROCKMASS_CASE_FILE_EXT} files can be opened by this application.`,
        newCase: terminology === 'project' ? 'New project' : 'New case',
        caseName: terminology === 'project' ? 'Project name' : 'Case name',
        casePlaceholder: 'e.g. Mine -450 m haulage drift',
        createCase: terminology === 'project' ? 'Create project' : 'Create case',
        importCase: terminology === 'project' ? 'Import project' : 'Import case',
        dropFiles: `Drop ${ROCKMASS_CASE_FILE_EXT} ${terminology === 'project' ? 'project' : 'case'} files here to import.`,
        history: terminology === 'project' ? 'Project history' : 'Case history',
        previousPage: 'Previous',
        nextPage: 'Next',
        empty: `No ${terminology === 'project' ? 'projects' : 'cases'} yet. Enter a name and select “${terminology === 'project' ? 'Create project' : 'Create case'}”, or import an existing ${ROCKMASS_CASE_FILE_EXT} file.`,
        headers: [terminology === 'project' ? 'Project name' : 'Case name', 'Points', 'Updated', 'Actions'],
        open: 'Open',
        delete: 'Delete',
      }
    : {
        back: '返回',
        title: `${methodName}项目工作区`,
        intro: terminology === 'project'
          ? `一个项目对应一项工程，项目内可建立任意多个计算点位。请先新建或打开项目，再进入点位计算。项目保存在本机浏览数据中，导出的 ${ROCKMASS_CASE_FILE_EXT} 文件仅本软件可读取。`
          : `一个案例对应一项工程，案例内可建立任意多个计算点位。请先新建或打开案例，再进入点位计算。案例保存在本机浏览数据中，导出的 ${ROCKMASS_CASE_FILE_EXT} 文件仅本软件可读取。`,
        newCase: terminology === 'project' ? '新建项目' : '新建案例',
        caseName: terminology === 'project' ? '项目名称' : '案例名称',
        casePlaceholder: '如：某矿 -450 m 中段运输巷',
        createCase: terminology === 'project' ? '新建项目' : '新建案例',
        importCase: terminology === 'project' ? '导入项目' : '导入案例',
        dropFiles: `把 ${ROCKMASS_CASE_FILE_EXT} ${terminology === 'project' ? '项目' : '案例'}文件拖到此处即可导入。`,
        history: terminology === 'project' ? '历史项目' : '历史案例',
        previousPage: '上一页',
        nextPage: '下一页',
        empty: `还没有${terminology === 'project' ? '项目' : '案例'}。在上方填写名称后点击「${terminology === 'project' ? '新建项目' : '新建案例'}」，或导入已有的 ${ROCKMASS_CASE_FILE_EXT} 文件。`,
        headers: [terminology === 'project' ? '项目名称' : '案例名称', '点位数', '更新时间', '操作'],
        open: '打开',
        delete: '删除',
      }

  const pageCount = Math.max(1, Math.ceil(cases.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const visibleCases = useMemo(
    () => cases.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE),
    [cases, currentPage]
  )

  const cardCls = `rounded-lg border p-4 sm:p-5 ${
    darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white shadow-sm'
  }`
  const inputCls = `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${
    darkMode ? 'border-gray-500 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
  }`
  const border = darkMode ? 'border-gray-600' : 'border-gray-200'
  const headCell = darkMode ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-50 text-gray-600'
  const linkCls = darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800'
  const messageIsError = message ? /失败|failed|invalid|incompatible/i.test(message) : false

  return (
    <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="w-full space-y-4">
          <header className="flex items-start gap-2">
            <BackIconButton label={copy.back} onClick={onBack} darkMode={darkMode} className="mt-1" />
            <div className="min-w-0">
              <h1 className={`text-2xl font-bold sm:text-3xl ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {copy.title}
              </h1>
              <p className={`mt-2 max-w-5xl text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {copy.intro}
              </p>
            </div>
          </header>

          <section className={cardCls} aria-labelledby="classification-new-case-heading">
            <h2 id="classification-new-case-heading" className={`mb-3 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {copy.newCase}
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="block flex-1 space-y-1">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{copy.caseName}</span>
                <input
                  className={inputCls}
                  value={newCaseName}
                  onChange={(event) => onNewCaseNameChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') onCreateCase()
                  }}
                  placeholder={copy.casePlaceholder}
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onCreateCase}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Plus className="h-4 w-4 shrink-0" aria-hidden />
                  {copy.createCase}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Upload className="h-4 w-4 shrink-0" aria-hidden />
                  {copy.importCase}
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ROCKMASS_CASE_FILE_EXT}
              className="hidden"
              aria-label={copy.importCase}
              onChange={(event) => {
                if (event.target.files?.length) onImportFiles(event.target.files)
                event.target.value = ''
              }}
            />

            <div
              onDragOver={(event) => {
                event.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragActive(false)
                if (event.dataTransfer.files?.length) onImportFiles(event.dataTransfer.files)
              }}
              className={`mt-3 rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm transition-colors ${
                dragActive
                  ? darkMode
                    ? 'border-blue-500 bg-blue-950/30 text-blue-200'
                    : 'border-blue-500 bg-blue-50 text-blue-800'
                  : darkMode
                    ? 'border-gray-600 text-gray-400'
                    : 'border-gray-300 text-gray-500'
              }`}
            >
              {copy.dropFiles}
            </div>

            {message ? (
              <p className={`mt-3 text-sm ${messageIsError ? 'text-red-600 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`} role="status">
                {message}
              </p>
            ) : null}
          </section>

          <section className={cardCls} aria-labelledby="classification-case-history-heading">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 id="classification-case-history-heading" className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {copy.history} ({cases.length})
              </h2>
              {pageCount > 1 ? (
                <div className="flex items-center gap-2 text-sm">
                  <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} className={`rounded px-2 py-1 disabled:opacity-40 ${linkCls}`}>
                    {copy.previousPage}
                  </button>
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{currentPage + 1} / {pageCount}</span>
                  <button type="button" disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)} className={`rounded px-2 py-1 disabled:opacity-40 ${linkCls}`}>
                    {copy.nextPage}
                  </button>
                </div>
              ) : null}
            </div>

            {cases.length === 0 ? (
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{copy.empty}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr>
                      {copy.headers.map((label) => (
                        <th key={label} className={`border-b ${border} ${headCell} px-3 py-2 text-center text-xs font-medium`}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCases.map((record) => (
                      <tr key={record.id} className={darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'}>
                        <td className={`border-b ${border} px-3 py-2 text-center`}>
                          <button type="button" onClick={() => onOpenCase(record)} className={`font-medium ${linkCls}`}>
                            {record.name}
                          </button>
                        </td>
                        <td className={`border-b ${border} px-3 py-2 text-center tabular-nums ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{record.points.length}</td>
                        <td className={`border-b ${border} px-3 py-2 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDateTimeDisplay(record.updatedAt)}</td>
                        <td className={`border-b ${border} px-3 py-2`}>
                          <div className="flex flex-wrap justify-center gap-2 text-xs">
                            <button type="button" onClick={() => onOpenCase(record)} className={linkCls}>{copy.open}</button>
                            <button type="button" onClick={() => onDeleteCase(record.id)} className={darkMode ? 'text-red-300 hover:text-red-200' : 'text-red-600 hover:text-red-700'}>{copy.delete}</button>
                          </div>
                        </td>
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
