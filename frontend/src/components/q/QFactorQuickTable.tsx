import { Fragment } from 'react'
import { Km } from '../math/Katex'
import { SYM } from '../math/symbols'
import {
  formatFactorRating,
  groupFactorOptions,
  groupFactorOptionsByLetter,
  type QFactorOption,
  type QFactorSymbol,
} from '../../methods/q'
import {
  JR_CONTACT_FIGURES,
  JrRoughnessProfile,
  jnSketchSrc,
} from './qFactorSketches'

interface QFactorQuickTableProps {
  darkMode: boolean
  language: 'zh' | 'en'
  symbol: QFactorSymbol
  options: readonly QFactorOption[]
  selectedId: string
  selectedLetter?: string
  onSelectOption: (option: QFactorOption) => void
  onSelectLetter: (letter: string) => void
}

function tableShell(darkMode: boolean) {
  return darkMode ? 'border-gray-600' : 'border-gray-300'
}

function selectedCell(darkMode: boolean) {
  return darkMode ? 'font-semibold text-blue-200' : 'font-semibold text-blue-800'
}

function selectedMark(darkMode: boolean) {
  return darkMode ? 'bg-blue-900/50 text-blue-100 font-semibold' : 'bg-blue-100 text-blue-900 font-semibold'
}

function bodyCell(darkMode: boolean) {
  return darkMode ? 'text-gray-300' : 'text-gray-700'
}

function joinRatings(values: string[], en: boolean) {
  if (values.length <= 1) return values[0] ?? ''
  const head = values.slice(0, -1).join(en ? ', ' : '、')
  return `${head}${en ? ' or ' : ' 或 '}${values[values.length - 1]}`
}

function groupedLabel(matches: QFactorOption[], en: boolean) {
  const letter = matches[0]?.letter
  if (matches.length === 1) return en ? matches[0].label.en : matches[0].label.zh
  if (letter === 'K') return en ? 'Zones or bands of disintegrated or crushed rock and clay (see G, H, J for the clay condition)' : '含区域或带状分解或压碎岩石和黏土（参见 G、H、J 关于黏土状况描述）'
  if (letter === 'M') return en ? 'Thick, continuous zones or bands of clay (see G, H, J for the clay condition)' : '含厚层、连续区域或带状黏土（参见 G、H、J 关于黏土状况描述）'
  return en ? matches[0].label.en : matches[0].label.zh
}

function rowTestId(matches: QFactorOption[]) {
  if (matches.length === 1) return `q-factor-row-${matches[0].id}`
  return `q-factor-letter-${matches[0].letter}`
}

export default function QFactorQuickTable({
  darkMode,
  language,
  symbol,
  options,
  selectedId,
  selectedLetter,
  onSelectOption,
  onSelectLetter,
}: QFactorQuickTableProps) {
  const en = language === 'en'
  const border = tableShell(darkMode)
  const muted = darkMode ? 'text-gray-400' : 'text-gray-600'
  const groups = groupFactorOptions(options)
  const letterRows = groupFactorOptionsByLetter(options)

  const selectRow = (matches: QFactorOption[]) => {
    if (matches.length === 1) onSelectOption(matches[0])
    else if (matches[0]?.letter) onSelectLetter(matches[0].letter)
  }

  const rowClass = (matches: QFactorOption[]) => {
    const selected = matches.some((item) => item.id === selectedId) || (selectedLetter != null && matches[0]?.letter === selectedLetter)
    return `cursor-pointer ${selected ? selectedCell(darkMode) : bodyCell(darkMode)}`
  }

  const bookCell = `border-y ${border} px-3 py-2`
  const dividedCell = `${bookCell} border-l`
  const codeCell = `${bookCell} w-12 text-center align-middle font-medium`
  const bookRatingCell = `${dividedCell} w-28 text-center align-middle font-semibold tabular-nums`
  const letterAccent = (selected: boolean) =>
    `border-l-4 ${selected ? `${selectedMark(darkMode)} ${darkMode ? 'border-l-blue-400' : 'border-l-blue-600'}` : 'border-l-transparent'}`
  const ratingAccent = (selected: boolean) => (selected ? selectedMark(darkMode) : '')
  const jnImg = 'mx-auto mt-2 h-28 w-auto max-w-none object-contain'

  if (symbol === 'Jn') {
    return (
      <div className="space-y-3">
        <table className="mx-auto border-collapse text-base">
          <thead>
            <tr>
              <th className={`${bookCell} w-12 border-l-4 border-l-transparent`} />
              <th className={`${dividedCell} min-w-[22rem] text-center font-medium`}>
                {en ? '2. Joint-set number' : '2. 节理组数'}
              </th>
              <th className={`${dividedCell} w-24 text-center font-medium`}>
                <Km math={SYM.Jn} />
              </th>
            </tr>
          </thead>
          <tbody>
            {letterRows.flatMap((row) => {
              const matches = row.options
              const option = matches[0]
              const bandSelected = matches.some((item) => item.id === selectedId)
              const dual = row.letter === 'D' && matches.length > 1
              const choices = dual ? matches : [option]
              return choices.map((choice, index) => {
                const src = jnSketchSrc(choice.id)
                return (
                  <tr
                    key={choice.id}
                    data-testid={`q-factor-row-${choice.id}`}
                    aria-pressed={choice.id === selectedId}
                    className={rowClass([choice])}
                    onClick={() => onSelectOption(choice)}
                  >
                    {index === 0 ? (
                      <td
                        rowSpan={choices.length}
                        data-testid={dual ? 'q-factor-letter-D' : undefined}
                        className={`${bookCell} text-center align-middle font-medium ${letterAccent(bandSelected)}`}
                      >
                        {row.letter}
                      </td>
                    ) : null}
                    <td className={`${dividedCell} text-center align-middle leading-snug`}>
                      <div>{en ? choice.label.en : choice.label.zh}</div>
                      {src ? (
                        <img
                          src={src}
                          alt=""
                          data-testid={choice.id === 'columnar' ? 'q-jn-columnar' : `q-jn-sketch-${choice.id}`}
                          draggable={false}
                          className={jnImg}
                        />
                      ) : null}
                      {choice.note ? <div className={`mt-1 text-sm ${choice.id === selectedId ? '' : muted}`}>{en ? choice.note.en : choice.note.zh}</div> : null}
                    </td>
                    {index === 0 ? (
                      <td rowSpan={choices.length} className={`${dividedCell} w-24 text-center align-middle font-semibold tabular-nums ${ratingAccent(bandSelected)}`}>
                        {formatFactorRating(choice)}
                      </td>
                    ) : null}
                  </tr>
                )
              })
            })}
          </tbody>
        </table>
      </div>
    )
  }

  if (symbol === 'Jr') {
    const contactGroup = groups[0]
    const noContactGroup = groups[1]
    const jrSection = (key: 'a' | 'b' | 'c', zh: string, enLabel: string) => {
      const figure = JR_CONTACT_FIGURES[key]
      const refPt = JR_CONTACT_FIGURES.c.widthPt
      return (
        <tr>
          <th colSpan={3} className={`${bookCell} font-medium`}>
            <div className="text-left">{en ? enLabel : zh}</div>
            <div className="mx-auto mt-2">
              <img
                src={figure.src}
                alt=""
                data-testid={`q-jr-contact-${key}`}
                draggable={false}
                className="mx-auto block h-auto max-w-full object-contain"
                style={{ width: `${(figure.widthPt / refPt) * 26}rem` }}
              />
            </div>
          </th>
        </tr>
      )
    }
    const jrRow = (option: QFactorOption, withProfile: boolean) => (
      <tr key={option.id} data-testid={`q-factor-row-${option.id}`} aria-pressed={option.id === selectedId} className={rowClass([option])} onClick={() => onSelectOption(option)}>
        <td className={`${bookCell} text-center align-middle font-medium ${letterAccent(option.id === selectedId)}`}>{option.letter}</td>
        <td className={`${dividedCell} align-middle`}>
          <div className="mx-auto flex w-max max-w-full flex-col items-center gap-1 px-1">
            <div className="max-w-md text-center leading-snug">{en ? option.label.en : option.label.zh}</div>
            {withProfile ? <JrRoughnessProfile optionId={option.id} language={language} /> : null}
          </div>
        </td>
        <td className={`${dividedCell} w-24 text-center align-middle font-semibold tabular-nums ${ratingAccent(option.id === selectedId)}`}>
          {formatFactorRating(option)}
        </td>
      </tr>
    )
    return (
      <div className="space-y-2">
        <table className="mx-auto w-max max-w-full border-collapse text-base">
          <thead>
            <tr>
              <th className={`${bookCell} w-12 border-l-4 border-l-transparent`} />
              <th className={`${dividedCell} text-center font-medium`}>
                {en ? '3. Joint roughness' : '3. 节理粗糙度'}
              </th>
              <th className={`${dividedCell} w-24 text-center font-medium`}>
                <Km math={SYM.Jr} />
              </th>
            </tr>
          </thead>
          <tbody>
            {jrSection('a', '（1）节理面完全接触', '(1) Rock-wall contact')}
            {jrSection('b', '（2）节理面在剪切错动 10 cm 位移前属于接触', '(2) Rock-wall contact before 10 cm of shear movement')}
            {contactGroup?.options.map((option) => jrRow(option, true))}
            {jrSection('c', '（3）剪切过程中节理面不接触', '(3) No rock-wall contact when sheared')}
            {noContactGroup?.options.map((option) => jrRow(option, false))}
          </tbody>
        </table>
      </div>
    )
  }

  if (symbol === 'Ja') {
    return (
      <table className="mx-auto border-collapse text-base">
        <thead>
          <tr>
            <th className={`${bookCell} w-12 border-l-4 border-l-transparent`} />
            <th className={`${dividedCell} min-w-[26rem] text-center font-medium`}>
              {en ? '4. Joint alteration' : '4. 节理蚀变系数'}
            </th>
            <th className={`${dividedCell} w-24 text-center font-medium`}>
              <Km math={SYM.phiR} /> / °
            </th>
            <th className={`${dividedCell} w-28 text-center font-medium`}>
              <Km math={SYM.Ja} />
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <Fragment key={group.label.zh}>
              <tr>
                <th colSpan={4} className={`${bookCell} text-center font-medium`}>
                  {en ? group.label.en : group.label.zh}
                </th>
              </tr>
              {groupFactorOptionsByLetter(group.options).map((row) => {
                const matches = row.options
                const option = matches[0]
                const selected = matches.some((item) => item.id === selectedId) || selectedLetter === row.letter
                return (
                  <tr key={row.letter ?? option.id} data-testid={rowTestId(matches)} aria-pressed={selected} className={rowClass(matches)} onClick={() => selectRow(matches)}>
                    <td className={`${codeCell} ${letterAccent(selected)}`}>{row.letter}</td>
                    <td className={`${dividedCell} leading-snug`}>
                      {groupedLabel(matches, en)}
                      {matches.length === 1 && option.note ? <div className={`mt-0.5 text-sm ${selected ? '' : muted}`}>{en ? option.note.en : option.note.zh}</div> : null}
                    </td>
                    <td className={`${dividedCell} text-center align-middle tabular-nums`}>{en ? option.phiR?.en ?? '—' : option.phiR?.zh ?? '—'}</td>
                    <td className={`${bookRatingCell} ${ratingAccent(selected)}`}>{joinRatings(matches.map(formatFactorRating), en)}</td>
                  </tr>
                )
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    )
  }

  if (symbol === 'Jw') {
    return (
      <table className="mx-auto border-collapse text-base">
        <thead>
          <tr>
            <th className={`${bookCell} w-12 border-l-4 border-l-transparent`} />
            <th className={`${dividedCell} min-w-[26rem] text-center font-medium`}>
              {en ? '5. Joint-water reduction' : '5. 节理水折减系数'}
            </th>
            <th className={`${dividedCell} w-36 text-center font-medium`}>
              {en ? 'Approx. water pressure' : '水压近似值'} / kg·cm<sup>-2</sup>
            </th>
            <th className={`${dividedCell} w-28 text-center font-medium`}>
              <Km math={SYM.Jw} />
            </th>
          </tr>
        </thead>
        <tbody>
          {letterRows.map((row) => {
            const option = row.options[0]
            return (
              <tr key={option.id} data-testid={`q-factor-row-${option.id}`} aria-pressed={option.id === selectedId} className={rowClass(row.options)} onClick={() => onSelectOption(option)}>
                <td className={`${codeCell} ${letterAccent(option.id === selectedId)}`}>{row.letter}</td>
                <td className={`${dividedCell} leading-snug`}>{en ? option.label.en : option.label.zh}</td>
                <td className={`${dividedCell} text-center align-middle tabular-nums`}>{en ? option.waterPressure?.en ?? '—' : option.waterPressure?.zh ?? '—'}</td>
                <td className={`${bookRatingCell} ${ratingAccent(option.id === selectedId)}`}>{formatFactorRating(option)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  return (
    <table className="mx-auto border-collapse text-base">
      <thead>
        <tr>
          <th className={`${bookCell} w-12 border-l-4 border-l-transparent`} />
          <th className={`${dividedCell} min-w-[26rem] text-center font-medium`}>
            {en ? '6. Stress reduction factor' : '6. 应力折减系数'}
          </th>
          <th className={`${dividedCell} w-28 text-center font-medium`}>
            <Km math={SYM.SRF} />
          </th>
        </tr>
      </thead>
      <tbody>
        {groups.map((group) => (
          <Fragment key={group.label.zh}>
            <tr>
              <th colSpan={3} className={`${bookCell} text-center font-medium`}>
                {en ? group.label.en : group.label.zh}
              </th>
            </tr>
            {group.options.map((option) => (
              <tr key={option.id} data-testid={`q-factor-row-${option.id}`} aria-pressed={option.id === selectedId} className={rowClass([option])} onClick={() => onSelectOption(option)}>
                <td className={`${codeCell} ${letterAccent(option.id === selectedId)}`}>{option.letter}</td>
                <td className={`${dividedCell} leading-snug`}>
                  {en ? option.label.en : option.label.zh}
                  {option.note ? <div className={`mt-0.5 text-sm ${option.id === selectedId ? '' : muted}`}>{en ? option.note.en : option.note.zh}</div> : null}
                </td>
                <td className={`${bookRatingCell} ${ratingAccent(option.id === selectedId)}`}>{formatFactorRating(option)}</td>
              </tr>
            ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  )
}
