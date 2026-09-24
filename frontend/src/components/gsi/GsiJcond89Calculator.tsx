import { useState } from 'react'
import { Km } from '../math/Katex'
import { SYM } from '../math/symbols'
import {
  GSI_JCOND89_DETAIL_ROWS,
  GSI_JCOND89_SIMPLE,
  type GsiFormState,
  type GsiJcond89DetailTableKey,
} from '../../methods/gsi'

interface GsiJcond89CalculatorProps {
  darkMode: boolean
  language: 'zh' | 'en'
  state: GsiFormState
  onClose: () => void
  onComplete: (next: Partial<GsiFormState>) => void
}

type DetailSelection = Record<GsiJcond89DetailTableKey, string>

function emptyDetails(): DetailSelection {
  return {
    a4PersistenceId: '',
    a4ApertureId: '',
    a4RoughnessId: '',
    a4InfillId: '',
    a4WeatheringId: '',
  }
}

function detailsFromState(state: GsiFormState): DetailSelection {
  return {
    a4PersistenceId: state.jcond89PersistenceId,
    a4ApertureId: state.jcond89ApertureId,
    a4RoughnessId: state.jcond89RoughnessId,
    a4InfillId: state.jcond89InfillId,
    a4WeatheringId: state.jcond89WeatheringId,
  }
}

function detailSum(selection: DetailSelection) {
  const scores = GSI_JCOND89_DETAIL_ROWS.map((row) => row.options.find((item) => item.id === selection[row.key])?.score ?? null)
  if (scores.some((item) => item == null)) return null
  return scores.reduce<number>((total, item) => total + (item ?? 0), 0)
}

function tableShell(darkMode: boolean) {
  return darkMode ? 'border-gray-600' : 'border-gray-300'
}

function headCell(darkMode: boolean) {
  return darkMode ? 'bg-gray-700/60 text-gray-200' : 'bg-gray-100 text-gray-700'
}

function selectedCell(darkMode: boolean) {
  return darkMode ? 'bg-blue-900/50 text-blue-100' : 'bg-blue-100 text-blue-900'
}

function bodyCell(darkMode: boolean) {
  return darkMode ? 'text-gray-300' : 'text-gray-700'
}

export default function GsiJcond89Calculator({ darkMode, language, state, onClose, onComplete }: GsiJcond89CalculatorProps) {
  const en = language === 'en'
  const [simpleId, setSimpleId] = useState(state.jcond89SimpleId)
  const [details, setDetails] = useState<DetailSelection>(() => detailsFromState(state))
  const muted = darkMode ? 'text-gray-400' : 'text-gray-600'
  const panel = darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
  const border = tableShell(darkMode)
  const sum = detailSum(details)
  const simpleScore = GSI_JCOND89_SIMPLE.find((item) => item.id === simpleId)?.score ?? null
  const resolved = sum ?? simpleScore
  const simpleActive = sum == null && Boolean(simpleId)

  const selectSimple = (id: string) => {
    setSimpleId(id)
    setDetails(emptyDetails())
  }

  const selectDetail = (rowKey: GsiJcond89DetailTableKey, optionId: string) => {
    setSimpleId('')
    setDetails((current) => ({ ...current, [rowKey]: optionId }))
  }

  const confirm = () => {
    if (resolved == null) return
    if (sum != null) {
      onComplete({
        surfaceMethod: 'jcond89',
        jcond89Mode: 'detailed',
        jcond89SimpleId: '',
        jcond89Value: sum,
        jcond89PersistenceId: details.a4PersistenceId,
        jcond89ApertureId: details.a4ApertureId,
        jcond89RoughnessId: details.a4RoughnessId,
        jcond89InfillId: details.a4InfillId,
        jcond89WeatheringId: details.a4WeatheringId,
      })
      return
    }
    onComplete({
      surfaceMethod: 'jcond89',
      jcond89Mode: 'simple',
      jcond89SimpleId: simpleId,
      jcond89Value: simpleScore,
      jcond89PersistenceId: '',
      jcond89ApertureId: '',
      jcond89RoughnessId: '',
      jcond89InfillId: '',
      jcond89WeatheringId: '',
    })
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gsi-jcond89-quick-title"
        data-testid="gsi-jcond89-calculator"
        className={`thin-scroll max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl border p-5 shadow-xl ${panel}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="gsi-jcond89-quick-title" className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {en ? <>Discontinuity condition <Km math={SYM.JCond89} /> ratings</> : <>结构面状态 <Km math={SYM.JCond89} /> 取值</>}
          </h2>
          <button
            type="button"
            aria-label={en ? 'Close' : '关闭'}
            title={en ? 'Close' : '关闭'}
            onClick={onClose}
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            ×
          </button>
        </div>

        <p className={`mt-3 text-sm leading-relaxed ${muted}`}>
          {en ? (
            <>
              <Km math={SYM.JCond89} /> is Bieniawski’s (1989) discontinuity-condition rating (0–30). It accounts for joint persistence, aperture, roughness, infilling and wall-rock weathering. If the observed joint set matches one of the five summary descriptions, select that class under joint-condition judgement. If the discontinuities cannot be captured by a single description, score the five items below; their sum is <Km math={SYM.JCond89} />.
            </>
          ) : (
            <>
              <Km math={SYM.JCond89} /> 为 Bieniawski（1989）结构面条件评分，取值 0～30，主要考虑节理迹长（延续性）、张开度、粗糙度、充填物以及结构面壁风化程度。当现场结构面可与五档综合描述对应时，直接按节理状态判断点选即可；若为不连续节理面、各要素难以用单一描述概括，则按下方五项分别点选，五项评分之和即为 <Km math={SYM.JCond89} />。
            </>
          )}
        </p>

        <div className="mt-4 overflow-x-auto">
          <table data-testid="gsi-jcond89-table" className={`w-full min-w-[640px] table-fixed border-collapse border text-sm ${border}`}>
            <colgroup>
              <col className="w-[22%]" />
              {GSI_JCOND89_SIMPLE.map((item) => <col key={`col-${item.id}`} />)}
            </colgroup>
            <tbody>
              <tr>
                <th scope="row" className={`border ${border} ${headCell(darkMode)} px-2 py-1.5 text-left font-medium`}>
                  {en ? 'Joint-condition judgement' : '节理状态判断'}
                </th>
                {GSI_JCOND89_SIMPLE.map((item) => {
                  const isSelected = simpleActive && simpleId === item.id
                  return (
                    <td
                      key={item.id}
                      data-testid={`gsi-jcond89-simple-${item.id}`}
                      aria-pressed={isSelected}
                      onClick={() => selectSimple(item.id)}
                      className={`border ${border} cursor-pointer px-2 py-1.5 text-center leading-snug hover:underline ${isSelected ? selectedCell(darkMode) : bodyCell(darkMode)}`}
                    >
                      {en ? item.labelEn : item.label}
                    </td>
                  )
                })}
              </tr>
              <tr>
                <th scope="row" className={`border ${border} ${headCell(darkMode)} px-2 py-1.5 text-left font-medium`}>
                  {en ? 'Rating' : '评分'}
                </th>
                {GSI_JCOND89_SIMPLE.map((item) => {
                  const isSelected = simpleActive && simpleId === item.id
                  return (
                    <td
                      key={`score-${item.id}`}
                      aria-pressed={isSelected}
                      onClick={() => selectSimple(item.id)}
                      className={`border ${border} cursor-pointer px-2 py-1.5 text-center font-semibold tabular-nums hover:underline ${isSelected ? selectedCell(darkMode) : bodyCell(darkMode)}`}
                    >
                      {item.score} {en ? 'points' : '分'}
                    </td>
                  )
                })}
              </tr>
              <tr>
                <th
                  colSpan={GSI_JCOND89_SIMPLE.length + 1}
                  className={`border ${border} ${headCell(darkMode)} px-2 py-1.5 text-left font-medium`}
                >
                  {en ? 'Ratings for discontinuous joints' : '不连续节理面分类取值'}
                </th>
              </tr>
              {GSI_JCOND89_DETAIL_ROWS.map((row) => (
                <tr key={row.key}>
                  <th scope="row" className={`border ${border} ${headCell(darkMode)} px-2 py-1.5 text-left font-medium`}>
                    {en ? row.labelEn : row.label}
                  </th>
                  {row.options.map((option) => {
                    const isSelected = details[row.key] === option.id
                    return (
                      <td
                        key={option.id}
                        data-testid={`gsi-jcond89-detail-${row.key}-${option.id}`}
                        aria-pressed={isSelected}
                        onClick={() => selectDetail(row.key, option.id)}
                        className={`border ${border} cursor-pointer px-2 py-1.5 text-center leading-snug hover:underline ${isSelected ? selectedCell(darkMode) : bodyCell(darkMode)}`}
                      >
                        <div>{en ? option.labelEn : option.label}</div>
                        <div className={`text-[11px] font-semibold tabular-nums ${isSelected ? '' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {option.score} {en ? 'points' : '分'}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled={resolved == null}
            onClick={confirm}
            className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {en ? 'Confirm and fill' : '确认并回填'}
          </button>
        </div>
      </div>
    </div>
  )
}
