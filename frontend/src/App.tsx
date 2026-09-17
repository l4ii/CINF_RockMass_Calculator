import { useState, useEffect, useRef } from 'react'
import { Menu, X } from 'lucide-react'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import LicenseActivation from './components/LicenseActivation'
import AssistantPanel from './components/AssistantPanel'
import ElectronAppTitleBar from './components/shell/ElectronAppTitleBar'
import ErrorBoundary from './components/ErrorBoundary'
import { AssistantProvider } from './context/AssistantContext'
import { getClassificationMethod, type SelectedMethod } from './types'
import { buildMrmrHandoffFromRmr, type MrmrHandoff } from './methods/mrmr'
import type { RmrFormState } from './utils/rmrCalc'
import { getElectronApi } from './utils/electronApi'
import {
  APP_NAME_EN,
  APP_NAME_ZH,
  APP_ORG_NAME_EN,
  APP_ORG_NAME_ZH,
  APP_TAGLINE_MAIN_EN,
  APP_TAGLINE_ZH,
} from './constants/appCopy'

const BOOT_LOGO_SRC = './icon.png'
const RESEARCH_PLATFORM_THUMB_URLS = [
  './about/rdc/info1-thumb.jpg',
  './about/rdc/info2-thumb.jpg',
  './about/rdc/info3-thumb.jpg',
  './about/rdc/info4-thumb.jpg',
  './about/rdc/info5-thumb.jpg',
] as const
const RESEARCH_PLATFORM_FULL_URLS = [
  './about/rdc/info1.jpg',
  './about/rdc/info2.jpg',
  './about/rdc/info3.jpg',
  './about/rdc/info4.jpg',
  './about/rdc/info5.jpg',
] as const

function LicenseCheckingSplash({ language }: { language: 'zh' | 'en' }) {
  const [logoOk, setLogoOk] = useState(true)
  const appName = language === 'en' ? APP_NAME_EN : APP_NAME_ZH
  const tagline = language === 'en' ? APP_TAGLINE_MAIN_EN : APP_TAGLINE_ZH
  const org = language === 'en' ? APP_ORG_NAME_EN : APP_ORG_NAME_ZH
  const lines =
    language === 'en'
      ? ['Verifying offline license…', 'Starting local assistant service…']
      : ['正在校验离线许可…', '正在启动本地助手服务…']

  return (
    <div className="relative isolate flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(59,130,246,0.12),transparent)] px-4">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(248,250,252,0.92))]" />
      <div className="relative z-10 flex w-full max-w-xl flex-col items-center rounded-2xl border border-slate-200/80 bg-white/85 p-6 text-center shadow-2xl backdrop-blur">
        <div className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
          {logoOk ? (
            <img
              src={BOOT_LOGO_SRC}
              alt=""
              className="h-[92%] w-[92%] object-contain scale-110"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <span className="text-lg font-black text-slate-800">CINF</span>
          )}
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{appName}</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600">{tagline}</p>
        <div className="mt-5 flex w-full items-center justify-between border-t border-slate-200 pt-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-hidden />
            <div className="space-y-1 text-xs text-slate-500">
              {lines.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-400">{org}</p>
        </div>
      </div>
    </div>
  )
}

function initialLicenseGate(): 'unknown' | 'ok' | 'blocked' {
  const api = getElectronApi()
  if (!api?.license) return 'ok'
  return 'unknown'
}

function App() {
  const [selectedMethod, setSelectedMethod] = useState<SelectedMethod | null>(null)
  const [mrmrPrefill, setMrmrPrefill] = useState<MrmrHandoff | null>(null)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('darkMode') === 'true'
  })
  const [language, setLanguage] = useState<'zh' | 'en'>(() => {
    if (typeof window === 'undefined') return 'zh'
    const s = localStorage.getItem('language')
    return s === 'en' || s === 'zh' ? s : 'zh'
  })
  const [currentView, setCurrentView] = useState<'module' | 'about' | 'settings'>('module')
  const [aboutDepartment, setAboutDepartment] = useState<string | null>(null)
  const [aboutVisit, setAboutVisit] = useState(0)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [licenseGate, setLicenseGate] = useState<'unknown' | 'ok' | 'blocked'>(initialLicenseGate)
  const appReadySent = useRef(false)

  useEffect(() => {
    const lic = getElectronApi()?.license
    if (!lic) return
    const apply = (s: { ok: boolean }) => setLicenseGate(s.ok ? 'ok' : 'blocked')
    const load = async () => {
      if (lic.getCachedStatus) {
        const cached = await lic.getCachedStatus()
        if (cached) {
          apply(cached)
          return
        }
      }
      apply(await lic.getStatus())
    }
    void load()
  }, [])

  useEffect(() => {
    if (licenseGate === 'unknown') return
    if (appReadySent.current) return
    appReadySent.current = true
    getElectronApi()?.appReady?.()
  }, [licenseGate])

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString())
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  useEffect(() => {
    const warm = (urls: readonly string[]) => {
      urls.forEach((src) => {
        const img = new Image()
        img.src = src
      })
    }
    warm(RESEARCH_PLATFORM_THUMB_URLS)
    const runFull = () => warm(RESEARCH_PLATFORM_FULL_URLS)
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(runFull, { timeout: 4000 })
    } else {
      setTimeout(runFull, 1200)
    }
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const handleMethodSelect = (method: SelectedMethod) => {
    setMrmrPrefill(null)
    setSelectedMethod(method)
    setCurrentView('module')
    setAboutDepartment(null)
    setMobileNavOpen(false)
  }

  const handleEnterMrmr = (state: RmrFormState, pointMeta: { caseName: string; pointName: string; oreType?: string; note?: string }) => {
    setMrmrPrefill(buildMrmrHandoffFromRmr(state, pointMeta))
    setSelectedMethod(getClassificationMethod('mrmr'))
    setCurrentView('module')
    setAboutDepartment(null)
    setMobileNavOpen(false)
  }

  const handleShowAbout = (department: string) => {
    setAboutVisit((visit) => visit + 1)
    setAboutDepartment(department)
    setCurrentView('about')
    setSelectedMethod(null)
    setMobileNavOpen(false)
  }

  const handleShowSettings = () => {
    setCurrentView('settings')
    setSelectedMethod(null)
    setAboutDepartment(null)
    setMobileNavOpen(false)
  }

  const handleBackToHome = () => {
    setMrmrPrefill(null)
    setSelectedMethod(null)
    setCurrentView('module')
    setAboutDepartment(null)
  }

  if (licenseGate === 'blocked') {
    return <LicenseActivation language={language} onActivated={() => setLicenseGate('ok')} />
  }

  if (licenseGate === 'unknown') {
    return <LicenseCheckingSplash language={language} />
  }

  const sidebar = (
    <Sidebar
      selectedMethod={selectedMethod}
      onMethodSelect={handleMethodSelect}
      darkMode={darkMode}
      language={language}
      onShowAbout={handleShowAbout}
      onShowSettings={handleShowSettings}
      currentView={currentView}
      aboutDepartment={aboutDepartment}
    />
  )

  const mobileTitle =
    currentView === 'settings'
      ? language === 'en' ? 'Settings' : '设置'
      : currentView === 'about'
        ? language === 'en' ? 'About' : '了解我们'
        : selectedMethod
          ? language === 'en' ? selectedMethod.nameEn : selectedMethod.name
          : language === 'en' ? 'Rock mass classification methods' : '岩体分级方法'

  return (
    <AssistantProvider pageKey={`${currentView}:${selectedMethod?.id ?? 'home'}:${aboutDepartment ?? ''}`}>
      <div className={`relative flex h-screen flex-col overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <ElectronAppTitleBar darkMode={darkMode} language={language} />
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <div className="hidden h-full md:block">{sidebar}</div>
          {mobileNavOpen ? (
            <div className="absolute inset-0 z-40 flex md:hidden">
              <button
                type="button"
                aria-label={language === 'en' ? 'Close navigation' : '关闭导航'}
                onClick={() => setMobileNavOpen(false)}
                className="absolute inset-0 bg-black/45"
              />
              <div className="relative h-full shadow-2xl">
                {sidebar}
                <button
                  type="button"
                  aria-label={language === 'en' ? 'Close navigation' : '关闭导航'}
                  title={language === 'en' ? 'Close navigation' : '关闭导航'}
                  onClick={() => setMobileNavOpen(false)}
                  className="absolute left-[278px] top-3 grid h-10 w-10 place-items-center rounded-lg bg-gray-950/80 text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>
          ) : null}
          <div className="flex-[4] min-w-0 min-h-0 flex flex-col overflow-hidden">
            <div className={`flex h-12 shrink-0 items-center gap-2 border-b py-1 pl-2 pr-12 md:hidden ${darkMode ? 'border-gray-700 bg-gray-900 text-gray-100' : 'border-gray-200 bg-white text-gray-900'}`}>
              <button
                type="button"
                aria-label={language === 'en' ? 'Open navigation' : '打开导航'}
                title={language === 'en' ? 'Open navigation' : '打开导航'}
                onClick={() => setMobileNavOpen(true)}
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <Menu className="h-5 w-5" aria-hidden />
              </button>
              <span className="min-w-0 truncate text-sm font-semibold">{mobileTitle}</span>
            </div>
            <ErrorBoundary key={`${currentView}:${selectedMethod?.id ?? 'home'}`}>
            <MainContent
              selectedMethod={selectedMethod}
              darkMode={darkMode}
              currentView={currentView}
              aboutDepartment={aboutDepartment}
              aboutVisit={aboutVisit}
              language={language}
              darkModeValue={darkMode}
              onDarkModeChange={setDarkMode}
              onLanguageChange={setLanguage}
              onBackToHome={handleBackToHome}
              onMethodSelect={handleMethodSelect}
              mrmrPrefill={mrmrPrefill ?? undefined}
              onMrmrPrefillConsumed={() => setMrmrPrefill(null)}
              onNavigateToMrmr={handleEnterMrmr}
            />
            </ErrorBoundary>
          </div>
          <AssistantPanel darkMode={darkMode} language={language} onMethodSelect={handleMethodSelect} />
        </div>
      </div>
    </AssistantProvider>
  )
}

export default App
