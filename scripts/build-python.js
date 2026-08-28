const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

const backendDir = path.join(__dirname, '..', 'backend')
const projectRoot = path.join(__dirname, '..')
const buildScript = path.join(backendDir, 'build_backend.py')
const buildEnvDir = path.join(projectRoot, 'build_env')
const venvPython =
  os.platform() === 'win32'
    ? path.join(buildEnvDir, 'Scripts', 'python.exe')
    : path.join(buildEnvDir, 'bin', 'python3')
const localAiEnabledRaw = String(process.env.CINF_PACK_LOCAL_AI || '1').trim().toLowerCase()
const localAiEnabled = !['0', 'false', 'off', 'no'].includes(localAiEnabledRaw)
const requirementsTxt = path.join(projectRoot, localAiEnabled ? 'requirements.txt' : 'requirements.noai.txt')
const systemPython = os.platform() === 'win32' ? 'python' : 'python3'

const LLAMA_CPP_EXTRA_INDEX = 'https://abetlen.github.io/llama-cpp-python/whl/cpu'
const PYINSTALLER_MODE = (process.env.CINF_PYINSTALLER_MODE || 'onefile').trim()

function pipEnvWithLlamaIndex() {
  if (!localAiEnabled) return { ...process.env }
  return {
    ...process.env,
    PIP_EXTRA_INDEX_URL: LLAMA_CPP_EXTRA_INDEX,
  }
}

function createVenvWindows() {
  const cmds = [
    `py -3.11 -m venv "${buildEnvDir}"`,
    `py -3.10 -m venv "${buildEnvDir}"`,
    `python -m venv "${buildEnvDir}"`,
  ]
  let lastErr
  for (const cmd of cmds) {
    try {
      execSyncSafe(cmd)
      return
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr
}

function execSyncSafe(cmd) {
  const { execSync } = require('child_process')
  execSync(cmd, {
    stdio: 'inherit',
    cwd: projectRoot,
    windowsHide: true,
    shell: true,
  })
}

function ensureBuildEnv() {
  if (fs.existsSync(venvPython)) {
    return venvPython
  }
  console.log('创建 build_env 虚拟环境…')
  if (os.platform() === 'win32') {
    createVenvWindows()
  } else {
    execSyncSafe(`"${systemPython}" -m venv "${buildEnvDir}"`)
  }
  if (localAiEnabled) {
    execSyncSafe(
      `"${venvPython}" -m pip install "llama-cpp-python>=0.3.0" --upgrade --prefer-binary --extra-index-url ${LLAMA_CPP_EXTRA_INDEX}`
    )
  }
  execSyncSafe(`"${venvPython}" -m pip install -r "${requirementsTxt}" --prefer-binary`)
  console.log('build_env 就绪。')
  return venvPython
}

function ensurePythonDepsForPackaging(pythonExe) {
  const env = pipEnvWithLlamaIndex()
  if (localAiEnabled) {
    execSyncSafe(
      `"${pythonExe}" -m pip install "llama-cpp-python>=0.3.0" --upgrade --prefer-binary --extra-index-url ${LLAMA_CPP_EXTRA_INDEX}`
    )
  }
  execSyncSafe(`"${pythonExe}" -m pip install -r "${requirementsTxt}" --prefer-binary`)
}

let pythonCmd = fs.existsSync(venvPython) ? venvPython : ensureBuildEnv()
console.log('Python:', pythonCmd)
console.log('PyInstaller 模式:', PYINSTALLER_MODE)
console.log('本地 AI 打包:', localAiEnabled ? '是' : '否')

try {
  ensurePythonDepsForPackaging(pythonCmd)
} catch (e) {
  console.error('[build-python] 依赖失败:', e.message)
  process.exit(1)
}

if (localAiEnabled) {
  try {
    execSyncSafe(`"${pythonCmd}" -c "import llama_cpp; print('llama_cpp ok')"`)
  } catch {
    console.error('无法导入 llama_cpp，参阅 backend/README_ASSISTANT_LLM.txt')
    process.exit(1)
  }
}

if (!fs.existsSync(buildScript)) {
  console.error('缺少:', buildScript)
  process.exit(1)
}

const buildEnv = {
  ...process.env,
  CINF_PYINSTALLER_MODE: PYINSTALLER_MODE,
  CINF_PACK_LOCAL_AI: localAiEnabled ? '1' : '0',
}

const proc = exec(
  `"${pythonCmd}" "${buildScript}"`,
  { cwd: backendDir, encoding: 'utf8', env: buildEnv },
  (err, stdout, stderr) => {
    if (err) {
      console.error(stderr || err.message)
      process.exit(err.code || 1)
    }
  }
)
proc.stdout.on('data', (d) => process.stdout.write(d))
proc.stderr.on('data', (d) => process.stderr.write(d))
proc.on('close', (code) => {
  if (code === 0) console.log('Python 后端构建完成')
  else process.exit(code || 1)
})
