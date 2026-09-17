import { useState } from 'react'
import { ArrowDown, ArrowRight, Plus } from 'lucide-react'
import { Km } from '../math/Katex'
import { SYM } from '../math/symbols'
import {
  GSI_QUANT_SCALE_A_MAX,
  GSI_QUANT_SCALE_A_POINTS,
  GSI_QUANT_SCALE_A_TICKS,
  GSI_QUANT_SCALE_B_MAX,
  GSI_QUANT_SCALE_B_POINTS,
  GSI_QUANT_SCALE_B_TICKS,
  GSI_QUANT_STRUCTURE_OPTIONS,
  GSI_QUANT_SURFACE_OPTIONS,
  locateQuantitativePoint,
  quantitativeChartPercent,
  type GsiQuantStructureId,
} from '../../methods/gsi'
import GsiStructureExampleDialog from './GsiStructureExampleDialog'
import { examplesForStructure, GSI_STRUCTURE_SKETCH } from './gsiStructureExamples'

interface GsiQuantitativeChartPanelProps {
  darkMode: boolean
  language: 'zh' | 'en'
  jcond89: number | null
  rqd: number | null
  chartScaleA: number | null
  chartScaleB: number | null
  onSelect: (scaleA: number, scaleB: number) => void
}

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
    if (scaleA < -0.05 || scaleA > GSI_QUANT_SCALE_A_MAX + 0.05 || scaleB < -0.05 || scaleB > GSI_QUANT_SCALE_B_MAX + 0.05) return
    candidates.push([((GSI_QUANT_SCALE_A_MAX - scaleA) / GSI_QUANT_SCALE_A_MAX) * 100, ((GSI_QUANT_SCALE_B_MAX - scaleB) / GSI_QUANT_SCALE_B_MAX) * 100])
  }
  add(GSI_QUANT_SCALE_A_MAX, gsi - GSI_QUANT_SCALE_A_MAX)
  add(0, gsi)
  add(gsi - GSI_QUANT_SCALE_B_MAX, GSI_QUANT_SCALE_B_MAX)
  add(gsi, 0)
  const pts = uniquePoints(candidates)
  if (pts.length < 2) return null
  return { x1: pts[0][0], y1: pts[0][1], x2: pts[1][0], y2: pts[1][1], mx: (pts[0][0] + pts[1][0]) / 2, my: (pts[0][1] + pts[1][1]) / 2 }
}

export default function GsiQuantitativeChartPanel({ darkMode, language, jcond89, rqd, chartScaleA, chartScaleB, onSelect }: GsiQuantitativeChartPanelProps) {
  const en = language === 'en'
  const contourValues = [80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5]
  const contours = contourValues.map((gsi) => ({ gsi, line: isoline(gsi) })).filter((item) => item.line)
  const [previewId, setPreviewId] = useState<GsiQuantStructureId | null>(null)
  const preview = GSI_QUANT_STRUCTURE_OPTIONS.find((item) => item.id === previewId)
  const jcondReady = jcond89 != null && jcond89 >= 0 && jcond89 <= 30
  const rqdReady = rqd != null && rqd >= 0 && rqd <= 100
  const selected = chartScaleA != null && chartScaleB != null
    ? { scaleA: chartScaleA, scaleB: chartScaleB }
    : jcondReady && rqdReady
      ? locateQuantitativePoint(jcond89, rqd)
      : null
  const point = selected ? quantitativeChartPercent(selected.scaleA, selected.scaleB) : null
  const selectedBox = point

  return (
    <div data-testid="gsi-quantitative-chart" className="w-full">
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
          {en ? 'Geological Strength Index (GSI) for jointed blocky rock masses' : '节理块状岩体地质强度指标（GSI）'}
        </h3>
        <div
          className="grid w-full text-sm leading-snug"
          style={{
            gridTemplateColumns: 'minmax(13rem, 1.15fr) repeat(5, minmax(0, 1fr)) 1.5rem',
            gridTemplateRows: 'auto auto repeat(4, minmax(5.5rem, 1fr)) auto',
          }}
        >
          <div className="border border-gray-800 px-2 py-1 leading-snug text-gray-700">
            {en
              ? 'When describing rock-mass structure and surface conditions, select the matching point in the chart below and estimate the average strength index.'
              : '描述岩体的构造和表面条件时，在下图中点选对应的点位，估算其平均强度因子。'}
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
            <div className="flex flex-col items-center justify-center gap-0.5 border-t border-gray-800 px-1.5 py-1 font-normal text-gray-700">
              <span>{en ? 'Intact to broken' : '由完整到破碎'}</span>
              <ArrowDown className="h-4 w-4 shrink-0 text-gray-800" strokeWidth={2} aria-hidden />
            </div>
          </div>
          {GSI_QUANT_SURFACE_OPTIONS.map((surface) => (
            <div key={surface.id} className="border border-l-0 border-t-0 border-gray-800 px-1 py-1 text-center">
              <div className="font-semibold">{en ? surface.labelEn : surface.label}</div>
              <div className="mt-0.5 leading-snug text-gray-600">{en ? surface.descriptionEn : surface.description}</div>
            </div>
          ))}
          <div
            data-testid="gsi-quant-axis-b"
            className="relative min-w-0 overflow-visible"
          >
            <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] leading-none text-gray-600 [writing-mode:vertical-rl]">
              <Km math={SYM.RQD_over_2} />
            </span>
          </div>

          {GSI_QUANT_STRUCTURE_OPTIONS.map((structure, rowIndex) => (
            <div key={structure.id} className="contents">
              <div className="flex h-full min-h-0 items-center gap-1.5 border border-t-0 border-gray-800 px-1.5 py-1">
                <button
                  type="button"
                  data-testid={`gsi-quant-structure-sketch-${structure.id}`}
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
                <div className="relative col-span-5 row-span-4 min-h-0 border border-l-0 border-t-0 border-gray-800">
                  {GSI_QUANT_SCALE_A_TICKS.filter((tick) => tick > 0 && tick < GSI_QUANT_SCALE_A_MAX).map((tick) => (
                    <span
                      key={`grid-a-${tick}`}
                      data-testid={`gsi-quant-grid-a-${tick}`}
                      className="pointer-events-none absolute top-0 z-[1] h-full w-px -translate-x-1/2 border-l border-dashed border-gray-400"
                      style={{ left: `${((GSI_QUANT_SCALE_A_MAX - tick) / GSI_QUANT_SCALE_A_MAX) * 100}%` }}
                    />
                  ))}
                  {GSI_QUANT_SCALE_B_TICKS.filter((tick) => tick > 0 && tick < GSI_QUANT_SCALE_B_MAX).map((tick) => (
                    <span
                      key={`grid-b-${tick}`}
                      data-testid={`gsi-quant-grid-b-${tick}`}
                      className="pointer-events-none absolute left-0 z-[1] h-px w-full -translate-y-1/2 border-t border-dashed border-gray-400"
                      style={{ top: `${((GSI_QUANT_SCALE_B_MAX - tick) / GSI_QUANT_SCALE_B_MAX) * 100}%` }}
                    />
                  ))}
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-[1] h-full w-full" aria-hidden>
                    {contours.map(({ gsi, line }) => (
                      <line
                        key={gsi}
                        data-testid={`gsi-quant-isoline-${gsi}`}
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
                  {selectedBox ? (
                    <span
                      data-testid="gsi-quant-selection"
                      className="pointer-events-none absolute z-[2] -translate-x-1/2 -translate-y-1/2 rounded-sm bg-sky-400/20 ring-1 ring-sky-400/70"
                      style={{
                        left: `${selectedBox.left}%`,
                        top: `${selectedBox.top}%`,
                        width: `${100 / GSI_QUANT_SCALE_A_MAX}%`,
                        height: `${100 / GSI_QUANT_SCALE_B_MAX}%`,
                      }}
                    />
                  ) : null}
                  <div className="absolute inset-0 z-[2]">
                    {GSI_QUANT_SCALE_B_POINTS.flatMap((scaleB) =>
                      GSI_QUANT_SCALE_A_POINTS.map((scaleA) => {
                        const pos = quantitativeChartPercent(scaleA, scaleB)
                        const isSelected = selected?.scaleA === scaleA && selected.scaleB === scaleB
                        return (
                          <button
                            key={`${scaleA}-${scaleB}`}
                            type="button"
                            data-testid={`gsi-quant-tick-${scaleA}-${scaleB}`}
                            aria-label={en ? `Scale A ${scaleA}, Scale B ${scaleB}` : `刻度 A ${scaleA}，刻度 B ${scaleB}`}
                            aria-pressed={isSelected}
                            onClick={() => onSelect(scaleA, scaleB)}
                            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 bg-transparent hover:bg-blue-500/10"
                            style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
                          />
                        )
                      })
                    )}
                  </div>
                  {point ? (
                    <span
                      data-testid="gsi-quant-point"
                      className="pointer-events-none absolute z-[3] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-800 bg-blue-500"
                      style={{ left: `${point.left}%`, top: `${point.top}%` }}
                    />
                  ) : null}
                </div>
              ) : null}
              {rowIndex === 0 ? (
                <div data-testid="gsi-quant-scale-b" className="relative row-span-4 min-h-0 min-w-0">
                  {GSI_QUANT_SCALE_B_TICKS.filter((tick) => tick !== 0).map((tick) => (
                    <span
                      key={tick}
                      className={`absolute right-0 text-xs tabular-nums text-gray-600 ${tick === GSI_QUANT_SCALE_B_MAX ? '' : '-translate-y-1/2'}`}
                      style={{ top: `${((GSI_QUANT_SCALE_B_MAX - tick) / GSI_QUANT_SCALE_B_MAX) * 100}%` }}
                    >
                      {tick}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}

          <div data-testid="gsi-quant-axis-a" className="flex items-center justify-center px-1 pt-1 text-xs text-gray-600">
            <Km math={SYM.JCond89_scaled} />
          </div>
          <div data-testid="gsi-quant-scale-a" className="relative col-span-5 pt-1">
            <div className="relative h-4">
              {GSI_QUANT_SCALE_A_TICKS.filter((tick) => tick !== 0).map((tick) => {
                const shift = tick === GSI_QUANT_SCALE_A_MAX ? '' : '-translate-x-1/2'
                return (
                  <span
                    key={tick}
                    className={`absolute top-0 text-xs tabular-nums text-gray-600 ${shift}`}
                    style={{ left: `${((GSI_QUANT_SCALE_A_MAX - tick) / GSI_QUANT_SCALE_A_MAX) * 100}%` }}
                  >
                    {tick}
                  </span>
                )
              })}
            </div>
          </div>
          <div className="pt-1 text-xs tabular-nums text-gray-600">0</div>
        </div>
      </div>
    </div>
  )
}
