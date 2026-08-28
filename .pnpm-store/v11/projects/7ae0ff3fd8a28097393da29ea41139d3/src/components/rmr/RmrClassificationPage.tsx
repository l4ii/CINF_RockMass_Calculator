import { useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
// @ts-ignore - react-katex types
import { BlockMath, InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import BackIconButton from '../BackIconButton'
import { FormulaFrame } from '../calculationUiPrimitives'
import {
  A2_REFERENCE_TABLE,
  A3_REFERENCE_TABLE,
  A4_DETAIL_ROWS,
  A4_REFERENCE_TABLE,
  A5_BY_CRITERION,
  A5_CRITERIA,
  availableDipBandsForStrike,
  buildA1ReferenceTable,
  buildA5ReferenceTable,
  DIP_BANDS,
  STRIKE_RELATIONS,
  type DipBand,
  type StrikeRelation,
} from '../../config/rmrTables'
import {
  computeRmrScores,
  RMR_PARAM_TITLES,
  resolveFavorabilityFromTableB,
  a1PointLoadOptionForValue,
  a1UcsOptionForValue,
  a2RqdOptionForValue,
  a3SpacingOptionForValue,
  a5InflowOptionForValue,
  a5PressureOptionForValue,
  type RmrFormState,
} from '../../utils/rmrCalc'
import RmrParamSection, { type CollapsiblePanel } from './RmrParamSection'
import RmrReferenceTable, {
  RmrDetailReferenceTable,
  RmrTableBMatrix,
} from './RmrReferenceTable'
import RmrResultPanel from './RmrResultPanel'
import RmrScorePreview from './RmrScorePreview'

interface RmrClassificationPageProps {
  darkMode: boolean
  language: 'zh' | 'en'
  caseName: string
  pointName: string
  pointNote: string
  pointOreType: string
  oreTypeOptions?: string[]
  pointOrdinal: number
  pointTotal: number
  value: RmrFormState
  onChange: (next: RmrFormState) => void
  onPointNameChange: (name: string) => void
  onPointNoteChange: (note: string) => void
  onPointOreTypeChange: (oreType: string) => void
  onBackToWorkspace: () => void
  onBackToPoints: () => void
  onComplete: () => void
  onCompleteAndNext: () => void
  onEnterMrmr?: () => void
}

const SECTION_HELP = {
  a1: {
    zh: '完整岩石材料强度可由现场试验或钻孔资料确定。低强度范围宜采用单轴抗压强度；输入点荷载强度指标或单轴抗压强度后自动匹配评分，也可直接点击表1。',
    en: 'Determine intact-rock strength from field tests or borehole data. For the low-strength range, uniaxial compressive strength is preferred. Enter a point-load index or uniaxial compressive strength to match a rating, or click Table 1.',
  },
  a2: {
    zh: 'RQD 可由现场取芯或钻孔资料获得。输入 RQD 值自动匹配评分，也可直接点击表2；需要时可打开快速计算并回填。',
    en: 'RQD can be obtained from field core measurements or borehole data. Enter an RQD value to match a rating, or click Table 2; the quick calculator can be used when needed.',
  },
  a3: {
    zh: '按控制性结构面组的平均间距确定评分；也可输入数值自动匹配或直接点击表3。间距评分以发育3组结构面为基础，只有2组时评价偏于保守。',
    en: 'Rate the mean spacing of the controlling discontinuity set, or enter a value to match a rating or click Table 3. Spacing ratings assume three discontinuity sets; with only two sets, the assessment is conservative.',
  },
  a4: {
    zh: '根据结构面的延续性、张开度、粗糙度、充填物和蚀变/风化情况进行评分；应采用结构分区内具有代表性的通常条件。',
    en: 'Rate discontinuity conditions by persistence, separation, roughness, infilling, and alteration/weathering. Use representative typical conditions for the structural region.',
  },
  a5: {
    zh: '地下水条件可用每10 m隧道长度涌水量、结构面水压力比（pw / σ1）或一般状况表示，三种方式任选其一输入或选择，系统自动匹配评分，也可直接点击表5。',
    en: 'Describe groundwater using inflow per 10 m of tunnel, joint-water pressure ratio (pw / σ1), or general conditions. Choose one method to match a rating, or click Table 5.',
  },
  a6: {
    zh: '根据结构面方向与工程的关系确定方向修正。隧道项目可选择走向和倾角自动匹配，也可直接点击表7；修正值为0或负分。',
    en: 'Determine the orientation adjustment from the relationship between discontinuity orientation and the engineering work. For tunnels, select strike and dip to match it automatically, or click Table 7; the adjustment is zero or negative.',
  },
} as const

interface QuickRqdCalculatorProps {
  darkMode: boolean
  language: 'zh' | 'en'
  onClose: () => void
  onComplete: (rqd: number) => void
}

function QuickRqdCalculator({ darkMode, language, onClose, onComplete }: QuickRqdCalculatorProps) {
  const isEn = language === 'en'
  const [soundCoreLength, setSoundCoreLength] = useState<string>('')
  const [drillHoleLength, setDrillHoleLength] = useState<string>('')
  const muted = darkMode ? 'text-gray-400' : 'text-gray-600'
  const panel = darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
  const inputCls = `w-full rounded-lg border px-3 py-2 text-center text-sm ${darkMode ? 'border-gray-500 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`
  const soundCore = Number(soundCoreLength)
  const drillHole = Number(drillHoleLength)
  const result = soundCoreLength !== '' && drillHoleLength !== '' && Number.isFinite(soundCore) && Number.isFinite(drillHole) && drillHole > 0 && soundCore >= 0 && soundCore <= drillHole
    ? Number(((soundCore / drillHole) * 100).toFixed(2))
    : null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rmr-rqd-quick-title"
        className={`w-full max-w-4xl rounded-xl border p-5 shadow-xl ${panel}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="rmr-rqd-quick-title" className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {isEn ? 'Quick RQD calculator' : 'RQD 快速计算'}
            </h2>
            <p className={`mt-1 text-sm ${muted}`}>
              {isEn ? 'Enter the core lengths, review the calculated RQD, then confirm the matching A2 rating.' : '输入岩芯累计长度和钻孔长度，确认计算结果后回填对应的 A2 评分。'}
            </p>
          </div>
          <button
            type="button"
            aria-label={isEn ? 'Close' : '关闭'}
            title={isEn ? 'Close' : '关闭'}
            onClick={onClose}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-lg ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            ×
          </button>
        </div>

        <div data-testid="rmr-rqd-formula" className={`mt-4 rounded-lg border px-3 py-2 ${darkMode ? 'border-gray-600 bg-gray-900/40' : 'border-gray-200 bg-gray-50'}`}>
          <p className={`mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? 'Formula' : '计算公式'}</p>
          <BlockMath
            math={isEn
              ? String.raw`\mathrm{RQD}=\frac{\text{cumulative core length }\ge 10\,\mathrm{cm}}{\text{drill hole length}}\times 100\%`
              : String.raw`\mathrm{RQD}=\frac{\text{长度 }\ge 10\,\mathrm{cm}\text{ 的岩芯累计长度}}{\text{钻孔长度}}\times 100\%`}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? 'Cumulative core length at least 10 cm' : '长度 ≥ 10 cm 的岩芯累计长度'}</span>
            <input aria-label={isEn ? 'Cumulative core length at least 10 cm' : '长度 ≥ 10 cm 的岩芯累计长度'} type="number" min="0" step="0.01" value={soundCoreLength} onChange={(event) => setSoundCoreLength(event.target.value)} className={inputCls} />
          </label>
          <label className="block space-y-1">
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? 'Drill hole length' : '钻孔长度'}</span>
            <input aria-label={isEn ? 'Drill hole length' : '钻孔长度'} type="number" min="0" step="0.01" value={drillHoleLength} onChange={(event) => setDrillHoleLength(event.target.value)} className={inputCls} />
          </label>
        </div>
        <div className={`mt-4 rounded-lg border px-3 py-3 text-center ${darkMode ? 'border-gray-600 bg-gray-900/40 text-gray-100' : 'border-gray-200 bg-gray-50 text-gray-900'}`}>
          <span className="text-sm font-medium">{isEn ? 'Calculated RQD' : '计算结果 RQD'}：</span>
          <span className="font-semibold tabular-nums">{result == null ? '—' : `${result} %`}</span>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
            {isEn ? 'Cancel' : '取消'}
          </button>
          <button type="button" disabled={result == null} onClick={() => result != null && onComplete(result)} className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-blue-700">
            {isEn ? 'Confirm and fill RMR' : '确认并回填 RMR'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RmrClassificationPage({
  darkMode,
  language,
  caseName,
  pointName,
  pointNote,
  pointOreType,
  oreTypeOptions = [],
  pointOrdinal,
  pointTotal,
  value,
  onChange,
  onPointNameChange,
  onPointNoteChange,
  onPointOreTypeChange,
  onBackToWorkspace,
  onBackToPoints,
  onComplete,
  onCompleteAndNext,
  onEnterMrmr,
}: RmrClassificationPageProps) {
  const isEn = language === 'en'
  const [validationAttempted, setValidationAttempted] = useState(false)
  const [rqdCalculatorOpen, setRqdCalculatorOpen] = useState(false)

  const a1Ref = useRef<HTMLElement>(null)
  const a2Ref = useRef<HTMLElement>(null)
  const a3Ref = useRef<HTMLElement>(null)
  const a4Ref = useRef<HTMLElement>(null)
  const a5Ref = useRef<HTMLElement>(null)
  const a6Ref = useRef<HTMLElement>(null)
  const scores = useMemo(() => computeRmrScores(value), [value])

  const patch = (partial: Partial<RmrFormState>) => onChange({ ...value, ...partial })

  const title = isEn ? 'RMR Classification' : 'RMR 岩体地质力学分级'
  const backLabel = isEn ? 'Back' : '返回'
  const availableA6DipBands = useMemo(() => availableDipBandsForStrike(value.a6Strike), [value.a6Strike])


  const applyOrientation = (strike: StrikeRelation | null, dip: DipBand | null) => {
    const favorability = resolveFavorabilityFromTableB(strike, dip)
    const merged: RmrFormState = {
      ...value,
      a6Project: 'tunnel',
      a6Strike: strike,
      a6Dip: dip,
      a6Favorability: favorability,
    }
    onChange(merged)
  }

  const selectA4Detail = (rowKey: string, optionId: string) => {
    const merged: RmrFormState = { ...value, [rowKey]: optionId, a4Detailed: true } as RmrFormState
    onChange(merged)
  }

  const a4DetailSelection = useMemo(
    () =>
      A4_DETAIL_ROWS.reduce<Record<string, string | null>>((acc, row) => {
        acc[row.key] = (value[row.key as keyof RmrFormState] as string | null) ?? null
        return acc
      }, {}),
    [value]
  )

  /** 分项详评的求和过程，如「6 + 5 + 3 + 2 + 1 = 17」 */
  const a4SumExpression = useMemo(() => {
    const parts = A4_DETAIL_ROWS.map((row) => {
      const id = value[row.key as keyof RmrFormState] as string | null
      return row.options.find((option) => option.id === id)?.score ?? null
    })
    if (parts.some((part) => part == null)) {
      return `${parts.map((part) => (part == null ? '?' : part)).join(' + ')} = ${isEn ? 'incomplete' : '待补全'}`
    }
    const total = parts.reduce<number>((sum, part) => sum + (part ?? 0), 0)
    return `${parts.join(' + ')} = ${total}`
  }, [isEn, value])

  const a1ReferenceTable = useMemo(() => buildA1ReferenceTable(null), [])
  const a5ReferenceTable = useMemo(() => buildA5ReferenceTable(value.a5Criterion), [value.a5Criterion])

  const referencePanel = (key: string, label: string, content: CollapsiblePanel['content']): CollapsiblePanel => ({
    key,
    label,
    content,
  })

  const inputCls = `w-full rounded-lg border px-3 py-2 text-center text-sm ${
    darkMode ? 'border-gray-500 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
  }`
  const selectCls = `${inputCls} appearance-none`
  const cardCls = `rounded-lg border p-4 sm:p-5 ${
    darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white shadow-sm'
  }`

  const actionButton = (label: string, onClick: () => void, primary = false) => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2.5 text-sm font-medium border transition-colors ${
        primary
          ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
          : darkMode
            ? 'border-gray-600 text-gray-200 hover:bg-gray-800'
            : 'border-gray-300 text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  )

  const finishPoint = (action: () => void) => {
    if (!scores.allComplete) {
      setValidationAttempted(true)
      return
    }
    setValidationAttempted(false)
    action()
  }

  return (
    <div className={`flex-1 min-h-0 min-w-0 flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="grid w-full min-h-0 flex-1 grid-cols-1 gap-4 px-4 py-5 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,3fr)_minmax(220px,1fr)]">
        <div data-testid="calculation-input-pane" className="thin-scroll -mr-1 min-h-0 min-w-0 flex-1 overflow-y-auto space-y-4 pr-0.5">
          <div className="flex items-start gap-2">
            <BackIconButton label={backLabel} onClick={onBackToPoints} darkMode={darkMode} className="mt-1" />
            <div className="min-w-0">
              <nav className={`flex flex-wrap items-center gap-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <button
                  type="button"
                  onClick={onBackToWorkspace}
                  className={darkMode ? 'hover:text-blue-300' : 'hover:text-blue-700'}
                >
                  {isEn ? 'Project workspace' : '项目工作区'}
                </button>
                <span aria-hidden>/</span>
                <button
                  type="button"
                  onClick={onBackToPoints}
                  className={darkMode ? 'hover:text-blue-300' : 'hover:text-blue-700'}
                >
                  {caseName}
                </button>
                <span aria-hidden>/</span>
                <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{pointName}</span>
              </nav>
              <h1
                className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${
                  darkMode ? 'text-gray-100' : 'text-gray-900'
                }`}
              >
                {title}
              </h1>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {isEn ? 'Point' : '点位'} {pointOrdinal} / {pointTotal}
              </p>
            </div>
          </div>

          <div className={cardCls}>
            <h2 className={`mb-3 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{isEn ? 'Point information' : '点位信息'}</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="block space-y-1">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? 'Point number' : '点位序号'}</span>
                <input className={inputCls} value={pointOrdinal} readOnly aria-readonly="true" aria-label={isEn ? 'Point number' : '点位序号'} />
              </label>
              <label className="block space-y-1">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? 'Point name' : '点位名称'}</span>
                <input
                  className={inputCls}
                  value={pointName}
                  onChange={(event) => onPointNameChange(event.target.value)}
                  placeholder={isEn ? 'e.g. K12+350 crown' : '如：K12+350 拱顶'}
                />
              </label>
              <label className="block space-y-1">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? 'Ore / rock type' : '矿岩类型'}</span>
                <input
                  className={inputCls}
                  value={pointOreType}
                  onChange={(event) => onPointOreTypeChange(event.target.value)}
                  placeholder={isEn ? 'e.g. Granite' : '如：花岗岩'}
                />
              </label>
              <label className="block space-y-1">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {isEn ? 'Point note (chainage / borehole, optional)' : '点位说明（桩号 / 钻孔号，可选）'}
                </span>
                <input
                  className={inputCls}
                  value={pointNote}
                  onChange={(event) => onPointNoteChange(event.target.value)}
                  placeholder={isEn ? 'e.g. BH-07, depth 45-52 m' : '如：ZK-07，深度 45 ~ 52 m'}
                />
              </label>
            </div>
          </div>

          <div className={cardCls}>
            <p className={`text-sm leading-relaxed mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {isEn ? (
                <>
                  The RMR (Rock Mass Rating) system was developed by Bieniawski in 1973 and revised in 1989; this page follows the 1989 revision.
                  It uses six measurable rock-mass parameters: uniaxial compressive strength of intact rock material <InlineMath math="A_1" />,
                  RQD <InlineMath math="A_2" />, spacing of discontinuities <InlineMath math="A_3" />, condition of discontinuities <InlineMath math="A_4" />,
                  groundwater conditions <InlineMath math="A_5" />, and orientation of discontinuities <InlineMath math="A_6" />.
                  Discontinuity condition includes persistence, separation, roughness, infilling, and alteration/weathering. The six ratings are summed to obtain RMR,
                  which is classified into Classes I-V at 81-100, 61-80, 41-60, 21-40, and 20 or below.
                  For application, divide the tunnel route into structural regions with broadly uniform geological features and determine the parameters from field or borehole data.
                  Rate representative typical conditions rather than isolated worst conditions.
                </>
              ) : (
                <>
                  RMR（Rock Mass Rating）岩体地质力学分级系统由Bieniawski于1973年提出，并于1989年修订；本页采用其1989年修订版本。
                  该系统采用6项可在现场测定、部分也可由钻孔资料获得的岩体参数：完整岩石材料的单轴抗压强度 <InlineMath math="A_1" />、RQD值 <InlineMath math="A_2" />、结构面间距 <InlineMath math="A_3" />、结构面条件 <InlineMath math="A_4" />、地下水条件 <InlineMath math="A_5" /> 和结构面方向 <InlineMath math="A_6" />。
                  其中结构面条件包括延续性、张开度、粗糙度、充填物和蚀变/风化。各项参数分别评分并求和得到RMR值，再按RMR总评分将岩体划分为I～V级。
                  应用RMR时，应沿隧道线路按地质特征大致均一的区段划分结构分区，在每个分区内依据现场测量或钻孔资料确定上述参数，并按对应表格评分；评价时应采用具有代表性的通常条件，而不是局部最不利条件。
                  结构面间距评分以存在3组结构面为前提，只有2组时所得评价偏于保守。
                </>
              )}
            </p>

            <FormulaFrame darkMode={darkMode}>
              <div className={`flex justify-center ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                <BlockMath math={'RMR = A_1 + A_2 + A_3 + A_4 + A_5 + A_6'} />
              </div>
            </FormulaFrame>

            <div className="space-y-4 mt-2">
              <RmrParamSection
                darkMode={darkMode}
                language={language}
                sectionId="rmr-a1"
                sectionRef={a1Ref}
                title={isEn ? RMR_PARAM_TITLES.A1.titleEn : RMR_PARAM_TITLES.A1.title}
                description={SECTION_HELP.a1[language]}
                score={scores.A1}
                hint={isEn ? 'Determine intact-rock strength from field tests or borehole data. For the low-strength range, use uniaxial compressive strength; enter a value or click Table 1.' : '完整岩石材料强度可由现场试验或钻孔资料确定；低强度范围宜采用单轴抗压强度。可输入数值自动匹配，也可直接点击表1。'}
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="block space-y-1">
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? 'Point-load strength index (MPa)' : '点荷载强度指标（MPa）'}</span>
                    <input
                      aria-label={isEn ? 'Point-load strength index' : '点荷载强度指标'}
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputCls}
                      value={value.a1PointLoadValue ?? ''}
                      onChange={(event) => {
                        const numeric = event.target.value === '' ? null : Number(event.target.value)
                        patch({
                          a1PointLoadValue: numeric,
                          a1UcsValue: null,
                          a1Mode: numeric == null ? null : 'point_load',
                          a1OptionId: a1PointLoadOptionForValue(numeric),
                        })
                      }}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? 'Uniaxial compressive strength (MPa)' : '单轴抗压强度（MPa）'}</span>
                    <input
                      aria-label={isEn ? 'Uniaxial compressive strength' : '单轴抗压强度'}
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputCls}
                      value={value.a1UcsValue ?? ''}
                      onChange={(event) => {
                        const numeric = event.target.value === '' ? null : Number(event.target.value)
                        patch({
                          a1PointLoadValue: null,
                          a1UcsValue: numeric,
                          a1Mode: numeric == null ? null : 'ucs',
                          a1OptionId: a1UcsOptionForValue(numeric),
                        })
                      }}
                    />
                  </label>
                </div>
                <RmrReferenceTable
                  darkMode={darkMode}
                  language={language}
                  spec={a1ReferenceTable}
                  selectedId={value.a1OptionId}
                  onSelect={(id) => {
                    patch({
                      a1Mode: id.startsWith('pl_') ? 'point_load' : 'ucs',
                      a1OptionId: id,
                      a1PointLoadValue: null,
                      a1UcsValue: null,
                    })
                  }}
                />
              </RmrParamSection>

              <RmrParamSection
                darkMode={darkMode}
                language={language}
                sectionId="rmr-a2"
                sectionRef={a2Ref}
                title={isEn ? RMR_PARAM_TITLES.A2.titleEn : `${RMR_PARAM_TITLES.A2.title}（%）`}
                description={SECTION_HELP.a2[language]}
                score={scores.A2}
                hint={
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>{isEn ? 'RQD can be obtained from field core measurements or borehole data. Enter a value or click Table 2; use the quick calculator when needed.' : 'RQD可由现场取芯或钻孔资料获得。可输入数值自动匹配，也可直接点击表2；需要时可进入RQD计算。'}</span>
                    <button
                      type="button"
                      onClick={() => setRqdCalculatorOpen(true)}
                      className="font-semibold underline"
                    >
                      {isEn ? 'Open RQD calculator' : '进入 RQD 计算'}
                    </button>
                  </span>
                }
              >
                <label className="block max-w-xs space-y-1">
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? 'RQD value (%)' : 'RQD 值（%）'}</span>
                  <input
                    list="rmr-rock-mass-groups"
                    aria-label={isEn ? 'RQD value' : 'RQD 值'}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className={inputCls}
                    value={value.a2RqdValue ?? ''}
                    onChange={(event) => {
                      const numeric = event.target.value === '' ? null : Number(event.target.value)
                      patch({ a2RqdValue: numeric, a2OptionId: a2RqdOptionForValue(numeric) })
                    }}
                  />
                  <datalist id="rmr-rock-mass-groups">{oreTypeOptions.map((option) => <option key={option} value={option} />)}</datalist>
                </label>
                <RmrReferenceTable
                  darkMode={darkMode}
                  language={language}
                  spec={A2_REFERENCE_TABLE}
                  selectedId={value.a2OptionId}
                  onSelect={(id) => {
                    patch({ a2OptionId: id })
                  }}
                />
              </RmrParamSection>

              <RmrParamSection
                darkMode={darkMode}
                language={language}
                sectionId="rmr-a3"
                sectionRef={a3Ref}
                title={isEn ? RMR_PARAM_TITLES.A3.titleEn : `${RMR_PARAM_TITLES.A3.title}（cm）`}
                description={SECTION_HELP.a3[language]}
                score={scores.A3}
                hint={isEn ? 'Rate the mean spacing of the controlling discontinuity set, or enter a value or click Table 3. The spacing ratings assume three discontinuity sets; two sets give a conservative assessment.' : '按控制性结构面组的平均间距评分，可输入数值或直接点击表3。间距评分以3组结构面为基础，只有2组时评价偏于保守。'}
              >
                <label className="block max-w-xs space-y-1">
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? 'Discontinuity spacing (cm)' : '结构面间距（cm）'}</span>
                  <input
                    aria-label={isEn ? 'Discontinuity spacing' : '结构面间距'}
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputCls}
                    value={value.a3SpacingValue ?? ''}
                    onChange={(event) => {
                      const numeric = event.target.value === '' ? null : Number(event.target.value)
                      patch({ a3SpacingValue: numeric, a3OptionId: a3SpacingOptionForValue(numeric) })
                    }}
                  />
                </label>
                <RmrReferenceTable
                  darkMode={darkMode}
                  language={language}
                  spec={A3_REFERENCE_TABLE}
                  selectedId={value.a3OptionId}
                  onSelect={(id) => {
                    patch({ a3OptionId: id })
                  }}
                />
              </RmrParamSection>

              <RmrParamSection
                darkMode={darkMode}
                language={language}
                sectionId="rmr-a4"
                sectionRef={a4Ref}
                title={isEn ? RMR_PARAM_TITLES.A4.titleEn : RMR_PARAM_TITLES.A4.title}
                description={SECTION_HELP.a4[language]}
                score={scores.A4}
                  hint={
                    value.a4Detailed
                    ? isEn
                      ? `Current basis: detailed Table 4 ratings; their sum is A4. Current sum: ${a4SumExpression}`
                      : `当前口径：详细评分，五项评分之和即为 A4。当前求和：${a4SumExpression}`
                    : isEn
                      ? 'Click a summary description in Table 4, or complete the five selections in detailed ratings.'
                      : '按结构分区内具有代表性的通常条件，对延续性、张开度、粗糙度、充填物和蚀变/风化评分；可直接点击表4的综合描述，也可完成五项详细选择。'
                }
                panels={[
                  referencePanel(
                    'a4-detail',
                    isEn ? 'Detailed ratings' : '详细评分',
                    <>
                      <RmrDetailReferenceTable
                        darkMode={darkMode}
                        language={language}
                        caption={isEn ? 'Table 4 · Detailed ratings for discontinuity condition' : '表4 · 结构面条件详细评分'}
                        rows={A4_DETAIL_ROWS}
                        selection={a4DetailSelection}
                        onSelect={selectA4Detail}
                        footnote={isEn ? 'The sum of these ratings is A4. If conditions are mutually exclusive, such as infilling obscuring roughness, use the summary description in Table 4.' : '以各项评分之和作为 A4；若部分条件相互排斥（例如充填遮蔽粗糙度），应直接按表4的综合描述评分。'}
                      />
                      <p className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                        A4 = {a4SumExpression}
                      </p>
                    </>
                  ),
                ]}
              >
                <RmrReferenceTable
                  darkMode={darkMode}
                  language={language}
                  spec={A4_REFERENCE_TABLE}
                  compactSummary
                  selectedId={value.a4Detailed ? null : value.a4SimpleId}
                  onSelect={(id) => {
                    patch({ a4SimpleId: id, a4Detailed: false })
                  }}
                />
                {value.a4Detailed ? (
                  <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    {isEn
                      ? 'Detailed ratings are always visible. Complete all five selections here, or use the summary description above.'
                    : '详细评分始终显示，请在下方完成五项选择；也可使用上方的综合描述。'}
                  </p>
                ) : null}
              </RmrParamSection>

              <RmrParamSection
                darkMode={darkMode}
                language={language}
                sectionId="rmr-a5"
                sectionRef={a5Ref}
                title={isEn ? RMR_PARAM_TITLES.A5.titleEn : RMR_PARAM_TITLES.A5.title}
                description={SECTION_HELP.a5[language]}
                score={scores.A5}
                hint={isEn ? 'Describe groundwater by inflow per 10 m of tunnel, joint-water pressure ratio (pw / σ1), or general conditions. Choose one method or click Table 5.' : '地下水条件可用每10 m隧道长度涌水量、结构面水压力比（pw / σ1）或一般状况表示；三种方式任选其一，或直接点击表5。'}
              >
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  <label className="block space-y-1">
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? 'Inflow per 10 m tunnel length (L/min)' : '每 10 m 隧道长度涌水量（L/min）'}</span>
                    <input
                      aria-label={isEn ? 'Inflow per 10 m tunnel length' : '每 10 m 隧道长度涌水量'}
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputCls}
                      value={value.a5InflowValue ?? ''}
                      onChange={(event) => {
                        const numeric = event.target.value === '' ? null : Number(event.target.value)
                        patch({
                          a5InflowValue: numeric,
                          a5PressureValue: null,
                          a5Criterion: 'inflow',
                          a5OptionId: a5InflowOptionForValue(numeric),
                        })
                      }}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? 'Joint water pressure ratio (pw / σ1)' : '结构面水压力比（pw / σ1）'}</span>
                    <input
                      aria-label={isEn ? 'Joint water pressure ratio (pw / σ1)' : '结构面水压力比（pw / σ1）'}
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputCls}
                      value={value.a5PressureValue ?? ''}
                      onChange={(event) => {
                        const numeric = event.target.value === '' ? null : Number(event.target.value)
                        patch({
                          a5PressureValue: numeric,
                          a5InflowValue: null,
                          a5Criterion: 'pressure',
                          a5OptionId: a5PressureOptionForValue(numeric),
                        })
                      }}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? 'General conditions' : '一般状况'}</span>
                    <div className="relative">
                      <select
                        aria-label={isEn ? 'General conditions' : '一般状况'}
                        className={selectCls}
                        value={value.a5Criterion === 'condition' ? value.a5OptionId ?? '' : ''}
                        onChange={(event) => patch({
                          a5Criterion: 'condition',
                          a5OptionId: event.target.value || null,
                          a5InflowValue: null,
                          a5PressureValue: null,
                        })}
                      >
                        <option value="">{isEn ? 'Select' : '请选择'}</option>
                        {A5_BY_CRITERION.condition.map((option) => <option key={option.id} value={option.id}>{isEn ? option.labelEn : option.label}</option>)}
                      </select>
                      <ChevronDown
                        aria-hidden
                        className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}
                      />
                    </div>
                  </label>
                </div>
                <RmrReferenceTable
                  darkMode={darkMode}
                  language={language}
                  spec={a5ReferenceTable}
                  selectedId={value.a5OptionId}
                  onSelectCell={(rowIndex, columnIndex) => {
                    const criterion = A5_CRITERIA[rowIndex].id
                    const option = A5_BY_CRITERION[criterion][columnIndex]
                    if (!option) return
                    patch({
                      a5Criterion: criterion,
                      a5OptionId: option.id,
                      a5InflowValue: null,
                      a5PressureValue: null,
                    })
                  }}
                />
              </RmrParamSection>

              <RmrParamSection
                darkMode={darkMode}
                language={language}
                sectionId="rmr-a6"
                sectionRef={a6Ref}
                title={isEn ? RMR_PARAM_TITLES.A6.titleEn : RMR_PARAM_TITLES.A6.title}
                description={SECTION_HELP.a6[language]}
                score={scores.A6}
                hint={isEn ? 'Determine the adjustment from the relationship between discontinuity orientation and the engineering work. For tunnels, choose strike and dip or click the matching cell in Table 7.' : '根据结构面方向与工程的关系确定方向修正；隧道项目可选择走向和倾角自动匹配，也可直接点击表7中的对应单元格。'}
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="block space-y-1">
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? 'Strike relation to tunnel axis' : '结构面走向与隧道轴线关系'}</span>
                    <select
                      aria-label={isEn ? 'Strike relation to tunnel axis' : '结构面走向与隧道轴线关系'}
                      className={inputCls}
                      value={value.a6Strike ?? ''}
                      onChange={(event) => {
                        const strike = (event.target.value || null) as StrikeRelation | null
                        const availableDips = availableDipBandsForStrike(strike)
                        const dip = value.a6Dip && availableDips.includes(value.a6Dip) ? value.a6Dip : null
                        applyOrientation(strike, dip)
                      }}
                    >
                      <option value="">{isEn ? 'Select strike relation' : '请选择走向关系'}</option>
                      {STRIKE_RELATIONS.map((item) => <option key={item.id} value={item.id}>{isEn ? item.labelEn : item.label}</option>)}
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? 'Dip angle' : '结构面倾角'}</span>
                    <select
                      aria-label={isEn ? 'Dip angle' : '结构面倾角'}
                      className={inputCls}
                      value={value.a6Dip ?? ''}
                      onChange={(event) => applyOrientation(value.a6Strike, (event.target.value || null) as DipBand | null)}
                    >
                      <option value="">{isEn ? 'Select dip angle' : '请选择倾角'}</option>
                      {DIP_BANDS.filter((item) => availableA6DipBands.includes(item.id)).map((item) => <option key={item.id} value={item.id}>{isEn ? item.labelEn : item.label}</option>)}
                    </select>
                  </label>
                </div>
                <div className="mt-3">
                  <RmrTableBMatrix
                    darkMode={darkMode}
                    language={language}
                    strike={value.a6Strike}
                    dip={value.a6Dip}
                    onSelect={(strike, dip) => applyOrientation(strike, dip)}
                  />
                </div>
              </RmrParamSection>
            </div>
          </div>

          <div id="rmr-result" className="space-y-4">
            <RmrResultPanel darkMode={darkMode} language={language} scores={scores} onEnterMrmr={onEnterMrmr} />

            <div className={cardCls}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <p className={`text-sm sm:mr-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {validationAttempted && !scores.allComplete
                    ? isEn
                      ? `Complete the first missing parameter; ${6 - scores.completedCount} ${6 - scores.completedCount === 1 ? 'rating remains' : 'ratings remain'}.`
                      : `请先补充首个缺失参数；当前还有 ${6 - scores.completedCount} 项未选择。`
                    : scores.allComplete
                      ? isEn ? 'All six ratings are complete.' : '六项评分已填写。'
                      : isEn
                        ? `${6 - scores.completedCount} ${6 - scores.completedCount === 1 ? 'rating remains' : 'ratings remain'}; the draft is saved automatically.`
                        : `还有 ${6 - scores.completedCount} 项未选择，草稿已自动保存。`}
                </p>
                <div className="flex flex-wrap justify-end gap-2">
                  {actionButton(isEn ? 'Previous' : '上一步', onBackToPoints)}
                  {actionButton(isEn ? 'Complete' : '完成', onComplete, true)}
                  {actionButton(isEn ? 'Next point' : '下一个', () => finishPoint(onCompleteAndNext))}
                </div>
              </div>
            </div>
            <div className="pb-24" />
          </div>
        </div>

        <div data-testid="calculation-result-pane" className="hidden min-w-0 xl:block">
          <RmrScorePreview darkMode={darkMode} language={language} scores={scores} />
        </div>
      </div>
      {rqdCalculatorOpen ? (
        <QuickRqdCalculator
          darkMode={darkMode}
          language={language}
          onClose={() => setRqdCalculatorOpen(false)}
          onComplete={(rqd) => {
            patch({ a2RqdValue: rqd, a2OptionId: a2RqdOptionForValue(rqd) })
            setRqdCalculatorOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}
