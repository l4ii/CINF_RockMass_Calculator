/**
 * 在 frontend 目录下执行 Vite 构建，确保输出到 frontend/dist。
 * 避免从项目根用 --prefix 时 cwd 不确定导致构建写到错误位置、安装包打到旧前端。
 */
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

const frontendDir = path.join(__dirname, '..', 'frontend')
const distDir = path.join(frontendDir, 'dist')
const viteCacheDir = path.join(frontendDir, 'node_modules', '.vite')
const rootDir = path.join(__dirname, '..')

function syncAppIcons() {
  const script = path.join(__dirname, 'sync-app-icons.py')
  if (!fs.existsSync(script)) return
  console.log('同步应用图标...')
  execSync(`python "${script}"`, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    windowsHide: true,
  })
}

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

syncAppIcons()

if (fs.existsSync(distDir)) {
  console.log('清理:', distDir)
  removeDir(distDir)
}
if (fs.existsSync(viteCacheDir)) {
  console.log('清理 Vite 缓存:', viteCacheDir)
  removeDir(viteCacheDir)
}

const buildId = Date.now().toString()
console.log('在 frontend 目录执行: npx vite build')
console.log('工作目录:', frontendDir)
execSync('npx vite build', {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true,
  windowsHide: true,
})

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('ERROR: 构建后未找到 frontend/dist/index.html')
  process.exit(1)
}
fs.writeFileSync(path.join(distDir, 'build.json'), JSON.stringify({ buildId }, null, 0), 'utf8')
console.log('前端构建完成:', path.join(distDir, 'index.html'), 'buildId:', buildId)
