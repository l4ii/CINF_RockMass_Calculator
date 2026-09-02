export type JnSketchKind = 'one' | 'two' | 'three' | 'three_random'

const JN_KIND: Record<string, JnSketchKind> = {
  one_set: 'one',
  two_sets: 'two',
  three_sets: 'three',
  three_sets_random: 'three_random',
}

export function jnSketchKind(optionId: string): JnSketchKind | null {
  return JN_KIND[optionId] ?? null
}

/** Medium-scale form (dm-m) of a joint profile. */
type JrBase = 'stepped' | 'undulating' | 'planar'

/** Small-scale texture (mm-cm) superimposed on the medium-scale form. */
type JrTexture = 'rough' | 'smooth' | 'slick'

const JR_PROFILE: Record<string, { base: JrBase; texture: JrTexture }> = {
  discontinuous: { base: 'stepped', texture: 'rough' },
  rough_undulating: { base: 'undulating', texture: 'rough' },
  smooth_undulating: { base: 'undulating', texture: 'smooth' },
  slickensided_undulating: { base: 'undulating', texture: 'slick' },
  rough_planar: { base: 'planar', texture: 'rough' },
  smooth_planar: { base: 'planar', texture: 'smooth' },
  slickensided_planar: { base: 'planar', texture: 'slick' },
}

const JR_FILLING: Record<string, 'clay' | 'crushed'> = {
  clay_zone_no_contact: 'clay',
  crushed_zone_no_contact: 'crushed',
}

const TRACE_X0 = 4
const TRACE_LEN = 200
const TRACE_MID = 22

function baseY(base: JrBase, x: number) {
  if (base === 'undulating') return -7 * Math.sin((2 * Math.PI * x) / 100)
  if (base === 'stepped') {
    if (x < 64) return 7
    if (x < 67) return 7 - ((x - 64) / 3) * 7
    if (x < 131) return 0
    if (x < 134) return -((x - 131) / 3) * 7
    return -7
  }
  return 0
}

function toPath(points: Array<[number, number]>) {
  return points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${(TRACE_X0 + x).toFixed(1)} ${(TRACE_MID + y).toFixed(1)}`)
    .join(' ')
}

/** Irregular sawtooth of alternating extrema, so the teeth stay crisp at any scale. */
function roughPoints(base: JrBase): Array<[number, number]> {
  const step = 3.2
  const count = Math.round(TRACE_LEN / step)
  const points: Array<[number, number]> = []
  for (let index = 0; index <= count; index += 1) {
    const x = Math.min(index * step, TRACE_LEN)
    const amplitude = 1.5 + 0.9 * Math.sin(index * 1.7)
    points.push([x, baseY(base, x) + (index % 2 === 0 ? -amplitude : amplitude)])
  }
  return points
}

function smoothPoints(base: JrBase): Array<[number, number]> {
  const points: Array<[number, number]> = []
  for (let x = 0; x <= TRACE_LEN; x += 2) points.push([x, baseY(base, x)])
  return points
}

const STRIATION_X = [18, 50, 82, 114, 146, 178]

function striations(base: JrBase) {
  return STRIATION_X.map((x) => {
    const px = TRACE_X0 + x
    const py = TRACE_MID + baseY(base, x)
    return `M${px} ${py.toFixed(1)} L${px + 5.5} ${(py - 3.2).toFixed(1)}`
  })
}

const BAND_HALF = 6

function bandY(x: number, side: 'upper' | 'lower') {
  const wave = -3 * Math.sin((2 * Math.PI * x) / 130 + (side === 'upper' ? 0 : 0.6))
  return (side === 'upper' ? -BAND_HALF : BAND_HALF) + wave
}

function bandPoints(side: 'upper' | 'lower'): Array<[number, number]> {
  const points: Array<[number, number]> = []
  for (let x = 0; x <= TRACE_LEN; x += 2) points.push([x, bandY(x, side)])
  return points
}

function bandFillPath() {
  const upper = bandPoints('upper')
  const lower = bandPoints('lower').reverse()
  return `${toPath(upper)} ${toPath(lower).replace('M', 'L')} Z`
}

/** Deterministic grains scattered inside the filling band. */
function bandGrains() {
  const grains: Array<[number, number]> = []
  for (let index = 0; index < 24; index += 1) {
    const x = 6 + index * 8
    if (x > TRACE_LEN - 4) break
    const offset = ((index * 37) % 9) - 4
    const centre = (bandY(x, 'upper') + bandY(x, 'lower')) / 2
    grains.push([TRACE_X0 + x, TRACE_MID + centre + offset])
  }
  return grains
}

/** Isometric projection: x to the right, y up, z into the page. */
function iso(x: number, y: number, z: number): [number, number] {
  return [52 + (x - z) * 34, 50 - y * 38 + (x + z) * 17]
}

function pt(x: number, y: number, z: number) {
  const [px, py] = iso(x, y, z)
  return `${px.toFixed(1)} ${py.toFixed(1)}`
}

function face(corners: Array<[number, number, number]>) {
  return `${corners.map(([x, y, z], index) => `${index === 0 ? 'M' : 'L'}${pt(x, y, z)}`).join(' ')} Z`
}

function seg(a: [number, number, number], b: [number, number, number]) {
  return `M${pt(...a)} L${pt(...b)}`
}

const TOP: Array<[number, number, number]> = [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]]
const FRONT: Array<[number, number, number]> = [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]]
const RIGHT: Array<[number, number, number]> = [[1, 0, 0], [1, 0, 1], [1, 1, 1], [1, 1, 0]]

const STEPS = [0.2, 0.4, 0.6, 0.8]

/** Traces of one joint set on the three visible faces (top, front z=1, right x=1). */
function setX() {
  return STEPS.flatMap((x) => [seg([x, 1, 0], [x, 1, 1]), seg([x, 0, 1], [x, 1, 1])])
}

function setZ() {
  return STEPS.flatMap((z) => [seg([0, 1, z], [1, 1, z]), seg([1, 0, z], [1, 1, z])])
}

function setY() {
  return STEPS.flatMap((y) => [seg([0, y, 1], [1, y, 1]), seg([1, y, 0], [1, y, 1])])
}

const RANDOM_CUTS = [
  seg([0.15, 1, 0.25], [0.85, 1, 0.7]),
  seg([0.1, 0.25, 1], [0.9, 0.7, 1]),
  seg([1, 0.2, 0.15], [1, 0.75, 0.85]),
]

function blockTraces(kind: JnSketchKind) {
  if (kind === 'one') return setX()
  if (kind === 'two') return [...setX(), ...setZ()]
  return [...setX(), ...setZ(), ...setY()]
}

export function JnBlockSketch({ kind, className }: { kind: JnSketchKind; className?: string }) {
  return (
    <svg viewBox="0 0 104 96" className={className} aria-hidden>
      <g stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="currentColor">
        <path d={face(TOP)} fillOpacity="0.03" />
        <path d={face(FRONT)} fillOpacity="0.06" />
        <path d={face(RIGHT)} fillOpacity="0.11" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round">
        {blockTraces(kind).map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      {kind === 'three_random' ? (
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          {RANDOM_CUTS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      ) : null}
    </svg>
  )
}

const POLE_OFFSETS: Array<[number, number]> = [
  [0, 0],
  [4.4, 1.4],
  [-3.6, 2.8],
  [1.6, -4],
  [-1.8, -2.4],
]

/** One pole cluster per joint set, plotted near the rim of the stereonet. */
function clusterAngles(kind: JnSketchKind) {
  if (kind === 'one') return [125]
  if (kind === 'two') return [125, 5]
  return [125, 5, 250]
}

const SCATTER: Array<[number, number]> = [
  [-15, -19],
  [21, -9],
  [7, 21],
  [-23, 7],
  [15, 15],
  [-5, -29],
]

export function JnStereonetSketch({ kind, className }: { kind: JnSketchKind; className?: string }) {
  const cx = 48
  const cy = 48
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden>
      <circle cx={cx} cy={cy} r="42" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <g fill="currentColor">
        {clusterAngles(kind).map((angle) => {
          const radians = (angle * Math.PI) / 180
          const px = cx + Math.cos(radians) * 26
          const py = cy - Math.sin(radians) * 26
          return POLE_OFFSETS.map(([dx, dy], index) => (
            <circle key={`${angle}-${index}`} cx={px + dx} cy={py + dy} r="2.6" />
          ))
        })}
        {kind === 'three_random'
          ? SCATTER.map(([dx, dy]) => <circle key={`${dx}-${dy}`} cx={cx + dx} cy={cy + dy} r="2" />)
          : null}
      </g>
    </svg>
  )
}

export function JrFillingSketch({ kind, className, testId }: { kind: 'clay' | 'crushed'; className?: string; testId?: string }) {
  return (
    <svg viewBox="0 0 208 40" className={className} data-testid={testId} aria-hidden>
      <path d={bandFillPath()} fill="currentColor" fillOpacity={kind === 'clay' ? 0.18 : 0.07} stroke="none" />
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        <path d={toPath(bandPoints('upper'))} />
        <path d={toPath(bandPoints('lower'))} />
      </g>
      {kind === 'crushed' ? (
        <g fill="currentColor" fillOpacity="0.7">
          {bandGrains().map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" />
          ))}
        </g>
      ) : null}
    </svg>
  )
}

export function JrRoughnessProfile({ optionId, className }: { optionId: string; className?: string }) {
  const testId = `q-jr-profile-${optionId}`
  const filling = JR_FILLING[optionId]
  if (filling) return <JrFillingSketch kind={filling} className={className} testId={testId} />

  const profile = JR_PROFILE[optionId]
  if (!profile) return null
  const { base, texture } = profile
  const points = texture === 'rough' ? roughPoints(base) : smoothPoints(base)
  return (
    <svg viewBox="0 0 208 40" className={className} data-testid={testId} aria-hidden>
      <path d={toPath(points)} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
      {texture === 'slick' ? (
        <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
          {striations(base).map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      ) : null}
    </svg>
  )
}
