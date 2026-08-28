import { UI_SCALE_PRESETS, type UiScalePreset } from '../../../utils/uiScale'

interface SettingsAppearanceSectionProps {
  darkMode: boolean
  darkModeValue: boolean
  language: 'zh' | 'en'
  uiScalePercent: UiScalePreset
  onDarkModeChange?: (dark: boolean) => void
  onLanguageChange?: (language: 'zh' | 'en') => void
  onScaleChange: (preset: UiScalePreset) => void
  onResetScale: () => void
}

export default function SettingsAppearanceSection({
  darkMode,
  darkModeValue,
  language,
  uiScalePercent,
  onDarkModeChange,
  onLanguageChange,
  onScaleChange,
  onResetScale,
}: SettingsAppearanceSectionProps) {
  const en = language === 'en'
  const sectionTitle = en ? 'Appearance' : '外观与偏好'
  const theme = en ? 'Theme' : '显示模式'
  const scale = en ? 'Interface scale' : '界面缩放'
  const reset = en ? 'Reset 100%' : '重置 100%'
  const track = `flex w-full gap-1 rounded-lg p-1 ${darkMode ? 'bg-gray-800/80' : 'bg-gray-100'}`
  const button = (active: boolean) => `flex-1 min-w-0 rounded-md px-3 py-2.5 text-sm font-medium text-center transition-colors ${active ? 'bg-blue-600 text-white shadow-sm' : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-white'}`
  const card = `rounded-xl border p-5 ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'}`
  const label = `text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`

  return (
    <section className="mb-6">
      <h2 className={`mb-3 flex items-center gap-2 border-l-4 pl-3 text-base font-semibold ${darkMode ? 'text-gray-300 border-l-blue-500' : 'text-gray-700 border-l-blue-600'}`}>{sectionTitle}</h2>
      <div className={card}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
          <div>
            <div className={label}>{theme}</div>
            <div className={track} role="group" aria-label={theme}>
              <button type="button" onClick={() => onDarkModeChange?.(false)} className={button(!darkModeValue)}>{en ? 'Light' : '浅色'}</button>
              <button type="button" onClick={() => onDarkModeChange?.(true)} className={button(darkModeValue)}>{en ? 'Dark' : '暗色'}</button>
            </div>
          </div>
          <div>
            <div className={label}>{en ? 'Language' : '界面语言'}</div>
            <div className={track} role="group" aria-label={en ? 'Language' : '界面语言'}>
              <button type="button" onClick={() => onLanguageChange?.('zh')} className={button(language === 'zh')}>中文</button>
              <button type="button" onClick={() => onLanguageChange?.('en')} className={button(language === 'en')}>English</button>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className={label}>{scale}</div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch">
              <div className={`${track} min-w-0 flex-1`} role="group" aria-label={scale}>
                {UI_SCALE_PRESETS.map((preset) => <button key={preset} type="button" onClick={() => onScaleChange(preset)} className={button(uiScalePercent === preset)}>{preset}%</button>)}
              </div>
              <button type="button" className={`shrink-0 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors sm:w-32 ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`} onClick={onResetScale}>{reset}</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
