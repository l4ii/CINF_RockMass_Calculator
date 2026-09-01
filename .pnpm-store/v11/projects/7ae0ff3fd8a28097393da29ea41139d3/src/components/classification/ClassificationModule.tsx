import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import type { AnyClassificationAdapter, ClassificationResult, StandardDescriptor, ValidationIssue } from '../../methods/types'
import type { MrmrPrefill } from '../../methods/mrmr'
import type { RockMassCaseRecord, RockMassPointRecord } from '../../types/rockmassCase'
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
  normalizeRockMassGroup,
  rockMassGroups,
} from '../../utils/rockmassCaseStore'
import ConfirmDialog from '../ConfirmDialog'
import ClassificationEditorPage from './ClassificationEditorPage'
import ClassificationExportDialog, { type ClassificationExportFormat } from './ClassificationExportDialog'
import ClassificationPointListPage from './ClassificationPointListPage'
import ClassificationSummaryPage, { type ClassificationSummaryRow } from './ClassificationSummaryPage'
import ClassificationWorkspacePage from './ClassificationWorkspacePage'
import { formatBqPointList, normalizeBqState, validateBqState } from '../../methods/bq'

export interface MethodFormProps {
  form: Record<string, unknown>
  onChange: (form: Record<string, unknown>) => void
  darkMode: boolean
  language: 'zh' | 'en'
}

export interface CustomEditorPageProps {
  darkMode: boolean
  language: 'zh' | 'en'
  caseName: string
  pointName: string
  pointNote: string
  pointOreType: string
  oreTypeOptions?: string[]
  pointOrdinal: number
  pointTotal: number
  form: Record<string, unknown>
  issues: ValidationIssue[]
  result: ClassificationResult | null
  onFormChange: (form: Record<string, unknown>) => void
  onPointNameChange: (value: string) => void
  onPointOreTypeChange: (value: string) => void
  onPointNoteChange: (value: string) => void
  onBackToWorkspace: () => void
  onBackToPoints: () => void
  onComplete: () => void
  onNext: () => void
}

export interface CustomSummaryPageProps {
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

interface ClassificationModuleProps {
  adapter: AnyClassificationAdapter
  FormComponent: ComponentType<MethodFormProps>
  darkMode: boolean
  language: 'zh' | 'en'
  onBackToHome: () => void
  prefill?: MrmrPrefill
  onPrefillConsumed?: () => void
  customEditor?: ComponentType<CustomEditorPageProps>
  customSummary?: ComponentType<CustomSummaryPageProps>
}

type Stage = 'workspace' | 'points' | 'calc' | 'summary'
type DeleteRequest = { kind: 'project' | 'point'; id: string; name: string } | null

function suggestLocalizedCaseName(adapter: AnyClassificationAdapter, language: 'zh' | 'en') {
  return language === 'en'
    ? `${adapter.nameEn} ${formatTimestamp(new Date())}`
    : suggestCaseName(adapter.id)
}

function suggestLocalizedPointName(points: RockMassPointRecord[], language: 'zh' | 'en') {
  if (language === 'zh') return suggestPointName(points)
  let index = points.length + 1
  const taken = new Set(points.map((point) => point.name.trim()))
  while (taken.has(`Point ${index}`)) index += 1
  return `Point ${index}`
}

function englishErrorDetail(detail: string, fallback: string) {
  return /[\u3400-\u9fff]/u.test(detail) ? fallback : `${fallback}: ${detail}`
}

export default function ClassificationModule({
  adapter,
  FormComponent,
  darkMode,
  language,
  onBackToHome,
  prefill,
  onPrefillConsumed,
  customEditor: CustomEditor,
  customSummary: CustomSummary,
}: ClassificationModuleProps) {
  const isEn = language === 'en'
  const [cases, setCases] = useState<RockMassCaseRecord[]>(() => readCaseRecords())
  const casesRef = useRef(cases)
  const [draft, setDraft] = useState<RockMassCaseRecord | null>(null)
  const [stage, setStage] = useState<Stage>('workspace')
  const [activePointId, setActivePointId] = useState<string | null>(null)
  const [newCaseName, setNewCaseName] = useState(() => suggestLocalizedCaseName(adapter, language))
  const [message, setMessage] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportBusy, setExportBusy] = useState(false)
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest>(null)
  const autosaveReady = useRef(false)
  const prefillConsumed = useRef(false)

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
      setMessage(isEn ? englishErrorDetail(write.error, 'Save failed') : `保存失败：${write.error}`)
      return record
    }
    casesRef.current = next
    setCases(next)
    const stored = next.find((item) => item.id === record.id) ?? record
    setDraft((current) => (current?.id === record.id ? stored : current))
    if (note) setMessage(note)
    return stored
  }, [isEn])

  useEffect(() => {
    if (!prefill || adapter.id !== 'mrmr' || prefillConsumed.current) return
    prefillConsumed.current = true
    const seededCase = buildBlankCase(adapter.id, prefill.source.caseName, adapter.standard.id)
    const seededPoint = {
      ...buildBlankPoint(
        adapter.id,
        prefill.source.pointName,
        prefill.form as unknown as Record<string, unknown>,
        adapter.standard.id,
        adapter.inputVersion,
      ),
      oreType: prefill.source.oreType,
      note: prefill.source.note,
    }
    const record = { ...seededCase, points: [seededPoint] }
    const stored = persist(record, isEn ? `MRMR point created from RMR: ${seededPoint.name}` : `已从 RMR 带入 MRMR 点位：${seededPoint.name}`)
    setDraft(stored)
    setActivePointId(seededPoint.id)
    setStage('calc')
    onPrefillConsumed?.()
  }, [adapter, isEn, onPrefillConsumed, persist, prefill])

  useEffect(() => {
    if (!draft) return
    if (!autosaveReady.current) {
      autosaveReady.current = true
      return
    }
    const timer = window.setTimeout(() => persist(draft), 450)
    return () => window.clearTimeout(timer)
  }, [draft, persist])

  const visibleCases = useMemo(
    () => sortCaseRecords(cases.filter((record) => record.methodId === adapter.id)),
    [adapter.id, cases]
  )
  const activePoint = draft?.points.find((point) => point.id === activePointId) ?? null
  const oreTypeOptions = draft ? rockMassGroups(draft.points) : []

  const flushDraft = useCallback(() => (draft ? persist(draft) : null), [draft, persist])

  const createCase = () => {
    const caseName = newCaseName.trim() || suggestLocalizedCaseName(adapter, language)
    const record = buildBlankCase(adapter.id, caseName, adapter.standard.id)
    persist(record, isEn ? `Project created: ${record.name}` : `已新建项目：${record.name}`)
    setDraft(record)
    setActivePointId(null)
    setStage('points')
    setNewCaseName(suggestLocalizedCaseName(adapter, language))
  }

  const importFiles = async (files: FileList | File[]) => {
    const imported: RockMassCaseRecord[] = []
    const errors: string[] = []
    for (const file of Array.from(files)) {
      const read = await readCaseFromFile(file, adapter.id)
      if ('error' in read) {
        errors.push(
          isEn
            ? `${file.name}: The project file is invalid, incompatible, or from a newer version.`
            : `${file.name}：${read.error}`
        )
        continue
      }
      imported.push({
        ...read.record,
        schemaVersion: 2,
        standardId: read.record.standardId ?? adapter.standard.id,
        points: read.record.points.map((point) => ({
          ...point,
          methodId: adapter.id,
          standardId: point.standardId ?? adapter.standard.id,
          inputVersion: point.inputVersion ?? adapter.inputVersion,
          input: adapter.normalize(point.input),
        })),
      })
    }
    if (imported.length > 0) {
      const next = [...imported, ...casesRef.current]
      const write = writeCaseRecords(next)
      if (write.ok) {
        casesRef.current = next
        setCases(next)
        setMessage(
          isEn
            ? `${imported.length} ${imported.length === 1 ? 'project' : 'projects'} imported.`
            : `已导入 ${imported.length} 个项目。`
        )
      } else {
        setMessage(isEn ? englishErrorDetail(write.error, 'Save failed') : `保存失败：${write.error}`)
      }
    }
    if (errors.length > 0) setMessage(errors.join(isEn ? '; ' : '；'))
  }

  const deleteCase = (caseId: string) => {
    const target = casesRef.current.find((record) => record.id === caseId)
    if (!target) return
    setDeleteRequest({ kind: 'project', id: caseId, name: target.name })
  }

  const updateDraft = (patch: Partial<RockMassCaseRecord>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current))
  }

  const updatePoint = (pointId: string, patch: Partial<RockMassPointRecord>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            points: current.points.map((point) =>
              point.id === pointId ? { ...point, ...patch, ...(patch.oreType !== undefined ? { oreType: normalizeRockMassGroup(patch.oreType), groupId: normalizeRockMassGroup(patch.oreType) } : {}), updatedAt: new Date().toISOString() } : point
            ),
          }
        : current
    )
  }

  const createPoint = useCallback(() => {
    setDraft((current) => {
      if (!current) return current
      const point = buildBlankPoint(
        adapter.id,
        suggestLocalizedPointName(current.points, language),
        adapter.createInitialForm(),
        adapter.standard.id,
        adapter.inputVersion
      )
      setActivePointId(point.id)
      setStage('calc')
      return { ...current, points: [...current.points, point] }
    })
  }, [adapter, language])

  const pointResult = useCallback(
    (point: RockMassPointRecord) => {
      const form = adapter.normalize(point.input)
      if (adapter.id === 'bq') {
        const state = normalizeBqState(form)
        const basicIssues = validateBqState({ ...state, mode: 'basic' }).filter((item) => item.severity === 'error')
        if (basicIssues.length > 0) return { value: '—', grade: '—', incomplete: true }
        const entries = formatBqPointList(state, language)
        return {
          value: entries.map((entry) => (entry.value ? `${entry.label} ${entry.value}` : entry.label)).join('；'),
          grade: entries.map((entry) => entry.grade).join('；'),
          incomplete: false,
          entries,
        }
      }
      const issues = adapter.validate(form)
      if (issues.length > 0) return { value: '—', grade: '—', incomplete: true }
      const result = adapter.calculate(form)
      return { value: result.displayValue, grade: isEn ? result.gradeEn : result.grade, incomplete: false }
    },
    [adapter, isEn, language]
  )

  const summaryRows = useMemo<ClassificationSummaryRow[]>(() => {
    if (!draft) return []
    return draft.points.map((point) => {
      const form = adapter.normalize(point.input)
      const issues = adapter.validate(form)
      const result = issues.length === 0 ? adapter.calculate(form) : null
      return {
        point,
        result,
        descriptions: adapter.describe(form, result),
        issueCount: issues.length,
      }
    })
  }, [adapter, draft])

  const exportFormats = async (formats: ClassificationExportFormat[]) => {
    if (!draft) return
    setExportBusy(true)
    const saved = persist(draft)
    const failures: string[] = []
    try {
      for (const format of formats) {
        const result =
          format === 'case'
            ? await exportCaseFile(saved)
            : await import('../../utils/classificationReportDocx').then((module) =>
                module.exportClassificationReport(saved, adapter)
              )
        if (!result.ok && !result.cancelled) {
          const detail = result.error ?? '未知错误'
          failures.push(isEn ? englishErrorDetail(detail, 'Could not save the selected file') : detail)
        }
      }
      setMessage(
        failures.length > 0
          ? isEn
            ? `Export failed: ${failures.join('; ')}`
            : `导出失败：${failures.join('；')}`
          : isEn
            ? 'Selected content exported.'
            : '所选内容已导出。'
      )
      if (failures.length === 0) setExportOpen(false)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      setMessage(isEn ? englishErrorDetail(detail, 'Export failed') : `导出失败：${detail}`)
    } finally {
      setExportBusy(false)
    }
  }

  const dialogs = (
    <>
      <ClassificationExportDialog
        darkMode={darkMode}
        language={language}
        open={exportOpen}
        caseName={draft?.name ?? ''}
        busy={exportBusy}
        onExport={(formats) => void exportFormats(formats)}
        onClose={() => setExportOpen(false)}
      />
      <ConfirmDialog
        darkMode={darkMode}
        language={language}
        open={deleteRequest != null}
        title={deleteRequest?.kind === 'project' ? (isEn ? 'Delete project' : '删除项目') : (isEn ? 'Delete point' : '删除点位')}
        message={deleteRequest?.kind === 'project'
          ? (isEn ? `Delete project “${deleteRequest.name}”?` : `确定删除项目“${deleteRequest.name}”吗？`)
          : (isEn ? `Delete point “${deleteRequest?.name ?? ''}”?` : `确定删除点位“${deleteRequest?.name ?? ''}”吗？`)}
        detail={isEn ? 'This action cannot be undone.' : '删除后无法恢复，请确认操作对象无误。'}
        onConfirm={() => {
          if (!deleteRequest) return
          if (deleteRequest.kind === 'project') {
            const next = removeCase(casesRef.current, deleteRequest.id)
            const write = writeCaseRecords(next)
            if (!write.ok) setMessage(isEn ? englishErrorDetail(write.error, 'Save failed') : `保存失败：${write.error}`)
            else {
              casesRef.current = next
              setCases(next)
              setMessage(isEn ? `Project deleted: ${deleteRequest.name}` : `已删除项目：${deleteRequest.name}`)
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
          methodName={language === 'en' ? adapter.nameEn : adapter.name}
          cases={visibleCases}
          newCaseName={newCaseName}
          onNewCaseNameChange={setNewCaseName}
          onCreateCase={createCase}
          onOpenCase={(record) => { autosaveReady.current = false; setDraft(record); setActivePointId(null); setStage('points') }}
          onDeleteCase={deleteCase}
          onImportFiles={(files) => void importFiles(files)}
          message={message}
          onBack={onBackToHome}
        />
        {dialogs}
      </>
    )
  }

  if (stage === 'calc' && activePoint) {
    const form = adapter.normalize(activePoint.input)
    const issues = adapter.validate(form)
    const result = issues.length === 0 ? adapter.calculate(form) : null
    if (CustomEditor) {
      return (
        <>
          <CustomEditor
            darkMode={darkMode}
            language={language}
            caseName={draft.name}
            pointName={activePoint.name}
            pointOreType={activePoint.oreType ?? ''}
            oreTypeOptions={oreTypeOptions}
            pointNote={activePoint.note ?? ''}
            pointOrdinal={draft.points.findIndex((point) => point.id === activePoint.id) + 1}
            pointTotal={draft.points.length}
            form={form}
            issues={issues}
            result={result}
            onFormChange={(next) => updatePoint(activePoint.id, { input: next, standardId: adapter.standard.id, migration: undefined })}
            onPointNameChange={(name) => updatePoint(activePoint.id, { name })}
            onPointOreTypeChange={(oreType) => updatePoint(activePoint.id, { oreType })}
            onPointNoteChange={(note) => updatePoint(activePoint.id, { note })}
            onBackToWorkspace={() => { flushDraft(); setDraft(null); setActivePointId(null); setStage('workspace') }}
            onBackToPoints={() => { flushDraft(); setActivePointId(null); setStage('points') }}
            onComplete={() => { persist(draft, isEn ? `Point completed: ${activePoint.name}` : `已记录点位：${activePoint.name}`); setActivePointId(null); setStage('points') }}
            onNext={() => { persist(draft, isEn ? `Point completed: ${activePoint.name}` : `已记录点位：${activePoint.name}`); createPoint() }}
          />
          {dialogs}
        </>
      )
    }
    return (
      <>
        <ClassificationEditorPage
          darkMode={darkMode}
          language={language}
          methodName={adapter.name}
          methodNameEn={adapter.nameEn}
          standard={adapter.standard}
          caseName={draft.name}
          pointName={activePoint.name}
          pointOreType={activePoint.oreType ?? ''}
          oreTypeOptions={oreTypeOptions}
          pointNote={activePoint.note ?? ''}
          pointOrdinal={draft.points.findIndex((point) => point.id === activePoint.id) + 1}
          pointTotal={draft.points.length}
          issues={issues}
          result={result}
          renderForm={() => (
            <FormComponent
              form={form}
              onChange={(next) => updatePoint(activePoint.id, { input: next, standardId: adapter.standard.id, migration: undefined })}
              darkMode={darkMode}
              language={language}
            />
          )}
          onPointNameChange={(name) => updatePoint(activePoint.id, { name })}
          onPointOreTypeChange={(oreType) => updatePoint(activePoint.id, { oreType })}
          onPointNoteChange={(note) => updatePoint(activePoint.id, { note })}
          onBackToWorkspace={() => { flushDraft(); setDraft(null); setActivePointId(null); setStage('workspace') }}
          onPrevious={() => { flushDraft(); setActivePointId(null); setStage('points') }}
          onComplete={() => { persist(draft, isEn ? `Point completed: ${activePoint.name}` : `已记录点位：${activePoint.name}`); setActivePointId(null); setStage('points') }}
          onNext={() => { persist(draft, isEn ? `Point completed: ${activePoint.name}` : `已记录点位：${activePoint.name}`); createPoint() }}
          wideResultRatio={adapter.id === 'rqd'}
        />
        {dialogs}
      </>
    )
  }

  if (stage === 'summary') {
    if (CustomSummary) {
      return (
        <>
          <CustomSummary
            darkMode={darkMode}
            language={language}
            methodName={isEn ? adapter.nameEn : adapter.name}
            standard={adapter.standard}
            caseRecord={draft}
            rows={summaryRows}
            message={message}
            onBackToWorkspace={() => { flushDraft(); setDraft(null); setStage('workspace') }}
            onBackToPoints={() => setStage('points')}
            onOpenPoint={(id) => { setActivePointId(id); setStage('calc') }}
            onOpenExport={() => setExportOpen(true)}
          />
          {dialogs}
        </>
      )
    }
    return (
      <>
        <ClassificationSummaryPage
          darkMode={darkMode}
          language={language}
          methodName={isEn ? adapter.nameEn : adapter.name}
          standard={adapter.standard}
          caseRecord={draft}
          rows={summaryRows}
          message={message}
          onBackToWorkspace={() => { flushDraft(); setDraft(null); setStage('workspace') }}
          onBackToPoints={() => setStage('points')}
          onOpenPoint={(id) => { setActivePointId(id); setStage('calc') }}
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
        methodName={isEn ? adapter.nameEn : adapter.name}
        caseRecord={draft}
        message={message}
        getPointResult={pointResult}
        onCasePatch={updateDraft}
        onOpenPoint={(id) => { setActivePointId(id); setStage('calc') }}
        onCreatePoint={createPoint}
        onDuplicatePoint={(id) => {
          const source = draft.points.find((point) => point.id === id)
          if (source) updateDraft({ points: [...draft.points, duplicatePoint(source, `${source.name}${isEn ? ' copy' : ' 副本'}`)] })
        }}
        onDeletePoint={(id) => {
          const source = draft.points.find((point) => point.id === id)
          if (source) setDeleteRequest({ kind: 'point', id, name: source.name })
        }}
        onGoSummary={() => { flushDraft(); setStage('summary') }}
        onBackToWorkspace={() => { flushDraft(); setDraft(null); setActivePointId(null); setStage('workspace') }}
      />
      {dialogs}
    </>
  )
}
