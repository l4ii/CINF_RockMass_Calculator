import ClassificationModule from '../classification/ClassificationModule'
import BqClassificationPage from './BqClassificationPage'
import BqSummaryPage from './BqSummaryPage'
import BqMethodForm from '../classification/forms/BqMethodForm'
import { bqAdapter } from '../../methods/adapters/bqAdapter'

interface BqModuleProps {
  darkMode: boolean
  language: 'zh' | 'en'
  onBackToHome: () => void
}

export default function BqModule({ darkMode, language, onBackToHome }: BqModuleProps) {
  return (
    <ClassificationModule
      adapter={bqAdapter}
      FormComponent={BqMethodForm}
      darkMode={darkMode}
      language={language}
      onBackToHome={onBackToHome}
      customEditor={BqClassificationPage}
      customSummary={BqSummaryPage}
    />
  )
}
