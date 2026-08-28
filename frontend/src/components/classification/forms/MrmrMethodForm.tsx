import type { MethodFormProps } from '../ClassificationModule'
import {
  MRMR_BLASTING_OPTIONS,
  MRMR_JOINT_OPTIONS,
  MRMR_JOINT_SET_OPTIONS,
  MRMR_ORIENTATION_OPTIONS,
  MRMR_STRESS_OPTIONS,
  MRMR_WATER_OPTIONS,
  MRMR_WEATHERING_CONDITIONS,
  MRMR_WEATHERING_EXPOSURES,
  normalizeMrmrState,
  type MrmrFormState,
} from '../../../methods/mrmr'
import { MethodSection, NumberField, SegmentedField, SelectField, type LocalOption } from '../MethodFormControls'

function options(values: readonly { id: string; label: string; labelEn: string }[]): LocalOption[] {
  return values.map((item) => ({ id: item.id, label: item.label, labelEn: item.labelEn }))
}

export default function MrmrMethodForm({ form, onChange, darkMode, language }: MethodFormProps) {
  const state = normalizeMrmrState(form)
  const patch = (value: Partial<MrmrFormState>) => onChange({ ...state, ...value } as unknown as Record<string, unknown>)
  const en = language === 'en'
  const selectedWater = MRMR_WATER_OPTIONS.find((item) => item.id === state.waterId)
  const source = state.source

  return (
    <>
      {source ? (
        <section
          data-testid="mrmr-rmr-source"
          className={`rounded-lg border px-4 py-3 ${darkMode ? 'border-amber-700/60 bg-amber-950/25' : 'border-amber-200 bg-amber-50'}`}
        >
          <div className={`text-sm font-semibold ${darkMode ? 'text-amber-200' : 'text-amber-900'}`}>
            {en ? 'Prefilled from RMR' : '已从 RMR 带入 MRMR'}
          </div>
          <p className={`mt-1 text-xs leading-relaxed ${darkMode ? 'text-amber-200/80' : 'text-amber-800'}`}>
            {en ? `Source point: ${source.caseName} · ${source.pointName}` : `来源点位：${source.caseName} · ${source.pointName}`}
          </p>
          <p className={`mt-1 text-xs leading-relaxed ${darkMode ? 'text-amber-200/80' : 'text-amber-800'}`}>
            {source.inferredFields.length > 0
              ? en
                ? `Please review inferred fields: ${source.inferredFields.join(', ')}`
                : `请复核推导字段：${source.inferredFields.join('、')}`
              : en ? 'All base fields were carried over directly.' : '基础字段已直接带入。'}
          </p>
        </section>
      ) : null}
      <MethodSection
        darkMode={darkMode}
        title={en ? 'In-situ rock mass rating (IRMR)' : '原位岩体评分 IRMR'}
        description={en
          ? 'IRMR = RBS rating (0-25) + open-joint spacing rating (0-35) + joint-condition rating (0-40). Figure curves are digitised and reported as approximations.'
          : 'IRMR = 岩块强度 RBS 评分（0～25）+ 开放节理间距 JS 评分（0～35）+ 结构面条件 JC 评分（0～40）；原章曲线采用数字化插值并在报告中标注近似。'}
        source={en ? 'Laubscher/Jakubec 2001 · Figures 57.4-57.6, Table 57.1' : 'Laubscher/Jakubec 2001 · 图 57.4～57.6、表 57.1'}
      >
        <NumberField
          field="irsMpa"
          label={en ? 'Intact rock strength IRS' : '完整岩石强度 IRS'}
          value={state.irsMpa ?? state.correctedIrsMpa ?? null}
          unit="MPa"
          min={0}
          darkMode={darkMode}
          onChange={(irsMpa) => patch({ irsMpa })}
        />
        <SegmentedField
          field="fractureVeinMode"
          label={en ? 'Fractures or veins inside the rock block' : '岩块内部裂隙 / 脉体'}
          value={state.fractureVeinMode}
          options={[
            { id: 'none', label: '无', labelEn: 'None' },
            { id: 'measured', label: '有，按图 57.4 修正', labelEn: 'Present · Figure 57.4' },
          ]}
          darkMode={darkMode}
          language={language}
          onChange={(fractureVeinMode) => patch({ fractureVeinMode: fractureVeinMode as MrmrFormState['fractureVeinMode'] })}
        />
        {state.fractureVeinMode === 'measured' ? (
          <>
            <NumberField
              field="mohsHardness"
              label={en ? 'Fracture / vein Mohs hardness' : '裂隙 / 脉体莫氏硬度'}
              value={state.mohsHardness}
              min={1}
              max={5}
              step={1}
              darkMode={darkMode}
              onChange={(mohsHardness) => patch({ mohsHardness })}
            />
            <NumberField
              field="fractureVeinFrequencyPerM"
              label={en ? 'Fracture / vein frequency' : '裂隙 / 脉体频率'}
              value={state.fractureVeinFrequencyPerM}
              unit={en ? '/m' : '条/m'}
              min={0}
              darkMode={darkMode}
              onChange={(fractureVeinFrequencyPerM) => patch({ fractureVeinFrequencyPerM })}
            />
          </>
        ) : null}
        <NumberField
          field="jointSpacingM"
          label={en ? 'Mean open-joint spacing' : '开放节理平均间距'}
          value={state.jointSpacingM}
          unit="m"
          min={0.1}
          max={5}
          step={0.01}
          hint={en ? 'Figure 57.6' : '图 57.6'}
          darkMode={darkMode}
          onChange={(jointSpacingM) => patch({ jointSpacingM })}
        />
        <SelectField
          field="jointSetCount"
          label={en ? 'Number of open-joint sets' : '开放节理组数'}
          value={state.jointSetCount}
          options={options(MRMR_JOINT_SET_OPTIONS)}
          darkMode={darkMode}
          language={language}
          onChange={(jointSetCount) => patch({ jointSetCount: jointSetCount as MrmrFormState['jointSetCount'] })}
        />
        <SelectField
          field="jointConditionId"
          label={en ? 'Controlling joint condition' : '控制结构面条件'}
          value={state.jointConditionId}
          options={MRMR_JOINT_OPTIONS.map((item) => ({ id: item.id, label: `${item.label}（${item.value}/40）`, labelEn: `${item.labelEn} (${item.value}/40)` }))}
          darkMode={darkMode}
          language={language}
          onChange={(jointConditionId) => patch({ jointConditionId })}
          wide
        />
      </MethodSection>

      <MethodSection
        darkMode={darkMode}
        title={en ? 'Mining adjustments' : '采矿环境修正'}
        description={en
          ? 'The 2001 chapter treats water as a separate MRMR adjustment and warns that all factors should not be multiplied automatically. This implementation reports the governing-factor screening result.'
          : '2001 原章将水作为独立 MRMR 修正，并明确警示不可无条件叠乘全部因子；本实现输出控制修正因子筛查值。'}
        source={en ? 'Tables 57.2-57.5 · MRMR = IRMR × governing factor' : '表 57.2～57.5 · MRMR = IRMR × 控制修正因子'}
      >
        <SelectField
          field="weatheringConditionId"
          label={en ? 'Potential weathering' : '潜在风化程度'}
          value={state.weatheringConditionId}
          options={options(MRMR_WEATHERING_CONDITIONS)}
          darkMode={darkMode}
          language={language}
          onChange={(weatheringConditionId) => patch({ weatheringConditionId })}
        />
        <SelectField
          field="weatheringExposureId"
          label={en ? 'Exposure period' : '暴露时间'}
          value={state.weatheringExposureId}
          options={options(MRMR_WEATHERING_EXPOSURES)}
          darkMode={darkMode}
          language={language}
          onChange={(weatheringExposureId) => patch({ weatheringExposureId: weatheringExposureId as MrmrFormState['weatheringExposureId'] })}
        />
        <SelectField
          field="miningMethodId"
          label={en ? 'Mining method case' : '采矿方式情景'}
          value={state.miningMethodId ?? state.orientationId ?? null}
          options={options(MRMR_ORIENTATION_OPTIONS)}
          darkMode={darkMode}
          language={language}
          onChange={(miningMethodId) => patch({ miningMethodId })}
          wide
        />
        <SelectField
          field="stressId"
          label={en ? 'Mining-induced stress case' : '采矿诱发应力情景'}
          value={state.stressId}
          options={MRMR_STRESS_OPTIONS.map((item) => ({ id: item.id, label: `${item.label}（${item.value * 100}%）`, labelEn: `${item.labelEn} (${item.value * 100}%)` }))}
          hint={en ? 'Source case anchors, not a universal lookup table' : '原文案例锚点，并非通用离散表'}
          darkMode={darkMode}
          language={language}
          onChange={(stressId) => patch({ stressId })}
          wide
        />
        <SelectField
          field="blastingId"
          label={en ? 'Excavation / blasting' : '开挖 / 爆破方式'}
          value={state.blastingId}
          options={MRMR_BLASTING_OPTIONS.map((item) => ({ id: item.id, label: `${item.label}（${item.value * 100}%）`, labelEn: `${item.labelEn} (${item.value * 100}%)` }))}
          darkMode={darkMode}
          language={language}
          onChange={(blastingId) => patch({ blastingId })}
        />
        <SelectField
          field="waterId"
          label={en ? 'Water condition' : '水条件'}
          value={state.waterId}
          options={MRMR_WATER_OPTIONS.map((item) => ({ id: item.id, label: `${item.label}（${item.minPercent}%～${item.maxPercent}%）`, labelEn: `${item.labelEn} (${item.minPercent}%-${item.maxPercent}%)` }))}
          darkMode={darkMode}
          language={language}
          onChange={(waterId) => {
            const water = MRMR_WATER_OPTIONS.find((item) => item.id === waterId)
            patch({ waterId, waterFactorPercent: water && water.minPercent === water.maxPercent ? water.minPercent : null })
          }}
        />
        <NumberField
          field="waterFactorPercent"
          label={en ? 'Water factor selected within source range' : '水修正区间内采用值'}
          value={state.waterFactorPercent}
          unit="%"
          min={selectedWater?.minPercent ?? 0}
          max={selectedWater?.maxPercent ?? 100}
          step={1}
          hint={selectedWater ? `${selectedWater.minPercent}%～${selectedWater.maxPercent}%` : undefined}
          darkMode={darkMode}
          onChange={(waterFactorPercent) => patch({ waterFactorPercent })}
        />
      </MethodSection>
    </>
  )
}
