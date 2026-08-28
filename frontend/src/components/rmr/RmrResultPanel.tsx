import { RMR_CLASSES } from '../../config/rmrTables'
import type { RmrScoreBreakdown } from '../../utils/rmrCalc'
import { ArrowRight } from 'lucide-react'

interface RmrResultPanelProps {
  darkMode: boolean
  language: 'zh' | 'en'
  scores: RmrScoreBreakdown
  onEnterMrmr?: () => void
}

/** 等级刻度条按 RMR 从低到高排列。 */
const SCALE_SEGMENTS = [...RMR_CLASSES].reverse()

export default function RmrResultPanel({ darkMode, language, scores, onEnterMrmr }: RmrResultPanelProps) {
  const isEn = language === 'en'
  const panel = `rounded-lg border p-4 sm:p-5 ${
    darkMode ? 'border-gray-600 bg-gray-800/60' : 'border-gray-200 bg-white shadow-sm'
  }`

  if (!scores.allComplete || scores.rmr == null || !scores.classInfo) {
    return (
      <div className={panel}>
        <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{isEn ? 'Classification result' : '评价结果'}</h3>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {isEn
            ? `Complete A1-A6 to view the class, rock-mass description, stand-up span and time, mechanical-property ranges, and support guidance. ${scores.completedCount}/6 ratings are complete.`
            : `请完成 A1–A6 后查看完整评价（等级、岩体描述、自稳跨度与时间、力学参数区间与支护设计参考）。当前已完成 ${scores.completedCount}/6 项。`}
        </p>
      </div>
    )
  }

  const info = scores.classInfo
  const rmr = scores.rmr
  const markerPercent = Math.min(100, Math.max(0, rmr))
  const border = darkMode ? 'border-gray-600' : 'border-gray-300'
  const headCell = darkMode ? 'bg-gray-700/60 text-gray-200' : 'bg-gray-100 text-gray-700'
  const bodyText = darkMode ? 'text-gray-300' : 'text-gray-700'

  const summaryRows: { label: string; value: string }[] = [
    { label: isEn ? 'RMR range' : 'RMR 区间', value: info.rmrRange },
    { label: isEn ? 'Rock-mass class' : '岩体质量等级', value: isEn ? `${info.labelEn} (${info.qualityEn})` : `${info.label}（${info.quality}）` },
    { label: isEn ? 'Rock-mass description' : '岩体描述', value: isEn ? info.descriptionEn : info.description },
    { label: isEn ? 'Mean stand-up span / time' : '平均自稳跨度 / 自稳时间', value: isEn ? `${info.spanEn} / ${info.standUpTimeEn}` : `${info.span} / ${info.standUpTime}` },
    { label: isEn ? 'Rock-mass cohesion' : '岩体的粘聚力', value: info.cohesion },
    { label: isEn ? 'Friction angle' : '内摩擦角', value: info.friction },
  ]

  const supportRows: { label: string; value: string }[] = [
    { label: isEn ? 'Excavation' : '开挖方式', value: isEn ? info.excavationEn : info.excavation },
    { label: isEn ? 'Rock bolts (20 mm diameter, fully grouted)' : '锚杆（φ20 mm，全长锚固）', value: isEn ? info.boltEn : info.bolt },
    { label: isEn ? 'Shotcrete' : '喷射混凝土', value: isEn ? info.shotcreteEn : info.shotcrete },
    { label: isEn ? 'Steel sets' : '钢支架', value: isEn ? info.steelArchEn : info.steelArch },
  ]

  return (
    <div className={panel}>
      <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{isEn ? 'Classification result' : '评价结果'}</h3>

      <div
        className={`rounded-lg border px-4 py-3 mb-4 ${
          darkMode ? 'border-blue-500/40 bg-blue-950/40' : 'border-blue-200 bg-blue-50'
        }`}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{isEn ? 'Bieniawski RMR total' : 'Bieniawski RMR 总分'}</div>
          <div className={`text-3xl font-bold tabular-nums ${darkMode ? 'text-blue-100' : 'text-blue-900'}`}>{rmr}</div>
        </div>
        <p className={`mt-1 text-xs ${darkMode ? 'text-blue-200/80' : 'text-blue-700'}`}>
          A1 {scores.A1} + A2 {scores.A2} + A3 {scores.A3} + A4 {scores.A4} + A5 {scores.A5} + A6 {scores.A6} = {rmr}
        </p>
        <p className={`mt-2 text-sm font-medium ${darkMode ? 'text-blue-100' : 'text-blue-900'}`}>
          {isEn
            ? `${info.labelEn} (${info.qualityEn}) · ${info.descriptionEn}`
            : `${info.label}（${info.quality}）· 岩体描述「${info.description}」`}
        </p>
      </div>

      <div className="mb-4">
        <div className={`mb-1.5 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{isEn ? 'Class scale (RMR 0-100)' : '等级刻度（RMR 0 – 100）'}</div>
        <div className={`flex overflow-hidden rounded-md border ${border}`}>
          {SCALE_SEGMENTS.map((segment) => {
            const isCurrent = segment.id === info.id
            return (
              <div
                key={segment.id}
                className={`flex-1 px-1 py-1.5 text-center text-[11px] font-medium leading-tight ${
                  isCurrent
                    ? darkMode
                      ? 'bg-blue-700 text-white'
                      : 'bg-blue-600 text-white'
                    : darkMode
                      ? 'bg-gray-700/50 text-gray-400'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                {isEn ? segment.labelEn : segment.label}
                <div className="text-[10px] font-normal opacity-80">{isEn ? segment.descriptionEn : segment.description}</div>
              </div>
            )
          })}
        </div>
        <div className="relative mt-1 h-4">
          <div
            className={`absolute -translate-x-1/2 text-[11px] font-semibold tabular-nums ${
              darkMode ? 'text-blue-300' : 'text-blue-700'
            }`}
            style={{ left: `${markerPercent}%` }}
          >
            ▲ {rmr}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className={`mb-1.5 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {isEn ? 'Rock-mass class and engineering properties' : '岩体质量等级与工程特性'}
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full border-collapse border text-sm ${border}`}>
            <tbody>
              {summaryRows.map((row) => (
                <tr key={row.label}>
                  <th
                    scope="row"
                    className={`border ${border} ${headCell} w-[42%] px-2 py-1.5 text-left font-medium`}
                  >
                    {row.label}
                  </th>
                  <td className={`border ${border} px-2 py-1.5 ${bodyText}`}>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className={`mb-1.5 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {isEn ? 'Support design reference' : '支护设计参考'}
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full border-collapse border text-sm ${border}`}>
            <tbody>
              {supportRows.map((row) => (
                <tr key={row.label}>
                  <th
                    scope="row"
                    className={`border ${border} ${headCell} w-[42%] px-2 py-1.5 text-left font-medium align-top`}
                  >
                    {row.label}
                  </th>
                  <td className={`border ${border} px-2 py-1.5 leading-relaxed ${bodyText}`}>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={`mt-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {isEn
            ? 'Applicable to a 10 m span horseshoe-shaped drill-and-blast tunnel under vertical stress below 25 MPa. Do not apply directly outside these conditions; final design requires site-specific analysis and professional judgement.'
            : '适用于跨度 10 m 的马蹄形钻爆隧道、竖向应力小于 25 MPa；超出条件时不得直接套用，实际设计须结合现场分析与专业判断。'}
        </p>
      </div>

      {onEnterMrmr ? (
        <button
          type="button"
          onClick={onEnterMrmr}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {isEn ? 'Enter MRMR adjustment' : '进入 MRMR 修正'}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  )
}
