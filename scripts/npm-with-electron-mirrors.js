#!/usr/bin/env node
/** 在注入 Electron 镜像环境变量后执行 npm（避免把镜像写进 .npmrc 触发 npm 11+ 告警）。 */
require('./electron-mirrors')
const { spawnSync } = require('child_process')

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('用法: node scripts/npm-with-electron-mirrors.js <npm-args...>')
  process.exit(1)
}

const result = spawnSync('npm', args, {
  stdio: 'inherit',
  shell: true,
  env: process.env,
  windowsHide: true,
})
process.exit(result.status == null ? 1 : result.status)
