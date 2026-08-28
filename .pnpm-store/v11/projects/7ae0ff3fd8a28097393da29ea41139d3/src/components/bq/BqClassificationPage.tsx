import { Fragment, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type WheelEvent } from 'react'
import { ArrowRight, Check, ChevronDown } from 'lucide-react'
// @ts-ignore - react-katex types
import { BlockMath, InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import BackIconButton from '../BackIconButton'
import { FormulaFrame } from '../calculationUiPrimitives'
import type { CustomEditorPageProps } from '../classification/ClassificationModule'
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
  calculateBq,
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
  onChange,
}: {
  darkMode: boolean
  value: string
  ariaLabel: string
  options: Array<{ id: string; label: string }>
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
        {selected?.label}
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

function numberFieldClass(darkMode: boolean) {
  return `bq-number-input ${fieldClass(darkMode)}`
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
  return range.min === range.max ? String(range.min) : `${range.min}–${range.max}`
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
  rows: Array<{ id: string; label: string; range: string; note?: string; gradeRanges?: Partial<Record<BqGradeId, string>> }>
  selectedId: string | null
  activeGrade?: BqGradeId
  onSelect: (id: string) => void
  testId?: string
  rowHeader?: string
}) {
  const border = darkMode ? 'border-gray-600' : 'border-gray-300'
  const head = darkMode ? 'bg-gray-700/60 text-gray-200' : 'bg-gray-100 text-gray-700'
  const body = darkMode ? 'text-gray-300' : 'text-gray-700'
  const en = language === 'en'
  const hasGradeColumns = rows.some((row) => row.gradeRanges)
  const gradeHeaders: BqGradeId[] = ['I', 'II', 'III', 'IV', 'V']

  return (
    <div data-testid={testId} className="mt-3 space-y-1.5">
      <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</div>
      <div className="overflow-x-auto">
        <table className={`w-full min-w-[520px] border-collapse border text-sm ${border}`}>
          <thead className={head}>
            <tr>
              <th className="border px-2 py-1.5 text-left font-medium">{rowHeader ?? (en ? 'Condition' : '工程条件')}</th>
              {hasGradeColumns ? gradeHeaders.map((grade) => <th key={grade} className={`border px-2 py-1.5 text-center font-medium ${activeGrade === grade ? (darkMode ? 'bg-blue-900/40' : 'bg-blue-100') : ''}`}><div>{en ? `Class ${grade}` : `${grade}级 ${({ I: '＞550', II: '450＜BQ≤550', III: '350＜BQ≤450', IV: '250＜BQ≤350', V: '≤250' } as Record<BqGradeId, string>)[grade]}`}</div>{en ? <div className="font-normal tabular-nums">{({ I: '>550', II: '450<BQ≤550', III: '350<BQ≤450', IV: '250<BQ≤350', V: '≤250' } as Record<BqGradeId, string>)[grade]}</div> : null}</th>) : <th className="border px-2 py-1.5 text-center font-medium">{en ? 'Range' : '系数区间'}</th>}
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
                  <td className="border px-2 py-1.5 font-medium" title={row.note}>{row.label}</td>
              {hasGradeColumns ? gradeHeaders.map((grade) => <td key={grade} className={`border px-2 py-1.5 text-center tabular-nums ${activeGrade === grade ? (darkMode ? 'bg-blue-900/20' : 'bg-blue-50') : (darkMode ? 'bg-gray-900/60 text-gray-600' : 'bg-gray-100 text-gray-400')}`}>{row.gradeRanges?.[grade] ?? '—'}</td>) : <td className="border px-2 py-1.5 text-center tabular-nums">{row.range}</td>}
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
  return (
    <div data-testid="bq-k2-table" className="mt-3 space-y-1.5">
      <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{en ? 'Major discontinuity orientation correction coefficient (K₂)' : '主要结构面产状影响修正系数（K₂）'}</div>
      <div className="overflow-x-auto">
        <table className={`w-full min-w-[680px] border-collapse border text-sm ${border}`}>
          <thead className={head}>
            <tr>
              <th className="border px-2 py-2 text-center font-medium">{en ? 'Combination of discontinuity orientation and tunnel-axis relationship' : '结构面产状及其与洞轴线的组合关系'}</th>
              <th className="border px-2 py-2 text-center font-medium">{en ? 'α≤30°, dip β=30°–75°' : <>结构面走向与洞轴线夹角<br />α≤30°，倾角 β=30°～75°</>}</th>
              <th className="border px-2 py-2 text-center font-medium">{en ? 'α&gt;60°, dip β&gt;75°' : <>结构面走向与洞轴线夹角<br />α＞60°，倾角 β＞75°</>}</th>
              <th className="border px-2 py-2 text-center font-medium">{en ? 'Other combinations' : '其他组合'}</th>
            </tr>
          </thead>
          <tbody>
            <tr className={body}>
              <th className="border px-2 py-2 text-center font-medium"><InlineMath math="K_2" /></th>
              {rows.map((row) => {
                const selected = row.id === selectedId
                return <td key={row.id} role="button" tabIndex={0} aria-selected={selected} onClick={() => onSelect(row.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(row.id) } }} className={`border px-2 py-2 text-center align-middle font-semibold tabular-nums ${selected ? (darkMode ? 'bg-blue-900/50 text-blue-100' : 'bg-blue-100 text-blue-900') : (darkMode ? 'hover:bg-gray-700/40' : 'hover:bg-gray-50')}`}>{row.range.replace('–', '～')}</td>
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <button type="button" data-testid="bq-k2-none-option" onClick={() => onSelect('none')} className={`text-sm ${selectedId === 'none' ? (darkMode ? 'font-semibold text-blue-200' : 'font-semibold text-blue-800') : (darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900')}`}>{en ? 'No controlling major discontinuity (K₂ = 0)' : '无一组起控制作用的主要结构面（K₂ = 0）'}</button>
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
      <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{caption ?? (en ? 'BQ rock-mass class reference' : 'BQ 岩体质量等级判定')}</div>
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
  return <span className="tabular-nums"><InlineMath math={`${latex}\\,\\mathrm{MPa}`} /></span>
}

function BqFoundationResult({ darkMode, language, grade }: { darkMode: boolean; language: 'zh' | 'en'; grade: BqFoundationGrade | null }) {
  const en = language === 'en'
  const quality = grade ? BQ_GRADES.find((item) => item.id === grade.id) : null
  return (
    <div data-testid="bq-foundation-result" className={`mt-4 border-t pt-3 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Corrected BQ evaluation result' : '修正 BQ 评价结果'}</h3>
        <span className={`text-xl font-bold ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{grade ? grade.label[language] : '—'}</span>
      </div>
      {quality ? <p className={`mt-2 text-sm ${darkMode ? 'text-green-300' : 'text-green-800'}`}>{en ? `${quality.quality.en} · ${quality.qualitative.en}` : `${quality.quality.zh} · ${quality.qualitative.zh}`}</p> : <p className={`mt-2 text-sm ${mutedClass(darkMode)}`}>{en ? 'Select a class from the qualitative characteristics table.' : '请从定性特征表中选择岩体级别。'}</p>}
      <div className={`mt-3 rounded-lg border px-3 py-2.5 text-sm ${darkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
        <div className={mutedClass(darkMode)}>{en ? <>Basic bedrock bearing capacity <InlineMath math="f_0" /></> : <>基岩承载力基本值 <InlineMath math="f_0" /></>}</div>
        <div data-testid="bq-foundation-f0" className={`mt-1 font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{grade ? <F0RangeMath latex={grade.mathRange} /> : '—'}</div>
      </div>
    </div>
  )
}

function BqLimitationPanel({ darkMode, language, result }: { darkMode: boolean; language: 'zh' | 'en'; result: BqResult | null }) {
  const en = language === 'en'
  const applied = result?.limitation.applied ?? false
  const finalTextTone = applied ? (darkMode ? 'text-amber-200' : 'text-amber-700') : (darkMode ? 'text-green-200' : 'text-green-700')
  const status = !result
    ? (en ? <>Enter <InlineMath math="R_c" /> and <InlineMath math="K_v" /> to evaluate the two code limits.</> : <>输入 <InlineMath math="R_c" /> 和 <InlineMath math="K_v" /> 后，按两条规范限定进行判断。</>)
    : applied
      ? (en ? <>The <InlineMath math={result.limitation.rule === 'rc_limit' ? 'R_c' : 'K_v'} /> limit is active; the adopted value is shown below.</> : <>触发 <InlineMath math={result.limitation.rule === 'rc_limit' ? 'R_c' : 'K_v'} /> 限定，下面显示最终采用值。</>)
      : (en ? 'Neither limit is active; the input values are adopted.' : '未触发规范限定，未调整，直接采用输入值。')
  return (
    <section data-testid="bq-limitation-formulas" className={`rounded-lg border p-4 sm:p-5 ${darkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-white'}`}>
      <h3 className={`mb-3 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Code limits' : '规范限定'}</h3>
      <p className={`mb-3 text-sm leading-relaxed ${mutedClass(darkMode)}`}>
        {en
          ? <>Before calculating <InlineMath math="\mathrm{BQ}" />, the standard constrains the combined use of intact-rock strength <InlineMath math="R_c" /> and rock-mass integrity <InlineMath math="K_v" />. Evaluate the two limits independently. If <InlineMath math="R_c>90K_v+30" />, adopt <InlineMath math="R_c^*=90K_v+30" />; if <InlineMath math="K_v>0.04R_c+0.4" />, adopt <InlineMath math="K_v^*=0.04R_c+0.4" />. When neither condition is met, retain the measured values.</>
          : <>在计算 <InlineMath math="\mathrm{BQ}" /> 前，规范对完整岩石强度 <InlineMath math="R_c" /> 与岩体完整性指数 <InlineMath math="K_v" /> 的组合使用进行限定。以下两条分别判断：若 <InlineMath math="R_c>90K_v+30" />，采用 <InlineMath math="R_c^*=90K_v+30" />；若 <InlineMath math="K_v>0.04R_c+0.4" />，采用 <InlineMath math="K_v^*=0.04R_c+0.4" />。两条均未超限时，保留实测值。</>}
      </p>
      <FormulaFrame darkMode={darkMode}>
        <div className={`space-y-1 text-center ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          <BlockMath math={String.raw`R_c>90K_v+30\quad\Rightarrow\quad R_c=90K_v+30`} />
          <BlockMath math={String.raw`K_v>0.04R_c+0.4\quad\Rightarrow\quad K_v=0.04R_c+0.4`} />
        </div>
      </FormulaFrame>
      <div className={`mt-3 rounded-lg border px-3 py-3 text-sm ${darkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span>{en ? 'Input' : '输入'}：<InlineMath math="R_c" /> = <span data-testid="bq-limitation-rc-original" className="font-semibold tabular-nums">{result ? `${result.original.rc} MPa` : '—'}</span>，<InlineMath math="K_v" /> = <span data-testid="bq-limitation-kv-original" className="font-semibold tabular-nums">{result ? result.original.kv : '—'}</span></span>
          <span className={result ? finalTextTone : ''}>{en ? 'Adopted' : '采用'}：<InlineMath math="R_c^*" /> = <span data-testid="bq-limitation-rc-final" className={`font-semibold tabular-nums ${result ? finalTextTone : ''}`}>{result ? `${result.effective.rc} MPa` : '—'}</span>，<InlineMath math="K_v^*" /> = <span data-testid="bq-limitation-kv-final" className={`font-semibold tabular-nums ${result ? finalTextTone : ''}`}>{result ? result.effective.kv : '—'}</span></span>
        </div>
      </div>
      <div data-testid="bq-limitation-status" className={`mt-2 text-sm font-medium ${result ? finalTextTone : mutedClass(darkMode)}`}>
        {status}
      </div>
    </section>
  )
}

function BqResultSection({ darkMode, language, result, baseReady, mode, onEnterCorrection }: { darkMode: boolean; language: 'zh' | 'en'; result: BqResult | null; baseReady: boolean; mode: BqFormState['mode']; onEnterCorrection: () => void }) {
  const en = language === 'en'
  const grade = result ? gradeForBq(result.basicBq) : null
  return (
    <section data-testid="bq-result-section" className={sectionClass(darkMode)}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'BQ evaluation result' : 'BQ评价结果'}</h2>
        <span className={`text-2xl font-bold tabular-nums ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{result ? result.basicBq : '—'}</span>
      </div>
      {grade ? <p className={`mt-2 text-sm ${darkMode ? 'text-green-300' : 'text-green-800'}`}>{en ? `${grade.label.en} · ${grade.quality.en}` : `${grade.label.zh} · ${grade.quality.zh}`}</p> : <p className={`mt-2 text-sm ${mutedClass(darkMode)}`}>{en ? <>Enter <InlineMath math="R_c" /> and <InlineMath math="K_v" /> to calculate the basic <InlineMath math="\mathrm{BQ}" />.</> : <>请输入 <InlineMath math="R_c" /> 和 <InlineMath math="K_v" /> 后查看基本 <InlineMath math="\mathrm{BQ}" /> 结果。</>}</p>}
      <div data-testid="bq-result-table" className={`mt-3 overflow-x-auto rounded-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <table className="w-full border-collapse text-sm">
          <thead className={darkMode ? 'bg-gray-700/60 text-gray-200' : 'bg-gray-100 text-gray-700'}><tr><th className="border-b px-3 py-2 text-left font-medium">{en ? 'Result item' : '结果项目'}</th><th className="border-b px-3 py-2 text-right font-medium">{en ? 'Value' : '数值'}</th></tr></thead>
          <tbody className={darkMode ? 'text-gray-200' : 'text-gray-800'}>
            <tr><td className="border-b px-3 py-2"><InlineMath math="\mathrm{BQ}" /></td><td className="border-b px-3 py-2 text-right font-semibold tabular-nums">{result?.basicBq ?? '—'}</td></tr>
            <tr><td className="px-3 py-2">{en ? 'Grade' : '等级'}</td><td className="px-3 py-2 text-right">{grade ? (en ? grade.label.en : grade.label.zh) : '—'}</td></tr>
          </tbody>
        </table>
      </div>
      <BqGradeTable darkMode={darkMode} language={language} activeGrade={grade?.id ?? null} />
      {mode === 'basic' ? <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <p className={`text-sm ${mutedClass(darkMode)}`}>{en ? 'Corrected BQ is used for underground engineering conditions, incorporating the effects of groundwater, major discontinuity orientation, and initial stress on the basic BQ.' : '修正 BQ 用于在地下工程条件下，综合考虑地下水、主要结构面产状和初始应力状态对基本 BQ 的影响。'}</p>
        <button type="button" onClick={onEnterCorrection} disabled={!baseReady} className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-3 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">{en ? 'Enter corrected [BQ]' : '进入修正 [BQ]'}<ArrowRight className="h-4 w-4" aria-hidden /></button>
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
  const steps = slope
    ? [
        { key: 'lambda' as const, label: '\\lambda' },
        { key: 'k4' as const, label: 'K_4' },
      ]
    : [
        { key: 'k1' as const, label: 'K_1' },
        { key: 'k2' as const, label: 'K_2' },
        { key: 'k3' as const, label: 'K_3' },
      ]
  return (
    <section data-testid="bq-corrected-result" className={sectionClass(darkMode)}>
      <div className="flex items-center justify-between gap-3"><h2 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? '[BQ] evaluation result' : '[BQ]评价结果'}</h2><span className={`text-2xl font-bold tabular-nums ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{result ? result.engineeringBq : '—'}</span></div>
      <FormulaFrame darkMode={darkMode} compact>
        <div className={`text-center ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}><BlockMath math={formula} /></div>
      </FormulaFrame>
      <div className={`mt-3 grid grid-cols-2 gap-2 ${slope ? 'sm:grid-cols-5' : 'sm:grid-cols-5'}`}>
        <div className={`rounded-lg border px-2.5 py-2 text-sm ${darkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}><div className={mutedClass(darkMode)}><InlineMath math="\mathrm{BQ}" /></div><div className="mt-1 font-semibold tabular-nums">{result ? result.basicBq : '—'}</div></div>
        {steps.map((step) => <div key={step.key} className={`rounded-lg border px-2.5 py-2 text-sm ${darkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}><div className={mutedClass(darkMode)}><InlineMath math={step.label} /></div><div className="mt-1 font-semibold tabular-nums">{result?.corrections[step.key]?.value ?? 0}</div></div>)}
        {slope ? <div className={`rounded-lg border px-2.5 py-2 text-sm ${darkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}><div className={mutedClass(darkMode)}><InlineMath math="K_5" /></div><div data-testid="bq-slope-k5-value" className="mt-1 font-semibold tabular-nums">{result?.corrections.slopeFactors?.k5 ?? 0}</div></div> : null}
        <div className={`rounded-lg border px-2.5 py-2 text-sm ${darkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}><div className={mutedClass(darkMode)}><InlineMath math="\Delta\mathrm{BQ}" /></div><div className="mt-1 font-semibold tabular-nums">{result ? result.corrections.deduction : '—'}</div></div>
      </div>
      {result ? <p className={`mt-3 text-sm font-medium ${darkMode ? 'text-green-300' : 'text-green-800'}`}>{en ? `${result.grade.label.en} · ${result.grade.quality.en}` : `${result.grade.label.zh} · ${result.grade.quality.zh}`}</p> : <p className={`mt-3 text-sm ${mutedClass(darkMode)}`}>{en ? <>Enter <InlineMath math="R_c" /> and <InlineMath math="K_v" /> to show the corrected <InlineMath math="\mathrm{BQ}" /> and final class.</> : <>请输入 <InlineMath math="R_c" /> 和 <InlineMath math="K_v" /> 后显示修正 <InlineMath math="\mathrm{BQ}" /> 和最终等级。</>}</p>}
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
              <th className="border px-2 py-2 text-center font-medium"><InlineMath math="\lambda" /></th>
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
                  <th className="border px-2 py-2 text-center font-medium" rowSpan={2}><InlineMath math={group.symbol} /></th>
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
        {en ? <><InlineMath math="I_s(50)" /> is used to estimate the intact-rock strength when a saturated UCS test is unavailable. Enter the point-load strength index corrected to a 50 mm equivalent diameter and review the converted <InlineMath math="R_c" /> before applying it. This estimate does not replace the prescribed UCS test; a reliable measured <InlineMath math="R_c" /> takes precedence.</> : <><InlineMath math="I_s(50)" /> 用于在缺少饱和单轴抗压强度试验成果时，对完整岩石强度进行间接估算。输入经修正至 50 mm 等效直径的点荷载强度指数，复核换算得到的 <InlineMath math="R_c" /> 后再应用。该估算值不能替代规范要求的单轴抗压强度试验；存在可靠实测 <InlineMath math="R_c" /> 时应优先采用实测值。</>}
      </p>
      <div data-testid="bq-rc-helper-formula">
        <FormulaFrame darkMode={darkMode} compact>
          <div className={`text-center ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            <BlockMath math={String.raw`R_c=22.82\times I_s(50)^{0.75}`} />
          </div>
        </FormulaFrame>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_150px_120px] sm:items-end">
        <label className="min-w-0"><span className={`mb-1 block text-sm font-medium ${mutedClass(darkMode)}`}><InlineMath math="I_s(50)" /> · MPa</span><input aria-label="Is(50) · MPa" placeholder={en ? 'e.g. 4' : '如：4'} type="number" min="0" step="any" value={value} onChange={(event) => onValueChange(event.target.value)} onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={numberFieldClass(darkMode)} /></label>
        <span data-testid="bq-rc-helper-estimate" className={`flex min-h-[40px] min-w-[150px] items-center justify-center text-center text-sm font-semibold ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{estimate == null ? '—' : <><InlineMath math="R_c" /> ≈ {estimate.toFixed(1)} MPa</>}</span>
        <ApplyButton darkMode={darkMode} className="w-[120px]" disabled={estimate == null} onClick={onApply} ariaLabel={en ? 'Apply to Rc' : '应用到 Rc'}>{en ? <>Apply to <InlineMath math="R_c" /></> : <>应用到 <InlineMath math="R_c" /></>}</ApplyButton>
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
              <BlockMath math={String.raw`K_v=\left(\frac{v_{pm}}{v_{pr}}\right)^2`} />
            </div>
          </FormulaFrame>
        </div>
        <p className={`mt-1 text-sm leading-relaxed ${mutedClass(darkMode)}`}>
          {en ? <><InlineMath math="v_{pm}" /> is the rock-mass elastic longitudinal-wave velocity and <InlineMath math="v_{pr}" /> is the intact-rock core longitudinal-wave velocity. Both values must come from the same engineering zone and use the same unit (km/s). Their squared ratio estimates <InlineMath math="K_v" />; the result must satisfy <InlineMath math="0\leq K_v\leq1" />.</> : <><InlineMath math="v_{pm}" /> 为岩体弹性纵波速度，<InlineMath math="v_{pr}" /> 为完整岩石岩芯纵波速度。两项资料应来自同一工程分区并采用相同计量单位（km/s）。两者比值的平方用于估算 <InlineMath math="K_v" />，计算结果应满足 <InlineMath math="0\leq K_v\leq1" />。</>}
        </p>
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_150px_120px] md:items-end">
          <label className="min-w-0"><span className={`mb-1 block text-sm font-medium ${mutedClass(darkMode)}`}><InlineMath math="v_{pm}" />：{en ? 'Rock-mass elastic longitudinal-wave velocity' : '岩体弹性纵波速度'}（km/s）</span><input aria-label={en ? 'vpm · km/s' : 'vpm · km/s'} placeholder={en ? 'e.g. 3.2' : '如：3.2'} type="number" min="0" step="any" value={vpm} onChange={(event) => onVpmChange(event.target.value)} onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={numberFieldClass(darkMode)} /></label>
          <label className="min-w-0"><span className={`mb-1 block text-sm font-medium ${mutedClass(darkMode)}`}><InlineMath math="v_{pr}" />：{en ? 'Intact-core longitudinal-wave velocity' : '完整岩石岩芯纵波速度'}（km/s）</span><input aria-label={en ? 'vpr · km/s' : 'vpr · km/s'} placeholder={en ? 'e.g. 4.5' : '如：4.5'} type="number" min="0" step="any" value={vpr} onChange={(event) => onVprChange(event.target.value)} onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={numberFieldClass(darkMode)} /></label>
          <span data-testid="bq-kv-velocity-estimate" className={`flex min-h-[40px] min-w-[150px] items-center justify-center text-center text-sm font-semibold ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{velocityEstimate == null ? '—' : <><InlineMath math="K_v" /> ≈ {velocityEstimate.toFixed(3)}</>}</span>
          <ApplyButton darkMode={darkMode} className="w-[120px]" disabled={velocityEstimate == null || velocityEstimate > 1} onClick={onApplyVelocity} ariaLabel={en ? 'Apply to Kv' : '应用到 Kv'}>{en ? <>Apply to <InlineMath math="K_v" /></> : <>应用到 <InlineMath math="K_v" /></>}</ApplyButton>
        </div>
        {velocityEstimate != null && velocityEstimate > 1 ? <p className={`mt-2 text-xs ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>{en ? <>The estimate is above 1. Check the two velocity inputs; a physical <InlineMath math="K_v" /> should be within 0–1.</> : <>估算值大于 1，请检查两项波速输入；物理意义上的 <InlineMath math="K_v" /> 应位于 0–1。</>}</p> : null}
      </div>
      <div>
        <p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>When reliable wave-velocity data are unavailable, estimate <InlineMath math="K_v" /> from the standard relationship with volumetric joint count <InlineMath math="J_v" />. Enter <InlineMath math="J_v" /> or select a table band; the displayed midpoint is an auxiliary estimate only and must be confirmed before it is applied.</> : <>当缺少可靠波速资料时，可根据岩体体积节理数 <InlineMath math="J_v" /> 并结合标准对照关系估算 <InlineMath math="K_v" />。输入 <InlineMath math="J_v" /> 或选择表格区间后，系统显示该区间中值作为辅助估算值；确认后方可回填到 <InlineMath math="K_v" />。</>}</p>
        <table data-testid="bq-kv-jv-table" className={`mt-2 w-full border-collapse border text-sm ${border} ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <thead className={darkMode ? 'bg-gray-700/60' : 'bg-gray-100'}><tr><th className="border px-2 py-1.5 text-left"><InlineMath math="J_v" />（条/m³）</th><th className="border px-2 py-1.5 text-left"><InlineMath math="K_v" /></th></tr></thead>
          <tbody>{rows.map((row, index) => {
            const selected = typedBand != null ? typedBand === index : selectedJvBand === index
            return <tr key={row.jv} data-testid={`bq-kv-jv-row-${index}`} tabIndex={0} aria-selected={selected} onClick={() => onJvBandSelect(index)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onJvBandSelect(index) } }} className={`cursor-pointer ${selected ? (darkMode ? 'bg-blue-900/50 text-blue-100' : 'bg-blue-100 text-blue-900') : (darkMode ? 'hover:bg-gray-700/40' : 'hover:bg-gray-50')}`}><td className="border px-2 py-1.5">{row.jv}</td><td className="border px-2 py-1.5">{row.kv}</td></tr>
          })}</tbody>
        </table>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_170px_170px] sm:items-end">
          <label className="min-w-0"><span className={`mb-1 block text-sm font-medium ${mutedClass(darkMode)}`}><InlineMath math="J_v" />：{en ? 'Volumetric joint count' : '岩体体积节理数'}（条/m³）</span><input aria-label={en ? 'Jv · joints/m³' : 'Jv · 条/m³'} placeholder={en ? 'e.g. 12' : '如：12'} type="number" min="0" step="any" value={jv} onChange={(event) => onJvChange(event.target.value)} onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={numberFieldClass(darkMode)} /></label>
          <span data-testid="bq-kv-jv-estimate" className={`flex min-h-[40px] min-w-[170px] items-center justify-center text-center text-sm font-semibold ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{jvEstimate == null ? '—' : <><InlineMath math="K_v" /> ≈ {jvEstimate.value.toFixed(3)}</>}</span>
          <ApplyButton darkMode={darkMode} className="w-[170px]" disabled={jvEstimate == null} onClick={onApplyJv} ariaLabel={en ? 'Apply midpoint to Kv' : '应用区间中值到 Kv'}>{en ? <>Apply midpoint to <InlineMath math="K_v" /></> : <>应用区间中值到 <InlineMath math="K_v" /></>}</ApplyButton>
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
  const foundationGrade = state.mode === 'foundation' ? resolveFoundationGrade(state) : null
  const rcLimited = result?.limitation.applied && result.limitation.rule === 'rc_limit'
  const kvLimited = result?.limitation.applied && result.limitation.rule === 'kv_limit'
  const slopeK5Ready = state.slopeStructureTypeId === 'none' || Boolean(state.slopeF1Id && state.slopeF2Id && state.slopeF3Id)
  const totalItems = state.mode === 'underground' || state.mode === 'slope' ? 5 : state.mode === 'foundation' ? 3 : 2
  const completedItems = [
    state.rc,
    state.kv,
    state.mode === 'underground' ? result?.corrections.k1?.value : null,
    state.mode === 'underground' ? result?.corrections.k2?.value : null,
    state.mode === 'underground' ? result?.corrections.k3?.value : null,
    state.mode === 'foundation' ? (state.foundationGradeId != null || state.foundationF0 != null ? 1 : null) : null,
    state.mode === 'slope' ? result?.corrections.lambda?.value : null,
    state.mode === 'slope' ? result?.corrections.k4?.value : null,
    state.mode === 'slope' && slopeK5Ready && result != null ? (result.corrections.slopeFactors?.k5 ?? 0) : null,
  ].filter((value) => value != null).length
  const correctionValue = (coefficient: BqResult['corrections']['k1'], complete: boolean) =>
    complete && coefficient ? coefficient.value : (en ? 'Pending' : '待完成')
  const row = (label: ReactNode, value: ReactNode, done = true, testId?: string) => (
    <li className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-sm ${done ? (darkMode ? 'bg-blue-950/35' : 'bg-blue-50/80') : (darkMode ? 'bg-gray-700/40' : 'bg-gray-50')}`}>
      <span className={`flex min-w-0 items-center gap-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}><span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${done ? 'bg-blue-600 text-white' : (darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-500')}`}>{done ? <Check className="h-3 w-3" aria-hidden /> : '·'}</span><span data-testid={testId} className="min-w-0 break-words leading-5">{label}</span></span>
      <span className={`ml-2 shrink-0 font-semibold tabular-nums ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{value}</span>
    </li>
  )
  return (
    <aside data-testid="calculation-result-pane" className={panel}>
      <h3 className={`mb-1 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Rating preview' : '分值预览'}</h3>
      <p className={`mb-3 text-xs ${mutedClass(darkMode)}`}>{en ? `${completedItems} / ${totalItems} selected` : `已选 ${completedItems} / ${totalItems} 项`}</p>
      <ul className="space-y-2">
        {row(<span data-testid="bq-preview-rc-label"><span data-testid="bq-preview-effective-rc-label"><InlineMath math={rcLimited ? 'R_c^{*}' : 'R_c'} /></span></span>, rcLimited ? `${result?.effective.rc ?? '—'} MPa` : (state.rc == null ? '—' : `${state.rc} MPa`), rcLimited ? result != null : state.rc != null, 'bq-preview-rc-row')}
        {row(<span data-testid="bq-preview-kv-label"><span data-testid="bq-preview-effective-kv-label"><InlineMath math={kvLimited ? 'K_v^{*}' : 'K_v'} /></span></span>, kvLimited ? (result?.effective.kv ?? '—') : (state.kv == null ? '—' : state.kv), kvLimited ? result != null : state.kv != null, 'bq-preview-kv-row')}
        {row(en ? 'Code limitation' : '规范限定', result ? (result.limitation.applied ? <InlineMath math={result.limitation.rule === 'rc_limit' ? 'R_c' : 'K_v'} /> : (en ? 'None' : '未触发')) : '—', result != null, 'bq-preview-limit-label')}
        {row(<InlineMath math="\mathrm{BQ}" />, result ? result.basicBq : '—', result != null, 'bq-preview-basic-bq-label')}
        {state.mode === 'underground' ? row(<InlineMath math="K_1" />, correctionValue(result?.corrections.k1 ?? null, result != null), result != null, 'bq-preview-k1-label') : null}
        {state.mode === 'underground' ? row(<InlineMath math="K_2" />, correctionValue(result?.corrections.k2 ?? null, result != null), result != null, 'bq-preview-k2-label') : null}
        {state.mode === 'underground' ? row(<InlineMath math="K_3" />, correctionValue(result?.corrections.k3 ?? null, result != null), result != null, 'bq-preview-k3-label') : null}
        {state.mode === 'underground' && result ? row(<InlineMath math="\Delta\mathrm{BQ}" />, result.corrections.deduction, true, 'bq-preview-deduction-label') : null}
        {state.mode === 'underground' && result ? row(<InlineMath math="\left[\mathrm{BQ}\right]" />, result.engineeringBq, true, 'bq-preview-corrected-bq-label') : null}
        {state.mode === 'slope' ? row(<InlineMath math="\lambda" />, correctionValue(result?.corrections.lambda ?? null, result != null), result != null, 'bq-preview-lambda-label') : null}
        {state.mode === 'slope' ? row(<InlineMath math="K_4" />, correctionValue(result?.corrections.k4 ?? null, result != null), result != null, 'bq-preview-k4-label') : null}
        {state.mode === 'slope' ? row(<InlineMath math="K_5" />, slopeK5Ready ? (result?.corrections.slopeFactors?.k5 ?? 0) : (en ? 'Pending' : '待完成'), slopeK5Ready && result != null, 'bq-preview-k5-label') : null}
        {state.mode === 'slope' && result ? row(<InlineMath math="\Delta\mathrm{BQ}" />, result.corrections.deduction, true, 'bq-preview-deduction-label') : null}
        {state.mode === 'slope' && result ? row(<InlineMath math="\left[\mathrm{BQ}\right]" />, result.engineeringBq, true, 'bq-preview-corrected-bq-label') : null}
        {state.mode === 'foundation' ? row(<InlineMath math="\left[\mathrm{BQ}\right]" />, foundationGrade ? foundationGrade.label[language] : (en ? 'Pending' : '待选择'), foundationGrade != null, 'bq-preview-foundation-grade-label') : null}
        {state.mode === 'foundation' ? row(<>{en ? 'Bedrock' : '基岩'} <InlineMath math="f_0" /></>, foundationGrade ? <F0RangeMath latex={foundationGrade.mathRange} /> : (en ? 'Pending' : '待选择'), foundationGrade != null, 'bq-preview-foundation-f0-label') : null}
      </ul>
      <div className={`mt-4 space-y-3 border-t pt-3 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <div data-testid="bq-preview-basic-result">
          <div className="flex items-baseline justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{en ? 'BQ evaluation result' : 'BQ评价结果'}</span>
            <span className={`text-2xl font-bold tabular-nums ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{result ? result.basicBq : '—'}</span>
          </div>
          {result && basicGrade ? <p className={`mt-2 text-sm ${darkMode ? 'text-green-300' : 'text-green-800'}`}>{en ? `${basicGrade.label.en} · ${basicGrade.quality.en}` : `${basicGrade.label.zh} · ${basicGrade.quality.zh}`}</p> : <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{en ? <>Enter <InlineMath math="R_c" /> and <InlineMath math="K_v" /> to show the class.</> : <>输入 <InlineMath math="R_c" /> 和 <InlineMath math="K_v" /> 后显示正式等级</>}</p>}
        </div>
        {state.mode === 'underground' || state.mode === 'slope' ? (
          <div data-testid="bq-preview-corrected-result">
            <div className="flex items-baseline justify-between">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{en ? '[BQ] evaluation result' : '[BQ]评价结果'}</span>
              <span className={`text-2xl font-bold tabular-nums ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{result ? result.engineeringBq : '—'}</span>
            </div>
            {result ? <p className={`mt-2 text-sm ${darkMode ? 'text-green-300' : 'text-green-800'}`}>{en ? `${result.grade.label.en} · ${result.grade.quality.en}` : `${result.grade.label.zh} · ${result.grade.quality.zh}`}</p> : null}
          </div>
        ) : null}
        {state.mode === 'foundation' ? (
          <div data-testid="bq-preview-foundation-result">
            <div className="flex items-baseline justify-between">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{en ? <>[BQ] evaluation result</> : <>[BQ]评价结果</>}</span>
              <span className={`text-2xl font-bold ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{foundationGrade ? foundationGrade.label[language] : '—'}</span>
            </div>
            {foundationGrade ? <p className={`mt-2 text-sm ${darkMode ? 'text-green-300' : 'text-green-800'}`}>{en ? <>Bedrock <InlineMath math="f_0" /> · </> : <>基岩 <InlineMath math="f_0" /> · </>}<F0RangeMath latex={foundationGrade.mathRange} /></p> : <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{en ? 'Select a qualitative class to show the corrected BQ and f₀ range.' : '选择定性特征等级后显示修正 BQ 和 f₀ 区间。'}</p>}
          </div>
        ) : null}
      </div>
    </aside>
  )
}

function StepHeader({ darkMode, title, number, complete }: { darkMode: boolean; title: ReactNode; number: number; complete: boolean }) {
  return <div className="mb-2 flex items-center justify-between gap-2"><h2 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{title}</h2><span className={`text-sm font-semibold ${complete ? 'text-blue-700 dark:text-blue-300' : mutedClass(darkMode)}`}>{complete ? '✓' : number}</span></div>
}

function CoefficientInput({ darkMode, language, symbol, value, min, max, validationMin = min, validationMax = max, onChange }: { darkMode: boolean; language: 'zh' | 'en'; symbol: string; value: number | null; min: number; max: number; validationMin?: number; validationMax?: number; onChange: (value: number | null) => void }) {
  const en = language === 'en'
  const mathSymbol = symbol === 'K1' ? 'K_1' : symbol === 'K2' ? 'K_2' : symbol === 'K3' ? 'K_3' : symbol === 'K4' ? 'K_4' : symbol === 'lambda' ? '\\lambda' : 'K_5'
  const invalid = value != null && (value < validationMin || value > validationMax)
  return <div className="mt-3 flex flex-wrap items-end gap-2"><label className="min-w-[170px] flex-1"><span className={`mb-1 block text-sm font-medium ${mutedClass(darkMode)}`}>{en ? <>Adopted <InlineMath math={mathSymbol} /> within range (optional)</> : <><InlineMath math={mathSymbol} /> 区间内采用值（可选）</>}</span><input aria-label={en ? `${symbol} adopted value` : `${symbol} 输入值`} placeholder={en ? 'e.g. 0.20' : '如：0.20'} type="number" min={min} max={max} step="0.01" value={value ?? ''} onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))} onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={numberFieldClass(darkMode)} />{invalid ? <span className="mt-1 block text-xs text-red-600 dark:text-red-300">{en ? `Value must be between ${validationMin} and ${validationMax}.` : `异常值：请输入 ${validationMin}～${validationMax} 范围内的 ${symbol}。`}</span> : null}</label></div>
}

export default function BqClassificationPage(props: BqProps) {
  const { darkMode, language, form, caseName, pointName, pointNote, pointOreType, oreTypeOptions = [], pointOrdinal, pointTotal, onFormChange, onPointNameChange, onPointNoteChange, onPointOreTypeChange, onBackToWorkspace, onBackToPoints, onComplete, onNext } = props
  const en = language === 'en'
  const state = normalizeBqState(form)
  const [correctionStep, setCorrectionStep] = useState(state.mode === 'underground' ? Math.max(1, state.correctionStep ?? 1) : 0)
  const [rcHelperOpen, setRcHelperOpen] = useState(false)
  const [kvHelperOpen, setKvHelperOpen] = useState(false)
  const [is50, setIs50] = useState('')
  const [vpm, setVpm] = useState('')
  const [vpr, setVpr] = useState('')
  const [jv, setJv] = useState('')
  const [selectedJvBand, setSelectedJvBand] = useState<number | null>(null)
  const [attempted, setAttempted] = useState(false)

  const patch = (next: Partial<BqFormState>) => {
    const baseChanged = (state.mode === 'underground' || state.mode === 'slope') && ('rc' in next || 'kv' in next)
    const nextStep = baseChanged ? 4 : next.correctionStep
    onFormChange({ ...state, ...next, ...(baseChanged && state.mode === 'underground' ? { k1Value: null, k2Value: null, k3Value: null } : {}), ...(baseChanged && state.mode === 'slope' ? { k4Value: null } : {}), ...(nextStep != null ? { correctionStep: nextStep } : {}) } as unknown as Record<string, unknown>)
    if (baseChanged) setCorrectionStep(1)
  }
  const result = useMemo(() => {
    if (state.rc == null || state.kv == null) return null
    try { return calculateBq(state) } catch { return null }
  }, [state])
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
  const basicGrade = result ? gradeForBq(result.basicBq) : null
  const groundwaterAssessment = assessGroundwaterK1(state.groundwaterPressureP, state.groundwaterInflowQ, baseGrade)
  const slopeWaterAssessment = assessSlopeK4(state.slopeWaterHeadPw, state.slopeHeightH, baseGrade)
  const waterRows = BQ_UNDERGROUND_WATER_OPTIONS.map((item) => ({ id: item.id, label: en ? item.label.en : item.label.zh, range: rangeText(item.values.find((value) => value.grade === baseGrade)?.range ?? { min: 0, max: 0 }), gradeRanges: Object.fromEntries(item.values.map((value) => [value.grade, rangeText(value.range)])) as Partial<Record<BqGradeId, string>>, note: item.id === 'none' ? (en ? 'No groundwater correction' : '不产生地下水修正') : undefined }))
  const slopeWaterRows = BQ_SLOPE_WATER_OPTIONS.map((item) => ({ id: item.id, label: en ? item.label.en : item.label.zh, range: rangeText(item.values.find((value) => value.grade === baseGrade)?.range ?? { min: 0, max: 0 }).replace('–', '～'), gradeRanges: Object.fromEntries(item.values.map((value) => [value.grade, rangeText(value.range).replace('–', '～')])) as Partial<Record<BqGradeId, string>>, note: item.id === 'none' ? (en ? 'No slope groundwater correction' : '不产生边坡地下水修正') : undefined }))
  const lambdaRows = BQ_SLOPE_LAMBDA_OPTIONS.filter((item) => item.id !== 'none').map((item) => ({ id: item.id, label: en ? item.label.en : item.label.zh, range: lambdaRangeText(item.range) }))
  const stressRows = BQ_UNDERGROUND_STRESS_OPTIONS.map((item) => ({ id: item.id, label: en ? item.label.en : item.label.zh, range: rangeText(item.values.find((value) => value.grade === baseGrade)?.range ?? { min: 0, max: 0 }), gradeRanges: Object.fromEntries(item.values.map((value) => [value.grade, rangeText(value.range)])) as Partial<Record<BqGradeId, string>> }))
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
    const next = { ...state, [field]: parsed }
    const assessment = assessGroundwaterK1(next.groundwaterPressureP, next.groundwaterInflowQ, baseGrade)
    const assessedRange = assessment ? BQ_UNDERGROUND_WATER_OPTIONS.find((item) => item.id === assessment.optionId)?.values.find((item) => item.grade === baseGrade)?.range : null
    patch({ [field]: parsed, ...(assessment ? { undergroundWaterId: assessment.optionId, k1Value: assessedRange?.max ?? 0 } : {}) })
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
  const enterCorrection = () => { if (!baseReady) { setAttempted(true); return }; patch({ mode: 'underground', correctionStep: 4 }); setCorrectionStep(4) }
  const completeCorrection = () => { if (!baseReady || !correctionReady) { setAttempted(true); return }; setAttempted(false); onComplete() }

  return (
    <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="grid w-full min-h-0 flex-1 grid-cols-1 gap-4 px-4 py-5 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,3fr)_minmax(220px,1fr)]">
        <main data-testid="calculation-input-pane" className="thin-scroll -mr-1 min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto pr-0.5">
          <header className="flex items-start gap-2"><BackIconButton label={en ? 'Back' : '返回'} onClick={onBackToPoints} darkMode={darkMode} className="mt-1" /><div className="min-w-0"><nav className={`flex flex-wrap items-center gap-1 text-xs ${mutedClass(darkMode)}`}><button type="button" onClick={onBackToWorkspace} className={darkMode ? 'hover:text-blue-300' : 'hover:text-blue-700'}>{en ? 'Project workspace' : '项目工作区'}</button><span aria-hidden>/</span><button type="button" onClick={onBackToPoints} className={darkMode ? 'hover:text-blue-300' : 'hover:text-blue-700'}>{caseName}</button><span aria-hidden>/</span><span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{pointName}</span></nav><h1 className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'BQ Engineering Rock Mass Classification' : 'BQ 工程岩体分级'}</h1><p className={`mt-1 text-sm ${mutedClass(darkMode)}`}>{en ? 'Point' : '点位'} {pointOrdinal} / {pointTotal}</p></div></header>

          <section className={sectionClass(darkMode)}><h2 className={`mb-3 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Point information' : '点位信息'}</h2><div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"><label className="block space-y-1"><span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{en ? 'Point number' : '点位序号'}</span><input className={fieldClass(darkMode)} value={pointOrdinal} readOnly aria-readonly="true" /></label><label className="block space-y-1"><span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{en ? 'Point name' : '点位名称'}</span><input className={fieldClass(darkMode)} value={pointName} onChange={(event) => onPointNameChange(event.target.value)} placeholder={en ? 'e.g. K12+350 crown' : '如：K12+350 拱顶'} /></label><label className="block space-y-1"><span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{en ? 'Ore / rock type group' : '矿岩类型组'}</span><input list="bq-rock-mass-groups" className={fieldClass(darkMode)} value={pointOreType} onChange={(event) => onPointOreTypeChange(event.target.value)} placeholder={en ? 'e.g. Granite' : '如：花岗岩'} /><datalist id="bq-rock-mass-groups">{oreTypeOptions.map((option) => <option key={option} value={option} />)}</datalist></label><label className="block space-y-1"><span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{en ? 'Point note' : '点位说明'}</span><input className={fieldClass(darkMode)} value={pointNote} onChange={(event) => onPointNoteChange(event.target.value)} placeholder={en ? 'e.g. borehole and depth' : '如：钻孔号、深度'} /></label></div></section>

          <section data-testid="bq-main-card" className={sectionClass(darkMode)}>
            <p className={`text-sm leading-relaxed mb-4 ${mutedClass(darkMode)}`}>
              {en ? (
                <>
                  The 2014 revision of the Ministry of Water Resources engineering rock-mass classification standard applies to rock-mass projects across sectors and project types.
                  Basic rock-mass quality is evaluated using the saturated uniaxial compressive strength of intact rock <InlineMath math="R_c" /> and the rock-mass integrity index <InlineMath math="K_v" />. <InlineMath math="R_c" /> represents the strength of the intact rock material, while <InlineMath math="K_v" /> reflects the influence of discontinuities such as joints and fractures on rock-mass integrity.
                  The standard calculates the basic quality index with <InlineMath math="\mathrm{BQ}=100+3R_c+250K_v" />; representative measured data from the same engineering zone should be used whenever available. Underground-engineering evaluation may also account for groundwater, discontinuity orientation, and the initial stress condition.
                </>
              ) : (
                <>
                  水利部 2014 年修订的《工程岩体分级标准》适用于各行业、各种类型的岩体工程。
                  岩体基本质量评价以完整岩石饱和单轴抗压强度 <InlineMath math="R_c" /> 和岩体完整性指数 <InlineMath math="K_v" /> 为主要评价指标。<InlineMath math="R_c" /> 反映完整岩石材料的强度特征，<InlineMath math="K_v" /> 综合反映节理、裂隙等不连续面对岩体完整性的影响。
                  依据标准采用 <InlineMath math="\mathrm{BQ}=100+3R_c+250K_v" /> 计算岩体基本质量指标；<InlineMath math="R_c" /> 和 <InlineMath math="K_v" /> 应优先采用同一工程分区内具有代表性的实测资料。地下工程评价还可根据地下水、主要结构面产状和初始应力状态进行修正。
                </>
              )}
            </p>

            <div data-testid="bq-standard-formulas">
              <FormulaFrame darkMode={darkMode}>
                <div className={`space-y-1 text-center ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  <BlockMath math={String.raw`\mathrm{BQ}=100+3R_c+250K_v`} />
                </div>
              </FormulaFrame>
            </div>

            <div className="mt-2 space-y-4">
            <section className={`rounded-lg border p-4 sm:p-5 ${darkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-white'}`}>
            <div className="mb-2 flex items-center gap-2"><h2 data-testid="bq-basic-quality-title" className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Basic rock-mass quality' : '岩体基本质量'}</h2></div>
            <p className={`mb-4 text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>Use representative measured <InlineMath math="R_c" /> and <InlineMath math="K_v" /> from the same engineering zone whenever available. If direct test results are unavailable, use one of the auxiliary methods below to obtain an estimate, review its applicability against the geological data, and apply it only after confirmation.</> : <>有条件时应优先采用同一工程分区内具有代表性的实测 <InlineMath math="R_c" /> 和 <InlineMath math="K_v" />。缺少直接试验成果时，可使用下方辅助方法进行估算；估算结果应结合工程地质资料复核，确认后方可应用。</>}</p>
            <div data-field="rc" className={`border-t pt-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <label htmlFor="bq-rc" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{en ? <>Saturated UCS <InlineMath math="R_c" /></> : <>饱和岩石单轴抗压强度 <InlineMath math="R_c" /></>} <span className={mutedClass(darkMode)}>（MPa）</span></label>
              <input id="bq-rc" aria-label={en ? 'Rc input (MPa)' : 'Rc 输入值（MPa）'} placeholder={en ? 'e.g. 80' : '如：80'} type="number" min="0" step="any" value={state.rc ?? ''} onChange={(event) => patch({ rc: event.target.value === '' ? null : Number(event.target.value) })} onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={`mt-2 ${numberFieldClass(darkMode)}`} />
              <p className={`mt-2 text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>Use the saturated uniaxial compressive strength of intact rock. If only a point-load test is available, convert <InlineMath math="I_s(50)" /> with the helper below.</> : <>输入完整岩石在饱和状态下的单轴抗压强度。只有点荷载试验结果时，可用下方 <InlineMath math="I_s(50)" /> 换算辅助计算。</>}</p>
              <HelperToggle darkMode={darkMode} open={rcHelperOpen} onToggle={() => setRcHelperOpen((open) => !open)} label={en ? 'Open point-load estimate' : '展开点荷载换算'} />
              {rcHelperOpen ? <RcHelper darkMode={darkMode} language={language} value={is50} onValueChange={setIs50} estimate={rcEstimate} onApply={() => rcEstimate != null && patch({ rc: Number(rcEstimate.toFixed(2)) })} /> : null}
            </div>
            <div data-field="kv" className={`mt-4 border-t pt-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <label htmlFor="bq-kv" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{en ? <>Rock-mass integrity index <InlineMath math="K_v" /> <span className={mutedClass(darkMode)}>（dimensionless, 0–1）</span></> : <>岩体完整性指数 <InlineMath math="K_v" /> <span className={mutedClass(darkMode)}>（无量纲，0–1）</span></>}</label>
              <input id="bq-kv" aria-label={en ? 'Kv input' : 'Kv 输入值'} placeholder={en ? 'e.g. 0.65' : '如：0.65'} type="number" min="0" max="1" step="0.01" value={state.kv ?? ''} onChange={(event) => updateDirectKv(event.target.value)} onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={`mt-2 ${numberFieldClass(darkMode)}`} />
              <p className={`mt-2 text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>Enter the tested integrity index after joints and fractures are considered. If <InlineMath math="K_v" /> is unavailable, use the wave-velocity method or the <InlineMath math="J_v" /> table below.</> : <>输入考虑节理、裂隙后的岩体完整性指数。没有实测 <InlineMath math="K_v" /> 时，可用波速法或下方 <InlineMath math="J_v" /> 对照表估算。</>}</p>
              <HelperToggle darkMode={darkMode} open={kvHelperOpen} onToggle={() => setKvHelperOpen((open) => !open)} label={en ? 'Open velocity / Jv helpers' : '展开波速法 / Jv 对照'} />
              {kvHelperOpen ? <KvHelper darkMode={darkMode} language={language} vpm={vpm} vpr={vpr} jv={jv} selectedJvBand={selectedJvBand} onVpmChange={(value) => updateVelocityInput(setVpm, value)} onVprChange={(value) => updateVelocityInput(setVpr, value)} onJvChange={updateJvInput} onJvBandSelect={selectJvBand} velocityEstimate={kvVelocity} jvEstimate={kvJv} onApplyVelocity={applyVelocityKv} onApplyJv={applyJvKv} /> : null}
            </div>
            </section>
            <BqLimitationPanel darkMode={darkMode} language={language} result={result} />
            </div>
          </section>

          <BqResultSection darkMode={darkMode} language={language} result={result} baseReady={baseReady} mode={state.mode} onEnterCorrection={enterCorrection} />

            {state.mode !== 'basic' ? <>
            {state.mode === 'underground' ? <section data-testid="bq-correction-intro" className={sectionClass(darkMode)}><h2 className={`mb-3 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Corrected BQ' : '修正 BQ'}</h2><p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? 'For detailed classification of rock masses in underground engineering, the basic quality index BQ shall be corrected for groundwater, discontinuity orientation, and initial stress.' : '地下工程岩体详细定级时，基本质量指标 BQ 可根据地下水、主要结构面产状和初始应力状态进行修正。'}</p><FormulaFrame darkMode={darkMode}><div className={`text-center ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}><BlockMath math={String.raw`\left[\mathrm{BQ}\right]=\mathrm{BQ}-100\left(K_1+K_2+K_3\right)`} /></div></FormulaFrame></section> : null}
            {state.mode === 'slope' ? <section data-testid="bq-slope-intro" className={sectionClass(darkMode)}><h2 className={`mb-3 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Corrected BQ' : '修正 BQ'}</h2><p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>For detailed classification of rock masses in slope engineering, the basic quality index <InlineMath math="\mathrm{BQ}" /> shall be corrected for groundwater and for the type, persistence and orientation of the main discontinuity relative to the slope face. The corrected index is <InlineMath math="\left[\mathrm{BQ}\right]=\mathrm{BQ}-100\left(K_4+\lambda K_5\right)" />, where <InlineMath math="K_5=F_1\times F_2\times F_3" />. <InlineMath math="K_4" /> is the groundwater-influence coefficient, <InlineMath math="\lambda" /> is the coefficient for main-discontinuity type and persistence, and <InlineMath math="K_5" /> is the orientation-influence coefficient.</> : <>边坡工程岩体详细定级时，应对地下水影响以及主要结构面的类型、延伸性及其产状与边坡临空面的空间组合关系进行修正。修正后的岩体质量指标按 <InlineMath math="\left[\mathrm{BQ}\right]=\mathrm{BQ}-100\left(K_4+\lambda K_5\right)" /> 计算，其中 <InlineMath math="K_5=F_1\times F_2\times F_3" />。<InlineMath math="K_4" /> 为地下水影响修正系数，<InlineMath math="\lambda" /> 为主要结构面类型及其延伸性修正系数，<InlineMath math="K_5" /> 为主要结构面产状影响修正系数。</>}</p><FormulaFrame darkMode={darkMode}><div className={`space-y-1 text-center ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}><BlockMath math={String.raw`\left[\mathrm{BQ}\right]=\mathrm{BQ}-100\left(K_4+\lambda K_5\right)`} /><BlockMath math={String.raw`K_5=F_1\times F_2\times F_3`} /></div></FormulaFrame></section> : null}
            {state.mode === 'foundation' ? <section data-testid="bq-foundation-intro" className={sectionClass(darkMode)}><h2 className={`mb-3 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Foundation engineering rock-mass class' : '地基工程岩体级别'}</h2><p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>Rock foundation engineering covers industrial and civil buildings, highway and railway bridges, and port works founded on rock. Design is governed by bearing capacity. Because basic rock-mass quality already combines intact-rock strength and integrity—the two main controls on bedrock bearing capacity—the foundation class is taken directly from Table 4.1.1. Select the class from the qualitative characteristics; that selection is the corrected BQ (engineering class) and yields the corresponding basic bedrock bearing capacity <InlineMath math="f_0" /> range in Table 5.4.2.</> : <>岩石地基工程主要指以岩石作为承载层的工业与民用建筑、公路与铁路桥涵以及港口工程地基。设计中最关心的是地基承载能力。岩体基本质量已综合反映岩石坚硬程度和岩体完整程度，而这正是影响基岩承载力的主要因素，因此地基工程岩体应按表 4.1.1 的岩体基本质量级别定级，不再另作公式修正。请根据岩体基本质量的定性特征选择级别；选定结果即为本点的修正 BQ（工程岩体级别），并给出表 5.4.2 对应的基岩承载力基本值 <InlineMath math="f_0" /> 区间。</>}</p></section> : null}
            <section className={sectionClass(darkMode)}>
              <h2 className={`mb-3 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Correction engineering type' : '修正工程类型'}</h2>
              <CenteredSelect
                darkMode={darkMode}
                value={state.mode}
                ariaLabel={en ? 'Correction engineering type' : '修正工程类型'}
                options={[
                  { id: 'underground', label: en ? 'Underground engineering rock mass' : '地下工程岩体' },
                  { id: 'foundation', label: en ? 'Foundation' : '地基' },
                  { id: 'slope', label: en ? 'Slope engineering' : '边坡工程' },
                ]}
                onChange={(mode) => {
                  if (mode === 'underground' || mode === 'foundation' || mode === 'slope') {
                    patch({ mode, correctionStep: 4, foundationF0: null })
                    setCorrectionStep(4)
                  }
                }}
              />
            </section>
            {state.mode === 'foundation' ? <section data-testid="bq-foundation-correction" className={sectionClass(darkMode)}>
              <h2 className={`mb-3 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Qualitative characteristics of rock-mass basic quality' : '岩体基本质量的定性特征'}</h2>
              <p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>Select the class that matches the observed rock hardness and integrity. The current basic BQ corresponds to {basicGrade ? basicGrade.label.en : '—' } and may be used as a reference when qualitative and quantitative classes differ.</> : <>请按岩石坚硬程度与岩体完整程度选择级别。当前基本 BQ 对应 {basicGrade ? basicGrade.label.zh : '—'}，当定性特征与定量指标不一致时，应结合工程地质情况综合确认。</>}</p>
              <BqGradeTable darkMode={darkMode} language={language} activeGrade={basicGrade?.id ?? null} selectedGrade={foundationGrade?.id ?? null} onSelect={(id) => { patch({ foundationGradeId: id, foundationF0: null, correctionStep: 4 }); setCorrectionStep(4) }} testId="bq-foundation-table" caption={en ? 'Click a row to adopt the engineering class' : '点击行选定工程岩体级别'} />
              <BqFoundationResult darkMode={darkMode} language={language} grade={foundationGrade} />
            </section> : null}
            {state.mode === 'underground' ? <>
              <section className={sectionClass(darkMode)}><StepHeader darkMode={darkMode} title={<><InlineMath math="K_1" /> · {en ? 'Groundwater influence' : '地下水影响'}</>} number={1} complete={correctionStep >= 2} /><p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? 'Select the groundwater condition or enter p/Q. A selected condition adopts the upper bound of its K1 range; p/Q input selects the applicable condition.' : <>按地下水出水状态选择 <InlineMath math="K_1" />，或输入 <InlineMath math="p" />、<InlineMath math="Q" /> 自动判断；选择状态取当前等级区间最大值，输入值按判断档位取区间最大值。</>}</p><div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="block space-y-1"><span className={`text-sm font-medium ${mutedClass(darkMode)}`}>{en ? 'p (fissure water pressure, MPa)' : 'p（地下工程围岩裂隙水压，MPa）'}</span><input aria-label={en ? 'p (fissure water pressure, MPa)' : 'p（地下工程围岩裂隙水压，MPa）'} type="number" min="0" step="any" value={state.groundwaterPressureP ?? ''} onChange={(event) => updateGroundwaterInput('groundwaterPressureP', event.target.value)} onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={numberFieldClass(darkMode)} /></label><label className="block space-y-1"><span className={`text-sm font-medium ${mutedClass(darkMode)}`}>{en ? 'Q (inflow per 10 m, L/min·10m)' : 'Q（每10m洞长出水量，L/min·10m）'}</span><input aria-label={en ? 'Q (inflow per 10 m, L/min·10m)' : 'Q（每10m洞长出水量，L/min·10m）'} type="number" min="0" step="any" value={state.groundwaterInflowQ ?? ''} onChange={(event) => updateGroundwaterInput('groundwaterInflowQ', event.target.value)} onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={numberFieldClass(darkMode)} /></label></div>{groundwaterAssessment ? <p data-testid="bq-k1-assessment" className={`mt-2 text-sm ${mutedClass(darkMode)}`}>{en ? `Assessed condition: ${BQ_UNDERGROUND_WATER_OPTIONS.find((item) => item.id === groundwaterAssessment.optionId)?.label.en ?? ''}; default K1 = ${groundwaterAssessment.value.toFixed(3)}` : <>判断结果：{BQ_UNDERGROUND_WATER_OPTIONS.find((item) => item.id === groundwaterAssessment.optionId)?.label.zh ?? ''}；默认 <InlineMath math="K_1" /> = {groundwaterAssessment.value.toFixed(3)}</>}</p> : null}<BqTable testId="bq-k1-table" rowHeader={en ? 'Groundwater outflow condition' : '地下水出水状态'} darkMode={darkMode} language={language} title={en ? <>Groundwater condition · <InlineMath math="K_1" /> · BQ grade ranges</> : <>地下水出水状态与 <InlineMath math="K_1" /> 修正系数（BQ等级）</>} rows={waterRows} activeGrade={baseGrade} selectedId={state.undergroundWaterId} onSelect={(id) => { patch({ undergroundWaterId: id, groundwaterPressureP: null, groundwaterInflowQ: null, k1Value: midpointForWater(id), correctionStep: 4 }); setCorrectionStep(4) }} />{selectedWater ? <CoefficientInput darkMode={darkMode} language={language} symbol="K1" min={0} max={1} value={state.k1Value} onChange={(value) => patch({ k1Value: value })} /> : null}</section>
              <section className={sectionClass(darkMode)}><StepHeader darkMode={darkMode} title={<><InlineMath math="K_2" /> · {en ? 'Major discontinuity orientation' : '主要结构面产状'}</>} number={2} complete={correctionStep >= 3} /><p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? 'Select the controlling discontinuity orientation relationship or enter a tested K2 value. Empty input is treated as 0.' : <>可点击表格选择 <InlineMath math="K_2" /> 区间最大值，也可输入测试值；未输入按 0 处理，异常值即时提示。</>}</p>{selectedOrientation ? <CoefficientInput darkMode={darkMode} language={language} symbol="K2" min={0} max={1} validationMin={selectedOrientation.range.min} validationMax={selectedOrientation.range.max} value={state.k2Value} onChange={(value) => patch({ k2Value: value })} /> : null}<BqOrientationTable darkMode={darkMode} language={language} rows={orientationRows.filter((row) => row.id !== 'none')} selectedId={state.undergroundOrientationId} onSelect={(id) => { const option = BQ_UNDERGROUND_ORIENTATION_OPTIONS.find((item) => item.id === id); patch({ undergroundOrientationId: id, k2Value: option ? option.range.max : 0, correctionStep: Math.max(correctionStep, 2) }); setCorrectionStep(Math.max(correctionStep, 2)) }} /></section>
              <section className={sectionClass(darkMode)}><StepHeader darkMode={darkMode} title={<><InlineMath math="K_3" /> · {en ? 'Initial stress condition' : '初始应力状态'}</>} number={3} complete={correctionStep >= 4} /><p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>Select the initial stress ratio condition <InlineMath math="R_c/\sigma_{\max}" /> or enter a tested ratio. K3 defaults to the lower bound of the selected range; empty input is treated as 0.</> : <>输入围岩强度应力比 <InlineMath math="R_c/\sigma_{\max}" /> 作为记录并自动选择档位；K3 默认取所选区间最小值，也可在区间内修改，未输入按 0 处理。</>}</p><label className="mt-3 block space-y-1"><span className={`text-sm font-medium ${mutedClass(darkMode)}`}>{en ? 'Rock strength-stress ratio Rc/σmax' : '围岩强度应力比 Rc/σmax'}</span><input aria-label={en ? 'Rock strength-stress ratio Rc/σmax' : '围岩强度应力比 Rc/σmax'} type="number" min="0" step="any" value={state.undergroundStressRatio ?? ''} onChange={(event) => updateStressRatio(event.target.value)} onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={numberFieldClass(darkMode)} /></label>{selectedStress ? <CoefficientInput darkMode={darkMode} language={language} symbol="K3" min={0} max={1.5} value={state.k3Value} onChange={(value) => patch({ k3Value: value })} /> : null}<BqTable testId="bq-k3-table" rowHeader={en ? 'Rock strength-stress ratio Rc/σmax' : '围岩强度应力比 Rc/σmax'} darkMode={darkMode} language={language} title={en ? <>Initial stress condition · <InlineMath math="K_3" /></> : <>初始应力状态与 <InlineMath math="K_3" /> 修正系数</>} rows={stressRows} activeGrade={baseGrade} selectedId={state.undergroundStressId} onSelect={(id) => { const option = BQ_UNDERGROUND_STRESS_OPTIONS.find((item) => item.id === id); const cell = option?.values.find((item) => item.grade === baseGrade)?.range; patch({ undergroundStressId: id, k3Value: cell ? cell.min : 0, undergroundStressRatio: null, correctionStep: Math.max(correctionStep, 3) }); setCorrectionStep(Math.max(correctionStep, 3)) }} /></section>
              <BqCorrectedResult darkMode={darkMode} language={language} result={result} />
            </> : null}
            {state.mode === 'slope' ? <>
              <section className={sectionClass(darkMode)}><StepHeader darkMode={darkMode} title={<><InlineMath math="\lambda" /> · {en ? 'Main discontinuity type and persistence' : '主要结构面类型及其延伸性'}</>} number={1} complete={state.slopeStructureTypeId !== 'none' || state.lambdaValue != null} /><p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? 'Select the controlling discontinuity type and persistence. The selected cell adopts the upper bound of λ; you may then revise the value within that range. Empty input is treated as 0 when no controlling discontinuity is present.' : <>按主要结构面类型及其延伸性点击选择 <InlineMath math="\lambda" />；选定后取该档区间上限，并可在区间内修改。无控制性主要结构面时取 0。</>}</p>{selectedLambda ? <CoefficientInput darkMode={darkMode} language={language} symbol="lambda" min={0} max={1} validationMin={selectedLambda.range.min} validationMax={selectedLambda.range.max} value={state.lambdaValue} onChange={(value) => patch({ lambdaValue: value })} /> : null}<BqLambdaTable darkMode={darkMode} language={language} rows={lambdaRows} selectedId={state.slopeStructureTypeId} onSelect={(id) => { const option = BQ_SLOPE_LAMBDA_OPTIONS.find((item) => item.id === id); patch({ slopeStructureTypeId: id, lambdaValue: option ? option.range.max : 0, ...(id === 'none' ? { slopeF1Id: null, slopeF2Id: null, slopeF3Id: null } : {}), correctionStep: 4 }); setCorrectionStep(4) }} /></section>
              <section className={sectionClass(darkMode)}><StepHeader darkMode={darkMode} title={<><InlineMath math="K_4" /> · {en ? 'Groundwater influence' : '地下水影响'}</>} number={2} complete={state.slopeWaterId !== 'none' || state.k4Value != null} /><p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>Select the groundwater development degree or enter the slope water head <InlineMath math="p_w" /> and slope height <InlineMath math="H" />. A selected condition adopts the upper bound of its <InlineMath math="K_4" /> range for the current BQ class; <InlineMath math="p_w/H" /> input selects the applicable condition.</> : <>按地下水发育程度选择 <InlineMath math="K_4" />，或输入边坡地下水水头 <InlineMath math="p_w" /> 与边坡高度 <InlineMath math="H" /> 自动判定；选择状态取当前等级区间最大值，输入值按 <InlineMath math="p_w/H" /> 判定档位取区间最大值。</>}</p><div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="block space-y-1"><span className={`text-sm font-medium ${mutedClass(darkMode)}`}>{en ? 'pw (phreatic or confined water head, m)' : 'pw（边坡地下水水头，m）'}</span><input aria-label={en ? 'pw (phreatic or confined water head, m)' : 'pw（边坡地下水水头，m）'} type="number" min="0" step="any" value={state.slopeWaterHeadPw ?? ''} onChange={(event) => updateSlopeWaterInput('slopeWaterHeadPw', event.target.value)} onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={numberFieldClass(darkMode)} /></label><label className="block space-y-1"><span className={`text-sm font-medium ${mutedClass(darkMode)}`}>{en ? 'H (slope height, m)' : 'H（边坡高度，m）'}</span><input aria-label={en ? 'H (slope height, m)' : 'H（边坡高度，m）'} type="number" min="0" step="any" value={state.slopeHeightH ?? ''} onChange={(event) => updateSlopeWaterInput('slopeHeightH', event.target.value)} onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={numberFieldClass(darkMode)} /></label></div>{slopeWaterAssessment ? <p data-testid="bq-k4-assessment" className={`mt-2 text-sm ${mutedClass(darkMode)}`}>{en ? `Assessed condition: ${BQ_SLOPE_WATER_OPTIONS.find((item) => item.id === slopeWaterAssessment.optionId)?.label.en ?? ''}; pw/H = ${slopeWaterAssessment.ratio.toFixed(3)}; default K4 = ${slopeWaterAssessment.value.toFixed(3)}` : <>判断结果：{BQ_SLOPE_WATER_OPTIONS.find((item) => item.id === slopeWaterAssessment.optionId)?.label.zh ?? ''}；<InlineMath math="p_w/H" /> = {slopeWaterAssessment.ratio.toFixed(3)}；默认 <InlineMath math="K_4" /> = {slopeWaterAssessment.value.toFixed(3)}</>}</p> : null}<BqTable testId="bq-k4-table" rowHeader={en ? 'Groundwater development degree' : '地下水发育程度'} darkMode={darkMode} language={language} title={en ? <>Groundwater development · <InlineMath math="K_4" /> · BQ grade ranges</> : <>地下水发育程度与 <InlineMath math="K_4" /> 修正系数（BQ等级）</>} rows={slopeWaterRows} activeGrade={baseGrade} selectedId={state.slopeWaterId} onSelect={(id) => { patch({ slopeWaterId: id, slopeWaterHeadPw: null, slopeHeightH: null, k4Value: midpointForSlopeWater(id), correctionStep: 4 }); setCorrectionStep(4) }} />{selectedSlopeWater ? <CoefficientInput darkMode={darkMode} language={language} symbol="K4" min={0} max={1} value={state.k4Value} onChange={(value) => patch({ k4Value: value })} /> : null}</section>
              <section className={sectionClass(darkMode)}><StepHeader darkMode={darkMode} title={<><InlineMath math="K_5" /> · {en ? 'Main discontinuity orientation' : '主要结构面产状'}</>} number={3} complete={slopeK5Ready} /><p className={`text-sm leading-relaxed ${mutedClass(darkMode)}`}>{en ? <>Click the influence degree of each factor. The software computes <InlineMath math="K_5=F_1\times F_2\times F_3" />; <InlineMath math="K_5" /> is not entered by hand. When there is no controlling discontinuity, <InlineMath math="K_5=0" />.</> : <>按影响程度分别点选 <InlineMath math="F_1" />、<InlineMath math="F_2" />、<InlineMath math="F_3" />，由软件计算 <InlineMath math="K_5=F_1\times F_2\times F_3" />，<InlineMath math="K_5" /> 不需手工填写。无控制性主要结构面时 <InlineMath math="K_5=0" />。</>}</p><BqSlopeK5Table darkMode={darkMode} language={language} selectedF1Id={state.slopeF1Id} selectedF2Id={state.slopeF2Id} selectedF3Id={state.slopeF3Id} onSelectF1={(id) => patch({ slopeF1Id: id, correctionStep: 4 })} onSelectF2={(id) => patch({ slopeF2Id: id, correctionStep: 4 })} onSelectF3={(id) => patch({ slopeF3Id: id, correctionStep: 4 })} />{state.slopeStructureTypeId === 'none' ? <p data-testid="bq-k5-product" className={`mt-3 text-sm ${mutedClass(darkMode)}`}>{en ? <>No controlling main discontinuity; <InlineMath math="K_5=0" />.</> : <>无控制性主要结构面，<InlineMath math="K_5=0" />。</>}</p> : result?.corrections.slopeFactors && slopeK5Ready && result.corrections.slopeFactors.f1.id !== 'not_applicable' ? <p data-testid="bq-k5-product" className={`mt-3 text-sm ${mutedClass(darkMode)}`}><InlineMath math="K_5" /> = <InlineMath math="F_1" /> × <InlineMath math="F_2" /> × <InlineMath math="F_3" /> = {formatFactorValue(result.corrections.slopeFactors.f1.value)} × {formatFactorValue(result.corrections.slopeFactors.f2.value)} × {formatFactorValue(result.corrections.slopeFactors.f3.value)} = {Number(result.corrections.slopeFactors.k5.toFixed(3))}</p> : <p className={`mt-3 text-sm ${mutedClass(darkMode)}`}>{en ? 'Select F1, F2 and F3 to compute K5.' : '请点选 F1、F2、F3 后由软件计算 K5。'}</p>}</section>
              <BqCorrectedResult darkMode={darkMode} language={language} result={result} variant="slope" />
            </> : null}
            </> : null}
           <footer className={sectionClass(darkMode)}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">{attempted ? <p className="text-sm text-red-600 dark:text-red-300 sm:mr-auto">{en ? 'Complete the required fields and correction steps.' : '请完成必填参数和修正步骤。'}</p> : <p className={`text-sm sm:mr-auto ${mutedClass(darkMode)}`}>{state.mode === 'basic' ? (baseReady ? (en ? 'Basic BQ is ready.' : '基本 BQ 已可完成。') : (en ? <>Enter <InlineMath math="R_c" /> and <InlineMath math="K_v" />.</> : <>请输入 <InlineMath math="R_c" /> 和 <InlineMath math="K_v" />。</>)) : (correctionReady ? (state.mode === 'foundation' ? (en ? 'Foundation classification is ready.' : '地基工程等级已确定。') : state.mode === 'slope' ? (en ? 'Slope correction is ready.' : '边坡工程修正已完成。') : (en ? 'Underground correction is ready.' : '地下工程修正已完成。')) : (state.mode === 'foundation' ? (en ? 'Select a class from the qualitative characteristics table.' : '请根据定性特征选择地基工程岩体级别。') : state.mode === 'slope' ? (en ? 'Select F1, F2 and F3 to compute K5, or choose no controlling discontinuity.' : '请点选 F1、F2、F3 计算 K5，或选择无控制性主要结构面。') : (en ? 'Complete the underground correction inputs.' : '请完成地下工程修正参数。')))}</p>}<div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={onBackToPoints} className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>{en ? 'Previous' : '上一步'}</button><button type="button" onClick={state.mode === 'basic' ? completeBasic : completeCorrection} className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">{en ? 'Complete' : '完成'}</button><button type="button" onClick={() => { if (state.mode === 'basic' ? baseReady : correctionReady) onNext(); else setAttempted(true) }} className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>{en ? 'Next point' : '下一个'}</button></div></div></footer>
          <div className="pb-24" />
        </main>
        <div className="hidden min-w-0 xl:block"><BqPreview darkMode={darkMode} language={language} state={state} correctionStep={correctionStep} result={result} /></div>
      </div>
    </div>
  )
}
