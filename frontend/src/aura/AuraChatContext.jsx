import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const AuraChatContext = createContext()
export const useAuraChat = () => useContext(AuraChatContext)

const STORAGE_KEY = 'aura-chat-history'
const SESSIONS_KEY = 'aura-chat-sessions'
const MAX_MESSAGES = 50

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function loadSessions() {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveSessions(sessions) {
  try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(-20))) }
  catch { /* ignore */ }
}

function deriveTitle(messages) {
  const firstUser = messages.find(m => m.role === 'user')
  if (!firstUser) return 'New Chat'
  const text = typeof firstUser.content === 'string' ? firstUser.content : 'Chat'
  return text.length > 50 ? text.slice(0, 47) + '...' : text
}

/* Parse SSE text buffer into individual events */
function parseSSEEvents(text) {
  const events = []
  const blocks = text.split('\n\n')
  for (const block of blocks) {
    if (!block.trim()) continue
    let eventType = 'message'
    let data = ''
    for (const line of block.split('\n')) {
      if (line.startsWith('event: ')) eventType = line.slice(7).trim()
      else if (line.startsWith('data: ')) data = line.slice(6)
    }
    if (data) {
      try { events.push({ type: eventType, data: JSON.parse(data) }) }
      catch { /* skip malformed */ }
    }
  }
  return events
}

export function AuraChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [messages, setMessages] = useState(loadFromStorage)
  const [isLoading, setIsLoading] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(() => crypto.randomUUID())
  const [chatSessions, setChatSessions] = useState(loadSessions)
  const abortRef = useRef(null)

  const sendMessage = useCallback(async (text) => {
    const currentAttachments = [...attachments]
    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      attachments: currentAttachments.length > 0
        ? currentAttachments.map(f => ({ name: f.name, size: f.size, type: f.type }))
        : null,
    }
    setMessages(prev => [...prev, userMsg])
    setAttachments([])
    setIsLoading(true)

    // Prepare a placeholder assistant message that we'll build up incrementally
    const assistantId = crypto.randomUUID()
    const assistantMsg = {
      id: assistantId,
      role: 'assistant',
      content: [],
      timestamp: new Date().toISOString(),
      suggestedFollowups: null,
      _streaming: true,
    }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const controller = new AbortController()
      abortRef.current = controller

      const res = await fetch('/api/aura/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          attachments: currentAttachments.map(f => f.name),
        }),
        signal: controller.signal,
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete events (separated by double newlines)
        const lastDoubleNewline = buffer.lastIndexOf('\n\n')
        if (lastDoubleNewline === -1) continue

        const complete = buffer.slice(0, lastDoubleNewline + 2)
        buffer = buffer.slice(lastDoubleNewline + 2)

        const events = parseSSEEvents(complete)
        for (const evt of events) {
          if (evt.type === 'meta') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId
                ? { ...m, id: evt.data.message_id || m.id, timestamp: evt.data.timestamp || m.timestamp }
                : m
            ))
          } else if (evt.type === 'block') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId || m.id === evt.data?.message_id || (m._streaming && m.role === 'assistant')
                ? { ...m, content: [...m.content, evt.data] }
                : m
            ))
          } else if (evt.type === 'followups') {
            setMessages(prev => prev.map(m =>
              m._streaming && m.role === 'assistant'
                ? { ...m, suggestedFollowups: evt.data }
                : m
            ))
          } else if (evt.type === 'done') {
            setMessages(prev => prev.map(m =>
              m._streaming && m.role === 'assistant'
                ? { ...m, _streaming: false }
                : m
            ))
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          // If the streaming message has no content, replace it with error
          const last = prev[prev.length - 1]
          if (last?._streaming && last.content.length === 0) {
            return [...prev.slice(0, -1), {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: [{ type: 'text', data: 'I encountered an error processing your request. Please try again.' }],
              timestamp: new Date().toISOString(),
            }]
          }
          // Otherwise mark streaming done
          return prev.map(m => m._streaming ? { ...m, _streaming: false } : m)
        })
      }
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }, [attachments])

  // Save current session to history before switching away
  const saveCurrentSession = useCallback(() => {
    if (messages.length === 0) return
    setChatSessions(prev => {
      const filtered = prev.filter(s => s.id !== activeSessionId)
      const session = {
        id: activeSessionId,
        title: deriveTitle(messages),
        timestamp: messages[0]?.timestamp || new Date().toISOString(),
        messageCount: messages.length,
        messages: messages.filter(m => !m._streaming).slice(-MAX_MESSAGES),
        active: true,
      }
      const updated = [...filtered, session].slice(-20)
      saveSessions(updated)
      return updated
    })
  }, [messages, activeSessionId])

  const newChat = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    saveCurrentSession()
    const newId = crypto.randomUUID()
    setActiveSessionId(newId)
    setMessages([])
    setIsLoading(false)
    setAttachments([])
    localStorage.removeItem(STORAGE_KEY)
  }, [saveCurrentSession])

  const clearChat = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    setMessages([])
    setIsLoading(false)
    localStorage.removeItem(STORAGE_KEY)
    // Remove current session from history
    setChatSessions(prev => {
      const updated = prev.filter(s => s.id !== activeSessionId)
      saveSessions(updated)
      return updated
    })
  }, [activeSessionId])

  const activateSession = useCallback((sessionId) => {
    saveCurrentSession()
    setChatSessions(prev => {
      const session = prev.find(s => s.id === sessionId)
      if (!session) return prev
      setActiveSessionId(sessionId)
      setMessages(session.messages || [])
      setIsLoading(false)
      setAttachments([])
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session.messages || []))
      return prev.map(s => ({ ...s, active: s.id === sessionId }))
    })
  }, [saveCurrentSession])

  const setMessageFeedback = useCallback((messageId, feedback) => {
    // feedback: 'up' | 'down' | null (toggle off)
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, feedback: m.feedback === feedback ? null : feedback } : m
    ))
  }, [])

  const toggleOpen = useCallback(() => setIsOpen(p => !p), [])
  const toggleExpand = useCallback(() => setIsExpanded(p => !p), [])
  const toggleMenu = useCallback(() => setMenuOpen(p => !p), [])
  const addAttachment = useCallback((file) => setAttachments(p => [...p, file]), [])
  const removeAttachment = useCallback((idx) => setAttachments(p => p.filter((_, i) => i !== idx)), [])

  useEffect(() => {
    if (messages.length > 0) {
      const toSave = messages.filter(m => !m._streaming).slice(-MAX_MESSAGES)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    }
  }, [messages])

  // Update sessions list when messages change (to keep active session current)
  useEffect(() => {
    if (messages.length > 0) {
      setChatSessions(prev => {
        const updated = prev.map(s =>
          s.id === activeSessionId
            ? { ...s, title: deriveTitle(messages), messageCount: messages.length, active: true }
            : { ...s, active: false }
        )
        // If current session not in list yet, add it
        if (!updated.find(s => s.id === activeSessionId)) {
          updated.push({
            id: activeSessionId,
            title: deriveTitle(messages),
            timestamp: messages[0]?.timestamp || new Date().toISOString(),
            messageCount: messages.length,
            messages: [],
            active: true,
          })
        }
        return updated.slice(-20)
      })
    }
  }, [messages, activeSessionId])

  return (
    <AuraChatContext.Provider value={{
      isOpen, isExpanded, menuOpen, messages, isLoading, attachments,
      chatSessions, activeSessionId,
      sendMessage, clearChat, newChat, toggleOpen, toggleExpand, toggleMenu,
      addAttachment, removeAttachment, activateSession, setMessageFeedback,
    }}>
      {children}
    </AuraChatContext.Provider>
  )
}
