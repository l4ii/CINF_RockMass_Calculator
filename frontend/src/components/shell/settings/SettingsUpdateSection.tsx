import type { UpdateInfo, UpdateStatus } from '../../../types/electronApi'

interface SettingsUpdateSectionProps {
  darkMode: boolean
  language: 'zh' | 'en'
  currentVersion: string
  updateStatus: UpdateStatus
  updateInfo: UpdateInfo | null
  updateProgress: number
  updateError: string | null
  feedbackMail: string
  hasUpdateApi: boolean
  onCheck: () => void
  onDownload: () => void
  onInstall: () => void
}

export default function SettingsUpdateSection({
  darkMode,
  language,
  currentVersion,
  updateStatus,
  updateInfo,
  updateProgress,
  updateError,
  feedbackMail,
  hasUpdateApi,
  onCheck,
  onDownload,
  onInstall,
}: SettingsUpdateSectionProps) {
  const en = language === 'en'
  const cardCls = `rounded-xl border p-5 ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'}`
  const muted = darkMode ? 'text-gray-400' : 'text-gray-600'
  const t = {
    section: en ? 'Feedback & updates' : '反馈与更新',
    feedbackTitle: en ? 'Suggestions & feedback' : '建议与反馈',
    feedbackDesc: en ? 'Feature ideas, issues or cooperation—contact the development team.' : '功能建议、问题反馈或合作意向，欢迎联系开发团队。',
    feedbackBtn: en ? 'Email the team' : '联系开发团队',
    update: en ? 'App updates' : '应用更新',
    current: en ? 'Current version' : '当前版本',
    check: en ? 'Check for updates' : '检查更新',
    checking: en ? 'Checking for updates…' : '正在检查更新...',
    available: en ? 'New version' : '发现新版本',
    download: en ? 'Download update' : '下载更新',
    downloading: en ? 'Downloading' : '正在下载',
    downloaded: en ? 'Update ready. Restart to install.' : '更新已下载，重启后安装',
    install: en ? 'Restart and install' : '立即重启并安装',
    retry: en ? 'Retry' : '重试',
    browserTitle: en ? 'App version' : '应用版本',
    browserNote: en ? 'No auto-update in browser preview.' : '（浏览器环境下无自动更新）',
    failed: en ? 'Update check failed' : '更新检查失败',
  }
  const button = 'w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:w-auto'
  const greenButton = button.replace('bg-blue-600 hover:bg-blue-700', 'bg-green-600 hover:bg-green-700')

  return (
    <section className="mb-6">
      <h2 className={`mb-3 flex items-center gap-2 border-l-4 pl-3 text-base font-semibold ${darkMode ? 'text-gray-300 border-l-blue-500' : 'text-gray-700 border-l-blue-600'}`}>
        {t.section}
      </h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <div className={cardCls}>
          <h3 className={`mb-1.5 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{t.feedbackTitle}</h3>
          <p className={`mb-3 text-sm ${muted}`}>{t.feedbackDesc}</p>
          <a href={feedbackMail} className={button}>{t.feedbackBtn}</a>
        </div>
        {!hasUpdateApi ? (
          <div className={cardCls}>
            <h3 className={`mb-1.5 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{t.browserTitle}</h3>
            <div className={`text-sm ${muted}`}>{t.current} <span className="font-semibold">{currentVersion || '—'}</span> {t.browserNote}</div>
          </div>
        ) : (
          <div className={cardCls}>
            <h3 className={`mb-1.5 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{t.update}</h3>
            <div className={`mb-3 text-sm ${muted}`}>{t.current} <span className="font-semibold text-blue-600">{currentVersion || '—'}</span></div>
            <div className="space-y-2.5">
              {updateStatus === 'idle' && <button onClick={onCheck} className={button}>{t.check}</button>}
              {updateStatus === 'checking' && <div className={`py-2 text-sm ${muted}`}><span className="mr-2 inline-block animate-spin">⟳</span>{t.checking}</div>}
              {updateStatus === 'available' && updateInfo && (
                <div className="space-y-2.5">
                  <div className={`rounded-md p-2.5 text-sm ${darkMode ? 'bg-green-900/30 border border-green-700 text-green-300' : 'bg-green-50 border border-green-200 text-green-800'}`}>
                    <div className="font-medium">{t.available} {updateInfo.version}</div>
                    {updateInfo.releaseNotes && <div className={`mt-1 text-xs ${darkMode ? 'text-green-400' : 'text-green-700'}`}>{updateInfo.releaseNotes}</div>}
                  </div>
                  <button onClick={onDownload} className={greenButton}>{t.download}</button>
                </div>
              )}
              {updateStatus === 'downloading' && <div className="space-y-2"><div className={`text-sm ${muted}`}>{t.downloading} {updateProgress}%</div><div className={`h-2 w-full overflow-hidden rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}><div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${updateProgress}%` }} /></div></div>}
              {updateStatus === 'downloaded' && <div className="space-y-2.5"><div className={`rounded-md p-2.5 text-sm ${darkMode ? 'bg-green-900/30 border border-green-700 text-green-300' : 'bg-green-50 border border-green-200 text-green-800'}`}>{t.downloaded}</div><button onClick={onInstall} className={greenButton}>{t.install}</button></div>}
              {updateStatus === 'error' && <div className="space-y-2.5"><div className={`rounded-md p-2.5 text-sm ${darkMode ? 'bg-red-900/30 border border-red-700 text-red-300' : 'bg-red-50 border border-red-200 text-red-800'}`}>{updateError || t.failed}</div><button onClick={onCheck} className={button}>{t.retry}</button></div>}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
