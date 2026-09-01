import { useState } from 'react'
import { ArrowDown, ArrowRight, Plus } from 'lucide-react'
import {
  GSI_QUANT_SCALE_A_MAX,
  GSI_QUANT_SCALE_A_TICKS,
  GSI_QUANT_SCALE_B_MAX,
  GSI_QUANT_SCALE_B_TICKS,
  GSI_QUANT_STRUCTURE_OPTIONS,
  GSI_QUANT_SURFACE_OPTIONS,
  GSI_QUANT_TICK_COLS,
  GSI_QUANT_TICK_ROWS,
  GSI_QUANT_TICK_STEP,
  locateQuantitativeTickCell,
  quantitativeTickFill,
  type GsiQuantStructureId,
} from '../../methods/gsi'
import GsiStructureExampleDialog from './GsiStructureExampleDialog'
import { examplesForStructure, GSI_STRUCTURE_SKETCH } from './gsiStructureExamples'

interface GsiQuantitativeChartPanelProps {
  darkMode: boolean
  language: 'zh' | 'en'
  jcond89: number | null
  rqd: number | null
  onSelect: (jcond89: number, rqd: number) => void
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

export default function GsiQuantitativeChartPanel({ darkMode, language, jcond89, rqd, onSelect }: GsiQuantitativeChartPanelProps) {
  const en = language === 'en'
  const contourValues = [80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10]
  const contours = contourValues.map((gsi) => ({ gsi, line: isoline(gsi) })).filter((item) => item.line)
  const [previewId, setPreviewId] = useState<GsiQuantStructureId | null>(null)
  const preview = GSI_QUANT_STRUCTURE_OPTIONS.find((item) => item.id === previewId)
  const jcondReady = jcond89 != null && jcond89 >= 0 && jcond89 <= 30
  const rqdReady = rqd != null && rqd >= 0 && rqd <= 100
  const selected = jcondReady && rqdReady ? locateQuantitativeTickCell(jcond89, rqd) : null
  const point = jcondReady && rqdReady
    ? {
        left: ((GSI_QUANT_SCALE_A_MAX - Math.min(GSI_QUANT_SCALE_A_MAX, Math.max(0, 1.5 * jcond89))) / GSI_QUANT_SCALE_A_MAX) * 100,
        top: ((GSI_QUANT_SCALE_B_MAX - Math.min(GSI_QUANT_SCALE_B_MAX, Math.max(0, rqd / 2))) / GSI_QUANT_SCALE_B_MAX) * 100,
      }
    : null

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
              ? 'When describing rock-mass structure and surface conditions, select the matching cell in the table below and estimate the average strength index.'
              : '描述岩体的构造和表面条件时，在下表中选择一个对应的方块，估算其平均强度因子。'}
          </div>
          <div className="col-span-5 grid grid-rows-2 border border-l-0 border-gray-800 text-center">
            <div className="flex items-center justify-center px-2 py-1 font-semibold">{en ? 'Joint surface quality' : '结构面质量'}</div>
            <div className="flex items-center justify-center gap-1 border-t border-gray-800 px-3 py-1 font-normal text-gray-700">
              <span>{en ? 'Strong to weak' : '由强到弱'}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-gray-800" strokeWidth={2} aria-hidden />
            </div>
          </div>
          <div />

          <div className="grid grid-rows-2 border border-t-0 border-gray-800 text-center">
            <div className="flex items-center justify-center px-2 py-1 font-semibold text-gray-800">{en ? 'Rock-mass structure' : '岩体结构'}</div>
            <div className="flex items-center justify-center gap-1 border-t border-gray-800 px-1.5 py-1 font-normal text-gray-700">
              <span>{en ? 'Strong to weak' : '由强到弱'}</span>
              <ArrowDown className="h-4 w-4 shrink-0 text-gray-800" strokeWidth={2} aria-hidden />
            </div>
          </div>
          {GSI_QUANT_SURFACE_OPTIONS.map((surface) => (
            <div key={surface.id} className="border border-l-0 border-t-0 border-gray-800 px-1 py-1 text-center">
              <div className="font-semibold">{en ? surface.labelEn : surface.label}</div>
              <div className="mt-0.5 leading-snug text-gray-600">{en ? surface.descriptionEn : surface.description}</div>
            </div>
          ))}
          <div />

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
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
                    {Array.from({ length: GSI_QUANT_TICK_ROWS - 1 }, (_, index) => {
                      const scaleB = GSI_QUANT_SCALE_B_MAX - (index + 1) * GSI_QUANT_TICK_STEP
                      return (
                        <line
                          key={`h-${scaleB}`}
                          x1="0"
                          y1={((index + 1) / GSI_QUANT_TICK_ROWS) * 100}
                          x2="100"
                          y2={((index + 1) / GSI_QUANT_TICK_ROWS) * 100}
                          stroke="#d1d5db"
                          strokeWidth={scaleB % 10 === 0 ? 0.45 : 0.28}
                        />
                      )
                    })}
                    {Array.from({ length: GSI_QUANT_TICK_COLS - 1 }, (_, index) => {
                      const scaleA = GSI_QUANT_SCALE_A_MAX - (index + 1) * GSI_QUANT_TICK_STEP
                      return (
                        <line
                          key={`v-${scaleA}`}
                          x1={((index + 1) / GSI_QUANT_TICK_COLS) * 100}
                          y1="0"
                          x2={((index + 1) / GSI_QUANT_TICK_COLS) * 100}
                          y2="100"
                          stroke="#d1d5db"
                          strokeWidth={scaleA % 10 === 0 ? 0.45 : 0.28}
                        />
                      )
                    })}
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
                  <div
                    className="absolute inset-0 z-[2] grid"
                    style={{ gridTemplateColumns: `repeat(${GSI_QUANT_TICK_COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${GSI_QUANT_TICK_ROWS}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: GSI_QUANT_TICK_ROWS }, (_, row) =>
                      Array.from({ length: GSI_QUANT_TICK_COLS }, (_, col) => {
                        const fill = quantitativeTickFill(col, row)
                        const scaleAMin = GSI_QUANT_SCALE_A_MAX - (col + 1) * GSI_QUANT_TICK_STEP
                        const scaleBMin = GSI_QUANT_SCALE_B_MAX - (row + 1) * GSI_QUANT_TICK_STEP
                        const isSelected = selected?.col === col && selected.row === row
                        return (
                          <button
                            key={`${col}-${row}`}
                            type="button"
                            data-testid={`gsi-quant-tick-${scaleAMin}-${scaleBMin}`}
                            aria-label={en
                              ? `Scale A ${scaleAMin}–${scaleAMin + GSI_QUANT_TICK_STEP}, Scale B ${scaleBMin}–${scaleBMin + GSI_QUANT_TICK_STEP}`
                              : `刻度 A ${scaleAMin}～${scaleAMin + GSI_QUANT_TICK_STEP}，刻度 B ${scaleBMin}～${scaleBMin + GSI_QUANT_TICK_STEP}`}
                            aria-pressed={isSelected}
                            onClick={() => onSelect(fill.jcond89, fill.rqd)}
                            className={`min-h-0 min-w-0 ${isSelected ? 'bg-blue-600/25 ring-2 ring-inset ring-blue-700' : 'bg-transparent hover:bg-blue-500/10'}`}
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
                <div data-testid="gsi-quant-scale-b" className="relative row-span-4 min-h-0">
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

          <div />
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
