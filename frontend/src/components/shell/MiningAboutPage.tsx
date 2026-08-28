import { useState } from 'react'
import { ArrowUpRight, ChevronRight, Maximize2, X } from 'lucide-react'
import BackIconButton from '../BackIconButton'
import { AboutPageHero, AboutSectionHeading, useResetScrollTop } from './AboutDesignPrimitives'

type MiningAboutPageProps = {
  darkMode: boolean
  appTitle: string
  appSubtitle: string
  aboutVisit?: number
  onBackToHome?: () => void
}

type MiningImage = {
  src: string
  alt: string
  label: string
}

const miningImages: MiningImage[] = [
  {
    src: './about/2/mine-overview.jpeg',
    alt: '露天矿山工程全景',
    label: '露天矿山工程',
  },
  {
    src: './about/2/mine-high-altitude.jpeg',
    alt: '高寒高海拔矿山工程现场',
    label: '高寒高海拔矿山',
  },
  {
    src: './about/2/mine-deep-shaft.jpeg',
    alt: '深井矿山竖井工程现场',
    label: '深井矿山开采',
  },
  {
    src: './about/2/mine-hard-rock.jpeg',
    alt: '复杂难采矿体的地下钻机作业现场',
    label: '复杂难采矿体',
  },
  {
    src: './about/2/mine-green.jpeg',
    alt: '绿色矿山工程景观',
    label: '绿色矿山建设',
  },
]

const technologyPillars = [
  {
    key: 'HIGH',
    title: '高 · 高寒高海拔',
    text: '面向高原、极寒与复杂生态环境，统筹采选工艺、能源系统、运输组织和生态保护。',
    image: miningImages[1],
  },
  {
    key: 'DEEP',
    title: '深 · 超深井开采',
    text: '覆盖高地应力、高地温、高渗透压条件下的围岩控制、提升运输、通风与充填技术。',
    image: miningImages[2],
  },
  {
    key: 'DIFFICULT',
    title: '难 · 复杂难采矿体',
    text: '针对大水、破碎围岩、煤系共伴生和复杂多金属矿石，形成安全高效的综合解决方案。',
    image: miningImages[3],
  },
  {
    key: 'GREEN',
    title: '绿 · 全生命周期治理',
    text: '贯通绿色开采、固废资源化、尾矿综合利用、地灾治理和矿区生态修复。',
    image: miningImages[4],
  },
]

const serviceAreas = [
  { title: '采矿工程', text: '露天、地下及露天地下联合开采，覆盖采矿方法、开拓运输、通风排水与生产组织。' },
  { title: '选矿与综合回收', text: '面向复杂难选多金属矿石，开展流程比选、分选技术和资源综合回收设计。' },
  { title: '充填、尾矿与输送', text: '提供膏体充填、尾矿库、长距离管道和胶带运输等系统的全过程技术服务。' },
  { title: '智能矿山', text: '建设生产调度、安全监测、无人巡检和多源数据集成分析等现代矿山系统。' },
  { title: '绿色矿山与生态修复', text: '将剥离、采矿、复垦与矿山固废资源化纳入统一的绿色工程方案。' },
  { title: '工程咨询与总承包', text: '覆盖规划咨询、可研、设计、EPC、项目管理、生产运营和技术改造。' },
]

const leadingExperts = [
  { name: '刘放来', role: '全国工程勘察设计大师', image: { src: './about/2/mine-expert-liu-fanglai.jpeg', alt: '全国工程勘察设计大师刘放来肖像', label: '刘放来' } },
  { name: '刘福春', role: '全国有色金属行业设计大师', image: { src: './about/2/mine-expert-liu-fuchun.jpeg', alt: '全国有色金属行业设计大师刘福春肖像', label: '刘福春' } },
  { name: '陈建双', role: '全国有色金属行业设计大师', image: { src: './about/2/mine-expert-chen-jianshuang.jpeg', alt: '全国有色金属行业设计大师陈建双肖像', label: '陈建双' } },
  { name: '朱建国', role: '全国有色金属行业设计大师', image: { src: './about/2/mine-expert-zhu-jianguo.jpeg', alt: '全国有色金属行业设计大师朱建国肖像', label: '朱建国' } },
  { name: '陶平凯', role: '全国有色金属行业设计大师', image: { src: './about/2/mine-expert-tao-pingkai.jpeg', alt: '全国有色金属行业设计大师陶平凯肖像', label: '陶平凯' } },
  { name: '陈典助', role: '全国有色金属行业设计大师', image: { src: './about/2/mine-expert-chen-dianzhu.jpeg', alt: '全国有色金属行业设计大师陈典助肖像', label: '陈典助' } },
]

const representativeMines = [
  { name: '会泽铅锌矿', text: '中国第一深井矿山，井深1526.5米，形成超深井井壁主动卸压、柔刚性综合支护及多物料多点提升等技术成果。' },
  { name: '阿舍勒铜矿', text: '面向新疆高寒地区铜矿建设，完成深部开采、提升运输与复杂地质条件下的系统设计。' },
  { name: '金川龙首矿', text: '中国首条超千米混合井，井筒直径6.7米、井深1083.65米，形成复杂深井建设与提升技术经验。' },
  { name: '焦家金矿', text: '国内大型地下金矿代表项目，围绕深部开采、采掘接续和安全生产组织形成系统化设计成果。' },
  { name: '凡口铅锌矿', text: '面向大水、破碎围岩和复杂矿体条件，开展采矿方法、支护和通风排水等综合技术研究。' },
  { name: '盘龙铅锌矿', text: '地下复杂低品位铅锌矿协同开采示范项目，重点解决资源回收、采场稳定和生产组织问题。' },
  { name: '鸡冠咀金铜矿', text: '湖北三鑫金铜矿深部开采项目，形成高应力条件下的开采与支护技术方案。' },
  { name: '华锡铜坑矿', text: '锡多金属矿综合开发项目，围绕复杂矿石选别与资源综合回收开展工程设计。' },
  { name: '高峰矿', text: '面向复杂铅锌多金属矿石，完成采矿、选矿和综合回收的协同设计。' },
  { name: '李家湾锰矿', text: '国内开采规模较大的锰矿项目，形成大规模地下采矿和运输系统工程经验。' },
  { name: '平果铝土矿', text: '全球首座岩溶堆积型铝土矿山，采用剥离、采矿、复垦一体化工艺推进绿色开采。' },
  { name: '华兴铝土矿', text: '广西大型铝土矿项目，围绕露天开采、矿石运输和矿山生态治理开展全过程设计。' },
  { name: '那坡龙合铝土矿', text: '岩溶堆积型铝土矿项目，统筹采矿工艺、排土场、复垦和水土保持等工程系统。' },
  { name: '猫场铝土矿', text: '中国大型单体地下铝土矿，围绕地下开拓、采矿方法和矿石运输形成成套技术成果。' },
  { name: '瓦厂坪铝土矿', text: '国内较早采用综合机械化采掘工艺的金属矿山，重点解决装备适应性和生产组织问题。' },
  { name: '南川铝土矿', text: '重庆大型地下铝土矿项目，针对煤系共伴生条件开展开采与安全生产系统设计。' },
  { name: '兴县氧化铝一期矿山', text: '与煤伴生紧密的地下铝土矿项目，统筹资源开发、矿山建设和氧化铝生产衔接。' },
  { name: '水银洞金矿', text: '大型砂岩金矿项目，围绕复杂地质条件下的采矿方法和安全生产开展工程咨询设计。' },
  { name: '科卡金矿', text: '“一带一路”海外地下金矿项目，提供从前期研究到工程设计的全过程技术服务。' },
  { name: '七里井芒硝矿', text: '中国特大型化工矿山项目，完成资源开发、采矿系统和地面工程的综合设计。' },
]

function MiningLightbox({ image, onClose }: { image: MiningImage | null; onClose: () => void }) {
  if (!image) return null
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="图片预览"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-lg bg-white/15 text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="关闭图片预览"
        title="关闭图片预览"
        onClick={onClose}
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
      <img
        src={image.src}
        alt={image.alt}
        className="max-h-[92vh] max-w-full rounded-lg object-contain shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  )
}

function MiningProjectDialog({ project, darkMode, onClose }: { project: (typeof representativeMines)[number] | null; darkMode: boolean; onClose: () => void }) {
  if (!project) return null
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`${project.name}工程简介`}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-xl rounded-xl border p-6 shadow-2xl sm:p-8 ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={`absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-slate-500 hover:bg-slate-100'}`}
          aria-label="关闭工程简介"
          title="关闭工程简介"
          onClick={onClose}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <p className={`mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>代表性工程</p>
        <h2 className="pr-10 text-2xl font-bold">{project.name}</h2>
        <p className={`mt-4 text-sm leading-7 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>{project.text}</p>
      </div>
    </div>
  )
}

export default function MiningAboutPage({ darkMode, appTitle, appSubtitle, aboutVisit = 0, onBackToHome }: MiningAboutPageProps) {
  const [lightboxImage, setLightboxImage] = useState<MiningImage | null>(null)
  const [selectedMine, setSelectedMine] = useState<(typeof representativeMines)[number] | null>(null)
  const aboutScrollRef = useResetScrollTop<HTMLDivElement>(`mining:${aboutVisit}`)
  const pageCls = 'w-full max-w-none px-3 py-4 sm:px-5 lg:px-6 2xl:px-8 2xl:py-6'
  const wrapCls = `thin-scroll flex-1 min-w-0 overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`
  const panelCls = `rounded-xl border shadow-sm ${darkMode ? 'border-gray-700 bg-gray-800/70' : 'border-slate-200 bg-white'}`
  const mutedText = darkMode ? 'text-gray-300' : 'text-slate-600'
  const headingText = darkMode ? 'text-white' : 'text-slate-900'
  const kickerText = darkMode ? 'text-blue-400' : 'text-blue-700'

  return (
    <>
      <MiningLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
      <MiningProjectDialog project={selectedMine} darkMode={darkMode} onClose={() => setSelectedMine(null)} />
      <div ref={aboutScrollRef} className={wrapCls}>
        <div className={pageCls}>
          <div className="mb-5">
            <BackIconButton label="返回主页面" darkMode={darkMode} onClick={onBackToHome} className="mb-3" />
            <h1 className={`mb-2 text-2xl font-bold ${headingText}`}>{appTitle}</h1>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{appSubtitle}</p>
          </div>

          <AboutPageHero
            darkMode={darkMode}
            index="03"
            eyebrow="长沙有色院 · 矿山事业部"
            title="矿山工程"
            summary="经过70余年的技术积累，长沙有色院持续服务国内外矿山工程建设，在高寒高海拔、超深井、复杂难采和绿色智能矿山领域形成了完整的技术体系。"
            specialties={['规划咨询', '工程设计', 'EPC总承包', '科研与技术开发']}
          >
            <button
              type="button"
              className="group relative min-h-[260px] w-full overflow-hidden bg-slate-900 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
              onClick={() => setLightboxImage(miningImages[0])}
              aria-label="放大查看露天矿山工程图片"
            >
              <img src={miningImages[0].src} alt={miningImages[0].alt} className="h-full min-h-[260px] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-lg bg-slate-950/75 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm">
                {miningImages[0].label}
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </button>
          </AboutPageHero>

          <section className={`${panelCls} mb-8 overflow-hidden`}>
            <div className="grid grid-cols-2 divide-x divide-y sm:grid-cols-4 sm:divide-y-0 divide-slate-200 dark:divide-gray-700">
              {[
                ['70+', '年矿山工程积累'],
                ['300+', '矿业类核心技术专利'],
                ['100+', '省部级优秀设计与科技奖'],
                ['40+', '个国家和地区技术服务'],
              ].map(([value, label]) => (
                <div key={label} className="flex min-h-[112px] flex-col items-center justify-center px-3 py-6 text-center">
                  <strong className={`text-2xl font-bold tabular-nums sm:text-3xl ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{value}</strong>
                  <span className={`mt-1.5 text-xs font-medium sm:text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={`${panelCls} mb-8 overflow-hidden`}>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.3fr)]">
              <div className={`p-6 sm:p-7 ${darkMode ? 'bg-blue-950/35' : 'bg-blue-50/70'}`}>
                <AboutSectionHeading
                  darkMode={darkMode}
                  index="01"
                  eyebrow="资质与人才"
                  title="行业大师领衔的专业团队"
                  description="矿山工程人才覆盖采矿、选矿、岩土、机械、电气、自动化和工程管理等专业，为复杂矿山项目提供跨专业协同服务。"
                />
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ['900+', '专业技术人员'],
                    ['460', '高级职称人员'],
                    ['70', '正高级工程师'],
                    ['460', '国家注册工程师'],
                  ].map(([value, label]) => (
                    <div key={label} className={`border-l-2 pl-3 ${darkMode ? 'border-blue-500' : 'border-blue-600'}`}>
                      <strong className={`block text-lg font-bold ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>{value}</strong>
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 sm:p-7">
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <h3 className={`text-base font-bold ${headingText}`}>矿山工程领域代表性大师</h3>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>宣传册精选</span>
                </div>
                <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
                  {leadingExperts.map((expert) => (
                    <div
                      key={expert.name}
                      className={`flex min-w-0 items-center gap-3 border-t py-3 ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}
                    >
                      <span className={`relative block h-16 w-16 shrink-0 overflow-hidden rounded-md border ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-slate-200 bg-slate-100'}`}>
                        <img src={expert.image.src} alt={expert.image.alt} className="h-full w-full object-cover" />
                      </span>
                      <span className="min-w-0">
                        <span className={`block truncate text-sm font-semibold ${headingText}`}>{expert.name}</span>
                        <span className={`mt-0.5 block text-xs leading-4 ${mutedText}`}>{expert.role}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <AboutSectionHeading
              darkMode={darkMode}
              index="02"
              eyebrow="技术优势"
              title="攻克矿山工程的“高、深、难、绿”"
              aside="核心技术方向"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {technologyPillars.map((item) => (
                <article key={item.key} className={`${panelCls} overflow-hidden`}>
                  <button
                    type="button"
                    className="group relative block aspect-[16/10] w-full overflow-hidden bg-slate-900 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                    onClick={() => setLightboxImage(item.image)}
                    aria-label={`放大查看${item.image.alt}`}
                  >
                    <img src={item.image.src} alt={item.image.alt} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                    <span className="absolute right-3 top-3 rounded-md bg-slate-950/65 p-2 text-white opacity-0 transition group-hover:opacity-100">
                      <Maximize2 className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </button>
                  <div className="p-5">
                    <div className={`mb-3 text-xs font-bold tracking-[0.18em] ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>{item.key}</div>
                    <h3 className={`text-base font-bold ${headingText}`}>{item.title}</h3>
                    <p className={`mt-2 text-sm leading-6 ${mutedText}`}>{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={`${panelCls} mb-8 p-5 sm:p-7`}>
            <AboutSectionHeading
              darkMode={darkMode}
              index="03"
              eyebrow="全产业链服务"
              title="从资源开发到矿山运营的专业能力"
            />
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
              {serviceAreas.map((item, index) => (
                <div key={item.title} className="flex gap-3">
                  <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md text-xs font-bold ${darkMode ? 'bg-blue-950 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className={`font-semibold ${headingText}`}>{item.title}</h3>
                    <p className={`mt-1 text-sm leading-6 ${mutedText}`}>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={`${panelCls} mb-8 p-5 sm:p-7`}>
            <AboutSectionHeading
              darkMode={darkMode}
              index="04"
              eyebrow="代表性工程"
              title="数百座矿山的工程经验"
              aside="宣传册精选案例"
            />
            <div className={`grid grid-cols-2 border-t sm:grid-cols-3 xl:grid-cols-5 ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
              {representativeMines.map((mine, index) => (
                <button
                  key={mine.name}
                  type="button"
                  className={`group flex min-h-14 items-center gap-3 border-b px-3 py-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:px-4 ${darkMode ? 'border-gray-700 hover:bg-gray-700/60' : 'border-slate-200 hover:bg-blue-50/70'}`}
                  onClick={() => setSelectedMine(mine)}
                  aria-label={`查看${mine.name}工程简介`}
                >
                  <span className={`text-[11px] font-bold tabular-nums ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>{String(index + 1).padStart(2, '0')}</span>
                  <span className={`min-w-0 flex-1 font-medium ${headingText}`}>{mine.name}</span>
                  <ChevronRight className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`} aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>

          <section className={`${panelCls} mb-8 p-5 sm:p-7`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className={`mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] ${kickerText}`}>工程承诺</p>
                <h2 className={`text-base font-bold sm:text-xl ${headingText}`}>让资源开发更安全、更高效、更绿色</h2>
                <p className={`mt-2 max-w-3xl text-sm leading-6 ${mutedText}`}>长沙有色院将创新驱动、诚信服务与持续创造价值贯穿项目全生命周期，为矿山客户提供可落地、可运营、可持续的工程方案。</p>
              </div>
              <ArrowUpRight className={`h-7 w-7 shrink-0 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`} aria-hidden="true" />
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
