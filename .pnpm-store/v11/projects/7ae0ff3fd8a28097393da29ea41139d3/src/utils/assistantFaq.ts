import type { AssistantWorkspaceSnapshot } from '../context/AssistantContext'
import { APP_NAME_EN, APP_NAME_ZH, APP_ORG_NAME_EN } from '../constants/appCopy'
import { CLASSIFICATION_METHODS } from '../types'

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function buildAssistantWelcome(language: 'zh' | 'en'): string {
  if (language === 'en') {
    return [
      `Welcome to ${APP_NAME_EN}.`,
      '',
      `I'm the in-app assistant. I can help with:`,
      '• Choosing BQ / Q / RMR / MRMR classification from the left sidebar.',
      '• Understanding formula pages, parameters, and grade results.',
      '• Privacy/license/update hints shown in Settings.',
      '',
      'Ask your question.',
    ].join('\n')
  }
  return [
    `欢迎使用「${APP_NAME_ZH}」。`,
    '',
    '我是本软件的智能助手，可协助您：',
    '• 在左侧选择 RQD、BQ、Q、RMR、MRMR 分级方法；',
    '• 理解公式页参数含义与分级结果提示；',
    '• 说明设置页中的许可、隐私与更新提示。',
    '',
    '请描述您的问题。',
  ].join('\n')
}

export function smartInterpretationNotReadyReply(language: 'zh' | 'en'): string {
  return language === 'en'
    ? 'For deeper wording I need the local assistant backend with an embedded GGUF model (AI installer variant). Meanwhile I can still help with navigation and Settings via rule-based replies—please ask something concrete.'
    : '更深入的长文解读需要本地后端已成功加载 GGUF 模型（请选择含 AI 资源的安装包并确认依赖就绪）。在此之前仍可通过左侧导航与设置页的规则说明为您解答——请尽量具体描述问题。'
}

export function tryRuleBasedAssistantReply(
  raw: string,
  language: 'zh' | 'en',
  catalog: { id: string; name: string; group: string }[],
  _snapshot: AssistantWorkspaceSnapshot | null
): string | null {
  const q = normalize(raw)
  if (!q) return null
  const zh = language === 'zh'

  if (
    zh
      ? /长沙有色冶金设计研究院|长沙有色院|长沙院|中铝国际|中国铝业|软件.*谁做|开发单位/.test(raw)
      : new RegExp(APP_ORG_NAME_EN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(raw) ||
        /\bwho\s+(developed|built)\b|\bdeveloper\b|\borganization\b/i.test(q)
  ) {
    return zh
      ? `${APP_NAME_ZH} 由长沙有色冶金设计研究院有限公司科研创新中心、矿山事业部相关单位研发；详情见侧栏「了解我们」。`
      : `${APP_NAME_EN} is developed under Changsha Nonferrous — see sidebar About Us for organization pages.`
  }

  if (zh ? /侧栏|左边|导航|在哪|找不到|切换|BQ|RMR|MRMR|分级/.test(raw) : /\bsidebar\b|\bnavigation\b|\bwhere\b.*\b(find|open)|\bbq\b|\brmr\b|\bmrmr\b|\bq\b/i.test(q)) {
    const names = CLASSIFICATION_METHODS.map((m) => (zh ? m.name : m.nameEn)).join(zh ? '、' : ', ')
    return zh
      ? `请在左侧「岩体分级」中点选：${names}。进入后可查看公式、输入参数并点击「开始计算」；可用左上角返回清空当前方法。「设置」「了解我们」在侧栏底部。`
      : `Choose a method on the left (${names}). Each page shows the formula, parameters, and Calculate. Use Back to clear the selection. Settings and About are in the sidebar footer.`
  }

  if (zh ? /设置|许可|更新|隐私|免责/.test(raw) : /\bsettings?\b|\blicen[cs]e\b|\bupdate\b|\bprivacy\b|\bdisclaimer\b/i.test(q)) {
    return zh
      ? '请打开侧栏底部「设置」：可切换外观与语言、查看/更新离线许可、检查更新，并阅读免责声明与隐私说明。'
      : 'Open Settings in the sidebar footer for appearance, language, offline license, updates, and legal notices.'
  }

  const hit = catalog.find((c) => q.includes(normalize(c.name)) || q.includes(normalize(c.id)))
  if (hit) {
    return zh
      ? `您可在左侧选择「${hit.name}」进入对应公式页。当前助手以规则 FAQ 应答；更细的规范解读需本地 AI 模型就绪。`
      : `Select “${hit.name}” on the left to open that formula page. Rule-based FAQ is available now; deeper code interpretation needs local AI.`
  }

  return null
}
