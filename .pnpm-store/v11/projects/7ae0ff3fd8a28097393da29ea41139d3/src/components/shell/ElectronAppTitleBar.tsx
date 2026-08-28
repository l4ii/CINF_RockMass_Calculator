import { useEffect, useState, type CSSProperties } from 'react'
import { appTitleForLang } from '../../constants/appCopy'
import { getElectronApi } from '../../utils/electronApi'

function readElectronApi() {
  return getElectronApi()
}

/** Windows titleBarOverlay 时，把完整产品名画在网页顶栏，弹窗遮罩可一并盖住 */
export default function ElectronAppTitleBar({
  darkMode,
  language,
}: {
  darkMode: boolean
  language: 'zh' | 'en'
}) {
  const [height, setHeight] = useState(0)
  const title = appTitleForLang(language)

  useEffect(() => {
    const api = readElectronApi()
    if (!api?.windowChrome?.get) return
    let cancelled = false
    void api.windowChrome.get().then((chrome) => {
      if (cancelled) return
      const next = chrome?.usesTitleBarOverlay ? Math.max(0, chrome.titleBarHeight ?? 36) : 0
      setHeight(next)
      document.documentElement.style.setProperty('--app-titlebar-height', `${next}px`)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const api = readElectronApi()
    if (!height || !api?.windowChrome?.setTitleBarOverlay) return
    void api.windowChrome.setTitleBarOverlay({ dark: darkMode })
  }, [darkMode, height])

  if (height <= 0) return null

  const barStyle = {
    height,
    WebkitAppRegion: 'drag',
    paddingRight: 148,
  } as CSSProperties

  return (
    <div
      className={`flex shrink-0 items-center border-b px-3 text-sm font-medium ${
        darkMode ? 'border-gray-800 bg-gray-900 text-gray-100' : 'border-gray-200 bg-gray-50 text-gray-900'
      }`}
      style={barStyle}
      title={title}
    >
      <span className="truncate select-none">{title}</span>
    </div>
  )
}
