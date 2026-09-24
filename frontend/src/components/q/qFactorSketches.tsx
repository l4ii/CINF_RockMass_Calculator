import { Fragment } from 'react'

const JN_FIGURE: Record<string, string> = {
  one_set: './q/jn-one_set.png',
  two_sets: './q/jn-two_sets.png',
  columnar: './q/jn-columnar.png',
  three_sets: './q/jn-three_sets.png',
  three_sets_random: './q/jn-three_sets_random.png',
}

type JrProfileLine = {
  roman: string
  textureZh: string
  textureEn: string
  src: string
}

const JR_PROFILE_LINES: Record<string, readonly JrProfileLine[]> = {
  discontinuous: [
    { roman: 'I', textureZh: '粗糙', textureEn: 'Rough', src: './q/jr-stepped-rough.png' },
    { roman: 'II', textureZh: '光滑', textureEn: 'Smooth', src: './q/jr-stepped-smooth.png' },
    { roman: 'III', textureZh: '擦痕', textureEn: 'Slickensided', src: './q/jr-stepped-slickensided.png' },
  ],
  rough_undulating: [{ roman: 'IV', textureZh: '粗糙', textureEn: 'Rough', src: './q/jr-rough_undulating.png' }],
  smooth_undulating: [{ roman: 'V', textureZh: '光滑', textureEn: 'Smooth', src: './q/jr-smooth_undulating.png' }],
  slickensided_undulating: [{ roman: 'VI', textureZh: '擦痕', textureEn: 'Slickensided', src: './q/jr-slickensided_undulating.png' }],
  rough_planar: [{ roman: 'VII', textureZh: '粗糙', textureEn: 'Rough', src: './q/jr-rough_planar.png' }],
  smooth_planar: [{ roman: 'VIII', textureZh: '光滑', textureEn: 'Smooth', src: './q/jr-smooth_planar.png' }],
  slickensided_planar: [{ roman: 'IX', textureZh: '擦痕', textureEn: 'Slickensided', src: './q/jr-slickensided_planar.png' }],
}

export const JR_WALL_CONTACT_FIGURE = './q/jr-wall-contact.png'
export const JR_SHEAR_CONTACT_FIGURE = './q/jr-10cm-shear.png'
export const JR_NO_CONTACT_FIGURE = './q/jr-no-contact.png'

export const JR_CONTACT_FIGURES = {
  a: { src: JR_WALL_CONTACT_FIGURE, widthPt: 124 },
  b: { src: JR_SHEAR_CONTACT_FIGURE, widthPt: 310 },
  c: { src: JR_NO_CONTACT_FIGURE, widthPt: 314 },
} as const

export function jnSketchSrc(optionId: string) {
  return JN_FIGURE[optionId] ?? null
}

export function JrRoughnessProfile({
  optionId,
  language,
}: {
  optionId: string
  language: 'zh' | 'en'
}) {
  const lines = JR_PROFILE_LINES[optionId]
  if (!lines) return null
  const en = language === 'en'
  return (
    <div
      data-testid={`q-jr-profile-${optionId}`}
      className="mx-auto grid w-max grid-cols-[auto_auto] items-center gap-x-2 gap-y-1"
    >
      {lines.map((line) => (
        <Fragment key={line.roman}>
          <span className="whitespace-nowrap text-left text-xs leading-tight">
            {line.roman} {en ? line.textureEn : line.textureZh}
          </span>
          <img src={line.src} alt="" draggable={false} className="h-10 w-auto max-w-full object-contain" />
        </Fragment>
      ))}
    </div>
  )
}
