// Preload脚本 - 在渲染进程中运行，可以安全地暴露API
const { contextBridge, ipcRenderer } = require('electron')

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  /** 前端就绪后主进程关闭闪屏并显示主窗口（与 Flow 一致） */
  appReady: () => ipcRenderer.send('app:ready'),
  // 更新相关 API
  update: {
    // 检查更新
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    
    // 下载更新
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    
    // 安装更新
    installUpdate: () => ipcRenderer.invoke('install-update'),
    
    // 获取当前版本
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // 监听更新事件
    onUpdateChecking: (callback) => {
      ipcRenderer.on('update-checking', () => callback())
    },
    
    onUpdateAvailable: (callback) => {
      ipcRenderer.on('update-available', (event, info) => callback(info))
    },
    
    onUpdateNotAvailable: (callback) => {
      ipcRenderer.on('update-not-available', (event, info) => callback(info))
    },
    
    onUpdateError: (callback) => {
      ipcRenderer.on('update-error', (event, error) => callback(error))
    },
    
    onUpdateDownloadProgress: (callback) => {
      ipcRenderer.on('update-download-progress', (event, progress) => callback(progress))
    },
    
    onUpdateDownloaded: (callback) => {
      ipcRenderer.on('update-downloaded', (event, info) => callback(info))
    },
    
    // 移除监听器
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel)
    }
  },
  // 导出计算书：显示“另存为”对话框，返回用户选择的路径或 null
  showSaveDialogForExport: (defaultFileName) => ipcRenderer.invoke('show-save-dialog-export', defaultFileName),
  exportWorkbookToFile: (fileName, content, format) =>
    ipcRenderer.invoke('export:save-workbook', { fileName, content, format }),
  exportBinaryToFile: (fileName, buffer) => ipcRenderer.invoke('export:save-binary', { fileName, buffer }),
  // 通用另存为：后缀由 fileName 决定，data 支持字符串与 ArrayBuffer
  saveFileToDisk: (fileName, data, options) =>
    ipcRenderer.invoke('export:save-file', {
      fileName,
      data,
      filters: options?.filters,
      title: options?.title,
      encoding: options?.encoding,
    }),
  openFloTemplateFile: () => ipcRenderer.invoke('export:open-flo-template'),
  saveCopperCaseToDesktop: (fileName, content) => ipcRenderer.invoke('copper-case:save-desktop', { fileName, content }),
  // 离线一机一证：设备码 + 授权码（前缀 CINF-ROCK-LIC1.）
  license: {
    getStatus: () => ipcRenderer.invoke('license:get-status'),
    getCachedStatus: () => ipcRenderer.invoke('license:get-cached-status'),
    activate: (token) => ipcRenderer.invoke('license:activate', token),
  },
  getDeployInfo: () => ipcRenderer.invoke('get-deploy-info'),
  windowChrome: {
    get: () => ipcRenderer.invoke('window:get-chrome'),
    setTitleBarOverlay: (payload) => ipcRenderer.invoke('window:set-titlebar-overlay', payload),
  },
})
