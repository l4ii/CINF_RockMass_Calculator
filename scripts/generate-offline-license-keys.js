/**
 * 生成 Ed25519 密钥对：
 * - electron/license-public.pem  随仓库/安装包分发
 * - scripts/license-private.pem  仅本机保留，用于签发授权码；已加入 .gitignore
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const root = path.join(__dirname, '..')
const pubOut = path.join(root, 'electron', 'license-public.pem')
const privOut = path.join(root, 'scripts', 'license-private.pem')

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519')
const pubPem = publicKey.export({ type: 'spki', format: 'pem' })
const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' })

fs.writeFileSync(pubOut, pubPem, 'utf8')
fs.writeFileSync(privOut, privPem, 'utf8')
console.log('已写入:', pubOut)
console.log('已写入:', privOut)
console.log('请妥善保管私钥，勿提交到公开仓库。')
