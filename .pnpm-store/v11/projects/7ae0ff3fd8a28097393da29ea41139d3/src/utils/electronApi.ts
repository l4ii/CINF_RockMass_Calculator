import type { ElectronApi } from '../types/electronApi'

export function getElectronApi(): ElectronApi | null {
  return typeof window === 'undefined' ? null : window.electronAPI ?? null
}
