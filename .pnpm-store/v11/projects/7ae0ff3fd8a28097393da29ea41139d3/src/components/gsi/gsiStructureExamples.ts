import type { GsiStructureId } from '../../methods/gsi'

export const GSI_STRUCTURE_IDS = [
  'intact',
  'blocky',
  'very_blocky',
  'blocky_disturbed',
  'disintegrated',
  'laminated',
] as const

export const GSI_STRUCTURE_SKETCH: Record<(typeof GSI_STRUCTURE_IDS)[number], string> = {
  intact: './gsi/structure-intact.png',
  blocky: './gsi/structure-blocky.png',
  very_blocky: './gsi/structure-very_blocky.png',
  blocky_disturbed: './gsi/structure-blocky_disturbed.png',
  disintegrated: './gsi/structure-disintegrated.png',
  laminated: './gsi/structure-laminated.png',
}

const exampleModules = import.meta.glob('../../assets/gsi/examples/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function structureIdFromPath(path: string): (typeof GSI_STRUCTURE_IDS)[number] | null {
  const match = path.replace(/\\/g, '/').match(/\/examples\/([^/]+)\//)
  if (!match) return null
  const id = match[1]
  return GSI_STRUCTURE_IDS.includes(id as (typeof GSI_STRUCTURE_IDS)[number])
    ? (id as (typeof GSI_STRUCTURE_IDS)[number])
    : null
}

export function examplesForStructure(id: Exclude<GsiStructureId, ''>): string[] {
  const photos = Object.entries(exampleModules)
    .filter(([filePath]) => structureIdFromPath(filePath) === id)
    .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))
    .map(([, url]) => url)
  if (photos.length) return photos
  return [GSI_STRUCTURE_SKETCH[id]]
}
