import ClassificationModule from '../classification/ClassificationModule'
import QClassificationPage from './QClassificationPage'
import QMethodForm from '../classification/forms/QMethodForm'
import { qAdapter } from '../../methods/adapters/qAdapter'

interface QModuleProps {
  darkMode: boolean
  language: 'zh' | 'en'
  onBackToHome: () => void
}

export default function QModule({ darkMode, language, onBackToHome }: QModuleProps) {
  return (
    <ClassificationModule
      adapter={qAdapter}
      FormComponent={QMethodForm}
      darkMode={darkMode}
      language={language}
      onBackToHome={onBackToHome}
      customEditor={QClassificationPage}
    />
  )
}
