import RockMassOreTypeField from './RockMassOreTypeField'

interface PointInformationFieldsProps {
  darkMode: boolean
  language: 'zh' | 'en'
  pointOrdinal: number
  pointName: string
  pointNote: string
  pointOreType: string
  oreTypeOptions?: string[]
  listId: string
  inputClassName: string
  onPointNameChange: (name: string) => void
  onPointNoteChange: (note: string) => void
  onPointOreTypeChange: (oreType: string) => void
}

export default function PointInformationFields({
  darkMode,
  language,
  pointOrdinal,
  pointName,
  pointNote,
  pointOreType,
  oreTypeOptions = [],
  listId,
  inputClassName,
  onPointNameChange,
  onPointNoteChange,
  onPointOreTypeChange,
}: PointInformationFieldsProps) {
  const en = language === 'en'
  const labelCls = `text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
  const input = inputClassName.includes('text-center') ? inputClassName : `${inputClassName} text-center`

  return (
    <>
      <h2 className={`mb-3 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
        {en ? 'Point information' : '点位信息'}
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="block space-y-1">
          <span className={labelCls}>{en ? 'Point number' : '点位序号'}</span>
          <input
            className={input}
            value={pointOrdinal}
            readOnly
            aria-readonly="true"
            aria-label={en ? 'Point number' : '点位序号'}
          />
        </label>
        <label className="block space-y-1">
          <span className={labelCls}>{en ? 'Point name' : '点位名称'}</span>
          <input
            className={input}
            value={pointName}
            onChange={(event) => onPointNameChange(event.target.value)}
            placeholder={en ? 'e.g. K12+350 crown' : '如：K12+350 拱顶'}
            aria-label={en ? 'Point name' : '点位名称'}
          />
        </label>
        <RockMassOreTypeField
          darkMode={darkMode}
          language={language}
          value={pointOreType}
          options={oreTypeOptions}
          listId={listId}
          inputClassName={input}
          onChange={onPointOreTypeChange}
        />
        <label className="block space-y-1">
          <span className={labelCls}>{en ? 'Point note (chainage / borehole)' : '点位说明（桩号 / 钻孔号）'}</span>
          <input
            className={input}
            value={pointNote}
            onChange={(event) => onPointNoteChange(event.target.value)}
            placeholder={en ? 'e.g. BH-07, depth 45-52 m' : '如：ZK-07，深度 45 ~ 52 m'}
            aria-label={en ? 'Point note (chainage / borehole)' : '点位说明（桩号 / 钻孔号）'}
          />
        </label>
      </div>
    </>
  )
}
