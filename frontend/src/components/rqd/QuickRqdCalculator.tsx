import { useState, type KeyboardEvent, type WheelEvent } from 'react'
import { Kblock } from '../math/Katex'

interface QuickRqdCalculatorProps {
  darkMode: boolean
  language: 'zh' | 'en'
  onClose: () => void
  onComplete: (rqd: number) => void
  confirmLabel?: string
  showIntro?: boolean
  qSystemNotes?: boolean
  titleId?: string
  formulaTestId?: string
}

function preventNumberWheel(event: WheelEvent<HTMLInputElement>) {
  event.currentTarget.blur()
}

function preventNumberArrow(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') event.preventDefault()
}

export default function QuickRqdCalculator({
  darkMode,
  language,
  onClose,
  onComplete,
  confirmLabel,
  showIntro = false,
  qSystemNotes = false,
  titleId = 'rqd-quick-title',
  formulaTestId = 'rqd-quick-formula',
}: QuickRqdCalculatorProps) {
  const isEn = language === 'en'
  const [soundCoreLength, setSoundCoreLength] = useState('')
  const [drillHoleLength, setDrillHoleLength] = useState('')
  const muted = darkMode ? 'text-gray-400' : 'text-gray-600'
  const panel = darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
  const inputCls = `w-full rounded-lg border px-3 py-2 text-center text-sm ${darkMode ? 'border-gray-500 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`
  const soundCore = Number(soundCoreLength)
  const drillHole = Number(drillHoleLength)
  const result = soundCoreLength !== '' && drillHoleLength !== '' && Number.isFinite(soundCore) && Number.isFinite(drillHole) && drillHole > 0 && soundCore >= 0 && soundCore <= drillHole
    ? Number(((soundCore / drillHole) * 100).toFixed(2))
    : null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`w-full max-w-4xl rounded-xl border p-5 shadow-xl ${panel}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {isEn ? 'Quick RQD calculator' : 'RQD 快速计算'}
            </h2>
            <p className={`mt-1 text-sm ${muted}`}>
              {isEn
                ? 'Enter the core-run lengths, review RQD, then confirm to fill the field.'
                : '按同一岩芯回次录入长度，核对 RQD 后回填。'}
            </p>
          </div>
          <button
            type="button"
            aria-label={isEn ? 'Close' : '关闭'}
            title={isEn ? 'Close' : '关闭'}
            onClick={onClose}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-lg ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            ×
          </button>
        </div>

        {showIntro ? (
          <div className={`mt-4 space-y-2 text-sm leading-relaxed ${muted}`}>
            <p>
              {isEn
                ? 'RQD (Rock Quality Designation, Deere et al. 1964) is a core-recovery index of fracturing. For one drill run it is the percentage of the drilled length represented by intact pieces at least 10 cm long, measured along the core axis. Mechanical breaks from drilling are not counted as fractures; pieces shorter than 10 cm, including rubble and no-recovery intervals, contribute zero to the numerator.'
                : '岩石质量指标 RQD（Deere 等，1964）用取芯回次表征岩体破碎程度。同一回次内，沿岩芯轴线量测长度不小于 10 cm 的完整段并累计，除以该回次钻孔长度，得百分数。钻进造成的机械折断不计入裂隙；短于 10 cm 的碎块、无回次段分子记 0。'}
            </p>
            {qSystemNotes ? (
              <div className="space-y-1">
                <p>
                  {isEn
                    ? 'Note 1: If the reported or measured RQD is ≤ 10 (including 0), use a nominal 10 when calculating Q. The measured value is still kept on the form.'
                    : '注 1：当统计或实测 RQD ≤ 10（含 0）时，计算 Q 采用名义值 10；表单仍保留实测值。'}
                </p>
                <p>
                  {isEn
                    ? 'Note 2: Taking RQD in steps of 5 (100, 95, 90, …) is accurate enough. Core-run results are not rounded automatically.'
                    : '注 2：建议按 5 为间隔取值（100、95、90…）已足够准确；岩芯回算结果不强制四舍五入。'}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div data-testid={formulaTestId} className={`mt-4 rounded-lg border px-3 py-2 ${darkMode ? 'border-gray-600 bg-gray-900/40' : 'border-gray-200 bg-gray-50'}`}>
          <p className={`mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? 'Formula' : '计算公式'}</p>
          <Kblock
            math={isEn
              ? String.raw`\mathrm{RQD}=\frac{\text{cumulative core length }\ge 10\,\mathrm{cm}}{\text{drill hole length}}\times 100\%`
              : String.raw`\mathrm{RQD}=\frac{\text{长度 }\ge 10\,\mathrm{cm}\text{ 的岩芯累计长度}}{\text{钻孔长度}}\times 100\%`}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? 'Cumulative core length at least 10 cm' : '长度 ≥ 10 cm 的岩芯累计长度'}</span>
            <input aria-label={isEn ? 'Cumulative core length at least 10 cm' : '长度 ≥ 10 cm 的岩芯累计长度'} type="number" min="0" step="0.01" value={soundCoreLength} onChange={(event) => setSoundCoreLength(event.target.value)} onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={inputCls} />
          </label>
          <label className="block space-y-1">
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{isEn ? 'Drill hole length' : '钻孔长度'}</span>
            <input aria-label={isEn ? 'Drill hole length' : '钻孔长度'} type="number" min="0" step="0.01" value={drillHoleLength} onChange={(event) => setDrillHoleLength(event.target.value)} onWheel={preventNumberWheel} onKeyDown={preventNumberArrow} className={inputCls} />
          </label>
        </div>
        <div className={`mt-4 rounded-lg border px-3 py-3 text-center ${darkMode ? 'border-gray-600 bg-gray-900/40 text-gray-100' : 'border-gray-200 bg-gray-50 text-gray-900'}`}>
          <span className="text-sm font-medium">{isEn ? 'Calculated RQD' : '计算结果 RQD'}：</span>
          <span className="font-semibold tabular-nums">{result == null ? '—' : `${result} %`}</span>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
            {isEn ? 'Cancel' : '取消'}
          </button>
          <button type="button" disabled={result == null} onClick={() => result != null && onComplete(result)} className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-blue-700">
            {confirmLabel ?? (isEn ? 'Confirm and fill' : '确认并回填')}
          </button>
        </div>
      </div>
    </div>
  )
}
