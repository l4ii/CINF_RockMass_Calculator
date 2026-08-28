/**
 * 为 @electron/get / electron-builder 设置国内镜像（环境变量，非 .npmrc）。
 * 在构建脚本开头 require 即可；已存在的环境变量不会被覆盖。
 *
 * 另：Windows 上解压 winCodeSign 时会因 darwin 符号链接缺少权限失败；
 * 若本机 %LOCALAPPDATA% 已有完整缓存，则自动复制到项目缓存，避免反复下载解压。
 */
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const defaults = {
  ELECTRON_MIRROR: 'https://npmmirror.com/mirrors/electron/',
  ELECTRON_BUILDER_BINARIES_MIRROR: 'https://npmmirror.com/mirrors/electron-builder-binaries/',
  ELECTRON_BUILDER_CACHE: path.join(__dirname, '..', '.electron-builder-cache'),
  // 跳过自动代码签名探测（本项目 win.sign=null，仍可能触发 winCodeSign 下载）
  CSC_IDENTITY_AUTO_DISCOVERY: 'false',
}

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) process.env[key] = value
}

function ensureWinCodeSignCache() {
  if (process.platform !== 'win32') return

  const cacheRoot = process.env.ELECTRON_BUILDER_CACHE
  const dest = path.join(cacheRoot, 'winCodeSign', 'winCodeSign-2.6.0')
  const marker = path.join(dest, 'rcedit-x64.exe')
  if (fs.existsSync(marker)) return

  const localAppData = process.env.LOCALAPPDATA
  if (!localAppData) return

  const src = path.join(localAppData, 'electron-builder', 'Cache', 'winCodeSign', 'winCodeSign-2.6.0')
  if (!fs.existsSync(path.join(src, 'rcedit-x64.exe'))) return

  fs.mkdirSync(path.dirname(dest), { recursive: true })
  const result = spawnSync(
    'robocopy',
    [src, dest, '/E', '/COPY:DAT', '/R:1', '/W:1', '/NFL', '/NDL', '/NJH', '/NJS', '/NP'],
    { windowsHide: true, encoding: 'utf8' }
  )
  // robocopy: exit codes 0–7 indicate success with various copy states
  const code = result.status == null ? 16 : result.status
  if (code >= 8 || !fs.existsSync(marker)) {
    console.warn('[electron-mirrors] 无法从本机缓存复制 winCodeSign-2.6.0，打包时若遇符号链接错误，请开启「开发人员模式」或以管理员运行终端后重试。')
    return
  }
  console.log('[electron-mirrors] 已复用本机 winCodeSign-2.6.0 缓存，跳过有问题的解压步骤')
}

ensureWinCodeSignCache()

module.exports = defaults
