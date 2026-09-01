import type { KeyboardEvent, WheelEvent } from 'react'
import {
  A6_ADJUSTMENT,
  FAVORABILITY_OPTIONS,
  PROJECT_TYPES,
  TABLE_B_GROUPS,
  type DipBand,
  type Favorability,
  type ProjectType,
  type ReferenceTableSpec,
  type ScoreOption,
  type StrikeRelation,
} from '../../config/rmrTables'

function tableShell(darkMode: boolean) {
  return darkMode ? 'border-gray-600' : 'border-gray-300'
}

function preventNumberWheel(event: WheelEvent<HTMLInputElement>) {
  event.currentTarget.blur()
}

function preventNumberArrow(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') event.preventDefault()
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

interface RmrReferenceTableProps {
  darkMode: boolean
  language: 'zh' | 'en'
  spec: ReferenceTableSpec
  selectedId: string | null
  onSelect?: (optionId: string) => void
  /** 需要区分点击了哪一行时使用（如 A5 三条等效准则），优先于 onSelect */
  onSelectCell?: (rowIndex: number, columnIndex: number) => void
  /** A4 综合描述使用结论优先的紧凑布局，便于快速判断 */
  compactSummary?: boolean
}

type A4SummaryDetail = {
  text: string
  emphasis?: string
}

const A4_SUMMARY_CONTENT: Record<string, {
  lead: string
  leadEmphasis?: boolean
  details: A4SummaryDetail[]
  leadEn: string
  leadEnEmphasis?: boolean
  detailsEn: A4SummaryDetail[]
}> = {
  a4_30: {
    lead: '非常粗糙',
    leadEmphasis: true,
    details: [{ text: '不连续' }, { text: '无张开' }, { text: '未风化' }],
    leadEn: 'Very rough',
    leadEnEmphasis: true,
    detailsEn: [{ text: 'Not continuous' }, { text: 'No separation' }, { text: 'Unweathered' }],
  },
  a4_25: {
    lead: '微粗糙',
    details: [{ text: '张开度 < 1 mm' }, { text: '轻微风化', emphasis: '轻微风化' }],
    leadEn: 'Slightly rough',
    detailsEn: [{ text: 'Separation < 1 mm' }, { text: 'Slightly weathered', emphasis: 'Slightly weathered' }],
  },
  a4_20: {
    lead: '微粗糙',
    details: [{ text: '张开度 < 1 mm' }, { text: '高度风化', emphasis: '高度风化' }],
    leadEn: 'Slightly rough',
    detailsEn: [{ text: 'Separation < 1 mm' }, { text: 'Highly weathered', emphasis: 'Highly weathered' }],
  },
  a4_10: {
    lead: '镜面 / 泥质充填 / 连续张开',
    details: [{ text: '充填 < 5 mm', emphasis: '5 mm' }, { text: '张开度 1 ~ 5 mm', emphasis: '1 ~ 5 mm' }],
    leadEn: 'Slickensided / gouge / continuous separation',
    detailsEn: [{ text: 'Gouge < 5 mm', emphasis: '5 mm' }, { text: 'Separation 1-5 mm', emphasis: '1-5 mm' }],
  },
  a4_0: {
    lead: '软泥质充填 / 连续张开',
    details: [{ text: '充填 > 5 mm', emphasis: '5 mm' }, { text: '张开度 > 5 mm', emphasis: '5 mm' }],
    leadEn: 'Soft gouge / continuous separation',
    detailsEn: [{ text: 'Gouge > 5 mm', emphasis: '5 mm' }, { text: 'Separation > 5 mm', emphasis: '5 mm' }],
  },
}

function renderA4Detail(detail: A4SummaryDetail) {
  if (!detail.emphasis) return detail.text
  const emphasisStart = detail.text.indexOf(detail.emphasis)
  if (emphasisStart < 0) return detail.text
  return (
    <>
      {detail.text.slice(0, emphasisStart)}
      <strong>{detail.emphasis}</strong>
      {detail.text.slice(emphasisStart + detail.emphasis.length)}
    </>
  )
}

function A4SummaryCell({ optionId, language }: { optionId: string | null; language: 'zh' | 'en' }) {
  const content = optionId ? A4_SUMMARY_CONTENT[optionId] : undefined
  if (!content) return null
  const isEn = language === 'en'
  const details = isEn ? content.detailsEn : content.details
  const leadEmphasis = isEn ? content.leadEnEmphasis : content.leadEmphasis
  return (
    <div className="space-y-1">
      <div className={`${leadEmphasis ? 'font-semibold' : 'font-normal'} leading-snug`}>
        {isEn ? content.leadEn : content.lead}
      </div>
      <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 text-xs leading-snug">
        {details.map((detail) => (
          <span key={detail.text} className="font-normal opacity-90">{renderA4Detail(detail)}</span>
        ))}
      </div>
    </div>
  )
}

/** RMR89 表 A 单个参数：多行指标共用一条评分行，点列即选中该档 */
export default function RmrReferenceTable({
  darkMode,
  language,
  spec,
  selectedId,
  onSelect,
  onSelectCell,
  compactSummary = false,
}: RmrReferenceTableProps) {
  const isEn = language === 'en'
  const border = tableShell(darkMode)
  let selectedColumn = spec.optionIds.findIndex((id) => id != null && id === selectedId)
  if (selectedColumn < 0) {
    for (const row of spec.rows) {
      let column = 0
      for (const cell of row.cells) {
        if (cell.optionId === selectedId) {
          selectedColumn = column
          break
        }
        column += cell.span ?? 1
      }
      if (selectedColumn >= 0) break
    }
  }

  return (
    <div className="space-y-1.5">
      <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{isEn ? spec.captionEn : spec.caption}</div>
      <div className="overflow-x-auto">
        <table className={`w-full min-w-[540px] table-fixed border-collapse border text-sm ${border}`}>
          <colgroup>
            <col className="w-[28%]" />
            {spec.optionIds.map((_, index) => <col key={`option-col-${index}`} />)}
          </colgroup>
          <tbody>
            {spec.rows.map((row, rowIndex) => {
              let column = 0
              return (
                <tr key={row.label}>
                  <th
                    scope="row"
                    className={`border ${border} ${headCell(darkMode)} px-2 py-1.5 text-left font-medium whitespace-nowrap`}
                  >
                    {isEn ? row.labelEn : row.label}
                  </th>
                  {row.cells.map((cell, cellIndex) => {
                    const span = cell.span ?? 1
                    const start = column
                    column += span
                    const covered = spec.optionIds.slice(start, start + span)
                    const isSelected = selectedColumn >= start && selectedColumn < start + span
                    const optionId = cell.optionId ?? covered.find((id) => id != null) ?? null
                    const handleClick = onSelectCell
                      ? () => onSelectCell(rowIndex, start)
                      : onSelect && optionId != null
                        ? () => onSelect(optionId)
                        : undefined
                    return (
                      <td
                        key={`${row.label}-${cellIndex}`}
                        colSpan={span}
                        onClick={handleClick}
                        className={`border ${border} px-2 py-1.5 text-center leading-snug ${
                          isSelected ? selectedCell(darkMode) : bodyCell(darkMode)
                        } ${handleClick ? 'cursor-pointer hover:underline' : ''}`}
                      >
                        {compactSummary
                          ? <A4SummaryCell optionId={optionId} language={language} />
                          : isEn ? cell.textEn : cell.text}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            <tr>
              <th
                scope="row"
                className={`border ${border} ${headCell(darkMode)} px-2 py-1.5 text-left font-medium whitespace-nowrap`}
              >
                {isEn ? 'Rating' : '评分值'}
              </th>
              {spec.scores.map((score, index) => (
                <td
                  key={`score-${index}`}
                  className={`border ${border} px-2 py-1.5 text-center font-semibold tabular-nums ${
                    selectedColumn === index ? selectedCell(darkMode) : bodyCell(darkMode)
                  }`}
                >
                  {score} {isEn ? 'points' : '分'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {(isEn ? spec.footnoteEn : spec.footnote) ? (
        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{isEn ? spec.footnoteEn : spec.footnote}</p>
      ) : null}
    </div>
  )
}

interface DetailRow {
  key: string
  label: string
  labelEn: string
  options: ScoreOption[]
}

interface RmrDetailReferenceTableProps {
  darkMode: boolean
  language: 'zh' | 'en'
  caption: string
  rows: DetailRow[]
  /** 各分项当前选中的选项 id */
  selection: Record<string, string | null>
  onSelect?: (rowKey: string, optionId: string) => void
  footnote?: string
}

const numericDetailRows = new Set(['a4PersistenceId', 'a4ApertureId'])

function detailInputHint(row: DetailRow, language: 'zh' | 'en') {
  if (row.key === 'a4PersistenceId') return language === 'en' ? 'm' : 'm'
  if (row.key === 'a4ApertureId') return language === 'en' ? 'mm' : 'mm'
  return ''
}

function matchNumericOption(row: DetailRow, raw: string) {
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0) return null
  if (row.key === 'a4PersistenceId') {
    if (value < 1) return 'pers_lt1'
    if (value <= 3) return 'pers_1_3'
    if (value <= 10) return 'pers_3_10'
    if (value <= 20) return 'pers_10_20'
    return 'pers_gt20'
  }
  if (value === 0) return 'ap_none'
  if (value < 0.1) return 'ap_lt0_1'
  if (value <= 1) return 'ap_0_1_1'
  if (value <= 5) return 'ap_1_5'
  return 'ap_gt5'
}

function DetailSelectionControls({
  darkMode,
  language,
  rows,
  selection,
  onSelect,
}: Pick<RmrDetailReferenceTableProps, 'darkMode' | 'language' | 'rows' | 'selection' | 'onSelect'>) {
  const isEn = language === 'en'
  const inputCls = `w-full rounded-lg border px-3 py-2 text-sm ${
    darkMode ? 'border-gray-500 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
  }`
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => (
        <label key={row.key} className="block space-y-1">
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {isEn ? row.labelEn : row.label}
          </span>
          {numericDetailRows.has(row.key) ? (
            <div className="relative">
              <input
                aria-label={isEn ? row.labelEn : row.label}
                type="number"
                min="0"
                step="0.01"
                className={`${inputCls} pr-10`}
                placeholder={isEn ? 'Enter value' : '请输入数值'}
                onWheel={preventNumberWheel}
                onKeyDown={preventNumberArrow}
                onChange={(event) => {
                  const optionId = matchNumericOption(row, event.target.value)
                  if (optionId) onSelect?.(row.key, optionId)
                }}
              />
              <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{detailInputHint(row, language)}</span>
            </div>
          ) : (
            <select
              aria-label={isEn ? row.labelEn : row.label}
              className={inputCls}
              value={selection[row.key] ?? ''}
              onChange={(event) => {
                if (event.target.value) onSelect?.(row.key, event.target.value)
              }}
            >
              <option value="">{isEn ? 'Select' : '请选择'}</option>
              {row.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {isEn ? option.labelEn : option.label} · {option.score} {isEn ? 'points' : '分'}
                </option>
              ))}
            </select>
          )}
        </label>
      ))}
    </div>
  )
}

/** RMR89 表 E：每个分项各自一行选项与评分 */
export function RmrDetailReferenceTable({
  darkMode,
  language,
  caption,
  rows,
  selection,
  onSelect,
  footnote,
}: RmrDetailReferenceTableProps) {
  const isEn = language === 'en'
  const border = tableShell(darkMode)
  const columnCount = Math.max(...rows.map((row) => row.options.length))

  return (
    <div className="space-y-1.5">
      <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{caption}</div>
      <DetailSelectionControls
        darkMode={darkMode}
        language={language}
        rows={rows}
        selection={selection}
        onSelect={onSelect}
      />
      <div className="overflow-x-auto">
        <table className={`w-full min-w-[560px] table-fixed border-collapse border text-sm ${border}`}>
          <colgroup>
            <col className="w-[30%]" />
            {Array.from({ length: columnCount }).map((_, index) => <col key={`detail-col-${index}`} />)}
          </colgroup>
          <tbody>
            {rows.map((row) => {
              const selectedId = selection[row.key] ?? null
              return (
                <tr key={row.key}>
                  <th
                    scope="row"
                    className={`border ${border} ${headCell(darkMode)} px-2 py-1.5 text-left font-medium whitespace-nowrap`}
                  >
                    {isEn ? row.labelEn : row.label}
                  </th>
                  {row.options.map((option) => {
                    const isSelected = option.id === selectedId
                    return (
                      <td
                        key={option.id}
                        onClick={onSelect ? () => onSelect(row.key, option.id) : undefined}
                        className={`border ${border} px-2 py-1.5 text-center leading-snug ${
                          isSelected ? selectedCell(darkMode) : bodyCell(darkMode)
                        } ${onSelect ? 'cursor-pointer hover:underline' : ''}`}
                      >
                        <div>{isEn ? option.labelEn : option.label}</div>
                        <div className={`text-[11px] font-semibold tabular-nums ${
                          isSelected ? '' : darkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}
                        >
                          {option.score} {isEn ? 'points' : '分'}
                        </div>
                      </td>
                    )
                  })}
                  {row.options.length < columnCount
                    ? Array.from({ length: columnCount - row.options.length }).map((_, index) => (
                        <td key={`pad-${index}`} className={`border ${border}`} />
                      ))
                    : null}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {footnote ? <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{footnote}</p> : null}
    </div>
  )
}

interface TableBMatrixProps {
  darkMode: boolean
  language: 'zh' | 'en'
  strike: StrikeRelation | null
  dip: DipBand | null
  onSelect: (strike: StrikeRelation, dip: DipBand) => void
}

/** RMR89 表 F：走向与轴线关系 + 倾角 → 隧道利弊等级 */
export function RmrTableBMatrix({ darkMode, language, strike, dip, onSelect }: TableBMatrixProps) {
  const isEn = language === 'en'
  const border = tableShell(darkMode)

  return (
    <div className="space-y-1.5">
      <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {isEn ? 'Table 7 · Effect of discontinuity orientation in tunnels' : '表7 · 结构面方向对隧道的影响'}
      </div>
      <div className="overflow-x-auto">
        <table className={`w-full min-w-[560px] table-fixed border-collapse border text-sm ${border}`}>
          <thead>
            <tr>
              {TABLE_B_GROUPS.map((group) => (
                <th
                  key={group.label}
                  colSpan={group.cells.length}
                  className={`border ${border} ${headCell(darkMode)} px-2 py-1.5 text-center font-medium leading-snug`}
                >
                  {isEn ? group.labelEn : group.label}
                </th>
              ))}
            </tr>
            <tr>
              {TABLE_B_GROUPS.flatMap((group) =>
                group.cells.map((cell) => (
                  <th
                    key={`${cell.strike}-${cell.dip}`}
                    className={`border ${border} ${headCell(darkMode)} px-2 py-1.5 text-center font-normal whitespace-nowrap`}
                  >
                    {isEn ? cell.dipLabelEn : cell.dipLabel}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            <tr>
              {TABLE_B_GROUPS.flatMap((group) =>
                group.cells.map((cell) => {
                  const isSelected = strike === cell.strike && dip === cell.dip
                  return (
                    <td
                      key={`fav-${cell.strike}-${cell.dip}`}
                      onClick={() => onSelect(cell.strike, cell.dip)}
                      className={`border ${border} cursor-pointer px-2 py-2 text-center font-medium hover:underline ${
                        isSelected ? selectedCell(darkMode) : bodyCell(darkMode)
                      }`}
                    >
                      <div>
                        {isEn
                          ? FAVORABILITY_OPTIONS.find((item) => item.id === cell.favorability)?.labelEn
                          : FAVORABILITY_OPTIONS.find((item) => item.id === cell.favorability)?.label}
                      </div>
                      <div className="mt-0.5 text-sm font-semibold tabular-nums">
                        {A6_ADJUSTMENT.tunnel[cell.favorability]} {isEn ? 'points' : '分'}
                      </div>
                    </td>
                  )
                })
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface A6AdjustmentTableProps {
  darkMode: boolean
  language: 'zh' | 'en'
  project: ProjectType | null
  favorability: Favorability | null
  onSelect: (project: ProjectType, favorability: Favorability) => void
}

/** RMR89 表 B：工程类型 × 利弊等级的修正分 */
export function RmrA6AdjustmentTable({ darkMode, language, project, favorability, onSelect }: A6AdjustmentTableProps) {
  const isEn = language === 'en'
  const border = tableShell(darkMode)

  return (
    <div className="space-y-1.5">
      <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {isEn ? 'Table 6 · Rating adjustment for discontinuity orientation' : '表6 · 结构面方向评估修正分'}
      </div>
      <div className="overflow-x-auto">
        <table className={`w-full min-w-[480px] table-fixed border-collapse border text-sm ${border}`}>
          <colgroup>
            <col className="w-[22%]" />
            {FAVORABILITY_OPTIONS.map((option) => <col key={`adjustment-col-${option.id}`} />)}
          </colgroup>
          <thead>
            <tr>
              <th className={`border ${border} ${headCell(darkMode)} px-2 py-1.5 text-left font-medium`}>{isEn ? 'Project type' : '工程类型'}</th>
              {FAVORABILITY_OPTIONS.map((option) => (
                <th
                  key={option.id}
                  className={`border ${border} ${headCell(darkMode)} px-2 py-1.5 text-center font-medium whitespace-nowrap`}
                >
                  {isEn ? option.labelEn : option.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROJECT_TYPES.map((type) => (
              <tr key={type.id}>
                <th
                  scope="row"
                  className={`border ${border} ${headCell(darkMode)} px-2 py-1.5 text-left font-medium whitespace-nowrap`}
                >
                  {isEn ? type.labelEn : type.label}
                </th>
                {FAVORABILITY_OPTIONS.map((option) => {
                  const isSelected = project === type.id && favorability === option.id
                  return (
                    <td
                      key={option.id}
                      onClick={() => onSelect(type.id, option.id)}
                      className={`border ${border} cursor-pointer px-2 py-1.5 text-center font-semibold tabular-nums hover:underline ${
                        isSelected ? selectedCell(darkMode) : bodyCell(darkMode)
                      }`}
                    >
                      {A6_ADJUSTMENT[type.id][option.id]} {isEn ? 'points' : '分'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
