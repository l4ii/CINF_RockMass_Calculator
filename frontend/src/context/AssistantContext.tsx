import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import type { SelectedMethod } from '../types'

const ASSISTANT_DISMISSED_KEY = 'cinf-assistant-dismissed'

function readAssistantDismissed(): boolean {
  try {
    return sessionStorage.getItem(ASSISTANT_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

/** 供助手后端注入的软件状态（MainContent 持续更新） */
export type AssistantWorkspaceSnapshot = {
  currentView: 'module' | 'about' | 'settings'
  aboutDepartment: string | null
  language: 'zh' | 'en'
  selectedMethod: Pick<SelectedMethod, 'id' | 'name' | 'nameEn'> | null
}

type AssistantContextValue = {
  assistantSnapshot: AssistantWorkspaceSnapshot | null
  setAssistantSnapshot: Dispatch<SetStateAction<AssistantWorkspaceSnapshot | null>>
  assistantDockOpen: boolean
  setAssistantDockOpen: Dispatch<SetStateAction<boolean>>
  assistantDismissed: boolean
  dismissAssistant: () => void
  pendingAssistantPrompt: string | null
  askAssistant: (prompt: string) => void
  clearPendingAssistantPrompt: () => void
}

const AssistantContext = createContext<AssistantContextValue | null>(null)

export function AssistantProvider({ children, pageKey }: { children: ReactNode; pageKey?: string }) {
  const [assistantSnapshot, setAssistantSnapshot] = useState<AssistantWorkspaceSnapshot | null>(null)
  const [assistantDockOpen, setAssistantDockOpen] = useState(false)
  const [assistantDismissed, setAssistantDismissed] = useState(readAssistantDismissed)
  const [pendingAssistantPrompt, setPendingAssistantPrompt] = useState<string | null>(null)
  const lastPageKeyRef = useRef(pageKey)

  const dismissAssistant = useCallback(() => {
    setAssistantDismissed(true)
    setAssistantDockOpen(false)
    setPendingAssistantPrompt(null)
    try {
      sessionStorage.setItem(ASSISTANT_DISMISSED_KEY, '1')
    } catch {
      /* Storage may be unavailable; keep the in-memory state. */
    }
  }, [])

  useEffect(() => {
    if (pageKey === lastPageKeyRef.current) return
    lastPageKeyRef.current = pageKey
    setAssistantDismissed(false)
    setAssistantDockOpen(false)
    try {
      sessionStorage.removeItem(ASSISTANT_DISMISSED_KEY)
    } catch {
      /* Storage may be unavailable; keep the in-memory state. */
    }
  }, [pageKey])

  const askAssistant = useCallback((prompt: string) => {
    const text = prompt.trim()
    if (!text || assistantDismissed) return
    setPendingAssistantPrompt(text)
    setAssistantDockOpen(true)
  }, [assistantDismissed])

  const clearPendingAssistantPrompt = useCallback(() => {
    setPendingAssistantPrompt(null)
  }, [])

  const value = useMemo(
    () => ({
      assistantSnapshot,
      setAssistantSnapshot,
      assistantDockOpen,
      setAssistantDockOpen,
      assistantDismissed,
      dismissAssistant,
      pendingAssistantPrompt,
      askAssistant,
      clearPendingAssistantPrompt,
    }),
    [
      askAssistant,
      assistantDockOpen,
      assistantSnapshot,
      assistantDismissed,
      clearPendingAssistantPrompt,
      dismissAssistant,
      pendingAssistantPrompt,
    ]
  )

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>
}

export function useAssistantContext(): AssistantContextValue {
  const ctx = useContext(AssistantContext)
  if (!ctx) throw new Error('useAssistantContext must be used within AssistantProvider')
  return ctx
}

export function useAssistantSnapshotOptional(): {
  setAssistantSnapshot: Dispatch<SetStateAction<AssistantWorkspaceSnapshot | null>>
} {
  const ctx = useContext(AssistantContext)
  return {
    setAssistantSnapshot: ctx?.setAssistantSnapshot ?? (() => undefined),
  }
}
