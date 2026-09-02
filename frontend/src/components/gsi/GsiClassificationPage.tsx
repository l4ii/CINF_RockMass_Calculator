import { useMemo, useState } from 'react'
import { Km, Kblock } from '../math/Katex'
import { SYM } from '../math/symbols'
import BackIconButton from '../BackIconButton'
import { FormulaFrame } from '../calculationUiPrimitives'
import PointInformationFields from '../classification/PointInformationFields'
import GsiChartPanel from './GsiChartPanel'
import GsiQuantitativePanel from './GsiQuantitativePanel'
import GsiScorePreview from './GsiScorePreview'
import {
  calculateGsi,
  normalizeGsiState,
  validateGsiState,
  type GsiEntryMode,
  type GsiFormState,
} from '../../methods/gsi'

interface GsiClassificationPageProps {
  darkMode: boolean
  language: 'zh' | 'en'
  caseName: string
  pointName: string
  pointNote: string
  pointOreType: string
  oreTypeOptions?: string[]
  pointOrdinal: number
  pointTotal: number
  value: GsiFormState
  onChange: (next: GsiFormState) => void
  onPointNameChange: (name: string) => void
  onPointNoteChange: (note: string) => void
  onPointOreTypeChange: (oreType: string) => void
  onBackToWorkspace: () => void
  onBackToPoints: () => void
  onComplete: () => void
  onCompleteAndNext: () => void
}

export default function GsiClassificationPage({
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
}: GsiClassificationPageProps) {
  const en = language === 'en'
  const state = useMemo(() => normalizeGsiState(value), [value])
  const issues = useMemo(() => validateGsiState(state), [state])
  const result = useMemo(() => {
    if (issues.length > 0) return null
    try {
      return calculateGsi(state)
    } catch {
      return null
    }
  }, [issues, state])
  const [attempted, setAttempted] = useState(false)
  const patch = (partial: Partial<GsiFormState>) => onChange({ ...state, ...partial })
  const centered = `w-full rounded-lg border px-3 py-2 text-center text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`
  const card = `rounded-lg border p-4 sm:p-5 ${darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white shadow-sm'}`
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const finish = (action: () => void) => {
    if (issues.length > 0) {
      setAttempted(true)
      document.querySelector<HTMLElement>(`[data-field="${issues[0].field}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setAttempted(false)
    action()
  }
  const setMode = (entryMode: Exclude<GsiEntryMode, ''>) => patch({ entryMode })
  const quantitative = state.entryMode === 'quantitative'

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
                {en ? 'Geological Strength Index (GSI)' : 'GSI 地质强度指标'}
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
              listId="gsi-rock-mass-groups"
              inputClassName={centered}
              onPointNameChange={onPointNameChange}
              onPointNoteChange={onPointNoteChange}
              onPointOreTypeChange={onPointOreTypeChange}
            />
          </section>

          <section data-testid="gsi-method-introduction" className={card}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className={`text-base font-semibold leading-6 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {en ? 'Geological Strength Index (GSI)' : '地质强度指标（GSI）'}
              </h2>
              <div data-testid="gsi-entry-mode" data-field="entryMode" className="flex h-6 shrink-0 overflow-hidden rounded-md border text-xs font-medium leading-none">
                <button
                  type="button"
                  onClick={() => setMode('chart')}
                  className={`inline-flex h-full items-center px-2.5 ${state.entryMode !== 'quantitative' ? 'bg-blue-600 text-white' : darkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {en ? 'Chart method' : '图表法'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('quantitative')}
                  className={`inline-flex h-full items-center border-l px-2.5 ${state.entryMode === 'quantitative' ? 'bg-blue-600 text-white' : darkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {en ? 'Quantitative method' : '定量法'}
                </button>
              </div>
            </div>
            <p className={`mb-4 text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {en ? (
                <>
                  The Geological Strength Index <Km math={SYM.GSI} /> was proposed by Hoek, Kaiser and Brown in 1995 to estimate rock-mass strength from structure (block interlocking) and discontinuity surface quality. <Km math={SYM.GSI} /> ranges from 0 to 100 and is the usual entry to the Hoek–Brown criterion.
                  {quantitative ? (
                    <>
                      {' '}Hoek, Carter and Diederichs (2013) recast the chart as continuous scales: the horizontal axis is discontinuity condition <Km math={SYM.JCond89_scaled} /> (0–45) and the vertical axis is <Km math={SYM.RQD_over_2} /> (0–40), so <Km math={SYM.GSI_quant} />.
                      {' '}<Km math={SYM.JCond89} /> is Bieniawski’s (1989) joint-condition rating (0–30), obtained from a five-class summary or from persistence, aperture, roughness, infilling and weathering; <Km math={SYM.RQD} /> is the percentage of a core run made up of intact pieces at least 10 cm long. Both should be taken from the same engineering zone. Isolines on the quantitative chart run from 10 to 80.
                    </>
                  ) : (
                    <>
                      {' '}It is obtained as <Km math={SYM.ScaleA} /> (surface quality) plus <Km math={SYM.ScaleB} /> (structure): <Km math={SYM.GSI_chart} />. The chart method reads GSI from structure class and surface condition; quantitative filling uses <Km math={SYM.ScaleA_quant} /> and <Km math={SYM.ScaleB_quant} />.
                    </>
                  )}
                </>
              ) : (
                <>
                  地质强度指标 <Km math={SYM.GSI} /> 由 Hoek、Kaiser、Brown 于 1995 年提出，根据岩体结构（块体镶嵌程度）和结构面表面质量估计岩体强度，取值 0～100，是进入 Hoek–Brown 强度准则的常用入口。
                  {quantitative ? (
                    <>
                      Hoek、Carter 与 Diederichs（2013）将原图表法写成连续刻度：横轴为结构面状态 <Km math={SYM.JCond89_scaled} />（0～45），纵轴为岩石质量指标 <Km math={SYM.RQD_over_2} />（0～40），即 <Km math={SYM.GSI_quant} />。
                      <Km math={SYM.JCond89} /> 为 Bieniawski（1989）结构面条件评分（0～30），可由五档综合描述或按迹长、张开度、粗糙度、充填、风化五项求和得到；<Km math={SYM.RQD} /> 按同一岩芯回次统计长度不小于 10 cm 的完整段占钻孔长度的百分数。二者应取自同一工程分区。定量图等值线给出 10～80 的指标值。
                    </>
                  ) : (
                    <>
                      <Km math={SYM.GSI} /> 由刻度 <Km math="A" />（表面质量）与刻度 <Km math="B" />（岩体结构）相加得到，即 <Km math={SYM.GSI_chart} />；图表法按构造类别与表面条件在图上读取，定量法时 <Km math={SYM.ScaleA_quant} />、<Km math={SYM.ScaleB_quant} />。
                    </>
                  )}
                </>
              )}
            </p>
            <div data-testid="gsi-formula">
              <FormulaFrame darkMode={darkMode}>
                <div className={`space-y-1 text-center ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  <Kblock math={quantitative ? SYM.GSI_quant : SYM.GSI_chart} />
                </div>
              </FormulaFrame>
            </div>
          </section>

          <section className={card}>
            <h2 className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {quantitative
                ? (en ? 'Quantitative method' : '定量法')
                : (en ? 'Chart method' : '图表法')}
            </h2>
            <p className={`mt-1 text-sm leading-relaxed ${muted}`}>
              {quantitative
                ? (en
                  ? <>The table below determines GSI from discontinuity condition and RQD. The horizontal axis is joint surface quality (strong to weak to the right; <Km math={SYM.JCond89_scaled} />); the vertical axis is rock-mass structure (strong to weak downward; <Km math={SYM.RQD_over_2} />, 0–40). Mean GSI is <Km math={SYM.GSI_quant} />; contour lines give index values from 10 to 80. Enter the two ratings above, or select a matching cell.</>
                  : <>下表为根据结构面状态和岩石质量指标确定地质强度指标（GSI）的量化图。横轴为结构面质量（由左至右由强到弱，对应 <Km math={SYM.JCond89_scaled} />），纵轴为岩体结构（由上至下由强到弱，对应 <Km math={SYM.RQD_over_2} />，0～40）。平均 GSI 为 <Km math={SYM.GSI_quant} />，图中等值线给出 10～80 的指标值。可在上方输入两项参数，或在下表中选择对应方格。</>)
                : (en
                  ? 'The table below is the Geological Strength Index (GSI) chart for jointed rock masses. The horizontal axis is discontinuity surface condition (surface quality decreasing to the right; Scale A); the vertical axis is rock-mass structure (interlocking decreasing downward; Scale B). Mean GSI is Scale A + Scale B at that combination; contour lines give index values from 10 to 90. N/A means that combination is not applicable.'
                  : '下表为节理岩体地质强度指标（GSI）分级图。横轴为结构面表面条件（由左至右表面质量降低，对应 Scale A），纵轴为岩体结构（由上至下块体镶嵌程度降低，对应 Scale B）。平均 GSI 为该组合的 Scale A + Scale B，图中等值线给出 10～90 的指标值。N/A 表示该组合在工程上不适用。')}
            </p>
            {state.entryMode !== 'quantitative' ? (
              <div className="mt-2.5">
                <GsiChartPanel
                  darkMode={darkMode}
                  language={language}
                  structureId={state.structureId}
                  surfaceQualityId={state.surfaceQualityId}
                  onSelect={(structureId, surfaceQualityId) => patch({ entryMode: 'chart', structureId, surfaceQualityId })}
                />
              </div>
            ) : (
              <div className="mt-2.5">
                <GsiQuantitativePanel
                  darkMode={darkMode}
                  language={language}
                  state={state}
                  patch={patch}
                />
              </div>
            )}
          </section>

          <footer className={card}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              {attempted && issues.length > 0 ? (
                <p className="text-sm text-red-600 dark:text-red-300 sm:mr-auto">{en ? issues[0].messageEn : issues[0].message}</p>
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
                <button type="button" onClick={() => finish(onCompleteAndNext)} className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>{en ? 'Next point' : '下一个'}</button>
              </div>
            </div>
          </footer>
          <div className="pb-24" />
        </main>
        <aside data-testid="calculation-result-pane" className="hidden min-w-0 xl:block">
          <GsiScorePreview darkMode={darkMode} language={language} state={state} result={result} />
        </aside>
      </div>
    </div>
  )
}
