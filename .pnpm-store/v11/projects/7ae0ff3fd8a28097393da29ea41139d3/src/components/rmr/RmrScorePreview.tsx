import { RMR_PARAM_TITLES, type RmrScoreBreakdown } from '../../utils/rmrCalc'

const ROWS: (keyof Pick<RmrScoreBreakdown, 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6'>)[] = [
  'A1', 'A2', 'A3', 'A4', 'A5', 'A6',
]

interface RmrScorePreviewProps {
  darkMode: boolean
  language: 'zh' | 'en'
  scores: RmrScoreBreakdown
}

export default function RmrScorePreview({ darkMode, language, scores }: RmrScorePreviewProps) {
  const isEn = language === 'en'
  const panel = `rounded-lg border p-4 ${
    darkMode ? 'border-gray-600 bg-gray-800/80' : 'border-gray-200 bg-white shadow-sm'
  }`

  return (
    <aside className={`sticky top-0 ${panel}`}>
      <h3 className={`text-base font-semibold mb-1 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{isEn ? 'Rating preview' : '分值预览'}</h3>
      <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {isEn ? `${scores.completedCount} / 6 selected` : `已选 ${scores.completedCount} / 6 项`}
      </p>
      <ul className="space-y-2">
        {ROWS.map((key) => {
          const v = scores[key]
          const done = v != null
          return (
            <li
              key={key}
              className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-sm ${
                done
                  ? darkMode
                    ? 'bg-blue-950/35'
                    : 'bg-blue-50/80'
                  : darkMode
                    ? 'bg-gray-700/40'
                    : 'bg-gray-50'
              }`}
            >
              <span className="flex min-w-0 items-start gap-2">
                <span
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    done
                      ? 'bg-blue-600 text-white'
                      : darkMode
                        ? 'bg-gray-600 text-gray-300'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {done ? '✓' : key.replace('A', '')}
                </span>
                <span className={`min-w-0 break-words leading-5 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {key} · {isEn ? RMR_PARAM_TITLES[key].shortEn : RMR_PARAM_TITLES[key].short}
                </span>
              </span>
              <span className={`ml-2 shrink-0 tabular-nums font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {done ? v : '—'}
              </span>
            </li>
          )
        })}
      </ul>

      <div className={`mt-4 border-t pt-3 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <div className="flex items-baseline justify-between">
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {scores.allComplete ? (isEn ? 'RMR total' : 'RMR 总分') : (isEn ? 'Current sum Σ' : '当前合计 Σ')}
          </span>
          <span className={`text-2xl font-bold tabular-nums ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
            {scores.completedCount > 0 ? scores.partialSum : '—'}
          </span>
        </div>
        {scores.classInfo ? (
          <p className={`mt-2 text-sm ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
            {isEn ? scores.classInfo.labelEn : scores.classInfo.label} · {isEn ? scores.classInfo.qualityEn : scores.classInfo.quality}
          </p>
        ) : (
          <p className={`mt-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {isEn ? 'Complete all six ratings to show the final class.' : '六项齐全后显示正式等级'}
          </p>
        )}
      </div>
    </aside>
  )
}
