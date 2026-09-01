import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RockMassCaseRecord, RockMassPointRecord } from '../../types/rockmassCase'
import {
  GSI_INPUT_VERSION,
  GSI_STANDARD,
  calculateGsi,
  createInitialGsiState,
  describeGsi,
  normalizeGsiState,
  validateGsiState,
} from '../../methods/gsi'
import { gsiAdapter } from '../../methods/adapters/gsiAdapter'
import { exportCaseFile, readCaseFromFile } from '../../utils/rockmassCaseFile'
import {
  buildBlankCase,
  buildBlankPoint,
  duplicatePoint,
  readCaseRecords,
  removeCase,
  sortCaseRecords,
  suggestCaseName,
  suggestPointName,
  formatTimestamp,
  upsertCase,
  writeCaseRecords,
} from '../../utils/rockmassCaseStore'
import ClassificationExportDialog, { type ClassificationExportFormat } from '../classification/ClassificationExportDialog'
import ClassificationWorkspacePage from '../classification/ClassificationWorkspacePage'
import ClassificationPointListPage from '../classification/ClassificationPointListPage'
import ClassificationSummaryPage, { type ClassificationSummaryRow } from '../classification/ClassificationSummaryPage'
import ConfirmDialog from '../ConfirmDialog'
import GsiClassificationPage from './GsiClassificationPage'

const METHOD_ID = 'gsi' as const

type Stage = 'workspace' | 'points' | 'calc' | 'summary'
type DeleteRequest = { kind: 'project' | 'point'; id: string; name: string } | null

interface GsiModuleProps {
  darkMode: boolean
  language: 'zh' | 'en'
  methodName: string
  onBackToHome: () => void
}

function englishErrorDetail(detail: string, fallback: string) {
  return /[\u3400-\u9fff]/u.test(detail) ? fallback : `${fallback}: ${detail}`
}

export default function GsiModule({ darkMode, language, methodName, onBackToHome }: GsiModuleProps) {
  const en = language === 'en'
  const [cases, setCases] = useState<RockMassCaseRecord[]>(() => readCaseRecords())
  const casesRef = useRef(cases)
  const [draft, setDraft] = useState<RockMassCaseRecord | null>(null)
  const [stage, setStage] = useState<Stage>('workspace')
  const [activePointId, setActivePointId] = useState<string | null>(null)
  const [newCaseName, setNewCaseName] = useState(() => (en ? `GSI Classification ${formatTimestamp(new Date())}` : suggestCaseName(METHOD_ID)))
  const [message, setMessage] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportBusy, setExportBusy] = useState(false)
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest>(null)

  useEffect(() => {
    casesRef.current = cases
  }, [cases])

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(null), 4500)
    return () => window.clearTimeout(timer)
  }, [message])

  const persist = useCallback((record: RockMassCaseRecord, note?: string) => {
    const next = upsertCase(casesRef.current, record)
    const write = writeCaseRecords(next)
    if (!write.ok) {
      setMessage(en ? englishErrorDetail(write.error, 'Save failed') : `保存失败：${write.error}`)
      return record
    }
    casesRef.current = next
    setCases(next)
    const stored = next.find((item) => item.id === record.id) ?? record
    setDraft((current) => (current?.id === record.id ? stored : current))
    if (note) setMessage(note)
    return stored
  }, [en])

  const visibleCases = useMemo(() => sortCaseRecords(cases.filter((record) => record.methodId === METHOD_ID)), [cases])
  const activePoint = draft?.points.find((point) => point.id === activePointId) ?? null
  const updatePoint = (pointId: string, patch: Partial<RockMassPointRecord>) =>
    setDraft((current) =>
      current
        ? {
            ...current,
            points: current.points.map((point) => (point.id === pointId ? { ...point, ...patch, updatedAt: new Date().toISOString() } : point)),
          }
        : current
    )

  const createPoint = useCallback(() => {
    setDraft((current) => {
      if (!current) return current
      const point = buildBlankPoint(
        METHOD_ID,
        suggestPointName(current.points),
        createInitialGsiState() as unknown as Record<string, unknown>,
        GSI_STANDARD.id,
        GSI_INPUT_VERSION
      )
      setActivePointId(point.id)
      setStage('calc')
      return { ...current, points: [...current.points, point] }
    })
  }, [])

  const createCase = () => {
    const name = newCaseName.trim() || (en ? `GSI Classification ${formatTimestamp(new Date())}` : suggestCaseName(METHOD_ID))
    const record = buildBlankCase(METHOD_ID, name, GSI_STANDARD.id)
    const stored = persist(record, en ? `Project created: ${record.name}` : `已新建项目：${record.name}`)
    setDraft(stored)
    setStage('points')
    setNewCaseName(en ? `GSI Classification ${formatTimestamp(new Date())}` : suggestCaseName(METHOD_ID))
  }

  const importFiles = async (files: FileList | File[]) => {
    const imported: RockMassCaseRecord[] = []
    const errors: string[] = []
    for (const file of Array.from(files)) {
      const read = await readCaseFromFile(file, METHOD_ID)
      if ('record' in read) imported.push(read.record)
      else errors.push(en ? `${file.name}: ${englishErrorDetail(read.error, 'Unsupported GSI project file.')}` : `${file.name}：${read.error}`)
    }
    if (imported.length > 0) {
      const next = [...imported, ...casesRef.current]
      const write = writeCaseRecords(next)
      if (write.ok) {
        casesRef.current = next
        setCases(next)
        setMessage(en ? `${imported.length} project(s) imported.` : `已导入 ${imported.length} 个项目。`)
      }
    }
    if (errors.length > 0) setMessage(errors.join(en ? '; ' : '；'))
  }

  const updateDraft = (patch: Partial<RockMassCaseRecord>) => setDraft((current) => (current ? { ...current, ...patch } : current))

  const pointResult = (point: RockMassPointRecord) => {
    const form = normalizeGsiState(point.input)
    const issues = validateGsiState(form)
    if (issues.length) return { value: '—', grade: '—', incomplete: true }
    const result = calculateGsi(form)
    return { value: result.gsi.toFixed(1), grade: en ? result.grade.labelEn : result.grade.label, incomplete: false }
  }

  const summaryRows = useMemo<ClassificationSummaryRow[]>(
    () =>
      draft
        ? draft.points.map((point) => {
            const form = normalizeGsiState(point.input)
            const issues = validateGsiState(form)
            const result = issues.length ? null : gsiAdapter.calculate(form as unknown as Record<string, unknown>)
            return { point, result, descriptions: describeGsi(form), issueCount: issues.length }
          })
        : [],
    [draft]
  )

  const dialogs = (
    <>
      <ClassificationExportDialog
        darkMode={darkMode}
        language={language}
        open={exportOpen}
        caseName={draft?.name ?? ''}
        busy={exportBusy}
        onExport={async (formats: ClassificationExportFormat[]) => {
          if (!draft) return
          setExportBusy(true)
          const saved = persist(draft)
          for (const format of formats) {
            const result =
              format === 'case'
                ? await exportCaseFile(saved)
                : await import('../../utils/classificationReportDocx').then((module) => module.exportClassificationReport(saved, gsiAdapter))
            if (!result.ok && !result.cancelled) setMessage(en ? 'Export failed.' : `导出失败：${result.error ?? ''}`)
          }
          setExportBusy(false)
          setExportOpen(false)
        }}
        onClose={() => setExportOpen(false)}
      />
      <ConfirmDialog
        darkMode={darkMode}
        language={language}
        open={deleteRequest != null}
        title={deleteRequest?.kind === 'project' ? (en ? 'Delete project' : '删除项目') : (en ? 'Delete point' : '删除点位')}
        message={deleteRequest ? (en ? `Delete ${deleteRequest.kind} “${deleteRequest.name}”?` : `确定删除${deleteRequest.kind === 'project' ? '项目' : '点位'}「${deleteRequest.name}」？`) : ''}
        detail={en ? 'This action cannot be undone.' : '删除后无法恢复，请确认操作对象无误。'}
        onConfirm={() => {
          if (!deleteRequest) return
          if (deleteRequest.kind === 'project') {
            const next = removeCase(casesRef.current, deleteRequest.id)
            writeCaseRecords(next)
            casesRef.current = next
            setCases(next)
            if (draft?.id === deleteRequest.id) {
              setDraft(null)
              setStage('workspace')
            }
          } else if (draft) {
            updateDraft({ points: draft.points.filter((point) => point.id !== deleteRequest.id) })
          }
          setDeleteRequest(null)
        }}
        onCancel={() => setDeleteRequest(null)}
      />
    </>
  )

  if (stage === 'workspace' || !draft) {
    return (
      <>
        <ClassificationWorkspacePage
          darkMode={darkMode}
          language={language}
          methodName={methodName}
          cases={visibleCases}
          newCaseName={newCaseName}
          onNewCaseNameChange={setNewCaseName}
          onCreateCase={createCase}
          onOpenCase={(record) => {
            setDraft(record)
            setStage('points')
          }}
          onDeleteCase={(id) => {
            const target = casesRef.current.find((record) => record.id === id)
            if (target) setDeleteRequest({ kind: 'project', id, name: target.name })
          }}
          onImportFiles={(files) => void importFiles(files)}
          message={message}
          onBack={onBackToHome}
        />
        {dialogs}
      </>
    )
  }

  if (stage === 'calc' && activePoint) {
    return (
      <>
        <GsiClassificationPage
          key={activePoint.id}
          darkMode={darkMode}
          language={language}
          caseName={draft.name}
          pointName={activePoint.name}
          pointNote={activePoint.note ?? ''}
          pointOreType={activePoint.oreType ?? ''}
          pointOrdinal={draft.points.findIndex((point) => point.id === activePoint.id) + 1}
          pointTotal={draft.points.length}
          value={normalizeGsiState(activePoint.input)}
          onChange={(next) =>
            updatePoint(activePoint.id, {
              input: next as unknown as Record<string, unknown>,
              standardId: GSI_STANDARD.id,
              inputVersion: GSI_INPUT_VERSION,
              migration: undefined,
            })
          }
          onPointNameChange={(name) => updatePoint(activePoint.id, { name })}
          onPointNoteChange={(note) => updatePoint(activePoint.id, { note })}
          onPointOreTypeChange={(oreType) => updatePoint(activePoint.id, { oreType })}
          onBackToWorkspace={() => {
            persist(draft)
            setDraft(null)
            setStage('workspace')
          }}
          onBackToPoints={() => {
            persist(draft)
            setStage('points')
          }}
          onComplete={() => {
            persist(draft, en ? `Point completed: ${activePoint.name}` : `已记录点位：${activePoint.name}`)
            setActivePointId(null)
            setStage('points')
          }}
          onCompleteAndNext={() => {
            persist(draft)
            createPoint()
          }}
        />
        {dialogs}
      </>
    )
  }

  if (stage === 'summary') {
    return (
      <>
        <ClassificationSummaryPage
          darkMode={darkMode}
          language={language}
          methodName={methodName}
          standard={GSI_STANDARD}
          caseRecord={draft}
          rows={summaryRows}
          message={message}
          onBackToWorkspace={() => {
            persist(draft)
            setDraft(null)
            setStage('workspace')
          }}
          onBackToPoints={() => setStage('points')}
          onOpenPoint={(id) => {
            setActivePointId(id)
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
      <ClassificationPointListPage
        darkMode={darkMode}
        language={language}
        methodName={methodName}
        caseRecord={draft}
        message={message}
        getPointResult={pointResult}
        onCasePatch={updateDraft}
        onOpenPoint={(id) => {
          setActivePointId(id)
          setStage('calc')
        }}
        onCreatePoint={createPoint}
        onDuplicatePoint={(id) => {
          const source = draft.points.find((point) => point.id === id)
          if (source) updateDraft({ points: [...draft.points, duplicatePoint(source, `${source.name}${en ? ' copy' : ' 副本'}`)] })
        }}
        onDeletePoint={(id) => {
          const source = draft.points.find((point) => point.id === id)
          if (source) setDeleteRequest({ kind: 'point', id, name: source.name })
        }}
        onGoSummary={() => setStage('summary')}
        onBackToWorkspace={() => {
          persist(draft)
          setDraft(null)
          setStage('workspace')
        }}
      />
      {dialogs}
    </>
  )
}
