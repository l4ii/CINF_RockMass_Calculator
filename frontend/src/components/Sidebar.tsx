import { ABOUT_NAV, sidebarSubtitleForLang, sidebarTitleForLang } from '../constants/appCopy'
import { CLASSIFICATION_METHODS, type SelectedMethod } from '../types'

interface SidebarProps {
  selectedMethod: SelectedMethod | null
  onMethodSelect: (method: SelectedMethod) => void
  darkMode: boolean
  language: 'zh' | 'en'
  onShowAbout: (department: string) => void
  onShowSettings: () => void
  currentView: 'module' | 'about' | 'settings'
  aboutDepartment?: string | null
}

type SidebarClassificationItem = {
  id: string
  name: string
  nameEn: string
  method: SelectedMethod | null
  available: boolean
}

export default function Sidebar({
  selectedMethod,
  onMethodSelect,
  darkMode,
  language,
  onShowAbout,
  onShowSettings,
  currentView,
  aboutDepartment,
}: SidebarProps) {
  const t = ABOUT_NAV[language]
  const sidebarTitle = sidebarTitleForLang(language)
  const sidebarSubtitle = sidebarSubtitleForLang(language)
  const requestedMethods: SidebarClassificationItem[] = [
    'rqd',
    'bq',
    'q',
    'rmr',
    'mrmr',
  ].map((id) => {
    const method = CLASSIFICATION_METHODS.find((item) => item.id === id) ?? null
    return {
      id,
      name: method?.name ?? `${id.toUpperCase()}分级`,
      nameEn: method?.nameEn ?? `${id.toUpperCase()} Classification`,
      method,
      available: method != null,
    }
  }).concat({
    id: 'gsi',
    name: 'GSI分级',
    nameEn: 'GSI Classification',
    method: null,
    available: false,
  })
  const groups = [{
    id: 'classification' as const,
    title: language === 'en' ? 'Rock mass classification methods' : '岩体分级方法',
    methods: requestedMethods,
  }]

  return (
    <div
      data-testid="sidebar"
      className={`h-full min-h-0 w-[270px] shrink-0 border-r flex flex-col ${
        darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <div className={`border-b p-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden"
          >
            <img data-testid="sidebar-logo" src="./icon.png" alt="Logo" className="h-14 w-14 object-contain" />
          </div>
          <div className="min-w-0 flex-1 text-right">
            <div className={`text-lg font-bold text-right ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {sidebarTitle}
            </div>
            <div className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="whitespace-pre-line text-right">{sidebarSubtitle}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto p-3">
        <div className="space-y-3">
          {groups.map((group) => (
            <section key={group.id}>
              <h2 className={`mb-1 px-2 py-1.5 text-base font-bold leading-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {group.title}
              </h2>
              <div className="space-y-1 pl-2">
                {group.methods.map((item) => {
                  const selected = item.method != null && currentView === 'module' && selectedMethod?.id === item.method.id
                  const label = language === 'en' ? item.nameEn : item.name
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.method) onMethodSelect(item.method)
                      }}
                      disabled={!item.available}
                      aria-disabled={!item.available}
                      className={`flex h-9 min-h-9 w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-base font-normal leading-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        selected
                          ? 'bg-blue-600 text-white'
                          : !item.available
                            ? darkMode
                              ? 'cursor-not-allowed text-gray-600'
                              : 'cursor-not-allowed text-gray-400'
                          : darkMode
                            ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span>{label}</span>
                      {!item.available ? (
                        <span className={`shrink-0 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {language === 'en' ? 'Coming soon' : '待开发'}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* 了解我们、设置 —— 与冶金软件侧栏版式一致 */}
      <div className={`flex-shrink-0 border-t p-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2
          className={`text-base font-semibold mb-2 uppercase tracking-wide ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {t.aboutUs}
        </h2>
        <div className="pl-2 space-y-1 mb-3">
          <button
            type="button"
            onClick={() => onShowAbout('cinf')}
            title={t.cinf}
            className={`h-8 w-full overflow-hidden text-ellipsis whitespace-nowrap text-left px-2 py-1.5 rounded text-sm transition-colors ${
              currentView === 'about' && aboutDepartment === 'cinf'
                ? 'bg-blue-600 text-white'
                : darkMode
                  ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {t.cinf}
          </button>
          <button
            type="button"
            onClick={() => onShowAbout('research')}
            title={t.research}
            className={`h-8 w-full overflow-hidden text-ellipsis whitespace-nowrap text-left px-2 py-1.5 rounded text-sm transition-colors ${
              currentView === 'about' && aboutDepartment === 'research'
                ? 'bg-blue-600 text-white'
                : darkMode
                  ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {t.research}
          </button>
          <button
            type="button"
            onClick={() => onShowAbout('mining')}
            title={t.mining}
            className={`h-8 w-full overflow-hidden text-ellipsis whitespace-nowrap text-left px-2 py-1.5 rounded text-sm transition-colors ${
              currentView === 'about' && aboutDepartment === 'mining'
                ? 'bg-blue-600 text-white'
                : darkMode
                  ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {t.mining}
          </button>
        </div>
        <button
          type="button"
          onClick={onShowSettings}
          className={`w-full text-left px-2 py-1.5 rounded-lg text-base font-semibold uppercase tracking-wide transition-colors ${
            currentView === 'settings'
              ? 'bg-blue-600 text-white'
              : darkMode
                ? 'text-gray-300 hover:bg-gray-800'
                : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {t.settings}
        </button>
      </div>

      {/* Footer：公司官网链接触发区 */}
      <div
        className={`border-t p-3 ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className="mb-1">{t.footerBy}</div>
          <a
            href="http://www.cinf.com.cn/"
            target="_blank"
            rel="noopener noreferrer"
            title={t.cinf}
            className={`block overflow-hidden text-ellipsis whitespace-nowrap text-center font-medium hover:underline ${
              darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
            }`}
          >
            {t.cinf}
          </a>
          <div className="mt-1 whitespace-nowrap text-right">{t.footerDev}</div>
        </div>
      </div>
    </div>
  )
}
