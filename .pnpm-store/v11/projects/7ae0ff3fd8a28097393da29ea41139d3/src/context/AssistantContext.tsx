import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import type { SelectedMethod } from '../types'

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
  pendingAssistantPrompt: string | null
  askAssistant: (prompt: string) => void
  clearPendingAssistantPrompt: () => void
}

const AssistantContext = createContext<AssistantContextValue | null>(null)

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [assistantSnapshot, setAssistantSnapshot] = useState<AssistantWorkspaceSnapshot | null>(null)
  const [assistantDockOpen, setAssistantDockOpen] = useState(false)
  const [pendingAssistantPrompt, setPendingAssistantPrompt] = useState<string | null>(null)

  const askAssistant = useCallback((prompt: string) => {
    const text = prompt.trim()
    if (!text) return
    setPendingAssistantPrompt(text)
    setAssistantDockOpen(true)
  }, [])

  const clearPendingAssistantPrompt = useCallback(() => {
    setPendingAssistantPrompt(null)
  }, [])

  const value = useMemo(
    () => ({
      assistantSnapshot,
      setAssistantSnapshot,
      assistantDockOpen,
      setAssistantDockOpen,
      pendingAssistantPrompt,
      askAssistant,
      clearPendingAssistantPrompt,
    }),
    [
      askAssistant,
      assistantDockOpen,
      assistantSnapshot,
      clearPendingAssistantPrompt,
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
