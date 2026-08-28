export type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'

export interface UpdateInfo {
  version?: string
  releaseNotes?: string
}

export interface UpdateProgress {
  percent?: number
}

export interface UpdateApi {
  checkForUpdates: () => Promise<{ error?: string }>
  downloadUpdate: () => Promise<unknown>
  installUpdate: () => Promise<unknown>
  getAppVersion: () => Promise<string>
  onUpdateChecking: (callback: () => void) => void
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void
  onUpdateNotAvailable: (callback: () => void) => void
  onUpdateError: (callback: (error: { message?: string } | Error) => void) => void
  onUpdateDownloadProgress: (callback: (progress: UpdateProgress) => void) => void
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void
  removeAllListeners: (channel: string) => void
}

export interface LicenseStatus {
  ok: boolean
  machineId?: string
  reason?: string
  expiresAtMs?: number | null
}

export interface LicenseApi {
  getStatus: () => Promise<LicenseStatus>
  getCachedStatus?: () => Promise<LicenseStatus>
  activate: (token: string) => Promise<{ ok: boolean; error?: string }>
}

export interface SaveFileApi {
  saveFileToDisk?: (
    fileName: string,
    data: string | ArrayBuffer,
    options?: { title?: string; filters?: Array<{ name: string; extensions: string[] }>; encoding?: string }
  ) => Promise<{ ok: boolean; cancelled?: boolean; filePath?: string; error?: string }>
}

export interface WindowChromeApi {
  get?: () => Promise<{ platform?: string; usesTitleBarOverlay?: boolean; titleBarHeight?: number }>
  setTitleBarOverlay?: (payload: { dark: boolean }) => Promise<unknown>
}

export interface ElectronApi {
  appReady?: () => void
  update?: UpdateApi
  license?: LicenseApi
  getDeployInfo?: () => Promise<{ assistantLocalDeploy?: boolean; version?: string; packaged?: boolean } | null>
  saveFileToDisk?: SaveFileApi['saveFileToDisk']
  windowChrome?: WindowChromeApi
}

declare global {
  interface Window {
    electronAPI?: ElectronApi
  }
}

export {}
