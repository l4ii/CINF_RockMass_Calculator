const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const root = path.join(__dirname, '..')
const arg = process.argv[2]
// release: 只清 release；release-win7: 只清 release-win7；frontend: 只清 frontend/dist；legacy: 只清 release-win7+frontend（不动 release）
const onlyRelease = arg === 'release' || arg === 'release-win7' || arg === 'release-ai'
const releaseDir =
  arg === 'release-win7' ? 'release-win7' : arg === 'release-ai' ? 'release-ai' : 'release'
const legacyClean = arg === 'legacy'
const frontendOnly = arg === 'frontend'

function removeDir(dir) {
  if (!fs.existsSync(dir)) return
  fs.readdirSync(dir).forEach((file) => {
    const curPath = path.join(dir, file)
    const stat = fs.lstatSync(curPath)
    if (stat.isDirectory()) removeDir(curPath)
    else try { fs.unlinkSync(curPath) } catch (_) {}
  })
  try { fs.rmdirSync(dir) } catch (_) {}
}

function forceRemoveWin(dir) {
  const full = path.join(root, dir)
  if (!fs.existsSync(full)) return
  try { execSync('taskkill /f /im electron.exe 2>nul', { stdio: 'ignore', windowsHide: true }) } catch (_) {}
  try { execSync(`rd /s /q "${full}"`, { stdio: 'ignore', windowsHide: true }) } catch (e) { removeDir(full) }
  const end = Date.now() + 2000
  while (Date.now() < end) {}
}

const toClean = legacyClean
  ? ['release-win7', 'frontend/dist']
  : frontendOnly
    ? ['frontend/dist']
    : onlyRelease
      ? [releaseDir]
      : ['release', 'release-win7', 'frontend/dist']
toClean.forEach((name) => {
  const dir = path.join(root, name)
  if (!fs.existsSync(dir)) return
  console.log('清理:', dir)
  if (process.platform === 'win32' && (name === 'release' || name === 'release-win7' || name === 'release-ai')) forceRemoveWin(name)
  else removeDir(dir)
})
console.log('清理完成')
