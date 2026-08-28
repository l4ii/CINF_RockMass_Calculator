import { useState, useEffect, useMemo } from 'react'
import {
  appTitleForLang,
  APP_NAME_ZH,
  APP_ORG_NAME_EN,
  APP_ORG_NAME_ZH,
  APP_SHORT_NAME_EN,
  SETTINGS_ASSISTANT_STATUS_UI,
  SETTINGS_LEGAL,
  SETTINGS_OFFLINE_LICENSE_UI,
  SETTINGS_PACKAGE_INFO,
} from '../../constants/appCopy'
import { API_BASE_URL } from '../../config/api'
import { formatUpdateError } from '../../utils/formatUpdateError'
import { getElectronApi } from '../../utils/electronApi'
import type { UpdateInfo } from '../../types/electronApi'
import BackIconButton from '../BackIconButton'
import SettingsAppearanceSection from './settings/SettingsAppearanceSection'
import SettingsUpdateSection from './settings/SettingsUpdateSection'
import {
  readStoredUiScale,
  resetUiScale,
  setUiScale,
  type UiScalePreset,
} from '../../utils/uiScale'

export interface SettingsPageProps {
  darkMode: boolean
  language: 'zh' | 'en'
  darkModeValue: boolean
  onDarkModeChange?: (dark: boolean) => void
  onLanguageChange?: (lang: 'zh' | 'en') => void
  onBackToHome?: () => void
}

export default function SettingsPage({
  darkMode,
  language,
  darkModeValue,
  onDarkModeChange,
  onLanguageChange,
  onBackToHome,
}: SettingsPageProps) {
  const appTitle = appTitleForLang(language)
  const [currentVersion, setCurrentVersion] = useState<string>('')
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'>('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [updateProgress, setUpdateProgress] = useState<number>(0)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [licenseInfo, setLicenseInfo] = useState<{
    ok: boolean
    machineId: string
    expiresAtMs: number | null
  } | null>(null)
  const [licenseInput, setLicenseInput] = useState('')
  const [licenseBusy, setLicenseBusy] = useState(false)
  const [licenseMsg, setLicenseMsg] = useState<string | null>(null)
  const [licenseCopyOk, setLicenseCopyOk] = useState(false)
  const [uiScalePercent, setUiScalePercent] = useState<UiScalePreset>(() => readStoredUiScale() as UiScalePreset)
  const [deployInfo, setDeployInfo] = useState<{
    assistantLocalDeploy?: boolean
    version?: string
    packaged?: boolean
  } | null>(null)
  const [assistantStatus, setAssistantStatus] = useState<Record<string, unknown> | 'loading' | null>('loading')

  const leg = SETTINGS_LEGAL[language]
  const licUi = SETTINGS_OFFLINE_LICENSE_UI[language]
  const electronApi = getElectronApi()
  const hasElectronLicense = !!electronApi?.license

  const pkgInfo = SETTINGS_PACKAGE_INFO[language]
  const astUi = SETTINGS_ASSISTANT_STATUS_UI[language]

  const feedbackMail = useMemo(() => {
    const subZh = `【${APP_NAME_ZH}】软件建议与反馈`
    const subEn = `[${APP_SHORT_NAME_EN}] Feedback`
    const bodyZh = `软件名称：${APP_NAME_ZH}\n\n建议/反馈类型：□ 功能建议  □ 问题反馈  □ 其他\n\n内容说明：\n\n\n\n`
    const bodyEn = `Application: ${APP_SHORT_NAME_EN}\n\nType: feature / bug / other\n\nDetails:\n\n`
    if (language === 'en') {
      return `mailto:xuqianglai@outlook.com?subject=${encodeURIComponent(subEn)}&body=${encodeURIComponent(bodyEn)}`
    }
    return `mailto:xuqianglai@outlook.com?subject=${encodeURIComponent(subZh)}&body=${encodeURIComponent(bodyZh)}`
  }, [language])

  useEffect(() => {
    const api = getElectronApi()?.update
    if (api) {
      api
        .getAppVersion()
        .then(setCurrentVersion)
        .catch(() => setCurrentVersion('1.0.0'))
    } else {
      setCurrentVersion('1.0.0')
    }
  }, [])

  useEffect(() => {
    const api = getElectronApi()?.license
    if (!api) return
    void api.getStatus().then((s) => {
      setLicenseInfo({
        ok: !!s.ok,
        machineId: s.machineId || '',
        expiresAtMs: s.expiresAtMs != null ? s.expiresAtMs : null,
      })
    })
  }, [])

  useEffect(() => {
    const api = getElectronApi()?.update
    if (!api) return
    api.onUpdateChecking(() => {
      setUpdateStatus('checking')
      setUpdateError(null)
    })
    api.onUpdateAvailable((info) => {
      setUpdateStatus('available')
      setUpdateInfo({ version: info.version, releaseNotes: info.releaseNotes })
    })
    api.onUpdateNotAvailable(() => setUpdateStatus('idle'))
    api.onUpdateError((err) => {
      setUpdateStatus('error')
      const raw = err.message || '更新检查失败'
      setUpdateError(formatUpdateError(raw, language))
    })
    api.onUpdateDownloadProgress((p) => {
      setUpdateStatus('downloading')
      setUpdateProgress(p.percent || 0)
    })
    api.onUpdateDownloaded((info) => {
      setUpdateStatus('downloaded')
      setUpdateInfo({ version: info.version })
    })
    return () => {
      api.removeAllListeners('update-checking')
      api.removeAllListeners('update-available')
      api.removeAllListeners('update-not-available')
      api.removeAllListeners('update-error')
      api.removeAllListeners('update-download-progress')
      api.removeAllListeners('update-downloaded')
    }
  }, [language])

  useEffect(() => {
    const api = getElectronApi()?.getDeployInfo
    if (!api) return
    void api()
      .then((x) =>
        setDeployInfo(x)
      )
      .catch(() => setDeployInfo(null))
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      let tid: number | undefined
      try {
        const ac = new AbortController()
        tid = window.setTimeout(() => ac.abort(), 8000)
        const res = await fetch(`${API_BASE_URL}/assistant/status`, { signal: ac.signal })
        const j = (await res.json()) as Record<string, unknown>
        if (!cancelled) setAssistantStatus(j)
      } catch {
        if (!cancelled) setAssistantStatus(null)
      } finally {
        if (tid !== undefined) window.clearTimeout(tid)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const handleCheckForUpdates = async () => {
    const api = getElectronApi()?.update
    if (!api) {
      setUpdateError(formatUpdateError('当前环境不支持自动更新', language))
      setUpdateStatus('error')
      return
    }
    try {
      setUpdateStatus('checking')
      setUpdateError(null)
      const result = await api.checkForUpdates()
      if (result.error) {
        setUpdateStatus('error')
        setUpdateError(formatUpdateError(result.error, language))
      }
    } catch (e) {
      setUpdateStatus('error')
      setUpdateError(formatUpdateError(e instanceof Error ? e.message : '检查更新失败', language))
    }
  }

  const handleDownloadUpdate = async () => {
    const api = getElectronApi()?.update
    if (!api) return
    try {
      setUpdateStatus('downloading')
      setUpdateProgress(0)
      await api.downloadUpdate()
    } catch (e) {
      setUpdateError(formatUpdateError(e instanceof Error ? e.message : '下载失败', language))
    }
  }

  const handleInstallUpdate = async () => {
    await getElectronApi()?.update?.installUpdate()
  }

  /* 侧栏常驻后主区约 1200–1400px：以双列为主，避免三列挤扁 */
  const cardCls = `rounded-xl border p-5 ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'}`
  const sectionTitleCls = `text-base font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
  const accentBorder = darkMode ? 'border-l-blue-500' : 'border-l-blue-600'
  const fieldLabelCls = `text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`

  const t = {
    pageTitle: language === 'en' ? 'Settings' : '设置',
    pageSubtitle:
      language === 'en'
        ? 'Display, language, updates, legal notices and feedback.'
        : '管理显示与语言、检查更新、查看声明与反馈方式',
    orgLine:
      language === 'en'
        ? `Version ${currentVersion || '—'} · ${APP_ORG_NAME_EN}`
        : `版本 ${currentVersion || '—'} · ${APP_ORG_NAME_ZH}`,
    legal: language === 'en' ? 'Legal' : '法律与声明',
    packageAndAssistant: language === 'en' ? 'Installer & assistant' : '安装包与智能助手',
    packageMeta: language === 'en' ? 'Package metadata' : '安装包信息',
    localDeployLabel: language === 'en' ? 'Local assistant deployment' : '本地助手部署',
    electronVersionLabel: language === 'en' ? 'Electron version' : 'Electron 版本',
    yes: language === 'en' ? 'Yes' : '是',
    no: language === 'en' ? 'No' : '否',
  }

  const inferenceReady =
    assistantStatus !== null &&
    assistantStatus !== 'loading' &&
    Boolean((assistantStatus as { inferenceReady?: boolean }).inferenceReady)
  const localDeployEnabled =
    assistantStatus !== null &&
    assistantStatus !== 'loading' &&
    (assistantStatus as { localDeploymentEnabled?: boolean }).localDeploymentEnabled !== false

  return (
    <div className={`thin-scroll flex-1 min-w-0 overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
      <div className="w-full px-6 py-5 sm:px-8 lg:px-10 lg:py-6">
        <div className="mb-6">
          <BackIconButton label={language === 'en' ? 'Back to Home' : '返回主页面'} darkMode={darkMode} onClick={onBackToHome} className="mb-2" />
          <h1 className={`text-2xl font-bold mb-0.5 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{t.pageTitle}</h1>
          <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.pageSubtitle}</p>
          <div className={`rounded-xl border-l-4 ${accentBorder} ${darkMode ? 'bg-gray-700/60 border-gray-600' : 'bg-white border-gray-200'} px-5 py-4`}>
            <div className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{appTitle}</div>
            <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t.orgLine}</div>
          </div>
        </div>

        <SettingsAppearanceSection
          darkMode={darkMode}
          darkModeValue={darkModeValue}
          language={language}
          uiScalePercent={uiScalePercent}
          onDarkModeChange={onDarkModeChange}
          onLanguageChange={onLanguageChange}
          onScaleChange={(preset) => {
            setUiScalePercent(preset)
            setUiScale(preset)
          }}
          onResetScale={() => setUiScalePercent(resetUiScale() as UiScalePreset)}
        />

        {hasElectronLicense && (
          <section className="mb-6">
            <h2 className={`${sectionTitleCls} border-l-4 ${accentBorder} pl-3`}>{licUi.offlineLicense}</h2>
            <div className={cardCls}>
              {licenseInfo?.ok && (
                <div className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="font-bold">{licUi.validUntil}</span>
                  <span className="mx-1.5 font-bold">：</span>
                  {licenseInfo.expiresAtMs == null ? (
                    <span className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>{licUi.noExpiry}</span>
                  ) : (
                    <span
                      className={
                        (() => {
                          const days = (licenseInfo.expiresAtMs - Date.now()) / 86400000
                          if (days <= 30) return darkMode ? 'text-red-400 font-bold' : 'text-red-600 font-bold'
                          return darkMode ? 'text-green-400 font-bold' : 'text-green-700 font-bold'
                        })()
                      }
                    >
                      {new Date(licenseInfo.expiresAtMs).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
                <div>
                  <div className={fieldLabelCls}>{licUi.deviceCode}</div>
                  <div className="flex flex-col items-stretch gap-2 sm:flex-row">
                    <div
                      className={`flex min-h-[2.5rem] flex-1 min-w-0 items-center break-all rounded-md border px-3 py-2 font-mono text-xs ${
                        darkMode ? 'bg-gray-800/80 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'
                      }`}
                    >
                      {licenseInfo?.machineId || '—'}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const id = licenseInfo?.machineId
                        if (!id) return
                        void navigator.clipboard.writeText(id).then(() => {
                          setLicenseCopyOk(true)
                          window.setTimeout(() => setLicenseCopyOk(false), 2000)
                        })
                      }}
                      disabled={!licenseInfo?.machineId}
                      className="inline-flex min-h-[2.5rem] w-full shrink-0 items-center justify-center rounded-md bg-slate-100 text-sm font-medium text-slate-800 hover:opacity-90 disabled:opacity-50 sm:w-24 dark:bg-gray-600 dark:text-gray-200"
                    >
                      {licenseCopyOk ? licUi.copied : licUi.copyDev}
                    </button>
                  </div>
                </div>
                <div>
                  <div className={fieldLabelCls}>{licUi.licenseCode}</div>
                  <div className="flex flex-col items-stretch gap-2 sm:flex-row">
                    <textarea
                      value={licenseInput}
                      onChange={(e) => {
                        setLicenseInput(e.target.value)
                        setLicenseMsg(null)
                      }}
                      rows={1}
                      placeholder={licUi.licensePlaceholder}
                      spellCheck={false}
                      className={`min-h-[2.5rem] flex-1 min-w-0 resize-y rounded-md border px-3 py-2 font-mono text-xs ${
                        darkMode ? 'bg-gray-800/80 border-gray-600 text-gray-200' : 'bg-white border-gray-200 text-gray-800'
                      }`}
                    />
                    <button
                      type="button"
                      disabled={licenseBusy || !licenseInput.trim()}
                      onClick={async () => {
                        const api = getElectronApi()?.license
                        if (!api) return
                        setLicenseBusy(true)
                        setLicenseMsg(null)
                        try {
                          const r = await api.activate(licenseInput.trim())
                          if (r.ok) {
                            setLicenseMsg(licUi.licenseSaved)
                            setLicenseInput('')
                            const s = await api.getStatus()
                            setLicenseInfo({
                              machineId: s.machineId || '',
                              ok: !!s.ok,
                              expiresAtMs: s.expiresAtMs != null ? s.expiresAtMs : null,
                            })
                          } else {
                            setLicenseMsg(r.error || licUi.saveFailed)
                          }
                        } catch (e) {
                          setLicenseMsg((e as Error)?.message || licUi.saveFailed)
                        } finally {
                          setLicenseBusy(false)
                        }
                      }}
                      className="inline-flex min-h-[2.5rem] w-full shrink-0 items-center justify-center rounded-md bg-blue-600 px-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 sm:w-24"
                    >
                      {licenseBusy ? licUi.applyLicenseBusy : licUi.updateLicense}
                    </button>
                  </div>
                </div>
              </div>
              {licenseMsg && (
                <p
                  className={`mt-2 text-sm ${
                    licenseMsg === licUi.licenseSaved ? (darkMode ? 'text-green-400' : 'text-green-700') : 'text-red-600'
                  }`}
                >
                  {licenseMsg}
                </p>
              )}
            </div>
          </section>
        )}

        <section className="mb-6">
          <h2 className={`${sectionTitleCls} border-l-4 ${accentBorder} pl-3`}>{t.packageAndAssistant}</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
            <div className={cardCls}>
              <h3 className={`mb-2 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{t.packageMeta}</h3>
              <div className={`space-y-2.5 text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <p>{pkgInfo.variantIntro}</p>
                <p>{pkgInfo.nsisNote}</p>
                <p>{pkgInfo.updateNote}</p>
              </div>
              {deployInfo != null && (
                <div className={`mt-4 rounded-md border px-3 py-2.5 text-xs ${darkMode ? 'border-gray-600 bg-gray-800/60 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>
                  <div>
                    {t.localDeployLabel}：<span>{deployInfo.assistantLocalDeploy === false ? t.no : t.yes}</span>
                  </div>
                  <div className="mt-1">
                    {t.electronVersionLabel}：<span className="font-mono">{deployInfo.version ?? currentVersion}</span>
                  </div>
                </div>
              )}
            </div>
            <div className={cardCls}>
              <h3 className={`mb-2 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{astUi.sectionTitle}</h3>
              {assistantStatus === 'loading' ? (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{astUi.loading}</p>
              ) : assistantStatus === null ? (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{astUi.unavailable}</p>
              ) : !localDeployEnabled ? (
                <p className={`text-sm ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>{astUi.localDeployOff}</p>
              ) : (
                <div className={`space-y-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-2 w-2 rounded-full ${inferenceReady ? 'bg-green-500' : 'bg-amber-500'}`}
                      aria-hidden
                    />
                    {inferenceReady ? astUi.inferenceReady : astUi.inferenceNotReady}
                  </div>
                  {typeof assistantStatus.knowledgeLoadedChars === 'number' ? (
                    <div className="text-xs opacity-90">
                      {astUi.knowledgeChars} {assistantStatus.knowledgeLoadedChars}
                    </div>
                  ) : null}
                  {(assistantStatus as { failureDiagnosticZh?: string }).failureDiagnosticZh && language === 'zh' ? (
                    <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {(assistantStatus as { failureDiagnosticZh?: string }).failureDiagnosticZh}
                    </p>
                  ) : null}
                  {(assistantStatus as { failureDiagnosticEn?: string }).failureDiagnosticEn && language === 'en' ? (
                    <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {(assistantStatus as { failureDiagnosticEn?: string }).failureDiagnosticEn}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
            <div className={`${cardCls} lg:col-span-2`}>
              <h3 className={`mb-2 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{leg.aiAssistantTitle}</h3>
              <p className={`text-sm leading-relaxed max-w-4xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{leg.aiAssistantP}</p>
            </div>
          </div>
        </section>

        <SettingsUpdateSection
          darkMode={darkMode}
          language={language}
          currentVersion={currentVersion}
          updateStatus={updateStatus}
          updateInfo={updateInfo}
          updateProgress={updateProgress}
          updateError={updateError}
          feedbackMail={feedbackMail}
          hasUpdateApi={!!electronApi?.update}
          onCheck={handleCheckForUpdates}
          onDownload={handleDownloadUpdate}
          onInstall={handleInstallUpdate}
        />

        <section className="mb-2">
          <h2 className={`${sectionTitleCls} border-l-4 ${accentBorder} pl-3`}>{t.legal}</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
            <div className={cardCls}>
              <h3 className={`mb-2 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{leg.disclaimerTitle}</h3>
              <div className={`space-y-2.5 text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <p>{leg.disclaimerP1}</p>
                <p>{leg.disclaimerP2}</p>
                <p>{leg.disclaimerP3}</p>
              </div>
            </div>
            <div className={cardCls}>
              <h3 className={`mb-2 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{leg.privacyTitle}</h3>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{leg.privacyP}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
