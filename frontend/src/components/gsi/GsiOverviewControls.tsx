import { RotateCcw } from 'lucide-react'
import { GSI_GRADES } from '../../methods/gsi'
import {
  DEFAULT_GSI_OVERVIEW_FILTERS,
  GSI_OVERVIEW_PARAMETER_KEYS,
  type GsiOverviewFilters,
  type GsiOverviewParameterKey,
  type GsiOverviewSortKey,
  type SortDirection,
} from '../../utils/gsiOverviewAnalytics'

interface GsiOverviewControlsProps {
  darkMode: boolean
  language: 'zh' | 'en'
  filters: GsiOverviewFilters
  sortKey: GsiOverviewSortKey
  sortDirection: SortDirection
  onFiltersChange: (patch: Partial<GsiOverviewFilters>) => void
  onSortChange: (key: GsiOverviewSortKey, direction: SortDirection) => void
  onClear: () => void
}

export default function GsiOverviewControls({
  darkMode,
  language,
  filters,
  sortKey,
  sortDirection,
  onFiltersChange,
  onSortChange,
  onClear,
}: GsiOverviewControlsProps) {
  const en = language === 'en'
  const border = darkMode ? 'border-gray-600' : 'border-gray-200'
  const input = `rounded-md border px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const label = en
    ? {
        filters: 'Filters & sorting',
        query: 'Point / rock type',
        gsiMin: 'GSI minimum',
        gsiMax: 'GSI maximum',
        grade: 'Class',
        allGrades: 'All classes',
        entry: 'Entry path',
        allEntries: 'All entry paths',
        chart: 'Chart method',
        quantitative: 'Quantitative method',
        parameter: 'Parameter range',
        allParameters: 'No parameter filter',
        min: 'Minimum',
        max: 'Maximum',
        sort: 'Sort by',
        direction: sortDirection === 'asc' ? 'Ascending' : 'Descending',
        include: 'Include incomplete points in analytics',
        clear: 'Clear filters',
      }
    : {
        filters: '筛选与排序',
        query: '点位或矿岩类型',
        gsiMin: 'GSI 最小值',
        gsiMax: 'GSI 最大值',
        grade: '等级',
        allGrades: '全部等级',
        entry: '计算入口',
        allEntries: '全部入口',
        chart: '图表法',
        quantitative: '定量法',
        parameter: '参数范围',
        allParameters: '不按参数筛选',
        min: '最小值',
        max: '最大值',
        sort: '排序字段',
        direction: sortDirection === 'asc' ? '升序' : '降序',
        include: '统计中包含未完成点位',
        clear: '清除筛选',
      }
  const parseNumber = (value: string) => (value === '' ? null : Number.isFinite(Number(value)) ? Number(value) : null)
  const parameterLabel = (key: GsiOverviewParameterKey) => {
    const item = GSI_OVERVIEW_PARAMETER_KEYS.find((option) => option.key === key)
    return item ? (en ? item.labelEn : item.label) : key
  }

  return (
    <section data-testid="gsi-overview-toolbar" aria-label={label.filters} className={`flex flex-wrap items-end gap-2 border-y py-3 ${border}`}>
      <div className="flex min-w-[10rem] flex-1 flex-wrap items-end gap-2">
        <label className="w-40 space-y-1">
          <span className={`text-xs font-medium ${muted}`}>{label.query}</span>
          <input aria-label={label.query} className={`w-full ${input}`} value={filters.query} onChange={(event) => onFiltersChange({ query: event.target.value })} />
        </label>
        <label className="w-24 space-y-1">
          <span className={`text-xs font-medium ${muted}`}>{label.gsiMin}</span>
          <input aria-label={label.gsiMin} type="number" min="0" max="100" className={`w-full ${input}`} value={filters.gsiMin ?? ''} onChange={(event) => onFiltersChange({ gsiMin: parseNumber(event.target.value) })} />
        </label>
        <label className="w-24 space-y-1">
          <span className={`text-xs font-medium ${muted}`}>{label.gsiMax}</span>
          <input aria-label={label.gsiMax} type="number" min="0" max="100" className={`w-full ${input}`} value={filters.gsiMax ?? ''} onChange={(event) => onFiltersChange({ gsiMax: parseNumber(event.target.value) })} />
        </label>
        <label className="w-32 space-y-1">
          <span className={`text-xs font-medium ${muted}`}>{label.grade}</span>
          <select aria-label={label.grade} className={`w-full ${input}`} value={filters.gradeId ?? ''} onChange={(event) => onFiltersChange({ gradeId: event.target.value || null })}>
            <option value="">{label.allGrades}</option>
            {GSI_GRADES.map((grade) => (
              <option key={grade.id} value={grade.id}>{en ? grade.labelEn : grade.label}</option>
            ))}
          </select>
        </label>
        <label className="w-36 space-y-1">
          <span className={`text-xs font-medium ${muted}`}>{label.entry}</span>
          <select aria-label={label.entry} className={`w-full ${input}`} value={filters.entryMode ?? ''} onChange={(event) => onFiltersChange({ entryMode: (event.target.value || null) as GsiOverviewFilters['entryMode'] })}>
            <option value="">{label.allEntries}</option>
            <option value="chart">{label.chart}</option>
            <option value="quantitative">{label.quantitative}</option>
          </select>
        </label>
        <label className="w-44 space-y-1">
          <span className={`text-xs font-medium ${muted}`}>{label.parameter}</span>
          <select
            aria-label={label.parameter}
            className={`w-full ${input}`}
            value={filters.parameterKey ?? ''}
            onChange={(event) => onFiltersChange({ parameterKey: (event.target.value || null) as GsiOverviewParameterKey | null, parameterMin: null, parameterMax: null })}
          >
            <option value="">{label.allParameters}</option>
            {GSI_OVERVIEW_PARAMETER_KEYS.map((item) => (
              <option key={item.key} value={item.key}>{parameterLabel(item.key)}</option>
            ))}
          </select>
        </label>
        {filters.parameterKey ? (
          <>
            <label className="w-24 space-y-1">
              <span className={`text-xs font-medium ${muted}`}>{label.min}</span>
              <input type="number" aria-label={`${label.parameter} ${label.min}`} className={`w-full ${input}`} value={filters.parameterMin ?? ''} onChange={(event) => onFiltersChange({ parameterMin: parseNumber(event.target.value) })} />
            </label>
            <label className="w-24 space-y-1">
              <span className={`text-xs font-medium ${muted}`}>{label.max}</span>
              <input type="number" aria-label={`${label.parameter} ${label.max}`} className={`w-full ${input}`} value={filters.parameterMax ?? ''} onChange={(event) => onFiltersChange({ parameterMax: parseNumber(event.target.value) })} />
            </label>
          </>
        ) : null}
        <label className="w-40 space-y-1">
          <span className={`text-xs font-medium ${muted}`}>{label.sort}</span>
          <select aria-label={label.sort} className={`w-full ${input}`} value={sortKey} onChange={(event) => onSortChange(event.target.value as GsiOverviewSortKey, sortDirection)}>
            <option value="ordinal">{en ? 'Point order' : '点位顺序'}</option>
            <option value="name">{en ? 'Point name' : '点位名称'}</option>
            <option value="oreType">{en ? 'Rock type' : '矿岩类型'}</option>
            <option value="entryMode">{label.entry}</option>
            <option value="gsi">GSI</option>
            <option value="grade">{label.grade}</option>
            {GSI_OVERVIEW_PARAMETER_KEYS.map((item) => (
              <option key={item.key} value={item.key}>{parameterLabel(item.key)}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => onSortChange(sortKey, sortDirection === 'asc' ? 'desc' : 'asc')} className={`self-end rounded-md border px-3 py-2 text-sm font-medium ${border} ${muted}`} aria-label={label.direction}>
          {label.direction}
        </button>
        <label className={`flex items-end gap-2 pb-2 text-xs ${muted}`}>
          <input type="checkbox" checked={filters.includeIncomplete} onChange={(event) => onFiltersChange({ includeIncomplete: event.target.checked })} />
          {label.include}
        </label>
      </div>
      <button
        type="button"
        onClick={onClear}
        disabled={JSON.stringify(filters) === JSON.stringify(DEFAULT_GSI_OVERVIEW_FILTERS) && sortKey === 'ordinal' && sortDirection === 'asc'}
        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium ${border} ${muted}`}
      >
        <RotateCcw className="h-4 w-4" aria-hidden />
        {label.clear}
      </button>
    </section>
  )
}
