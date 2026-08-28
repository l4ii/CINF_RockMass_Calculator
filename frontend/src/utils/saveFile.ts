/**
 * 统一的「另存为」入口：Electron 下走主进程对话框，浏览器预览下退回下载。
 */

export interface SaveFileFilter {
  name: string
  extensions: string[]
}

export interface SaveFileOptions {
  title?: string
  filters?: SaveFileFilter[]
  mimeType?: string
}

export interface SaveFileResult {
  ok: boolean
  cancelled?: boolean
  filePath?: string
  error?: string
}

function electronSaveApi() {
  if (typeof window === 'undefined') return null
  return window.electronAPI ?? null
}

export function isElectronRuntime() {
  return !!electronSaveApi()?.saveFileToDisk
}

function downloadInBrowser(fileName: string, data: string | ArrayBuffer, mimeType: string) {
  const blob = new Blob([data as BlobPart], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  // 立即回收会让部分浏览器下载中断
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export async function saveFile(
  fileName: string,
  data: string | ArrayBuffer,
  options: SaveFileOptions = {}
): Promise<SaveFileResult> {
  const api = electronSaveApi()
  if (api?.saveFileToDisk) {
    try {
      return await api.saveFileToDisk(fileName, data, { title: options.title, filters: options.filters })
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  }
  try {
    downloadInBrowser(fileName, data, options.mimeType ?? 'application/octet-stream')
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
