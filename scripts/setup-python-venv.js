/**
 * 创建/复用项目根 .venv，并安装后端依赖（开发模式 Electron 会优先使用该解释器）。
 * 搬家或换机后执行：npm run setup:python
 */
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')
const os = require('os')

const root = path.join(__dirname, '..')
const venvDir = path.join(root, '.venv')
const requirementsTxt = path.join(root, 'requirements.noai.txt')
const isWin = os.platform() === 'win32'
const venvPython = isWin
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python')

function run(cmd, opts = {}) {
  console.log('>', cmd)
  execSync(cmd, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    windowsHide: true,
    ...opts,
  })
}

function resolveBasePython() {
  const candidates = []
  if (isWin) {
    const local = process.env.LOCALAPPDATA || ''
    candidates.push(
      path.join(local, 'miniforge3', 'python.exe'),
      path.join(local, 'miniconda3', 'python.exe'),
      path.join(local, 'anaconda3', 'python.exe'),
      path.join(local, 'Programs', 'Python', 'Python313', 'python.exe'),
      path.join(local, 'Programs', 'Python', 'Python312', 'python.exe'),
      path.join(local, 'Programs', 'Python', 'Python311', 'python.exe'),
      'C:\\Python313\\python.exe',
      'C:\\Python312\\python.exe',
      'C:\\Python311\\python.exe',
      'C:\\Python310\\python.exe'
    )
  }
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return `"${p}"`
  }
  // 避免优先命中过新的系统 Python（如 3.14）导致依赖无 wheel
  try {
    execSync('py -3.13 -c "import sys"', { stdio: 'ignore', windowsHide: true, shell: true })
    return 'py -3.13'
  } catch (_) {}
  try {
    execSync('py -3.12 -c "import sys"', { stdio: 'ignore', windowsHide: true, shell: true })
    return 'py -3.12'
  } catch (_) {}
  try {
    execSync('py -3.11 -c "import sys"', { stdio: 'ignore', windowsHide: true, shell: true })
    return 'py -3.11'
  } catch (_) {}
  return isWin ? 'python' : 'python3'
}

if (!fs.existsSync(venvPython)) {
  const base = resolveBasePython()
  console.log('创建虚拟环境 .venv，基础解释器:', base)
  run(`${base} -m venv "${venvDir}"`)
} else {
  console.log('已存在虚拟环境:', venvPython)
}

run(`"${venvPython}" -m pip install --upgrade pip`)
run(`"${venvPython}" -m pip install -r "${requirementsTxt}" --prefer-binary`)
run(`"${venvPython}" -c "import flask, flask_cors, numpy; print('OK', flask.__name__, numpy.__version__)"`)
console.log('完成。开发启动时 Electron 会优先使用:', venvPython)
