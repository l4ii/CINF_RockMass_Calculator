import { useState, useEffect } from 'react'
import {
  APP_NAME_EN,
  APP_NAME_ZH,
  APP_ORG_NAME_EN,
  APP_ORG_NAME_ZH,
  APP_TAGLINE_MAIN_EN,
  APP_TAGLINE_ZH,
  LICENSE_TOKEN_PREFIX,
} from '../constants/appCopy'
import { getElectronApi } from '../utils/electronApi'

const APP_LOGO_SRC = './icon.png'

const prefixHintZh = `密钥以 ${LICENSE_TOKEN_PREFIX.slice(0, -1)} 开头`
const prefixHintEn = `One full line starting with ${LICENSE_TOKEN_PREFIX.slice(0, -1)}`

const copy = {
  zh: {
    badge: '许可激活',
    zoneActivationTitle: '产品激活',
    activationHint: `复制「设备标识」发送至授权方以获取许可密钥；密钥与当前设备绑定。${prefixHintZh}，请整段一行粘贴。`,
    deviceLabel: '设备标识',
    copy: '复制',
    copied: '已复制',
    licenseLabel: '许可密钥',
    placeholder: `许可密钥以 ${LICENSE_TOKEN_PREFIX} 开头，整段粘贴即可。`,
    activate: '激活',
    activating: '正在激活…',
    needElectron: '请在已安装的桌面版中完成激活。浏览器访问无法完成此步骤。',
    zoneContactTitle: '授权方联络方式',
    orgName: APP_ORG_NAME_ZH,
    orgBlurb:
      '创建于1953年，隶属中国铝业集团有限公司；为国家高新技术企业、国家技术创新示范企业、国家企业技术中心，建有3个国家级与7个省级科技创新平台。900余名在册职工（专业技术人员800余人），获国家与省部级奖项1300余项、有效专利500余件，业务遍及海内外——依托国家级企业技术中心与长效科研积淀，具备专业工程软件的自主研发与持续迭代能力。',
    contactRouting:
      '如需获取本软件使用授权，或咨询软件使用相关问题，请邮件联系下方「开发者」；如有公司业务洽谈、合作与其它综合联络需求，请邮件联系「综合邮箱」。',
    mailCompanyLabel: '综合邮箱',
    mailCompanyHint: '公司业务与综合联络',
    mailDevLabel: '开发者',
    mailDevHint: '本软件授权及其它相关咨询',
  },
  en: {
    badge: 'License',
    zoneActivationTitle: 'Activation',
    activationHint: `Send your device ID to obtain a license key tied to this machine. Paste ${prefixHintEn}.`,
    deviceLabel: 'Device ID',
    copy: 'Copy',
    copied: 'Copied',
    licenseLabel: 'License Key',
    placeholder: `${LICENSE_TOKEN_PREFIX}…`,
    activate: 'Activate',
    activating: 'Activating…',
    needElectron: 'Use the installed desktop app to complete activation.',
    zoneContactTitle: 'Licensor contact',
    orgName: APP_ORG_NAME_EN,
    orgBlurb:
      'Founded in 1953 under Aluminum Corporation of China; national high-tech enterprise, national technological innovation demonstration enterprise, and national enterprise technology center, with 3 national and 7 provincial S&T innovation platforms. 900+ employees (800+ technical professionals), 1,300+ national/provincial/ministerial awards, 500+ patents, projects worldwide—the enterprise technology center and sustained R&D underpin credible in-house development of professional engineering software.',
    contactRouting:
      'For license activation or limited day-to-day questions about this software, email the developer below. For corporate business, partnerships and general enquiries, use the general mailbox.',
    mailCompanyLabel: 'General email',
    mailCompanyHint: 'Corporate & general enquiries',
    mailDevLabel: 'Developer',
    mailDevHint: 'License activation & limited software support',
  },
}

function IconShieldCheck(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className} aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconBuilding(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className} aria-hidden>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 12h4m4 0h4M9 6v2m6-2v2m-6 4v2m6-2v2" strokeLinecap="round" />
    </svg>
  )
}

function IconMail(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className} aria-hidden>
      <path d="m22 6-10 7L2 6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="2" y="4" width="20" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function LicenseActivation({
  language,
  onActivated,
}: {
  language: 'zh' | 'en'
  onActivated: () => void
}) {
  const t = copy[language]
  const [machineId, setMachineId] = useState<string>('')
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [appVersion, setAppVersion] = useState<string>('')
  const [logoOk, setLogoOk] = useState(true)

  const bodyCls = 'text-[14px] leading-relaxed text-slate-600'

  useEffect(() => {
    const api = getElectronApi()?.license
    if (!api) return
    void api.getStatus().then((s) => {
      if (s.machineId) setMachineId(s.machineId)
    })
  }, [])

  useEffect(() => {
    const v = getElectronApi()?.update?.getAppVersion
    if (!v) return
    void v().then(setAppVersion).catch(() => {})
  }, [])

  const copyId = () => {
    if (!machineId) return
    void navigator.clipboard.writeText(machineId).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    })
  }

  const activate = async () => {
    const api = getElectronApi()?.license
    if (!api) {
      setError(t.needElectron)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const r = await api.activate(input.trim())
      if (r.ok) {
        onActivated()
        return
      }
      setError(r.error || (language === 'zh' ? '激活失败' : 'Activation failed'))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      setError(msg || (language === 'zh' ? '激活失败' : 'Activation failed'))
    } finally {
      setBusy(false)
    }
  }

  const appName = language === 'zh' ? APP_NAME_ZH : APP_NAME_EN
  const tagline = language === 'en' ? APP_TAGLINE_MAIN_EN : APP_TAGLINE_ZH

  const mailCardCls =
    'rounded-lg border border-slate-200/90 bg-white px-3.5 py-3 shadow-sm transition-shadow hover:border-blue-200/70 hover:shadow'

  return (
    <div className="relative isolate box-border min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto bg-[radial-gradient(ellipse_100%_70%_at_50%_-15%,rgba(59,130,246,0.1),transparent)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(248,250,252,0.9))]" />

      <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center px-3 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-[min(92rem,calc(100vw-1.5rem))]">
          <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl ring-1 ring-slate-900/[0.06]">
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-5 py-5 text-white sm:px-8 sm:py-6">
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-500/20 blur-2xl" />
              <div className="relative flex items-start gap-3 sm:gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/25 sm:h-16 sm:w-16">
                  {logoOk ? (
                    <img
                      src={APP_LOGO_SRC}
                      alt=""
                      className="h-[92%] w-[92%] object-contain scale-110"
                      onError={() => setLogoOk(false)}
                    />
                  ) : (
                    <span className="text-xs font-black tracking-tight text-white">CINF</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-100 ring-1 ring-white/20">{t.badge}</span>
                    {appVersion ? <span className="text-[11px] tabular-nums text-slate-400">v{appVersion}</span> : null}
                  </div>
                  <h1 className="mt-1 text-xl font-bold leading-tight tracking-tight sm:text-2xl">{appName}</h1>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-blue-100/95 sm:text-[15px]">{tagline}</p>
                </div>
              </div>
            </div>

            <div className="grid min-h-[340px] grid-cols-1 lg:min-h-[380px] lg:grid-cols-2 lg:divide-x lg:divide-slate-100">
              <section className="flex flex-col border-b border-slate-100 p-5 sm:p-7 lg:border-b-0 lg:p-10">
                <div className="mb-4 flex shrink-0 items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                    <IconShieldCheck className="h-4 w-4" />
                  </span>
                  <h2 className="text-[18px] font-semibold tracking-tight text-slate-900">{t.zoneActivationTitle}</h2>
                </div>
                <p className={`mb-5 shrink-0 text-[13px] sm:text-[14px] ${bodyCls}`}>{t.activationHint}</p>

                <div className="mt-1 space-y-4 rounded-lg border border-slate-100 bg-slate-50/90 p-5 ring-1 ring-slate-900/[0.03]">
                  <div>
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.deviceLabel}</div>
                    <div className="flex gap-2">
                      <div className="flex min-h-[2.25rem] min-w-0 flex-1 items-center overflow-x-auto overflow-y-hidden rounded-md border border-slate-200 bg-white px-2.5 py-2 font-mono text-xs text-slate-800 shadow-sm">
                        <span className="whitespace-nowrap">{machineId || '—'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={copyId}
                        disabled={!machineId}
                        className="inline-flex min-h-[2.25rem] min-w-[6.5rem] shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                      >
                        {copied ? t.copied : t.copy}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.licenseLabel}</div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t.placeholder}
                        spellCheck={false}
                        autoComplete="off"
                        lang="en"
                        style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
                        className="min-h-[2.25rem] min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-2 font-mono text-sm text-slate-800 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25"
                      />
                      <button
                        type="button"
                        onClick={activate}
                        disabled={busy || !input.trim()}
                        className="inline-flex min-h-[2.25rem] min-w-[6.5rem] shrink-0 items-center justify-center rounded-md bg-gradient-to-b from-blue-600 to-blue-700 px-5 text-sm font-semibold text-white shadow-sm hover:from-blue-500 hover:to-blue-600 disabled:opacity-50"
                      >
                        {busy ? t.activating : t.activate}
                      </button>
                    </div>
                  </div>
                </div>

                {error ? <div className="mt-3 shrink-0 rounded-md border border-red-200 bg-red-50/95 px-3 py-2.5 text-sm text-red-700">{error}</div> : null}
              </section>

              <section className="flex flex-col bg-gradient-to-b from-slate-50/95 to-slate-50 p-5 sm:p-7 lg:p-10">
                <div className="mb-4 flex shrink-0 items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                    <IconBuilding className="h-4 w-4" />
                  </span>
                  <h2 className="text-[18px] font-semibold tracking-tight text-slate-900">{t.zoneContactTitle}</h2>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border-l-[3px] border-blue-600 bg-white py-3.5 pl-4 pr-3.5 shadow-sm ring-1 ring-slate-900/[0.04]">
                    <p className="text-[15px] font-semibold leading-snug text-slate-900">{t.orgName}</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{t.orgBlurb}</p>
                  </div>

                  <p className={`text-[13px] leading-relaxed ${bodyCls}`}>{t.contactRouting}</p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className={mailCardCls}>
                      <div className="mb-0.5 flex items-center gap-1.5 text-slate-800">
                        <IconMail className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                        <span className="text-sm font-semibold">{t.mailDevLabel}</span>
                      </div>
                      <p className="mb-1.5 text-xs leading-relaxed text-slate-500">{t.mailDevHint}</p>
                      <a href="mailto:xuqianglai@outlook.com" className="break-all text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                        xuqianglai@outlook.com
                      </a>
                    </div>
                    <div className={mailCardCls}>
                      <div className="mb-0.5 flex items-center gap-1.5 text-slate-800">
                        <IconMail className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                        <span className="text-sm font-semibold">{t.mailCompanyLabel}</span>
                      </div>
                      <p className="mb-1.5 text-xs leading-relaxed text-slate-500">{t.mailCompanyHint}</p>
                      <a href="mailto:cinf@chinalco.com.cn" className="break-all text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                        cinf@chinalco.com.cn
                      </a>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <p className="shrink-0 border-t border-slate-100 bg-white px-4 py-2.5 text-center text-xs text-slate-500 sm:text-sm">
              {language === 'en' ? APP_ORG_NAME_EN : APP_ORG_NAME_ZH}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
