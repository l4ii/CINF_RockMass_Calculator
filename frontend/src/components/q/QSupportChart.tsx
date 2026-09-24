import { useId } from 'react'
import { formatQValue, maximumUnsupportedDimension, type QResult } from '../../methods/q'

export default function QSupportChart({ result, darkMode = false, language = 'zh' }: { result: QResult | null; darkMode?: boolean; language?: 'zh' | 'en' }) {
  const en = language === 'en'
  const id = useId()
  const left = 70, right = 830, top = 30, bottom = 370
  const x = (q: number) => left + (Math.log10(q) + 3) / 6 * (right - left)
  const y = (de: number) => bottom - (Math.log10(de) + 1) / 3 * (bottom - top)
  const text = darkMode ? '#e2e8f0' : '#334155'
  const grid = darkMode ? '#475569' : '#cbd5e1'
  const boundary = `${left},${y(maximumUnsupportedDimension(0.001))} ${right},${y(maximumUnsupportedDimension(1000))}`
  const inRange = result && result.q >= 0.001 && result.q <= 1000
  const showPoint = inRange && result.equivalentDimension != null && result.equivalentDimension >= 0.1 && result.equivalentDimension <= 100
  const ticks = [0.001, 0.01, 0.1, 1, 10, 100, 1000]
  return (
    <svg data-testid="q-support-chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 870 438" role="img" aria-labelledby={`${id}-title ${id}-desc`} style={{ width: '100%', height: 'auto', fontFamily: 'inherit', background: darkMode ? '#172033' : '#ffffff' }}>
      <title id={`${id}-title`}>{en ? 'Q–equivalent dimension support relationship' : 'Q–当量尺寸支护关系图'}</title>
      <desc id={`${id}-desc`}>{en ? 'Logarithmic axes. De = 2Q^0.4 is the empirical unsupported boundary; points above it require support assessment.' : '双对数坐标，De = 2Q^0.4 为经验无支护极限，线上方为需要支护区。'}{result ? ` Q=${formatQValue(result.q)}, De=${result.equivalentDimension ?? '—'}.` : ''}</desc>
      <rect x={left} y={top} width={right - left} height={bottom - top} fill={darkMode ? '#12342f' : '#effaf6'} />
      <polygon points={`${left},${top} ${right},${top} ${boundary.split(' ').reverse().join(' ')}`} fill={darkMode ? '#412c25' : '#fff5e9'} />
      {Array.from({ length: 6 }, (_, d) => Array.from({ length: 8 }, (_, i) => (i + 2) * 10 ** (d - 3))).flat().filter((v) => v < 1000).map((v) => <line key={`minor-${v}`} x1={x(v)} x2={x(v)} y1={top} y2={bottom} stroke={grid} strokeWidth="0.5" opacity="0.5" />)}
      {ticks.map((v) => <g key={v}><line x1={x(v)} x2={x(v)} y1={top} y2={bottom} stroke={grid} /><text x={x(v)} y={bottom + 22} textAnchor="middle" fontSize="14" fill={text}>{v}</text></g>)}
      {[0.1, 0.5, 1, 5, 10, 50, 100].map((v) => <g key={v}><line x1={left} x2={right} y1={y(v)} y2={y(v)} stroke={grid} /><text x={left - 10} y={y(v) + 4} textAnchor="end" fontSize="14" fill={text}>{v}</text></g>)}
      <polyline points={boundary} stroke={darkMode ? '#93c5fd' : '#2563eb'} strokeWidth="2.5" fill="none" />
      <text x="300" y="162" textAnchor="middle" fontSize="17" fontWeight="600" fill={darkMode ? '#fdba74' : '#92400e'}>{en ? 'Support required' : '需要支护'}</text>
      <text x="656" y="325" textAnchor="middle" fontSize="17" fontWeight="600" fill={darkMode ? '#6ee7b7' : '#166534'}>{en ? 'Support not required' : '不需要支护'}</text>
      <text x="704" y="189" textAnchor="middle" fontSize="13" fill={darkMode ? '#93c5fd' : '#1d4ed8'}>De = 2Q⁰·⁴</text>
      {inRange ? <line x1={x(result.q)} x2={x(result.q)} y1={top} y2={bottom} stroke="#2563eb" strokeWidth="1.8" strokeDasharray="5 4" /> : null}
      {showPoint ? <g data-testid="q-chart-point"><line x1={left} x2={x(result.q)} y1={y(result.equivalentDimension!)} y2={y(result.equivalentDimension!)} stroke="#2563eb" strokeWidth="1.8" strokeDasharray="5 4" /><circle cx={x(result.q)} cy={y(result.equivalentDimension!)} r="12" fill="white" stroke="#0f172a" strokeWidth="1.5" /><circle cx={x(result.q)} cy={y(result.equivalentDimension!)} r="8" fill="#2563eb" stroke="white" strokeWidth="2" /><title>{en ? 'Current point' : '当前点位'}: Q={formatQValue(result.q)}, De={formatQValue(result.equivalentDimension!)}</title></g> : null}
      <rect x={left} y={top} width={right - left} height={bottom - top} fill="none" stroke={grid} />
      <text x="450" y="420" textAnchor="middle" fontSize="14" fill={text}>{en ? 'Rock-mass quality Q (log scale)' : '岩体质量 Q（对数坐标）'}</text>
      <text transform="translate(20 224) rotate(-90)" textAnchor="middle" fontSize="14" fill={text}>{en ? 'Equivalent dimension De (m)' : '当量尺寸 De（m）'}</text>
    </svg>
  )
}
