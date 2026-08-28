import { useMemo, useState } from 'react'
// @ts-ignore - react-katex types
import { BlockMath, InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import BackIconButton from '../BackIconButton'
import { FormulaFrame } from '../calculationUiPrimitives'
import RmrParamSection from '../rmr/RmrParamSection'
import MrmrScorePreview from './MrmrScorePreview'
import {
  MRMR_BLASTING_OPTIONS,
  MRMR_JOINT_OPTIONS,
  MRMR_JOINT_SET_OPTIONS,
  MRMR_MINING_METHOD_OPTIONS,
  MRMR_STRESS_OPTIONS,
  MRMR_WATER_OPTIONS,
  MRMR_WEATHERING_CONDITIONS,
  MRMR_WEATHERING_EXPOSURES,
  calculateMrmr,
  normalizeMrmrState,
  validateMrmrState,
  type MrmrApplicability,
  type MrmrFormState,
} from '../../methods/mrmr'

interface MrmrClassificationPageProps {
  darkMode: boolean
  language: 'zh' | 'en'
  caseName: string
  pointName: string
  pointNote: string
  pointOreType: string
  pointOrdinal: number
  pointTotal: number
  value: MrmrFormState
  onChange: (next: MrmrFormState) => void
  onPointNameChange: (name: string) => void
  onPointNoteChange: (note: string) => void
  onPointOreTypeChange: (oreType: string) => void
  onBackToWorkspace: () => void
  onBackToPoints: () => void
  onComplete: () => void
  onCompleteAndNext: () => void
}

function Field({ darkMode, field, label, children, wide = false }: { darkMode: boolean; field: string; label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div data-field={field} className={wide ? 'md:col-span-2' : undefined}>
      <label className={`mb-1 block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</label>
      {children}
    </div>
  )
}

function Select({ darkMode, field, value, options, onChange, language, wide = false }: { darkMode: boolean; field: string; value: string | null | undefined; options: readonly { id: string; label: string; labelEn: string }[]; onChange: (value: string) => void; language: 'zh' | 'en'; wide?: boolean }) {
  const input = `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`
  const labels: Record<string, [string, string]> = { jointSetCount: ['开放节理组数', 'Open-joint sets'], jointConditionId: ['控制结构面条件', 'Controlling joint condition'], weatheringConditionId: ['潜在风化程度', 'Potential weathering'], weatheringExposureId: ['暴露时间', 'Exposure period'], miningMethodId: ['采矿方式', 'Mining method'], stressId: ['诱发应力情景', 'Mining-induced stress'], blastingId: ['开挖 / 爆破方式', 'Excavation / blasting'], waterId: ['水条件', 'Water condition'] }
  const label = labels[field]?.[language === 'en' ? 1 : 0] ?? field
  return <Field darkMode={darkMode} field={field} label={label} wide={wide}><select aria-label={label} className={input} value={value ?? ''} onChange={(event) => onChange(event.target.value)}><option value="">{language === 'en' ? 'Select an option' : '请选择'}</option>{options.map((option) => <option key={option.id} value={option.id}>{language === 'en' ? option.labelEn : option.label}</option>)}</select></Field>
}

function NumberInput({ darkMode, field, label, value, unit, min, max, step = 'any', onChange }: { darkMode: boolean; field: string; label: string; value: number | null | undefined; unit?: string; min?: number; max?: number; step?: number | 'any'; onChange: (value: number | null) => void }) {
  const input = `w-full rounded-lg border px-3 py-2 text-center text-sm tabular-nums outline-none focus:ring-2 focus:ring-blue-500/30 ${unit ? 'pr-14' : ''} ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`
  return <Field darkMode={darkMode} field={field} label={label}><div className="relative"><input aria-label={label} type="number" className={input} value={value ?? ''} min={min} max={max} step={step} onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))} />{unit ? <span className={`pointer-events-none absolute right-3 top-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{unit}</span> : null}</div></Field>
}

export default function MrmrClassificationPage({ darkMode, language, caseName, pointName, pointNote, pointOreType, pointOrdinal, pointTotal, value, onChange, onPointNameChange, onPointNoteChange, onPointOreTypeChange, onBackToWorkspace, onBackToPoints, onComplete, onCompleteAndNext }: MrmrClassificationPageProps) {
  const en = language === 'en'
  const state = useMemo(() => normalizeMrmrState(value), [value])
  const issues = useMemo(() => validateMrmrState(state), [state])
  const result = useMemo(() => {
    if (issues.length > 0) return null
    try { return calculateMrmr(state) } catch { return null }
  }, [issues, state])
  const [attempted, setAttempted] = useState(false)
  const patch = (partial: Partial<MrmrFormState>) => onChange({ ...state, ...partial })
  const patchApplicability = (partial: Partial<MrmrApplicability>) => patch({ applicability: { ...(state.applicability ?? normalizeMrmrState({}).applicability!), ...partial } })
  const input = `w-full rounded-lg border px-3 py-2 text-sm ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`
  const card = `rounded-lg border p-4 sm:p-5 ${darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white shadow-sm'}`
  const finish = (action: () => void) => { if (issues.length > 0) { setAttempted(true); document.querySelector<HTMLElement>(`[data-field="${issues[0].field}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return } setAttempted(false); action() }
  const check = (field: keyof MrmrApplicability, label: string) => <label className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-700'}`}><input type="checkbox" checked={Boolean(state.applicability?.[field])} onChange={(event) => patchApplicability({ [field]: event.target.checked })} />{label}</label>
  return (
    <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      <div className="grid w-full min-h-0 flex-1 grid-cols-1 gap-4 px-4 py-5 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,3fr)_minmax(220px,1fr)]">
        <main data-testid="calculation-input-pane" className="thin-scroll -mr-1 min-h-0 min-w-0 flex-1 overflow-y-auto space-y-4 pr-0.5">
          <header className="flex items-start gap-2"><BackIconButton label={en ? 'Back' : '返回'} onClick={onBackToPoints} darkMode={darkMode} className="mt-1" /><div className="min-w-0"><nav className={`flex flex-wrap items-center gap-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><button type="button" onClick={onBackToWorkspace} className="hover:text-blue-600">{en ? 'Project workspace' : '项目工作区'}</button><span>/</span><button type="button" onClick={onBackToPoints} className="hover:text-blue-600">{caseName}</button><span>/</span><span>{pointName}</span></nav><h1 className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'MRMR Mining Rock Mass Rating' : 'MRMR 采矿岩体分级'}</h1><p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{en ? 'Point' : '点位'} {pointOrdinal} / {pointTotal}</p></div></header>
          <section className={card}><h2 className={`mb-3 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Point information' : '点位信息'}</h2><div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"><label className="block space-y-1"><span className="text-sm font-medium">{en ? 'Point number' : '点位序号'}</span><input className={`${input} text-center`} value={pointOrdinal} readOnly /></label><label className="block space-y-1"><span className="text-sm font-medium">{en ? 'Point name' : '点位名称'}</span><input className={input} value={pointName} onChange={(event) => onPointNameChange(event.target.value)} /></label><label className="block space-y-1"><span className="text-sm font-medium">{en ? 'Ore / rock type' : '矿岩类型'}</span><input className={input} value={pointOreType} onChange={(event) => onPointOreTypeChange(event.target.value)} /></label><label className="block space-y-1"><span className="text-sm font-medium">{en ? 'Point note' : '点位说明'}</span><input className={input} value={pointNote} onChange={(event) => onPointNoteChange(event.target.value)} /></label></div></section>
          <section data-testid="mrmr-method-introduction" className={card}>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {en ? (
                <>
                  The MRMR (Mining Rock Mass Rating) method extends the in-situ rock mass rating <InlineMath math="\mathrm{IRMR}" /> for underground mining roadways and stopes.
                  It first converts intact rock strength and in-block size or fracture effects into a rock-block strength rating <InlineMath math="\mathrm{RBS}" />, then combines open-joint spacing <InlineMath math="\mathrm{JS}" /> and joint condition <InlineMath math="\mathrm{JC}" />.
                  Mining environment observations are reported as candidate corrections; the controlling engineering factor is selected for the final result rather than multiplying every correction mechanically.
                </>
              ) : (
                <>
                  MRMR（Mining Rock Mass Rating，采矿岩体分级）是在原位岩体质量 <InlineMath math="\mathrm{IRMR}" /> 基础上，面向地下采矿巷道和采场的工程评价方法。
                  页面先将完整岩石强度及块内尺寸或裂隙影响换算为块体强度评分 <InlineMath math="\mathrm{RBS}" />，再结合开放节理间距评分 <InlineMath math="\mathrm{JS}" /> 和结构面条件评分 <InlineMath math="\mathrm{JC}" />。
                  采矿环境资料作为候选修正值列出，最终根据工程条件选择控制修正因素，不将所有修正项机械连乘。
                </>
              )}
            </p>
            <div data-testid="mrmr-formula" className="mt-4">
              <p className={`mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{en ? 'Calculation formulas' : '计算公式'}</p>
              <FormulaFrame darkMode={darkMode}>
                <div className={`space-y-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  <BlockMath math={String.raw`\mathrm{RBS\ (MPa)}=\mathrm{IRS}\times\mathrm{size\ adjustment}\times\mathrm{in\mbox{-}block\ fracture/vein\ factor}`} />
                  <BlockMath math={String.raw`\mathrm{IRMR}=\mathrm{RBS\ rating}+\mathrm{JS}+\mathrm{JC}`} />
                  <BlockMath math={String.raw`\mathrm{MRMR}=\mathrm{IRMR}\times\mathrm{controlling\ adjustment\ factor}`} />
                </div>
              </FormulaFrame>
            </div>
          </section>
          {state.source ? <section data-testid="mrmr-rmr-source" className={`rounded-lg border px-4 py-3 ${darkMode ? 'border-amber-700/60 bg-amber-950/25' : 'border-amber-200 bg-amber-50'}`}><h2 className={`text-base font-semibold ${darkMode ? 'text-amber-200' : 'text-amber-900'}`}>{en ? 'Source data from RMR' : '来源于 RMR 的原始数据'}</h2><p className={`mt-1 text-sm ${darkMode ? 'text-amber-200/90' : 'text-amber-800'}`}>{en ? `Source point: ${state.source.caseName} · ${state.source.pointName}` : `来源点位：${state.source.caseName} · ${state.source.pointName}`}</p><p className={`mt-1 text-sm ${darkMode ? 'text-amber-200/90' : 'text-amber-800'}`}>{en ? 'Only measured UCS, spacing and raw water observations are carried over. MRMR-specific fields remain to be confirmed.' : '仅带入实测 UCS、节理间距和地下水原始观测；MRMR 专用字段仍需按对应表重新确认。'}</p>{state.source.waterReference ? <p className={`mt-1 text-sm ${darkMode ? 'text-amber-200/90' : 'text-amber-800'}`}>{en ? `RMR water reference: ${state.source.waterReference.criterion}${state.source.waterReference.value == null ? '' : ` = ${state.source.waterReference.value}`}` : `RMR 地下水参考：${state.source.waterReference.criterion}${state.source.waterReference.value == null ? '' : ` = ${state.source.waterReference.value}`}`}</p> : null}</section> : null}

          <RmrParamSection darkMode={darkMode} language={language} title={en ? '1. MRMR applicability' : '1. MRMR 适用性判断'} score={state.applicability?.scenarioId && issues.filter((issue) => issue.field === 'applicability').length === 0 ? 1 : null} description={en ? 'MRMR is calculated only for underground mining roadways or stopes in a jointed rock mass with traceable field or laboratory evidence.' : 'MRMR 仅用于地下采矿巷道或采场，且岩体应为节理发育岩体，关键资料必须有现场或试验依据。'}>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3"><Field darkMode={darkMode} field="scenarioId" label={en ? 'Engineering setting' : '工程场景'} wide><select aria-label={en ? 'Engineering setting' : '工程场景'} className={input} value={state.applicability?.scenarioId ?? ''} onChange={(event) => patchApplicability({ scenarioId: event.target.value as MrmrApplicability['scenarioId'] })}><option value="">{en ? 'Select an option' : '请选择'}</option><option value="underground_roadway">{en ? 'Underground mining roadway' : '地下采矿巷道'}</option><option value="underground_stope">{en ? 'Underground stope' : '地下采场'}</option><option value="other">{en ? 'Other setting' : '其他工程场景'}</option></select></Field><Field darkMode={darkMode} field="jointedRockMass" label={en ? 'Rock mass structure' : '岩体结构'} wide><select aria-label={en ? 'Rock mass structure' : '岩体结构'} className={input} value={state.applicability?.jointedRockMass == null ? '' : state.applicability.jointedRockMass ? 'yes' : 'no'} onChange={(event) => patchApplicability({ jointedRockMass: event.target.value === '' ? null : event.target.value === 'yes' })}><option value="">{en ? 'Select an option' : '请选择'}</option><option value="yes">{en ? 'Jointed rock mass' : '节理发育岩体'}</option><option value="no">{en ? 'Massive / not jointed' : '块状或非节理岩体'}</option></select></Field><div className="grid grid-cols-1 gap-2 md:col-span-3 md:grid-cols-2">{check('irsBasisConfirmed', en ? 'IRS is supported by a test or traceable field record.' : 'IRS 有试验或可追溯现场记录依据。')}{check('jointSpacingBasisConfirmed', en ? 'Joint spacing is supported by a structural mapping record.' : '节理间距有结构面调查记录依据。')}{check('jointConditionBasisConfirmed', en ? 'Joint condition represents the controlling structural zone.' : '结构面条件代表控制性结构分区。')}{check('groundwaterBasisConfirmed', en ? 'Groundwater data are available.' : '地下水资料具备。')}{check('miningEnvironmentBasisConfirmed', en ? 'Mining method, stress and excavation data are available.' : '采矿方式、应力和开挖资料具备。')}</div></div>
          </RmrParamSection>

          <RmrParamSection darkMode={darkMode} language={language} title={en ? '2. Intact rock strength IRS and size correction' : '2. 完整岩石强度 IRS、尺寸修正'} score={result?.rbsRating ?? null} description={en ? 'Enter the measured intact rock strength, then apply the size / in-block fracture correction before deriving RBS.' : '先输入完整岩石实测强度，再完成尺寸 / 块内裂隙修正，随后得到块体强度 RBS。'}>
            <NumberInput darkMode={darkMode} field="irsMpa" label={en ? 'Intact rock strength IRS' : '完整岩石强度 IRS'} value={state.irsMpa} unit="MPa" min={0} onChange={(irsMpa) => patch({ irsMpa })} />
            <NumberInput darkMode={darkMode} field="sizeAdjustmentPercent" label={en ? 'Size / fracture adjustment' : '尺寸 / 块内裂隙修正'} value={state.sizeAdjustmentPercent} unit="%" min={0} max={100} onChange={(sizeAdjustmentPercent) => patch({ sizeAdjustmentPercent })} />
            <Field darkMode={darkMode} field="fractureVeinMode" label={en ? 'Fractures or veins inside block' : '块内裂隙 / 脉体'} wide><div className="grid grid-cols-2 overflow-hidden rounded-lg border"><button type="button" className={`px-3 py-2 text-sm ${state.fractureVeinMode === 'none' ? 'bg-blue-600 text-white' : ''}`} onClick={() => patch({ fractureVeinMode: 'none' })}>{en ? 'None' : '无'}</button><button type="button" className={`border-l px-3 py-2 text-sm ${state.fractureVeinMode === 'measured' ? 'bg-blue-600 text-white' : ''}`} onClick={() => patch({ fractureVeinMode: 'measured' })}>{en ? 'Measured' : '有，按曲线修正'}</button></div></Field>
            {state.fractureVeinMode === 'measured' ? <><NumberInput darkMode={darkMode} field="mohsHardness" label={en ? 'Mohs hardness' : '莫氏硬度'} value={state.mohsHardness} min={1} max={5} step={1} onChange={(mohsHardness) => patch({ mohsHardness })} /><NumberInput darkMode={darkMode} field="fractureVeinFrequencyPerM" label={en ? 'Fracture / vein frequency' : '裂隙 / 脉体频率'} value={state.fractureVeinFrequencyPerM} unit="/m" min={0} onChange={(fractureVeinFrequencyPerM) => patch({ fractureVeinFrequencyPerM })} /></> : null}
            <div className={`md:col-span-2 rounded-lg border px-3 py-2 text-sm ${darkMode ? 'border-gray-600 bg-gray-900/40 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>{en ? 'RBS MPa and the 0-25 RBS rating are calculated after this section is complete.' : '本段完成后计算 RBS（MPa）和 0～25 的 RBS 评分。'}</div>
          </RmrParamSection>

          <RmrParamSection darkMode={darkMode} language={language} title={en ? '3. Open-joint spacing JS' : '3. 开放节理间距 JS'} score={result?.jointSpacingRating ?? null} description={en ? 'Use the mean spacing of the controlling open-joint set and select the number of open-joint sets.' : '输入控制性开放节理组的平均间距，并选择开放节理组数。'}>
            <NumberInput darkMode={darkMode} field="jointSpacingM" label={en ? 'Mean open-joint spacing' : '开放节理平均间距'} value={state.jointSpacingM} unit="m" min={0.1} max={5} step={0.01} onChange={(jointSpacingM) => patch({ jointSpacingM })} />
            <Select darkMode={darkMode} field="jointSetCount" value={state.jointSetCount} options={MRMR_JOINT_SET_OPTIONS} language={language} onChange={(jointSetCount) => patch({ jointSetCount: jointSetCount as MrmrFormState['jointSetCount'] })} />
          </RmrParamSection>

          <RmrParamSection darkMode={darkMode} language={language} title={en ? '4. Joint condition JC' : '4. 结构面条件 JC'} score={result?.jointConditionRating ?? null} description={en ? 'Select the representative controlling joint condition from Table 57.1.' : '按表 57.1 选择代表控制性结构面的条件。'}>
            <Select darkMode={darkMode} field="jointConditionId" value={state.jointConditionId} options={MRMR_JOINT_OPTIONS.map((item) => ({ ...item, label: `${item.label}（${item.value}/40）`, labelEn: `${item.labelEn} (${item.value}/40)` }))} language={language} onChange={(jointConditionId) => patch({ jointConditionId })} wide />
            <details className="md:col-span-2"><summary className="cursor-pointer text-sm font-medium text-blue-700 dark:text-blue-300">{en ? 'Open reference table' : '查看评分参考表'}</summary><p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{en ? 'The selected condition contributes 0-40 JC points.' : '所选结构面条件贡献 0～40 的 JC 分值。'}</p></details>
          </RmrParamSection>

          <RmrParamSection darkMode={darkMode} language={language} title={en ? '5. In-situ rock mass rating IRMR' : '5. 原位岩体质量 IRMR'} score={result?.irmr ?? null} description={en ? 'IRMR = RBS rating + JS rating + JC rating.' : 'IRMR = RBS 评分 + JS 评分 + JC 评分。'}><div className={`md:col-span-2 rounded-lg border px-3 py-3 text-sm ${darkMode ? 'border-blue-500/40 bg-blue-950/30 text-blue-100' : 'border-blue-200 bg-blue-50 text-blue-900'}`}>{result ? `${result.rbsRating.toFixed(1)} + ${result.jointSpacingRating.toFixed(1)} + ${result.jointConditionRating.toFixed(1)} = ${result.irmr.toFixed(1)}` : (en ? 'Complete the preceding three sections to show IRMR.' : '完成前面三段后显示 IRMR。')}</div></RmrParamSection>

          <RmrParamSection darkMode={darkMode} language={language} title={en ? '6. Mining-environment adjustments' : '6. 采矿环境修正'} score={result ? result.controllingAdjustment.factor : null} description={en ? 'Select each candidate adjustment. The result displays all candidates and adopts one controlling factor; factors are not mechanically multiplied.' : '分别选择各项候选修正。结果区展示全部候选值并采用一个控制因素，不机械连乘。'}>
            <Select darkMode={darkMode} field="weatheringConditionId" value={state.weatheringConditionId} options={MRMR_WEATHERING_CONDITIONS} language={language} onChange={(weatheringConditionId) => patch({ weatheringConditionId })} />
            <Select darkMode={darkMode} field="weatheringExposureId" value={state.weatheringExposureId} options={MRMR_WEATHERING_EXPOSURES} language={language} onChange={(weatheringExposureId) => patch({ weatheringExposureId: weatheringExposureId as MrmrFormState['weatheringExposureId'] })} />
            <Select darkMode={darkMode} field="miningMethodId" value={state.miningMethodId} options={MRMR_MINING_METHOD_OPTIONS} language={language} onChange={(miningMethodId) => patch({ miningMethodId })} wide />
            <Select darkMode={darkMode} field="stressId" value={state.stressId} options={MRMR_STRESS_OPTIONS.map((item) => ({ ...item, label: `${item.label}（${item.value * 100}%）`, labelEn: `${item.labelEn} (${item.value * 100}%)` }))} language={language} onChange={(stressId) => patch({ stressId })} wide />
            <Select darkMode={darkMode} field="blastingId" value={state.blastingId} options={MRMR_BLASTING_OPTIONS.map((item) => ({ ...item, label: `${item.label}（${item.value * 100}%）`, labelEn: `${item.labelEn} (${item.value * 100}%)` }))} language={language} onChange={(blastingId) => patch({ blastingId })} />
            <Select darkMode={darkMode} field="waterId" value={state.waterId} options={MRMR_WATER_OPTIONS.map((item) => ({ id: item.id, label: `${item.label}（${item.minPercent}%～${item.maxPercent}%）`, labelEn: `${item.labelEn} (${item.minPercent}-${item.maxPercent}%)` }))} language={language} onChange={(waterId) => patch({ waterId, waterFactorPercent: MRMR_WATER_OPTIONS.find((item) => item.id === waterId)?.minPercent === MRMR_WATER_OPTIONS.find((item) => item.id === waterId)?.maxPercent ? MRMR_WATER_OPTIONS.find((item) => item.id === waterId)?.minPercent ?? null : null })} />
            <NumberInput darkMode={darkMode} field="waterFactorPercent" label={en ? 'Adopted water factor' : '采用的水修正值'} value={state.waterFactorPercent} unit="%" min={state.waterId ? MRMR_WATER_OPTIONS.find((item) => item.id === state.waterId)?.minPercent : 0} max={state.waterId ? MRMR_WATER_OPTIONS.find((item) => item.id === state.waterId)?.maxPercent : 100} step={1} onChange={(waterFactorPercent) => patch({ waterFactorPercent })} />
          </RmrParamSection>

          <footer className={card}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">{attempted && issues.length > 0 ? <p className="text-sm text-red-600 dark:text-red-300 sm:mr-auto">{en ? issues[0].messageEn : issues[0].message}</p> : <p className={`text-sm sm:mr-auto ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{issues.length > 0 ? (en ? 'Draft is saved automatically.' : '草稿已自动保存，可稍后补充。') : (en ? 'All required parameters are complete.' : '必填参数已完整。')}</p>}<div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={onBackToPoints} className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>{en ? 'Previous' : '上一步'}</button><button type="button" onClick={() => finish(onComplete)} className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">{en ? 'Complete' : '完成'}</button><button type="button" onClick={() => finish(onCompleteAndNext)} className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>{en ? 'Next point' : '下一个'}</button></div></div></footer><div className="pb-24" />
        </main>
        <aside data-testid="calculation-result-pane" className="hidden min-w-0 xl:block"><MrmrScorePreview darkMode={darkMode} language={language} result={result} issueCount={issues.length} /></aside>
      </div>
    </div>
  )
}
