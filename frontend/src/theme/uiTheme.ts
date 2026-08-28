/**
 * 统一 UI 主题 — 按钮、输入、卡片、提示等
 * 保证全页面视觉与交互一致性
 */

export type ThemeMode = 'light' | 'dark'

/** 主按钮（添加、计算、求解等主要操作） */
export function btnPrimary(dark: boolean) {
  return `px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    dark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
  }`
}

/** 主按钮禁用态 */
export function btnPrimaryDisabled(dark: boolean) {
  return `px-4 py-2.5 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed ${
    dark ? 'bg-gray-600 text-gray-400' : 'bg-gray-300 text-gray-500'
  }`
}

/** 次要按钮（边框样式，用于非主要操作） */
export function btnSecondary(dark: boolean) {
  return `px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
    dark
      ? 'border-gray-500 text-gray-300 hover:bg-gray-700 hover:border-gray-500'
      : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
  }`
}

/** 小号主按钮（如「应用此方案」） */
export function btnPrimarySm(dark: boolean) {
  return `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
    dark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
  }`
}

/** 文本链接按钮（如关闭、取消） */
export function btnText(dark: boolean) {
  return `text-sm transition-colors ${dark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
}

/** 标准输入框 */
export function inputBase(dark: boolean) {
  return `px-3 py-2.5 rounded-lg border text-sm transition-colors ${
    dark
      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
  }`
}

/** 小号输入框（表格内嵌、元素编辑） */
export function inputSm(dark: boolean) {
  return `px-2 py-1.5 rounded border text-sm ${
    dark
      ? 'bg-gray-700 border-gray-600 text-gray-100'
      : 'bg-white border-gray-300 text-gray-900'
  }`
}

/** 下拉选择框 */
export function selectBase(dark: boolean) {
  return inputBase(dark)
}

/** 标签文字 */
export function labelBase(dark: boolean) {
  return `block text-sm font-medium mb-1.5 ${dark ? 'text-gray-300' : 'text-gray-700'}`
}

/** 卡片容器 */
export function cardBase(dark: boolean) {
  return `rounded-xl border p-5 ${dark ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'}`
}

/** 紧凑卡片（1080p 铜冶炼流程等高密度页面） */
export function cardCompact(dark: boolean) {
  return `rounded-xl border p-4 ${dark ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'}`
}

/** 区块标题（模块标题） */
export function sectionTitle(dark: boolean) {
  return `text-base font-semibold mb-4 ${dark ? 'text-gray-100' : 'text-gray-900'}`
}

/** 区块描述（模块说明） */
export function descText(dark: boolean) {
  return `text-sm mb-4 ${dark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`
}

/** 辅助说明（小字） */
export function hintText(dark: boolean) {
  return `text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`
}

/** 操作栏容器：输入靠左、主按钮靠右 */
export function actionRow() {
  return 'flex flex-wrap gap-4 items-end justify-between w-full'
}

/** 操作栏左侧：输入组 */
export function actionRowInputs() {
  return 'flex flex-wrap gap-4 items-end flex-1 min-w-0'
}

/** 操作栏右侧：主按钮 */
export function actionRowButton() {
  return 'flex-shrink-0'
}

/** 错误提示框 */
export function errorBox(dark: boolean) {
  return `rounded-lg border p-3 flex items-start justify-between gap-3 ${
    dark ? 'bg-red-900/20 border-red-700/50 text-red-200' : 'bg-red-50 border-red-200 text-red-800'
  }`
}

/** 结果/信息框 */
export function resultBox(dark: boolean) {
  return `rounded-lg border p-4 ${dark ? 'border-gray-600 bg-gray-800/40' : 'border-gray-200 bg-gray-50'}`
}

/** 输入组宽度常量 */
export const INPUT_WIDTHS = {
  select: 'w-[11rem]',      // 176px 选择原料、熔剂
  selectWide: 'w-[12rem]',  // 192px
  number: 'w-24',           // 96px 数值
  numberSm: 'w-20',         // 80px 小数值
} as const
