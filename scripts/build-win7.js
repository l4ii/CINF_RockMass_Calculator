/**
 * 打包 Win7/8 兼容版：临时切换到 Electron 22，打包后恢复 Electron 28
 * 输出目录：release-win7，安装包名带 -Win7兼容
 * 需先完成前端构建与（可选）后端打包，再执行本脚本
 */
require('./electron-mirrors')
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

const root = path.join(__dirname, '..')
const packagePath = path.join(root, 'package.json')
const ELECTRON_WIN7 = '22.3.27'

function readPackage() {
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'))
}

function writePackage(pkg) {
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
}

function run(cmd, opts = {}) {
  console.log('>', cmd)
  execSync(cmd, { cwd: root, stdio: 'inherit', windowsHide: true, ...opts })
}

let savedElectron
try {
  const pkg = readPackage()
  savedElectron = pkg.devDependencies && pkg.devDependencies.electron
  if (!savedElectron) {
    console.error('package.json 中未找到 devDependencies.electron')
    process.exit(1)
  }

  console.log('\n[Win7 兼容版] 切换到 Electron', ELECTRON_WIN7, '...')
  pkg.devDependencies.electron = ELECTRON_WIN7
  writePackage(pkg)

  run('npm install')
  run('npx electron-builder --win --config electron-builder.win7.yml')

  console.log('\n[Win7 兼容版] 打包完成，恢复 Electron', savedElectron, '...')
  pkg.devDependencies.electron = savedElectron
  writePackage(pkg)
  run('npm install')

  console.log('\nWin7/8 兼容版已输出到: release-win7/')
} catch (e) {
  if (savedElectron !== undefined) {
    try {
      const pkg = readPackage()
      pkg.devDependencies.electron = savedElectron
      writePackage(pkg)
      run('npm install')
      console.log('已恢复 package.json 中的 Electron 版本')
    } catch (_) {}
  }
  throw e
}
