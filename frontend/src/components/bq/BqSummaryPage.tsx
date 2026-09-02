import { Fragment, useMemo, useState, type KeyboardEvent, type WheelEvent } from 'react'
import { ChevronDown, ChevronUp, Download } from 'lucide-react'
import { Km } from '../math/Katex'
import { SYM } from '../math/symbols'
import BackIconButton from '../BackIconButton'
import type { CustomSummaryPageProps } from '../classification/ClassificationModule'
import { BQ_GRADES, normalizeBqState } from '../../methods/bq'

function numberFromMetric(row: CustomSummaryPageProps['rows'][number], key: string): number | null {
  const value = row.result?.metrics.find((metric) => metric.key === key)?.value
  if (value == null) return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function preventNumberWheel(event: WheelEvent<HTMLInputElement>) {
  // Blurring lets the page keep scrolling while preventing the focused number input from stepping.
  event.currentTarget.blur()
}

function preventNumberArrow(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') event.preventDefault()
}

function numberInputClass(input: string) {
  return `bq-number-input ${input}`
}

function metricText(row: CustomSummaryPageProps['rows'][number], key: string) {
  if (key === 'k1' || key === 'k2' || key === 'k3') {
    const state = rowState(row)
    const requiredStep = key === 'k1' ? 2 : key === 'k2' ? 3 : 4
    if (state.mode !== 'underground' || (state.correctionStep ?? 0) < requiredStep) return '—'
  }
  return row.result?.metrics.find((metric) => metric.key === key)?.value ?? '—'
}

const gradeLabels = ['I', 'II', 'III', 'IV', 'V']
const bqBins = [
  { label: '(-∞,250]', min: -Infinity, max: 250, minExclusive: false },
  { label: '(250,350]', min: 250, max: 350, minExclusive: true },
  { label: '(350,450]', min: 350, max: 450, minExclusive: true },
  { label: '(450,550]', min: 450, max: 550, minExclusive: true },
  { label: '(550,+∞)', min: 550, max: Infinity, minExclusive: true },
]

function rowState(row: CustomSummaryPageProps['rows'][number]) {
  return normalizeBqState(row.point.input)
}

function basicGrade(value: number) {
  if (value > 550) return BQ_GRADES[0]
  if (value > 450) return BQ_GRADES[1]
  if (value > 350) return BQ_GRADES[2]
  if (value > 250) return BQ_GRADES[3]
  return BQ_GRADES[4]
}

function correctedValue(row: CustomSummaryPageProps['rows'][number]) {
  if (!row.result) return null
  const state = rowState(row)
  return state.mode === 'underground' && (state.correctionStep ?? 0) < 4 ? null : row.result.value
}

function overviewValue(row: CustomSummaryPageProps['rows'][number]) {
  return correctedValue(row) ?? numberFromMetric(row, 'basic-bq')
}

function overviewGradeId(row: CustomSummaryPageProps['rows'][number]) {
  const value = overviewValue(row)
  return value == null ? null : basicGrade(value).id
}

function overviewGrade(row: CustomSummaryPageProps['rows'][number], en: boolean) {
  const value = overviewValue(row)
  if (value == null) return '—'
  if (correctedValue(row) != null && row.result) return en ? row.result.gradeEn : row.result.grade
  const grade = basicGrade(value)
  return en ? grade.label.en : grade.label.zh
}

export default function BqSummaryPage({ darkMode, language, methodName, standard, caseRecord, rows, message, onBackToWorkspace, onBackToPoints, onOpenPoint, onOpenExport }: CustomSummaryPageProps) {
  const en = language === 'en'
  const mathHeader = (math: string) => <span aria-hidden="true"><Km math={math} /></span>
  const [query, setQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [minBq, setMinBq] = useState('')
  const [maxBq, setMaxBq] = useState('')
  const [minRc, setMinRc] = useState('')
  const [maxRc, setMaxRc] = useState('')
  const [minKv, setMinKv] = useState('')
  const [maxKv, setMaxKv] = useState('')
  const [minBasicBq, setMinBasicBq] = useState('')
  const [maxBasicBq, setMaxBasicBq] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [sortKey, setSortKey] = useState<'ordinal' | 'name' | 'bq' | 'grade'>('ordinal')
  const [ascending, setAscending] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [scatterKey, setScatterKey] = useState<'rc' | 'kv' | 'basic' | 'engineering'>('rc')
  const border = darkMode ? 'border-gray-700' : 'border-gray-200'
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const text = darkMode ? 'text-gray-200' : 'text-gray-800'
  const link = darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800'
  const input = `rounded-md border px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`
  const bqTableHeaders = en
    ? [
      { key: 'index', label: '#' },
      { key: 'point', label: 'Point' },
      { key: 'note', label: 'Note' },
      { key: 'ore', label: 'Rock type' },
      { key: 'rc', label: mathHeader('R_c') },
      { key: 'kv', label: mathHeader('K_v') },
      { key: 'effective-rc', label: mathHeader('R_c^{*}'), ariaLabel: 'Effective Rc' },
      { key: 'effective-kv', label: mathHeader('K_v^{*}'), ariaLabel: 'Effective Kv' },
      { key: 'basic-bq', label: mathHeader('\\mathrm{BQ}') },
      { key: 'k1', label: mathHeader('K_1'), ariaLabel: 'K1' },
      { key: 'k2', label: mathHeader('K_2'), ariaLabel: 'K2' },
      { key: 'k3', label: mathHeader('K_3'), ariaLabel: 'K3' },
      { key: 'engineering-bq', label: mathHeader('[\\mathrm{BQ}]') },
      { key: 'grade', label: 'Grade' },
      { key: 'details', label: 'Details' },
    ]
    : [
      { key: 'index', label: '序号' },
      { key: 'point', label: '点位名称' },
      { key: 'note', label: '说明' },
      { key: 'ore', label: '岩矿类型' },
      { key: 'rc', label: mathHeader('R_c') },
      { key: 'kv', label: mathHeader('K_v') },
      { key: 'effective-rc', label: mathHeader('R_c^{*}'), ariaLabel: '有效 Rc' },
      { key: 'effective-kv', label: mathHeader('K_v^{*}'), ariaLabel: '有效 Kv' },
      { key: 'basic-bq', label: mathHeader('\\mathrm{BQ}') },
      { key: 'k1', label: mathHeader('K_1'), ariaLabel: 'K1' },
      { key: 'k2', label: mathHeader('K_2'), ariaLabel: 'K2' },
      { key: 'k3', label: mathHeader('K_3'), ariaLabel: 'K3' },
      { key: 'engineering-bq', label: mathHeader('[\\mathrm{BQ}]') },
      { key: 'grade', label: '等级' },
      { key: 'details', label: '详情' },
    ]
  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    const min = minBq === '' ? null : Number(minBq)
    const max = maxBq === '' ? null : Number(maxBq)
    const minRcValue = minRc === '' ? null : Number(minRc)
    const maxRcValue = maxRc === '' ? null : Number(maxRc)
    const minKvValue = minKv === '' ? null : Number(minKv)
    const maxKvValue = maxKv === '' ? null : Number(maxKv)
    const minBasicValue = minBasicBq === '' ? null : Number(minBasicBq)
    const maxBasicValue = maxBasicBq === '' ? null : Number(maxBasicBq)
    return rows.filter((row) => {
      const haystack = `${row.point.name} ${row.point.note ?? ''} ${row.point.oreType ?? ''}`.toLocaleLowerCase()
      const group = (row.point.groupId ?? row.point.oreType ?? '').trim()
      if (groupFilter && group !== groupFilter) return false
      const value = overviewValue(row)
      const rc = numberFromMetric(row, 'rc')
      const kv = numberFromMetric(row, 'kv')
      const basic = numberFromMetric(row, 'basic-bq')
      if (normalized && !haystack.includes(normalized)) return false
      if (min != null && (!Number.isFinite(value) || (value as number) < min)) return false
      if (max != null && (!Number.isFinite(value) || (value as number) > max)) return false
      if (minRcValue != null && (rc == null || rc < minRcValue)) return false
      if (maxRcValue != null && (rc == null || rc > maxRcValue)) return false
      if (minKvValue != null && (kv == null || kv < minKvValue)) return false
      if (maxKvValue != null && (kv == null || kv > maxKvValue)) return false
      if (minBasicValue != null && (basic == null || basic < minBasicValue)) return false
      if (maxBasicValue != null && (basic == null || basic > maxBasicValue)) return false
      if (gradeFilter && overviewGradeId(row) !== gradeFilter) return false
      return true
    }).sort((left, right) => {
      const direction = ascending ? 1 : -1
      if (sortKey === 'name') return direction * left.point.name.localeCompare(right.point.name, undefined, { numeric: true })
      if (sortKey === 'bq') return direction * ((overviewValue(left) ?? -Infinity) - (overviewValue(right) ?? -Infinity))
      if (sortKey === 'grade') return direction * String(overviewGradeId(left) ?? '').localeCompare(String(overviewGradeId(right) ?? ''))
      return direction * (rows.indexOf(left) - rows.indexOf(right))
    })
  }, [ascending, gradeFilter, groupFilter, maxBasicBq, maxBq, maxKv, maxRc, minBasicBq, minBq, minKv, minRc, query, rows, sortKey])
  const groupOptions = useMemo(() => [...new Set(rows.map((row) => (row.point.groupId ?? row.point.oreType ?? '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN')), [rows])
  const validRows = filteredRows.filter((row) => {
    if (!row.result) return false
    const state = rowState(row)
    return state.mode !== 'underground' || (state.correctionStep ?? 0) >= 4
  })
  const mean = validRows.length ? validRows.reduce((sum, row) => sum + (overviewValue(row) ?? 0), 0) / validRows.length : null
  const values = validRows.map((row) => overviewValue(row) ?? 0).sort((a, b) => a - b)
  const median = values.length
    ? values.length % 2
      ? values[Math.floor(values.length / 2)]
      : (values[values.length / 2 - 1] + values[values.length / 2]) / 2
    : null
  const gradeCounts = gradeLabels.map((id) => ({ id, count: validRows.filter((row) => overviewGradeId(row) === id).length }))
  const maxGradeCount = Math.max(1, ...gradeCounts.map((item) => item.count))
  const binCounts = bqBins.map((bin) => ({ ...bin, count: validRows.filter((row) => {
    const value = overviewValue(row) ?? -Infinity
    return (bin.minExclusive ? value > bin.min : value >= bin.min) && value <= bin.max
  }).length }))
  const maxBinCount = Math.max(1, ...binCounts.map((item) => item.count))
  const scatter = validRows.map((row) => ({ row, x: scatterKey === 'engineering' ? overviewValue(row) : scatterKey === 'basic' ? numberFromMetric(row, 'basic-bq') : scatterKey === 'kv' ? numberFromMetric(row, 'kv') : numberFromMetric(row, 'rc'), y: numberFromMetric(row, 'basic-bq') })).filter((item): item is { row: typeof validRows[number]; x: number; y: number } => item.x != null && item.y != null)
  const xValues = scatter.map((item) => item.x)
  const xMin = xValues.length ? Math.min(...xValues) : 0
  const xMax = xValues.length ? Math.max(...xValues) : 1
  const xSpan = xMax - xMin || 1

  return (
    <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="w-full space-y-5">
          <header className="flex items-start gap-2"><BackIconButton label={en ? 'Back to points' : '返回点位列表'} onClick={onBackToPoints} darkMode={darkMode} className="mt-1" /><div className="min-w-0 flex-1"><p className={`text-xs ${muted}`}><button type="button" onClick={onBackToWorkspace} className={link}>{en ? 'Project workspace' : '项目工作区'}</button> / {caseRecord.name} / {en ? 'Project overview' : '工程总览'}</p><div className="mt-1 flex flex-wrap items-end justify-between gap-3"><div><h1 className={`text-2xl font-bold sm:text-3xl ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{en ? 'Project overview' : '工程总览'}</h1><p className={`mt-1 text-sm ${muted}`}>{methodName} · {standard.edition}</p></div><button type="button" onClick={onOpenExport} className={`inline-flex items-center gap-1.5 text-sm font-medium ${link}`}><Download className="h-4 w-4" aria-hidden />{en ? 'Export' : '导出'}</button></div></div></header>
          <section className={`grid grid-cols-2 gap-px overflow-hidden rounded-lg border ${border} ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} lg:grid-cols-5`}>{[[en ? 'Points' : '点位总数', rows.length], [en ? 'Valid' : '有效结果', validRows.length], [en ? 'Mean BQ' : 'BQ 平均值', mean == null ? '—' : mean.toFixed(1)], [en ? 'Median' : '中位数', median == null ? '—' : median.toFixed(1)], [en ? 'Range' : '范围', values.length ? `${values[0].toFixed(1)}–${values[values.length - 1].toFixed(1)}` : '—']].map(([label, value]) => <div key={String(label)} className={`min-w-0 px-4 py-3 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}><div className={`text-xs ${muted}`}>{label}</div><div className={`mt-1 break-words text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{value}</div></div>)}</section>
          <section className={`flex flex-wrap items-end gap-2 border-y py-3 ${border}`}>
            <label className="w-48 space-y-1"><span className={`text-xs font-medium ${muted}`}>{en ? 'Point / rock type' : '点位或岩矿类型'}</span><input className={`w-full ${input}`} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
            <label className="w-28 space-y-1"><span className={`text-xs font-medium ${muted}`}>{en ? 'BQ min' : 'BQ 最小值'}</span><input type="number" onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={numberInputClass(`w-full ${input}`)} value={minBq} onChange={(event) => setMinBq(event.target.value)} /></label>
            <label className="w-28 space-y-1"><span className={`text-xs font-medium ${muted}`}>{en ? 'BQ max' : 'BQ 最大值'}</span><input type="number" onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={numberInputClass(`w-full ${input}`)} value={maxBq} onChange={(event) => setMaxBq(event.target.value)} /></label>
            <label className="w-28 space-y-1"><span className={`text-xs font-medium ${muted}`}>{en ? <><Km math={SYM.Rc} /> min</> : <><Km math={SYM.Rc} /> 最小值</>}</span><input aria-label={en ? 'Rc min' : 'Rc 最小值'} type="number" onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={numberInputClass(`w-full ${input}`)} value={minRc} onChange={(event) => setMinRc(event.target.value)} /></label>
            <label className="w-28 space-y-1"><span className={`text-xs font-medium ${muted}`}>{en ? <><Km math={SYM.Rc} /> max</> : <><Km math={SYM.Rc} /> 最大值</>}</span><input aria-label={en ? 'Rc max' : 'Rc 最大值'} type="number" onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={numberInputClass(`w-full ${input}`)} value={maxRc} onChange={(event) => setMaxRc(event.target.value)} /></label>
            <label className="w-28 space-y-1"><span className={`text-xs font-medium ${muted}`}>{en ? <><Km math={SYM.Kv} /> min</> : <><Km math={SYM.Kv} /> 最小值</>}</span><input aria-label={en ? 'Kv min' : 'Kv 最小值'} type="number" onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={numberInputClass(`w-full ${input}`)} value={minKv} onChange={(event) => setMinKv(event.target.value)} /></label>
            <label className="w-28 space-y-1"><span className={`text-xs font-medium ${muted}`}>{en ? <><Km math={SYM.Kv} /> max</> : <><Km math={SYM.Kv} /> 最大值</>}</span><input aria-label={en ? 'Kv max' : 'Kv 最大值'} type="number" onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={numberInputClass(`w-full ${input}`)} value={maxKv} onChange={(event) => setMaxKv(event.target.value)} /></label>
            <label className="w-28 space-y-1"><span className={`text-xs font-medium ${muted}`}>{en ? 'Basic min' : '基本 BQ 最小'}</span><input type="number" onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={numberInputClass(`w-full ${input}`)} value={minBasicBq} onChange={(event) => setMinBasicBq(event.target.value)} /></label>
            <label className="w-28 space-y-1"><span className={`text-xs font-medium ${muted}`}>{en ? 'Basic max' : '基本 BQ 最大'}</span><input type="number" onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={numberInputClass(`w-full ${input}`)} value={maxBasicBq} onChange={(event) => setMaxBasicBq(event.target.value)} /></label>
            <label className="w-32 space-y-1"><span className={`text-xs font-medium ${muted}`}>{en ? 'Grade' : '等级'}</span><select className={`w-full ${input}`} value={gradeFilter} onChange={(event) => setGradeFilter(event.target.value)}><option value="">{en ? 'All grades' : '全部等级'}</option>{gradeLabels.map((grade) => <option key={grade} value={grade}>{en ? `Class ${grade}` : `${grade} 级`}</option>)}</select></label>
            <label className="w-40 space-y-1"><span className={`text-xs font-medium ${muted}`}>{en ? 'Rock-mass group' : '岩矿类型组'}</span><select aria-label={en ? 'Rock-mass group' : '岩矿类型组'} className={`w-full ${input}`} value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}><option value="">{en ? 'All groups' : '全部分组'}</option>{groupOptions.map((group) => <option key={group} value={group}>{group}</option>)}</select></label>
            <label className="w-40 space-y-1"><span className={`text-xs font-medium ${muted}`}>{en ? 'Sort' : '排序'}</span><select className={`w-full ${input}`} value={sortKey} onChange={(event) => setSortKey(event.target.value as typeof sortKey)}><option value="ordinal">{en ? 'Point order' : '点位顺序'}</option><option value="name">{en ? 'Point name' : '点位名称'}</option><option value="bq">BQ</option><option value="grade">{en ? 'Grade' : '等级'}</option></select></label>
            <button type="button" onClick={() => setAscending((value) => !value)} className={`rounded-md border px-3 py-2 text-sm ${input}`}>{ascending ? (en ? 'Ascending' : '升序') : (en ? 'Descending' : '降序')}</button>
          </section>
          <section><div className="mb-3 flex items-center justify-between gap-3"><div><h2 className={`text-base font-semibold ${text}`}>{en ? 'Point inputs and results' : '点位输入与结果'}</h2><p className={`mt-1 text-xs ${muted}`}>{en ? 'All values are recalculated against GB/T 50218-2014.' : '所有数值按 GB/T 50218-2014 实时重算。'}</p></div>{message ? <p className={`text-sm ${link}`} role="status">{message}</p> : null}</div>{filteredRows.length === 0 ? <div className={`border-y py-10 text-center text-sm ${border} ${muted}`}>{en ? 'No matching points.' : '没有符合条件的点位。'}</div> : <div className={`overflow-x-auto border-y ${border}`}><table className="w-full min-w-[1480px] border-collapse text-sm"><thead className={darkMode ? 'bg-gray-800/70 text-gray-300' : 'bg-gray-100 text-gray-600'}><tr>{bqTableHeaders.map((header) => <th key={header.key} aria-label={header.ariaLabel} className="px-3 py-2.5 text-center text-xs font-medium">{header.label}</th>)}</tr></thead><tbody className={darkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>{filteredRows.map((row, index) => { const open = expanded.has(row.point.id); const toggle = () => setExpanded((current) => { const next = new Set(current); if (next.has(row.point.id)) next.delete(row.point.id); else next.add(row.point.id); return next }) ; const corrected = correctedValue(row); return <Fragment key={row.point.id}><tr className={darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-white'}><td className="px-3 py-2.5 text-center tabular-nums">{index + 1}</td><td className="px-3 py-2.5 text-center"><button type="button" onClick={() => onOpenPoint(row.point.id)} className={`font-medium ${link}`} title={row.point.name}>{row.point.name}</button></td><td className="max-w-[180px] truncate px-3 py-2.5 text-center" title={row.point.note || undefined}>{row.point.note || '—'}</td><td className="max-w-[180px] truncate px-3 py-2.5 text-center" title={row.point.oreType || undefined}>{row.point.oreType || '—'}</td><td className="px-3 py-2.5 text-center tabular-nums">{numberFromMetric(row, 'rc') ?? '—'}</td><td className="px-3 py-2.5 text-center tabular-nums">{numberFromMetric(row, 'kv') ?? '—'}</td><td className="px-3 py-2.5 text-center tabular-nums">{numberFromMetric(row, 'effective-rc') ?? '—'}</td><td className="px-3 py-2.5 text-center tabular-nums">{numberFromMetric(row, 'effective-kv') ?? '—'}</td><td className="px-3 py-2.5 text-center font-semibold tabular-nums">{numberFromMetric(row, 'basic-bq') ?? '—'}</td><td className="px-3 py-2.5 text-center tabular-nums">{metricText(row, 'k1')}</td><td className="px-3 py-2.5 text-center tabular-nums">{metricText(row, 'k2')}</td><td className="px-3 py-2.5 text-center tabular-nums">{metricText(row, 'k3')}</td><td className={`px-3 py-2.5 text-center font-semibold tabular-nums ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{corrected ?? '—'}</td><td className="px-3 py-2.5 text-center">{overviewGrade(row, en)}</td><td className="px-3 py-2.5 text-center"><button type="button" onClick={toggle} aria-expanded={open} className={`inline-flex h-8 w-8 items-center justify-center ${link}`} title={open ? (en ? 'Hide details' : '隐藏详情') : (en ? 'Show details' : '显示详情')}>{open ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}</button></td></tr>{open ? <tr><td colSpan={15} className={`px-3 py-3 ${darkMode ? 'bg-gray-900/40' : 'bg-gray-50/80'}`}><div className="overflow-x-auto"><table className={`w-full min-w-[700px] border-collapse border text-xs ${border}`}><thead className={darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}><tr><th className="border px-2 py-1.5 text-left">{en ? 'Parameter' : '参数'}</th><th className="border px-2 py-1.5 text-left">{en ? 'Value' : '数值'}</th><th className="border px-2 py-1.5 text-left">{en ? 'Basis' : '依据'}</th></tr></thead><tbody>{row.descriptions.map((description) => <tr key={description.key}><td className="border px-2 py-1.5 font-medium">{en ? description.labelEn : description.label}</td><td className="border px-2 py-1.5">{en ? description.valueEn ?? description.value : description.value}</td><td className={`border px-2 py-1.5 ${muted}`}>{en ? description.scoreEn ?? description.score : description.score}</td></tr>)}</tbody></table></div></td></tr> : null}</Fragment> })}</tbody></table></div>}</section>
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2"><div className={`rounded-lg border p-4 ${border} ${darkMode ? 'bg-gray-800/60' : 'bg-white'}`}><h3 className={`mb-3 text-sm font-semibold ${text}`}>{en ? 'Grade distribution' : '等级分布'}</h3><div className="space-y-2">{gradeCounts.map((item) => <div key={item.id}><div className={`mb-1 flex justify-between text-xs ${muted}`}><span>{en ? `Class ${item.id}` : `${item.id} 级`}</span><span>{item.count}</span></div><div className={`h-3 overflow-hidden rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}><div className="h-full rounded bg-blue-500" style={{ width: `${(item.count / maxGradeCount) * 100}%` }} /></div></div>)}</div></div><div className={`rounded-lg border p-4 ${border} ${darkMode ? 'bg-gray-800/60' : 'bg-white'}`}><h3 className={`mb-3 text-sm font-semibold ${text}`}>{en ? 'BQ range distribution' : 'BQ 区间分布'}</h3><div className="flex h-36 items-end gap-2">{binCounts.map((item) => <div key={item.label} className="flex min-w-0 flex-1 flex-col justify-end text-center"><span className={`mb-1 text-[10px] ${muted}`}>{item.count || ''}</span><span className="block min-h-[2px] w-full rounded-t bg-emerald-500" style={{ height: `${(item.count / maxBinCount) * 100}%` }} /><span className={`mt-1 text-[10px] ${muted}`}>{item.label}</span></div>)}</div></div><div className={`rounded-lg border p-4 ${border} ${darkMode ? 'bg-gray-800/60' : 'bg-white'}`}><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className={`text-sm font-semibold ${text}`}>{en ? 'Parameter / BQ relationship' : '参数与 BQ 关系'}</h3><select className={`rounded-md border px-2 py-1 text-xs ${border} ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-800'}`} value={scatterKey} onChange={(event) => setScatterKey(event.target.value as typeof scatterKey)}><option value="rc">Rc</option><option value="kv">Kv</option><option value="basic">Basic BQ</option><option value="engineering">[BQ]</option></select></div>{scatter.length ? <svg viewBox="0 0 520 190" className="h-44 w-full" role="img" aria-label={en ? 'Parameter and BQ relationship' : '参数与 BQ 关系'}><line x1="40" y1="10" x2="40" y2="160" stroke="currentColor" opacity="0.25" /><line x1="40" y1="160" x2="510" y2="160" stroke="currentColor" opacity="0.25" />{scatter.map((item) => { const cx = 45 + ((item.x - xMin) / xSpan) * 455; const cy = 160 - (item.y / 700) * 145; return <circle key={item.row.point.id} cx={cx} cy={cy} r="5" fill="#2563eb"><title>{item.row.point.name}: {item.x}, BQ {item.y}</title></circle> })}</svg> : <p className={`py-12 text-center text-sm ${muted}`}>{en ? 'No pairs in the current selection.' : '当前筛选没有可绘制数据。'}</p>}</div><div className={`rounded-lg border p-4 ${border} ${darkMode ? 'bg-gray-800/60' : 'bg-white'}`}><h3 className={`mb-3 text-sm font-semibold ${text}`}>{en ? 'Basic versus corrected BQ' : '基本 BQ 与修正 BQ 对比'}</h3><div className="space-y-3">{validRows.slice(0, 8).map((row) => { const basic = numberFromMetric(row, 'basic-bq') ?? 0; const final = correctedValue(row); return <div key={row.point.id}><div className={`mb-1 flex justify-between text-xs ${muted}`}><span className="truncate">{row.point.name}</span><span className="tabular-nums">{basic.toFixed(1)} / {final == null ? '—' : final.toFixed(1)}</span></div><div className={`relative h-3 overflow-hidden rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}><div className="absolute inset-y-0 left-0 rounded bg-blue-500" style={{ width: `${Math.min(100, (basic / 700) * 100)}%` }} />{final == null ? null : <div className="absolute inset-y-0 left-0 rounded bg-amber-500/80" style={{ width: `${Math.min(100, (final / 700) * 100)}%` }} />}</div></div> })}</div></div></section>
        </div>
      </div>
    </div>
  )
}
