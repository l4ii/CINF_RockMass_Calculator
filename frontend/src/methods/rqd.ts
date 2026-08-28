export type RqdClassId = 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor'

export interface RqdFormState {
  coreRunLength: number | null
  soundCoreLength: number | null
}

export interface RqdClassInfo {
  id: RqdClassId
  min: number
  max: number
  includeMax: boolean
  label: string
  labelEn: string
  quality: string
  qualityEn: string
}

export interface RqdResult {
  rqd: number
  grade: RqdClassInfo
  formula: string
  formulaEn: string
}

export const RQD_STANDARD = {
  id: 'deere-rqd-1964',
  title: 'Deere 岩石质量指标 RQD 分级',
  titleEn: 'Deere Rock Quality Designation classification',
  edition: '1964',
  source: 'Deere et al. (1964)；RQD 取芯统计口径参照 ASTM D6032/D6032M',
  sourceEn: 'Deere et al. (1964); core measurement procedure referenced to ASTM D6032/D6032M',
} as const

export const RQD_CLASSES: readonly RqdClassInfo[] = [
  { id: 'excellent', min: 90, max: 100, includeMax: true, label: '极好', labelEn: 'Excellent', quality: '岩体质量极好', qualityEn: 'Excellent rock quality' },
  { id: 'good', min: 75, max: 90, includeMax: false, label: '好', labelEn: 'Good', quality: '岩体质量好', qualityEn: 'Good rock quality' },
  { id: 'fair', min: 50, max: 75, includeMax: false, label: '中等', labelEn: 'Fair', quality: '岩体质量中等', qualityEn: 'Fair rock quality' },
  { id: 'poor', min: 25, max: 50, includeMax: false, label: '差', labelEn: 'Poor', quality: '岩体质量差', qualityEn: 'Poor rock quality' },
  { id: 'very_poor', min: 0, max: 25, includeMax: false, label: '很差', labelEn: 'Very poor', quality: '岩体质量很差', qualityEn: 'Very poor rock quality' },
] as const

export function createInitialRqdState(): RqdFormState {
  return { coreRunLength: null, soundCoreLength: null }
}

function finiteNumber(value: unknown): number | null {
  if (value === '' || value == null) return null
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : null
}

export function normalizeRqdState(raw: unknown): RqdFormState {
  const source = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  return {
    coreRunLength: finiteNumber(source.coreRunLength),
    soundCoreLength: finiteNumber(source.soundCoreLength),
  }
}

export function validateRqdState(raw: unknown) {
  const state = normalizeRqdState(raw)
  const issues: { field: keyof RqdFormState; message: string; messageEn: string }[] = []
  if (state.coreRunLength == null || state.coreRunLength <= 0) {
    issues.push({ field: 'coreRunLength', message: '钻孔总长必须大于 0。', messageEn: 'Total drill-hole length must be greater than zero.' })
  }
  if (state.soundCoreLength == null || state.soundCoreLength < 0) {
    issues.push({ field: 'soundCoreLength', message: '岩芯累计长度不能小于 0。', messageEn: 'Cumulative core length cannot be negative.' })
  } else if (state.coreRunLength != null && state.soundCoreLength > state.coreRunLength) {
    issues.push({ field: 'soundCoreLength', message: '岩芯累计长度不能超过钻孔总长。', messageEn: 'Cumulative core length cannot exceed the total drill-hole length.' })
  }
  return issues
}

export function classifyRqd(rqd: number): RqdClassInfo {
  const grade = RQD_CLASSES.find((entry) => rqd >= entry.min && (entry.includeMax ? rqd <= entry.max : rqd < entry.max))
  if (!grade) throw new Error('RQD is outside the supported range')
  return grade
}

export function calculateRqd(raw: unknown): RqdResult {
  const state = normalizeRqdState(raw)
  const issues = validateRqdState(state)
  if (issues.length > 0) throw new Error(issues.map((issue) => issue.message).join('；'))
  const rqd = (state.soundCoreLength as number) / (state.coreRunLength as number) * 100
  return {
    rqd,
    grade: classifyRqd(rqd),
    formula: `RQD = 长度≥10 cm 的岩芯累计长度 / 钻孔总长 × 100% = ${Number(rqd.toFixed(2))}%`,
    formulaEn: `RQD = cumulative core length at least 10 cm / total drill-hole length x 100% = ${Number(rqd.toFixed(2))}%`,
  }
}
