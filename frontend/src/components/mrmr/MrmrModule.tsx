import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RockMassCaseRecord, RockMassPointRecord } from '../../types/rockmassCase'
import { MRMR_STANDARD, createInitialMrmrState, normalizeMrmrState, type MrmrHandoff } from '../../methods/mrmr'
import { exportCaseFile, readCaseFromFile } from '../../utils/rockmassCaseFile'
import { buildBlankCase, buildBlankPoint, duplicatePoint, readCaseRecords, removeCase, sortCaseRecords, suggestCaseName, suggestPointName, formatTimestamp, upsertCase, writeCaseRecords, rockMassGroups, withRockMassOreType } from '../../utils/rockmassCaseStore'
import ClassificationExportDialog, { type ClassificationExportFormat } from '../classification/ClassificationExportDialog'
import { exportFailureMessage, exportSuccessMessage } from '../classification/exportMessages'
import ClassificationWorkspacePage from '../classification/ClassificationWorkspacePage'
import ClassificationPointListPage from '../classification/ClassificationPointListPage'
import ClassificationSummaryPage, { type ClassificationSummaryRow } from '../classification/ClassificationSummaryPage'
import ConfirmDialog from '../ConfirmDialog'
import MrmrClassificationPage from './MrmrClassificationPage'
import { calculateMrmr, validateMrmrState } from '../../methods/mrmr'

type Stage = 'workspace' | 'points' | 'calc' | 'summary'
type DeleteRequest = { kind: 'project' | 'point'; id: string; name: string } | null

interface MrmrModuleProps {
  darkMode: boolean
  language: 'zh' | 'en'
  methodName: string
  onBackToHome: () => void
  handoff?: MrmrHandoff
  onHandoffConsumed?: () => void
}

function englishErrorDetail(detail: string, fallback: string) { return /[\u3400-\u9fff]/u.test(detail) ? fallback : `${fallback}: ${detail}` }

export default function MrmrModule({ darkMode, language, methodName, onBackToHome, handoff, onHandoffConsumed }: MrmrModuleProps) {
  const en = language === 'en'
  const [cases, setCases] = useState<RockMassCaseRecord[]>(() => readCaseRecords())
  const casesRef = useRef(cases)
  const [draft, setDraft] = useState<RockMassCaseRecord | null>(null)
  const [stage, setStage] = useState<Stage>('workspace')
  const [activePointId, setActivePointId] = useState<string | null>(null)
  const [newCaseName, setNewCaseName] = useState(() => en ? `MRMR Classification ${formatTimestamp(new Date())}` : suggestCaseName('mrmr'))
  const [message, setMessage] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportBusy, setExportBusy] = useState(false)
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest>(null)
  const handoffConsumed = useRef(false)
  useEffect(() => { casesRef.current = cases }, [cases])
  useEffect(() => { if (!message) return; const timer = window.setTimeout(() => setMessage(null), 4500); return () => window.clearTimeout(timer) }, [message])

  const persist = useCallback((record: RockMassCaseRecord, note?: string) => {
    const next = upsertCase(casesRef.current, record)
    const write = writeCaseRecords(next)
    if (!write.ok) { setMessage(en ? englishErrorDetail(write.error, 'Save failed') : `保存失败：${write.error}`); return record }
    casesRef.current = next; setCases(next)
    const stored = next.find((item) => item.id === record.id) ?? record
    setDraft((current) => current?.id === record.id ? stored : current)
    if (note) setMessage(note)
    return stored
  }, [en])

  useEffect(() => {
    if (!handoff || handoffConsumed.current) return
    handoffConsumed.current = true
    const record = buildBlankCase('mrmr', handoff.source.caseName, MRMR_STANDARD.id)
    const point = withRockMassOreType({ ...buildBlankPoint('mrmr', handoff.source.pointName, handoff.form as unknown as Record<string, unknown>, MRMR_STANDARD.id, 3), note: handoff.source.note, oreType: handoff.source.oreType })
    const seeded = { ...record, points: [point] }
    const stored = persist(seeded, en ? `MRMR point created from RMR: ${point.name}` : `已从 RMR 带入 MRMR 点位：${point.name}`)
    setDraft(stored); setActivePointId(point.id); setStage('calc'); onHandoffConsumed?.()
  }, [en, handoff, onHandoffConsumed, persist])

  const visibleCases = useMemo(() => sortCaseRecords(cases.filter((record) => record.methodId === 'mrmr')), [cases])
  const activePoint = draft?.points.find((point) => point.id === activePointId) ?? null
  const oreTypeOptions = draft ? rockMassGroups(draft.points) : []
  const updatePoint = (pointId: string, patch: Partial<RockMassPointRecord>) => setDraft((current) => current ? ({ ...current, points: current.points.map((point) => point.id === pointId ? { ...point, ...withRockMassOreType(patch), updatedAt: new Date().toISOString() } : point) }) : current)
  const createPoint = useCallback(() => setDraft((current) => { if (!current) return current; const point = buildBlankPoint('mrmr', suggestPointName(current.points), createInitialMrmrState() as unknown as Record<string, unknown>, MRMR_STANDARD.id, 3); setActivePointId(point.id); setStage('calc'); return { ...current, points: [...current.points, point] } }), [])
  const createCase = () => { const name = newCaseName.trim() || (en ? `MRMR Classification ${formatTimestamp(new Date())}` : suggestCaseName('mrmr')); const record = buildBlankCase('mrmr', name, MRMR_STANDARD.id); const stored = persist(record, en ? `Project created: ${record.name}` : `已新建项目：${record.name}`); setDraft(stored); setStage('points'); setNewCaseName(en ? `MRMR Classification ${formatTimestamp(new Date())}` : suggestCaseName('mrmr')) }
  const importFiles = async (files: FileList | File[]) => { const imported: RockMassCaseRecord[] = []; const errors: string[] = []; for (const file of Array.from(files)) { const read = await readCaseFromFile(file, 'mrmr'); if ('record' in read) imported.push(read.record); else errors.push(en ? `${file.name}: ${englishErrorDetail(read.error, 'This MRMR project uses an unsupported old calculation version; create a new MRMR project.')}` : `${file.name}：${read.error}`) } if (imported.length > 0) { const next = [...imported, ...casesRef.current]; const write = writeCaseRecords(next); if (write.ok) { casesRef.current = next; setCases(next); setMessage(en ? `${imported.length} project(s) imported.` : `已导入 ${imported.length} 个项目。`) } } if (errors.length > 0) setMessage(errors.join(en ? '; ' : '；')) }
  const updateDraft = (patch: Partial<RockMassCaseRecord>) => setDraft((current) => current ? { ...current, ...patch } : current)
  const pointResult = (point: RockMassPointRecord) => { const form = normalizeMrmrState(point.input); const issues = validateMrmrState(form); if (issues.length) return { value: '—', grade: '—', incomplete: true }; const result = calculateMrmr(form); return { value: result.mrmr.toFixed(1), grade: en ? result.grade.labelEn : result.grade.label, incomplete: false } }
  const summaryRows = useMemo<ClassificationSummaryRow[]>(() => draft ? draft.points.map((point) => { const form = normalizeMrmrState(point.input); const issues = validateMrmrState(form); const result = issues.length ? null : calculateMrmr(form); return { point, result: result ? { value: result.mrmr, displayValue: `MRMR = ${result.mrmr.toFixed(1)}`, grade: result.grade.label, gradeEn: result.grade.labelEn, summary: result.formula, summaryEn: result.formula, metrics: [], warnings: [] } : null, descriptions: [], issueCount: issues.length } }) : [], [draft, en])
  const dialogs = <><ClassificationExportDialog darkMode={darkMode} language={language} open={exportOpen} caseName={draft?.name ?? ''} busy={exportBusy} onExport={async (formats: ClassificationExportFormat[]) => { if (!draft) return; setExportBusy(true); const saved = persist(draft); const failures: string[] = []; const successes: ClassificationExportFormat[] = []; for (const format of formats) { const result = format === 'case' ? await exportCaseFile(saved) : await import('../../utils/classificationReportDocx').then((module) => module.exportClassificationReport(saved, { id: 'mrmr', name: 'MRMR采矿岩体分级', nameEn: 'MRMR Mining Rock Mass Rating', standard: MRMR_STANDARD, inputVersion: 3, createInitialForm: () => createInitialMrmrState() as unknown as Record<string, unknown>, normalize: (raw) => normalizeMrmrState(raw) as unknown as Record<string, unknown>, validate: (form) => validateMrmrState(form), calculate: (form) => { const r = calculateMrmr(form); return { value: r.mrmr, displayValue: `MRMR = ${r.mrmr.toFixed(1)}`, grade: r.grade.label, gradeEn: r.grade.labelEn, summary: r.formula, summaryEn: r.formula, metrics: [], warnings: [] } }, describe: () => [] })); if (result.ok) successes.push(format); else if (!result.cancelled) failures.push(result.error ?? '') } if (failures.length > 0) setMessage(exportFailureMessage(language, failures)); else if (successes.length > 0) { setMessage(exportSuccessMessage(language, successes)); setExportOpen(false) } setExportBusy(false) }} onClose={() => setExportOpen(false)} /><ConfirmDialog darkMode={darkMode} language={language} open={deleteRequest != null} title={deleteRequest?.kind === 'project' ? (en ? 'Delete project' : '删除项目') : (en ? 'Delete point' : '删除点位')} message={deleteRequest ? (en ? `Delete ${deleteRequest.kind} “${deleteRequest.name}”?` : `确定删除${deleteRequest.kind === 'project' ? '项目' : '点位'}「${deleteRequest.name}」？`) : ''} detail={en ? 'This action cannot be undone.' : '删除后无法恢复，请确认操作对象无误。'} onConfirm={() => { if (!deleteRequest) return; if (deleteRequest.kind === 'project') { const next = removeCase(casesRef.current, deleteRequest.id); writeCaseRecords(next); casesRef.current = next; setCases(next); if (draft?.id === deleteRequest.id) { setDraft(null); setStage('workspace') } } else if (draft) updateDraft({ points: draft.points.filter((point) => point.id !== deleteRequest.id) }); setDeleteRequest(null) }} onCancel={() => setDeleteRequest(null)} /></>

  if (stage === 'workspace' || !draft) return <>{<ClassificationWorkspacePage darkMode={darkMode} language={language} methodName={methodName} cases={visibleCases} newCaseName={newCaseName} onNewCaseNameChange={setNewCaseName} onCreateCase={createCase} onOpenCase={(record) => { setDraft(record); setStage('points') }} onDeleteCase={(id) => { const target = casesRef.current.find((record) => record.id === id); if (target) setDeleteRequest({ kind: 'project', id, name: target.name }) }} onImportFiles={(files) => void importFiles(files)} message={message} onBack={onBackToHome} />}{dialogs}</>
  if (stage === 'calc' && activePoint) return <><MrmrClassificationPage key={activePoint.id} darkMode={darkMode} language={language} caseName={draft.name} pointName={activePoint.name} pointNote={activePoint.note ?? ''} pointOreType={activePoint.oreType ?? ''} oreTypeOptions={oreTypeOptions} pointOrdinal={draft.points.findIndex((point) => point.id === activePoint.id) + 1} pointTotal={draft.points.length} value={normalizeMrmrState(activePoint.input)} onChange={(next) => updatePoint(activePoint.id, { input: next as unknown as Record<string, unknown>, standardId: MRMR_STANDARD.id, inputVersion: 3, migration: undefined })} onPointNameChange={(name) => updatePoint(activePoint.id, { name })} onPointNoteChange={(note) => updatePoint(activePoint.id, { note })} onPointOreTypeChange={(oreType) => updatePoint(activePoint.id, { oreType })} onBackToWorkspace={() => { persist(draft); setDraft(null); setStage('workspace') }} onBackToPoints={() => { persist(draft); setStage('points') }} onComplete={() => { persist(draft, en ? `Point completed: ${activePoint.name}` : `已记录点位：${activePoint.name}`); setActivePointId(null); setStage('points') }} onCompleteAndNext={() => { persist(draft); createPoint() }} />{dialogs}</>
  if (stage === 'summary') return <><ClassificationSummaryPage darkMode={darkMode} language={language} methodName={methodName} standard={MRMR_STANDARD} caseRecord={draft} rows={summaryRows} message={message} onBackToWorkspace={() => { persist(draft); setDraft(null); setStage('workspace') }} onBackToPoints={() => setStage('points')} onOpenPoint={(id) => { setActivePointId(id); setStage('calc') }} onOpenExport={() => setExportOpen(true)} />{dialogs}</>
  return <><ClassificationPointListPage darkMode={darkMode} language={language} methodName={methodName} caseRecord={draft} message={message} getPointResult={pointResult} onCasePatch={updateDraft} onOpenPoint={(id) => { setActivePointId(id); setStage('calc') }} onCreatePoint={createPoint} onDuplicatePoint={(id) => { const source = draft.points.find((point) => point.id === id); if (source) updateDraft({ points: [...draft.points, duplicatePoint(source, `${source.name}${en ? ' copy' : ' 副本'}`)] }) }} onDeletePoint={(id) => { const source = draft.points.find((point) => point.id === id); if (source) setDeleteRequest({ kind: 'point', id, name: source.name }) }} onGoSummary={() => setStage('summary')} onBackToWorkspace={() => { persist(draft); setDraft(null); setStage('workspace') }} />{dialogs}</>
}
