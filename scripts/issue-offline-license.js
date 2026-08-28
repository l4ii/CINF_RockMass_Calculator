/**
 * 根据设备码签发离线授权码（一行）。
 * 用法: node scripts/issue-offline-license.js <64位十六进制设备码> [expiryUnix]
 * 授权码前缀 CINF-ROCK-LIC1.（岩体质量与分级产品线专用）。
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const TOKEN_PREFIX = 'CINF-ROCK-LIC1.'

const root = path.join(__dirname, '..')
const privPath = path.join(root, 'scripts', 'license-private.pem')

const machineId = (process.argv[2] || '').trim().toLowerCase()
const expArg = process.argv[3]

if (!/^[0-9a-f]{64}$/i.test(machineId)) {
  console.error('用法: node scripts/issue-offline-license.js <64位十六进制设备码> [expiryUnix|null]')
  process.exit(1)
}

if (!fs.existsSync(privPath)) {
  console.error('缺少私钥:', privPath)
  console.error('请先在项目根目录执行: node scripts/generate-offline-license-keys.js')
  process.exit(1)
}

let exp = null
if (expArg != null && expArg !== '' && String(expArg).toLowerCase() !== 'null') {
  const n = parseInt(String(expArg), 10)
  if (!Number.isFinite(n)) {
    console.error('到期时间须为 Unix 秒数或 null')
    process.exit(1)
  }
  exp = n
}

const payload = { v: 1, m: machineId, exp }
const msg = Buffer.from(JSON.stringify(payload), 'utf8')
const privateKey = crypto.createPrivateKey(fs.readFileSync(privPath, 'utf8'))
const sig = crypto.sign(null, msg, privateKey)
const token = TOKEN_PREFIX + msg.toString('base64url') + '.' + sig.toString('base64url')
console.log(token)
