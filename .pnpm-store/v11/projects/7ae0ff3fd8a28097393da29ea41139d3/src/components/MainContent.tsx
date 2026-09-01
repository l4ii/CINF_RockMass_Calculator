import { lazy, Suspense, useEffect } from 'react'
import { getClassificationMethod, type SelectedMethod } from '../types'
import ClassificationModule from './classification/ClassificationModule'
import BqModule from './bq/BqModule'
import RmrModule from './rmr/RmrModule'
import MrmrModule from './mrmr/MrmrModule'
import GsiModule from './gsi/GsiModule'
import QModule from './q/QModule'
import { useAssistantSnapshotOptional } from '../context/AssistantContext'
import { CLASSIFICATION_MODULE_REGISTRY, isGenericClassificationMethod } from '../methods/registry'
import type { MrmrHandoff } from '../methods/mrmr'
import type { RmrFormState } from '../utils/rmrCalc'

const AboutPage = lazy(() => import('./shell/AboutPage'))
const SettingsPage = lazy(() => import('./shell/SettingsPage'))

function ModuleLoadingFallback({ darkMode = false }: { darkMode?: boolean }) {
  return (
    <div className={`flex items-center justify-center p-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-hidden />
      <span className="ml-3 text-sm">加载中…</span>
    </div>
  )
}

interface MainContentProps {
  selectedMethod: SelectedMethod | null
  darkMode?: boolean
  currentView?: 'module' | 'about' | 'settings'
  aboutDepartment?: string | null
  aboutVisit?: number
  language?: 'zh' | 'en'
  darkModeValue?: boolean
  onDarkModeChange?: (dark: boolean) => void
  onLanguageChange?: (lang: 'zh' | 'en') => void
  onBackToHome?: () => void
  onMethodSelect?: (method: SelectedMethod) => void
  mrmrPrefill?: MrmrHandoff
  onMrmrPrefillConsumed?: () => void
  onNavigateToMrmr?: (state: RmrFormState, pointMeta: { caseName: string; pointName: string; oreType?: string; note?: string }) => void
}

export default function MainContent({
  selectedMethod,
  darkMode = false,
  currentView = 'module',
  aboutDepartment = null,
  aboutVisit = 0,
  language = 'zh',
  darkModeValue = false,
  onDarkModeChange,
  onLanguageChange,
  onBackToHome,
  onMethodSelect,
  mrmrPrefill,
  onMrmrPrefillConsumed,
  onNavigateToMrmr,
}: MainContentProps) {
  const { setAssistantSnapshot } = useAssistantSnapshotOptional()

  useEffect(() => {
    setAssistantSnapshot({
      currentView,
      language,
      aboutDepartment: aboutDepartment ?? null,
      selectedMethod: selectedMethod
        ? { id: selectedMethod.id, name: selectedMethod.name, nameEn: selectedMethod.nameEn }
        : null,
    })
  }, [aboutDepartment, currentView, language, selectedMethod, setAssistantSnapshot])

  if (currentView === 'about' && aboutDepartment) {
    return (
      <Suspense fallback={<ModuleLoadingFallback darkMode={darkMode} />}>
        <AboutPage
          key={`${aboutDepartment}:${aboutVisit}`}
          darkMode={darkMode}
          language={language}
          aboutDepartment={aboutDepartment}
          aboutVisit={aboutVisit}
          onBackToHome={onBackToHome}
        />
      </Suspense>
    )
  }

  if (currentView === 'settings') {
    return (
      <Suspense fallback={<ModuleLoadingFallback darkMode={darkMode} />}>
        <SettingsPage
          darkMode={darkMode}
          language={language}
          darkModeValue={darkModeValue}
          onDarkModeChange={onDarkModeChange}
          onLanguageChange={onLanguageChange}
          onBackToHome={onBackToHome}
        />
      </Suspense>
    )
  }

  if (!selectedMethod) {
    return (
      <div className={`flex-1 min-w-0 flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`text-center px-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p className="text-lg font-medium">
            {language === 'en' ? 'Select a classification method from the sidebar' : '请从左侧选择分级方法'}
          </p>
        </div>
      </div>
    )
  }

  if (selectedMethod.id === 'rmr') {
    return (
      <RmrModule
        key="rmr"
        darkMode={darkMode}
        language={language}
        methodName={language === 'en' ? selectedMethod.nameEn : selectedMethod.name}
        onBackToHome={() => onBackToHome?.()}
        onNavigateToMethod={(methodId) => onMethodSelect?.(getClassificationMethod(methodId))}
        onNavigateToMrmr={onNavigateToMrmr}
      />
    )
  }

  if (selectedMethod.id === 'mrmr') {
    return (
      <MrmrModule
        key="mrmr"
        darkMode={darkMode}
        language={language}
        methodName={language === 'en' ? selectedMethod.nameEn : selectedMethod.name}
        onBackToHome={() => onBackToHome?.()}
        handoff={mrmrPrefill}
        onHandoffConsumed={onMrmrPrefillConsumed}
      />
    )
  }

  if (selectedMethod.id === 'bq') {
    return (
      <BqModule
        key="bq"
        darkMode={darkMode}
        language={language}
        onBackToHome={() => onBackToHome?.()}
      />
    )
  }

  if (selectedMethod.id === 'gsi') {
    return (
      <GsiModule
        key="gsi"
        darkMode={darkMode}
        language={language}
        methodName={language === 'en' ? selectedMethod.nameEn : selectedMethod.name}
        onBackToHome={() => onBackToHome?.()}
      />
    )
  }

  if (selectedMethod.id === 'q') {
    return (
      <QModule
        key="q"
        darkMode={darkMode}
        language={language}
        onBackToHome={() => onBackToHome?.()}
      />
    )
  }

  if (isGenericClassificationMethod(selectedMethod.id)) {
    const module = CLASSIFICATION_MODULE_REGISTRY[selectedMethod.id]
    return (
      <ClassificationModule
        key={selectedMethod.id}
        adapter={module.adapter}
        FormComponent={module.FormComponent}
        darkMode={darkMode}
        language={language}
        onBackToHome={() => onBackToHome?.()}
      />
    )
  }

  return null
}
