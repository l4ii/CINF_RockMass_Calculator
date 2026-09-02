import { useState, useEffect } from 'react'
import { appSubtitleForLang, appTitleForLang } from '../../constants/appCopy'
import BackIconButton from '../BackIconButton'
import MiningAboutPage from './MiningAboutPage'
import { AboutPageHero, AboutSectionHeading, useResetScrollTop } from './AboutDesignPrimitives'
import { ABOUT_CASE_STUDIES, ABOUT_DEPARTMENT_NAMES } from './about/aboutSections'

function researchThumbFromFull(full: string): string {
  return full.replace(/(\.[^.]+)$/i, '-thumb$1')
}

export interface AboutPageProps {
  darkMode: boolean
  language: 'zh' | 'en'
  aboutDepartment: string
  aboutVisit?: number
  onBackToHome?: () => void
}

export default function AboutPage({ darkMode, language, aboutDepartment, aboutVisit = 0, onBackToHome }: AboutPageProps) {
  const appTitle = appTitleForLang(language)
  const appSubtitle = appSubtitleForLang(language)

  const [selectedCase, setSelectedCase] = useState<number | null>(null)
  const [zoomPlatformImageUrl, setZoomPlatformImageUrl] = useState<string | null>(null)
  const [researchZoomLightboxReady, setResearchZoomLightboxReady] = useState(false)
  const [researchThumbFallbackByKey, setResearchThumbFallbackByKey] = useState<Record<string, boolean>>({})
  const [researchPlatformImageLoadedByKey, setResearchPlatformImageLoadedByKey] = useState<Record<string, boolean>>({})
  const aboutScrollRef = useResetScrollTop<HTMLDivElement>(`${aboutDepartment}:${aboutVisit}`)

  useEffect(() => {
    if (zoomPlatformImageUrl) setResearchZoomLightboxReady(false)
  }, [zoomPlatformImageUrl])

  const cases = aboutDepartment === 'research' || aboutDepartment === 'mining' ? ABOUT_CASE_STUDIES[aboutDepartment] : []
  const deptName = aboutDepartment in ABOUT_DEPARTMENT_NAMES ? ABOUT_DEPARTMENT_NAMES[aboutDepartment as keyof typeof ABOUT_DEPARTMENT_NAMES] : ''
  const wrapCls = `thin-scroll flex-1 min-w-0 overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`
  const pageCls = 'w-full max-w-none px-3 py-4 sm:px-5 lg:px-6 2xl:px-8 2xl:py-6'
  const backButton = (
    <BackIconButton
      label={language === 'en' ? 'Back to Home' : '返回主页面'}
      darkMode={darkMode}
      onClick={onBackToHome}
      className="mb-3"
    />
  )

  if (aboutDepartment === 'research') {
    const researchCenters: Record<string, { name: string; image: string; placeholder: string }> = {
      recycling: {
        name: '湖南省再生金属资源循环利用工程技术研究中心',
        image: './about/rdc/info1.jpg',
        placeholder:
          '湖南省再生金属资源循环利用工程技术研究中心成立于2019年，为省级工程研究中心，由长沙有色冶金设计研究院组建。中心聚焦再生金属资源循环利用，研究方向涵盖多金属复杂物料熔炼、含砷固废治理、废旧动力电池回收等六大关键技术。成果方面，已获得多项省部级优秀设计奖及荣誉证书，技术研发与应用成效显著。',
      },
      leadZinc: {
        name: '湖南省铅锌清洁冶炼工程技术研究中心',
        image: './about/rdc/info2.jpg',
        placeholder:
          '湖南省铅锌清洁冶炼工程技术研究中心依托长沙有色冶金设计研究院成立，致力于锌、铜等有色金属的清洁冶炼与智能化关键技术研发，重点方向包括加压浸出、流态化熔炼等。中心承担多项国家及省级重大科研项目，取得显著成效，其中包括国家科技进步二等奖及多项省部级科技一等奖。',
      },
      deepMining: {
        name: '深井矿山安全高效开采技术湖南省工程研究中心',
        image: './about/rdc/info3.jpg',
        placeholder:
          '深井矿山安全高效开采技术湖南省工程研究中心由长沙有色冶金设计研究院与中南大学共建，聚焦深地资源绿色开发、矿山固废高值化利用、复杂难采矿体安全开采三大方向。中心团队成果丰硕，已取得多项技术突破与重大工程项目经验，致力于推动深井矿山安全、高效、绿色开采技术发展。',
      },
      safetyMonitor: {
        name: '湖南省矿山安全智能化监控技术与装备工程技术研究中心',
        image: './about/rdc/info4.jpg',
        placeholder:
          '湖南省矿山安全智能化监控技术与装备工程技术研究中心聚焦矿山灾害智能监测预警、无人自动巡检及大数据AI分析等方向。成果丰硕，获多项省部级科技奖，如"空天地"一体化监测技术获湖南省科技进步奖二等奖，Online SAR雷达系统获中国有色金属工业科学技术奖一等奖，并入选国家工信部安全应急装备推广案例。',
      },
      smartSmelting: {
        name: '湖南省有色冶金智能制造工程技术研究中心',
        image: './about/rdc/info5.jpg',
        placeholder:
          '湖南省有色冶金智能制造工程技术研究中心依托长沙有色冶金设计研究院，专注于数字化交付、大数据分析、智能装备与集成控制等方向。成果丰硕，获国家科技进步二等奖、多项省部级科技一等奖，授权发明专利40余项，制定标准13项，并发表多篇高水平论文。',
      },
    }
    const centerOrder = ['recycling', 'leadZinc', 'deepMining', 'safetyMonitor', 'smartSmelting'] as const
    const panelCls = `rounded-2xl border overflow-hidden shadow-sm ${darkMode ? 'border-gray-600 bg-gray-700/40' : 'border-slate-200 bg-white'}`
    const sectionTitleCls = `text-lg font-bold tracking-tight mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`
    const bodyCls = `text-sm leading-relaxed space-y-3 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`
    const capCls = `px-3 py-2 text-[11px] shrink-0 ${darkMode ? 'text-gray-400 bg-gray-800/60' : 'text-slate-600 bg-slate-50'}`
    const researchKickerCls = `text-[11px] font-semibold uppercase tracking-[0.2em] mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`
    const researchIntroP1 =
      '科研创新中心负责统筹长沙有色院科技创新与成果转化，对接主业设计咨询、工程总承包与生产运营中的技术需求，在采矿、选矿、冶炼、环保与节能降碳等领域组织课题攻关、标准与知识产权布局。中心与国家企业技术中心、博士后科研工作站及院研发中心、大师工作室、试验基地等协同联动，完善项目策划、过程管理与产学研用衔接，推动科研与工程实践相互支撑。'
    const researchIntroP2 =
      '以下按板块介绍我院牵头或共建的省级工程技术研究中心及工程研究中心，涵盖再生金属循环利用、铅锌清洁冶炼、深井矿山安全高效开采、矿山安全智能监控、有色冶金智能制造等方向；各平台研究方向与代表性成果见分块正文及展示资料。'

    return (
      <div ref={aboutScrollRef} className={wrapCls}>
        <div className={pageCls}>
          <div className="mb-5">
            {backButton}
            <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{appTitle}</h1>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{appSubtitle}</p>
          </div>
          <AboutPageHero
            darkMode={darkMode}
            index="02"
            eyebrow="长沙有色冶金设计研究院有限公司 · 科研创新中心"
            title="科研创新中心"
            summary={researchIntroP1}
            specialties={['创新平台建设', '成果转化', '标准与知识产权', '产学研用协同']}
          >
            <div className={`border p-5 sm:p-6 ${darkMode ? 'border-gray-700 bg-gray-900/35' : 'border-slate-200 bg-slate-50/75'}`}>
              <p className={researchKickerCls}>协同方向</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                {[
                  ['5个', '省级创新平台'],
                  ['采 · 选 · 冶', '主业技术需求'],
                  ['绿色低碳', '工程实践方向'],
                  ['全流程', '成果转化衔接'],
                ].map(([value, label]) => (
                  <div key={label} className={`border-l-2 pl-3 ${darkMode ? 'border-blue-400' : 'border-blue-600'}`}>
                    <strong className={`block text-base font-bold ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>{value}</strong>
                    <span className={`mt-0.5 block text-xs leading-5 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </AboutPageHero>

          <section className="mb-10">
            <AboutSectionHeading
              darkMode={darkMode}
              index="01"
              eyebrow="创新平台"
              title="面向工程实践的科研体系"
              description={researchIntroP2}
              aside="5个省级平台"
            />
            {centerOrder.map((key, idx) => {
            const item = researchCenters[key]
            const imgLoaded = researchPlatformImageLoadedByKey[key] === true
            const useFullInList = researchThumbFallbackByKey[key] === true
            const listSrc = useFullInList ? item.image : researchThumbFromFull(item.image)
            const isOdd = idx % 2 === 1
            return (
              <div key={key} className={`mb-10 ${panelCls}`}>
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                  <div
                    className={`flex flex-col ${isOdd ? 'order-1 lg:order-2 border-b lg:border-b-0 lg:border-l' : 'border-b lg:border-b-0 lg:border-r'} ${darkMode ? 'border-gray-600' : 'border-slate-200'}`}
                  >
                    <div className="relative flex min-h-[200px] items-center justify-center overflow-hidden bg-black/[0.03] p-4 dark:bg-black/20">
                      {!imgLoaded && (
                        <div className={`absolute inset-0 z-[1] flex items-center justify-center ${darkMode ? 'bg-gray-800/60 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                          <span className="text-sm">加载中...</span>
                        </div>
                      )}
                      <button
                        type="button"
                        className="relative z-[2] w-full max-w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        onClick={() => setZoomPlatformImageUrl(item.image)}
                        aria-label={`放大查看：${item.name}`}
                      >
                        <img
                          src={listSrc}
                          alt={item.name}
                          loading={idx === 0 ? 'eager' : 'lazy'}
                          className={`mx-auto max-h-[min(480px,65vh)] w-auto max-w-full cursor-zoom-in object-contain transition-opacity duration-200 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                          onLoad={() => setResearchPlatformImageLoadedByKey((prev) => ({ ...prev, [key]: true }))}
                          onError={() => {
                            if (!useFullInList) setResearchThumbFallbackByKey((prev) => ({ ...prev, [key]: true }))
                            else setResearchPlatformImageLoadedByKey((prev) => ({ ...prev, [key]: true }))
                          }}
                        />
                      </button>
                    </div>
                    <p className={capCls}>平台展示 · 点击可放大</p>
                  </div>
                  <div className={`flex flex-col justify-center p-6 sm:p-8 ${isOdd ? 'order-2 lg:order-1' : ''}`}>
                    <p className={`mb-2 text-[11px] font-bold tracking-[0.16em] ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>PLATFORM / {String(idx + 1).padStart(2, '0')}</p>
                    <h3 className={sectionTitleCls}>{item.name}</h3>
                    <div className={bodyCls}>
                      <p>{item.placeholder}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
            })}
          </section>
          {zoomPlatformImageUrl && (
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
              onClick={() => setZoomPlatformImageUrl(null)}
              role="dialog"
              aria-modal="true"
              aria-label="放大查看图片"
            >
              <button
                type="button"
                className="absolute top-4 right-4 z-[2] w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center text-xl"
                onClick={() => setZoomPlatformImageUrl(null)}
                aria-label="关闭"
              >
                ×
              </button>
              {!researchZoomLightboxReady && (
                <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 text-white text-sm pointer-events-none">
                  <span className="inline-block h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden />
                  <span>加载中...</span>
                </div>
              )}
              <img
                src={zoomPlatformImageUrl}
                alt="放大查看"
                className={`relative z-[1] max-w-full max-h-[90vh] w-auto h-auto object-contain cursor-pointer transition-opacity duration-200 ${researchZoomLightboxReady ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setResearchZoomLightboxReady(true)}
                onError={() => setResearchZoomLightboxReady(true)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  if (aboutDepartment === 'mining') {
    return <MiningAboutPage darkMode={darkMode} appTitle={appTitle} appSubtitle={appSubtitle} aboutVisit={aboutVisit} onBackToHome={onBackToHome} />
  }

  if (aboutDepartment === 'cinf') {
    const sectionKickerCls = `text-[11px] font-semibold uppercase tracking-[0.2em] mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`
    const panelCls = `rounded-2xl border overflow-hidden shadow-sm ${darkMode ? 'border-gray-600 bg-gray-700/40' : 'border-slate-200 bg-white'}`
    const capCls = `px-3 py-2 text-[11px] shrink-0 ${darkMode ? 'text-gray-400 bg-gray-800/60' : 'text-slate-600 bg-slate-50'}`
    const dividerCls = darkMode ? 'border-gray-600' : 'border-slate-200'
    const chipCls = `px-3 py-1 rounded-full text-xs font-medium border ${darkMode ? 'border-gray-600 bg-gray-800/60 text-gray-300' : 'border-slate-200 bg-white text-slate-700'}`
    const valueCls = `px-3 py-1 text-xs font-semibold rounded-full border ${darkMode ? 'border-blue-700/50 bg-blue-900/40 text-blue-300' : 'border-blue-200 bg-blue-50 text-blue-700'}`
    const cinfStats = [
      { n: '11项', l: '甲级资质' },
      { n: '900+', l: '在册职工' },
      { n: '1300+', l: '获奖项目' },
      { n: '500+', l: '有效专利' },
    ]

    return (
      <div ref={aboutScrollRef} className={wrapCls}>
        <div className={pageCls}>
          <div className="mb-5">
            {backButton}
            <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{appTitle}</h1>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{appSubtitle}</p>
          </div>
          <AboutPageHero
            darkMode={darkMode}
            index="01"
            eyebrow="长沙有色冶金设计研究院有限公司 · 企业概况"
            title="有色金属全产业链技术与服务提供商"
            summary="长沙有色冶金设计研究院有限公司（简称长沙有色院）于1953年正式成立，是我国最早成立的大型综合性设计研究单位之一，隶属于中国铝业集团有限公司，为中铝国际工程股份有限公司子公司。"
            specialties={['矿山工程', '冶炼工程', '工程总承包', '绿色低碳', '智能制造']}
          >
            <div className={`relative overflow-hidden border shadow-sm ${darkMode ? 'border-gray-700 bg-black/20' : 'border-slate-200 bg-slate-100'}`}>
              <div className="aspect-[16/10] w-full">
                <img src="./about/cinf/chinalco-building.png" alt="长沙有色冶金设计研究院大楼" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <p className={capCls}>中国铝业集团 · 长沙有色冶金设计研究院有限公司</p>
            </div>
          </AboutPageHero>

          <div className={`mb-10 ${panelCls}`}>
            <div className={`grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 ${darkMode ? 'divide-gray-600' : 'divide-slate-200'}`}>
              {cinfStats.map((s) => (
                <div key={s.l} className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className={`text-2xl sm:text-3xl font-bold tabular-nums ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{s.n}</div>
                  <div className={`mt-1.5 text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={`mb-8 ${panelCls}`}>
            <div className="grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,360px)_1fr] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,420px)_1fr] xl:gap-12 2xl:grid-cols-[minmax(0,460px)_1fr]">
              <div className="mx-auto w-full max-w-[min(100%,360px)] shrink-0 sm:max-w-[380px] lg:mx-0 lg:max-w-none xl:max-w-[420px] 2xl:max-w-[460px]">
                <div className={`overflow-hidden rounded-xl border shadow-sm ${darkMode ? 'border-gray-600 bg-black/20' : 'border-slate-200/90 bg-slate-100'}`}>
                  <img
                    src="./about/cinf/pic1.png"
                    alt="长沙有色冶金设计研究院"
                    className="mx-auto block h-auto w-full max-h-[min(620px,62vh)] object-contain object-top sm:max-h-[min(700px,66vh)] lg:max-h-[min(780px,70vh)] xl:max-h-[min(860px,72vh)]"
                    loading="lazy"
                  />
                </div>
                <div className={`flex flex-col items-stretch gap-2 border-t px-4 py-3 ${darkMode ? 'border-gray-600 bg-gray-900/35' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['责任', '诚信', '开放', '卓越'].map((v) => (
                      <span key={v} className={valueCls}>
                        {v}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['AAA级信用企业', '国家高新技术企业'].map((c) => (
                      <span key={c} className={chipCls}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="min-w-0">
                <AboutSectionHeading
                  darkMode={darkMode}
                  index="01"
                  eyebrow="历史沿革 · 创新实践"
                  title="发展历程与组织沿革"
                  aside="70余年技术积淀"
                />
                <div className={`mt-4 space-y-3 leading-relaxed text-[15px] sm:text-base ${darkMode ? 'text-gray-200' : 'text-slate-800'}`}>
                  <p>
                    1954年，长沙有色院由赣州迁至长沙，先后隶属于重工业部、冶金工业部、中国有色金属工业总公司、国家有色金属工业局、中国稀有稀土集团。2000年7月由中央下放到湖南省管理，2007年6月加入中国铝业公司。2011年3月改制为中铝国际出资设立的一人有限责任公司，名称变更为「长沙有色冶金设计研究院有限公司」。2015年3月，中铝国际将山东建设（后更名为南方工程）划转；2024年3月，将长勘院划转到长沙有色院。
                  </p>
                  <p>
                    历经七十余年，长沙有色院已形成较强的综合技术实力与行业影响力：在册职工900余人，专业技术人员800余人，拥有全国工程勘察设计大师、行业勘察设计大师、享受政府特殊津贴专家及大批注册工程师；建有
                    <strong className={darkMode ? 'text-gray-100' : 'text-slate-900'}>3个国家级、7个省级科技创新平台</strong>
                    及多个研究生联合培养与中试基地。累计完成工程咨询设计项目万余项，获国家、省、部级科技进步奖与优秀工程设计咨询奖1300余项，有效专利500余件，服务足迹遍及40余个国家与地区。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={`mb-8 overflow-hidden rounded-2xl border shadow-sm ${darkMode ? 'border-gray-600 bg-gray-800/30' : 'border-slate-200 bg-white'}`}>
            <div className={darkMode ? 'bg-black/25' : 'bg-slate-100'}>
              <img src="./about/cinf/pic3.jpg" alt="长沙有色院企业形象" className="mx-auto block h-auto w-full max-h-[280px] object-contain sm:max-h-[320px] md:max-h-[380px]" loading="lazy" />
            </div>
            <p className={`border-t px-4 py-2.5 text-center text-xs sm:text-sm ${darkMode ? 'border-gray-600 text-gray-400 bg-gray-900/40' : 'border-slate-200 text-slate-600 bg-slate-50'}`}>企业精神</p>
          </div>

          <div className={`mb-10 ${panelCls}`}>
            <div className="p-5 sm:p-6">
              <AboutSectionHeading
                darkMode={darkMode}
                index="02"
                eyebrow="联系方式"
                title="公司与业务联系"
                aside="对外联络"
              />
              <div className={`mt-3 grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-6 lg:gap-x-4 lg:gap-y-2 ${darkMode ? 'border-gray-600 bg-gray-800/35' : 'border-slate-200 bg-slate-50/90'}`}>
                <div className="min-w-0 sm:col-span-2 lg:col-span-3">
                  <div className={`text-[10px] font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>联系地址</div>
                  <div className={`mt-0.5 text-sm leading-snug ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>湖南省长沙市雨花区木莲东路299号</div>
                </div>
                <div className="min-w-0 lg:col-span-1">
                  <div className={`text-[10px] font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>邮政编码</div>
                  <div className={`mt-0.5 text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>410019</div>
                </div>
                <div className="min-w-0 lg:col-span-1">
                  <div className={`text-[10px] font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>办公室</div>
                  <a href="tel:0731-84397032" className={`mt-0.5 inline-block text-sm hover:opacity-80 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    0731-84397032
                  </a>
                </div>
                <div className="min-w-0 lg:col-span-1">
                  <div className={`text-[10px] font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>传真</div>
                  <div className={`mt-0.5 text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>0731-82228112</div>
                </div>
                <div className="min-w-0 sm:col-span-2 lg:col-span-6">
                  <div className={`text-[10px] font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Email</div>
                  <a href="mailto:cinf@chinalco.com.cn" className={`mt-0.5 inline-block text-sm hover:opacity-80 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    cinf@chinalco.com.cn
                  </a>
                </div>
              </div>

              <div className={`mt-4 border-t pt-3 ${dividerCls}`}>
                <p className={`${sectionKickerCls} !mb-2`}>对外联络</p>
                <div className="grid gap-2.5 md:grid-cols-3">
                  <div className={`rounded-lg border px-3 py-2.5 ${darkMode ? 'border-gray-600 bg-gray-800/40' : 'border-slate-200 bg-white'}`}>
                    <div className={`text-xs font-semibold leading-tight ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>生产运营中心（市场开发部）</div>
                    <div className="mt-1.5 space-y-0.5 text-sm leading-snug">
                      <div>
                        <span className={darkMode ? 'text-gray-500' : 'text-gray-500'}>电话 </span>
                        <a href="tel:0731-84397070" className={`hover:opacity-80 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          0731-84397070
                        </a>
                      </div>
                      <div className="break-all">
                        <span className={darkMode ? 'text-gray-500' : 'text-gray-500'}>Email </span>
                        <a href="mailto:cinf_scjy@chinalco.com.cn" className={`hover:opacity-80 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          cinf_scjy@chinalco.com.cn
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className={`rounded-lg border px-3 py-2.5 ${darkMode ? 'border-gray-600 bg-gray-800/40' : 'border-slate-200 bg-white'}`}>
                    <div className={`text-xs font-semibold leading-tight ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>海外业务中心（海外发展中心）</div>
                    <div className="mt-1.5 space-y-0.5 text-sm leading-snug">
                      <div>
                        <span className={darkMode ? 'text-gray-500' : 'text-gray-500'}>电话 </span>
                        <a href="tel:0086-731-84397078" className={`hover:opacity-80 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          0086-731-84397078 / 84397079
                        </a>
                      </div>
                      <div className="break-all">
                        <span className={darkMode ? 'text-gray-500' : 'text-gray-500'}>Email </span>
                        <a href="mailto:cinf_intl@chinalco.com.cn" className={`hover:opacity-80 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          cinf_intl@chinalco.com.cn
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className={`rounded-lg border px-3 py-2.5 ${darkMode ? 'border-gray-600 bg-gray-800/40' : 'border-slate-200 bg-white'}`}>
                    <div className={`text-xs font-semibold leading-tight ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>人力资源部（党委组织部）</div>
                    <div className="mt-1.5 text-sm">
                      <span className={darkMode ? 'text-gray-500' : 'text-gray-500'}>电话 </span>
                      <a href="tel:0731-84397022" className={`hover:opacity-80 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        0731-84397022
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={aboutScrollRef} className={wrapCls}>
      <div className={pageCls}>
        <div className="mb-5">
          {backButton}
          <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{appTitle}</h1>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{appSubtitle}</p>
        </div>
        <div className={`rounded-lg shadow-sm border p-5 mb-5 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {deptName} - 案例分析
          </h2>
          <div className="space-y-4">
            {cases.map((caseStudy, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedCase === index ? `border-blue-500 ${darkMode ? 'bg-gray-600' : 'bg-blue-50'}` : darkMode ? 'border-gray-600 hover:border-gray-500 bg-gray-600' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}
                onClick={() => setSelectedCase(selectedCase === index ? null : index)}
              >
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{caseStudy.title}</h3>
                <p className={`text-sm mb-3 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{caseStudy.description}</p>
                {selectedCase === index && (
                  <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-500' : 'border-gray-200'}`}>
                    <div className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>项目亮点：</div>
                    <ul className="space-y-1">
                      {caseStudy.highlights.map((h, i) => (
                        <li key={i} className={`text-sm flex items-start ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <span className="mr-2">•</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
