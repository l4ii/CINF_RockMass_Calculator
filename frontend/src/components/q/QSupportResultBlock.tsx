import { formatQValue, type QResult } from '../../methods/q'
import { Q_SUPPORT_CATEGORIES } from '../../methods/qSupportChart'
import type { QSupportCategoryId } from '../../methods/qSupportChartGeometry'

function CategoryMark({
  id,
  darkMode,
  active = false,
  size = 'md',
}: {
  id: number
  darkMode: boolean
  active?: boolean
  size?: 'md' | 'lg'
}) {
  const box = size === 'lg' ? 'h-9 w-9 text-base' : 'h-7 w-7 text-sm'
  return (
    <span
      data-testid="q-support-category-mark"
      aria-label={`类别 ${id}`}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 font-bold tabular-nums leading-none ${box} ${
        active
          ? darkMode
            ? 'border-blue-200 bg-blue-600 text-white'
            : 'border-blue-700 bg-blue-600 text-white'
          : darkMode
            ? 'border-slate-300 bg-slate-800 text-slate-100'
            : 'border-slate-700 bg-white text-slate-800'
      }`}
    >
      {id}
    </span>
  )
}

function Metric({
  label,
  value,
  darkMode,
}: {
  label: string
  value: string
  darkMode: boolean
}) {
  return (
    <div className={`min-w-0 flex-1 rounded-lg border px-3 py-2 ${darkMode ? 'border-gray-600 bg-gray-800/80' : 'border-gray-200 bg-white'}`}>
      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  )
}

export function QSupportReading({
  result,
  darkMode,
  language,
}: {
  result: QResult | null
  darkMode: boolean
  language: 'zh' | 'en'
}) {
  const en = language === 'en'
  const muted = darkMode ? 'text-gray-400' : 'text-gray-600'
  const decision = result?.support
  if (!decision || result == null) {
    return <p className={muted}>{en ? 'Complete the six Q parameters, excavation size and ESR to assess support requirements.' : '完整填写六项 Q 参数、开挖尺寸及 ESR 后显示支护需求判定结果。'}</p>
  }
  const chartMode = decision.mode === 'chart'
  const category = Q_SUPPORT_CATEGORIES.find((item) => item.id === decision.category)
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        {chartMode && decision.category != null ? <CategoryMark id={decision.category} darkMode={darkMode} active size="lg" /> : null}
        <div className="min-w-0">
          <p className="font-semibold leading-snug">{chartMode && category ? category.measures[language] : decision.label[language]}</p>
          {chartMode && category ? <p className={`mt-1 text-sm ${muted}`}>{category.label[language]}</p> : null}
        </div>
      </div>
      {chartMode ? (
        <div data-testid="q-support-metrics" className="flex gap-2">
          <Metric darkMode={darkMode} label="De" value={`${formatQValue(result.equivalentDimension!)} m`} />
          {decision.boltLengthM != null ? <Metric darkMode={darkMode} label="L" value={`${formatQValue(decision.boltLengthM)} m`} /> : null}
          {decision.shotcreteThicknessCm != null ? (
            <Metric darkMode={darkMode} label={en ? 'Shotcrete' : '喷层厚度'} value={`${formatQValue(decision.shotcreteThicknessCm)} cm`} />
          ) : null}
          {decision.boltSpacingWithSfrM != null || decision.boltSpacingWithoutSfrM != null ? (
            <Metric
              darkMode={darkMode}
              label={decision.boltSpacingWithSfrM != null ? (en ? 'Bolt spacing (Sfr)' : '锚杆间距（有 Sfr）') : (en ? 'Bolt spacing' : '锚杆间距')}
              value={`${formatQValue((decision.boltSpacingWithSfrM ?? decision.boltSpacingWithoutSfrM)!)} m`}
            />
          ) : null}
          {decision.rrs ? (
            <Metric
              darkMode={darkMode}
              label={en ? 'RRS (ribs of shotcrete)' : 'RRS 喷混凝土肋'}
              value={`RRS ${decision.rrs.class}${decision.rrs.spacingM != null ? ` · c/c ${formatQValue(decision.rrs.spacingM)} m` : ''}`}
            />
          ) : null}
        </div>
      ) : (
        <div data-testid="q-support-metrics" className="flex gap-2">
          <Metric darkMode={darkMode} label="De" value={`${formatQValue(result.equivalentDimension!)} m`} />
          <Metric darkMode={darkMode} label={en ? 'Unsupported limit' : '经验无支护极限'} value={`${formatQValue(decision.maximumUnsupportedDimension)} m`} />
        </div>
      )}
      <p className={`leading-relaxed ${muted}`}>{decision.recommendation[language]}</p>
    </div>
  )
}

export default function QSupportResultBlock({
  result,
  darkMode,
  language,
  showCategories,
  focusCategory = null,
  onFocusCategory,
}: {
  result: QResult | null
  darkMode: boolean
  language: 'zh' | 'en'
  showCategories: boolean
  focusCategory?: QSupportCategoryId | null
  onFocusCategory?: (category: QSupportCategoryId | null) => void
}) {
  const en = language === 'en'
  const muted = darkMode ? 'text-gray-400' : 'text-gray-600'
  const current = result?.support?.category
  return (
    <div data-testid="q-support-decision" className={`mt-4 rounded-lg border p-3 text-sm ${darkMode ? 'border-gray-600 bg-gray-900/40' : 'border-gray-200 bg-gray-50'}`}>
      <QSupportReading result={result} darkMode={darkMode} language={language} />
      {showCategories ? (
        <>
          <p className={`mt-3 text-xs leading-relaxed ${muted}`}>
            {en
              ? 'RRS = reinforced ribs of shotcrete. Classes I / II / III increase in intensity; c/c is centre-to-centre spacing. Click a numbered region on the chart to highlight its range.'
              : 'RRS 为钢筋喷混凝土肋（Reinforced Ribs of Shotcrete）。I／II／III 由轻到重；c/c 为肋中心距。点击图上编号区域可高亮对应范围。'}
          </p>
          <ul className={`mt-3 divide-y ${darkMode ? 'divide-gray-700 border-t border-gray-700' : 'divide-gray-200 border-t border-gray-200'}`}>
            {Q_SUPPORT_CATEGORIES.map((item) => {
              const active = current === item.id
              const focused = focusCategory === item.id
              return (
                <li key={item.id} aria-current={active ? 'true' : undefined}>
                  <button
                    type="button"
                    data-testid={`q-support-category-row-${item.id}`}
                    aria-pressed={focused}
                    onClick={() => onFocusCategory?.(focused ? null : item.id)}
                    className={`flex w-full items-start gap-3 px-1 py-2.5 text-left ${
                      focused
                        ? darkMode
                          ? 'bg-blue-900/50 ring-1 ring-inset ring-blue-400'
                          : 'bg-blue-100 ring-1 ring-inset ring-blue-500'
                        : active
                          ? darkMode
                            ? 'bg-blue-950/40'
                            : 'bg-blue-50'
                          : ''
                    }`}
                  >
                    <CategoryMark id={item.id} darkMode={darkMode} active={active || focused} />
                    <p className={`pt-0.5 leading-snug ${active || focused ? (darkMode ? 'text-blue-100' : 'text-blue-900') : muted}`}>{item.measures[language]}</p>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      ) : null}
    </div>
  )
}
