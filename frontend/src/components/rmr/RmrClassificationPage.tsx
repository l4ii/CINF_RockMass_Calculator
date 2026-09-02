import { useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Km, Kblock } from '../math/Katex'
import { SYM } from '../math/symbols'
import BackIconButton from '../BackIconButton'
import { FormulaFrame, QuickCalcLink } from '../calculationUiPrimitives'
import PointInformationFields from '../classification/PointInformationFields'
import QuickRqdCalculator from '../rqd/QuickRqdCalculator'
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
  RMR_CLASSES,
  STRIKE_RELATIONS,
  type DipBand,
  type StrikeRelation,
} from '../../config/rmrTables'
import {
  computeRmrScores,
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
    zh: '完整岩石材料强度评分表。可由现场试验或钻孔资料确定；低强度范围宜采用单轴抗压强度。',
    en: 'Intact-rock strength rating table. Determine from field tests or borehole data; uniaxial compressive strength is preferred in the low-strength range.',
  },
  a2: {
    zh: '岩石质量指标 RQD 评分表。可由现场取芯或钻孔资料获得。',
    en: 'RQD rating table. Obtain from field core measurements or borehole data.',
  },
  a3: {
    zh: '控制性结构面组平均间距评分表。以发育 3 组结构面为前提，只有 2 组时评价偏于保守。',
    en: 'Mean spacing rating table for the controlling discontinuity set. Ratings assume three sets; with only two sets the assessment is conservative.',
  },
  a4: {
    zh: '结构面条件评分表，包括延续性、张开度、粗糙度、充填物和蚀变/风化。应采用结构分区内具有代表性的通常条件。',
    en: 'Discontinuity-condition rating table: persistence, separation, roughness, infilling, and alteration/weathering. Use representative typical conditions for the structural region.',
  },
  a5: {
    zh: '地下水条件评分表，可用每 10 m 洞长涌水量、结构面水压力比（pw / σ1）或一般状况表示。',
    en: 'Groundwater rating table, expressed as inflow per 10 m of tunnel, joint-water pressure ratio (pw / σ1), or general conditions.',
  },
  a6: {
    zh: '结构面方向修正表。按结构面方向与工程的关系确定修正值，取 0 或负分。',
    en: 'Orientation-adjustment table. The adjustment is determined from the relationship between discontinuity orientation and the engineering work; it is zero or negative.',
  },
} as const

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
            <PointInformationFields
              darkMode={darkMode}
              language={language}
              pointOrdinal={pointOrdinal}
              pointName={pointName}
              pointNote={pointNote}
              pointOreType={pointOreType}
              oreTypeOptions={oreTypeOptions}
              listId="rmr-rock-mass-groups"
              inputClassName={inputCls}
              onPointNameChange={onPointNameChange}
              onPointNoteChange={onPointNoteChange}
              onPointOreTypeChange={onPointOreTypeChange}
            />
          </div>

          <div className={cardCls}>
            <p className={`text-sm leading-relaxed mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {isEn ? (
                <>
                  The <Km math={SYM.RMR89} /> (Rock Mass Rating) system was developed by Bieniawski in 1973 and revised in 1989; this page follows the 1989 revision.
                  Six ratings are summed: intact-rock uniaxial compressive strength <Km math={SYM.A1} />, <Km math={SYM.RQD} /> <Km math={SYM.A2} />, discontinuity spacing <Km math={SYM.A3} />, discontinuity condition <Km math={SYM.A4} />, groundwater <Km math={SYM.A5} />, and discontinuity orientation <Km math={SYM.A6} />.
                  Discontinuity condition includes persistence, separation, roughness, infilling, and alteration/weathering. Apply the system to structural regions of broadly uniform geology and rate representative typical conditions.
                </>
              ) : (
                <>
                  <Km math={SYM.RMR89} />（Rock Mass Rating）岩体地质力学分级系统由 Bieniawski 于 1973 年提出，1989 年修订；本页采用 1989 年修订版。
                  六项评分求和：完整岩石单轴抗压强度 <Km math={SYM.A1} />、<Km math={SYM.RQD} /> <Km math={SYM.A2} />、结构面间距 <Km math={SYM.A3} />、结构面条件 <Km math={SYM.A4} />、地下水 <Km math={SYM.A5} /> 和结构面方向 <Km math={SYM.A6} />。
                  结构面条件包括延续性、张开度、粗糙度、充填物和蚀变/风化。应按地质特征大致均一的结构分区评价，并采用具有代表性的通常条件。
                </>
              )}
            </p>

            <FormulaFrame darkMode={darkMode}>
              <div className={`flex justify-center ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                <Kblock math={SYM.RMR_formula} />
              </div>
            </FormulaFrame>

            <div data-testid="rmr-class-summary" className="mt-4 space-y-1.5">
              <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{isEn ? <><Km math={SYM.RMR} /> class summary</> : <><Km math={SYM.RMR} /> 分级汇总</>}</div>
              <div className="overflow-x-auto">
                <table className={`w-full min-w-[420px] border-collapse border text-sm ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <thead className={darkMode ? 'bg-gray-700/60 text-gray-200' : 'bg-gray-100 text-gray-700'}>
                    <tr>
                      <th className="border px-2 py-2 text-center font-medium">{isEn ? 'Rock-mass class' : '岩体质量等级'}</th>
                      <th className="border px-2 py-2 text-center font-medium">{isEn ? <> <Km math={SYM.RMR} /> range</> : <><Km math={SYM.RMR} /> 区间</>}</th>
                      <th className="border px-2 py-2 text-center font-medium">{isEn ? 'Rock-mass quality' : '岩体质量'}</th>
                    </tr>
                  </thead>
                  <tbody className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {RMR_CLASSES.map((entry) => {
                      const selected = scores.classInfo?.id === entry.id
                      return (
                        <tr key={entry.id} className={selected ? (darkMode ? 'bg-blue-900/50 text-blue-100' : 'bg-blue-100 text-blue-900') : undefined}>
                          <td className="border px-2 py-2 text-center font-medium">{isEn ? entry.labelEn : entry.label}</td>
                          <td className="border px-2 py-2 text-center tabular-nums">{entry.rmrRange}</td>
                          <td className="border px-2 py-2 text-center">{isEn ? entry.qualityEn : entry.quality}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4 mt-2">
              <RmrParamSection
                darkMode={darkMode}
                language={language}
                sectionId="rmr-a1"
                sectionRef={a1Ref}
                title={isEn ? <><Km math={SYM.A1} /> · Strength of intact rock material</> : <><Km math={SYM.A1} /> · 完整岩石材料的强度</>}
                description={SECTION_HELP.a1[language]}
                score={scores.A1}
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="block space-y-1">
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? <>Point-load strength index <Km math={SYM.Is50} /> (MPa)</> : <>点荷载强度指标 <Km math={SYM.Is50} />（MPa）</>}</span>
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
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? <>Uniaxial compressive strength <Km math={SYM.UCS} /> (MPa)</> : <>单轴抗压强度 <Km math={SYM.UCS} />（MPa）</>}</span>
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
                title={isEn ? <><Km math={SYM.A2} /> · Rock Quality Designation (<Km math={SYM.RQD} />)</> : <><Km math={SYM.A2} /> · 岩石质量指标 <Km math={SYM.RQD} />（%）</>}
                description={SECTION_HELP.a2[language]}
                score={scores.A2}
              >
                <label className="block max-w-xs space-y-1">
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? <><Km math={SYM.RQD} /> value (%)</> : <><Km math={SYM.RQD} /> 值（%）</>}</span>
                  <input
                    aria-label={isEn ? 'RQD value' : 'RQD 值'}
                    data-testid="rmr-rqd-input"
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
                  <QuickCalcLink
                    darkMode={darkMode}
                    language={language}
                    testId="rmr-rqd-quick-open"
                    onClick={() => setRqdCalculatorOpen(true)}
                  />
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
                title={isEn ? <><Km math={SYM.A3} /> · Spacing of discontinuities</> : <><Km math={SYM.A3} /> · 结构面间距（cm）</>}
                description={SECTION_HELP.a3[language]}
                score={scores.A3}
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
                title={isEn ? <><Km math={SYM.A4} /> · Condition of discontinuities</> : <><Km math={SYM.A4} /> · 结构面条件</>}
                description={SECTION_HELP.a4[language]}
                score={scores.A4}
                hint={
                  value.a4Detailed
                    ? isEn
                      ? <>Current basis: detailed ratings; their sum is <Km math={SYM.A4} />. Current sum: {a4SumExpression}</>
                      : <>当前口径：详细评分，五项评分之和即为 <Km math={SYM.A4} />。当前求和：{a4SumExpression}</>
                    : undefined
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
                        <Km math={SYM.A4} /> = {a4SumExpression}
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
                title={isEn ? <><Km math={SYM.A5} /> · Groundwater</> : <><Km math={SYM.A5} /> · 地下水</>}
                description={SECTION_HELP.a5[language]}
                score={scores.A5}
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
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? <>Joint water pressure ratio (<Km math={SYM.pwSigma1} />)</> : <>结构面水压力比（<Km math={SYM.pwSigma1} />）</>}</span>
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
                title={isEn ? <><Km math={SYM.A6} /> · Discontinuity orientation adjustment</> : <><Km math={SYM.A6} /> · 结构面方向修正</>}
                description={SECTION_HELP.a6[language]}
                score={scores.A6}
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
          showIntro
          titleId="rmr-rqd-quick-title"
          formulaTestId="rmr-rqd-formula"
          confirmLabel={isEn ? 'Confirm and fill RQD' : '确认并回填 RQD'}
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
