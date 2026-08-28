/**
 * 岩体质量与分级软件统一品牌文案。
 * 与根目录 electron-builder*.yml 的 productName 及 electron/main.js 中 APP_DISPLAY_NAME 保持语义一致（修改时请同步）。
 */

/** 正式产品名：与安装器 productName、窗口对外展示一致 */
export const APP_NAME_ZH = 'CINF矿山岩体质量分级软件'
export const APP_NAME_EN = 'CINF MRQR'

export const APP_TITLE_MAIN_ZH = APP_NAME_ZH
export const APP_TITLE_MAIN_EN = APP_NAME_EN

/** 侧栏主标题（可略短于正式名） */
export const APP_TITLE_SIDEBAR_ZH = '岩体质量分级平台'
export const APP_TITLE_SIDEBAR_EN = 'Rock Mass Platform'

export const APP_ORG_NAME_ZH = '长沙有色冶金设计研究院有限公司'
export const APP_ORG_NAME_EN = 'Changsha Nonferrous Metallurgical Design & Research Institute Co., Ltd.'

export const APP_EXPORT_FILENAME_PREFIX = 'CINF-MRQR'

/** 离线授权码行首（与 electron/license.js、scripts/issue-offline-license.js 一致） */
export const LICENSE_TOKEN_PREFIX = 'CINF-ROCK-LIC1.'

export const APP_TAGLINE_ZH = '面向矿山工程建设与生产管理，提供岩体质量评价、分级计算、工程分析和成果整理等专业支持。'
export const APP_TAGLINE_MAIN_EN =
  'Professional support for rock mass quality assessment, classification, engineering analysis and technical reporting in mining projects.'

export const APP_TAGLINE_SIDEBAR_ZH = '面向矿山工程的\n岩体质量评价与分级计算'
export const APP_TAGLINE_SIDEBAR_EN = 'Mining engineering\nrock mass assessment'

/** 设置页：免责声明 / 隐私 / 智能助手说明 */
export const SETTINGS_LEGAL = {
  zh: {
    disclaimerTitle: '免责声明',
    disclaimerP1:
      '本软件所提供的计算公式及计算结果仅供工程设计参考，不构成任何设计依据或保证。实际工程须结合现行规范、现场条件及专业判断综合决策。',
    disclaimerP2:
      '使用本软件及其结果所产生的任何直接或间接后果，开发与提供方不承担责任。如有疑问，请以现行国家标准、行业规范及有资质单位出具的正式设计文件为准。',
    disclaimerP3:
      '若将本软件产出的计算结果、或依本软件功能形成的参数与指标，作为工程设计依据或对外技术条件的依据，或用于对设计起结论性指导的，须同时具备与「长沙有色冶金设计研究院有限公司」合法有效且与项目范围相符的正式合同或该院出具的书面项目授权。本软件使用许可不替代上述合同或授权。未经该院书面同意，不得以长沙有色院或本公司名义将本软件结果用于正式报审、对外技术承诺或担保性表述。',
    privacyTitle: '数据与隐私',
    privacyP:
      '岩体分级等计算在用户本机内存中完成；默认不向公网上传输入数据或计算结果。导出文档在用户本机生成。右下角「智能助手」若启用本地模型，请求仅发往本机 127.0.0.1 后端以加载 GGUF；若安装包未包含模型或未启用本地 AI，助手仅以内置规则 FAQ 应答。',
    aiAssistantTitle: '智能助手（可选本地模型）',
    aiAssistantP:
      '本地 AI 推理完全离线：模型权重（.gguf）位于安装目录 resources/backend/models/，对话内容不会发往互联网。助手答复仅供软件操作说明与辅助理解，不构成工程设计结论或担保；涉合规与安全的关键决策仍须由专业工程师审定。',
  },
  en: {
    disclaimerTitle: 'Disclaimer',
    disclaimerP1:
      'The formulas and results provided by this software are for engineering reference only and do not constitute any guarantee or final design basis. Decisions must be made with applicable standards, site conditions, and professional judgment.',
    disclaimerP2:
      'The developer/provider assumes no liability for any direct or indirect consequences arising from the use of this software or its results. When in doubt, refer to current national/industry standards and formally issued design documents from qualified organizations.',
    disclaimerP3:
      'If you use this software’s outputs or parameters/indicators derived from its features as a basis for engineering design or as material guidance, you must also have a valid, applicable contract or written project authorization from Changsha Nonferrous Metallurgical Design & Research Institute Co., Ltd. The app license is not a substitute for such authorization. Without the company’s written consent, you may not use the institute’s name when submitting results for formal design review or external technical commitments.',
    privacyTitle: 'Data & Privacy',
    privacyP:
      'Rock mass classification calculations run locally on your machine by default; input and results are not uploaded to the internet. Exports are written locally. If local AI is enabled, the assistant talks only to the Flask backend on 127.0.0.1 to run an embedded GGUF; otherwise replies are rule-based FAQ only.',
    aiAssistantTitle: 'Assistant (optional local model)',
    aiAssistantP:
      'Local inference stays offline: GGUF weights ship under resources/backend/models/. Answers are software guidance only—not engineering sign-off or a substitute for codes or engineer judgment.',
  },
} as const

/** 安装包变体与许可文件说明（设置页展示） */
export const SETTINGS_PACKAGE_INFO = {
  zh: {
    title: '安装包与许可文件',
    variantIntro:
      '发行构建可分为「含本地 AI 资源」与「不含 GGUF」两类：前者文件名通常带 `_AI` 后缀且 package.json 标记 cinfAssistantLocalDeploy=true；后者体积更小，智能助手仅能使用规则 FAQ。',
    nsisNote:
      'NSIS 安装向导中的协议正文来自仓库根目录 LICENSE.txt；构建脚本会生成 GBK 编码的 LICENSE.nsis.txt 供安装界面正确显示中文。',
    updateNote:
      '自动更新需在 electron-builder 中配置可用的更新服务器地址；占位或未配置的 URL 会导致检查更新失败，请联系管理员部署后再试。',
  },
  en: {
    title: 'Installer & license files',
    variantIntro:
      'Builds may ship with local GGUF (_AI artifact, cinfAssistantLocalDeploy=true) or without GGUF (FAQ-only assistant, smaller installer).',
    nsisNote:
      'The NSIS license page reads LICENSE.txt from the repo root; LICENSE.nsis.txt is a GBK conversion for Windows installers.',
    updateNote:
      'Auto-update requires a valid publish URL in electron-builder; placeholder URLs will make update checks fail.',
  },
} as const

/** 设置页「助手状态」简短标签 */
export const SETTINGS_ASSISTANT_STATUS_UI = {
  zh: {
    sectionTitle: '智能助手运行状态',
    loading: '正在检测后端…',
    unavailable: '当前无法连接本地助手服务（浏览器预览或未启动后端）。',
    inferenceReady: '本地模型可推理',
    inferenceNotReady: '本地模型不可用（缺少 GGUF、依赖或未启用 AI 安装包）',
    knowledgeChars: '已加载知识库字符约',
    localDeployOff: '当前安装包未启用本地 AI 部署。',
  },
  en: {
    sectionTitle: 'Assistant runtime',
    loading: 'Checking backend…',
    unavailable: 'Cannot reach local assistant (browser preview or backend stopped).',
    inferenceReady: 'Local model inference ready',
    inferenceNotReady: 'Local model not ready (missing GGUF/deps or No-AI package)',
    knowledgeChars: 'Knowledge chars loaded:',
    localDeployOff: 'Local AI deployment is disabled in this package variant.',
  },
} as const

/** 设置页：离线许可 UI 文案 */
export const SETTINGS_OFFLINE_LICENSE_UI = {
  zh: {
    offlineLicense: '产品许可',
    deviceCode: '设备标识',
    copyDev: '复制',
    copied: '已复制',
    licenseCode: '许可密钥',
    licensePlaceholder: `许可密钥以 ${LICENSE_TOKEN_PREFIX.replace(/\.$/, '')} 开头，整段粘贴即可。`,
    updateLicense: '更新',
    applyLicenseBusy: '应用更新中…',
    validUntil: '许可证有效期',
    noExpiry: '无期限',
    licenseSaved: '已保存，本机已激活。',
    saveFailed: '保存失败',
  },
  en: {
    offlineLicense: 'Product License',
    deviceCode: 'Device ID',
    copyDev: 'Copy',
    copied: 'Copied',
    licenseCode: 'License Key',
    licensePlaceholder: 'CINF-ROCK-LIC1.…',
    updateLicense: 'Update',
    applyLicenseBusy: 'Applying…',
    validUntil: 'Valid until',
    noExpiry: 'No expiry',
    licenseSaved: 'Saved. This device is licensed.',
    saveFailed: 'Failed',
  },
} as const

/** 邮件主题等使用的短称 */
export const APP_SHORT_NAME_ZH = '矿山岩体质量分级软件'
export const APP_SHORT_NAME_EN = 'CINF MRQR'

/** 侧栏「了解我们」与页脚等导航文案 */
export const ABOUT_NAV = {
  zh: {
    aboutUs: '了解我们',
    settings: '设置',
    cinf: APP_ORG_NAME_ZH,
    mining: '长沙院矿山事业部',
    research: '长沙院科研创新中心',
    footerBy: '由',
    footerDev: '科研创新中心开发',
  },
  en: {
    aboutUs: 'About Us',
    settings: 'Settings',
    cinf: APP_ORG_NAME_EN,
    mining: 'Mining Division',
    research: 'Research Innovation Center',
    footerBy: 'By',
    footerDev: 'Research Innovation Center',
  },
} as const

export function appTitleForLang(lang: 'zh' | 'en'): string {
  return lang === 'en' ? APP_TITLE_MAIN_EN : APP_TITLE_MAIN_ZH
}

export function appSubtitleForLang(lang: 'zh' | 'en'): string {
  return lang === 'en' ? APP_TAGLINE_MAIN_EN : APP_TAGLINE_ZH
}

export function sidebarTitleForLang(lang: 'zh' | 'en'): string {
  return lang === 'en' ? APP_TITLE_SIDEBAR_EN : APP_TITLE_SIDEBAR_ZH
}

export function sidebarSubtitleForLang(lang: 'zh' | 'en'): string {
  return lang === 'en' ? APP_TAGLINE_SIDEBAR_EN : APP_TAGLINE_SIDEBAR_ZH
}
