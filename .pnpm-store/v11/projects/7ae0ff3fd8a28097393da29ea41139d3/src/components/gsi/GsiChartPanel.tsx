import { useState } from 'react'
import { ArrowDown, ArrowRight, Plus } from 'lucide-react'
import {
  GSI_STRUCTURE_OPTIONS,
  GSI_SURFACE_OPTIONS,
  chartCellGsi,
  type GsiSurfaceQualityId,
  type GsiStructureId,
} from '../../methods/gsi'
import GsiStructureExampleDialog from './GsiStructureExampleDialog'
import { examplesForStructure, GSI_STRUCTURE_SKETCH } from './gsiStructureExamples'

interface GsiChartPanelProps {
  darkMode: boolean
  language: 'zh' | 'en'
  structureId: GsiStructureId
  surfaceQualityId: GsiSurfaceQualityId
  onSelect: (structureId: Exclude<GsiStructureId, ''>, surfaceQualityId: Exclude<GsiSurfaceQualityId, ''>) => void
}

/** Column-boundary ticks: 5 boxes → 6 edges. */
const SCALE_A_EDGE_TICKS = [45, 36, 27, 18, 9, 0] as const
/** One value per structure row, aligned to that row. */
const SCALE_B_ROW_TICKS = [50, 40, 30, 20, 10, 0] as const

function uniquePoints(points: Array<[number, number]>) {
  const seen = new Set<string>()
  const out: Array<[number, number]> = []
  for (const [x, y] of points) {
    const key = `${x.toFixed(2)},${y.toFixed(2)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push([x, y])
  }
  return out
}

function isoline(gsi: number) {
  const candidates: Array<[number, number]> = []
  const add = (scaleA: number, scaleB: number) => {
    if (scaleA < -0.05 || scaleA > 45.05 || scaleB < -0.05 || scaleB > 50.05) return
    candidates.push([((45 - scaleA) / 45) * 100, ((50 - scaleB) / 50) * 100])
  }
  add(45, gsi - 45)
  add(0, gsi)
  add(gsi - 50, 50)
  add(gsi, 0)
  const pts = uniquePoints(candidates)
  if (pts.length < 2) return null
  return { x1: pts[0][0], y1: pts[0][1], x2: pts[1][0], y2: pts[1][1], mx: (pts[0][0] + pts[1][0]) / 2, my: (pts[0][1] + pts[1][1]) / 2 }
}

export default function GsiChartPanel({ darkMode, language, structureId, surfaceQualityId, onSelect }: GsiChartPanelProps) {
  const en = language === 'en'
  const contourValues = [90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10]
  const contours = contourValues.map((gsi) => ({ gsi, line: isoline(gsi) })).filter((item) => item.line)
  const [previewId, setPreviewId] = useState<Exclude<GsiStructureId, ''> | null>(null)
  const preview = GSI_STRUCTURE_OPTIONS.find((item) => item.id === previewId)

  return (
    <div data-testid="gsi-chart" data-field="structureId" className="w-full">
      {preview ? (
        <GsiStructureExampleDialog
          language={language}
          title={en ? preview.labelEn : preview.label}
          description={en ? preview.descriptionEn : preview.description}
          images={examplesForStructure(preview.id)}
          onClose={() => setPreviewId(null)}
        />
      ) : null}
      <div className={`w-full rounded-lg border bg-white p-1.5 text-gray-900 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
        <h3 className="mb-1 text-center text-sm font-semibold tracking-wide">
          {en ? 'Geological Strength Index (GSI) for jointed rock masses' : '节理岩体地质强度指标（GSI）'}
        </h3>
        <div
          className="grid w-full text-sm leading-snug"
          style={{
            gridTemplateColumns: 'minmax(13rem, 1.15fr) repeat(5, minmax(0, 1fr)) 1.35rem',
            gridTemplateRows: 'auto auto repeat(6, minmax(5.5rem, 1fr)) auto',
          }}
        >
          <div className="border border-gray-800 px-2 py-1 leading-snug text-gray-700">
            {en
              ? 'When describing rock-mass structure and surface conditions, select the matching cell in the table below and estimate the average strength index.'
              : '描述岩体的构造和表面条件时，在下表中选择一个对应的方块，估算其平均强度因子。'}
          </div>
          <div className="col-span-5 grid grid-rows-2 border border-l-0 border-gray-800 text-center">
            <div className="flex items-center justify-center px-2 py-1 font-semibold">{en ? 'Surface conditions' : '表面条件'}</div>
            <div className="flex items-center justify-center gap-1 border-t border-gray-800 px-3 py-1 font-normal text-gray-700">
              <span>{en ? 'Decreasing surface quality' : '表面质量下降'}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-gray-800" strokeWidth={2} aria-hidden />
            </div>
          </div>
          <div />

          <div className="grid grid-rows-2 border border-t-0 border-gray-800 text-center">
            <div className="flex items-center justify-center px-2 py-1 font-semibold text-gray-800">{en ? 'Structure' : '构造'}</div>
            <div className="flex flex-col items-center justify-center gap-0.5 border-t border-gray-800 px-1.5 py-1 font-normal leading-snug text-gray-700">
              <span>{en ? 'Decreasing interlocking of rock pieces' : '岩块之间的黏结作用降低'}</span>
              <ArrowDown className="h-4 w-4 text-gray-800" strokeWidth={2} aria-hidden />
            </div>
          </div>
          {GSI_SURFACE_OPTIONS.map((surface) => (
            <div key={surface.id} className="border border-l-0 border-t-0 border-gray-800 px-1 py-1 text-center">
              <div className="font-semibold">{en ? surface.labelEn : surface.label}</div>
              <div className="mt-0.5 leading-snug text-gray-600">{en ? surface.descriptionEn : surface.description}</div>
            </div>
          ))}
          <div />

          {GSI_STRUCTURE_OPTIONS.map((structure, rowIndex) => (
            <div key={structure.id} className="contents">
              <div className="flex h-full min-h-0 items-center gap-1.5 border border-t-0 border-gray-800 px-1.5 py-1">
                <button
                  type="button"
                  data-testid={`gsi-structure-sketch-${structure.id}`}
                  aria-label={en ? structure.labelEn : structure.label}
                  onClick={() => setPreviewId(structure.id)}
                  className="group relative h-10 w-10 shrink-0 cursor-pointer border border-gray-300 bg-white"
                >
                  <img src={GSI_STRUCTURE_SKETCH[structure.id]} alt="" className="h-full w-full object-contain" />
                  <span className="pointer-events-none absolute right-0 top-0 grid h-3.5 w-3.5 place-items-center bg-gray-800/80 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Plus className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
                  </span>
                </button>
                <div className="min-w-0">
                  <div className="font-semibold leading-snug">{en ? structure.labelEn : structure.label}</div>
                  <p className="mt-0.5 leading-snug text-gray-600">{en ? structure.descriptionEn : structure.description}</p>
                </div>
              </div>
              {rowIndex === 0 ? (
                <div className="relative col-span-5 row-span-6 min-h-0 border border-l-0 border-t-0 border-gray-800">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
                    {GSI_STRUCTURE_OPTIONS.map((_, index) => (
                      <line key={`h-${index}`} x1="0" y1={((index + 1) / 6) * 100} x2="100" y2={((index + 1) / 6) * 100} stroke="#d1d5db" strokeWidth="0.35" />
                    ))}
                    {GSI_SURFACE_OPTIONS.map((_, index) => (
                      <line key={`v-${index}`} x1={((index + 1) / 5) * 100} y1="0" x2={((index + 1) / 5) * 100} y2="100" stroke="#d1d5db" strokeWidth="0.35" />
                    ))}
                    {contours.map(({ gsi, line }) => (
                      <line
                        key={gsi}
                        x1={line!.x1}
                        y1={line!.y1}
                        x2={line!.x2}
                        y2={line!.y2}
                        stroke="#111827"
                        strokeOpacity="0.8"
                        strokeWidth={gsi % 10 === 0 ? 0.4 : 0.28}
                      />
                    ))}
                  </svg>
                  {contours
                    .filter(({ gsi }) => gsi % 10 === 0)
                    .map(({ gsi, line }) => (
                    <span
                      key={`label-${gsi}`}
                      className="pointer-events-none absolute z-[1] bg-white px-0.5 text-sm font-semibold tabular-nums text-gray-900"
                      style={{ left: `${line!.mx}%`, top: `${line!.my}%`, transform: 'translate(-50%, -50%)' }}
                    >
                      {gsi}
                    </span>
                  ))}
                  <div className="absolute inset-0 z-[2] grid grid-cols-5 grid-rows-6">
                    {GSI_STRUCTURE_OPTIONS.flatMap((row) =>
                      GSI_SURFACE_OPTIONS.map((surface) => {
                        const cell = chartCellGsi(row.id, surface.id)
                        const isSelected = structureId === row.id && surfaceQualityId === surface.id
                        if (!cell.applicable) {
                          return (
                            <div
                              key={`${row.id}-${surface.id}`}
                              data-testid={`gsi-cell-${row.id}-${surface.id}`}
                              className="flex items-center justify-center bg-gray-200 text-sm font-medium text-gray-500"
                            >
                              N/A
                            </div>
                          )
                        }
                        return (
                          <button
                            key={`${row.id}-${surface.id}`}
                            type="button"
                            data-testid={`gsi-cell-${row.id}-${surface.id}`}
                            aria-label={`${en ? row.labelEn : row.label} × ${en ? surface.labelEn : surface.label}, GSI ${cell.gsi}`}
                            aria-pressed={isSelected}
                            onClick={() => onSelect(row.id, surface.id)}
                            className={`min-h-0 min-w-0 ${isSelected ? 'bg-blue-600/25 ring-2 ring-inset ring-blue-700' : 'bg-transparent hover:bg-blue-500/10'}`}
                          />
                        )
                      })
                    )}
                  </div>
                </div>
              ) : null}
              <div className="flex items-center justify-end pr-0.5 text-sm tabular-nums text-gray-600">
                {SCALE_B_ROW_TICKS[rowIndex]}
              </div>
            </div>
          ))}

          <div className="px-1.5 pt-1 text-gray-500">
            {en ? 'Note: N/A = not applicable.' : '注：N/A 表示不适用。'}
          </div>
          <div className="relative col-span-5 pt-1">
            <div className="relative h-4">
              {SCALE_A_EDGE_TICKS.map((tick, index) => {
                const last = SCALE_A_EDGE_TICKS.length - 1
                const shift = index === 0 ? '' : index === last ? '-translate-x-full' : '-translate-x-1/2'
                return (
                  <span
                    key={tick}
                    className={`absolute top-0 tabular-nums text-gray-600 ${shift}`}
                    style={{ left: `${(index / last) * 100}%` }}
                  >
                    {tick}
                  </span>
                )
              })}
            </div>
          </div>
          <div />
        </div>
      </div>
    </div>
  )
}
