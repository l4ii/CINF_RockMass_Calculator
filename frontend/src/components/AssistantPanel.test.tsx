import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { AssistantProvider } from '../context/AssistantContext'
import AssistantPanel from './AssistantPanel'

const dismissedKey = 'cinf-assistant-dismissed'

function panel(pageKey: string, language: 'zh' | 'en' = 'zh') {
  return (
    <AssistantProvider pageKey={pageKey}>
      <AssistantPanel darkMode={false} language={language} onMethodSelect={() => {}} />
    </AssistantProvider>
  )
}

beforeAll(() => {
  // jsdom does not implement scrolling.
  Element.prototype.scrollIntoView = vi.fn()
})

afterAll(() => {
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
})

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})

describe('assistant dismissal', () => {
  it('hides the open conversation and stays hidden on the same page', () => {
    const { rerender } = render(panel('module:rqd'))
    fireEvent.mouseEnter(screen.getByRole('button', { name: '智能助手' }))
    expect(screen.getByPlaceholderText('输入问题…')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '关闭智能助手' }))
    expect(screen.queryByRole('button', { name: '智能助手' })).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('输入问题…')).not.toBeInTheDocument()
    expect(sessionStorage.getItem(dismissedKey)).toBe('1')

    rerender(panel('module:rqd', 'en'))
    expect(screen.queryByRole('button', { name: 'Assistant' })).not.toBeInTheDocument()
  })

  it('restores a collapsed, reopenable assistant on another page without losing the draft', () => {
    const { rerender } = render(panel('module:rqd'))
    fireEvent.mouseEnter(screen.getByRole('button', { name: '智能助手' }))
    fireEvent.change(screen.getByPlaceholderText('输入问题…'), { target: { value: '岩体分级问题' } })
    fireEvent.click(screen.getByRole('button', { name: '关闭智能助手' }))

    rerender(panel('module:bq'))
    expect(screen.getByRole('button', { name: '智能助手' })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('输入问题…')).not.toBeInTheDocument()
    expect(sessionStorage.getItem(dismissedKey)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '智能助手' }))
    expect(screen.getByPlaceholderText('输入问题…')).toHaveValue('岩体分级问题')
  })

  it('remembers dismissal when remounted and restores after navigation', () => {
    sessionStorage.setItem(dismissedKey, '1')
    const { rerender } = render(panel('settings'))
    expect(screen.queryByRole('button', { name: '智能助手' })).not.toBeInTheDocument()
    rerender(panel('about:cinf'))
    fireEvent.focus(screen.getByRole('button', { name: '智能助手' }))
    expect(screen.getByPlaceholderText('输入问题…')).toBeInTheDocument()
  })

  it('restores the assistant through actual sidebar navigation between classification methods', () => {
    render(<App />)
    const sidebar = within(screen.getByTestId('sidebar'))
    fireEvent.click(screen.getByRole('button', { name: '关闭智能助手' }))
    fireEvent.click(sidebar.getByRole('button', { name: /RQD/ }))
    expect(screen.getByRole('button', { name: '智能助手' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '关闭智能助手' }))
    fireEvent.click(sidebar.getByRole('button', { name: /RQD/ }))
    expect(screen.queryByRole('button', { name: '智能助手' })).not.toBeInTheDocument()
    fireEvent.click(sidebar.getByRole('button', { name: /BQ/ }))
    fireEvent.click(screen.getByRole('button', { name: '智能助手' }))
    expect(screen.getByPlaceholderText('输入问题…')).toBeInTheDocument()
  })
})
