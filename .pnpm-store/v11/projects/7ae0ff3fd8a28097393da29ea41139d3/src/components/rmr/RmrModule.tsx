import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ClassificationMethodId } from '../../types'
import { RMR89_STANDARD } from '../../config/rmrTables'
import type { RockMassCaseRecord, RockMassPointRecord } from '../../types/rockmassCase'
import { initialRmrFormState, type RmrFormState } from '../../utils/rmrCalc'
import { exportCaseFile, readCaseFromFile } from '../../utils/rockmassCaseFile'
import {
  buildBlankCase,
  buildBlankPoint,
  duplicatePoint as clonePoint,
  readCaseRecords,
  removeCase,
  sortCaseRecords,
  suggestCaseName,
  suggestPointName,
  formatTimestamp,
  upsertCase,
  writeCaseRecords,
  normalizeRockMassGroup,
  rockMassGroups,
} from '../../utils/rockmassCaseStore'
import RmrCaseSummaryPage from './RmrCaseSummaryPage'
import RmrClassificationPage from './RmrClassificationPage'
import ClassificationExportDialog, { type ClassificationExportFormat } from '../classification/ClassificationExportDialog'
import RmrPointListPanel from './RmrPointListPanel'
import RmrWorkspacePage from './RmrWorkspacePage'
import ConfirmDialog from '../ConfirmDialog'

const METHOD_ID: ClassificationMethodId = 'rmr'
const STANDARD_ID = RMR89_STANDARD.storageId

function suggestedCaseName(language: 'zh' | 'en') {
  return language === 'en' ? `RMR Classification ${formatTimestamp(new Date())}` : suggestCaseName(METHOD_ID)
}

function suggestedPointName(points: RockMassPointRecord[], language: 'zh' | 'en') {
  if (language === 'zh') return suggestPointName(points)
  let index = points.length + 1
  const taken = new Set(points.map((point) => point.name.trim()))
  while (taken.has(`Point ${index}`)) index += 1
  return `Point ${index}`
}

function englishErrorDetail(detail: string, fallback: string) {
  return /[\u3400-\u9fff]/u.test(detail) ? fallback : `${fallback}: ${detail}`
}

type Stage = 'workspace' | 'points' | 'calc' | 'summary'
type DeleteRequest = { kind: 'project' | 'point'; id: string; name: string } | null

interface RmrModuleProps {
  darkMode: boolean
  language: 'zh' | 'en'
  methodName: string
  onBackToHome: () => void
  onNavigateToMethod: (methodId: ClassificationMethodId) => void
  onNavigateToMrmr?: (state: RmrFormState, pointMeta: { caseName: string; pointName: string; oreType?: string; note?: string }) => void
}

export default function RmrModule({ darkMode, language, methodName, onBackToHome, onNavigateToMrmr }: RmrModuleProps) {
  const isEn = language === 'en'
  const [cases, setCases] = useState<RockMassCaseRecord[]>(() => readCaseRecords())
  const casesRef = useRef(cases)
  const [draft, setDraft] = useState<RockMassCaseRecord | null>(null)
  const [stage, setStage] = useState<Stage>('workspace')
  const [activePointId, setActivePointId] = useState<string | null>(null)
  const [newCaseName, setNewCaseName] = useState(() => suggestedCaseName(language))
  const [message, setMessage] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportBusy, setExportBusy] = useState(false)
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest>(null)

  useEffect(() => {
    casesRef.current = cases
  }, [cases])

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(null), 4000)
    return () => window.clearTimeout(timer)
  }, [message])

  const visibleCases = useMemo(
    () => sortCaseRecords(cases.filter((record) => record.methodId === METHOD_ID)),
    [cases]
  )

  const activePoint = useMemo(
    () => draft?.points.find((point) => point.id === activePointId) ?? null,
    [draft, activePointId]
  )
  const oreTypeOptions = draft ? rockMassGroups(draft.points) : []

  const persist = useCallback(
    (record: RockMassCaseRecord, note?: string) => {
      const next = upsertCase(casesRef.current, record)
      const write = writeCaseRecords(next)
      if (!write.ok) {
        setMessage(isEn ? englishErrorDetail(write.error, 'Save failed') : `保存失败：${write.error}`)
        return record
      }
      casesRef.current = next
      setCases(next)
      const stored = next.find((item) => item.id === record.id) ?? record
      setDraft((current) => (current && current.id === record.id ? stored : current))
      if (note) setMessage(note)
      return stored
    },
    [isEn]
  )

  const persistList = useCallback((next: RockMassCaseRecord[], note?: string) => {
    const write = writeCaseRecords(next)
    if (!write.ok) {
      setMessage(isEn ? englishErrorDetail(write.error, 'Save failed') : `保存失败：${write.error}`)
      return
    }
    casesRef.current = next
    setCases(next)
    if (note) setMessage(note)
  }, [isEn])

  useEffect(() => {
    if (!draft) return
    const timer = window.setTimeout(() => {
      const next = upsertCase(casesRef.current, draft)
      const write = writeCaseRecords(next)
      if (!write.ok) {
        setMessage(isEn ? englishErrorDetail(write.error, 'Save failed') : `保存失败：${write.error}`)
        return
      }
      casesRef.current = next
      setCases(next)
    }, 450)
    return () => window.clearTimeout(timer)
  }, [draft, isEn])

  /* ---------------- 工作区 ---------------- */

  const handleCreateCase = () => {
    const caseName = newCaseName.trim() || suggestedCaseName(language)
    const record = buildBlankCase(METHOD_ID, caseName, STANDARD_ID)
    persistList([record, ...cases], isEn ? `Project created: ${record.name}` : `已新建项目：${record.name}`)
    setDraft(record)
    setActivePointId(null)
    setStage('points')
    setNewCaseName(suggestedCaseName(language))
  }

  const handleOpenCase = (record: RockMassCaseRecord) => {
    setDraft(record)
    setActivePointId(null)
    setStage('points')
  }

  const handleImportFiles = async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (list.length === 0) return
    const imported: RockMassCaseRecord[] = []
    const errors: string[] = []
    for (const file of list) {
      const result = await readCaseFromFile(file, METHOD_ID)
      if ('record' in result) imported.push(result.record)
      else errors.push(isEn ? `${file.name}: The case file is invalid, incompatible, or from a newer version.` : `${file.name}：${result.error}`)
    }
    if (imported.length > 0) {
      persistList(
        [...imported, ...cases],
        isEn ? `${imported.length} ${imported.length === 1 ? 'project' : 'projects'} imported.` : `已导入 ${imported.length} 个项目。`
      )
    }
    if (errors.length > 0) setMessage(errors.join(isEn ? '; ' : '；'))
  }

  const handleDeleteCase = (caseId: string) => {
    const target = cases.find((record) => record.id === caseId)
    if (!target) return
    setDeleteRequest({ kind: 'project', id: caseId, name: target.name })
  }

  /* ---------------- 导出 ---------------- */

  const runExport = async (record: RockMassCaseRecord, format: ClassificationExportFormat) => {
    setExportBusy(true)
    try {
      // docx 体积较大，仅在导出 Word 时才加载
      const result =
        format === 'case'
          ? await exportCaseFile(record)
          : await import('../../utils/rockmassReportDocx').then((module) => module.exportCaseReport(record))
      if (result.ok) setMessage(format === 'case' ? (isEn ? 'Case file exported.' : '案例文件已导出。') : (isEn ? 'Word report exported.' : 'Word 报告已导出。'))
      else if (!result.cancelled) {
        const detail = result.error ?? '未知错误'
        setMessage(isEn ? englishErrorDetail(detail, 'Export failed') : `导出失败：${detail}`)
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      setMessage(isEn ? englishErrorDetail(detail, 'Export failed') : `导出失败：${detail}`)
    } finally {
      setExportBusy(false)
    }
  }

  /* ---------------- 案例内 ---------------- */

  const updateDraft = (patch: Partial<RockMassCaseRecord>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current))
  }

  const updatePoint = (pointId: string, patch: Partial<RockMassPointRecord>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            points: current.points.map((point) =>
              point.id === pointId ? { ...point, ...patch, updatedAt: new Date().toISOString() } : point
            ),
          }
        : current
    )
  }

  const handleSaveCase = (note?: string) => {
    if (!draft) return null
    return persist(draft, note)
  }

  const handleCreatePoint = () => {
    setDraft((current) => {
      if (!current) return current
      const point = buildBlankPoint(METHOD_ID, suggestedPointName(current.points, language), undefined, STANDARD_ID)
      setActivePointId(point.id)
      setStage('calc')
      return { ...current, points: [...current.points, point] }
    })
  }

  const handleDuplicatePoint = (pointId: string) => {
    if (!draft) return
    const source = draft.points.find((point) => point.id === pointId)
    if (!source) return
    const copy = clonePoint(source, `${source.name}${isEn ? ' copy' : ' 副本'}`)
    setDraft({ ...draft, points: [...draft.points, copy] })
    setMessage(isEn ? `Point copied: ${copy.name}` : `已复制点位：${copy.name}`)
  }

  const handleDeletePoint = (pointId: string) => {
    if (!draft) return
    const target = draft.points.find((point) => point.id === pointId)
    if (!target) return
    setDeleteRequest({ kind: 'point', id: pointId, name: target.name })
  }

  const confirmDelete = () => {
    if (!deleteRequest) return
    if (deleteRequest.kind === 'project') {
      persistList(removeCase(casesRef.current, deleteRequest.id), isEn ? `Project deleted: ${deleteRequest.name}` : `已删除项目：${deleteRequest.name}`)
      if (draft?.id === deleteRequest.id) {
        setDraft(null)
        setActivePointId(null)
        setStage('workspace')
      }
    } else if (draft) {
      setDraft({ ...draft, points: draft.points.filter((point) => point.id !== deleteRequest.id) })
      if (activePointId === deleteRequest.id) {
        setActivePointId(null)
        setStage('points')
      }
    }
    setDeleteRequest(null)
  }

  const handleFormChange = useCallback(
    (next: RmrFormState) => {
      if (!activePointId) return
      updatePoint(activePointId, { rmr: next, standardId: STANDARD_ID, migration: undefined })
    },
    [activePointId]
  )

  const handlePointNameChange = useCallback(
    (name: string) => {
      if (!activePointId) return
      updatePoint(activePointId, { name })
    },
    [activePointId]
  )

  const handlePointNoteChange = useCallback(
    (note: string) => {
      if (!activePointId) return
      updatePoint(activePointId, { note })
    },
    [activePointId]
  )

  const handlePointOreTypeChange = useCallback(
    (oreType: string) => {
      if (!activePointId) return
      updatePoint(activePointId, { oreType: normalizeRockMassGroup(oreType), groupId: normalizeRockMassGroup(oreType) })
    },
    [activePointId]
  )

  const leaveCase = (target: 'workspace' | 'home') => {
    if (draft) persist(draft)
    setDraft(null)
    setActivePointId(null)
    setStage('workspace')
    if (target === 'home') onBackToHome()
  }

  const requestLeaveCase = (target: 'workspace' | 'home') => {
    leaveCase(target)
  }

  const completeActivePoint = (note: string) => {
    if (!draft || !activePointId) return null
    const reviewed: RockMassCaseRecord = {
      ...draft,
      standardId: STANDARD_ID,
      points: draft.points.map((point) =>
        point.id === activePointId
          ? { ...point, standardId: STANDARD_ID, inputVersion: 1, migration: undefined }
          : point
      ),
    }
    return persist(reviewed, note)
  }

  /* ---------------- 渲染 ---------------- */

  const dialogs = (
    <>
      <ClassificationExportDialog
        darkMode={darkMode}
        language={language}
        open={exportOpen}
        caseName={draft?.name ?? ''}
        busy={exportBusy}
        onExport={async (formats) => {
          if (!draft) return
          const saved = handleSaveCase() ?? draft
          for (const format of formats) await runExport(saved, format)
          setExportOpen(false)
        }}
        onClose={() => setExportOpen(false)}
      />
      <ConfirmDialog
        darkMode={darkMode}
        language={language}
        open={deleteRequest != null}
        title={deleteRequest?.kind === 'project' ? (isEn ? 'Delete project' : '删除项目') : (isEn ? 'Delete point' : '删除点位')}
        message={deleteRequest?.kind === 'project'
          ? (isEn ? `Delete project “${deleteRequest.name}”?` : `确定删除项目「${deleteRequest.name}」？`)
          : (isEn ? `Delete point “${deleteRequest?.name ?? ''}”?` : `确定删除点位「${deleteRequest?.name ?? ''}」？`)}
        detail={isEn ? 'This action cannot be undone.' : '删除后无法恢复，请确认操作对象无误。'}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRequest(null)}
      />
    </>
  )

  if (stage === 'workspace' || !draft) {
    return (
      <>
        <RmrWorkspacePage
          darkMode={darkMode}
          language={language}
          methodName={methodName}
          cases={visibleCases}
          newCaseName={newCaseName}
          onNewCaseNameChange={setNewCaseName}
          onCreateCase={handleCreateCase}
          onOpenCase={handleOpenCase}
          onDeleteCase={handleDeleteCase}
          onImportFiles={(files) => void handleImportFiles(files)}
          message={message}
          onBack={onBackToHome}
        />
        {dialogs}
      </>
    )
  }

  if (stage === 'calc' && activePoint) {
    const ordinal = draft.points.findIndex((point) => point.id === activePoint.id) + 1
    return (
      <>
        <RmrClassificationPage
          key={activePoint.id}
          darkMode={darkMode}
          language={language}
          caseName={draft.name}
          pointName={activePoint.name}
          pointNote={activePoint.note ?? ''}
          pointOreType={activePoint.oreType ?? ''}
          oreTypeOptions={oreTypeOptions}
          pointOrdinal={ordinal}
          pointTotal={draft.points.length}
          value={activePoint.rmr ?? initialRmrFormState()}
          onChange={handleFormChange}
          onPointNameChange={handlePointNameChange}
          onPointNoteChange={handlePointNoteChange}
          onPointOreTypeChange={handlePointOreTypeChange}
          onBackToWorkspace={() => requestLeaveCase('workspace')}
          onBackToPoints={() => {
            handleSaveCase()
            setStage('points')
          }}
          onComplete={() => {
            completeActivePoint(isEn ? `Point completed: ${activePoint.name}` : `已记录点位：${activePoint.name}`)
            setStage('points')
          }}
          onCompleteAndNext={() => {
            completeActivePoint(isEn ? `Point completed: ${activePoint.name}` : `已记录点位：${activePoint.name}`)
            handleCreatePoint()
          }}
          onEnterMrmr={() => onNavigateToMrmr?.(activePoint.rmr ?? initialRmrFormState(), {
            caseName: draft.name,
            pointName: activePoint.name,
            oreType: activePoint.oreType,
            note: activePoint.note,
          })}
        />
        {dialogs}
      </>
    )
  }

  if (stage === 'summary') {
    return (
      <>
        <RmrCaseSummaryPage
          darkMode={darkMode}
          language={language}
          caseRecord={draft}
          message={message}
          onBackToWorkspace={() => requestLeaveCase('workspace')}
          onBackToPoints={() => {
            handleSaveCase()
            setStage('points')
          }}
          onOpenPoint={(pointId) => {
            setActivePointId(pointId)
            setStage('calc')
          }}
          onOpenExport={() => setExportOpen(true)}
        />
        {dialogs}
      </>
    )
  }

  return (
    <>
      <RmrPointListPanel
        darkMode={darkMode}
        language={language}
        caseRecord={draft}
        message={message}
        onCasePatch={updateDraft}
        onOpenPoint={(pointId) => {
          setActivePointId(pointId)
          setStage('calc')
        }}
        onCreatePoint={handleCreatePoint}
        onDuplicatePoint={handleDuplicatePoint}
        onDeletePoint={handleDeletePoint}
        onGoSummary={() => {
          handleSaveCase()
          setStage('summary')
        }}
        onBackToWorkspace={() => requestLeaveCase('workspace')}
      />
      {dialogs}
    </>
  )
}
