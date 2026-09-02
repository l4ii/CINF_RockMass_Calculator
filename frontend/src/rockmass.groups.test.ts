import { describe, expect, it } from 'vitest'
import { normalizeRockMassGroup, rockMassGroups, withRockMassOreType } from './utils/rockmassCaseStore'

describe('rock-mass groups', () => {
  it('normalizes whitespace and empty values', () => {
    expect(normalizeRockMassGroup('  花岗岩   ')).toBe('花岗岩')
    expect(normalizeRockMassGroup('   ')).toBeUndefined()
  })

  it('writes the same reusable group onto oreType and groupId', () => {
    expect(withRockMassOreType({ oreType: '  花岗岩  ' })).toEqual({ oreType: '花岗岩', groupId: '花岗岩' })
    expect(withRockMassOreType({ name: 'P1' })).toEqual({ name: 'P1' })
  })

  it('deduplicates groups within one project and preserves a stable label', () => {
    expect(rockMassGroups([
      { id: '1', name: 'P1', oreType: '花岗岩', methodId: 'bq', createdAt: '', updatedAt: '' },
      { id: '2', name: 'P2', oreType: ' 花岗岩 ', methodId: 'bq', createdAt: '', updatedAt: '' },
      { id: '3', name: 'P3', oreType: '砂岩', methodId: 'bq', createdAt: '', updatedAt: '' },
    ])).toEqual(['砂岩', '花岗岩'].sort((a, b) => a.localeCompare(b, 'zh-CN')))
  })
})
