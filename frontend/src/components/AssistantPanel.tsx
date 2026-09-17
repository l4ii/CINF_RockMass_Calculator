import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { CLASSIFICATION_METHODS, type SelectedMethod } from '../types'
import { API_BASE_URL, API_TIMEOUT } from '../config/api'
import { useAssistantContext } from '../context/AssistantContext'
import {
  buildAssistantWelcome,
  smartInterpretationNotReadyReply,
  tryRuleBasedAssistantReply,
} from '../utils/assistantFaq'

type ChatRole = 'user' | 'assistant'

interface ChatTurn {
  id: string
  role: ChatRole
  content: string
  navigateId?: string
}

interface AssistantPanelProps {
  darkMode: boolean
  language: 'zh' | 'en'
  onMethodSelect: (method: SelectedMethod) => void
}

const NAV_RE = /\[\[ACTION:NAVIGATE:([^\]]+)]]/

function flattenCatalog(language: 'zh' | 'en'): { id: string; name: string; group: string }[] {
  const group = language === 'en' ? 'Classification' : '岩体分级'
  return CLASSIFICATION_METHODS.map((m) => ({
    id: m.id,
    name: language === 'en' ? m.nameEn : m.name,
    group,
  }))
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function stripNavigateLine(text: string): string {
  return text.replace(/\n?\[\[ACTION:NAVIGATE:[^\]]+]]\s*$/, '').trim()
}

function parseNavigateId(text: string): string | undefined {
  const m = text.match(NAV_RE)
  return m ? m[1].trim() : undefined
}

async function fetchAssistantInferenceReady(): Promise<boolean> {
  const ctrl = new AbortController()
  const t = window.setTimeout(() => ctrl.abort(), Math.min(API_TIMEOUT, 10000))
  try {
    const res = await fetch(`${API_BASE_URL}/assistant/status`, { signal: ctrl.signal })
    let data: Record<string, unknown> = {}
    try {
      data = (await res.json()) as Record<string, unknown>
    } catch {
      /* ignore */
    }
    return Boolean(data.inferenceReady)
  } catch {
    return false
  } finally {
    window.clearTimeout(t)
  }
}

const METHOD_IDS = new Set<string>(CLASSIFICATION_METHODS.map((m) => m.id))

export default function AssistantPanel({ darkMode, language, onMethodSelect }: AssistantPanelProps) {
  const {
    assistantSnapshot,
    assistantDockOpen,
    setAssistantDockOpen,
    assistantDismissed,
    dismissAssistant,
    pendingAssistantPrompt,
    clearPendingAssistantPrompt,
  } = useAssistantContext()
  const [dockHover, setDockHover] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatTurn[]>([])
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const dockRef = useRef<HTMLDivElement | null>(null)
  const hideTimerRef = useRef<number | null>(null)
  const lastPointerRef = useRef({ x: 0, y: 0 })
  const sendRef = useRef<(text?: string) => Promise<void>>(async () => {})

  const dockOpen = dockHover || assistantDockOpen

  const catalog = useMemo(() => flattenCatalog(language), [language])
  const allowedIds = useMemo(() => new Set(catalog.map((x) => x.id)), [catalog])
  const idToName = useMemo(() => new Map(catalog.map((x) => [x.id, x.name])), [catalog])

  const enrichedSnapshot = useMemo(
    () => ({
      ...assistantSnapshot,
      allowedMethodIds: Array.from(allowedIds),
      methodCatalog: catalog,
    }),
    [assistantSnapshot, allowedIds, catalog]
  )

  const surface = darkMode
    ? 'bg-gray-800 border-gray-600 text-gray-100'
    : 'bg-white border-gray-200 text-gray-900'
  const muted = darkMode ? 'text-gray-400' : 'text-gray-600'
  const inpCls = darkMode
    ? 'bg-gray-900 border-gray-600 text-gray-100 placeholder-gray-500'
    : 'bg-gray-50 border-gray-300 text-gray-900'

  useEffect(() => {
    busyRef.current = busy
  }, [busy])

  useEffect(() => {
    setMessages((prev) => {
      const WELCOME_ID = 'assistant-welcome'
      if (prev.length === 1 && prev[0].id === WELCOME_ID) {
        return [{ ...prev[0], content: buildAssistantWelcome(language) }]
      }
      return prev
    })
  }, [language])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy, dockOpen])

  const clearHideTimer = () => {
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  useEffect(() => () => clearHideTimer(), [])

  useEffect(() => {
    if (!dockOpen) return
    const track = (e: PointerEvent) => {
      lastPointerRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('pointermove', track, { capture: true })
    return () => window.removeEventListener('pointermove', track, { capture: true })
  }, [dockOpen])

  const closeDock = () => {
    setDockHover(false)
    setAssistantDockOpen(false)
  }

  const tryCloseDockAfterLeave = () => {
    clearHideTimer()
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null
      const root = dockRef.current
      if (!root) {
        closeDock()
        return
      }
      if (busyRef.current) return
      if (root.contains(document.activeElement)) return
      if (pendingAssistantPrompt) return

      const r = root.getBoundingClientRect()
      const pad = 6
      const { x, y } = lastPointerRef.current
      const ptrInside =
        x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad
      if (ptrInside) return

      let topEl: Element | null = null
      try {
        topEl = document.elementFromPoint(lastPointerRef.current.x, lastPointerRef.current.y)
      } catch {
        topEl = null
      }
      if (topEl && root.contains(topEl)) return

      closeDock()
    }, 480)
  }

  const ensureWelcome = () => {
    setMessages((prev) => {
      if (prev.length > 0) return prev
      return [{ id: 'assistant-welcome', role: 'assistant', content: buildAssistantWelcome(language) }]
    })
  }

  const onDockEnter = (ev?: Pick<React.MouseEvent<Element>, 'clientX' | 'clientY'>) => {
    clearHideTimer()
    if (ev && typeof ev.clientX === 'number' && typeof ev.clientY === 'number') {
      lastPointerRef.current = { x: ev.clientX, y: ev.clientY }
    }
    setDockHover(true)
    ensureWelcome()
  }

  useEffect(() => {
    if (!assistantDockOpen) return
    ensureWelcome()
  }, [assistantDockOpen, language])

  const onDockPointerLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const rt = e.relatedTarget
    if (rt instanceof Node && dockRef.current?.contains(rt)) return
    tryCloseDockAfterLeave()
  }

  const onDockFocusOutCapture = (e: React.FocusEvent<HTMLDivElement>) => {
    const rt = e.relatedTarget
    if (rt instanceof Node && dockRef.current?.contains(rt)) return
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (dockRef.current?.contains(document.activeElement)) return
        tryCloseDockAfterLeave()
      })
    })
  }

  const send = async (forcedText?: string) => {
    const text = (forcedText ?? input).trim()
    if (!text || busy) return
    if (!forcedText) setInput('')
    const userMsg: ChatTurn = { id: newId('u'), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setBusy(true)
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))

    const ruleReply = tryRuleBasedAssistantReply(text, language, catalog, assistantSnapshot)
    if (ruleReply) {
      const assistantId = newId('a')
      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: ruleReply }])
      setBusy(false)
      return
    }

    const inferenceReady = await fetchAssistantInferenceReady()
    if (!inferenceReady) {
      const assistantId = newId('a')
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: smartInterpretationNotReadyReply(language) },
      ])
      setBusy(false)
      return
    }

    const body: Record<string, unknown> = {
      locale: language,
      messages: history,
      snapshot: enrichedSnapshot,
      stream: true,
    }

    const assistantId = newId('a')
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }])

    try {
      const res = await fetch(`${API_BASE_URL}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const fb = smartInterpretationNotReadyReply(language)
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: fb } : m)))
        setBusy(false)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        const fb = smartInterpretationNotReadyReply(language)
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: fb } : m)))
        setBusy(false)
        return
      }

      const dec = new TextDecoder()
      let carry = ''
      let assistantContent = ''

      const updateBubble = () => {
        const navRaw = parseNavigateId(assistantContent)
        const navIdStr =
          navRaw && METHOD_IDS.has(navRaw) && allowedIds.has(navRaw) ? navRaw : undefined
        const display = stripNavigateLine(assistantContent)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: display || assistantContent, navigateId: navIdStr } : m
          )
        )
      }

      let full = ''
      let streamBackendError = false
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        carry += dec.decode(value, { stream: true })
        const lines = carry.split('\n')
        carry = lines.pop() ?? ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            const o = JSON.parse(trimmed) as { content?: string; error?: string }
            if (o.error) streamBackendError = true
            if (o.content) {
              full += o.content
              assistantContent = full
              updateBubble()
            }
          } catch {
            /* skip */
          }
        }
      }
      const tail = carry.trim()
      if (tail) {
        try {
          const o = JSON.parse(tail) as { content?: string; error?: string }
          if (o.error) streamBackendError = true
          if (o.content) {
            full += o.content
            assistantContent = full
          }
        } catch {
          /* ignore */
        }
      }

      if (streamBackendError) {
        assistantContent = smartInterpretationNotReadyReply(language)
      }

      const navRaw = parseNavigateId(assistantContent)
      const navIdStr =
        navRaw && METHOD_IDS.has(navRaw) && allowedIds.has(navRaw) ? navRaw : undefined
      const display = stripNavigateLine(assistantContent)

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: display || assistantContent, navigateId: navIdStr } : m
        )
      )

      if (!assistantContent.trim()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: smartInterpretationNotReadyReply(language) } : m
          )
        )
      }
    } catch (e: unknown) {
      if ((e as Error)?.name === 'AbortError') return
      const fb = smartInterpretationNotReadyReply(language)
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: fb } : m)))
    } finally {
      setBusy(false)
    }
  }

  sendRef.current = send

  useEffect(() => {
    if (!pendingAssistantPrompt || busy) return
    const prompt = pendingAssistantPrompt
    clearPendingAssistantPrompt()
    setInput(prompt)
    ensureWelcome()
    // 稍等一帧，让输入框先显示问题，再自动发送
    window.setTimeout(() => {
      void sendRef.current(prompt)
      setInput('')
    }, 50)
  }, [busy, clearPendingAssistantPrompt, pendingAssistantPrompt])

  const applyNavigate = (fid: string) => {
    const method = CLASSIFICATION_METHODS.find((m) => m.id === fid)
    if (method) onMethodSelect(method)
  }

  const stripLabel = language === 'en' ? 'Assistant' : '智能助手'
  const closeLabel = language === 'en' ? 'Hide assistant' : '关闭智能助手'
  const roleLabelAssistant = language === 'en' ? 'Assistant' : '助手'

  if (assistantDismissed) return null

  // 右侧间距与主区 lg:px-8 对齐，宽度与分值预览列 300px 一致
  return (
    <div className="pointer-events-none fixed right-2 top-[calc(var(--app-titlebar-height,0px)+0.375rem)] z-[60] sm:bottom-4 sm:right-6 sm:top-auto lg:right-8">
      <div
        ref={dockRef}
        className="pointer-events-auto flex w-[min(100vw-2rem,300px)] flex-col-reverse items-end gap-2 sm:flex-col"
        onMouseEnter={(e) => onDockEnter(e)}
        onMouseLeave={onDockPointerLeave}
        onFocusCapture={clearHideTimer}
        onBlurCapture={onDockFocusOutCapture}
      >
        {dockOpen && (
          <div
            className={`flex max-h-[min(82vh,680px)] w-full flex-col overflow-hidden rounded-lg border shadow-2xl ${surface}`}
          >
            <div
              className={`flex items-center border-b px-3 py-2 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
            >
              <span className="text-sm font-semibold">{stripLabel}</span>
            </div>

            <div className="thin-scroll min-h-[280px] max-h-[min(62vh,520px)] flex-1 space-y-2 overflow-y-auto px-3 py-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg px-2 py-1.5 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? darkMode
                        ? 'ml-6 bg-blue-900/50'
                        : 'ml-6 bg-blue-50'
                      : darkMode
                        ? 'mr-3 bg-gray-700/90'
                        : 'mr-3 bg-gray-100'
                  }`}
                >
                  <div className={`mb-1 text-[10px] font-semibold opacity-70 ${muted}`}>
                    {m.role === 'user' ? (language === 'en' ? 'You' : '您') : roleLabelAssistant}
                  </div>
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  {m.navigateId && METHOD_IDS.has(m.navigateId) && (
                    <button
                      type="button"
                      className="mt-2 rounded bg-blue-600 px-2 py-1 text-[11px] text-white hover:bg-blue-700"
                      onClick={() => applyNavigate(m.navigateId!)}
                    >
                      {language === 'en' ? 'Open: ' : '打开：'}
                      {idToName.get(m.navigateId) ?? m.navigateId}
                    </button>
                  )}
                </div>
              ))}
              {busy && (
                <div className={`text-xs ${muted}`}>{language === 'en' ? 'Thinking…' : '正在回复…'}</div>
              )}
              <div ref={bottomRef} />
            </div>

            <div
              className={`flex gap-2 border-t p-2 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
            >
              <input
                type="text"
                className={`min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-xs ${inpCls}`}
                placeholder={language === 'en' ? 'Ask…' : '输入问题…'}
                value={input}
                disabled={busy}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void send()
                  }
                }}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void send()}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {language === 'en' ? 'Send' : '发送'}
              </button>
            </div>
          </div>
        )}

        <div className="group relative">
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:h-14 sm:w-14 sm:rounded-full"
            title={stripLabel}
            aria-label={stripLabel}
            aria-expanded={dockOpen}
            onFocus={() => onDockEnter()}
            onClick={() => onDockEnter()}
          >
            <span className="text-base leading-none sm:text-2xl" aria-hidden>
              💬
            </span>
          </button>
          <button
            type="button"
            aria-label={closeLabel}
            title={closeLabel}
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white shadow-md ring-1 ring-white/70 transition-opacity sm:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            onClick={(event) => {
              event.stopPropagation()
              clearHideTimer()
              closeDock()
              dismissAssistant()
            }}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
