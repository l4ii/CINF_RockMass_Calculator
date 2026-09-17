import { useState } from 'react'
import { ArrowDown, ArrowRight, Plus } from 'lucide-react'
import { Km } from '../math/Katex'
import { SYM } from '../math/symbols'
import {
  GSI_CHART_ISOLINE_VALUES,
  GSI_STRUCTURE_OPTIONS,
  GSI_SURFACE_OPTIONS,
  chartCellGsi,
  chartIsoline,
  chartIsolineDiagonalLabel,
  chartIsolinePickPoints,
  chartPlotPercent,
  locateChartRegion,
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
  chartScaleA: number | null
  chartScaleB: number | null
  onSelect: (next: {
    structureId: Exclude<GsiStructureId, ''>
    surfaceQualityId: Exclude<GsiSurfaceQualityId, ''>
    scaleA: number
    scaleB: number
  }) => void
}

export default function GsiChartPanel({
  darkMode,
  language,
  structureId,
  surfaceQualityId,
  chartScaleA,
  chartScaleB,
  onSelect,
}: GsiChartPanelProps) {
  const en = language === 'en'
  const contours = GSI_CHART_ISOLINE_VALUES.map((gsi) => ({ gsi, line: chartIsoline(gsi) })).filter((item) => item.line)
  const pickPoints = chartIsolinePickPoints()
  const [previewId, setPreviewId] = useState<Exclude<GsiStructureId, ''> | null>(null)
  const preview = GSI_STRUCTURE_OPTIONS.find((item) => item.id === previewId)
  const selected = chartScaleA != null && chartScaleB != null
    ? { scaleA: chartScaleA, scaleB: chartScaleB }
    : structureId && surfaceQualityId
      ? (() => {
          const cell = chartCellGsi(structureId, surfaceQualityId)
          return cell.applicable ? { scaleA: cell.scaleA, scaleB: cell.scaleB } : null
        })()
      : null
  const point = selected ? chartPlotPercent(selected.scaleA, selected.scaleB) : null

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
            gridTemplateColumns: 'minmax(13rem, 1.15fr) repeat(5, minmax(0, 1fr)) 1.5rem',
            gridTemplateRows: 'auto auto repeat(6, minmax(5.5rem, 1fr)) auto',
          }}
        >
          <div className="border border-gray-800 px-2 py-1 leading-snug text-gray-700">
            {en
              ? 'When describing rock-mass structure and surface conditions, select the matching point in the chart below and estimate the average strength index.'
              : '描述岩体结构和表面条件时，在下图中点选对应的点位，估算其平均强度因子。'}
          </div>
          <div className="col-span-5 grid grid-rows-2 border border-l-0 border-gray-800 text-center">
            <div className="flex items-center justify-center px-2 py-1 font-semibold">{en ? 'Joint surface quality' : '结构面质量'}</div>
            <div className="flex items-center justify-center gap-1 border-t border-gray-800 px-3 py-1 font-normal text-gray-700">
              <span>{en ? 'Good to poor' : '由好到差'}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-gray-800" strokeWidth={2} aria-hidden />
            </div>
          </div>
          <div />

          <div className="grid grid-rows-2 border border-t-0 border-gray-800 text-center">
            <div className="flex items-center justify-center px-2 py-1 font-semibold text-gray-800">{en ? 'Rock-mass structure' : '岩体结构'}</div>
            <div className="flex flex-col items-center justify-center gap-0.5 border-t border-gray-800 px-1.5 py-1 font-normal leading-snug text-gray-700">
              <span>{en ? 'Intact to broken' : '由完整到破碎'}</span>
              <ArrowDown className="h-4 w-4 shrink-0 text-gray-800" strokeWidth={2} aria-hidden />
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
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-[1] h-full w-full" aria-hidden>
                    {GSI_STRUCTURE_OPTIONS.map((_, index) => (
                      <line key={`h-${index}`} x1="0" y1={((index + 1) / 6) * 100} x2="100" y2={((index + 1) / 6) * 100} stroke="#d1d5db" strokeWidth="0.35" />
                    ))}
                    {GSI_SURFACE_OPTIONS.map((_, index) => (
                      <line key={`v-${index}`} x1={((index + 1) / 5) * 100} y1="0" x2={((index + 1) / 5) * 100} y2="100" stroke="#d1d5db" strokeWidth="0.35" />
                    ))}
                    {contours.map(({ gsi, line }) => (
                      <polyline
                        key={gsi}
                        data-testid={`gsi-chart-isoline-${gsi}`}
                        points={line!.points.map(([x, y]) => `${x},${y}`).join(' ')}
                        fill="none"
                        stroke="#111827"
                        strokeOpacity="0.8"
                        strokeWidth={gsi % 10 === 0 ? 0.4 : 0.28}
                      />
                    ))}
                  </svg>
                  {contours
                    .filter(({ gsi }) => gsi >= 10 && gsi <= 90 && gsi % 10 === 0)
                    .map(({ gsi }) => {
                      const anchor = chartIsolineDiagonalLabel(gsi)
                      return (
                        <span
                          key={`label-${gsi}`}
                          data-testid={`gsi-chart-isoline-label-${gsi}`}
                          className="pointer-events-none absolute z-[5] bg-white px-0.5 text-[11px] font-semibold tabular-nums leading-none text-gray-900"
                          style={{ left: `${anchor.left}%`, top: `${anchor.top}%`, transform: 'translate(-50%, -50%)' }}
                        >
                          {gsi}
                        </span>
                      )
                    })}
                  <div className="pointer-events-none absolute inset-0 z-[2] grid grid-cols-5 grid-rows-6">
                    {GSI_STRUCTURE_OPTIONS.flatMap((row) =>
                      GSI_SURFACE_OPTIONS.map((surface) => {
                        const cell = chartCellGsi(row.id, surface.id)
                        if (cell.applicable) {
                          return <div key={`${row.id}-${surface.id}`} />
                        }
                        return (
                          <div
                            key={`${row.id}-${surface.id}`}
                            data-testid={`gsi-cell-${row.id}-${surface.id}`}
                            className="flex items-center justify-center bg-gray-200 text-sm font-medium text-gray-500"
                          >
                            N/A
                          </div>
                        )
                      })
                    )}
                  </div>
                  <div className="absolute inset-0 z-[3]">
                    {pickPoints.map(({ scaleA, scaleB, gsi }) => {
                      const pos = chartPlotPercent(scaleA, scaleB)
                      const isSelected = selected?.scaleA === scaleA && selected.scaleB === scaleB
                      const region = locateChartRegion(scaleA, scaleB)
                      return (
                        <button
                          key={`${scaleA}-${scaleB}`}
                          type="button"
                          data-testid={`gsi-chart-tick-${scaleA}-${scaleB}`}
                          aria-label={en ? `GSI ${gsi}, Scale A ${scaleA}, Scale B ${scaleB}` : `GSI ${gsi}，刻度 A ${scaleA}，刻度 B ${scaleB}`}
                          aria-pressed={isSelected}
                          onClick={() => onSelect({ ...region, scaleA, scaleB })}
                          className={`absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border ${
                            isSelected
                              ? 'border-blue-800 bg-blue-500'
                              : 'border-gray-500 bg-white hover:border-blue-600 hover:bg-blue-100'
                          }`}
                          style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
                        />
                      )
                    })}
                  </div>
                  {point ? (
                    <span
                      data-testid="gsi-chart-point"
                      className="pointer-events-none absolute z-[4] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-800 bg-blue-500"
                      style={{ left: `${point.left}%`, top: `${point.top}%` }}
                    />
                  ) : null}
                </div>
              ) : null}
              {rowIndex === 0 ? (
                <div data-testid="gsi-chart-axis-b" className="relative row-span-6 min-h-0 min-w-0 overflow-visible">
                  <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-xs leading-none text-gray-600 [writing-mode:vertical-rl]">
                    <Km math={SYM.ScaleB} />
                  </span>
                </div>
              ) : null}
            </div>
          ))}

          <div className="px-1.5 pt-1 text-gray-500">
            {en ? 'Note: N/A = not applicable.' : '注：N/A 表示不适用。'}
          </div>
          <div data-testid="gsi-chart-axis-a" className="col-span-5 flex items-center justify-center pt-1 text-xs text-gray-600">
            <Km math={SYM.ScaleA} />
          </div>
          <div />
        </div>
      </div>
    </div>
  )
}
