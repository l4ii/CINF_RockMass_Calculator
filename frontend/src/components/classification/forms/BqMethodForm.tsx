import { useMemo, useState } from 'react'
import type { MethodFormProps } from '../ClassificationModule'
import {
  BQ_FOUNDATION_F0_GRADES,
  BQ_SLOPE_F1_OPTIONS,
  BQ_SLOPE_F2_OPTIONS,
  BQ_SLOPE_F3_OPTIONS,
  BQ_SLOPE_LAMBDA_OPTIONS,
  BQ_SLOPE_WATER_OPTIONS,
  BQ_UNDERGROUND_ORIENTATION_OPTIONS,
  BQ_UNDERGROUND_STRESS_OPTIONS,
  BQ_UNDERGROUND_WATER_OPTIONS,
  normalizeBqState,
  type BqFormState,
  foundationGradeFromF0,
} from '../../../methods/bq'
import { MethodSection, NumberField, SegmentedField, SelectField, type LocalOption } from '../MethodFormControls'

function localOptions(options: readonly { id: string; label: { zh: string; en: string } }[]): LocalOption[] {
  return options.map((option) => ({ id: option.id, label: option.label.zh, labelEn: option.label.en }))
}

export default function BqMethodForm({ form, onChange, darkMode, language }: MethodFormProps) {
  const state = normalizeBqState(form)
  const patch = (value: Partial<BqFormState>) => onChange({ ...state, ...value } as unknown as Record<string, unknown>)
  const en = language === 'en'
  const [pointLoad, setPointLoad] = useState<number | null>(null)
  const [vpm, setVpm] = useState<number | null>(null)
  const [vpr, setVpr] = useState<number | null>(null)
  const [jv, setJv] = useState<number | null>(null)

  const helperInput = `w-full rounded-lg border px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-blue-500/30 ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`
  const helperMuted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const rcEstimate = pointLoad != null && pointLoad >= 0 ? 22.82 * Math.pow(pointLoad, 0.75) : null
  const kvVelocityEstimate = vpm != null && vpr != null && vpr > 0 ? Math.pow(vpm / vpr, 2) : null
  const kvJvEstimate = useMemo(() => {
    if (jv == null || jv < 0) return null
    if (jv < 3) return { min: 0.75, max: 1, value: 0.875, label: '> 0.75' }
    if (jv < 10) return { min: 0.55, max: 0.75, value: 0.65, label: '0.55–0.75' }
    if (jv < 20) return { min: 0.35, max: 0.55, value: 0.45, label: '0.35–0.55' }
    if (jv < 35) return { min: 0.15, max: 0.35, value: 0.25, label: '0.15–0.35' }
    return { min: 0, max: 0.15, value: 0.075, label: '≤ 0.15' }
  }, [jv])

  return (
    <>
      <MethodSection
        darkMode={darkMode}
        title={en ? 'Calculation mode' : '计算口径'}
        description={en ? 'Calculate basic BQ first, then optionally enter the correction workflow.' : '先计算基本 BQ；如需考虑工程条件，再进入修正 BQ。'}
        source="GB/T 50218-2014"
      >
        <SegmentedField field="mode" label={en ? 'Calculation stage' : '计算阶段'} value={state.mode === 'basic' ? 'basic' : 'underground'} options={[{ id: 'basic', label: '基本 BQ', labelEn: 'Basic BQ' }, { id: 'underground', label: '修正 BQ', labelEn: 'Corrected BQ' }]} darkMode={darkMode} language={language} onChange={(mode) => patch({ mode: mode as BqFormState['mode'] })} />
        {state.mode !== 'basic' ? (
          <div data-field="correctionScenario" className="md:col-span-2">
            <label htmlFor="bq-correction-scenario" className={`mb-1 block text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{en ? 'Correction scenario' : '修正工程类型'}</label>
            <select id="bq-correction-scenario" value={state.mode} onChange={(event) => { const mode = event.target.value as BqFormState['mode']; if (mode === 'underground' || mode === 'foundation' || mode === 'slope') patch({ mode }) }} className={helperInput}>
              <option value="underground">{en ? 'Underground engineering rock mass' : '地下工程岩体'}</option>
              <option value="slope">{en ? 'Slope engineering rock mass' : '边坡工程岩体'}</option>
              <option value="foundation">{en ? 'Foundation engineering rock mass' : '地基工程岩体'}</option>
            </select>
            {state.mode === 'foundation' ? <SelectField field="foundationGradeId" label={en ? 'Foundation rock-mass class' : '地基工程岩体级别'} value={state.foundationGradeId} options={localOptions(BQ_FOUNDATION_F0_GRADES)} darkMode={darkMode} language={language} onChange={(foundationGradeId) => patch({ foundationGradeId: (foundationGradeId || null) as BqFormState['foundationGradeId'], foundationF0: null })} /> : null}
            {state.mode === 'foundation' ? <NumberField field="foundationF0" label={en ? 'Basic bedrock bearing capacity f0' : '岩体基岩承载力基本值 f₀'} value={state.foundationF0} unit="MPa" min={0} darkMode={darkMode} onChange={(foundationF0) => patch({ foundationF0, foundationGradeId: foundationF0 == null ? state.foundationGradeId : foundationGradeFromF0(foundationF0).id })} /> : null}
          </div>
        ) : null}
      </MethodSection>

      <MethodSection
        darkMode={darkMode}
        title={en ? 'Basic rock mass quality' : '岩体基本质量'}
        description={en ? 'GB/T 50218-2014 uses rock strength Rc and integrity index Kv to describe basic rock-mass quality. The two code limitations are applied automatically.' : '《工程岩体分级标准》（2014）用 Rc 和 Kv 反映岩体基本属性；计算前自动执行两条规范限定，并在结果区显示是否触发。'}
        source="4.2.2"
      >
        <NumberField field="rc" label={en ? 'Saturated UCS Rc' : '岩石饱和单轴抗压强度 Rc'} value={state.rc} unit="MPa" min={0} darkMode={darkMode} onChange={(rc) => patch({ rc })} />
        <NumberField field="kv" label={en ? 'Integrity index Kv' : '岩体完整性指数 Kv'} value={state.kv} min={0} max={1} step={0.01} darkMode={darkMode} onChange={(kv) => patch({ kv })} />
      </MethodSection>

      <MethodSection darkMode={darkMode} title={en ? 'Auxiliary measurements' : '辅助计算与参数说明'} description={en ? 'Use these helpers when a direct test value is unavailable. Apply the estimate explicitly.' : '没有直接实测值时可使用辅助计算；估算结果需要手动点击“应用到输入值”。'} source="GB/T 50218-2014">
        <div className={`md:col-span-2 rounded-lg border p-3 ${darkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Rc · {en ? 'point-load estimate' : '点荷载指数换算'}</h3><code className={`text-xs ${helperMuted}`}>Rc = 22.82 × Is(50)^0.75</code></div>
          <p className={`mt-1 text-xs leading-relaxed ${helperMuted}`}>{en ? 'Is(50) is the point-load strength index corrected to a 50 mm equivalent diameter, in MPa. The exponent 0.75 is empirical.' : 'Is(50) 是换算到 50 mm 等效直径的点荷载强度指数（MPa）；0.75 为经验指数，用于将点荷载试验结果估算为饱和单轴抗压强度。'}</p>
          <div className="mt-3 flex flex-wrap items-end gap-2"><label className="min-w-[180px] flex-1"><span className={`mb-1 block text-xs ${helperMuted}`}>Is(50) · MPa</span><input type="number" min="0" step="any" value={pointLoad ?? ''} onChange={(e) => setPointLoad(e.target.value === '' ? null : Number(e.target.value))} className={helperInput} /></label><output className={`pb-2 text-sm font-semibold ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{rcEstimate == null ? '—' : `Rc ≈ ${rcEstimate.toFixed(1)} MPa`}</output><button type="button" disabled={rcEstimate == null} onClick={() => rcEstimate != null && patch({ rc: Number(rcEstimate.toFixed(2)) })} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">{en ? 'Apply to Rc' : '应用到 Rc'}</button></div>
        </div>
        <div className={`md:col-span-2 rounded-lg border p-3 ${darkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Kv · {en ? 'wave-velocity method' : '波速法'}</h3><code className={`text-xs ${helperMuted}`}>Kv = (vpm / vpr)^2</code></div>
          <p className={`mt-1 text-xs leading-relaxed ${helperMuted}`}>{en ? 'vpm is the longitudinal-wave velocity of the rock mass and vpr is that of an intact rock core, both in km/s.' : 'vpm 为岩体弹性纵波速度，vpr 为完整岩石岩芯纵波速度，单位均为 km/s；两者比值平方反映岩体完整程度。'}</p>
          <div className="mt-3 flex flex-wrap items-end gap-2"><label className="min-w-[130px] flex-1"><span className={`mb-1 block text-xs ${helperMuted}`}>vpm · km/s</span><input type="number" min="0" step="any" value={vpm ?? ''} onChange={(e) => setVpm(e.target.value === '' ? null : Number(e.target.value))} className={helperInput} /></label><label className="min-w-[130px] flex-1"><span className={`mb-1 block text-xs ${helperMuted}`}>vpr · km/s</span><input type="number" min="0" step="any" value={vpr ?? ''} onChange={(e) => setVpr(e.target.value === '' ? null : Number(e.target.value))} className={helperInput} /></label><output className={`pb-2 text-sm font-semibold ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{kvVelocityEstimate == null ? '—' : `Kv ≈ ${kvVelocityEstimate.toFixed(3)}`}</output><button type="button" disabled={kvVelocityEstimate == null || kvVelocityEstimate < 0 || kvVelocityEstimate > 1} onClick={() => kvVelocityEstimate != null && patch({ kv: Number(kvVelocityEstimate.toFixed(4)) })} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">{en ? 'Apply to Kv' : '应用到 Kv'}</button></div>
        </div>
        <div className={`md:col-span-2 rounded-lg border p-3 ${darkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Kv · {en ? 'joint-volume estimate' : 'Jv 对照估算'}</h3><span className={`text-xs ${helperMuted}`}>Jv · 条/m³</span></div>
          <p className={`mt-1 text-xs ${helperMuted}`}>{en ? 'Enter the volumetric joint count Jv. The button applies the midpoint of the corresponding standard range.' : '输入岩体体积节理数 Jv；表格给出 Kv 区间，应用按钮采用区间中值，最终工程取值应结合试验判断。'}</p>
          <div className="mt-3 overflow-x-auto"><table className={`w-full min-w-[420px] border-collapse text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}><thead><tr className={darkMode ? 'bg-gray-800' : 'bg-gray-100'}><th className="border px-2 py-2 text-left">Jv（条/m³）</th><th className="border px-2 py-2 text-left">Kv</th></tr></thead><tbody>{[['< 3','> 0.75'],['3–10','0.55–0.75'],['10–20','0.35–0.55'],['20–35','0.15–0.35'],['≥ 35','≤ 0.15']].map(([a,b]) => <tr key={a}><td className="border px-2 py-1.5">{a}</td><td className="border px-2 py-1.5">{b}</td></tr>)}</tbody></table></div>
          <div className="mt-3 flex flex-wrap items-end gap-2"><label className="min-w-[180px] flex-1"><span className={`mb-1 block text-xs ${helperMuted}`}>Jv · 条/m³</span><input type="number" min="0" step="any" value={jv ?? ''} onChange={(e) => setJv(e.target.value === '' ? null : Number(e.target.value))} className={helperInput} /></label><output className={`pb-2 text-sm font-semibold ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{kvJvEstimate == null ? '—' : `Kv ${kvJvEstimate.label}`}</output><button type="button" disabled={kvJvEstimate == null} onClick={() => kvJvEstimate && patch({ kv: kvJvEstimate.value })} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">{en ? 'Apply midpoint' : '应用区间中值'}</button></div>
        </div>
      </MethodSection>

      {state.mode === 'underground' ? (
        <MethodSection
          darkMode={darkMode}
          title={en ? 'Underground engineering corrections' : '地下工程修正'}
          description={en ? 'Select K1, K2 and K3 from the code tables. A typed value must stay inside the selected range.' : '按原表选择 K1、K2、K3；区间内工程取值须落在所选档位范围内。'}
          source="5.2.2"
        >
          <SelectField field="undergroundWaterId" label={en ? 'K1 · Groundwater influence' : 'K1 · 地下水影响'} value={state.undergroundWaterId} options={localOptions(BQ_UNDERGROUND_WATER_OPTIONS)} darkMode={darkMode} language={language} onChange={(undergroundWaterId) => patch({ undergroundWaterId, k1Value: null })} />
          <NumberField field="k1Value" label={en ? 'K1 · Adopted value within range' : 'K1 · 区间内采用值'} value={state.k1Value} min={0} max={1} step={0.01} darkMode={darkMode} onChange={(k1Value) => patch({ k1Value })} />
          <SelectField field="undergroundOrientationId" label={en ? 'K2 · Major discontinuity orientation' : 'K2 · 主要结构面产状'} value={state.undergroundOrientationId} options={localOptions(BQ_UNDERGROUND_ORIENTATION_OPTIONS)} darkMode={darkMode} language={language} onChange={(undergroundOrientationId) => patch({ undergroundOrientationId, k2Value: null })} />
          <NumberField field="k2Value" label={en ? 'K2 · Adopted value within range' : 'K2 · 区间内采用值'} value={state.k2Value} min={0} max={1} step={0.01} darkMode={darkMode} onChange={(k2Value) => patch({ k2Value })} />
          <SelectField field="undergroundStressId" label={en ? 'K3 · Initial stress condition' : 'K3 · 初始应力状态'} value={state.undergroundStressId} options={localOptions(BQ_UNDERGROUND_STRESS_OPTIONS)} darkMode={darkMode} language={language} onChange={(undergroundStressId) => patch({ undergroundStressId, k3Value: null })} />
          <NumberField field="k3Value" label={en ? 'K3 · Adopted value within range' : 'K3 · 区间内采用值'} value={state.k3Value} min={0} max={1} step={0.01} darkMode={darkMode} onChange={(k3Value) => patch({ k3Value })} />
        </MethodSection>
      ) : null}

      {state.mode === 'slope' ? (
        <MethodSection
          darkMode={darkMode}
          title={en ? 'Slope engineering corrections' : '边坡工程修正'}
          description={en ? 'Select λ and K4 from the code tables; K5 is computed from F1, F2 and F3. A typed value must stay inside the selected range.' : '按原表选择 λ、K4；K5 由 F1、F2、F3 连乘得到。区间内工程取值须落在所选档位范围内。'}
          source="5.3.2"
        >
          <SelectField field="slopeStructureTypeId" label={en ? 'λ · Main discontinuity type and persistence' : 'λ · 主要结构面类型及其延伸性'} value={state.slopeStructureTypeId} options={localOptions(BQ_SLOPE_LAMBDA_OPTIONS)} darkMode={darkMode} language={language} onChange={(slopeStructureTypeId) => patch({ slopeStructureTypeId, lambdaValue: null, ...(slopeStructureTypeId === 'none' ? { slopeF1Id: null, slopeF2Id: null, slopeF3Id: null } : {}) })} />
          <NumberField field="lambdaValue" label={en ? 'λ · Adopted value within range' : 'λ · 区间内采用值'} value={state.lambdaValue} min={0} max={1} step={0.01} darkMode={darkMode} onChange={(lambdaValue) => patch({ lambdaValue })} />
          <SelectField field="slopeWaterId" label={en ? 'K4 · Groundwater influence' : 'K4 · 地下水影响'} value={state.slopeWaterId} options={localOptions(BQ_SLOPE_WATER_OPTIONS)} darkMode={darkMode} language={language} onChange={(slopeWaterId) => patch({ slopeWaterId, k4Value: null })} />
          <NumberField field="k4Value" label={en ? 'K4 · Adopted value within range' : 'K4 · 区间内采用值'} value={state.k4Value} min={0} max={1} step={0.01} darkMode={darkMode} onChange={(k4Value) => patch({ k4Value })} />
          <NumberField field="slopeWaterHeadPw" label={en ? 'pw · Slope water head' : 'pw · 边坡地下水水头'} value={state.slopeWaterHeadPw} unit="m" min={0} darkMode={darkMode} onChange={(slopeWaterHeadPw) => patch({ slopeWaterHeadPw })} />
          <NumberField field="slopeHeightH" label={en ? 'H · Slope height' : 'H · 边坡高度'} value={state.slopeHeightH} unit="m" min={0} darkMode={darkMode} onChange={(slopeHeightH) => patch({ slopeHeightH })} />
          <SelectField field="slopeF1Id" label={en ? 'F1 · Dip-direction relationship' : 'F1 · 结构面倾向与坡面倾向夹角'} value={state.slopeF1Id} options={localOptions(BQ_SLOPE_F1_OPTIONS)} darkMode={darkMode} language={language} onChange={(slopeF1Id) => patch({ slopeF1Id: slopeF1Id || null })} />
          <SelectField field="slopeF2Id" label={en ? 'F2 · Discontinuity dip' : 'F2 · 结构面倾角'} value={state.slopeF2Id} options={localOptions(BQ_SLOPE_F2_OPTIONS)} darkMode={darkMode} language={language} onChange={(slopeF2Id) => patch({ slopeF2Id: slopeF2Id || null })} />
          <SelectField field="slopeF3Id" label={en ? 'F3 · Dip minus slope dip' : 'F3 · 结构面倾角与边坡坡角之差'} value={state.slopeF3Id} options={localOptions(BQ_SLOPE_F3_OPTIONS)} darkMode={darkMode} language={language} onChange={(slopeF3Id) => patch({ slopeF3Id: slopeF3Id || null })} />
        </MethodSection>
      ) : null}

    </>
  )
}
