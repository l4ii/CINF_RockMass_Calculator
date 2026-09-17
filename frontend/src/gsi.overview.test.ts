import { describe, expect, it } from 'vitest'
import { createInitialGsiState, type GsiFormState } from './methods/gsi'
import type { RockMassCaseRecord, RockMassPointRecord } from './types/rockmassCase'
import { buildGsiCaseSummary } from './utils/gsiCaseSummary'
import {
  DEFAULT_GSI_OVERVIEW_FILTERS,
  applyGsiOverviewFilters,
  gsiChartIsoline,
  gsiChartPoint,
  getGsiOverviewStats,
  sortGsiOverviewRows,
} from './utils/gsiOverviewAnalytics'

function point(id: string, name: string, input: Partial<GsiFormState>, extra: Partial<RockMassPointRecord> = {}): RockMassPointRecord {
  return {
    id,
    name,
    createdAt: '',
    updatedAt: '',
    methodId: 'gsi',
    input: { ...createInitialGsiState(), ...input },
    ...extra,
  }
}

const caseRecord: RockMassCaseRecord = {
  id: 'case',
  name: '工程',
  methodId: 'gsi',
  createdAt: '',
  updatedAt: '',
  points: [
    point('chart', '图表点', { entryMode: 'chart', structureId: 'blocky', surfaceQualityId: 'good' }, { oreType: '花岗岩', note: '拱顶' }),
    point('quant', '定量点', { entryMode: 'quantitative', rqd: 40, jcond89Value: 10 }, { oreType: '板岩' }),
    point('mid', '中等点', { entryMode: 'chart', structureId: 'very_blocky', surfaceQualityId: 'fair' }),
    point('draft', '草稿点', { entryMode: 'chart' }),
  ],
}

describe('GSI overview analytics', () => {
  it('unifies chart and quantitative points onto Scale A/B', () => {
    const summary = buildGsiCaseSummary(caseRecord)
    const chart = summary.rows.find((row) => row.point.id === 'chart')
    const quant = summary.rows.find((row) => row.point.id === 'quant')
    const draft = summary.rows.find((row) => row.point.id === 'draft')
    expect(chart?.gsi).toBe(77.5)
    expect(chart?.scaleA).toBe(37.5)
    expect(chart?.scaleB).toBe(40)
    expect(chart?.structureId).toBe('blocky')
    expect(quant?.gsi).toBe(35)
    expect(quant?.scaleA).toBe(15)
    expect(quant?.scaleB).toBe(20)
    expect(quant?.structureId).toBe('blocky_disturbed')
    expect(quant?.surfaceQualityId).toBe('poor')
    expect(draft?.needsInput).toBe(true)
    expect(draft?.gsi).toBeNull()
    expect(summary.completed).toBe(3)
  })

  it('filters by GSI range, entry path and search', () => {
    const rows = buildGsiCaseSummary(caseRecord).rows
    const byGsi = applyGsiOverviewFilters(rows, { ...DEFAULT_GSI_OVERVIEW_FILTERS, gsiMin: 50 })
    expect(byGsi.map((row) => row.point.id)).toEqual(['chart', 'mid'])
    const byEntry = applyGsiOverviewFilters(rows, { ...DEFAULT_GSI_OVERVIEW_FILTERS, entryMode: 'quantitative' })
    expect(byEntry.map((row) => row.point.id)).toEqual(['quant'])
    const byQuery = applyGsiOverviewFilters(rows, { ...DEFAULT_GSI_OVERVIEW_FILTERS, query: '花岗' })
    expect(byQuery.map((row) => row.point.id)).toEqual(['chart'])
  })

  it('sorts by GSI and reports class / structure stats', () => {
    const rows = buildGsiCaseSummary(caseRecord).rows.filter((row) => !row.needsInput)
    const sorted = sortGsiOverviewRows(rows, 'gsi', 'desc')
    expect(sorted.map((row) => row.point.id)).toEqual(['chart', 'mid', 'quant'])
    const stats = getGsiOverviewStats(rows, false)
    expect(stats.eligible).toBe(3)
    expect(stats.average).toBe(57.5)
    expect(stats.gradeDistribution.find((item) => item.id === 'fair_good')?.count).toBe(1)
    expect(stats.structureDistribution.find((item) => item.id === 'blocky')?.count).toBe(1)
    expect(stats.cloud).toHaveLength(3)
  })

  it('places high Scale A on the left of the GSI chart overlay', () => {
    const high = gsiChartPoint(45, 50)
    const low = gsiChartPoint(0, 0)
    expect(high.x).toBe(0)
    expect(high.y).toBe(0)
    expect(low.x).toBe(100)
    expect(low.y).toBe(100)
    expect(gsiChartIsoline(70)).not.toBeNull()
    expect(gsiChartIsoline(5)?.points).toHaveLength(2)
  })
})
