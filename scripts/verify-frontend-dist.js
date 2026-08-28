/**
 * 在打包前确认 frontend/dist 存在且包含本次构建产物，避免把旧/空前端打进安装包。
 * 必须在 scripts/build-frontend.js 之后、electron-builder 之前运行。
 */
const path = require('path')
const fs = require('fs')

const root = path.join(__dirname, '..')
const distDir = path.join(root, 'frontend', 'dist')
const indexHtml = path.join(distDir, 'index.html')
const buildJson = path.join(distDir, 'build.json')

if (!fs.existsSync(indexHtml)) {
  console.error('ERROR: 未找到 frontend/dist/index.html，无法打包。请先运行 node scripts/build-frontend.js')
  process.exit(1)
}

let buildId = ''
if (fs.existsSync(buildJson)) {
  try {
    buildId = JSON.parse(fs.readFileSync(buildJson, 'utf8')).buildId || ''
  } catch (_) {}
}
const mtime = fs.statSync(indexHtml).mtime
console.log('[verify-frontend-dist] frontend/dist 就绪:', indexHtml)
console.log('[verify-frontend-dist] 构建时间:', mtime.toISOString(), buildId ? 'buildId=' + buildId : '')
