/**
 * electron-builder 自带 NSIS 模板的幂等补丁，改善安装过程的用户体验：
 *
 *   1) assistedInstaller.nsh：
 *      - 在「选择安装目录」之前插入 customPageBeforeChangeDir（可为空宏，仅保留插入点）
 *      - 若检测到历史补丁（自动点击 1027 展开详情面板）则回滚：
 *        现已改为隐藏整个详情面板（见 electron/build/installer.nsh 中的
 *        ShowInstDetails hide / ShowUninstDetails hide），无需再自动展开
 *   2) installSection.nsh：把底层文件操作日志静音，改为显示几条中文阶段提示
 *      - 顶部 SetDetailsPrint 规范化为 textonly（只显示 DetailPrint 文字，
 *        不显示 File/CopyFiles/Nsis7z 的文件名与错误）
 *      - 「卸载旧版本」期间整段 SetDetailsPrint none
 *      - 「解压程序文件」期间整段 SetDetailsPrint none
 *      - 阶段切换点前 DetailPrint 中文提示（同时刷新底部状态栏）
 *
 * 补丁具有严格的幂等性：检测到对应标记即跳过；从旧 v1 / 原始状态都能升级。
 */
const fs = require('fs')
const path = require('path')

const OLD_PROJECTS = ['MetCal', 'FlowCal']
const MARK_BEFORE_DIR = '; [MetCal] customPageBeforeChangeDir (serial before directory)'
const MARK_SECTION_V2 = '; [MetCal v2] friendly install stages'

const assistedPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'app-builder-lib',
  'templates',
  'nsis',
  'assistedInstaller.nsh'
)
const installSectionPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'app-builder-lib',
  'templates',
  'nsis',
  'installSection.nsh'
)

function rollbackAutoExpandBlocks(s) {
  let next = s
  for (const project of OLD_PROJECTS) {
    const installMark = `; [${project}] MUI_PAGE_INSTFILES show details`
    if (next.includes(installMark)) {
      const re =
        new RegExp(`\\r?\\n {2}; \\[${project}\\] MUI_PAGE_INSTFILES show details\\r?\\n {2}!define MUI_PAGE_CUSTOMFUNCTION_SHOW ${project}MuiInstFilesShow\\r?\\n {2}Function ${project}MuiInstFilesShow\\r?\\n(?: {4}.*\\r?\\n)+? {2}FunctionEnd\\r?\\n\\r?\\n {2}!insertmacro MUI_PAGE_INSTFILES`)
      if (!re.test(next)) {
        console.error(`[apply-nsis-patches] assistedInstaller.nsh 含 ${installMark} 但无法匹配完整块，请手工检查`)
        process.exit(1)
      }
      next = next.replace(re, '\n  !insertmacro MUI_PAGE_INSTFILES')
    }

    const uninstallMark = `; [${project}] MUI_UNPAGE_INSTFILES show details`
    if (next.includes(uninstallMark)) {
      const re =
        new RegExp(`\\r?\\n {2}; \\[${project}\\] MUI_UNPAGE_INSTFILES show details\\r?\\n {2}!define MUI_PAGE_CUSTOMFUNCTION_SHOW un\\.${project}MuiUnInstFilesShow\\r?\\n {2}Function un\\.${project}MuiUnInstFilesShow\\r?\\n(?: {4}.*\\r?\\n)+? {2}FunctionEnd\\r?\\n\\r?\\n {2}!insertmacro MUI_UNPAGE_INSTFILES`)
      if (!re.test(next)) {
        console.error(`[apply-nsis-patches] assistedInstaller.nsh 含 ${uninstallMark} 但无法匹配完整块，请手工检查`)
        process.exit(1)
      }
      next = next.replace(re, '\n  !insertmacro MUI_UNPAGE_INSTFILES')
    }
  }
  return next
}

function patchAssistedInstaller() {
  if (!fs.existsSync(assistedPath)) {
    console.warn('[apply-nsis-patches] 跳过：未找到', assistedPath)
    return
  }
  let s = fs.readFileSync(assistedPath, 'utf8')
  const original = s

  s = rollbackAutoExpandBlocks(s)

  if (!s.includes(MARK_BEFORE_DIR)) {
    const needleBeforeDir =
      '  !ifndef INSTALL_MODE_PER_ALL_USERS\n' +
      '    !insertmacro PAGE_INSTALL_MODE\n' +
      '  !endif\n' +
      '\n' +
      '  !ifdef allowToChangeInstallationDirectory'
    const blockBeforeDir =
      '  !ifndef INSTALL_MODE_PER_ALL_USERS\n' +
      '    !insertmacro PAGE_INSTALL_MODE\n' +
      '  !endif\n' +
      '\n' +
      '  ' +
      MARK_BEFORE_DIR +
      '\n' +
      '  !ifmacrodef customPageBeforeChangeDir\n' +
      '    !insertmacro customPageBeforeChangeDir\n' +
      '  !endif\n' +
      '\n' +
      '  !ifdef allowToChangeInstallationDirectory'
    if (!s.includes(needleBeforeDir)) {
      console.error(
        '[apply-nsis-patches] 无法定位 PAGE_INSTALL_MODE / allowToChangeInstallationDirectory，请检查 app-builder-lib 版本'
      )
      process.exit(1)
    }
    s = s.replace(needleBeforeDir, blockBeforeDir)
  }

  if (s !== original) {
    fs.writeFileSync(assistedPath, s, 'utf8')
    console.log('[apply-nsis-patches] 已更新 assistedInstaller.nsh')
  } else {
    console.log('[apply-nsis-patches] assistedInstaller.nsh 无需更新（已含全部补丁）')
  }
}

function patchInstallSection() {
  if (!fs.existsSync(installSectionPath)) {
    console.warn('[apply-nsis-patches] 跳过：未找到', installSectionPath)
    return
  }
  let s = fs.readFileSync(installSectionPath, 'utf8')

  if (s.includes(MARK_SECTION_V2)) {
    console.log('[apply-nsis-patches] installSection.nsh 已打过 v2 补丁')
    return
  }

  const topRegex =
    /(?:; \[(?:MetCal|FlowCal)\] SetDetailsPrint both\r?\n)?\$\{IfNot\} \$\{Silent\}\r?\n\s*SetDetailsPrint (?:none|both|textonly)\r?\n\$\{endif\}/
  const topReplacement =
    MARK_SECTION_V2 +
    '\n${IfNot} ${Silent}\n  SetDetailsPrint textonly\n${endif}'
  if (!topRegex.test(s)) {
    console.error(
      '[apply-nsis-patches] installSection.nsh 未找到顶部 SetDetailsPrint 块，请检查 app-builder-lib 版本'
    )
    process.exit(1)
  }
  s = s.replace(topRegex, topReplacement)

  const uninstallAnchor = '!insertmacro uninstallOldVersion SHELL_CONTEXT'
  const uninstallBlock =
    '; [MetCal v2] stage: clean old version\n' +
    '${IfNot} ${Silent}\n' +
    '  DetailPrint "正在清理旧版本..."\n' +
    '  SetDetailsPrint none\n' +
    '${endif}\n' +
    uninstallAnchor
  if (s.indexOf(uninstallAnchor) === -1) {
    console.error('[apply-nsis-patches] installSection.nsh 未找到 uninstallOldVersion')
    process.exit(1)
  }
  s = s.replace(uninstallAnchor, uninstallBlock)

  const extractAnchor = 'SetOutPath $INSTDIR\n\n!ifdef UNINSTALLER_ICON'
  const extractBlock =
    '; [MetCal v2] stage: extract program files\n' +
    '${IfNot} ${Silent}\n' +
    '  SetDetailsPrint textonly\n' +
    '  DetailPrint "正在解压程序文件..."\n' +
    '  SetDetailsPrint none\n' +
    '${endif}\n' +
    'SetOutPath $INSTDIR\n\n!ifdef UNINSTALLER_ICON'
  if (s.indexOf(extractAnchor) === -1) {
    console.error('[apply-nsis-patches] installSection.nsh 未找到 SetOutPath $INSTDIR / UNINSTALLER_ICON 锚点')
    process.exit(1)
  }
  s = s.replace(extractAnchor, extractBlock)

  const registryAnchor = '!insertmacro registryAddInstallInfo'
  const registryBlock =
    '; [MetCal v2] stage: registry & shortcuts\n' +
    '${IfNot} ${Silent}\n' +
    '  SetDetailsPrint textonly\n' +
    '  DetailPrint "正在配置注册信息与快捷方式..."\n' +
    '${endif}\n' +
    registryAnchor
  if (s.indexOf(registryAnchor) === -1) {
    console.error('[apply-nsis-patches] installSection.nsh 未找到 registryAddInstallInfo 锚点')
    process.exit(1)
  }
  s = s.replace(registryAnchor, registryBlock)

  fs.writeFileSync(installSectionPath, s, 'utf8')
  console.log('[apply-nsis-patches] 已更新 installSection.nsh（v2 friendly stages）')
}

patchAssistedInstaller()
patchInstallSection()
