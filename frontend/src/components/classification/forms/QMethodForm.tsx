import type { MethodFormProps } from '../ClassificationModule'
import {
  Q_ESR_OPTIONS,
  Q_JA_OPTIONS,
  Q_JN_OPTIONS,
  Q_JR_OPTIONS,
  Q_JW_OPTIONS,
  Q_SRF_OPTIONS,
  normalizeQState,
  type QFactorOption,
  type QFormState,
} from '../../../methods/q'
import { MethodSection, NumberField, SelectField, type LocalOption } from '../MethodFormControls'

function factorOptions(options: readonly QFactorOption[]): LocalOption[] {
  return options.map((option) => ({
    id: option.id,
    label: `${option.group.zh} · ${option.label.zh}`,
    labelEn: `${option.group.en} · ${option.label.en}`,
  }))
}

function selectedRange(id: string, options: readonly { id: string; range: { min: number; max: number } }[]) {
  return options.find((item) => item.id === id)?.range
}

export default function QMethodForm({ form, onChange, darkMode, language }: MethodFormProps) {
  const state = normalizeQState(form)
  const patch = (value: Partial<QFormState>) => onChange({ ...state, ...value } as unknown as Record<string, unknown>)
  const en = language === 'en'
  const optionalRangeField = (
    field: keyof QFormState,
    label: string,
    id: string,
    options: readonly { id: string; range: { min: number; max: number } }[]
  ) => {
    const selected = selectedRange(id, options)
    if (!selected || selected.min === selected.max) return null
    return (
      <NumberField
        field={String(field)}
        label={label}
        value={state[field] as number | null}
        min={selected.min}
        max={selected.max}
        step={0.01}
        hint={`${selected.min}–${selected.max}，${en ? 'optional' : '可留空'}`}
        darkMode={darkMode}
        onChange={(value) => patch({ [field]: value } as Partial<QFormState>)}
      />
    )
  }

  return (
    <>
      <MethodSection darkMode={darkMode} title={en ? 'Rock quality and block size' : '岩体完整性与块体尺寸'} description={en ? 'RQD below 10% is calculated with the nominal minimum of 10%.' : 'RQD 小于 10% 时按名义下限 10% 计算，并保留实测值。'} source="RQD / Jn">
      <NumberField field="rqd" label={en ? 'Rock quality designation RQD' : '岩石质量指标 RQD'} value={state.rqd} unit="%" min={0} max={100} step={1} darkMode={darkMode} onChange={(rqd) => patch({ rqd })} />
      <SelectField field="jnId" label={en ? 'Jn · Joint-set number' : 'Jn · 节理组数'} value={state.jnId} options={factorOptions(Q_JN_OPTIONS)} darkMode={darkMode} language={language} onChange={(jnId) => patch({ jnId, jnValue: null })} />
      {optionalRangeField('jnValue', en ? 'Jn · Adopted value within range' : 'Jn · 区间内采用值', state.jnId, Q_JN_OPTIONS)}
      </MethodSection>

      <MethodSection darkMode={darkMode} title={en ? 'Controlling discontinuity' : '控制性结构面'} description={en ? 'Jr and Ja must describe the same controlling, least-favourable discontinuity.' : 'Jr 与 Ja 必须针对同一条控制性、最不利结构面选取。'} source="Jr / Ja">
      <SelectField field="jrId" label={en ? 'Jr · Joint roughness' : 'Jr · 节理粗糙度'} value={state.jrId} options={factorOptions(Q_JR_OPTIONS)} darkMode={darkMode} language={language} onChange={(jrId) => patch({ jrId, jrValue: null })} wide />
      {optionalRangeField('jrValue', en ? 'Jr · Adopted value within range' : 'Jr · 区间内采用值', state.jrId, Q_JR_OPTIONS)}
      <SelectField field="jaId" label={en ? 'Ja · Joint alteration and filling' : 'Ja · 节理蚀变与充填'} value={state.jaId} options={factorOptions(Q_JA_OPTIONS)} darkMode={darkMode} language={language} onChange={(jaId) => patch({ jaId, jaValue: null })} wide />
      {optionalRangeField('jaValue', en ? 'Ja · Adopted value within range' : 'Ja · 区间内采用值', state.jaId, Q_JA_OPTIONS)}
      </MethodSection>

      <MethodSection darkMode={darkMode} title={en ? 'Water and stress' : '地下水与应力条件'} description={en ? 'SRF covers weakness zones, competent-rock stress, squeezing and swelling branches.' : 'SRF 表覆盖软弱带、完整岩体应力、挤压和膨胀四类条件。'} source="Jw / SRF">
      <SelectField field="jwId" label={en ? 'Jw · Joint-water reduction' : 'Jw · 节理水折减'} value={state.jwId} options={factorOptions(Q_JW_OPTIONS)} darkMode={darkMode} language={language} onChange={(jwId) => patch({ jwId, jwValue: null })} wide />
      {optionalRangeField('jwValue', en ? 'Jw · Adopted value within range' : 'Jw · 区间内采用值', state.jwId, Q_JW_OPTIONS)}
      <SelectField field="srfId" label={en ? 'SRF · Stress reduction factor' : 'SRF · 应力折减'} value={state.srfId} options={factorOptions(Q_SRF_OPTIONS)} darkMode={darkMode} language={language} onChange={(srfId) => patch({ srfId, srfValue: null })} wide />
      {optionalRangeField('srfValue', en ? 'SRF · Adopted value within range' : 'SRF · 区间内采用值', state.srfId, Q_SRF_OPTIONS)}
      </MethodSection>

      <MethodSection darkMode={darkMode} title={en ? 'Equivalent dimension and support' : '当量尺寸与支护需求判定'} description={en ? 'Screening against the empirical unsupported limit De = 2Q^0.4; verify against project conditions.' : '将当量尺寸与经验无支护极限 De＝2Q^0.4 比较，判定支护需求。'} source="De = span / ESR">
      <NumberField field="span" label={en ? 'Excavation span, diameter, or height' : '开挖跨度、直径或高度'} value={state.span} unit="m" min={0.01} step={0.1} darkMode={darkMode} onChange={(span) => patch({ span })} />
      <SelectField field="esrId" label={en ? 'ESR · Excavation support ratio' : 'ESR · 开挖支护比'} value={state.esrId} options={Q_ESR_OPTIONS.map((option) => ({ id: option.id, label: option.label.zh, labelEn: option.label.en }))} darkMode={darkMode} language={language} onChange={(esrId) => patch({ esrId, esrValue: null })} />
      {optionalRangeField('esrValue', en ? 'ESR · Adopted value within range' : 'ESR · 区间内采用值', state.esrId, Q_ESR_OPTIONS)}
      </MethodSection>
    </>
  )
}
