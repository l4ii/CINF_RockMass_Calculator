/**
 * 开发启动前清理本项目的旧 Vite / Electron / Flask 进程，避免 5173 被占用后
 * Vite 静默换端口而 Electron 仍加载 localhost:5173，导致窗口闪退或界面无法打开。
 */
const { execSync } = require('child_process')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const rootNorm = projectRoot.toLowerCase().replace(/\//g, '\\')
const DEV_PORTS = [5173, 5174, 5175, 5176, 5000]

function getListeningPids(port) {
  if (process.platform === 'win32') {
    try {
      const out = execSync('netstat -ano', { encoding: 'utf-8', windowsHide: true })
      const pids = new Set()
      for (const line of out.split(/\r?\n/)) {
        if (!line.includes(`:${port}`) || !line.includes('LISTENING')) continue
        const parts = line.trim().split(/\s+/)
        const pid = parts[parts.length - 1]
        if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid)
      }
      return [...pids]
    } catch {
      return []
    }
  }
  try {
    const out = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, { encoding: 'utf-8' })
    return out
      .trim()
      .split('\n')
      .filter(Boolean)
  } catch {
    return []
  }
}

function getCommandLine(pid) {
  try {
    if (process.platform === 'win32') {
      const out = execSync(`wmic process where processid=${pid} get CommandLine /format:list`, {
        encoding: 'utf-8',
        windowsHide: true,
        timeout: 5000,
      })
      return String(out || '')
    }
    return execSync(`ps -p ${pid} -o args=`, { encoding: 'utf-8' })
  } catch {
    return ''
  }
}

function shouldKillDevProcess(pid, port) {
  const cmd = getCommandLine(pid).toLowerCase().replace(/\//g, '\\')
  if (!cmd) return false

  if (port === 5000) {
    const isBackend =
      cmd.includes('backend\\app.py') ||
      cmd.includes('backend\\\\app.py') ||
      (cmd.includes('backend.exe') && cmd.includes(rootNorm))
    return isBackend && cmd.includes(rootNorm)
  }

  if (![5173, 5174, 5175, 5176].includes(port)) return false

  if (cmd.includes(rootNorm) && (cmd.includes('vite') || cmd.includes('electron'))) {
    return true
  }
  if (cmd.includes('vite') && cmd.includes('node_modules')) {
    return true
  }
  return false
}

function killPid(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore', windowsHide: true })
    } else {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' })
    }
    return true
  } catch {
    return false
  }
}

for (const port of DEV_PORTS) {
  for (const pid of getListeningPids(port)) {
    if (!shouldKillDevProcess(pid, port)) continue
    if (killPid(pid)) {
      console.log(`[dev] 已结束占用 ${port} 端口的旧进程 PID: ${pid}`)
    }
  }
}
