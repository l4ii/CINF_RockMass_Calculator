/** 界面缩放：持久化 + 应用到 document.body.style.zoom（Electron Chromium） */

export const UI_SCALE_STORAGE_KEY = 'metcal:ui-scale'

export const UI_SCALE_PRESETS = [80, 90, 100, 110, 125, 150] as const

export type UiScalePreset = (typeof UI_SCALE_PRESETS)[number]

const MIN_SCALE = 50
const MAX_SCALE = 200
const STEP = 5

function clampScale(percent: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(percent)))
}

export function readStoredUiScale(): number {
  if (typeof window === 'undefined') return 100
  try {
    const raw = localStorage.getItem(UI_SCALE_STORAGE_KEY)
    if (raw == null) return 100
    const n = Number.parseFloat(raw)
    return Number.isFinite(n) ? clampScale(n) : 100
  } catch {
    return 100
  }
}

export function applyUiScale(percent: number): number {
  const clamped = clampScale(percent)
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--app-zoom', String(clamped / 100))
    document.body.style.zoom = String(clamped / 100)
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(UI_SCALE_STORAGE_KEY, String(clamped))
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent('metcal:ui-scale-changed', { detail: { percent: clamped } }))
  }
  return clamped
}

export function setUiScale(percent: number): number {
  return applyUiScale(percent)
}

export function adjustUiScale(deltaPercent: number): number {
  return applyUiScale(readStoredUiScale() + deltaPercent)
}

export function resetUiScale(): number {
  return applyUiScale(100)
}

export function nearestUiScalePreset(percent: number): UiScalePreset {
  const clamped = clampScale(percent)
  let best: UiScalePreset = 100
  let bestDist = Infinity
  for (const p of UI_SCALE_PRESETS) {
    const d = Math.abs(p - clamped)
    if (d < bestDist) {
      bestDist = d
      best = p
    }
  }
  return best
}

export function installUiScaleShortcuts(): () => void {
  if (typeof window === 'undefined') return () => undefined

  const onKeyDown = (event: KeyboardEvent) => {
    if (!(event.ctrlKey || event.metaKey)) return
    const key = event.key
    if (key === '=' || key === '+') {
      event.preventDefault()
      adjustUiScale(STEP)
    } else if (key === '-' || key === '_') {
      event.preventDefault()
      adjustUiScale(-STEP)
    } else if (key === '0') {
      event.preventDefault()
      resetUiScale()
    }
  }

  const onWheel = (event: WheelEvent) => {
    if (!(event.ctrlKey || event.metaKey)) return
    event.preventDefault()
    adjustUiScale(event.deltaY < 0 ? STEP : -STEP)
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('wheel', onWheel, { passive: false })
  return () => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('wheel', onWheel)
  }
}

export function initUiScale(): () => void {
  applyUiScale(readStoredUiScale())
  return installUiScaleShortcuts()
}
