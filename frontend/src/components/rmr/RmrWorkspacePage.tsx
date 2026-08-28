import type { RockMassCaseRecord } from '../../types/rockmassCase'
import ClassificationWorkspacePage from '../classification/ClassificationWorkspacePage'

interface RmrWorkspacePageProps {
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
}

export default function RmrWorkspacePage(props: RmrWorkspacePageProps) {
  return <ClassificationWorkspacePage {...props} terminology="project" />
}
