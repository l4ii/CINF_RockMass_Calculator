import type { KeyboardEvent, WheelEvent } from 'react'
import type { MethodFormProps } from '../ClassificationModule'
// @ts-ignore - react-katex types
import { BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import { FormulaFrame } from '../../calculationUiPrimitives'
import { RQD_CLASSES, normalizeRqdState, type RqdFormState } from '../../../methods/rqd'
import { MethodSection, NumberField } from '../MethodFormControls'

function preventNumberWheel(event: WheelEvent<HTMLInputElement>) {
  event.currentTarget.blur()
}

function preventNumberArrow(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') event.preventDefault()
}

export default function RqdMethodForm({ form, onChange, darkMode, language }: MethodFormProps) {
  const state = normalizeRqdState(form)
  const en = language === 'en'
  const patch = (value: Partial<RqdFormState>) => onChange({ ...state, ...value } as unknown as Record<string, unknown>)
  const rqd = state.coreRunLength != null && state.coreRunLength > 0 && state.soundCoreLength != null && state.soundCoreLength >= 0 && state.soundCoreLength <= state.coreRunLength
    ? Number(((state.soundCoreLength / state.coreRunLength) * 100).toFixed(2))
    : null
  const grade = rqd == null ? null : RQD_CLASSES.find((entry) => rqd >= entry.min && (entry.includeMax ? rqd <= entry.max : rqd < entry.max)) ?? null
  const resultTone = rqd == null
    ? (darkMode ? 'border-gray-600 bg-gray-900/35 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700')
    : (darkMode ? 'border-blue-500/40 bg-blue-950/40 text-blue-100' : 'border-blue-200 bg-blue-50 text-blue-900')

  return (
    <>
      <MethodSection
        darkMode={darkMode}
        prominent
        title={en ? 'Rock Quality Designation (RQD)' : 'RQD 基本原理与计算'}
        description={en ? 'Core-recovery index for describing the degree of rock-mass fracturing.' : '以钻孔取芯资料定量表征岩体完整程度的指标。'}
      >
        <div className="md:col-span-2">
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {en
              ? 'RQD (Rock Quality Designation) is determined from each individual core run. It is the percentage of the cumulative length of intact core pieces not shorter than 0.10 m relative to the total drilled length of that core run. Core pieces are measured along the centre line of the core and should be recorded using a consistent length unit.'
              : '岩石质量指标（RQD）用于依据钻孔岩芯资料评价岩体的完整程度与破碎程度。应按同一岩芯回次分别统计：将单根长度不小于 10 cm 的完整岩芯试样，按岩芯轴线量测后累计，其累计长度与该回次钻孔总长的百分比即为 RQD。两项长度必须采用同一计量单位。'}
          </p>
          <div className={`mt-4 mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{en ? 'General equation' : '计算公式'}</div>
          <div data-testid="rqd-formula">
            <FormulaFrame darkMode={darkMode} compact>
              <BlockMath math={en
                ? String.raw`\mathrm{RQD\ index}(\%)=100\times\frac{\sum(\text{length of core pieces}\ge0.10\,\mathrm{m})}{\text{total length of core run}}`
                : String.raw`\mathrm{RQD}=\frac{\text{长度}\ge10\,\mathrm{cm}\text{的岩芯累计长度}}{\text{钻孔总长}}\times100\%`} />
            </FormulaFrame>
          </div>
        </div>
      </MethodSection>

      <MethodSection
        darkMode={darkMode}
        prominent
        title={en ? 'Core-run measurements' : '岩芯回次统计'}
        description={en ? 'Enter measurements for one core run. The qualifying length must not exceed the total drilled length.' : '按单一岩芯回次录入。累计合格岩芯长度不得大于该回次的钻孔总长；本页以 m 为统一录入单位。'}
      >
        <NumberField
          field="soundCoreLength"
          label={en ? 'Cumulative length of core pieces at least 0.10 m' : '长度 ≥ 10 cm 的岩芯累计长度'}
          labelClassName="text-sm"
          value={state.soundCoreLength}
          unit="m"
          min={0}
          step={0.01}
          inputClassName="rqd-number-input"
          onWheel={preventNumberWheel}
          onKeyDown={preventNumberArrow}
          darkMode={darkMode}
          onChange={(soundCoreLength) => patch({ soundCoreLength })}
        />
        <NumberField
          field="coreRunLength"
          label={en ? 'Total drilled length of the core run' : '钻孔总长'}
          labelClassName="text-sm"
          value={state.coreRunLength}
          unit="m"
          min={0}
          step={0.01}
          inputClassName="rqd-number-input"
          onWheel={preventNumberWheel}
          onKeyDown={preventNumberArrow}
          darkMode={darkMode}
          onChange={(coreRunLength) => patch({ coreRunLength })}
        />
      </MethodSection>

      <MethodSection
        darkMode={darkMode}
        prominent
        title={en ? 'Evaluation result' : '评价结果'}
        description={en ? 'The calculated RQD is compared with the following quality ranges.' : '根据上述岩芯回次统计结果计算 RQD，并与下表质量区间进行对应判定。'}
      >
        <div data-testid="rqd-result-section" className="md:col-span-2 space-y-4">
          <div data-testid="rqd-live-calculation" className={`rounded-lg border px-4 py-4 text-center ${resultTone}`}>
            <div className="text-sm font-medium">{en ? 'RQD result' : 'RQD 计算结果'}</div>
            <div className={`mt-1 text-3xl font-bold tabular-nums ${rqd == null ? '' : darkMode ? 'text-blue-100' : 'text-blue-900'}`}>{rqd == null ? '—' : `RQD = ${rqd}%`}</div>
            <div className="mt-1 text-sm">{grade == null ? (en ? 'Enter both core-run measurements to calculate the result.' : '补充本回次的两项长度后，系统将计算 RQD。') : (en ? grade.qualityEn : grade.quality)}</div>
          </div>
          <div data-testid="rqd-grade-reference" className={`overflow-x-auto rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead className={darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}>
                <tr><th className="px-3 py-2.5 text-center">{en ? 'RQD range (%)' : 'RQD 区间'}</th><th className="px-3 py-2.5 text-center">{en ? 'Rock-mass quality' : '岩体质量'}</th></tr>
              </thead>
              <tbody className={darkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
                {RQD_CLASSES.map((entry) => {
                  const range = entry.id === 'excellent' ? '90%–100%' : entry.id === 'good' ? '75%–<90%' : entry.id === 'fair' ? '50%–<75%' : entry.id === 'poor' ? '25%–<50%' : '0%–<25%'
                  const selected = grade?.id === entry.id
                  return <tr key={entry.id} className={selected ? (darkMode ? 'bg-blue-950/45' : 'bg-blue-50') : undefined}><td className="px-3 py-2.5 text-center tabular-nums">{range}</td><td className="px-3 py-2.5 text-center">{en ? entry.qualityEn : entry.quality}</td></tr>
                })}
              </tbody>
            </table>
          </div>
        </div>
      </MethodSection>
    </>
  )
}
