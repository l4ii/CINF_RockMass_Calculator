/**
 * electron-builder 前暂存 GGUF（常被 .gitignore，构建机自备）。
 * 输出：build/pack-resources/backend/models/assistant.gguf
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const src = path.resolve(process.env.CINF_ASSISTANT_GGUF || path.join(root, 'backend', 'models', 'assistant.gguf'))
const destDir = path.join(root, 'build', 'pack-resources', 'backend', 'models')
const dest = path.join(destDir, 'assistant.gguf')
const localAiEnabledRaw = String(process.env.CINF_PACK_LOCAL_AI || '1').trim().toLowerCase()
const localAiEnabled = !['0', 'false', 'off', 'no'].includes(localAiEnabledRaw)

fs.mkdirSync(destDir, { recursive: true })

if (!localAiEnabled) {
  if (fs.existsSync(dest)) {
    try {
      fs.unlinkSync(dest)
    } catch (_) {
      /* ignore */
    }
  }
  console.log('[stage-pack-resources] CINF_PACK_LOCAL_AI=0，跳过 GGUF。')
  process.exit(0)
}

if (!fs.existsSync(src)) {
  console.error(
    '[stage-pack-resources] 未找到 GGUF，无法打入 AI 安装包。\n' +
      `  放置到: ${path.join(root, 'backend', 'models', 'assistant.gguf')}\n` +
      '  或设置 CINF_ASSISTANT_GGUF 指向 .gguf 文件。\n' +
      '  不需要 AI 时请使用 npm run dist:win:noai（CINF_PACK_LOCAL_AI=0）。'
  )
  process.exit(1)
}

fs.copyFileSync(src, dest)
console.log('[stage-pack-resources] 已复制:', dest)
