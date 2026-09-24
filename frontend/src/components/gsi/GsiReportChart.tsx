import {
  GSI_QUANT_SCALE_A_MAX,
  GSI_QUANT_SCALE_B_MAX,
  GSI_QUANT_STRUCTURE_OPTIONS,
  GSI_QUANT_SURFACE_OPTIONS,
  GSI_STRUCTURE_OPTIONS,
  GSI_SURFACE_OPTIONS,
  chartCellGsi,
  chartIsoline,
  chartPlotPercent,
  locateChartRegion,
  type GsiStructureId,
  type GsiSurfaceQualityId,
} from '../../methods/gsi'

export interface GsiReportChartProps {
  mode: 'chart' | 'quantitative'
  pointName: string
  scaleA: number
  scaleB: number
  gsi: number
}

const FONT = "Microsoft YaHei, SimSun, sans-serif"

function unique(points: Array<[number, number]>) {
  const seen = new Set<string>()
  return points.filter(([x, y]) => {
    const key = `${x.toFixed(2)},${y.toFixed(2)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function percentLine(gsi: number, aMax: number, bMax: number) {
  const raw: Array<[number, number]> = []
  const add = (scaleA: number, scaleB: number) => {
    if (scaleA < -0.05 || scaleA > aMax + 0.05 || scaleB < -0.05 || scaleB > bMax + 0.05) return
    raw.push([((aMax - scaleA) / aMax) * 100, ((bMax - scaleB) / bMax) * 100])
  }
  add(aMax, gsi - aMax)
  add(0, gsi)
  add(gsi, 0)
  add(gsi - bMax, bMax)
  const points = unique(raw)
  return points.length >= 2 ? points : null
}

export function GsiReportChart({ mode, pointName, scaleA, scaleB, gsi }: GsiReportChartProps) {
  return mode === 'chart'
    ? <DescriptiveChart pointName={pointName} scaleA={scaleA} scaleB={scaleB} gsi={gsi} />
    : <QuantitativeChart pointName={pointName} scaleA={scaleA} scaleB={scaleB} gsi={gsi} />
}

function DescriptiveChart({ pointName, scaleA, scaleB, gsi }: Omit<GsiReportChartProps, 'mode'>) {
  const width = 980
  const height = 680
  const plot = { x: 188, y: 58, w: 750, h: 468 }
  const px = (percent: number) => plot.x + (percent / 100) * plot.w
  const py = (percent: number) => plot.y + (percent / 100) * plot.h
  const region = locateChartRegion(scaleA, scaleB)
  const point = chartPlotPercent(scaleA, scaleB)
  const isolines = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90]
    .map((value) => ({ value, line: chartIsoline(value) }))
    .filter((item): item is { value: number; line: NonNullable<ReturnType<typeof chartIsoline>> } => item.line != null)

  return (
    <svg data-testid="gsi-report-chart" xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${width} ${height}`} role="img" style={{ fontFamily: FONT, background: '#fff' }}>
      <title>{`节理岩体地质强度指标（GSI） ${pointName}`}</title>
      <rect width={width} height={height} fill="#fff" />
      <text x={width / 2} y={32} textAnchor="middle" fontSize="20" fontWeight="700" fill="#111827">节理岩体地质强度指标（GSI）</text>
      <text x={plot.x + plot.w / 2} y={52} textAnchor="middle" fontSize="13" fill="#374151">表面质量（由好到差）</text>
      {GSI_STRUCTURE_OPTIONS.map((structure, index) => (
        <text key={structure.id} x={plot.x - 10} y={py((index + 0.5) * (100 / GSI_STRUCTURE_OPTIONS.length))} textAnchor="end" dominantBaseline="middle" fontSize="13" fill="#111827">{structure.label}</text>
      ))}
      <text x={24} y={plot.y + plot.h / 2} textAnchor="middle" fontSize="13" fill="#374151" transform={`rotate(-90 24 ${plot.y + plot.h / 2})`}>岩体结构（由完整到破碎）</text>
      <rect x={plot.x} y={plot.y} width={plot.w} height={plot.h} fill="#fff" stroke="#111827" strokeWidth="1.2" />
      {isolines.map(({ value, line }) => (
        <line key={value} x1={px(line.x1)} y1={py(line.y1)} x2={px(line.x2)} y2={py(line.y2)} stroke="#111827" strokeOpacity={value % 10 === 0 ? 0.85 : 0.35} strokeWidth={value % 10 === 0 ? 1.4 : 0.8} />
      ))}
      {isolines.filter(({ value }) => value % 10 === 0).map(({ value, line }) => (
        <text key={`label-${value}`} x={px(line.mx)} y={py(line.my)} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="700" fill="#111827">{value}</text>
      ))}
      {GSI_STRUCTURE_OPTIONS.flatMap((structure, row) => GSI_SURFACE_OPTIONS.map((surface, col) => {
        const cell = chartCellGsi(structure.id as Exclude<GsiStructureId, ''>, surface.id as Exclude<GsiSurfaceQualityId, ''>)
        if (cell.applicable) return null
        const x = plot.x + (col / GSI_SURFACE_OPTIONS.length) * plot.w
        const y = plot.y + (row / GSI_STRUCTURE_OPTIONS.length) * plot.h
        const w = plot.w / GSI_SURFACE_OPTIONS.length
        const h = plot.h / GSI_STRUCTURE_OPTIONS.length
        return (
          <g key={`${structure.id}-${surface.id}`}>
            <rect x={x} y={y} width={w} height={h} fill="#e5e7eb" />
            <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="middle" fontSize="13" fill="#6b7280">不适用</text>
          </g>
        )
      }))}
      <rect
        x={plot.x + (GSI_SURFACE_OPTIONS.findIndex((item) => item.id === region.surfaceQualityId) / GSI_SURFACE_OPTIONS.length) * plot.w}
        y={plot.y + (GSI_STRUCTURE_OPTIONS.findIndex((item) => item.id === region.structureId) / GSI_STRUCTURE_OPTIONS.length) * plot.h}
        width={plot.w / GSI_SURFACE_OPTIONS.length}
        height={plot.h / GSI_STRUCTURE_OPTIONS.length}
        fill="#2563eb"
        fillOpacity="0.12"
        stroke="#2563eb"
        strokeWidth="1.5"
      />
      {GSI_SURFACE_OPTIONS.map((surface, index) => (
        <text key={surface.id} x={px((index + 0.5) * (100 / GSI_SURFACE_OPTIONS.length))} y={plot.y + plot.h + 24} textAnchor="middle" fontSize="14" fontWeight="700" fill="#111827">{surface.label}</text>
      ))}
      <circle data-testid="gsi-report-point" cx={px(point.left)} cy={py(point.top)} r="7" fill="#2563eb" stroke="#fff" strokeWidth="2" />
      <text x={width / 2} y={height - 36} textAnchor="middle" fontSize="14" fill="#1d4ed8">{`${pointName}　本次取值 GSI = ${gsi}`}</text>
      <text x={plot.x + plot.w} y={height - 16} textAnchor="end" fontSize="12" fill="#6b7280">{`刻度 A ${scaleA}　刻度 B ${scaleB}`}</text>
    </svg>
  )
}

function QuantitativeChart({ pointName, scaleA, scaleB, gsi }: Omit<GsiReportChartProps, 'mode'>) {
  const width = 980
  const height = 620
  const plot = { x: 168, y: 58, w: 760, h: 440 }
  const aMax = GSI_QUANT_SCALE_A_MAX
  const bMax = GSI_QUANT_SCALE_B_MAX
  const px = (percent: number) => plot.x + (percent / 100) * plot.w
  const py = (percent: number) => plot.y + (percent / 100) * plot.h
  const markerA = Math.min(aMax, Math.max(0, scaleA))
  const markerB = Math.min(bMax, Math.max(0, scaleB))
  const marker = { left: ((aMax - markerA) / aMax) * 100, top: ((bMax - markerB) / bMax) * 100 }
  const isolines = [10, 20, 30, 40, 50, 60, 70, 80]
    .map((value) => ({ value, line: percentLine(value, aMax, bMax) }))
    .filter((item): item is { value: number; line: Array<[number, number]> } => item.line != null)

  return (
    <svg data-testid="gsi-report-quant-chart" xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${width} ${height}`} role="img" style={{ fontFamily: FONT, background: '#fff' }}>
      <title>{`量化地质强度指标（GSI） ${pointName}`}</title>
      <rect width={width} height={height} fill="#fff" />
      <text x={width / 2} y={32} textAnchor="middle" fontSize="20" fontWeight="700" fill="#111827">量化地质强度指标（GSI）</text>
      <text x={plot.x + plot.w / 2} y={52} textAnchor="middle" fontSize="13" fill="#374151">刻度 A　结构面质量（由好到差）</text>
      {GSI_QUANT_STRUCTURE_OPTIONS.map((structure) => {
        const mid = (structure.scaleBMin + structure.scaleBMax) / 2
        return <text key={structure.id} x={plot.x - 10} y={py(((bMax - mid) / bMax) * 100)} textAnchor="end" dominantBaseline="middle" fontSize="13" fill="#111827">{structure.label}</text>
      })}
      <text x={22} y={plot.y + plot.h / 2} textAnchor="middle" fontSize="13" fill="#374151" transform={`rotate(-90 22 ${plot.y + plot.h / 2})`}>刻度 B　岩体结构</text>
      <rect x={plot.x} y={plot.y} width={plot.w} height={plot.h} fill="#fff" stroke="#111827" strokeWidth="1.2" />
      {GSI_QUANT_SURFACE_OPTIONS.map((_, index) => (
        <line key={`v-${index}`} x1={plot.x + ((index + 1) / GSI_QUANT_SURFACE_OPTIONS.length) * plot.w} y1={plot.y} x2={plot.x + ((index + 1) / GSI_QUANT_SURFACE_OPTIONS.length) * plot.w} y2={plot.y + plot.h} stroke="#d1d5db" strokeDasharray="4 3" />
      ))}
      {GSI_QUANT_STRUCTURE_OPTIONS.map((_, index) => (
        <line key={`h-${index}`} x1={plot.x} y1={plot.y + ((index + 1) / GSI_QUANT_STRUCTURE_OPTIONS.length) * plot.h} x2={plot.x + plot.w} y2={plot.y + ((index + 1) / GSI_QUANT_STRUCTURE_OPTIONS.length) * plot.h} stroke="#d1d5db" strokeDasharray="4 3" />
      ))}
      {isolines.map(({ value, line }) => (
        <line key={value} x1={px(line[0][0])} y1={py(line[0][1])} x2={px(line[1][0])} y2={py(line[1][1])} stroke="#111827" strokeWidth="1.3" />
      ))}
      {isolines.map(({ value, line }) => (
        <text key={`label-${value}`} x={px((line[0][0] + line[1][0]) / 2)} y={py((line[0][1] + line[1][1]) / 2)} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="700" fill="#111827">{value}</text>
      ))}
      {GSI_QUANT_SURFACE_OPTIONS.map((surface, index) => (
        <text key={surface.id} x={plot.x + ((index + 0.5) / GSI_QUANT_SURFACE_OPTIONS.length) * plot.w} y={plot.y + plot.h + 24} textAnchor="middle" fontSize="14" fontWeight="700" fill="#111827">{surface.label}</text>
      ))}
      <circle data-testid="gsi-report-point" cx={px(marker.left)} cy={py(marker.top)} r="7" fill="#2563eb" stroke="#fff" strokeWidth="2" />
      <text x={width / 2} y={height - 28} textAnchor="middle" fontSize="14" fill="#1d4ed8">{`${pointName}　本次取值 GSI = ${gsi}`}</text>
    </svg>
  )
}
