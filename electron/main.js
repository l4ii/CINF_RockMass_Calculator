const { app, BrowserWindow, dialog, ipcMain, nativeImage, Menu } = require('electron')
const path = require('path')
const http = require('http')
const { spawn, execSync, exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)
const fs = require('fs')
const os = require('os')
const { autoUpdater } = require('electron-updater')
const license = require('./license')

/**
 * 打包后固定 userData，避免 productName 变化导致 offline-license.dat 路径漂移、反复要求激活。
 */
function prepareStableUserDataPath() {
  if (!app.isPackaged) return
  const appData = app.getPath('appData')
  const stableDir = path.join(appData, 'CINF_RockMass')
  const licenseFile = license.LICENSE_BASENAME

  const legacyDirs = new Set()
  try {
    legacyDirs.add(app.getPath('userData'))
  } catch (_) {
    /* ignore */
  }
  for (const folderName of ['rockmass_calculator', 'CINF岩体质量与分级软件']) {
    legacyDirs.add(path.join(appData, folderName))
  }

  const destLicense = path.join(stableDir, licenseFile)
  if (!fs.existsSync(destLicense)) {
    for (const dir of legacyDirs) {
      if (!dir) continue
      if (path.resolve(dir) === path.resolve(stableDir)) continue
      const src = path.join(dir, licenseFile)
      if (fs.existsSync(src)) {
        try {
          fs.mkdirSync(stableDir, { recursive: true })
          fs.copyFileSync(src, destLicense)
        } catch (e) {
          console.error('离线许可迁移失败:', e)
        }
        break
      }
    }
  }

  try {
    app.setPath('userData', stableDir)
  } catch (e) {
    console.error('setPath userData 失败:', e)
  }
}

prepareStableUserDataPath()

/** 与 frontend/src/constants/appCopy.ts 中 APP_NAME_ZH / APP_TAGLINE_ZH 保持同步 */
const APP_DISPLAY_NAME = 'CINF矿山岩体质量分级软件'
const APP_SPLASH_DISPLAY_NAME = 'CINF矿山岩体质量分级软件'
const APP_SPLASH_TAGLINE = '面向矿山工程建设与生产管理，提供岩体质量评价、分级计算、工程分析和成果整理等专业支持，帮助用户规范记录参数、复核结果并形成可追溯的技术资料。'

/** 应用菜单（可按需增删项）；Windows 常显中文菜单栏 */
function buildApplicationMenu() {
  const isMac = process.platform === 'darwin'
  /** @type {Electron.MenuItemConstructorOptions[]} */
  const template = [
    ...(isMac
      ? [
          {
            label: APP_DISPLAY_NAME,
            submenu: [
              { role: 'about', label: '关于' },
              { type: 'separator' },
              { role: 'services', label: '服务' },
              { type: 'separator' },
              { role: 'hide', label: '隐藏' },
              { role: 'hideOthers', label: '隐藏其他' },
              { role: 'unhide', label: '全部显示' },
              { type: 'separator' },
              { role: 'quit', label: '退出' },
            ],
          },
        ]
      : []),
    {
      label: '文件',
      submenu: [isMac ? { role: 'close', label: '关闭窗口' } : { role: 'quit', label: '退出' }],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' },
      ],
    },
    {
      label: '查看',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        ...( !app.isPackaged ? [{ role: 'toggleDevTools', label: '开发者工具' }] : []),
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '切换全屏' },
      ],
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'zoom', label: '缩放' },
        ...(isMac
          ? [{ type: 'separator' }, { role: 'front', label: '前置全部窗口' }]
          : [{ role: 'close', label: '关闭' }]),
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于本软件',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: '关于',
              message: APP_DISPLAY_NAME,
              detail: APP_SPLASH_TAGLINE,
            })
          },
        },
      ],
    },
  ]
  return Menu.buildFromTemplate(template)
}

// 仅根据是否打包判断：打包后的 exe 始终为生产模式
const isDev = !app.isPackaged

const DEFAULT_DEV_SERVER_URL = 'http://localhost:5173'

function resolveDevServerUrl() {
  const configured = String(process.env.CINF_DEV_SERVER_URL || '').trim()
  if (!configured) return DEFAULT_DEV_SERVER_URL

  try {
    const url = new URL(configured)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error(`unsupported protocol ${url.protocol}`)
    }
    return url.toString()
  } catch (error) {
    console.warn(
      `[启动] 忽略无效的 CINF_DEV_SERVER_URL=${configured}:`,
      error && error.message ? error.message : error
    )
    return DEFAULT_DEV_SERVER_URL
  }
}

const DEV_SERVER_URL = resolveDevServerUrl()

function parseEnvBool(raw) {
  if (typeof raw !== 'string') return null
  const v = raw.trim().toLowerCase()
  if (!v) return null
  if (['1', 'true', 'yes', 'on'].includes(v)) return true
  if (['0', 'false', 'no', 'off'].includes(v)) return false
  return null
}

/** 是否与 electron-builder extraMetadata.cinfAssistantLocalDeploy / 环境变量一致 */
function resolveLocalAiDeploymentEnabled() {
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json')
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
      if (typeof pkg.cinfAssistantLocalDeploy === 'boolean') {
        return pkg.cinfAssistantLocalDeploy
      }
    }
  } catch (_) {
    /* ignore */
  }
  const envPreferred =
    parseEnvBool(process.env.CINF_ASSISTANT_LOCAL_DEPLOYMENT) ??
    parseEnvBool(process.env.CINF_PACK_LOCAL_AI)
  if (envPreferred !== null) return envPreferred
  return true
}

const LOCAL_AI_DEPLOYMENT_ENABLED = resolveLocalAiDeploymentEnabled()

function getResourcePath(...paths) {
  if (isDev) {
    return path.join(__dirname, '..', ...paths)
  }
  return path.join(process.resourcesPath, ...paths)
}

function isWindows7KernelOrOlder() {
  if (process.platform !== 'win32') return false
  const parts = (os.release() || '').split('.')
  const major = parseInt(parts[0], 10) || 0
  const minor = parseInt(parts[1], 10) || 0
  if (major < 6) return true
  if (major === 6 && minor <= 1) return true
  return false
}

// 减轻 Windows 下缓存目录权限导致的 ERROR: Unable to move the cache / Gpu Cache Creation failed
if (process.platform === 'win32') {
  app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
  app.commandLine.appendSwitch('disable-application-cache')
  const cacheDir = path.join(app.getPath('userData'), 'Cache')
  try {
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true })
    app.commandLine.appendSwitch('disk-cache-dir', cacheDir)
  } catch (e) {
    // 忽略，使用默认缓存路径
  }
}

let mainWindow
let backendProcess
let splashWindow
/** 主窗显示与闪屏关闭仅处理一次（app:ready 或 90s 兜底） */
let appReadyHandled = false
let appReadyFallbackTimer = null
let splashMinVisibleTimer = null
let splashLoadWatchdogTimer = null
let mainWindowReadyToShow = false
let licensePrewarmDone = false
/** 闪屏已真正 show（或创建失败视为就绪，避免永久卡住） */
let splashReady = false
let splashShownAt = 0
/** 关闭请求已到达但闪屏尚未就绪/未满最短展示时间 */
let splashCloseRequested = false
/** 最短可见时间，避免冷启动缓存命中时白屏一闪、内容未绘出就被关掉 */
const SPLASH_MIN_VISIBLE_MS = 1600
/** 闪屏加载超时：超时后不再阻塞主窗显示 */
const SPLASH_LOAD_WATCHDOG_MS = 5000

function tryEarlySplashClose() {
  if (mainWindowReadyToShow && licensePrewarmDone) {
    showMainAndCloseSplash()
  }
}

function setupEarlySplashClose(licensePrewarmPromise) {
  void licensePrewarmPromise
    .then(() => {
      licensePrewarmDone = true
      tryEarlySplashClose()
    })
    .catch((e) => {
      console.warn('[许可] 预热失败:', e)
      licensePrewarmDone = true
      tryEarlySplashClose()
    })
}

function clearSplashTimers() {
  if (appReadyFallbackTimer) {
    try {
      clearTimeout(appReadyFallbackTimer)
    } catch (_) {}
    appReadyFallbackTimer = null
  }
  if (splashMinVisibleTimer) {
    try {
      clearTimeout(splashMinVisibleTimer)
    } catch (_) {}
    splashMinVisibleTimer = null
  }
  if (splashLoadWatchdogTimer) {
    try {
      clearTimeout(splashLoadWatchdogTimer)
    } catch (_) {}
    splashLoadWatchdogTimer = null
  }
}

/**
 * @param {{ force?: boolean }} [opts] force=true 时跳过「等闪屏就绪 / 最短展示」约束（90s 兜底）
 */
function showMainAndCloseSplash(opts = {}) {
  if (appReadyHandled) return
  const force = opts.force === true

  // 闪屏尚未 show：先记住请求，等 ready-to-show 后再关（避免白底一闪）
  if (!force && splashWindow && !splashWindow.isDestroyed() && !splashReady) {
    splashCloseRequested = true
    return
  }

  // 已 show：保证最短展示时间，让标题/图标有机会画完
  if (!force && splashWindow && !splashWindow.isDestroyed() && splashShownAt > 0) {
    const remaining = SPLASH_MIN_VISIBLE_MS - (Date.now() - splashShownAt)
    if (remaining > 0) {
      splashCloseRequested = true
      if (!splashMinVisibleTimer) {
        splashMinVisibleTimer = setTimeout(() => {
          splashMinVisibleTimer = null
          showMainAndCloseSplash()
        }, remaining)
      }
      return
    }
  }

  appReadyHandled = true
  splashCloseRequested = false
  console.log('[启动] splash.close: main window shown')
  clearSplashTimers()
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close()
    splashWindow = null
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show()
    if (process.platform === 'darwin') {
      app.dock.show()
    }
  }
}

function injectSplashIcon(dataUrl) {
  if (!splashWindow || splashWindow.isDestroyed() || !dataUrl) return
  const script = `(function(){
    try {
      var iconEl = document.getElementById('appIcon');
      var fallback = document.getElementById('fallbackMark');
      if (!iconEl) return;
      iconEl.style.display = '';
      iconEl.onload = function () { if (fallback) fallback.style.display = 'none'; };
      iconEl.onerror = function () { if (fallback) fallback.style.display = ''; };
      iconEl.src = ${JSON.stringify(dataUrl)};
    } catch (_) {}
  })();`
  void splashWindow.webContents.executeJavaScript(script, true).catch(() => {})
}

function createSplashWindow() {
  try {
    splashReady = false
    splashShownAt = 0
    splashCloseRequested = false
    splashWindow = new BrowserWindow({
      width: 520,
      height: 320,
      resizable: false,
      movable: true,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      frame: false,
      backgroundColor: '#f8fafc',
      show: false,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    })

    const splashPath = path.join(__dirname, 'splash.html')
    // 闪屏优先用 PNG（更清晰）；Windows 窗口/任务栏/安装包仍走 icon.ico
    const splashIconNames =
      process.platform === 'win32' ? ['icon.png', 'icon.ico'] : ['icon.png', 'icon.ico']
    const splashIconCandidates = splashIconNames.flatMap((name) =>
      isDev
        ? [path.join(__dirname, 'build', name)]
        : [getResourcePath('build', name), path.join(process.resourcesPath, 'app.asar.unpacked', 'build', name)]
    )
    let splashIconPath = ''
    for (const p of splashIconCandidates) {
      if (p && fs.existsSync(p)) {
        splashIconPath = p
        break
      }
    }
    let splashIconPngDataUrl = ''
    if (splashIconPath) {
      try {
        const img = nativeImage.createFromPath(splashIconPath)
        // 缩到闪屏实际尺寸，减小注入体积与解码时间
        const sized = img && !img.isEmpty() ? img.resize({ width: 152, height: 152 }) : null
        const png = sized && !sized.isEmpty() ? sized.toPNG() : null
        if (png && png.length) splashIconPngDataUrl = `data:image/png;base64,${png.toString('base64')}`
      } catch (_) {}
    }

    if (fs.existsSync(splashPath)) {
      // 不把大图塞进 loadFile query：过长 data URL 会拖慢/拖垮首次绘制，导致只见白闪
      splashWindow.loadFile(splashPath, {
        query: {
          name: APP_SPLASH_DISPLAY_NAME,
          tagline: APP_SPLASH_TAGLINE,
        },
      })
      splashWindow.webContents.once('did-finish-load', () => {
        injectSplashIcon(splashIconPngDataUrl)
      })
    } else {
      const fallbackSplashHtml = encodeURIComponent(
        '<!doctype html><html><body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Noto Sans SC,Microsoft YaHei,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;color:#475569;">正在启动，请稍候...</body></html>'
      )
      splashWindow.loadURL(`data:text/html;charset=utf-8,${fallbackSplashHtml}`)
    }

    const markSplashShown = () => {
      if (splashReady) return
      splashReady = true
      splashShownAt = Date.now()
      if (splashLoadWatchdogTimer) {
        try {
          clearTimeout(splashLoadWatchdogTimer)
        } catch (_) {}
        splashLoadWatchdogTimer = null
      }
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.show()
      }
      if (splashCloseRequested) {
        showMainAndCloseSplash()
      }
    }

    splashWindow.once('ready-to-show', markSplashShown)
    splashLoadWatchdogTimer = setTimeout(() => {
      splashLoadWatchdogTimer = null
      if (!splashReady) {
        console.warn('[启动] splash.load watchdog: forcing show')
        markSplashShown()
      }
    }, SPLASH_LOAD_WATCHDOG_MS)

    splashWindow.on('closed', () => {
      splashWindow = null
    })
  } catch (e) {
    splashWindow = null
    splashReady = true
    splashShownAt = 0
  }
}

// 查找打包的 Python 后端可执行文件或系统 Python
function findBackendExecutable() {
  // 优先查找打包的后端可执行文件（生产环境）
  if (!isDev) {
    const possibleExePaths = [
      getResourcePath('backend', 'dist', 'backend', 'backend.exe'),
      getResourcePath('backend', 'dist', 'backend.exe'),
      getResourcePath('backend', 'backend.exe'),
    ]
    for (const exePath of possibleExePaths) {
      if (fs.existsSync(exePath)) {
        console.log('找到打包的后端可执行文件:', exePath)
        return exePath
      }
    }
    console.log('未找到打包的后端可执行文件，将尝试使用系统Python')
  }

  // 开发模式优先项目内虚拟环境（搬家/多 Python 时避免误用 PATH 里未装依赖的解释器）
  {
    const projectRoot = path.join(__dirname, '..')
    const venvCandidates =
      process.platform === 'win32'
        ? [
            path.join(projectRoot, '.venv', 'Scripts', 'python.exe'),
            path.join(projectRoot, 'venv', 'Scripts', 'python.exe'),
            path.join(projectRoot, 'build_env', 'Scripts', 'python.exe'),
          ]
        : [
            path.join(projectRoot, '.venv', 'bin', 'python'),
            path.join(projectRoot, 'venv', 'bin', 'python'),
            path.join(projectRoot, 'build_env', 'bin', 'python3'),
          ]
    for (const pythonPath of venvCandidates) {
      if (fs.existsSync(pythonPath)) {
        console.log('使用项目虚拟环境 Python:', pythonPath)
        return pythonPath
      }
    }
  }

  // 再尝试当前进程 PATH 中的 python（开发环境或终端里装的通常能拿到）
  const pythonCommands = ['python3', 'python']
  for (const cmd of pythonCommands) {
    try {
      const result = execSync(`${cmd} --version`, { encoding: 'utf-8' })
      if (result) {
        console.log('使用系统Python:', cmd)
        return cmd
      }
    } catch (e) {
      // 继续尝试下一个
    }
  }

  // Windows：写死的常见安装路径 + 从用户环境 PATH 里找（解决从快捷方式启动时 PATH 不全的问题）
  if (process.platform === 'win32') {
    const u = os.userInfo().username
    const localAppData = process.env.LOCALAPPDATA || `C:\\Users\\${u}\\AppData\\Local`
    const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files'
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'
    const commonPaths = [
      'C:\\Python313\\python.exe', 'C:\\Python312\\python.exe', 'C:\\Python311\\python.exe',
      'C:\\Python310\\python.exe', 'C:\\Python39\\python.exe', 'C:\\Python38\\python.exe',
      `${programFiles}\\Python313\\python.exe`, `${programFiles}\\Python312\\python.exe`,
      `${programFiles}\\Python311\\python.exe`, `${programFiles}\\Python310\\python.exe`,
      `${localAppData}\\Programs\\Python\\Python313\\python.exe`,
      `${localAppData}\\Programs\\Python\\Python312\\python.exe`,
      `${localAppData}\\Programs\\Python\\Python311\\python.exe`,
      `${localAppData}\\Programs\\Python\\Python310\\python.exe`,
      `${localAppData}\\miniforge3\\python.exe`,
      `${localAppData}\\miniconda3\\python.exe`,
      `${localAppData}\\anaconda3\\python.exe`,
      `C:\\Users\\${u}\\AppData\\Local\\Programs\\Python\\Python311\\python.exe`,
      `C:\\Users\\${u}\\AppData\\Local\\Programs\\Python\\Python312\\python.exe`,
      `C:\\Users\\${u}\\AppData\\Local\\Programs\\Python\\Python310\\python.exe`,
    ]
    for (const pythonPath of commonPaths) {
      if (fs.existsSync(pythonPath)) {
        console.log('找到Python:', pythonPath)
        return pythonPath
      }
    }
    // 打包且从快捷方式启动时，process.env.PATH 常不包含用户 PATH，从注册表读用户 Path 再在目录里找 python.exe
    if (!isDev) {
      try {
        const pathStr = execSync(
          'powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable(\'Path\',\'User\')"',
          { encoding: 'utf-8', windowsHide: true, timeout: 5000 }
        )
        const dirs = (pathStr || '').trim().split(';').filter(Boolean)
        for (const dir of dirs) {
          const exe = path.join(dir.trim(), 'python.exe')
          if (fs.existsSync(exe)) {
            console.log('从用户 PATH 找到 Python:', exe)
            return exe
          }
        }
      } catch (e) {
        console.warn('读取用户 PATH 查找 Python 时出错:', e.message)
      }
    }
  }

  return null
}

async function isManagedBackendPid(pid) {
  if (process.platform !== 'win32') return false
  try {
    const { stdout } = await execAsync(
      `wmic process where processid=${pid} get CommandLine,ExecutablePath /format:list`,
      { encoding: 'utf-8', windowsHide: true, timeout: 5000 }
    )
    const text = String(stdout || '').toLowerCase().replace(/\//g, '\\')
    const resourceRoot = (!isDev ? process.resourcesPath : path.join(__dirname, '..')).toLowerCase().replace(/\//g, '\\')
    const backendRoot = getResourcePath('backend').toLowerCase().replace(/\//g, '\\')
    const isBackendCmd =
      text.includes('backend.exe') || text.includes('backend\\app.py') || text.includes('backend\\\\app.py')
    return isBackendCmd && (text.includes(resourceRoot) || text.includes(backendRoot))
  } catch (e) {
    console.warn('[后端] 无法确认 5000 端口进程归属:', e.message)
    return false
  }
}

/** Windows：仅结束本应用旧后端占用的 5000 端口 */
async function killProcessOnPort5000() {
  if (process.platform !== 'win32') return { unmanagedPids: [], killedCount: 0 }
  const unmanagedPids = []
  let killedCount = 0
  try {
    const { stdout } = await execAsync('netstat -ano', { encoding: 'utf-8', windowsHide: true })
    const lines = String(stdout || '').split(/\r?\n/)
    const pids = new Set()
    for (const line of lines) {
      if (!line.includes(':5000') || !line.includes('LISTENING')) continue
      const parts = line.trim().split(/\s+/)
      const pid = parts[parts.length - 1]
      if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid)
    }
    const managedFlags = await Promise.all(
      [...pids].map(async (pid) => ({ pid, managed: await isManagedBackendPid(pid) }))
    )
    for (const { pid, managed } of managedFlags) {
      if (!managed) {
        unmanagedPids.push(pid)
        console.warn('[后端] 5000 端口被非本应用进程占用，未结束 PID:', pid)
        continue
      }
      try {
        await execAsync(`taskkill /PID ${pid} /T /F`, { windowsHide: true })
        killedCount += 1
        console.log('[后端] 已结束占用 5000 端口的进程 PID:', pid)
      } catch (_) {
        /* 可能已退出 */
      }
    }
  } catch (e) {
    console.warn('[后端] 检查/结束 5000 端口进程时出错:', e.message)
  }
  return { unmanagedPids, killedCount }
}

function looksLikeBackendListenLog(chunk) {
  const s = String(chunk)
  return s.includes('Running on') || s.includes('127.0.0.1:5000')
}

function waitForBackendHttpReady(maxMs, intervalMs) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now()
    const tryOnce = () => {
      if (Date.now() - t0 > maxMs) {
        reject(
          new Error(
            `后端在 ${Math.round(maxMs / 1000)} 秒内未就绪（127.0.0.1:5000）。请检查 Python 依赖或防火墙；较慢磁盘可多等片刻后重启。`
          )
        )
        return
      }
      const req = http.get('http://127.0.0.1:5000/api/health', { timeout: 3000 }, (res) => {
        res.resume()
        if (res.statusCode === 200) resolve()
        else setTimeout(tryOnce, intervalMs)
      })
      req.on('error', () => setTimeout(tryOnce, intervalMs))
      req.on('timeout', () => {
        try {
          req.destroy()
        } catch (_) {}
        setTimeout(tryOnce, intervalMs)
      })
    }
    tryOnce()
  })
}

async function startBackend() {
  try {
    await waitForBackendHttpReady(1500, 200)
    console.log('[后端] 已有实例就绪，跳过启动')
    return
  } catch (_) {
    /* 需要启动新实例 */
  }

  const { unmanagedPids, killedCount } = await killProcessOnPort5000()
  if (unmanagedPids.length > 0) {
    throw new Error(`5000 端口已被占用（PID: ${unmanagedPids.join(', ')}）。请关闭占用进程后重试。`)
  }

  const delayBeforeSpawn =
    killedCount > 0 ? (process.platform === 'win32' ? 300 : 200) : 0
  const pollMaxMs = isDev ? 20000 : isWindows7KernelOrOlder() ? 120000 : 60000
  const pollIntervalMs = isWindows7KernelOrOlder() ? 600 : 400

  return new Promise((resolve, reject) => {
    function doSpawn() {
      const backendCmd = findBackendExecutable()
      if (!backendCmd) {
        reject(
          new Error(
            '未找到 Python 或打包的后端 backend.exe。\n\n建议：在项目目录运行 npm run build:python 后打包安装；开发模式请先 pip install -r requirements.txt 再启动。'
          )
        )
        return
      }

      const appRoot = getResourcePath()
      const backendDir = getResourcePath('backend')
      let backendProcessArgs = []
      const isBackendExe = backendCmd.replace(/\\/g, '/').endsWith('backend.exe')
      if (isBackendExe) {
        console.log('启动后端:', backendCmd)
        backendProcessArgs = []
      } else {
        const backendPath = getResourcePath('backend', 'app.py')
        if (!fs.existsSync(backendPath)) {
          reject(new Error(`后端文件不存在: ${backendPath}`))
          return
        }
        console.log(`使用 Python 启动: ${backendCmd} ${backendPath}`)
        backendProcessArgs = [backendPath]
      }

      const spawnCwd = backendProcessArgs.length === 0 ? backendDir : appRoot

      const backendEnv = {
        ...process.env,
        CINF_RESOURCE_ROOT: backendDir,
        CINF_ASSISTANT_LOCAL_DEPLOYMENT: LOCAL_AI_DEPLOYMENT_ENABLED ? '1' : '0',
      }
      console.log('[后端] 本地 AI 开关:', LOCAL_AI_DEPLOYMENT_ENABLED ? 'ON' : 'OFF')
      if (!isDev) {
        if (!backendEnv.CINF_LLAMACPP_NATIVE_PROBE) backendEnv.CINF_LLAMACPP_NATIVE_PROBE = '0'
        if (!backendEnv.CINF_LLAMACPP_N_THREADS) backendEnv.CINF_LLAMACPP_N_THREADS = '1'
        if (!backendEnv.CINF_LLAMACPP_N_THREADS_BATCH) backendEnv.CINF_LLAMACPP_N_THREADS_BATCH = '1'
      }
      try {
        const ggufDefault = path.join(backendDir, 'models', 'assistant.gguf')
        if (fs.existsSync(ggufDefault)) {
          backendEnv.CINF_LLAMACPP_GGUF = ggufDefault
        }
      } catch (_) {
        /* ignore */
      }

      let settled = false
      function settleOk(tag) {
        if (settled) return
        settled = true
        console.log('[后端] 就绪', tag ? `(${tag})` : '')
        resolve()
      }
      function settleFail(err) {
        if (settled) return
        settled = true
        reject(err)
      }

      backendProcess = spawn(backendCmd, backendProcessArgs, {
        cwd: spawnCwd,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
        env: backendEnv,
      })

      let backendOutput = ''
      let backendError = ''

      backendProcess.stdout.on('data', (data) => {
        const output = data.toString()
        backendOutput += output
        console.log(`[后端] ${output}`)
        if (looksLikeBackendListenLog(output)) settleOk('stdout')
      })

      backendProcess.stderr.on('data', (data) => {
        const error = data.toString()
        backendError += error
        console.error(`[后端 stderr] ${error}`)
        if (looksLikeBackendListenLog(error)) settleOk('stderr')
      })

      backendProcess.on('error', (err) => settleFail(err))

      backendProcess.on('exit', (code) => {
        if (code !== 0 && code !== null && !settled) {
          settleFail(
            new Error(`后端退出（代码 ${code}）：${(backendError || backendOutput || '').slice(0, 500)}`)
          )
        }
      })

      waitForBackendHttpReady(pollMaxMs, pollIntervalMs)
        .then(() => settleOk('http'))
        .catch((e) => {
          if (!settled) settleFail(e)
        })
    }

    if (delayBeforeSpawn > 0) {
      setTimeout(doSpawn, delayBeforeSpawn)
    } else {
      doSpawn()
    }
  })
}

// 创建主窗口
function createWindow() {
  if (appReadyFallbackTimer) {
    try {
      clearTimeout(appReadyFallbackTimer)
    } catch (_) {}
    appReadyFallbackTimer = null
  }
  appReadyHandled = false
  mainWindowReadyToShow = false

  const windowOptions = {
    // 与 CINF_Flow_Calculator（浆体输送）初始窗口尺寸一致
    width: 1600,
    height: 1080,
    minWidth: 1200,
    minHeight: 800,
    title: APP_DISPLAY_NAME,
    backgroundColor: '#111827',
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    // Windows 用默认标题栏，才能常显应用菜单（文件/编辑/查看…）
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false, // 先不显示，等加载完成后再显示
  }
  
  // 设置窗口图标：需在 electron/build 下放置 icon.ico（Windows）或 icon.png（macOS）
  const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png'
  const candidates = isDev
    ? [path.join(__dirname, 'build', iconName)]
    : [getResourcePath('build', iconName), path.join(process.resourcesPath, 'app.asar.unpacked', 'build', iconName)]
  let iconPath = null
  for (const p of candidates) {
    if (p && fs.existsSync(p)) {
      iconPath = p
      break
    }
  }
  if (iconPath) {
    windowOptions.icon = iconPath
  }
  
  mainWindow = new BrowserWindow(windowOptions)
  // Windows：确保本窗口挂上中文应用菜单并常显
  if (process.platform === 'win32') {
    mainWindow.setAutoHideMenuBar(false)
    mainWindow.setMenuBarVisibility(true)
    mainWindow.setMenu(Menu.getApplicationMenu())
  }

  // 开发环境加载本地服务器，生产环境加载打包后的文件（不自动打开 DevTools）
  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL)
    // 需要调试时可在控制台或菜单中手动打开 DevTools
  } else {
    // 生产环境：前端在 extraResources 的 frontend-dist（resources/frontend-dist），安装即覆盖，避免旧版缓存
    const indexPath = path.join(process.resourcesPath, 'frontend-dist', 'index.html')
    if (!fs.existsSync(indexPath)) {
      dialog.showErrorBox('启动失败', `未找到前端页面：\n${indexPath}\n\n请重新安装或使用 start.bat 启动。`)
      app.quit()
      return
    }
    const buildIdPath = path.join(process.resourcesPath, 'frontend-dist', 'build.json')
    let buildId = ''
    try {
      if (fs.existsSync(buildIdPath)) {
        buildId = JSON.parse(fs.readFileSync(buildIdPath, 'utf8')).buildId || ''
      }
    } catch (_) {}
    const loadOpts = buildId ? { query: { v: buildId } } : {}
    mainWindow.loadFile(indexPath, loadOpts)
  }

  // 主窗就绪且许可预热完成后关闪屏；渲染进程 app:ready 或 90s 兜底
  mainWindow.once('ready-to-show', () => {
    mainWindowReadyToShow = true
    tryEarlySplashClose()
    if (!appReadyHandled) {
      appReadyFallbackTimer = setTimeout(() => showMainAndCloseSplash({ force: true }), 90000)
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 处理窗口错误
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('页面加载失败:', errorCode, errorDescription)
    if (!isDev) {
      dialog.showErrorBox(
        '页面加载失败',
        `无法加载应用页面。\n\n错误代码: ${errorCode}\n错误描述: ${errorDescription}`
      )
    }
  })
}

// 配置自动更新（仅在生产环境）
if (!isDev) {
  // 注意：更新服务器 URL 需要在 electron-builder.yml 或 package.json 的 publish 配置中设置
  // 如果使用 GitHub Releases，需要设置环境变量 GH_TOKEN
  // 如果使用通用服务器，确保 URL 正确配置
  autoUpdater.autoDownload = false // 不自动下载，等待用户确认
  autoUpdater.autoInstallOnAppQuit = true // 应用退出时自动安装更新
  if (isWindows7KernelOrOlder()) {
    autoUpdater.channel = 'win7'
  }

  const gh = process.env.GH_TOKEN || process.env.GITHUB_TOKEN
  if (gh) {
    const t = String(gh).trim()
    const auth = /^(?:token|Bearer)\s/i.test(t) ? t : `token ${t}`
    autoUpdater.addAuthHeader(auth)
  }

  // 更新检查事件（仅在生产环境）
  autoUpdater.on('checking-for-update', () => {
    console.log('正在检查更新...')
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-checking')
    }
  })

  autoUpdater.on('update-available', (info) => {
    console.log('发现新版本:', info.version)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes || '新版本可用'
      })
    }
  })

  autoUpdater.on('update-not-available', (info) => {
    console.log('当前已是最新版本:', info.version)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-not-available', {
        version: info.version
      })
    }
  })

  autoUpdater.on('error', (err) => {
    console.error('更新检查错误:', err)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-error', {
        message: err.message || '更新检查失败'
      })
    }
  })

  autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-download-progress', {
        percent: Math.round(progressObj.percent),
        transferred: progressObj.transferred,
        total: progressObj.total
      })
    }
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('更新下载完成:', info.version)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-downloaded', {
        version: info.version
      })
    }
  })
}

// IPC 处理程序
ipcMain.handle('check-for-updates', async () => {
  if (isDev) {
    return { error: '开发模式下无法检查更新' }
  }
  try {
    await autoUpdater.checkForUpdates()
    return { success: true }
  } catch (error) {
    return { error: (error && error.message) || String(error) }
  }
})

ipcMain.handle('download-update', async () => {
  if (isDev) {
    return { error: '开发模式下无法下载更新' }
  }
  try {
    await autoUpdater.downloadUpdate()
    return { success: true }
  } catch (error) {
    return { error: (error && error.message) || String(error) }
  }
})

ipcMain.handle('install-update', async () => {
  if (isDev) {
    return { error: '开发模式下无法安装更新' }
  }
  autoUpdater.quitAndInstall(false, true)
  return { success: true }
})

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('get-deploy-info', () => ({
  assistantLocalDeploy: LOCAL_AI_DEPLOYMENT_ENABLED,
  version: app.getVersion(),
  packaged: app.isPackaged,
}))

ipcMain.on('app:ready', () => {
  showMainAndCloseSplash()
})

ipcMain.handle('window:get-chrome', () => ({
  platform: process.platform,
  // Windows 已改回默认标题栏以常显菜单，不再使用 titleBarOverlay
  usesTitleBarOverlay: false,
  titleBarHeight: 0,
}))

ipcMain.handle('window:set-titlebar-overlay', (event, payload) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win || process.platform !== 'win32' || typeof win.setTitleBarOverlay !== 'function') {
      return { ok: false }
    }
    const dark = Boolean(payload?.dark)
    win.setTitleBarOverlay({
      color: dark ? '#111827' : '#f9fafb',
      symbolColor: dark ? '#e5e7eb' : '#111827',
      height: 36,
    })
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error?.message ?? String(error) }
  }
})

ipcMain.handle('license:get-cached-status', () => {
  return license.getCachedLicenseStatus()
})

ipcMain.handle('license:get-status', async () => {
  const cached = license.getCachedLicenseStatus()
  if (cached) return cached
  return license.prewarmLicenseStatus(isDev)
})

ipcMain.handle('license:activate', async (_e, token) => {
  return license.activateWithToken(isDev, token)
})

/** 通用「另存为」：后缀由调用方给出，data 支持文本与二进制 */
ipcMain.handle('export:save-file', async (event, payload) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender)
    const rawName = typeof payload?.fileName === 'string' ? payload.fileName : 'export.txt'
    const baseName = path.basename(rawName).replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    const ext = path.extname(baseName).replace(/^\./, '').toLowerCase()
    const filters = Array.isArray(payload?.filters) && payload.filters.length > 0
      ? payload.filters
      : ext
        ? [{ name: ext.toUpperCase(), extensions: [ext] }, { name: '所有文件', extensions: ['*'] }]
        : [{ name: '所有文件', extensions: ['*'] }]
    const result = await dialog.showSaveDialog(win ?? undefined, {
      title: typeof payload?.title === 'string' ? payload.title : '另存为',
      defaultPath: baseName,
      filters,
    })
    if (result.canceled || !result.filePath) {
      return { ok: false, cancelled: true }
    }
    let filePath = result.filePath
    if (ext && !new RegExp(`\\.${ext}$`, 'i').test(filePath)) {
      filePath = `${filePath}.${ext}`
    }
    const data = payload?.data
    if (typeof data === 'string') {
      fs.writeFileSync(filePath, data, payload?.encoding === 'base64' ? 'base64' : 'utf8')
    } else {
      const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data ?? []
      fs.writeFileSync(filePath, Buffer.from(bytes))
    }
    return { ok: true, filePath }
  } catch (error) {
    return { ok: false, error: error?.message ?? String(error) }
  }
})

// 应用准备就绪
app.whenReady().then(async () => {
  const startupT0 = Date.now()
  const mark = (label) => console.log(`[启动] ${label}: +${Date.now() - startupT0}ms`)
  try {
    license.setElectronApp(app)
    mark('license.init')
    Menu.setApplicationMenu(buildApplicationMenu())
    mark('menu.ready')
    createSplashWindow()
    mark('splash.created')

    const licensePrewarmPromise = license.prewarmLicenseStatus(isDev)
    setupEarlySplashClose(licensePrewarmPromise)

    createWindow()
    mark('window.created')

    startBackend()
      .then(() => mark('backend.ready'))
      .catch((err) => {
        console.error('[后端] 后台启动失败:', err && err.message ? err.message : err)
      })

    void licensePrewarmPromise.then(() => mark('license.prewarm'))

    if (!isDev) {
      setTimeout(() => {
        autoUpdater.checkForUpdates().catch((err) => {
          console.error('自动检查更新失败:', err)
        })
      }, 5000)
    }
  } catch (error) {
    console.error('启动失败:', error)
    const msg = error && error.message
    dialog.showErrorBox('启动失败', `应用启动失败：${msg || error}`)
    app.quit()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 彻底结束后端进程（含子进程），避免关闭软件后进程残留
function killBackendAndQuit() {
  if (!backendProcess) return
  const pid = backendProcess.pid
  if (pid == null) {
    backendProcess = null
    return
  }
  try {
    if (process.platform === 'win32') {
      // Windows: 用 taskkill /T /F 结束该进程及其子进程树，避免 Python/Flask 子进程残留导致 Electron 不退出
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore', windowsHide: true })
    } else {
      backendProcess.kill('SIGKILL')
    }
  } catch (e) {
    try { backendProcess.kill('SIGKILL') } catch (_) {}
  }
  backendProcess = null
}

// 所有窗口关闭时
app.on('window-all-closed', () => {
  killBackendAndQuit()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 应用退出前
app.on('before-quit', () => {
  killBackendAndQuit()
})

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error)
  if (mainWindow && !mainWindow.isDestroyed()) {
    dialog.showErrorBox('应用错误', `发生未预期的错误：${error.message}`)
  }
})
