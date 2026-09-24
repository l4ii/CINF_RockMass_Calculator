import { useMemo, useState, type KeyboardEvent, type ReactNode, type WheelEvent } from 'react'
import { Km, Kblock } from '../math/Katex'
import { SYM } from '../math/symbols'
import BackIconButton from '../BackIconButton'
import { FormulaFrame, QuickCalcLink } from '../calculationUiPrimitives'
import type { CustomEditorPageProps } from '../classification/ClassificationModule'
import PointInformationFields from '../classification/PointInformationFields'
import QuickRqdCalculator from '../rqd/QuickRqdCalculator'
import QFactorCalculator from './QFactorCalculator'
import QScorePreview from './QScorePreview'
import QResultPanel from './QResultPanel'
import QSupportPanel from './QSupportPanel'
import {
  displayedFactorValue,
  factorOptionsFor,
  matchFactorOption,
  normalizeQState,
  Q_FACTOR_BOUNDS,
  tableValueFor,
  Q_JA_OPTIONS,
  Q_JN_OPTIONS,
  Q_JR_OPTIONS,
  Q_JW_OPTIONS,
  Q_SRF_OPTIONS,
  tryCalculateQ,
  validateQState,
  type QFactorSymbol,
  type QFormState,
} from '../../methods/q'

type QProps = CustomEditorPageProps
type FactorKey = 'jn' | 'jr' | 'ja' | 'jw' | 'srf'
type CalculatorTarget = 'rqd' | QFactorSymbol | null

const FACTOR_KEY: Record<QFactorSymbol, FactorKey> = {
  Jn: 'jn',
  Jr: 'jr',
  Ja: 'ja',
  Jw: 'jw',
  SRF: 'srf',
}

function preventNumberWheel(event: WheelEvent<HTMLInputElement>) {
  event.currentTarget.blur()
}

function preventNumberArrow(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') event.preventDefault()
}

function NumberInput({
  darkMode,
  language,
  field,
  label,
  ariaLabel,
  symbol,
  value,
  unit,
  min,
  max,
  testId,
  onQuick,
  onChange,
}: {
  darkMode: boolean
  language: 'zh' | 'en'
  field: string
  label: ReactNode
  ariaLabel: string
  symbol: string
  value: number | null | undefined
  unit?: string
  min?: number
  max?: number
  testId?: string
  onQuick: () => void
  onChange: (value: number | null) => void
}) {
  const en = language === 'en'
  const invalid = value != null && Number.isFinite(value) && ((min != null && value < min) || (max != null && value > max))
  const invalidText = en
    ? `Invalid value: enter ${symbol} between ${min} and ${max}.`
    : `异常值：请输入 ${min}～${max} 范围内的 ${symbol}。`
  const input = `w-full rounded-lg border px-3 py-2 text-center text-sm tabular-nums outline-none focus:ring-2 ${unit ? 'pr-14' : ''} ${
    invalid
      ? `border-red-400 focus:ring-red-500/30 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`
      : darkMode
        ? 'border-gray-600 bg-gray-800 text-gray-100 focus:ring-blue-500/30'
        : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500/30'
  }`
  return (
    <div data-field={field} className="min-w-0">
      <div className={`mb-1 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {label}
      </div>
      <div className="relative">
        <input
          aria-label={ariaLabel}
          aria-invalid={invalid}
          data-testid={testId}
          type="number"
          className={input}
          value={value ?? ''}
          min={min}
          max={max}
          step={0.01}
          onWheel={preventNumberWheel}
          onKeyDown={(event) => {
            preventNumberArrow(event)
            if (event.key === '-' || event.key === '+' || event.key === 'e' || event.key === 'E') event.preventDefault()
          }}
          onChange={(event) => {
            const raw = event.target.value
            if (raw === '') {
              onChange(null)
              return
            }
            const next = Number(raw)
            if (Number.isFinite(next)) onChange(next)
          }}
        />
        {unit ? <span className={`pointer-events-none absolute right-3 top-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{unit}</span> : null}
      </div>
      {invalid ? <p role="alert" className={`mt-1 text-xs ${darkMode ? 'text-red-300' : 'text-red-600'}`}>{invalidText}</p> : null}
      <QuickCalcLink
        darkMode={darkMode}
        language={language}
        testId={`${testId}-quick-open`.replace('-input', '')}
        onClick={onQuick}
      />
    </div>
  )
}

export default function QClassificationPage({
  darkMode,
  language,
  caseName,
  pointName,
  pointNote,
  pointOreType,
  oreTypeOptions = [],
  pointOrdinal,
  pointTotal,
  form,
  onFormChange,
  onPointNameChange,
  onPointNoteChange,
  onPointOreTypeChange,
  onBackToWorkspace,
  onBackToPoints,
  onComplete,
  onNext,
}: QProps) {
  const en = language === 'en'
  const state = useMemo(() => normalizeQState(form), [form])
  const issues = useMemo(() => validateQState(state).filter((item) => item.severity === 'error'), [state])
  const result = useMemo(() => tryCalculateQ(state), [state])
  const [attempted, setAttempted] = useState(false)
  const [calculator, setCalculator] = useState<CalculatorTarget>(null)
  const patch = (partial: Partial<QFormState>) => onFormChange({ ...state, ...partial } as unknown as Record<string, unknown>)
  const centered = `w-full rounded-lg border px-3 py-2 text-center text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`
  const card = `rounded-lg border p-4 sm:p-5 ${darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white shadow-sm'}`
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'

  const setFactor = (symbol: QFactorSymbol, value: number | null) => {
    const key = FACTOR_KEY[symbol]
    const options = factorOptionsFor(symbol)
    if (value == null) {
      patch({ [`${key}Id`]: '', [`${key}Value`]: null } as Partial<QFormState>)
      return
    }
    const table = tableValueFor(symbol, value, { jnSite: state.jnSite, jrWideSpacing: state.jrWideSpacing })
    const match = matchFactorOption(options, table, state[`${key}Id` as keyof QFormState] as string)
    patch({ [`${key}Id`]: match?.id ?? '', [`${key}Value`]: value } as Partial<QFormState>)
  }

  const finish = (action: () => void) => {
    if (issues.length > 0) {
      setAttempted(true)
      document.querySelector<HTMLElement>(`[data-field="${issues[0].field}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setAttempted(false)
    action()
  }

  const factorMeta: Record<QFactorSymbol, { title: ReactNode; intro: ReactNode }> = {
    Jn: {
      title: en ? <>Joint-set number <Km math={SYM.Jn} /></> : <>节理组数 <Km math={SYM.Jn} /> 取值</>,
      intro: en ? (
        <>
          <p>
            <Km math={SYM.Jn} /> is the joint-set number: how many joint sets (including random joints) actually cut the rock into blocks. Together with RQD it forms the block-size quotient <Km math={SYM.RQD_over_Jn} />.
          </p>
          <p>
            Count only joints that occur at the same location and form definite blocks. If spacing is generally greater than the span or height, those joints rarely allow fallout and should be treated as random. Adding every set seen along a long stretch of tunnel overestimates <Km math={SYM.Jn} />.
          </p>
          <p>
            The number of joint directions is not always the same as the number of joint sets. Columnar jointing often has three directions, yet <Km math={SYM.Jn} /> = 4 is usually more reasonable. Use the site factor for tunnel intersections (×3) or portals and cross-cuts (×2).
          </p>
        </>
      ) : (
        <>
          <p>
            <Km math={SYM.Jn} /> 为节理组数，表示在同一部位切割岩体、形成块体的节理组数量（含随机节理）。它与 RQD 组成块体尺寸指标 <Km math={SYM.RQD_over_Jn} />。
          </p>
          <p>
            只计入同一位置、确实构成块体的节理。若某组间距普遍大于巷道跨度或高度，由其形成的块体通常过大而不易掉落，应按随机节理考虑。沿较长洞段把见到的各组简单累加，会使 <Km math={SYM.Jn} /> 偏大。
          </p>
          <p>
            节理方向数不一定等于节理组数。柱状节理常有三个方向，但更合理的取值多为 <Km math={SYM.Jn} /> = 4。巷道交叉点按 3 倍计，洞口或穿脉按 2 倍计，请在表上方选取部位修正。
          </p>
        </>
      ),
    },
    Jr: {
      title: en ? <>Joint roughness <Km math={SYM.Jr} /></> : <>节理粗糙度 <Km math={SYM.Jr} /> 取值</>,
      intro: en ? (
        <>
          <p>
            <Km math={SYM.Jr} /> is the joint roughness number. Joint friction depends on whether the walls are stepped, undulating or planar, and whether they are rough, smooth or slickensided. With <Km math={SYM.Ja} /> it forms the inter-block shear-strength quotient <Km math={SYM.Jr_over_Ja} />.
          </p>
          <p>
            Rate every set, then adopt the least favourable one for excavation stability—the set most likely to shear—and use the same discontinuity for <Km math={SYM.Ja} />. Small-scale texture (mm–cm: rough, smooth, slickensided) can be felt by running a finger along the wall. Medium-scale form (dm–m: stepped, undulating, planar) is judged with a ~1 m straightedge, relative to block size and the probable slide direction.
          </p>
          <p>
            If filling prevents wall contact during shear, roughness no longer counts and <Km math={SYM.Jr} /> = 1. If only a few joints of that set are exposed, <Km math={SYM.Jr} /> + 1 may be used; the same +1 applies when mean spacing exceeds 3 m.
          </p>
        </>
      ) : (
        <>
          <p>
            <Km math={SYM.Jr} /> 为节理粗糙度系数。结构面摩擦取决于壁面是阶坎状、波状还是平面状，以及粗糙、光滑还是带擦痕。它与 <Km math={SYM.Ja} /> 组成块间抗剪强度指标 <Km math={SYM.Jr_over_Ja} />。
          </p>
          <p>
            须评价该处各组节理，再取对开挖稳定最不利、最可能发生剪切的一组，并与 <Km math={SYM.Ja} /> 取自同一条结构面。小尺度（mm–cm）的粗糙、光滑、擦痕可用手指沿壁面感知；中尺度（dm–m）的阶坎、波状、平面可用约 1 m 直尺量起伏幅值，并对照块体尺寸与可能滑动方向。
          </p>
          <p>
            充填使剪切过程中壁面不能接触时，粗糙度不再起作用，<Km math={SYM.Jr} /> 取 1。该组仅局部出露或平均间距大于 3 m 时，可按 <Km math={SYM.Jr} /> + 1 取值。
          </p>
        </>
      ),
    },
    Ja: {
      title: en ? <>Joint alteration <Km math={SYM.Ja} /></> : <>节理蚀变 <Km math={SYM.Ja} /> 取值</>,
      intro: en ? (
        <>
          <p>
            <Km math={SYM.Ja} /> is the joint alteration number. Besides roughness, filling thickness and strength control friction; both depend on mineralogy. Use the same discontinuity as for <Km math={SYM.Jr} />.
          </p>
          <p>
            Fillings are grouped by whether the walls still touch when the joint is sheared: (a) rock-wall contact, coatings only; (b) contact before 10 cm of shear; (c) no contact during shear. For smooth joints a millimetre of fill may suffice to prevent contact; rough undulating joints may need several millimetres or centimetres.
          </p>
          <p>
            The residual friction angle <Km math={SYM.phiR} /> is a cross-check only and does not enter Q. Rows K and M cover a range of clay conditions; choose the matching one above the table.
          </p>
        </>
      ) : (
        <>
          <p>
            <Km math={SYM.Ja} /> 为节理蚀变系数。除粗糙度外，充填物的厚度与强度对摩擦同样关键，二者取决于矿物组成。必须与 <Km math={SYM.Jr} /> 取自同一条结构面。
          </p>
          <p>
            按剪切时壁面是否接触分为三类：（a）无充填或仅有薄膜、壁面接触；（b）薄层充填，错动 10 cm 前接触；（c）厚层充填，剪切过程中不接触。光滑面约 1 mm 充填即可隔开壁面；粗糙波状面可能需要数毫米甚至数厘米。
          </p>
          <p>
            残余摩擦角 <Km math={SYM.phiR} /> 仅供对照校核，不代入 Q。K、M 两档对应多种黏土状况，选中后在表上方选取。
          </p>
        </>
      ),
    },
    Jw: {
      title: en ? <>Joint-water reduction <Km math={SYM.Jw} /></> : <>裂隙水状态 <Km math={SYM.Jw} /> 取值</>,
      intro: en ? (
        <>
          <p>
            <Km math={SYM.Jw} /> is the joint-water reduction factor. Water can soften or wash out mineral fill, lowering joint friction, and water pressure reduces normal stress so blocks shear more easily. With SRF it forms the active-stress quotient <Km math={SYM.Jw_over_SRF} />.
          </p>
          <p>
            Rate the inflow and water pressure actually observed in the opening. The lowest values (<Km math={SYM.Jw} /> &lt; 0.2) imply severe stability problems. Isolated drips in a limited area correspond to 1.0; a trickle, small jets, or widespread dripping correspond to 0.66.
          </p>
          <p>
            Rows C–F are crude estimates: increase <Km math={SYM.Jw} /> if the rock is drained or grouted. Inflow may vary with season or develop after excavation. Ice-related problems are not covered.
          </p>
        </>
      ) : (
        <>
          <p>
            <Km math={SYM.Jw} /> 为裂隙水折减系数。地下水可软化或冲走充填物、降低结构面摩擦，水压还会减小壁面法向应力，使块体更易剪切。它与 SRF 组成应力指标 <Km math={SYM.Jw_over_SRF} />。
          </p>
          <p>
            按开挖中实际观测到的涌水量与水压取值。最低档（<Km math={SYM.Jw} /> &lt; 0.2）对应严重稳定问题。局部零星滴水取 1.0；集中细流、小股射流或大范围频繁滴水取 0.66。
          </p>
          <p>
            C～F 各档为粗略估计，排水或注浆后可适当增大。涌水可能随季节变化，也可能在开挖后才出现。本表未考虑结冰问题。
          </p>
        </>
      ),
    },
    SRF: {
      title: en ? <>Stress reduction factor <Km math={SYM.SRF} /></> : <>应力折减 <Km math={SYM.SRF} /> 取值</>,
      intro: en ? (
        <>
          <p>
            SRF is the stress reduction factor. It describes the relationship between rock stress and rock strength around an underground opening. Effects may appear as spalling, slabbing, deformation, squeezing, dilatancy or block release, sometimes only days to months after excavation.
          </p>
          <p>
            Choose the governing category first, then the rating from the table—do not multiply unrelated branches: (a) weakness zones intersecting the opening; (b) stress problems in competent rock; (c) squeezing of incompetent rock under moderate to high stress; (d) chemical swelling in the presence of water. Group (a) is listed in full here; the other groups are abbreviated.
          </p>
          <p>
            In massive rock SRF may also be estimated from <Km math={String.raw`\sigma_c/\sigma_1`} /> or <Km math={String.raw`\sigma_\theta/\sigma_c`} />, but that relation is intended only where <Km math={String.raw`\mathrm{RQD}/J_n \gg 10`} />. Immediate mapping after blasting can miss delayed squeezing or joint growth.
          </p>
        </>
      ) : (
        <>
          <p>
            SRF 为应力折减系数，描述地下开挖周边地应力与岩石强度的关系。应力效应可表现为剥落、片帮、变形、挤出、扩容或块体松脱，有的要在开挖后数日、数周甚至数月才显现。
          </p>
          <p>
            先判定所属类别，再按表取值，只取一个控制性条件，不要把无关分支叠乘：（a）软弱区穿切开挖体；（b）坚硬完整岩体中的应力问题；（c）软弱岩体在中–高应力下的塑性挤出；（d）有水时的化学膨胀。本窗口第（a）组按原表列出，其余三组为简表。
          </p>
          <p>
            完整岩体中也可由 <Km math={String.raw`\sigma_c/\sigma_1`} /> 或 <Km math={String.raw`\sigma_\theta/\sigma_c`} /> 估算，但经验上仅当 <Km math={String.raw`\mathrm{RQD}/J_n \gg 10`} /> 时适用。爆破后立即编录可能低估滞后出现的挤出或新生节理。
          </p>
        </>
      ),
    },
  }

  const openFactor = calculator && calculator !== 'rqd' ? calculator : null
  const openOptions = openFactor ? factorOptionsFor(openFactor) : []
  const openKey = openFactor ? FACTOR_KEY[openFactor] : null

  return (
    <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      <div className="grid w-full min-h-0 flex-1 grid-cols-1 gap-4 px-4 py-5 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,3fr)_minmax(220px,1fr)]">
        <main data-testid="calculation-input-pane" className="thin-scroll -mr-1 min-h-0 min-w-0 flex-1 overflow-y-auto space-y-3 pr-0.5">
          <header className="flex items-start gap-2">
            <BackIconButton label={en ? 'Back' : '返回'} onClick={onBackToPoints} darkMode={darkMode} className="mt-1" />
            <div className="min-w-0">
              <nav className={`flex flex-wrap items-center gap-1 text-xs ${muted}`}>
                <button type="button" onClick={onBackToWorkspace} className="hover:text-blue-600">{en ? 'Project workspace' : '项目工作区'}</button>
                <span>/</span>
                <button type="button" onClick={onBackToPoints} className="hover:text-blue-600">{caseName}</button>
                <span>/</span>
                <span>{pointName}</span>
              </nav>
              <h1 className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {en ? 'Q classification' : 'Q分级'}
              </h1>
              <p className={`mt-1 text-sm ${muted}`}>{en ? 'Point' : '点位'} {pointOrdinal} / {pointTotal}</p>
            </div>
          </header>

          <section className={card}>
            <PointInformationFields
              darkMode={darkMode}
              language={language}
              pointOrdinal={pointOrdinal}
              pointName={pointName}
              pointNote={pointNote}
              pointOreType={pointOreType}
              oreTypeOptions={oreTypeOptions}
              listId="q-rock-mass-groups"
              inputClassName={centered}
              onPointNameChange={onPointNameChange}
              onPointNoteChange={onPointNoteChange}
              onPointOreTypeChange={onPointOreTypeChange}
            />
          </section>

          <section data-testid="q-method-introduction" className={card}>
            <h2 className={`mb-3 text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {en ? 'Barton rock-mass quality classification (Q)' : '巴顿岩体质量分类（Q）'}
            </h2>
            <p className={`mb-4 text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {en ? (
                <>
                  The Q-value is determined from engineering geology, hydrogeology, ore-body occurrence, jointing, excavation-induced stresses and intact-rock properties.
                  {' '}It is the product of three conceptual parameters: block size <Km math={SYM.RQD_over_Jn} />, joint shear <Km math={SYM.Jr_over_Ja} />, and active stress <Km math={SYM.Jw_over_SRF} />.
                  {' '}<Km math={SYM.RQD} /> is rock quality designation; <Km math={SYM.Jn} /> is the joint-set number; <Km math={SYM.Jr} /> and <Km math={SYM.Ja} /> describe roughness and alteration of the least favourable discontinuity; <Km math={SYM.Jw} /> is the joint-water factor; <Km math={SYM.SRF} /> covers weakness zones, competent-rock stress, squeezing and swelling.
                  {' '}Known ratings may be typed directly; otherwise use Quick calculation to pick from the Barton tables.
                </>
              ) : (
                <>
                  Q 值根据工程地质、水文地质、矿体赋存、节理发育、开挖地应力及岩石物理性质综合确定。
                  公式由三个概念参数相乘得到：块体尺寸 <Km math={SYM.RQD_over_Jn} />、节理抗剪 <Km math={SYM.Jr_over_Ja} />、主动应力 <Km math={SYM.Jw_over_SRF} />。
                  <Km math={SYM.RQD} /> 为岩石质量指标，<Km math={SYM.Jn} /> 为节理组数；<Km math={SYM.Jr} />、<Km math={SYM.Ja} /> 分别描述最不利节理或节理组的粗糙度与蚀变状态；<Km math={SYM.Jw} /> 为裂隙水状态；<Km math={SYM.SRF} /> 反映断层软弱带、硬岩强度应力比、挤压与膨胀等条件。
                  已有测值可直接填入；需要查表时点「快速计算」。
                </>
              )}
            </p>
            <div data-testid="q-formula">
              <FormulaFrame darkMode={darkMode}>
                <div className={`text-center ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  <Kblock math={SYM.Q_formula} />
                </div>
              </FormulaFrame>
            </div>
          </section>

          <section data-testid="q-group-block" className={card}>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {en ? <>Rock structure · <Km math={SYM.RQD_over_Jn} /></> : <>岩体结构 / 块体尺寸 · <Km math={SYM.RQD_over_Jn} /></>}
            </h2>
            <p className={`mt-1 mb-3 text-sm leading-relaxed ${muted}`}>
              {en
                ? <>Use <Km math={SYM.RQD} /> and the joint-set number to estimate block size. The ratio typically lies between 100/0.5 and 10/20. <Km math={SYM.RQD} /> below 10% is entered as measured but calculated as 10%.</>
                : <>用岩石质量指标与节理组数估计块体尺寸，比值约介于 100/0.5 与 10/20 之间。实测 <Km math={SYM.RQD} /> 小于 10% 时仍记录实测值，计算按名义 10% 代入。</>}
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <NumberInput
                darkMode={darkMode}
                language={language}
                field="rqd"
                testId="q-rqd-input"
                ariaLabel={en ? 'Rock quality designation RQD' : '岩石质量指标 RQD'}
                symbol="RQD"
                label={en ? <>Rock quality designation <Km math={SYM.RQD} />:</> : <>岩石质量指标 <Km math={SYM.RQD} />：</>}
                value={state.rqd}
                unit="%"
                min={0}
                max={100}
                onQuick={() => setCalculator('rqd')}
                onChange={(rqd) => patch({ rqd })}
              />
              <NumberInput
                darkMode={darkMode}
                language={language}
                field="jnValue"
                testId="q-jn-input"
                ariaLabel={en ? 'Joint-set number Jn' : '节理组数 Jn'}
                symbol="Jn"
                label={en ? <>Joint-set number <Km math={SYM.Jn} />:</> : <>节理组数指标 <Km math={SYM.Jn} />：</>}
                value={displayedFactorValue(state.jnId, state.jnValue, Q_JN_OPTIONS)}
                min={Q_FACTOR_BOUNDS.Jn.min}
                max={Q_FACTOR_BOUNDS.Jn.max}
                onQuick={() => setCalculator('Jn')}
                onChange={(value) => setFactor('Jn', value)}
              />
            </div>
          </section>

          <section data-testid="q-group-shear" className={card}>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {en ? <>Joint shear · <Km math={SYM.Jr_over_Ja} /></> : <>节理抗剪 · <Km math={SYM.Jr_over_Ja} /></>}
            </h2>
            <p className={`mt-1 mb-3 text-sm leading-relaxed ${muted}`}>
              {en
                ? <><Km math={SYM.Jr} /> and <Km math={SYM.Ja} /> must describe the same least favourable discontinuity. Higher <Km math={SYM.Jr_over_Ja} /> means higher frictional strength; thin clay fillings reduce it sharply.</>
                : <><Km math={SYM.Jr} /> 与 <Km math={SYM.Ja} /> 必须针对同一条最不利结构面选取。比值越大抗剪越有利；薄层黏土充填会显著降低强度。</>}
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <NumberInput
                darkMode={darkMode}
                language={language}
                field="jrValue"
                testId="q-jr-input"
                ariaLabel={en ? 'Joint roughness Jr' : '节理粗糙度 Jr'}
                symbol="Jr"
                label={en ? <>Joint roughness <Km math={SYM.Jr} />:</> : <>最不利节理粗糙度 <Km math={SYM.Jr} />：</>}
                value={displayedFactorValue(state.jrId, state.jrValue, Q_JR_OPTIONS)}
                min={Q_FACTOR_BOUNDS.Jr.min}
                max={Q_FACTOR_BOUNDS.Jr.max}
                onQuick={() => setCalculator('Jr')}
                onChange={(value) => setFactor('Jr', value)}
              />
              <NumberInput
                darkMode={darkMode}
                language={language}
                field="jaValue"
                testId="q-ja-input"
                ariaLabel={en ? 'Joint alteration Ja' : '节理蚀变 Ja'}
                symbol="Ja"
                label={en ? <>Joint alteration <Km math={SYM.Ja} />:</> : <>最不利节理蚀变 <Km math={SYM.Ja} />：</>}
                value={displayedFactorValue(state.jaId, state.jaValue, Q_JA_OPTIONS)}
                min={Q_FACTOR_BOUNDS.Ja.min}
                max={Q_FACTOR_BOUNDS.Ja.max}
                onQuick={() => setCalculator('Ja')}
                onChange={(value) => setFactor('Ja', value)}
              />
            </div>
          </section>

          <section data-testid="q-group-stress" className={card}>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {en ? <>Active stress · <Km math={SYM.Jw_over_SRF} /></> : <>主动应力 · <Km math={SYM.Jw_over_SRF} /></>}
            </h2>
            <p className={`mt-1 mb-3 text-sm leading-relaxed ${muted}`}>
              {en
                ? <>Jw/SRF is an empirical factor for water pressure and the effective principal stress. SRF covers faults, strength-to-stress ratio, squeezing and swelling.</>
                : <>Jw/SRF 描述裂隙水与岩体中有效主应力的经验影响。SRF 涵盖断层软弱带、硬岩强度应力比、挤压与膨胀。</>}
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <NumberInput
                darkMode={darkMode}
                language={language}
                field="jwValue"
                testId="q-jw-input"
                ariaLabel={en ? 'Joint-water reduction Jw' : '裂隙水状态 Jw'}
                symbol="Jw"
                label={en ? <>Joint-water factor <Km math={SYM.Jw} />:</> : <>裂隙水状态指标 <Km math={SYM.Jw} />：</>}
                value={displayedFactorValue(state.jwId, state.jwValue, Q_JW_OPTIONS)}
                min={Q_FACTOR_BOUNDS.Jw.min}
                max={Q_FACTOR_BOUNDS.Jw.max}
                onQuick={() => setCalculator('Jw')}
                onChange={(value) => setFactor('Jw', value)}
              />
              <NumberInput
                darkMode={darkMode}
                language={language}
                field="srfValue"
                testId="q-srf-input"
                ariaLabel={en ? 'Stress reduction factor SRF' : '应力折减 SRF'}
                symbol="SRF"
                label={en ? <>Stress reduction factor <Km math={SYM.SRF} />:</> : <>应力折减指标 <Km math={SYM.SRF} />：</>}
                value={displayedFactorValue(state.srfId, state.srfValue, Q_SRF_OPTIONS)}
                min={Q_FACTOR_BOUNDS.SRF.min}
                max={Q_FACTOR_BOUNDS.SRF.max}
                onQuick={() => setCalculator('SRF')}
                onChange={(value) => setFactor('SRF', value)}
              />
            </div>
          </section>

          <QResultPanel darkMode={darkMode} language={language} result={result} />
          <QSupportPanel darkMode={darkMode} language={language} result={result} state={state} onChange={patch} />

          <footer className={card}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              {attempted && issues.length > 0 ? (
                <p className="text-sm text-red-600 dark:text-red-300 sm:mr-auto">{en ? issues[0].message.en : issues[0].message.zh}</p>
              ) : (
                <p className={`text-sm sm:mr-auto ${muted}`}>
                  {issues.length > 0
                    ? (en ? 'Draft is saved automatically.' : '草稿已自动保存，可稍后补充。')
                    : (en ? 'All required parameters are complete.' : '必填参数已完整。')}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={onBackToPoints} className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>{en ? 'Previous' : '上一步'}</button>
                <button type="button" onClick={() => finish(onComplete)} className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">{en ? 'Complete' : '完成'}</button>
                <button type="button" onClick={() => finish(onNext)} className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>{en ? 'Next point' : '下一个'}</button>
              </div>
            </div>
          </footer>
          <div className="pb-24" />
        </main>
        <aside data-testid="calculation-result-pane" className="hidden min-w-0 xl:block">
          <QScorePreview darkMode={darkMode} language={language} state={state} result={result} />
        </aside>
      </div>

      {calculator === 'rqd' ? (
        <QuickRqdCalculator
          darkMode={darkMode}
          language={language}
          showIntro
          qSystemNotes
          titleId="q-rqd-quick-title"
          formulaTestId="q-rqd-formula"
          confirmLabel={en ? 'Confirm and fill RQD' : '确认并回填 RQD'}
          onClose={() => setCalculator(null)}
          onComplete={(rqd) => {
            patch({ rqd })
            setCalculator(null)
          }}
        />
      ) : null}

      {openFactor && openKey ? (
        <QFactorCalculator
          darkMode={darkMode}
          language={language}
          symbol={openFactor}
          title={factorMeta[openFactor].title}
          intro={factorMeta[openFactor].intro}
          options={openOptions}
          selectedId={state[`${openKey}Id`]}
          selectedValue={state[`${openKey}Value`]}
          jnSite={state.jnSite}
          jrWideSpacing={state.jrWideSpacing}
          onClose={() => setCalculator(null)}
          onComplete={({ id, value, jnSite, jrWideSpacing }) => {
            patch({
              [`${openKey}Id`]: id,
              [`${openKey}Value`]: value,
              ...(openFactor === 'Jn' ? { jnSite: jnSite ?? 'normal' } : {}),
              ...(openFactor === 'Jr' ? { jrWideSpacing: jrWideSpacing ?? false } : {}),
            } as Partial<QFormState>)
            setCalculator(null)
          }}
        />
      ) : null}
    </div>
  )
}
