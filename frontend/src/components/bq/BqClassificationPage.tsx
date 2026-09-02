import { Fragment, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type WheelEvent } from 'react'
import { ArrowRight, Check, ChevronDown } from 'lucide-react'
import { Km, Kblock } from '../math/Katex'
import { SYM } from '../math/symbols'
import BackIconButton from '../BackIconButton'
import { FormulaFrame } from '../calculationUiPrimitives'
import type { CustomEditorPageProps } from '../classification/ClassificationModule'
import PointInformationFields from '../classification/PointInformationFields'
import {
  BQ_GRADES,
  BQ_SLOPE_F1_OPTIONS,
  BQ_SLOPE_F2_OPTIONS,
  BQ_SLOPE_F3_OPTIONS,
  BQ_SLOPE_LAMBDA_OPTIONS,
  BQ_SLOPE_WATER_OPTIONS,
  BQ_UNDERGROUND_ORIENTATION_OPTIONS,
  BQ_UNDERGROUND_STRESS_OPTIONS,
  BQ_UNDERGROUND_WATER_OPTIONS,
  tryCalculateBq,
  assessGroundwaterK1,
  assessSlopeK4,
  estimateKvFromJv,
  interpolateKvFromJv,
  estimateKvFromVelocities,
  estimateRcFromIs50,
  normalizeBqState,
  validateBqState,
  resolveFoundationGrade,
  type BqFactorOption,
  type BqFormState,
  type BqCoefficientRange,
  type BqFoundationGrade,
  type BqGradeId,
  type BqResult,
} from '../../methods/bq'

type BqProps = CustomEditorPageProps

function fieldClass(darkMode: boolean) {
  return `w-full rounded-lg border px-3 py-2 text-center text-sm tabular-nums outline-none focus:ring-2 focus:ring-blue-500/30 ${darkMode ? 'border-gray-500 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`
}

function CenteredSelect({
  darkMode,
  value,
  ariaLabel,
  options,
  placeholder,
  onChange,
}: {
  darkMode: boolean
  value: string
  ariaLabel: string
  options: Array<{ id: string; label: string }>
  placeholder?: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  const selected = options.find((option) => option.id === value)
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`relative w-full rounded-lg border px-10 py-2 text-center text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${darkMode ? 'border-gray-500 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
      >
        <span className={selected ? '' : (darkMode ? 'text-gray-400' : 'text-gray-500')}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute z-20 mt-1 w-full overflow-hidden rounded-lg border ${darkMode ? 'border-gray-500 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900 shadow-lg'}`}
        >
          {options.map((option) => {
            const selectedOption = option.id === value
            return (
              <li key={option.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedOption}
                  onClick={() => {
                    onChange(option.id)
                    setOpen(false)
                  }}
                  className={`w-full px-3 py-2 text-center text-sm ${selectedOption ? (darkMode ? 'bg-blue-900/50 text-blue-100' : 'bg-blue-100 text-blue-900') : darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}`}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

function correctionTypeOptions(en: boolean): Array<{ id: 'underground' | 'slope' | 'foundation'; label: string }> {
  return [
    { id: 'underground', label: en ? 'Underground engineering rock mass' : '地下工程岩体' },
    { id: 'slope', label: en ? 'Slope engineering rock mass' : '边坡工程岩体' },
    { id: 'foundation', label: en ? 'Foundation engineering rock mass' : '地基工程岩体' },
  ]
}

function sectionClass(darkMode: boolean) {
  return `scroll-mt-4 rounded-lg border p-4 sm:p-5 ${darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white shadow-sm'}`
}

function mutedClass(darkMode: boolean) {
  return darkMode ? 'text-gray-400' : 'text-gray-600'
}

function preventNumberWheel(event: WheelEvent<HTMLInputElement>) {
  // Blurring lets the page keep scrolling while preventing the focused number input from stepping.
  event.currentTarget.blur()
}

function preventNumberArrow(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') event.preventDefault()
}

function rangeText(range: BqCoefficientRange) {
  return range.min === range.max ? String(range.min) : `${range.min}～${range.max}`
}

const BQ_GRADE_MATH: Record<BqGradeId, string> = {
  I: String.raw`\mathrm{BQ}>550`,
  II: String.raw`450<\mathrm{BQ}\le 550`,
  III: String.raw`350<\mathrm{BQ}\le 450`,
  IV: String.raw`250<\mathrm{BQ}\le 350`,
  V: String.raw`\mathrm{BQ}\le 250`,
}

function undergroundWaterLabel(id: string, en: boolean): ReactNode {
  if (id === 'none') return en ? 'No groundwater correction' : '无地下水修正'
  if (id === 'damp_or_drip') {
    return (
      <span className="leading-6">
        {en ? 'Damp or dripping' : '潮湿或点滴状出水'}
        <span className="mt-1 block font-normal">
          <Km math={String.raw`p\le 0.1`} /> {en ? 'or' : '或'} <Km math={String.raw`Q\le 25`} />
        </span>
      </span>
    )
  }
  if (id === 'rain_or_linear_flow') {
    return (
      <span className="leading-6">
        {en ? 'Rain-like or linear flow' : '淋雨状或线流状出水'}
        <span className="mt-1 block font-normal">
          <Km math={String.raw`0.1<p\le 0.5`} /> {en ? 'or' : '或'} <Km math={String.raw`25<Q\le 125`} />
        </span>
      </span>
    )
  }
  return (
    <span className="leading-6">
      {en ? 'Surging inflow' : '涌流状出水'}
      <span className="mt-1 block font-normal">
        <Km math={String.raw`p>0.5`} /> {en ? 'or' : '或'} <Km math={String.raw`Q>125`} />
      </span>
    </span>
  )
}

function undergroundStressLabel(id: string, en: boolean): ReactNode {
  if (id === 'none_or_ratio_gt7') {
    return (
      <span className="leading-6">
        {en ? 'No initial-stress correction' : '无初始应力修正'}
        <span className="mt-1 block font-normal"><Km math={String.raw`R_c/\sigma_{\max}>7`} /></span>
      </span>
    )
  }
  if (id === 'ratio_lt4') return <Km math={String.raw`R_c/\sigma_{\max}<4`} />
  return <Km math={String.raw`4\le R_c/\sigma_{\max}\le 7`} />
}

function orientationConditionLabel(id: string, en: boolean): ReactNode {
  if (id === 'none') return en ? 'No controlling major discontinuity' : '无一组起控制作用的主要结构面'
  if (id === 'axis_angle_lt30_dip_30_75') {
    return (
      <span className="leading-6">
        {en ? 'Strike-to-axis angle ' : '结构面走向与洞轴线夹角 '}
        <Km math={String.raw`\alpha\le 30^{\circ}`} />
        <span className="mt-1 block font-normal">{en ? 'dip ' : '倾角 '}<Km math={String.raw`\beta=30^{\circ}\sim 75^{\circ}`} /></span>
      </span>
    )
  }
  if (id === 'axis_angle_gt60_dip_gt75') {
    return (
      <span className="leading-6">
        {en ? 'Strike-to-axis angle ' : '结构面走向与洞轴线夹角 '}
        <Km math={String.raw`\alpha>60^{\circ}`} />
        <span className="mt-1 block font-normal">{en ? 'dip ' : '倾角 '}<Km math={String.raw`\beta>75^{\circ}`} /></span>
      </span>
    )
  }
  return en ? 'Other combinations' : '其他组合'
}

function lambdaRangeText(range: BqCoefficientRange) {
  return range.min === range.max ? String(range.min) : `${range.max}～${range.min}`
}

function formatFactorValue(value: number) {
  if (value === 0) return '0'
  if (value === 1) return '1.0'
  if (value === 2) return '2.0'
  if (value === 2.5) return '2.5'
  if (value === 0.2) return '0.2'
  if (value === 0.8) return '0.8'
  return value.toFixed(2)
}

function gradeForBq(value: number) {
  if (value > 550) return BQ_GRADES[0]
  if (value > 450) return BQ_GRADES[1]
  if (value > 350) return BQ_GRADES[2]
  if (value > 250) return BQ_GRADES[3]
  return BQ_GRADES[4]
}

function BqTable({
  darkMode,
  language,
  title,
  rows,
  selectedId,
  activeGrade,
  onSelect,
  testId,
  rowHeader,
}: {
  darkMode: boolean
  language: 'zh' | 'en'
  title: ReactNode
  rows: Array<{ id: string; label: string; labelNode?: ReactNode; range: string; note?: string; gradeRanges?: Partial<Record<BqGradeId, string>> }>
  selectedId: string | null
  activeGrade?: BqGradeId
  onSelect: (id: string) => void
  testId?: string
  rowHeader?: ReactNode
}) {
  const border = darkMode ? 'border-gray-600' : 'border-gray-300'
  const head = darkMode ? 'bg-gray-700/60 text-gray-200' : 'bg-gray-100 text-gray-700'
  const body = darkMode ? 'text-gray-300' : 'text-gray-700'
  const en = language === 'en'
  const hasGradeColumns = rows.some((row) => row.gradeRanges)
  const gradeHeaders: BqGradeId[] = ['I', 'II', 'III', 'IV', 'V']
  const cell = 'border px-3 py-2.5 leading-6'

  return (
    <div data-testid={testId} className="mt-4 space-y-2">
      <div className={`text-sm font-medium leading-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</div>
      <div className="overflow-x-auto">
        <table className={`w-full min-w-[560px] border-collapse border text-sm ${border}`}>
          <thead className={head}>
            <tr>
              <th className={`${cell} text-left font-medium`}>{rowHeader ?? (en ? 'Condition' : '工程条件')}</th>
              {hasGradeColumns
                ? gradeHeaders.map((grade) => (
                    <th key={grade} className={`${cell} text-center font-medium ${activeGrade === grade ? (darkMode ? 'bg-blue-900/40' : 'bg-blue-100') : ''}`}>
                      <div>{en ? `Class ${grade}` : `${grade} 级`}</div>
                      <div className="mt-1 font-normal"><Km math={BQ_GRADE_MATH[grade]} /></div>
                    </th>
                  ))
                : <th className={`${cell} text-center font-medium`}>{en ? 'Range' : '系数区间'}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selected = row.id === selectedId
              return (
                <tr
                  key={row.id}
                  tabIndex={0}
                  onClick={() => onSelect(row.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') onSelect(row.id)
                  }}
                  className={`cursor-pointer ${selected ? (darkMode ? 'bg-blue-900/50 text-blue-100' : 'bg-blue-100 text-blue-900') : `${body} ${darkMode ? 'hover:bg-gray-700/40' : 'hover:bg-gray-50'}`}`}
                >
                  <td className={`${cell} align-top font-medium`} title={row.note}>{row.labelNode ?? row.label}</td>
                  {hasGradeColumns
                    ? gradeHeaders.map((grade) => (
                        <td key={grade} className={`${cell} text-center tabular-nums ${activeGrade === grade ? (darkMode ? 'bg-blue-900/20' : 'bg-blue-50') : (darkMode ? 'bg-gray-900/60 text-gray-600' : 'bg-gray-100 text-gray-400')}`}>{row.gradeRanges?.[grade] ?? '—'}</td>
                      ))
                    : <td className={`${cell} text-center tabular-nums`}>{row.range}</td>}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function BqOrientationTable({ darkMode, language, rows, selectedId, onSelect }: { darkMode: boolean; language: 'zh' | 'en'; rows: Array<{ id: string; label: string; range: string }>; selectedId: string | null; onSelect: (id: string) => void }) {
  const border = darkMode ? 'border-gray-600' : 'border-gray-300'
  const head = darkMode ? 'bg-gray-700/60 text-gray-200' : 'bg-gray-100 text-gray-700'
  const body = darkMode ? 'text-gray-300' : 'text-gray-700'
  const en = language === 'en'
  const cell = 'border px-3 py-2.5 leading-6'
  return (
    <div data-testid="bq-k2-table" className="mt-4 space-y-2">
      <div className={`text-sm font-medium leading-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{en ? <>Major discontinuity orientation · <Km math={SYM.K2} /></> : <>主要结构面产状影响修正系数 <Km math={SYM.K2} /></>}</div>
      <div className="overflow-x-auto">
        <table className={`w-full border-collapse border text-sm ${border}`}>
          <thead className={head}>
            <tr>
              <th className={`${cell} text-left font-medium`}>{en ? 'Combination of discontinuity orientation and tunnel axis' : '结构面产状及其与洞轴线的组合关系'}</th>
              <th className={`${cell} w-28 text-center font-medium`}><Km math={SYM.K2} /></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selected = row.id === selectedId
              return (
                <tr
                  key={row.id}
                  data-testid={row.id === 'none' ? 'bq-k2-none-option' : undefined}
                  tabIndex={0}
                  onClick={() => onSelect(row.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(row.id) }
                  }}
                  className={`cursor-pointer ${selected ? (darkMode ? 'bg-blue-900/50 text-blue-100' : 'bg-blue-100 text-blue-900') : `${body} ${darkMode ? 'hover:bg-gray-700/40' : 'hover:bg-gray-50'}`}`}
                >
                  <td className={`${cell} align-top font-medium`}>{orientationConditionLabel(row.id, en)}</td>
                  <td role="button" aria-selected={selected} className={`${cell} text-center font-semibold tabular-nums`}>{row.range.replace('–', '～')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BqGradeTable({ darkMode, language, activeGrade, selectedGrade, onSelect, testId, caption }: { darkMode: boolean; language: 'zh' | 'en'; activeGrade: BqGradeId | null; selectedGrade?: BqGradeId | null; onSelect?: (grade: BqGradeId) => void; testId?: string; caption?: string }) {
  const border = darkMode ? 'border-gray-600' : 'border-gray-300'
  const head = darkMode ? 'bg-gray-700/60 text-gray-200' : 'bg-gray-100 text-gray-700'
  const body = darkMode ? 'text-gray-300' : 'text-gray-700'
  const en = language === 'en'
  const highlighted = selectedGrade ?? (onSelect ? null : activeGrade)
  return (
    <div data-testid={testId ?? 'bq-grade-reference'} className="mt-4 space-y-1.5">
      <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{caption ?? (en ? 'BQ class summary' : 'BQ 分级汇总')}</div>
      <div className="overflow-x-auto">
        <table className={`w-full min-w-[420px] border-collapse border text-sm ${border}`}>
          <thead className={head}>
            <tr>
              <th className="border px-2 py-2 text-center font-medium">{en ? 'Rock-mass basic quality class' : '岩体基本质量分级'}</th>
              <th className="border px-2 py-2 text-center font-medium">{en ? 'Qualitative characteristics of rock-mass basic quality' : '岩体基本质量的定性特征'}</th>
              <th className="border px-2 py-2 text-center font-medium">{en ? 'Rock-mass basic quality index BQ' : '岩体基本质量指标 BQ'}</th>
            </tr>
          </thead>
          <tbody>
            {BQ_GRADES.map((grade) => {
              const selected = highlighted === grade.id
              return (
                <tr
                  key={grade.id}
                  tabIndex={onSelect ? 0 : undefined}
                  onClick={onSelect ? () => onSelect(grade.id) : undefined}
                  onKeyDown={onSelect ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(grade.id) } } : undefined}
                  className={`${onSelect ? 'cursor-pointer' : ''} ${selected ? (darkMode ? 'bg-blue-900/50 text-blue-100' : 'bg-blue-100 text-blue-900') : `${body} ${onSelect ? (darkMode ? 'hover:bg-gray-700/40' : 'hover:bg-gray-50') : ''}`}`}
                >
                  <td className="border px-2 py-2 text-center align-middle font-medium">{grade.label[language]}</td>
                  <td className="border px-2 py-2 text-center align-middle leading-6">{grade.qualitative[language]}</td>
                  <td className="border px-2 py-2 text-center align-middle tabular-nums">{grade.range}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function F0RangeMath({ latex }: { latex: string }) {
  return <span className="tabular-nums"><Km math={`${latex}\\,\\mathrm{MPa}`} /></span>
}

function BqFoundationResult({ darkMode, language, grade }: { darkMode: boolean; language: 'zh' | 'en'; grade: BqFoundationGrade | null }) {
  const en = language === 'en'
  const quality = grade ? BQ_GRADES.find((item) => item.id === grade.id) : null
  const gradeLine = grade && quality
    ? (en ? `${grade.label.en} · ${quality.quality.en}` : `${grade.label.zh} · ${quality.quality.zh}`)
    : '—'
  return (
    <div data-testid="bq-foundation-result" className={`mt-4 border-t pt-3 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
        <h3 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Corrected BQ evaluation result' : '修正 BQ 评价结果'}</h3>
        <p className={`text-sm font-medium sm:text-center ${grade ? (darkMode ? 'text-green-300' : 'text-green-800') : mutedClass(darkMode)}`}>{gradeLine}</p>
        <div data-testid="bq-foundation-f0" className={`font-semibold tabular-nums sm:text-right ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          <span className={`mr-2 text-sm font-normal ${mutedClass(darkMode)}`}>{en ? <>Reference <Km math="f_0" /></> : <>参考 <Km math="f_0" /></>}</span>
          {grade ? <F0RangeMath latex={grade.mathRange} /> : '—'}
        </div>
      </div>
    </div>
  )
}

function BqLimitationPanel({ darkMode, language, result }: { darkMode: boolean; language: 'zh' | 'en'; result: BqResult | null }) {
  const en = language === 'en'
  const applied = result?.limitation.applied ?? false
  const finalTextTone = applied ? (darkMode ? 'text-amber-200' : 'text-amber-700') : (darkMode ? 'text-green-200' : 'text-green-700')
  const adopted = !result
    ? '—'
    : result.limitation.rule === 'rc_limit'
      ? (en
        ? <>Code limit triggered; adopt <Km math={SYM.RcStar} /> = <span data-testid="bq-limitation-rc-final" className={`font-semibold tabular-nums ${finalTextTone}`}>{result.effective.rc} MPa</span></>
        : <>触发规范限制，采用 <Km math={SYM.RcStar} /> = <span data-testid="bq-limitation-rc-final" className={`font-semibold tabular-nums ${finalTextTone}`}>{result.effective.rc} MPa</span></>)
      : result.limitation.rule === 'kv_limit'
        ? (en
          ? <>Code limit triggered; adopt <Km math={SYM.KvStar} /> = <span data-testid="bq-limitation-kv-final" className={`font-semibold tabular-nums ${finalTextTone}`}>{result.effective.kv}</span></>
          : <>触发规范限制，采用 <Km math={SYM.KvStar} /> = <span data-testid="bq-limitation-kv-final" className={`font-semibold tabular-nums ${finalTextTone}`}>{result.effective.kv}</span></>)
        : (en ? 'No code limit triggered; input values adopted.' : '未触发规范限制，采用输入值')
  return (
    <section data-testid="bq-limitation-formulas" className={`rounded-lg border p-4 sm:p-5 ${darkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-white'}`}>
      <h3 className={`mb-3 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Code limits' : '规范限定'}</h3>
      <FormulaFrame darkMode={darkMode}>
        <div className={`space-y-1 text-center ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          <Kblock math={String.raw`R_c>90K_v+30\quad\Rightarrow\quad R_c=90K_v+30`} />
          <Kblock math={String.raw`K_v>0.04R_c+0.4\quad\Rightarrow\quad K_v=0.04R_c+0.4`} />
        </div>
      </FormulaFrame>
      <div className={`mt-3 rounded-lg border px-3 py-3 text-sm ${darkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span>{en ? 'Input' : '输入'}：<Km math={SYM.Rc} /> = <span data-testid="bq-limitation-rc-original" className="font-semibold tabular-nums">{result ? `${result.original.rc} MPa` : '—'}</span>，<Km math={SYM.Kv} /> = <span data-testid="bq-limitation-kv-original" className="font-semibold tabular-nums">{result ? result.original.kv : '—'}</span></span>
          <span data-testid="bq-limitation-status" className={result ? finalTextTone : mutedClass(darkMode)}>{adopted}</span>
        </div>
      </div>
    </section>
  )
}

function BqResultSection({ darkMode, language, result, baseReady, mode, enteredCorrection, onEnterCorrection }: { darkMode: boolean; language: 'zh' | 'en'; result: BqResult | null; baseReady: boolean; mode: BqFormState['mode']; enteredCorrection?: boolean; onEnterCorrection: () => void }) {
  const en = language === 'en'
  const grade = result ? gradeForBq(result.basicBq) : null
  return (
    <section data-testid="bq-result-section" className={sectionClass(darkMode)}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'BQ evaluation result' : 'BQ评价结果'}</h2>
        <span className={`text-2xl font-bold tabular-nums ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{result ? result.basicBq : '—'}</span>
      </div>
      {grade ? <p className={`mt-2 text-sm ${darkMode ? 'text-green-300' : 'text-green-800'}`}>{en ? `${grade.label.en} · ${grade.quality.en}` : `${grade.label.zh} · ${grade.quality.zh}`}</p> : <p className={`mt-2 text-sm ${mutedClass(darkMode)}`}>{en ? <>Enter <Km math={SYM.Rc} /> and <Km math={SYM.Kv} /> to calculate the basic <Km math="\mathrm{BQ}" />.</> : <>请输入 <Km math={SYM.Rc} /> 和 <Km math={SYM.Kv} /> 后查看基本 <Km math="\mathrm{BQ}" /> 结果。</>}</p>}
      <BqGradeTable darkMode={darkMode} language={language} activeGrade={grade?.id ?? null} />
      {mode === 'basic' && !enteredCorrection ? <div className={`mt-4 space-y-3 border-t pt-3 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <p className={`text-sm ${mutedClass(darkMode)}`}>{en ? 'Detailed classification follows the engineering type: underground and slope works correct the basic BQ for groundwater, discontinuity orientation and in-situ stress; foundation works are judged from the qualitative characteristics of rock-mass basic quality.' : '工程岩体详细定级应按工程类型分别进行：地下、边坡工程在基本 BQ 上计入地下水、主要结构面产状及初始应力等影响；地基工程按岩体基本质量的定性特征判定等级。'}</p>
        <div className="flex justify-end">
          <button type="button" onClick={onEnterCorrection} disabled={!baseReady} className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-3 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">{en ? 'Enter corrected [BQ]' : '进入修正 [BQ]'}<ArrowRight className="h-4 w-4" aria-hidden /></button>
        </div>
      </div> : null}
    </section>
  )
}

function BqCorrectedResult({ darkMode, language, result, variant = 'underground' }: { darkMode: boolean; language: 'zh' | 'en'; result: BqResult | null; variant?: 'underground' | 'slope' }) {
  const en = language === 'en'
  const slope = variant === 'slope'
  const formula = slope
    ? String.raw`\left[\mathrm{BQ}\right]=\mathrm{BQ}-100\left(K_4+\lambda K_5\right)`
    : String.raw`\left[\mathrm{BQ}\right]=\mathrm{BQ}-100\left(K_1+K_2+K_3\right)`
  return (
    <section data-testid="bq-corrected-result" className={sectionClass(darkMode)}>
      <div className="flex items-center justify-between gap-3"><h2 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? '[BQ] evaluation result' : '[BQ]评价结果'}</h2><span className={`text-2xl font-bold tabular-nums ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{result ? result.engineeringBq : '—'}</span></div>
      <FormulaFrame darkMode={darkMode} compact>
        <div className={`text-center ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}><Kblock math={formula} /></div>
      </FormulaFrame>
      {result ? <p className={`mt-3 text-sm font-medium ${darkMode ? 'text-green-300' : 'text-green-800'}`}>{en ? `${result.grade.label.en} · ${result.grade.quality.en}` : `${result.grade.label.zh} · ${result.grade.quality.zh}`}</p> : <p className={`mt-3 text-sm ${mutedClass(darkMode)}`}>{en ? <>Enter <Km math={SYM.Rc} /> and <Km math={SYM.Kv} /> to show the corrected <Km math="\mathrm{BQ}" /> and final class.</> : <>请输入 <Km math={SYM.Rc} /> 和 <Km math={SYM.Kv} /> 后显示修正 <Km math="\mathrm{BQ}" /> 和最终等级。</>}</p>}
      <BqGradeTable darkMode={darkMode} language={language} activeGrade={result?.grade.id ?? null} />
    </section>
  )
}

function BqLambdaTable({ darkMode, language, rows, selectedId, onSelect }: { darkMode: boolean; language: 'zh' | 'en'; rows: Array<{ id: string; label: string; range: string }>; selectedId: string | null; onSelect: (id: string) => void }) {
  const border = darkMode ? 'border-gray-600' : 'border-gray-300'
  const head = darkMode ? 'bg-gray-700/60 text-gray-200' : 'bg-gray-100 text-gray-700'
  const body = darkMode ? 'text-gray-300' : 'text-gray-700'
  const en = language === 'en'
  return (
    <div data-testid="bq-lambda-table" className="mt-3 space-y-1.5">
      <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{en ? 'Main discontinuity type and persistence correction coefficient (λ)' : '主要结构面类型及其延伸性修正系数（λ）'}</div>
      <div className="overflow-x-auto">
        <table className={`w-full min-w-[420px] border-collapse border text-sm ${border}`}>
          <thead className={head}>
            <tr>
              <th className="border px-2 py-2 text-left font-medium">{en ? 'Main discontinuity type and persistence' : '主要结构面类型及其延伸性'}</th>
              <th className="border px-2 py-2 text-center font-medium"><Km math="\lambda" /></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selected = row.id === selectedId
              return (
                <tr
                  key={row.id}
                  tabIndex={0}
                  onClick={() => onSelect(row.id)}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(row.id) } }}
                  className={`cursor-pointer ${selected ? (darkMode ? 'bg-blue-900/50 text-blue-100' : 'bg-blue-100 text-blue-900') : `${body} ${darkMode ? 'hover:bg-gray-700/40' : 'hover:bg-gray-50'}`}`}
                >
                  <td className="border px-2 py-2">{row.label}</td>
                  <td className="border px-2 py-2 text-center font-semibold tabular-nums">{row.range}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <button type="button" data-testid="bq-lambda-none-option" onClick={() => onSelect('none')} className={`text-sm ${selectedId === 'none' ? (darkMode ? 'font-semibold text-blue-200' : 'font-semibold text-blue-800') : (darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900')}`}>{en ? 'No controlling main discontinuity (λ = 0)' : '无控制性主要结构面（λ = 0）'}</button>
    </div>
  )
}

function BqSlopeK5Table({
  darkMode,
  language,
  selectedF1Id,
  selectedF2Id,
  selectedF3Id,
  onSelectF1,
  onSelectF2,
  onSelectF3,
}: {
  darkMode: boolean
  language: 'zh' | 'en'
  selectedF1Id: string | null
  selectedF2Id: string | null
  selectedF3Id: string | null
  onSelectF1: (id: string) => void
  onSelectF2: (id: string) => void
  onSelectF3: (id: string) => void
}) {
  const border = darkMode ? 'border-gray-600' : 'border-gray-300'
  const head = darkMode ? 'bg-gray-700/60 text-gray-200' : 'bg-gray-100 text-gray-700'
  const body = darkMode ? 'text-gray-300' : 'text-gray-700'
  const en = language === 'en'
  const groups: Array<{ symbol: string; factor: string; options: readonly BqFactorOption[]; selectedId: string | null; onSelect: (id: string) => void }> = [
    { symbol: 'F_1', factor: en ? 'Angle between discontinuity dip direction and slope dip direction (°)' : '结构面倾向与边坡坡面倾向夹角（°）', options: BQ_SLOPE_F1_OPTIONS, selectedId: selectedF1Id, onSelect: onSelectF1 },
    { symbol: 'F_2', factor: en ? 'Discontinuity dip angle (°)' : '结构面倾角（°）', options: BQ_SLOPE_F2_OPTIONS, selectedId: selectedF2Id, onSelect: onSelectF2 },
    { symbol: 'F_3', factor: en ? 'Discontinuity dip minus slope dip (°)' : '结构面倾角与边坡坡角之差（°）', options: BQ_SLOPE_F3_OPTIONS, selectedId: selectedF3Id, onSelect: onSelectF3 },
  ]
  const cellClass = (selected: boolean) => `border px-2 py-1.5 text-center tabular-nums cursor-pointer ${selected ? (darkMode ? 'bg-blue-900/50 text-blue-100' : 'bg-blue-100 text-blue-900') : (darkMode ? 'hover:bg-gray-700/40' : 'hover:bg-gray-50')}`
  return (
    <div data-testid="bq-k5-table" className="mt-3 space-y-1.5">
      <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{en ? 'Main discontinuity orientation correction coefficient (K₅ = F₁ × F₂ × F₃)' : '主要结构面产状影响修正系数（K₅ = F₁ × F₂ × F₃）'}</div>
      <div className="overflow-x-auto">
        <table className={`w-full min-w-[720px] border-collapse border text-sm ${border}`}>
          <thead className={head}>
            <tr>
              <th className="border px-2 py-2 text-center font-medium" colSpan={2}>{en ? 'Correction coefficient' : '修正系数'}</th>
              {groups[0].options.map((option) => <th key={option.id} className="border px-2 py-2 text-center font-medium">{option.influence[language]}</th>)}
            </tr>
          </thead>
          <tbody className={body}>
            {groups.map((group) => (
              <Fragment key={group.symbol}>
                <tr>
                  <th className="border px-2 py-2 text-center font-medium" rowSpan={2}><Km math={group.symbol} /></th>
                  <td className="border px-2 py-1.5 text-left">{group.factor}</td>
                  {group.options.map((option) => {
                    const selected = option.id === group.selectedId
                    return <td key={option.id} role="button" tabIndex={0} aria-selected={selected} onClick={() => group.onSelect(option.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); group.onSelect(option.id) } }} className={cellClass(selected)}>{option.condition[language]}</td>
                  })}
                </tr>
                <tr>
                  <td className="border px-2 py-1.5 text-center font-medium">{en ? 'Value' : '取值'}</td>
                  {group.options.map((option) => {
                    const selected = option.id === group.selectedId
                    return <td key={option.id} role="button" tabIndex={0} aria-selected={selected} onClick={() => group.onSelect(option.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); group.onSelect(option.id) } }} className={`${cellClass(selected)} font-semibold`}>{formatFactorValue(option.value)}</td>
                  })}
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className={`text-xs leading-relaxed ${mutedClass(darkMode)}`}>{en ? 'For F₃, a negative difference means the discontinuity dip is smaller than the slope dip, so the discontinuity daylights on the slope face.' : 'F₃ 差值为负表示结构面倾角小于边坡坡角，结构面在坡面出露。'}</p>
    </div>
  )
}

function HelperToggle({ darkMode, open, onToggle, label }: { darkMode: boolean; open: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`mt-3 inline-flex items-center gap-1 text-sm font-medium ${darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800'}`}
    >
      <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      {label}
    </button>
  )
}

function ApplyButton({ darkMode, disabled, onClick, ariaLabel, className = '', children }: { darkMode: boolean; disabled?: boolean; onClick: () => void; ariaLabel?: string; className?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex min-h-[40px] items-center justify-center whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium ${darkMode ? 'border-blue-500 bg-blue-600 text-white hover:bg-blue-500' : 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'} disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}

function RcHelper({ darkMode, language, value, onValueChange, estimate, onApply }: { darkMode: boolean; language: 'zh' | 'en'; value: string; onValueChange: (value: string) => void; estimate: number | null; onApply: () => void }) {
  const en = language === 'en'
  return (
    <div className={`mt-3 rounded-lg border p-3 ${darkMode ? 'border-gray-600 bg-gray-800/60' : 'border-gray-200 bg-white'}`}>
      <p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>
        {en ? <><Km math="I_s(50)" /> is used to estimate the intact-rock strength when a saturated UCS test is unavailable. Enter the point-load strength index corrected to a 50 mm equivalent diameter and review the converted <Km math={SYM.Rc} /> before applying it. This estimate does not replace the prescribed UCS test; a reliable measured <Km math={SYM.Rc} /> takes precedence.</> : <><Km math="I_s(50)" /> 用于在缺少饱和单轴抗压强度试验成果时，对完整岩石强度进行间接估算。输入经修正至 50 mm 等效直径的点荷载强度指数，复核换算得到的 <Km math={SYM.Rc} /> 后再应用。该估算值不能替代规范要求的单轴抗压强度试验；存在可靠实测 <Km math={SYM.Rc} /> 时应优先采用实测值。</>}
      </p>
      <div data-testid="bq-rc-helper-formula">
        <FormulaFrame darkMode={darkMode} compact>
          <div className={`text-center ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            <Kblock math={String.raw`R_c=22.82\times I_s(50)^{0.75}`} />
          </div>
        </FormulaFrame>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_150px_120px] sm:items-end">
        <MeasuredNumberField darkMode={darkMode} language={language} name={en ? 'Point-load strength index' : '点荷载强度指数'} symbol="I_s(50)" unit="MPa" ariaLabel="Is(50) · MPa" value={value} min={0} onChange={onValueChange} />
        <span data-testid="bq-rc-helper-estimate" className={`flex min-h-[40px] min-w-[150px] items-center justify-center text-center text-sm font-semibold ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{estimate == null ? '—' : <><Km math={SYM.Rc} /> ≈ {estimate.toFixed(1)} MPa</>}</span>
        <ApplyButton darkMode={darkMode} className="w-[120px]" disabled={estimate == null} onClick={onApply} ariaLabel={en ? 'Apply to Rc' : '应用到 Rc'}>{en ? <>Apply to <Km math={SYM.Rc} /></> : <>应用到 <Km math={SYM.Rc} /></>}</ApplyButton>
      </div>
    </div>
  )
}

function KvHelper({ darkMode, language, vpm, vpr, jv, selectedJvBand, onVpmChange, onVprChange, onJvChange, onJvBandSelect, velocityEstimate, jvEstimate, onApplyVelocity, onApplyJv }: { darkMode: boolean; language: 'zh' | 'en'; vpm: string; vpr: string; jv: string; selectedJvBand: number | null; onVpmChange: (value: string) => void; onVprChange: (value: string) => void; onJvChange: (value: string) => void; onJvBandSelect: (index: number) => void; velocityEstimate: number | null; jvEstimate: { value: number; label: string } | null; onApplyVelocity: () => void; onApplyJv: () => void }) {
  const en = language === 'en'
  const rows = [
    { jv: '< 3', kv: '> 0.75', midpoint: 0.875 },
    { jv: '3–10', kv: '0.55–0.75', midpoint: 0.65 },
    { jv: '10–20', kv: '0.35–0.55', midpoint: 0.45 },
    { jv: '20–35', kv: '0.15–0.35', midpoint: 0.25 },
    { jv: '≥ 35', kv: '≤ 0.15', midpoint: 0.075 },
  ]
  const typedJv = jv.trim() === '' ? null : Number(jv)
  const typedBand = typedJv != null && Number.isFinite(typedJv) && typedJv >= 0
    ? (typedJv < 3 ? 0 : typedJv < 10 ? 1 : typedJv < 20 ? 2 : typedJv < 35 ? 3 : 4)
    : null
  const border = darkMode ? 'border-gray-600' : 'border-gray-300'
  return (
    <div className={`mt-3 space-y-4 rounded-lg border p-3 ${darkMode ? 'border-gray-600 bg-gray-800/60' : 'border-gray-200 bg-white'}`}>
      <div>
        <div data-testid="bq-kv-velocity-formula">
          <FormulaFrame darkMode={darkMode} compact>
            <div className={`text-center ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              <Kblock math={String.raw`K_v=\left(\frac{v_{pm}}{v_{pr}}\right)^2`} />
            </div>
          </FormulaFrame>
        </div>
        <p className={`mt-1 text-sm leading-relaxed ${mutedClass(darkMode)}`}>
          {en ? <><Km math="v_{pm}" /> is the rock-mass elastic longitudinal-wave velocity and <Km math="v_{pr}" /> is the intact-rock core longitudinal-wave velocity. Both values must come from the same engineering zone and use the same unit (km/s). Their squared ratio estimates <Km math={SYM.Kv} />; the result must satisfy <Km math="0\leq K_v\leq1" />.</> : <><Km math="v_{pm}" /> 为岩体弹性纵波速度，<Km math="v_{pr}" /> 为完整岩石岩芯纵波速度。两项资料应来自同一工程分区并采用相同计量单位（km/s）。两者比值的平方用于估算 <Km math={SYM.Kv} />，计算结果应满足 <Km math="0\leq K_v\leq1" />。</>}
        </p>
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_150px_120px] md:items-end">
          <MeasuredNumberField darkMode={darkMode} language={language} name={en ? 'Rock-mass elastic longitudinal-wave velocity' : '岩体弹性纵波速度'} symbol="v_{pm}" unit="km/s" ariaLabel={en ? 'vpm · km/s' : 'vpm · km/s'} value={vpm} min={0} onChange={onVpmChange} />
          <MeasuredNumberField darkMode={darkMode} language={language} name={en ? 'Intact-core longitudinal-wave velocity' : '完整岩石岩芯纵波速度'} symbol="v_{pr}" unit="km/s" ariaLabel={en ? 'vpr · km/s' : 'vpr · km/s'} value={vpr} min={0} onChange={onVprChange} />
          <span data-testid="bq-kv-velocity-estimate" className={`flex min-h-[40px] min-w-[150px] items-center justify-center text-center text-sm font-semibold ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{velocityEstimate == null ? '—' : <><Km math={SYM.Kv} /> ≈ {velocityEstimate.toFixed(3)}</>}</span>
          <ApplyButton darkMode={darkMode} className="w-[120px]" disabled={velocityEstimate == null || velocityEstimate > 1} onClick={onApplyVelocity} ariaLabel={en ? 'Apply to Kv' : '应用到 Kv'}>{en ? <>Apply to <Km math={SYM.Kv} /></> : <>应用到 <Km math={SYM.Kv} /></>}</ApplyButton>
        </div>
        {velocityEstimate != null && velocityEstimate > 1 ? <p className={`mt-2 text-xs ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>{en ? <>The estimate is above 1. Check the two velocity inputs; a physical <Km math={SYM.Kv} /> should be within 0–1.</> : <>估算值大于 1，请检查两项波速输入；物理意义上的 <Km math={SYM.Kv} /> 应位于 0–1。</>}</p> : null}
      </div>
      <div>
        <p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>When reliable wave-velocity data are unavailable, estimate <Km math={SYM.Kv} /> from the standard relationship with volumetric joint count <Km math="J_v" />. Enter <Km math="J_v" /> or select a table band; the displayed midpoint is an auxiliary estimate only and must be confirmed before it is applied.</> : <>当缺少可靠波速资料时，可根据岩体体积节理数 <Km math="J_v" /> 并结合标准对照关系估算 <Km math={SYM.Kv} />。输入 <Km math="J_v" /> 或选择表格区间后，系统显示该区间中值作为辅助估算值；确认后方可回填到 <Km math={SYM.Kv} />。</>}</p>
        <table data-testid="bq-kv-jv-table" className={`mt-2 w-full border-collapse border text-sm ${border} ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <thead className={darkMode ? 'bg-gray-700/60' : 'bg-gray-100'}><tr><th className="border px-2 py-1.5 text-left"><Km math="J_v" />（条/m³）</th><th className="border px-2 py-1.5 text-left"><Km math={SYM.Kv} /></th></tr></thead>
          <tbody>{rows.map((row, index) => {
            const selected = typedBand != null ? typedBand === index : selectedJvBand === index
            return <tr key={row.jv} data-testid={`bq-kv-jv-row-${index}`} tabIndex={0} aria-selected={selected} onClick={() => onJvBandSelect(index)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onJvBandSelect(index) } }} className={`cursor-pointer ${selected ? (darkMode ? 'bg-blue-900/50 text-blue-100' : 'bg-blue-100 text-blue-900') : (darkMode ? 'hover:bg-gray-700/40' : 'hover:bg-gray-50')}`}><td className="border px-2 py-1.5">{row.jv}</td><td className="border px-2 py-1.5">{row.kv}</td></tr>
          })}</tbody>
        </table>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_170px_170px] sm:items-end">
          <MeasuredNumberField darkMode={darkMode} language={language} name={en ? 'Volumetric joint count' : '岩体体积节理数'} symbol="J_v" unit={en ? 'joints/m³' : '条/m³'} ariaLabel={en ? 'Jv · joints/m³' : 'Jv · 条/m³'} value={jv} min={0} onChange={onJvChange} />
          <span data-testid="bq-kv-jv-estimate" className={`flex min-h-[40px] min-w-[170px] items-center justify-center text-center text-sm font-semibold ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{jvEstimate == null ? '—' : <><Km math={SYM.Kv} /> ≈ {jvEstimate.value.toFixed(3)}</>}</span>
          <ApplyButton darkMode={darkMode} className="w-[170px]" disabled={jvEstimate == null} onClick={onApplyJv} ariaLabel={en ? 'Apply midpoint to Kv' : '应用区间中值到 Kv'}>{en ? <>Apply midpoint to <Km math={SYM.Kv} /></> : <>应用区间中值到 <Km math={SYM.Kv} /></>}</ApplyButton>
        </div>
      </div>
    </div>
  )
}

function BqPreview({ darkMode, language, state, correctionStep, result }: { darkMode: boolean; language: 'zh' | 'en'; state: BqFormState; correctionStep: number; result: BqResult | null }) {
  const en = language === 'en'
  void correctionStep
  const panel = `sticky top-0 rounded-lg border p-4 ${darkMode ? 'border-gray-600 bg-gray-800/80' : 'border-gray-200 bg-white shadow-sm'}`
  const basicGrade = result ? gradeForBq(result.basicBq) : null
  const correctedGrade = result && (state.mode === 'underground' || state.mode === 'slope') ? gradeForBq(result.engineeringBq) : null
  const foundationGrade = state.mode === 'foundation' ? resolveFoundationGrade(state) : null
  const foundationQuality = foundationGrade ? BQ_GRADES.find((item) => item.id === foundationGrade.id) : null
  const rcLimited = result?.limitation.applied && result.limitation.rule === 'rc_limit'
  const kvLimited = result?.limitation.applied && result.limitation.rule === 'kv_limit'
  const slopeK5Ready = state.slopeStructureTypeId === 'none' || Boolean(state.slopeF1Id && state.slopeF2Id && state.slopeF3Id)
  const totalItems = state.mode === 'underground' || state.mode === 'slope' ? 5 : 2
  const completedItems = [
    state.rc,
    state.kv,
    state.mode === 'underground' ? result?.corrections.k1?.value : null,
    state.mode === 'underground' ? result?.corrections.k2?.value : null,
    state.mode === 'underground' ? result?.corrections.k3?.value : null,
    state.mode === 'slope' ? result?.corrections.lambda?.value : null,
    state.mode === 'slope' ? result?.corrections.k4?.value : null,
    state.mode === 'slope' && slopeK5Ready && result != null ? (result.corrections.slopeFactors?.k5 ?? 0) : null,
  ].filter((value) => value != null).length
  const correctionValue = (coefficient: BqResult['corrections']['k1'], complete: boolean) =>
    complete && coefficient ? coefficient.value : (en ? 'Pending' : '待完成')
  const gradeText = (grade: { label: { zh: string; en: string }; quality: { zh: string; en: string } } | null | undefined) =>
    grade ? (en ? `${grade.label.en} · ${grade.quality.en}` : `${grade.label.zh} · ${grade.quality.zh}`) : null
  const emptyGrade = en ? <>Enter <Km math={SYM.Rc} /> and <Km math={SYM.Kv} /> to show the class.</> : <>输入 <Km math={SYM.Rc} /> 和 <Km math={SYM.Kv} /> 后显示正式等级</>
  const row = (label: ReactNode, value: ReactNode, done = true, testId?: string) => (
    <li className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-sm ${done ? (darkMode ? 'bg-blue-950/35' : 'bg-blue-50/80') : (darkMode ? 'bg-gray-700/40' : 'bg-gray-50')}`}>
      <span className={`flex min-w-0 items-center gap-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}><span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${done ? 'bg-blue-600 text-white' : (darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-500')}`}>{done ? <Check className="h-3 w-3" aria-hidden /> : '·'}</span><span data-testid={testId} className="min-w-0 break-words leading-5">{label}</span></span>
      <span className={`ml-2 shrink-0 font-semibold tabular-nums ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{value}</span>
    </li>
  )
  const evaluation = (testId: string, title: ReactNode, value: ReactNode, line: string | null, empty: ReactNode) => (
    <div data-testid={testId}>
      <div className="flex items-baseline justify-between">
        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</span>
        <span className={`text-2xl font-bold tabular-nums ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{value}</span>
      </div>
      {line ? <p className={`mt-2 text-sm ${darkMode ? 'text-green-300' : 'text-green-800'}`}>{line}</p> : <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{empty}</p>}
    </div>
  )
  return (
    <aside data-testid="calculation-result-pane" className={panel}>
      <h3 className={`mb-1 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Rating preview' : '分值预览'}</h3>
      <p className={`mb-3 text-xs ${mutedClass(darkMode)}`}>{en ? `${completedItems} / ${totalItems} selected` : `已选 ${completedItems} / ${totalItems} 项`}</p>
      <ul className="space-y-2">
        {row(<span data-testid="bq-preview-rc-label"><span data-testid="bq-preview-effective-rc-label"><Km math={rcLimited ? 'R_c^{*}' : 'R_c'} /></span></span>, rcLimited ? `${result?.effective.rc ?? '—'} MPa` : (state.rc == null ? '—' : `${state.rc} MPa`), rcLimited ? result != null : state.rc != null, 'bq-preview-rc-row')}
        {row(<span data-testid="bq-preview-kv-label"><span data-testid="bq-preview-effective-kv-label"><Km math={kvLimited ? 'K_v^{*}' : 'K_v'} /></span></span>, kvLimited ? (result?.effective.kv ?? '—') : (state.kv == null ? '—' : state.kv), kvLimited ? result != null : state.kv != null, 'bq-preview-kv-row')}
        {row(en ? 'Code limitation' : '规范限定', result ? (result.limitation.applied ? <Km math={result.limitation.rule === 'rc_limit' ? 'R_c' : 'K_v'} /> : (en ? 'None' : '未触发')) : '—', result != null, 'bq-preview-limit-label')}
        {row(<Km math="\mathrm{BQ}" />, result ? result.basicBq : '—', result != null, 'bq-preview-basic-bq-label')}
        {state.mode === 'underground' ? row(<Km math={SYM.K1} />, correctionValue(result?.corrections.k1 ?? null, result != null), result != null, 'bq-preview-k1-label') : null}
        {state.mode === 'underground' ? row(<Km math={SYM.K2} />, correctionValue(result?.corrections.k2 ?? null, result != null), result != null, 'bq-preview-k2-label') : null}
        {state.mode === 'underground' ? row(<Km math={SYM.K3} />, correctionValue(result?.corrections.k3 ?? null, result != null), result != null, 'bq-preview-k3-label') : null}
        {state.mode === 'underground' && result ? row(<Km math="\left[\mathrm{BQ}\right]" />, result.engineeringBq, true, 'bq-preview-corrected-bq-label') : null}
        {state.mode === 'slope' ? row(<Km math="\lambda" />, correctionValue(result?.corrections.lambda ?? null, result != null), result != null, 'bq-preview-lambda-label') : null}
        {state.mode === 'slope' ? row(<Km math={SYM.K4} />, correctionValue(result?.corrections.k4 ?? null, result != null), result != null, 'bq-preview-k4-label') : null}
        {state.mode === 'slope' ? row(<Km math={SYM.K5} />, slopeK5Ready ? (result?.corrections.slopeFactors?.k5 ?? 0) : (en ? 'Pending' : '待完成'), slopeK5Ready && result != null, 'bq-preview-k5-label') : null}
        {state.mode === 'slope' && result ? row(<Km math="\left[\mathrm{BQ}\right]" />, result.engineeringBq, true, 'bq-preview-corrected-bq-label') : null}
      </ul>
      <div className={`mt-4 space-y-3 border-t pt-3 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        {evaluation('bq-preview-basic-result', <><Km math="\mathrm{BQ}" />{en ? ' evaluation result' : '评价结果'}</>, result ? result.basicBq : '—', gradeText(basicGrade), emptyGrade)}
        {state.mode === 'underground' || state.mode === 'slope' ? evaluation('bq-preview-corrected-result', <><Km math={String.raw`\left[\mathrm{BQ}\right]`} />{en ? ' evaluation result' : '评价结果'}</>, result ? result.engineeringBq : '—', gradeText(correctedGrade), emptyGrade) : null}
        {state.mode === 'foundation' ? evaluation('bq-preview-corrected-result', <><Km math={String.raw`\left[\mathrm{BQ}\right]`} />{en ? ' evaluation result' : '评价结果'}</>, foundationGrade ? foundationGrade.label[language] : '—', gradeText(foundationQuality ?? null), en ? 'Select a class from the qualitative table to show the class.' : '点选岩体基本质量等级后显示正式等级') : null}
      </div>
    </aside>
  )
}

function measuredFieldClass(darkMode: boolean, unit?: string) {
  const pad = !unit ? '' : unit.length > 10 ? 'pr-28' : unit.length > 8 ? 'pr-24' : unit.length > 4 ? 'pr-14' : 'pr-10'
  return `w-full rounded-lg border px-3 py-2 ${pad} text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${darkMode ? 'border-gray-500 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`
}

function MeasuredNumberField({
  darkMode,
  language,
  name,
  symbol,
  unit,
  value,
  min,
  max,
  step = 'any',
  ariaLabel,
  inputId,
  onChange,
}: {
  darkMode: boolean
  language: 'zh' | 'en'
  name: ReactNode
  symbol?: string
  unit?: string
  value: number | string | null
  min?: number
  max?: number
  step?: number | 'any'
  ariaLabel: string
  inputId?: string
  onChange: (raw: string) => void
}) {
  const en = language === 'en'
  return (
    <label className="block space-y-1">
      <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {name}
        {symbol ? <>{' '}<Km math={symbol} /></> : null}
      </span>
      <div className="relative">
        <input
          id={inputId}
          aria-label={ariaLabel}
          type="number"
          min={min}
          max={max}
          step={step}
          placeholder={en ? 'Enter value' : '请输入数值'}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
          onWheel={preventNumberWheel}
          onKeyDown={preventNumberArrow}
          className={measuredFieldClass(darkMode, unit)}
        />
        {unit ? <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs ${mutedClass(darkMode)}`}>{unit}</span> : null}
      </div>
    </label>
  )
}

function formatCoefficientScore(value: number | null | undefined) {
  if (value == null) return '—'
  return String(Number(value.toFixed(3)))
}

function CoefficientSectionHeader({
  darkMode,
  language,
  title,
  symbol,
  score,
  editing,
  canEdit,
  value,
  validationMin,
  validationMax,
  onStartEdit,
  onChange,
  onEndEdit,
}: {
  darkMode: boolean
  language: 'zh' | 'en'
  title: ReactNode
  symbol: string
  score: number | null | undefined
  editing: boolean
  canEdit: boolean
  value: number | null
  validationMin: number
  validationMax: number
  onStartEdit: () => void
  onChange: (value: number | null) => void
  onEndEdit: () => void
}) {
  const en = language === 'en'
  const invalid = value != null && (value < validationMin || value > validationMax)
  const editHint = en ? 'Click to edit' : '点击修改'
  const invalidText = en
    ? `Value must be between ${validationMin} and ${validationMax}.`
    : `异常值：请输入 ${validationMin}～${validationMax} 范围内的 ${symbol}。`
  const scoreClass = `text-sm font-semibold tabular-nums ${score != null ? (darkMode ? 'text-blue-200' : 'text-blue-800') : mutedClass(darkMode)}`
  const slotClass = 'relative h-8 w-24 shrink-0'
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <h2 className={`min-w-0 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{title}</h2>
      <div className={slotClass}>
        {editing ? (
          <input
            aria-label={en ? `${symbol} adopted value` : `${symbol} 输入值`}
            autoFocus
            type="number"
            step="0.01"
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
            onBlur={onEndEdit}
            onWheel={preventNumberWheel}
            onKeyDown={(event) => {
              preventNumberArrow(event)
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
            placeholder={en ? 'Enter value' : '请输入数值'}
            className={`absolute inset-0 h-8 w-24 rounded-lg border px-2 text-right text-sm tabular-nums outline-none focus:ring-2 focus:ring-blue-500/30 ${darkMode ? 'border-gray-500 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
          />
        ) : canEdit ? (
          <button
            type="button"
            aria-label={en ? `Edit ${symbol}` : `修改 ${symbol}`}
            title={editHint}
            onClick={onStartEdit}
            className="group absolute inset-0 flex items-center justify-end pr-2.5"
          >
            <span data-testid={`bq-${symbol.toLowerCase()}-score`} className={scoreClass}>{formatCoefficientScore(score)}</span>
            <span className={`absolute right-0 top-0 text-[11px] font-semibold leading-none ${invalid ? 'text-red-600 dark:text-red-300' : (darkMode ? 'text-blue-300' : 'text-blue-700')}`} aria-hidden>*</span>
            <span className={`pointer-events-none absolute bottom-full right-0 z-20 mb-1 hidden whitespace-nowrap rounded-md px-2 py-1 text-xs shadow-sm group-hover:block ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-900 text-white'}`}>{editHint}</span>
          </button>
        ) : (
          <div data-testid={`bq-${symbol.toLowerCase()}-score`} className={`flex h-full w-full items-center justify-end ${scoreClass}`}>{formatCoefficientScore(score)}</div>
        )}
        {invalid ? <p role="alert" className={`pointer-events-none absolute right-0 top-full z-20 mt-1 w-max max-w-[16rem] rounded-md px-2 py-1 text-left text-xs shadow-sm ${darkMode ? 'bg-gray-800 text-red-300' : 'bg-white text-red-600 ring-1 ring-red-200'}`}>{invalidText}</p> : null}
      </div>
    </div>
  )
}

export default function BqClassificationPage(props: BqProps) {
  const { darkMode, language, form, caseName, pointName, pointNote, pointOreType, oreTypeOptions = [], pointOrdinal, pointTotal, onFormChange, onPointNameChange, onPointNoteChange, onPointOreTypeChange, onBackToWorkspace, onBackToPoints, onComplete, onNext } = props
  const en = language === 'en'
  const state = normalizeBqState(form)
  const [correctionStep, setCorrectionStep] = useState(state.mode === 'underground' ? Math.max(1, state.correctionStep ?? 1) : 0)
  const [correctionOpen, setCorrectionOpen] = useState(state.mode !== 'basic')
  const [rcHelperOpen, setRcHelperOpen] = useState(false)
  const [kvHelperOpen, setKvHelperOpen] = useState(false)
  const [is50, setIs50] = useState('')
  const [vpm, setVpm] = useState('')
  const [vpr, setVpr] = useState('')
  const [jv, setJv] = useState('')
  const [selectedJvBand, setSelectedJvBand] = useState<number | null>(null)
  const [attempted, setAttempted] = useState(false)
  const [editingCoefficient, setEditingCoefficient] = useState<'K1' | 'K2' | 'K3' | 'lambda' | 'K4' | null>(null)

  const patch = (next: Partial<BqFormState>) => {
    const baseChanged = (state.mode === 'underground' || state.mode === 'slope') && ('rc' in next || 'kv' in next)
    const nextStep = baseChanged ? 4 : next.correctionStep
    onFormChange({ ...state, ...next, ...(baseChanged && state.mode === 'underground' ? { k1Value: null, k2Value: null, k3Value: null } : {}), ...(baseChanged && state.mode === 'slope' ? { k4Value: null } : {}), ...(nextStep != null ? { correctionStep: nextStep } : {}) } as unknown as Record<string, unknown>)
    if (baseChanged) {
      setCorrectionStep(1)
      setEditingCoefficient(null)
    }
  }
  const result = useMemo(() => tryCalculateBq(state), [state])
  const baseIssues = validateBqState({ ...state, mode: 'basic' }).filter((item) => item.severity === 'error')
  const baseReady = state.rc != null && state.kv != null && baseIssues.length === 0
  const foundationGrade = resolveFoundationGrade(state)
  const slopeK5Ready = state.slopeStructureTypeId === 'none' || Boolean(state.slopeF1Id && state.slopeF2Id && state.slopeF3Id)
  const correctionReady = state.mode === 'underground' ? baseReady : state.mode === 'foundation' ? baseReady && foundationGrade != null : state.mode === 'slope' ? baseReady && slopeK5Ready : false
  const selectedWater = BQ_UNDERGROUND_WATER_OPTIONS.find((item) => item.id === state.undergroundWaterId)
  const selectedOrientation = BQ_UNDERGROUND_ORIENTATION_OPTIONS.find((item) => item.id === state.undergroundOrientationId)
  const selectedStress = BQ_UNDERGROUND_STRESS_OPTIONS.find((item) => item.id === state.undergroundStressId)
  const selectedSlopeWater = BQ_SLOPE_WATER_OPTIONS.find((item) => item.id === state.slopeWaterId)
  const selectedLambda = BQ_SLOPE_LAMBDA_OPTIONS.find((item) => item.id === state.slopeStructureTypeId)
  const baseGrade: BqGradeId = result ? gradeForBq(result.basicBq).id : 'V'
  const selectedWaterRange = selectedWater?.values.find((item) => item.grade === baseGrade)?.range
  const selectedSlopeWaterRange = selectedSlopeWater?.values.find((item) => item.grade === baseGrade)?.range
  const selectedStressRange = selectedStress?.values.find((item) => item.grade === baseGrade)?.range
  const groundwaterAssessment = assessGroundwaterK1(state.groundwaterPressureP, state.groundwaterInflowQ, baseGrade)
  const waterRows = BQ_UNDERGROUND_WATER_OPTIONS.map((item) => ({ id: item.id, label: en ? item.label.en : item.label.zh, labelNode: undergroundWaterLabel(item.id, en), range: rangeText(item.values.find((value) => value.grade === baseGrade)?.range ?? { min: 0, max: 0 }), gradeRanges: Object.fromEntries(item.values.map((value) => [value.grade, rangeText(value.range)])) as Partial<Record<BqGradeId, string>>, note: item.id === 'none' ? (en ? 'No groundwater correction' : '不产生地下水修正') : undefined }))
  const slopeWaterRows = BQ_SLOPE_WATER_OPTIONS.map((item) => ({ id: item.id, label: en ? item.label.en : item.label.zh, range: rangeText(item.values.find((value) => value.grade === baseGrade)?.range ?? { min: 0, max: 0 }), gradeRanges: Object.fromEntries(item.values.map((value) => [value.grade, rangeText(value.range)])) as Partial<Record<BqGradeId, string>>, note: item.id === 'none' ? (en ? 'No slope groundwater correction' : '不产生边坡地下水修正') : undefined }))
  const lambdaRows = BQ_SLOPE_LAMBDA_OPTIONS.filter((item) => item.id !== 'none').map((item) => ({ id: item.id, label: en ? item.label.en : item.label.zh, range: lambdaRangeText(item.range) }))
  const stressRows = BQ_UNDERGROUND_STRESS_OPTIONS.map((item) => ({ id: item.id, label: en ? item.label.en : item.label.zh, labelNode: undergroundStressLabel(item.id, en), range: rangeText(item.values.find((value) => value.grade === baseGrade)?.range ?? { min: 0, max: 0 }), gradeRanges: Object.fromEntries(item.values.map((value) => [value.grade, rangeText(value.range)])) as Partial<Record<BqGradeId, string>> }))
  const orientationRows = BQ_UNDERGROUND_ORIENTATION_OPTIONS.map((item) => ({ id: item.id, label: en ? item.label.en : item.label.zh, range: rangeText(item.range), note: item.note ? (en ? item.note.en : item.note.zh) : undefined }))
  const rcEstimate = is50.trim() === '' ? null : estimateRcFromIs50(Number(is50))
  const kvVelocity = vpm.trim() === '' || vpr.trim() === '' ? null : estimateKvFromVelocities(Number(vpm), Number(vpr))
  const kvJv = jv.trim() === ''
    ? (selectedJvBand == null ? null : estimateKvFromJv([1, 5, 15, 25, 35][selectedJvBand]))
    : interpolateKvFromJv(Number(jv))

  const clearVelocityInputs = () => { setVpm(''); setVpr('') }
  const clearJvInputs = () => { setJv(''); setSelectedJvBand(null) }
  const midpointForWater = (id: string) => {
    const option = BQ_UNDERGROUND_WATER_OPTIONS.find((item) => item.id === id)
    if (!option) return 0
    const cell = option.values.find((item) => item.grade === baseGrade)?.range ?? { min: 0, max: 0 }
    return cell.max
  }
  const updateGroundwaterInput = (field: 'groundwaterPressureP' | 'groundwaterInflowQ', value: string) => {
    const parsed = value === '' ? null : Number(value)
    const exclusive = field === 'groundwaterPressureP'
      ? { groundwaterPressureP: parsed, ...(parsed != null ? { groundwaterInflowQ: null as number | null } : {}) }
      : { groundwaterInflowQ: parsed, ...(parsed != null ? { groundwaterPressureP: null as number | null } : {}) }
    const next = { ...state, ...exclusive }
    const assessment = assessGroundwaterK1(next.groundwaterPressureP, next.groundwaterInflowQ, baseGrade)
    const assessedRange = assessment ? BQ_UNDERGROUND_WATER_OPTIONS.find((item) => item.id === assessment.optionId)?.values.find((item) => item.grade === baseGrade)?.range : null
    patch({ ...exclusive, ...(assessment ? { undergroundWaterId: assessment.optionId, k1Value: assessedRange?.max ?? 0 } : {}) })
  }
  const midpointForSlopeWater = (id: string) => {
    const option = BQ_SLOPE_WATER_OPTIONS.find((item) => item.id === id)
    if (!option) return 0
    const cell = option.values.find((item) => item.grade === baseGrade)?.range ?? { min: 0, max: 0 }
    return cell.max
  }
  const updateSlopeWaterInput = (field: 'slopeWaterHeadPw' | 'slopeHeightH', value: string) => {
    const parsed = value === '' ? null : Number(value)
    const next = { ...state, [field]: parsed }
    const assessment = assessSlopeK4(next.slopeWaterHeadPw, next.slopeHeightH, baseGrade)
    const assessedRange = assessment ? BQ_SLOPE_WATER_OPTIONS.find((item) => item.id === assessment.optionId)?.values.find((item) => item.grade === baseGrade)?.range : null
    patch({ [field]: parsed, ...(assessment ? { slopeWaterId: assessment.optionId, k4Value: assessedRange?.max ?? 0 } : {}) })
  }
  const updateStressRatio = (value: string) => {
    const parsed = value === '' ? null : Number(value)
    const stressId = parsed == null ? state.undergroundStressId : parsed < 4 ? 'ratio_lt4' : parsed <= 7 ? 'ratio_4_7' : 'none_or_ratio_gt7'
    patch({ undergroundStressRatio: parsed, undergroundStressId: stressId, k3Value: null })
  }
  const updateDirectKv = (value: string) => {
    clearVelocityInputs()
    clearJvInputs()
    patch({ kv: value === '' ? null : Number(value) })
  }
  const updateVelocityInput = (setter: (value: string) => void, value: string) => {
    clearJvInputs()
    patch({ kv: null })
    setter(value)
  }
  const updateJvInput = (value: string) => {
    clearVelocityInputs()
    setSelectedJvBand(null)
    patch({ kv: null })
    setJv(value)
  }
  const selectJvBand = (index: number) => {
    clearVelocityInputs()
    setJv('')
    patch({ kv: null })
    setSelectedJvBand(index)
  }
  const applyVelocityKv = () => {
    if (kvVelocity == null) return
    clearJvInputs()
    patch({ kv: Number(kvVelocity.toFixed(4)) })
  }
  const applyJvKv = () => {
    if (kvJv == null) return
    clearVelocityInputs()
    patch({ kv: kvJv.value })
  }

  const completeBasic = () => { if (!baseReady) { setAttempted(true); return }; setAttempted(false); onComplete() }
  const enterCorrection = () => { if (!baseReady) { setAttempted(true); return }; setCorrectionOpen(true) }
  const completeCorrection = () => { if (!baseReady || state.mode === 'basic' || !correctionReady) { setAttempted(true); return }; setAttempted(false); onComplete() }

  return (
    <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="grid w-full min-h-0 flex-1 grid-cols-1 gap-4 px-4 py-5 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,3fr)_minmax(220px,1fr)]">
        <main data-testid="calculation-input-pane" className="thin-scroll -mr-1 min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto pr-0.5">
          <header className="flex items-start gap-2"><BackIconButton label={en ? 'Back' : '返回'} onClick={onBackToPoints} darkMode={darkMode} className="mt-1" /><div className="min-w-0"><nav className={`flex flex-wrap items-center gap-1 text-xs ${mutedClass(darkMode)}`}><button type="button" onClick={onBackToWorkspace} className={darkMode ? 'hover:text-blue-300' : 'hover:text-blue-700'}>{en ? 'Project workspace' : '项目工作区'}</button><span aria-hidden>/</span><button type="button" onClick={onBackToPoints} className={darkMode ? 'hover:text-blue-300' : 'hover:text-blue-700'}>{caseName}</button><span aria-hidden>/</span><span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{pointName}</span></nav><h1 className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'BQ Engineering Rock Mass Classification' : 'BQ 工程岩体分级'}</h1><p className={`mt-1 text-sm ${mutedClass(darkMode)}`}>{en ? 'Point' : '点位'} {pointOrdinal} / {pointTotal}</p></div></header>

          <section className={sectionClass(darkMode)}>
            <PointInformationFields
              darkMode={darkMode}
              language={language}
              pointOrdinal={pointOrdinal}
              pointName={pointName}
              pointNote={pointNote}
              pointOreType={pointOreType}
              oreTypeOptions={oreTypeOptions}
              listId="bq-rock-mass-groups"
              inputClassName={fieldClass(darkMode)}
              onPointNameChange={onPointNameChange}
              onPointNoteChange={onPointNoteChange}
              onPointOreTypeChange={onPointOreTypeChange}
            />
          </section>

          <section data-testid="bq-main-card" className={sectionClass(darkMode)}>
            <p className={`text-sm leading-relaxed mb-4 ${mutedClass(darkMode)}`}>
              {en ? (
                <>
                  Basic rock-mass quality is evaluated using the saturated uniaxial compressive strength of intact rock <Km math={SYM.Rc} /> and the rock-mass integrity index <Km math={SYM.Kv} />. <Km math={SYM.Rc} /> represents the strength of the intact rock material, while <Km math={SYM.Kv} /> reflects the influence of discontinuities such as joints and fractures on rock-mass integrity.
                  The basic quality index is <Km math={SYM.BQ_formula} />; representative measured data from the same engineering zone should be used whenever available.
                </>
              ) : (
                <>
                  岩体基本质量评价以完整岩石饱和单轴抗压强度 <Km math={SYM.Rc} /> 和岩体完整性指数 <Km math={SYM.Kv} /> 为主要评价指标。<Km math={SYM.Rc} /> 反映完整岩石材料的强度特征，<Km math={SYM.Kv} /> 综合反映节理、裂隙等不连续面对岩体完整性的影响。
                  依据标准采用 <Km math={SYM.BQ_formula} /> 计算岩体基本质量指标；<Km math={SYM.Rc} /> 和 <Km math={SYM.Kv} /> 应优先采用同一工程分区内具有代表性的实测资料。
                </>
              )}
            </p>

            <div data-testid="bq-standard-formulas">
              <FormulaFrame darkMode={darkMode}>
                <div className={`space-y-1 text-center ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  <Kblock math={SYM.BQ_formula} />
                </div>
              </FormulaFrame>
            </div>

            <div className="mt-2 space-y-4">
            <section className={`rounded-lg border p-4 sm:p-5 ${darkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-white'}`}>
            <div className="mb-2 flex items-center gap-2"><h2 data-testid="bq-basic-quality-title" className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Basic rock-mass quality' : '岩体基本质量'}</h2></div>
            <p className={`mb-4 text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>Use representative measured <Km math={SYM.Rc} /> and <Km math={SYM.Kv} /> from the same engineering zone whenever available. If direct test results are unavailable, use one of the auxiliary methods below to obtain an estimate, review its applicability against the geological data, and apply it only after confirmation.</> : <>有条件时应优先采用同一工程分区内具有代表性的实测 <Km math={SYM.Rc} /> 和 <Km math={SYM.Kv} />。缺少直接试验成果时，可使用下方辅助方法进行估算；估算结果应结合工程地质资料复核，确认后方可应用。</>}</p>
            <div data-field="rc" className={`border-t pt-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <MeasuredNumberField darkMode={darkMode} language={language} inputId="bq-rc" name={en ? 'Saturated UCS' : '饱和岩石单轴抗压强度'} symbol="R_c" unit="MPa" ariaLabel={en ? 'Rc input (MPa)' : 'Rc 输入值（MPa）'} value={state.rc} min={0} onChange={(raw) => patch({ rc: raw === '' ? null : Number(raw) })} />
              <p className={`mt-2 text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>Use the saturated uniaxial compressive strength of intact rock. If only a point-load test is available, convert <Km math="I_s(50)" /> with the helper below.</> : <>输入完整岩石在饱和状态下的单轴抗压强度。只有点荷载试验结果时，可用下方 <Km math="I_s(50)" /> 换算辅助计算。</>}</p>
              <HelperToggle darkMode={darkMode} open={rcHelperOpen} onToggle={() => setRcHelperOpen((open) => !open)} label={en ? 'Open point-load estimate' : '展开点荷载换算'} />
              {rcHelperOpen ? <RcHelper darkMode={darkMode} language={language} value={is50} onValueChange={setIs50} estimate={rcEstimate} onApply={() => rcEstimate != null && patch({ rc: Number(rcEstimate.toFixed(2)) })} /> : null}
            </div>
            <div data-field="kv" className={`mt-4 border-t pt-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <MeasuredNumberField darkMode={darkMode} language={language} inputId="bq-kv" name={en ? 'Rock-mass integrity index' : '岩体完整性指数'} symbol="K_v" ariaLabel={en ? 'Kv input' : 'Kv 输入值'} value={state.kv} min={0} max={1} step={0.01} onChange={updateDirectKv} />
              <p className={`mt-2 text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>Enter the tested integrity index after joints and fractures are considered. If <Km math={SYM.Kv} /> is unavailable, use the wave-velocity method or the <Km math="J_v" /> table below.</> : <>输入考虑节理、裂隙后的岩体完整性指数。没有实测 <Km math={SYM.Kv} /> 时，可用波速法或下方 <Km math="J_v" /> 对照表估算。</>}</p>
              <HelperToggle darkMode={darkMode} open={kvHelperOpen} onToggle={() => setKvHelperOpen((open) => !open)} label={en ? 'Open velocity / Jv helpers' : '展开波速法 / Jv 对照'} />
              {kvHelperOpen ? <KvHelper darkMode={darkMode} language={language} vpm={vpm} vpr={vpr} jv={jv} selectedJvBand={selectedJvBand} onVpmChange={(value) => updateVelocityInput(setVpm, value)} onVprChange={(value) => updateVelocityInput(setVpr, value)} onJvChange={updateJvInput} onJvBandSelect={selectJvBand} velocityEstimate={kvVelocity} jvEstimate={kvJv} onApplyVelocity={applyVelocityKv} onApplyJv={applyJvKv} /> : null}
            </div>
            </section>
            <BqLimitationPanel darkMode={darkMode} language={language} result={result} />
            </div>
          </section>

          <BqResultSection darkMode={darkMode} language={language} result={result} baseReady={baseReady} mode={state.mode} enteredCorrection={correctionOpen} onEnterCorrection={enterCorrection} />

            {correctionOpen || state.mode !== 'basic' ? <>
            <section data-testid="bq-correction-scenario" className={sectionClass(darkMode)}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Corrected BQ' : '修正 BQ'}</h2>
                <div className="min-w-[220px] max-w-sm flex-1">
                  <CenteredSelect
                    darkMode={darkMode}
                    value={state.mode === 'basic' ? '' : state.mode}
                    ariaLabel={en ? 'Correction engineering type' : '修正工程类型'}
                    placeholder={en ? 'Select engineering type' : '请选择修正工程类型'}
                    options={correctionTypeOptions(en)}
                    onChange={(mode) => {
                      if (mode === 'underground' || mode === 'foundation' || mode === 'slope') {
                        patch({ mode, correctionStep: 4, foundationF0: null })
                        setCorrectionStep(4)
                        setEditingCoefficient(null)
                      }
                    }}
                  />
                </div>
              </div>
              {state.mode === 'basic' ? <p className={`mt-3 text-sm ${mutedClass(darkMode)}`}>{en ? 'Select an engineering type to show the corresponding introduction and formula.' : '请先选择修正工程类型，再显示对应介绍与公式。'}</p> : null}
              {state.mode === 'underground' ? <div data-testid="bq-correction-intro" className="mt-4 space-y-3"><p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? 'For detailed classification of rock masses in underground engineering, the basic quality index BQ shall be corrected for groundwater, discontinuity orientation, and initial stress.' : '地下工程岩体详细定级时，基本质量指标 BQ 可根据地下水、主要结构面产状和初始应力状态进行修正。'}</p><FormulaFrame darkMode={darkMode}><div className={`text-center ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}><Kblock math={String.raw`\left[\mathrm{BQ}\right]=\mathrm{BQ}-100\left(K_1+K_2+K_3\right)`} /></div></FormulaFrame></div> : null}
              {state.mode === 'slope' ? <div data-testid="bq-slope-intro" className="mt-4 space-y-3"><p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>For detailed classification of rock masses in slope engineering, the basic quality index shall be corrected for groundwater and for the type, persistence and orientation of the main discontinuity relative to the slope face. <Km math={SYM.K4} /> is the groundwater-influence coefficient, <Km math="\lambda" /> is the coefficient for main-discontinuity type and persistence, and <Km math={SYM.K5} /> is the orientation-influence coefficient.</> : <>边坡工程岩体详细定级时，应对地下水影响以及主要结构面的类型、延伸性及其产状与边坡临空面的空间组合关系进行修正。<Km math={SYM.K4} /> 为地下水影响修正系数，<Km math="\lambda" /> 为主要结构面类型及其延伸性修正系数，<Km math={SYM.K5} /> 为主要结构面产状影响修正系数。</>}</p><FormulaFrame darkMode={darkMode}><div className={`space-y-1 text-center ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}><Kblock math={String.raw`\left[\mathrm{BQ}\right]=\mathrm{BQ}-100\left(K_4+\lambda K_5\right)`} /><Kblock math={String.raw`K_5=F_1\times F_2\times F_3`} /></div></FormulaFrame></div> : null}
              {state.mode === 'foundation' ? <div data-testid="bq-foundation-intro" className="mt-4 space-y-3">
                <p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>Rock foundation engineering uses rock as the bearing stratum; design is governed by bearing capacity. There is no correction formula. Judge the class from the qualitative characteristics of rock-mass basic quality; the corresponding basic bedrock bearing capacity <Km math="f_0" /> is given for reference only.</> : <>岩石地基工程以岩石作为承载层，设计中最关心的是地基承载能力。本项不使用修正公式：请根据岩体基本质量的定性特征判定等级；判定后给出对应的基岩承载力基本值 <Km math="f_0" />，仅供参考。</>}</p>
                <div data-testid="bq-foundation-correction">
                  <BqGradeTable darkMode={darkMode} language={language} testId="bq-foundation-table" caption={en ? 'Judge the class from qualitative characteristics of rock-mass basic quality' : '按岩体基本质量的定性特征判定等级'} activeGrade={null} selectedGrade={foundationGrade?.id ?? null} onSelect={(id) => { patch({ foundationGradeId: id, foundationF0: null, correctionStep: 4 }); setCorrectionStep(4) }} />
                  <BqFoundationResult darkMode={darkMode} language={language} grade={foundationGrade} />
                </div>
              </div> : null}
            </section>
            {state.mode === 'underground' ? <>
              <section className={sectionClass(darkMode)}>
                <CoefficientSectionHeader
                  darkMode={darkMode}
                  language={language}
                  title={<><Km math={SYM.K1} /> · {en ? 'Groundwater influence' : '地下水影响'}</>}
                  symbol="K1"
                  score={result?.corrections.k1?.value ?? state.k1Value}
                  editing={editingCoefficient === 'K1'}
                  canEdit={Boolean(selectedWater && selectedWater.id !== 'none')}
                  value={state.k1Value}
                  validationMin={selectedWaterRange?.min ?? 0}
                  validationMax={selectedWaterRange?.max ?? 1}
                  onStartEdit={() => {
                    if (state.k1Value == null) patch({ k1Value: selectedWaterRange?.max ?? result?.corrections.k1?.value ?? 0 })
                    setEditingCoefficient('K1')
                  }}
                  onChange={(value) => patch({ k1Value: value })}
                  onEndEdit={() => setEditingCoefficient(null)}
                />
                <p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>This table gives the groundwater-influence coefficient <Km math={SYM.K1} /> by outflow condition and rock-mass basic quality class. Fissure water pressure <Km math="p" /> or inflow per 10 m of tunnel <Km math={SYM.Q} /> may be entered.</> : <>本表为地下水影响修正系数 <Km math={SYM.K1} />，按地下水出水状态及岩体基本质量等级给出。可输入围岩裂隙水压 <Km math="p" /> 或每 10 m 洞长出水量 <Km math={SYM.Q} />。</>}</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
                  <MeasuredNumberField darkMode={darkMode} language={language} name={en ? 'Fissure water pressure' : '围岩裂隙水压'} symbol="p" unit="MPa" ariaLabel={en ? 'Fissure water pressure p' : '围岩裂隙水压 p'} value={state.groundwaterPressureP} min={0} onChange={(raw) => updateGroundwaterInput('groundwaterPressureP', raw)} />
                  <div className={`flex items-center justify-center px-1 text-sm ${mutedClass(darkMode)} sm:h-10`}>{en ? 'or' : '或'}</div>
                  <MeasuredNumberField darkMode={darkMode} language={language} name={en ? 'Inflow per 10 m of tunnel' : '每10m洞长出水量'} symbol="Q" unit="L/min·10m" ariaLabel={en ? 'Inflow per 10 m Q' : '每10m洞长出水量 Q'} value={state.groundwaterInflowQ} min={0} onChange={(raw) => updateGroundwaterInput('groundwaterInflowQ', raw)} />
                </div>
                {groundwaterAssessment ? <p data-testid="bq-k1-assessment" className={`mt-2 text-sm ${mutedClass(darkMode)}`}>{en ? `Assessed condition: ${BQ_UNDERGROUND_WATER_OPTIONS.find((item) => item.id === groundwaterAssessment.optionId)?.label.en ?? ''}; default K1 = ${groundwaterAssessment.value.toFixed(3)}` : <>判断结果：{BQ_UNDERGROUND_WATER_OPTIONS.find((item) => item.id === groundwaterAssessment.optionId)?.label.zh ?? ''}；默认 <Km math={SYM.K1} /> = {groundwaterAssessment.value.toFixed(3)}</>}</p> : null}
                <BqTable testId="bq-k1-table" rowHeader={en ? 'Groundwater outflow condition' : '地下水出水状态'} darkMode={darkMode} language={language} title={en ? <>Groundwater condition · <Km math={SYM.K1} /></> : <>地下水出水状态与 <Km math={SYM.K1} /></>} rows={waterRows} activeGrade={baseGrade} selectedId={state.undergroundWaterId} onSelect={(id) => { patch({ undergroundWaterId: id, groundwaterPressureP: null, groundwaterInflowQ: null, k1Value: midpointForWater(id), correctionStep: 4 }); setCorrectionStep(4); setEditingCoefficient(null) }} />
              </section>
              <section className={sectionClass(darkMode)}>
                <CoefficientSectionHeader
                  darkMode={darkMode}
                  language={language}
                  title={<><Km math={SYM.K2} /> · {en ? 'Major discontinuity orientation' : '主要结构面产状'}</>}
                  symbol="K2"
                  score={result?.corrections.k2?.value ?? state.k2Value}
                  editing={editingCoefficient === 'K2'}
                  canEdit={Boolean(selectedOrientation && selectedOrientation.id !== 'none')}
                  value={state.k2Value}
                  validationMin={selectedOrientation?.range.min ?? 0}
                  validationMax={selectedOrientation?.range.max ?? 1}
                  onStartEdit={() => {
                    if (state.k2Value == null && selectedOrientation) patch({ k2Value: selectedOrientation.range.max })
                    setEditingCoefficient('K2')
                  }}
                  onChange={(value) => patch({ k2Value: value })}
                  onEndEdit={() => setEditingCoefficient(null)}
                />
                <p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>This table gives the major-discontinuity orientation coefficient <Km math={SYM.K2} />. Choose the combination of discontinuity orientation with the tunnel axis that matches the site condition.</> : <>本表为主要结构面产状影响修正系数 <Km math={SYM.K2} />。按结构面产状及其与洞轴线的组合关系，根据现场状态选择。</>}</p>
                <BqOrientationTable darkMode={darkMode} language={language} rows={orientationRows} selectedId={state.undergroundOrientationId} onSelect={(id) => { const option = BQ_UNDERGROUND_ORIENTATION_OPTIONS.find((item) => item.id === id); patch({ undergroundOrientationId: id, k2Value: option ? option.range.max : 0, correctionStep: Math.max(correctionStep, 2) }); setCorrectionStep(Math.max(correctionStep, 2)); setEditingCoefficient(null) }} />
              </section>
              <section className={sectionClass(darkMode)}>
                <CoefficientSectionHeader
                  darkMode={darkMode}
                  language={language}
                  title={<><Km math={SYM.K3} /> · {en ? 'Initial stress condition' : '初始应力状态'}</>}
                  symbol="K3"
                  score={result?.corrections.k3?.value ?? state.k3Value}
                  editing={editingCoefficient === 'K3'}
                  canEdit={Boolean(selectedStress && selectedStress.id !== 'none_or_ratio_gt7')}
                  value={state.k3Value}
                  validationMin={selectedStressRange?.min ?? 0}
                  validationMax={selectedStressRange?.max ?? 1.5}
                  onStartEdit={() => {
                    if (state.k3Value == null) patch({ k3Value: selectedStressRange?.min ?? result?.corrections.k3?.value ?? 0 })
                    setEditingCoefficient('K3')
                  }}
                  onChange={(value) => patch({ k3Value: value })}
                  onEndEdit={() => setEditingCoefficient(null)}
                />
                <p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>This table gives the initial-stress coefficient <Km math={SYM.K3} /> by the rock strength-stress ratio and rock-mass basic quality class. The ratio <Km math={String.raw`R_c/\sigma_{\max}`} /> may be entered.</> : <>本表为初始应力状态影响修正系数 <Km math={SYM.K3} />，按围岩强度应力比及岩体基本质量等级给出。可输入围岩强度应力比 <Km math={String.raw`R_c/\sigma_{\max}`} />。</>}</p>
                <div className="mt-3">
                  <MeasuredNumberField darkMode={darkMode} language={language} name={en ? 'Rock strength-stress ratio' : '围岩强度应力比'} symbol={String.raw`R_c/\sigma_{\max}`} ariaLabel={en ? 'Rock strength-stress ratio Rc/σmax' : '围岩强度应力比 Rc/σmax'} value={state.undergroundStressRatio} min={0} onChange={updateStressRatio} />
                </div>
                <BqTable testId="bq-k3-table" rowHeader={en ? <>Rock strength-stress ratio <Km math={String.raw`R_c/\sigma_{\max}`} /></> : <>围岩强度应力比 <Km math={String.raw`R_c/\sigma_{\max}`} /></>} darkMode={darkMode} language={language} title={en ? <>Initial stress condition · <Km math={SYM.K3} /></> : <>初始应力状态与 <Km math={SYM.K3} /></>} rows={stressRows} activeGrade={baseGrade} selectedId={state.undergroundStressId} onSelect={(id) => { const option = BQ_UNDERGROUND_STRESS_OPTIONS.find((item) => item.id === id); const cell = option?.values.find((item) => item.grade === baseGrade)?.range; patch({ undergroundStressId: id, k3Value: cell ? cell.min : 0, undergroundStressRatio: null, correctionStep: Math.max(correctionStep, 3) }); setCorrectionStep(Math.max(correctionStep, 3)); setEditingCoefficient(null) }} />
              </section>
              <BqCorrectedResult darkMode={darkMode} language={language} result={result} />
            </> : null}
            {state.mode === 'slope' ? <>
              <section className={sectionClass(darkMode)}>
                <CoefficientSectionHeader
                  darkMode={darkMode}
                  language={language}
                  title={<><Km math="\lambda" /> · {en ? 'Main discontinuity type and persistence' : '主要结构面类型及其延伸性'}</>}
                  symbol="lambda"
                  score={result?.corrections.lambda?.value ?? state.lambdaValue}
                  editing={editingCoefficient === 'lambda'}
                  canEdit={Boolean(selectedLambda && selectedLambda.id !== 'none')}
                  value={state.lambdaValue}
                  validationMin={selectedLambda?.range.min ?? 0}
                  validationMax={selectedLambda?.range.max ?? 1}
                  onStartEdit={() => {
                    if (state.lambdaValue == null && selectedLambda) patch({ lambdaValue: selectedLambda.range.max })
                    setEditingCoefficient('lambda')
                  }}
                  onChange={(value) => patch({ lambdaValue: value })}
                  onEndEdit={() => setEditingCoefficient(null)}
                />
                <p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>This table gives the coefficient <Km math="\lambda" /> for the type and persistence of the main discontinuity. Choose the condition that matches the site.</> : <>本表为主要结构面类型及其延伸性修正系数 <Km math="\lambda" />。按主要结构面类型及其延伸性，根据现场状态选择。</>}</p>
                <BqLambdaTable darkMode={darkMode} language={language} rows={lambdaRows} selectedId={state.slopeStructureTypeId} onSelect={(id) => { const option = BQ_SLOPE_LAMBDA_OPTIONS.find((item) => item.id === id); patch({ slopeStructureTypeId: id, lambdaValue: option ? option.range.max : 0, ...(id === 'none' ? { slopeF1Id: null, slopeF2Id: null, slopeF3Id: null } : {}), correctionStep: 4 }); setCorrectionStep(4); setEditingCoefficient(null) }} />
              </section>
              <section className={sectionClass(darkMode)}>
                <CoefficientSectionHeader
                  darkMode={darkMode}
                  language={language}
                  title={<><Km math={SYM.K4} /> · {en ? 'Groundwater influence' : '地下水影响'}</>}
                  symbol="K4"
                  score={result?.corrections.k4?.value ?? state.k4Value}
                  editing={editingCoefficient === 'K4'}
                  canEdit={Boolean(selectedSlopeWater && selectedSlopeWater.id !== 'none')}
                  value={state.k4Value}
                  validationMin={selectedSlopeWaterRange?.min ?? 0}
                  validationMax={selectedSlopeWaterRange?.max ?? 1}
                  onStartEdit={() => {
                    if (state.k4Value == null) patch({ k4Value: selectedSlopeWaterRange?.max ?? result?.corrections.k4?.value ?? 0 })
                    setEditingCoefficient('K4')
                  }}
                  onChange={(value) => patch({ k4Value: value })}
                  onEndEdit={() => setEditingCoefficient(null)}
                />
                <p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>This table gives the groundwater-influence coefficient <Km math={SYM.K4} /> by development degree and rock-mass basic quality class. Slope water head <Km math="p_w" /> and slope height <Km math="H" /> may be entered.</> : <>本表为地下水影响修正系数 <Km math={SYM.K4} />，按地下水发育程度及岩体基本质量等级给出。可输入边坡地下水水头 <Km math="p_w" /> 与边坡高度 <Km math="H" />。</>}</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <MeasuredNumberField darkMode={darkMode} language={language} name={en ? 'Phreatic or confined water head' : '边坡地下水水头'} symbol="p_w" unit="m" ariaLabel={en ? 'Slope water head pw' : '边坡地下水水头 pw'} value={state.slopeWaterHeadPw} min={0} onChange={(raw) => updateSlopeWaterInput('slopeWaterHeadPw', raw)} />
                  <MeasuredNumberField darkMode={darkMode} language={language} name={en ? 'Slope height' : '边坡高度'} symbol="H" unit="m" ariaLabel={en ? 'Slope height H' : '边坡高度 H'} value={state.slopeHeightH} min={0} onChange={(raw) => updateSlopeWaterInput('slopeHeightH', raw)} />
                </div>
                <BqTable testId="bq-k4-table" rowHeader={en ? 'Groundwater development degree' : '地下水发育程度'} darkMode={darkMode} language={language} title={en ? <>Groundwater development · <Km math={SYM.K4} /></> : <>地下水发育程度与 <Km math={SYM.K4} /></>} rows={slopeWaterRows} activeGrade={baseGrade} selectedId={state.slopeWaterId} onSelect={(id) => { patch({ slopeWaterId: id, slopeWaterHeadPw: null, slopeHeightH: null, k4Value: midpointForSlopeWater(id), correctionStep: 4 }); setCorrectionStep(4); setEditingCoefficient(null) }} />
              </section>
              <section className={sectionClass(darkMode)}>
                <CoefficientSectionHeader
                  darkMode={darkMode}
                  language={language}
                  title={<><Km math={SYM.K5} /> · {en ? 'Main discontinuity orientation' : '主要结构面产状'}</>}
                  symbol="K5"
                  score={state.slopeStructureTypeId === 'none' ? 0 : (slopeK5Ready ? result?.corrections.slopeFactors?.k5 : null)}
                  editing={false}
                  canEdit={false}
                  value={null}
                  validationMin={0}
                  validationMax={1}
                  onStartEdit={() => {}}
                  onChange={() => {}}
                  onEndEdit={() => {}}
                />
                <p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>This table gives the orientation-influence coefficient <Km math={SYM.K5} />, composed of <Km math="F_1" />, <Km math="F_2" /> and <Km math="F_3" />. Choose the combination of discontinuity orientation with the slope face that matches the site condition.</> : <>本表为主要结构面产状影响修正系数 <Km math={SYM.K5} />，由 <Km math="F_1" />、<Km math="F_2" />、<Km math="F_3" /> 组成。按结构面产状及其与边坡临空面的空间组合关系，根据现场状态选择。</>}</p>
                <BqSlopeK5Table darkMode={darkMode} language={language} selectedF1Id={state.slopeF1Id} selectedF2Id={state.slopeF2Id} selectedF3Id={state.slopeF3Id} onSelectF1={(id) => patch({ slopeF1Id: id, correctionStep: 4 })} onSelectF2={(id) => patch({ slopeF2Id: id, correctionStep: 4 })} onSelectF3={(id) => patch({ slopeF3Id: id, correctionStep: 4 })} />
                {state.slopeStructureTypeId === 'none' ? <p data-testid="bq-k5-product" className={`mt-3 text-sm ${mutedClass(darkMode)}`}>{en ? <>No controlling main discontinuity; <Km math="K_5=0" />.</> : <>无控制性主要结构面，<Km math="K_5=0" />。</>}</p> : result?.corrections.slopeFactors && slopeK5Ready && result.corrections.slopeFactors.f1.id !== 'not_applicable' ? <p data-testid="bq-k5-product" className={`mt-3 text-sm ${mutedClass(darkMode)}`}><Km math={SYM.K5} /> = <Km math="F_1" /> × <Km math="F_2" /> × <Km math="F_3" /> = {formatFactorValue(result.corrections.slopeFactors.f1.value)} × {formatFactorValue(result.corrections.slopeFactors.f2.value)} × {formatFactorValue(result.corrections.slopeFactors.f3.value)} = {Number(result.corrections.slopeFactors.k5.toFixed(3))}</p> : null}
              </section>
              <BqCorrectedResult darkMode={darkMode} language={language} result={result} variant="slope" />
            </> : null}
            </> : null}
           <footer className={sectionClass(darkMode)}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">{attempted ? <p className="text-sm text-red-600 dark:text-red-300 sm:mr-auto">{en ? 'Complete the required fields and correction steps.' : '请完成必填参数和修正步骤。'}</p> : <p className={`text-sm sm:mr-auto ${mutedClass(darkMode)}`}>{state.mode === 'basic' ? (correctionOpen ? (en ? 'Select a correction engineering type.' : '请选择修正工程类型。') : (baseReady ? (en ? 'Basic BQ is ready.' : '基本 BQ 已可完成。') : (en ? <>Enter <Km math={SYM.Rc} /> and <Km math={SYM.Kv} />.</> : <>请输入 <Km math={SYM.Rc} /> 和 <Km math={SYM.Kv} />。</>))) : (correctionReady ? (state.mode === 'foundation' ? (en ? 'Foundation classification is ready.' : '地基工程等级已确定。') : state.mode === 'slope' ? (en ? 'Slope correction is ready.' : '边坡工程修正已完成。') : (en ? 'Underground correction is ready.' : '地下工程修正已完成。')) : (state.mode === 'foundation' ? (en ? 'Select a class from the qualitative BQ table.' : '请根据定性特征点选岩体等级。') : state.mode === 'slope' ? (en ? 'Select F1, F2 and F3 to compute K5, or choose no controlling discontinuity.' : '请点选 F1、F2、F3 计算 K5，或选择无控制性主要结构面。') : (en ? 'Complete the underground correction inputs.' : '请完成地下工程修正参数。')))}</p>}<div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={onBackToPoints} className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>{en ? 'Previous' : '上一步'}</button><button type="button" onClick={state.mode === 'basic' && !correctionOpen ? completeBasic : completeCorrection} className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">{en ? 'Complete' : '完成'}</button><button type="button" onClick={() => { if (state.mode === 'basic' && !correctionOpen ? baseReady : correctionReady) onNext(); else setAttempted(true) }} className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>{en ? 'Next point' : '下一个'}</button></div></div></footer>
          <div className="pb-24" />
        </main>
        <div className="hidden min-w-0 xl:block"><BqPreview darkMode={darkMode} language={language} state={state} correctionStep={correctionStep} result={result} /></div>
      </div>
    </div>
  )
}
